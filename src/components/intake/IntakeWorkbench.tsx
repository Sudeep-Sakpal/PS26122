"use client";

import { useRef, useState } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import { uploadReport, type UploadReportResult } from "@/lib/api/reports";
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
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [result, setResult] = useState<UploadReportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const canProcess = phase === "idle" && !!reportFile && !fileError;

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
    setPhase("processing");
    setStepIndex(0);
    setDoneCount(null);

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
      // "Reading document" and "Extracting information" always ran.
      // "Identifying activity" only genuinely happened if extraction
      // actually produced an execution update to report on. Schedule
      // linking, comparison, and risk detection are never performed by
      // this endpoint, so those steps are deliberately left pending.
      setDoneCount(uploadResult.executionUpdates.length > 0 ? 3 : 2);
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

  function reset() {
    cancelledRef.current = true;
    setScheduleFile(null);
    setReportFile(null);
    setFileError(null);
    setPhase("idle");
    setStepIndex(0);
    setDoneCount(null);
    setResult(null);
    setUploadError(null);
  }

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
                    Linking this update to a schedule activity happens in a
                    later step.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Not yet linked to a schedule activity"
                  description="Schedule matching runs as a separate step after ingestion."
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
