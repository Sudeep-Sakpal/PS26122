"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import {
  linkExecutionUpdate,
  uploadReport,
  type UploadReportResult,
} from "@/lib/api/reports";
import { fetchActivityComparison, type ActivityComparison } from "@/lib/api/activities";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FileDropzone } from "@/components/intake/FileDropzone";
import { ProcessingSteps } from "@/components/intake/ProcessingSteps";
import { ExtractionResult } from "@/components/intake/ExtractionResult";
import { MatchResult } from "@/components/intake/MatchResult";
import { CheckCircleIcon } from "@/components/icons";

const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".xlsx"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function validateReportFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Only .txt, .pdf, or .xlsx files are supported.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is larger than the 10 MB limit.";
  }
  return null;
}

type Phase = "idle" | "processing" | "done" | "error";

// Per-execution-update schedule-linking state, driven entirely by real
// B3 responses. "unmatched" is a genuine backend outcome (no confident
// match), never an error.
type UpdateMatchState =
  | { kind: "unlinked" }
  | { kind: "linking" }
  | {
      kind: "matched";
      activityId: string;
      activityCode: string;
      activityName: string;
      confidence: number;
      matchMethod: string;
      comparison: ActivityComparison | null;
    }
  | { kind: "unmatched"; reason: string }
  | { kind: "link-error"; message: string };

export function IntakeWorkbench({ onUploaded }: { onUploaded?: () => void }) {
  const { projects, selectedProject } = useProjectContext();
  const focusProject = selectedProject ?? projects[0];

  // The project-schedule dropzone is kept for visual/UX parity with the
  // M5 design — schedule import is a separate real backend endpoint
  // (POST /projects/:id/schedule) that isn't part of this integration
  // step, so a file dropped here is never uploaded.
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<UploadReportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [matchStates, setMatchStates] = useState<Record<string, UpdateMatchState>>({});
  const cancelledRef = useRef(false);

  const canProcess = phase === "idle" && !!reportFile && !fileError;

  // "Reading document" and "Extracting information" always ran once the
  // upload succeeds. "Identifying activity" only genuinely happened if
  // extraction produced an update to report on. "Linking to schedule" and
  // "Comparing planned vs. actual" only advance once the user explicitly
  // runs matching and it actually succeeds — "Detecting downstream risk"
  // is never marked done here; that's I5.
  const matchStateList = Object.values(matchStates);
  const anyMatched = matchStateList.some((s) => s.kind === "matched");
  const anyComparisonLoaded = matchStateList.some(
    (s) => s.kind === "matched" && s.comparison !== null
  );
  const doneCount = !result
    ? null
    : anyComparisonLoaded
      ? 5
      : anyMatched
        ? 4
        : result.executionUpdates.length > 0
          ? 3
          : 2;

  function selectReportFile(file: File) {
    const validationError = validateReportFile(file);
    if (validationError) {
      setReportFile(null);
      setFileError(validationError);
      return;
    }
    setFileError(null);
    setReportFile(file);
  }

  async function startProcessing() {
    if (!reportFile || !focusProject) return;
    cancelledRef.current = false;
    setResult(null);
    setUploadError(null);
    setMatchStates({});
    setPhase("processing");
    setStepIndex(0);

    // Cosmetic only: both labels genuinely describe what the single
    // backend request is doing while it's in flight, but the frontend has
    // no way to observe its real progress mid-request.
    const stepTimer = setTimeout(() => {
      if (!cancelledRef.current) setStepIndex(1);
    }, 500);

    try {
      const uploadResult = await uploadReport(focusProject.id, reportFile);
      clearTimeout(stepTimer);
      if (cancelledRef.current) return;
      setResult(uploadResult);
      setMatchStates(
        Object.fromEntries(uploadResult.executionUpdates.map((u) => [u.id, { kind: "unlinked" } as UpdateMatchState]))
      );
      setPhase("done");
      onUploaded?.();
    } catch (err) {
      clearTimeout(stepTimer);
      if (cancelledRef.current) return;
      setUploadError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "The upload failed."
      );
      setPhase("error");
    }
  }

  async function initiateLink(updateId: string) {
    if (!focusProject) return;
    setMatchStates((prev) => ({ ...prev, [updateId]: { kind: "linking" } }));

    try {
      const linkResult = await linkExecutionUpdate(focusProject.id, updateId);
      const match = linkResult.match;

      if (!match.matched) {
        setMatchStates((prev) => ({
          ...prev,
          [updateId]: { kind: "unmatched", reason: match.reason },
        }));
        return;
      }

      const { activityId, activityCode, activityName, confidence, matchMethod } = match;
      setMatchStates((prev) => ({
        ...prev,
        [updateId]: {
          kind: "matched",
          activityId,
          activityCode,
          activityName,
          confidence,
          matchMethod,
          comparison: null,
        },
      }));

      try {
        const comparison = await fetchActivityComparison(focusProject.id, activityId);
        setMatchStates((prev) => {
          const current = prev[updateId];
          if (!current || current.kind !== "matched") return prev;
          return { ...prev, [updateId]: { ...current, comparison } };
        });
      } catch {
        // The link itself succeeded and is shown; the comparison section
        // is simply left out rather than shown as broken.
      }
    } catch (err) {
      setMatchStates((prev) => ({
        ...prev,
        [updateId]: {
          kind: "link-error",
          message: err instanceof Error ? err.message : "Linking failed.",
        },
      }));
    }
  }

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setScheduleFile(null);
    setReportFile(null);
    setFileError(null);
    setPhase("idle");
    setStepIndex(0);
    setResult(null);
    setUploadError(null);
    setMatchStates({});
  }, []);

  // A stale result/match-in-progress from a different project must never
  // stay actionable after switching — otherwise "Link to schedule" could
  // fire against the newly-selected project's id for an execution update
  // that belongs to the previous one.
  const activeProjectId = focusProject?.id;
  const previousProjectIdRef = useRef(activeProjectId);
  useEffect(() => {
    if (previousProjectIdRef.current !== activeProjectId) {
      previousProjectIdRef.current = activeProjectId;
      reset();
    }
  }, [activeProjectId, reset]);

  if (!focusProject) {
    return (
      <Card>
        <EmptyState
          title="No projects yet"
          description="Create a project in the backend before uploading field reports."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>New submission</CardTitle>
            <CardDescription>
              Upload a site execution report for {focusProject.name} — it&apos;s
              sent to the backend for extraction; schedule matching happens in
              a later step.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FileDropzone
              label="Project schedule"
              hint="XLSX, up to 10 MB"
              accept=".xlsx,.xls"
              file={scheduleFile}
              disabled={phase === "processing" || phase === "done"}
              onSelect={setScheduleFile}
              onClear={() => setScheduleFile(null)}
            />
            <FileDropzone
              label="Site execution report"
              hint="TXT, PDF, or XLSX, up to 10 MB"
              accept=".txt,.pdf,.xlsx"
              file={reportFile}
              disabled={phase === "processing" || phase === "done"}
              onSelect={selectReportFile}
              onClear={() => {
                setReportFile(null);
                setFileError(null);
              }}
            />
          </div>

          {fileError && (
            <p className="mt-2 text-xs text-rose-600">{fileError}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Report uploads are sent to the backend for extraction.
            </p>
            <div className="flex items-center gap-2">
              {phase !== "idle" && (
                <button
                  onClick={reset}
                  className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {phase === "done" ? "Process another record" : "Cancel"}
                </button>
              )}
              {phase === "error" && (
                <button
                  onClick={startProcessing}
                  className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Retry upload
                </button>
              )}
              {phase === "idle" && (
                <button
                  onClick={startProcessing}
                  disabled={!canProcess}
                  className={cn(
                    "rounded-md px-4 py-2 text-xs font-medium text-white transition-colors",
                    canProcess
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-300"
                  )}
                >
                  Start processing
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(phase === "processing" || phase === "done") && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {phase === "done" ? "Processing complete" : "Processing"}
              </CardTitle>
              <CardDescription>
                {phase === "done"
                  ? "Ingestion and extraction finished — result below."
                  : "Uploading and extracting your submission."}
              </CardDescription>
            </div>
            {phase === "done" && (
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <ProcessingSteps currentIndex={stepIndex} doneCount={doneCount} />
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card>
          <ErrorState
            title="Upload failed"
            description={uploadError ?? "The report could not be processed."}
            onRetry={startProcessing}
          />
        </Card>
      )}

      {phase === "done" && result && (
        <>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Extracted execution update</CardTitle>
                <CardDescription>
                  Pulled from the uploaded site report.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {result.executionUpdates.length === 0 ? (
                <EmptyState
                  title="No execution data extracted"
                  description={
                    result.warnings[0] ??
                    "The report was processed but no field-progress information could be extracted from it."
                  }
                />
              ) : (
                <div className="space-y-5">
                  {result.executionUpdates.map((update) => (
                    <ExtractionResult
                      key={update.id}
                      activityName={update.activityName}
                      activityCode={update.activityCode}
                      reportDate={update.date}
                      actualProgress={update.actualProgress}
                      reason={update.reason}
                      confidence={update.confidence}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {result.executionUpdates.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Schedule match</CardTitle>
                  <CardDescription>
                    Link each extracted update to a real schedule activity.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {result.executionUpdates.map((update) => {
                  const state = matchStates[update.id] ?? { kind: "unlinked" as const };

                  return (
                    <div key={update.id}>
                      {result.executionUpdates.length > 1 && (
                        <p className="mb-2 text-xs font-medium text-slate-500">
                          {update.activityName}
                        </p>
                      )}

                      {state.kind === "unlinked" && (
                        <EmptyState
                          title="Not yet linked to a schedule activity"
                          description="Run schedule matching to find the real activity this update describes."
                          action={
                            <button
                              onClick={() => initiateLink(update.id)}
                              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Link to schedule
                            </button>
                          }
                        />
                      )}

                      {state.kind === "linking" && (
                        <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-slate-500">
                          <span className="h-2 w-2 animate-spin rounded-full border-[1.5px] border-sky-600 border-t-transparent" />
                          Matching against the schedule…
                        </div>
                      )}

                      {state.kind === "matched" && (
                        <MatchResult
                          activityId={state.activityId}
                          activityCode={state.activityCode}
                          activityName={state.activityName}
                          confidence={state.confidence}
                          matchMethod={state.matchMethod}
                          comparison={state.comparison}
                        />
                      )}

                      {state.kind === "unmatched" && (
                        <EmptyState
                          title="No confident schedule match found"
                          description={state.reason}
                        />
                      )}

                      {state.kind === "link-error" && (
                        <ErrorState
                          title="Linking failed"
                          description={state.message}
                          onRetry={() => initiateLink(update.id)}
                        />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
