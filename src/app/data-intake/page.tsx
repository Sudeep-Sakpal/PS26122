"use client";

import { useMemo, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { activities, intakeRecords, projects } from "@/lib/mock-data";
import type { IntakeStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { IntakeStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IntakeIcon } from "@/components/icons";
import { cn, formatDate, formatFileSize } from "@/lib/utils";

const filters: Array<{ label: string; value: IntakeStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending Review", value: "pending-review" },
  { label: "Linked", value: "linked" },
  { label: "Flagged", value: "flagged" },
  { label: "Processed", value: "processed" },
];

const sourceLabel: Record<string, string> = {
  "site-report": "Site Report",
  "drone-survey": "Drone Survey",
  "sensor-feed": "Sensor Feed",
  "manual-entry": "Manual Entry",
  email: "Email",
  spreadsheet: "Spreadsheet",
};

export default function DataIntakePage() {
  const { selectedProjectId } = useProjectContext();
  const [filter, setFilter] = useState<IntakeStatus | "all">("all");

  const scoped = useMemo(
    () =>
      selectedProjectId === ALL_PROJECTS_ID
        ? intakeRecords
        : intakeRecords.filter((r) => r.projectId === selectedProjectId),
    [selectedProjectId]
  );

  const filtered = useMemo(
    () => (filter === "all" ? scoped : scoped.filter((r) => r.status === filter)),
    [scoped, filter]
  );

  const projectCode = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

  const activityLabel = (activityId?: string) =>
    activities.find((a) => a.id === activityId)?.code ?? "Unlinked";

  return (
    <div>
      <PageHeader
        title="Data Intake"
        description="Field data captured from site reports, drone surveys, sensors, and manual submissions, awaiting schedule linkage."
        actions={
          <button
            disabled
            title="Ingestion is not enabled in this prototype"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-50"
          >
            <IntakeIcon className="h-3.5 w-3.5" />
            Upload record
          </button>
        }
      />

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
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IntakeIcon className="h-5 w-5" />}
            title="No records match this filter"
            description="Try a different status filter or project scope."
          />
        ) : (
          <Table>
            <THead>
              <Th>File</Th>
              <Th>Project</Th>
              <Th>Source</Th>
              <Th>Submitted by</Th>
              <Th>Submitted on</Th>
              <Th>Size</Th>
              <Th>Status</Th>
              <Th>Linked activity</Th>
              <Th>Match confidence</Th>
            </THead>
            <TBody>
              {filtered.map((record) => (
                <Tr key={record.id}>
                  <Td className="font-medium text-slate-800">
                    {record.fileName}
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {projectCode(record.projectId)}
                  </Td>
                  <Td className="text-slate-500">
                    {sourceLabel[record.source]}
                  </Td>
                  <Td className="text-slate-600">{record.submittedBy}</Td>
                  <Td className="text-xs text-slate-500">
                    {formatDate(record.submittedOn)}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatFileSize(record.sizeKb)}
                  </Td>
                  <Td>
                    <IntakeStatusBadge status={record.status} />
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {activityLabel(record.linkedActivityId)}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {record.confidence !== undefined
                      ? `${record.confidence}%`
                      : "—"}
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
