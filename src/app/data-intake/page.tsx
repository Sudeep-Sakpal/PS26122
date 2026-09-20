"use client";

import { useEffect, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { fetchReports, type Report, type ReportStatus } from "@/lib/api/reports";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge, type Tone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableLoadingState } from "@/components/ui/LoadingState";
import { IntakeIcon } from "@/components/icons";
import { IntakeWorkbench } from "@/components/intake/IntakeWorkbench";
import { cn, formatDate, formatFileSize } from "@/lib/utils";

const filters: Array<{ label: string; value: ReportStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Processed", value: "processed" },
  { label: "No Data", value: "no-data" },
  { label: "Failed", value: "failed" },
];

const reportStatusTone: Record<ReportStatus, Tone> = {
  processed: "success",
  "no-data": "warning",
  failed: "danger",
};

function reportStatusLabel(status: ReportStatus) {
  return status === "no-data" ? "No Data" : status[0].toUpperCase() + status.slice(1);
}

export default function DataIntakePage() {
  const { projects, selectedProjectId } = useProjectContext();
  const [filter, setFilter] = useState<ReportStatus | "all">("all");

  const [reports, setReports] = useState<Report[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setHistoryLoading(true);
      setHistoryError(null);
      // Clear the previous project's history immediately so a project
      // switch never leaves stale reports on screen while the new
      // project's history loads.
      setReports([]);

      try {
        const data =
          selectedProjectId === ALL_PROJECTS_ID
            ? (await Promise.all(projects.map((p) => fetchReports(p.id)))).flat()
            : await fetchReports(selectedProjectId);
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err instanceof Error ? err.message : "Failed to load report history."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, projects, reloadToken]);

  const refetchHistory = () => setReloadToken((t) => t + 1);

  const filtered =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const projectCode = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

  return (
    <div>
      <PageHeader
        title="Data Intake"
        description="Upload field data and let the schedule-linking layer match it to your project's execution plan."
      />

      <IntakeWorkbench onUploaded={refetchHistory} />

      <div className="mb-4 mt-8">
        <h3 className="text-sm font-semibold text-slate-900">
          Submission history
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Reports uploaded through the form above, with their extraction
          status.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {historyError ? (
          <ErrorState
            title="Couldn't load report history"
            description={historyError}
            onRetry={refetchHistory}
          />
        ) : historyLoading ? (
          <TableLoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<IntakeIcon className="h-5 w-5" />}
            title="No reports match this filter"
            description="Try a different status filter, or upload a report above."
          />
        ) : (
          <Table>
            <THead>
              <Th>File</Th>
              <Th>Project</Th>
              <Th>Type</Th>
              <Th>Extracted activity</Th>
              <Th>Status</Th>
              <Th>Uploaded</Th>
              <Th>Size</Th>
            </THead>
            <TBody>
              {filtered.map((report) => (
                <Tr key={report.id}>
                  <Td className="font-medium text-slate-800">
                    {report.fileName}
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {projectCode(report.projectId)}
                  </Td>
                  <Td className="text-xs uppercase text-slate-500">
                    {report.fileType}
                  </Td>
                  <Td className="text-slate-600">
                    {report.activitiesExtracted.length > 0
                      ? report.activitiesExtracted.join(", ")
                      : "—"}
                  </Td>
                  <Td>
                    <Badge tone={reportStatusTone[report.status]}>
                      {reportStatusLabel(report.status)}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatDate(report.uploadedAt)}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatFileSize(Math.round(report.sizeBytes / 1024))}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
