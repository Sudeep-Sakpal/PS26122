"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { intakeRecords, intakeSourceLabel, projects } from "@/lib/mock-data";
import { getScheduleActivity } from "@/lib/schedule-data";
import type { IntakeStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { IntakeStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IntakeIcon } from "@/components/icons";
import { IntakeWorkbench } from "@/components/intake/IntakeWorkbench";
import { cn, formatDate, formatFileSize } from "@/lib/utils";

const filters: Array<{ label: string; value: IntakeStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending Review", value: "pending-review" },
  { label: "Linked", value: "linked" },
  { label: "Flagged", value: "flagged" },
  { label: "Processed", value: "processed" },
];

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

  return (
    <div>
      <PageHeader
        title="Data Intake"
        description="Upload field data and let the schedule-linking layer match it to your project's execution plan."
      />

      <IntakeWorkbench />

      <div className="mb-4 mt-8">
        <h3 className="text-sm font-semibold text-slate-900">
          Submission history
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Field data captured from site reports, drone surveys, sensors, and
          manual submissions.
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
                    {intakeSourceLabel[record.source]}
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
                  <Td className="font-mono text-xs">
                    {(() => {
                      const linked = record.linkedActivityId
                        ? getScheduleActivity(record.linkedActivityId)
                        : undefined;
                      return linked ? (
                        <Link
                          href={`/activities/${linked.id}`}
                          className="text-sky-600 hover:text-sky-700"
                        >
                          {linked.code}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Unlinked</span>
                      );
                    })()}
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
