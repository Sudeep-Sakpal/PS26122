"use client";

import { useRef, useState } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import { buildIntakeExtraction, type IntakeExtraction } from "@/lib/schedule-data";
import { cn, sleep } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { FileDropzone } from "@/components/intake/FileDropzone";
import { ProcessingSteps } from "@/components/intake/ProcessingSteps";
import { ExtractionResult } from "@/components/intake/ExtractionResult";
import { MatchResult } from "@/components/intake/MatchResult";
import { DependencyConsequence } from "@/components/intake/DependencyConsequence";
import { CheckCircleIcon } from "@/components/icons";

const STEP_DURATIONS = [700, 950, 800, 900, 1050, 800];

type Phase = "idle" | "processing" | "done";

export function IntakeWorkbench() {
  const { projects, selectedProject } = useProjectContext();
  const focusProject = selectedProject ?? projects[0];

  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<IntakeExtraction | null>(null);
  const cancelledRef = useRef(false);

  const canProcess = phase === "idle" && !!scheduleFile && !!reportFile;

  async function startProcessing() {
    if (!scheduleFile || !reportFile) return;
    cancelledRef.current = false;
    setResult(null);
    setPhase("processing");
    setStepIndex(0);

    for (let i = 0; i < STEP_DURATIONS.length; i++) {
      await sleep(STEP_DURATIONS[i]);
      if (cancelledRef.current) return;
      if (i < STEP_DURATIONS.length - 1) setStepIndex(i + 1);
    }

    setResult(buildIntakeExtraction(focusProject.id));
    setPhase("done");
  }

  function reset() {
    cancelledRef.current = true;
    setScheduleFile(null);
    setReportFile(null);
    setPhase("idle");
    setStepIndex(0);
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>New submission</CardTitle>
            <CardDescription>
              Upload {focusProject.name}&apos;s schedule and a site execution
              report — the linking layer matches the report to the right
              activity automatically.
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
              disabled={phase !== "idle"}
              onSelect={setScheduleFile}
              onClear={() => setScheduleFile(null)}
            />
            <FileDropzone
              label="Site execution report"
              hint="PDF, up to 10 MB"
              accept=".pdf"
              file={reportFile}
              disabled={phase !== "idle"}
              onSelect={setReportFile}
              onClear={() => setReportFile(null)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Simulated pipeline — no files leave your browser.
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

      {phase !== "idle" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                {phase === "done" ? "Processing complete" : "Processing"}
              </CardTitle>
              <CardDescription>
                {phase === "done"
                  ? "Every stage finished — results below."
                  : "Running the schedule-linking pipeline on your submission."}
              </CardDescription>
            </div>
            {phase === "done" && (
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
            )}
          </CardHeader>
          <CardContent>
            <ProcessingSteps currentIndex={stepIndex} complete={phase === "done"} />
          </CardContent>
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
              <ExtractionResult
                activity={result.activity}
                reportDate={result.reportDate}
                reportReason={result.reportReason}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Schedule match</CardTitle>
                <CardDescription>
                  Linked activity, confidence, and planned vs. actual
                  comparison.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <MatchResult activity={result.activity} confidence={result.confidence} />
            </CardContent>
          </Card>

          {result.downstream.length > 1 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Downstream consequence</CardTitle>
                  <CardDescription>
                    How this update ripples through dependent stages.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <DependencyConsequence chain={result.downstream} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
