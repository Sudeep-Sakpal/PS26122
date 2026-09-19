"use client";

import { useMemo, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { activities, projects } from "@/lib/mock-data";
import type { ActivityStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatDate } from "@/lib/utils";

const filters: Array<{ label: string; value: ActivityStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in-progress" },
  { label: "Not Started", value: "not-started" },
  { label: "Delayed", value: "delayed" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
];

export default function ActivitiesPage() {
  const { selectedProjectId } = useProjectContext();
  const [filter, setFilter] = useState<ActivityStatus | "all">("all");

  const scoped = useMemo(
    () =>
      selectedProjectId === ALL_PROJECTS_ID
        ? activities
        : activities.filter((a) => a.projectId === selectedProjectId),
    [selectedProjectId]
  );

  const filtered = useMemo(
    () =>
      filter === "all" ? scoped : scoped.filter((a) => a.status === filter),
    [scoped, filter]
  );

  const projectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

  return (
    <div>
      <PageHeader
        title="Activities"
        description="Schedule activities linked to submitted field data, grouped by execution status."
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
            title="No activities match this filter"
            description="Try a different status filter or project scope."
          />
        ) : (
          <Table>
            <THead>
              <Th>Activity</Th>
              <Th>Project</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th className="w-44">Progress</Th>
              <Th>Planned window</Th>
              <Th>Linked records</Th>
            </THead>
            <TBody>
              {filtered.map((activity) => (
                <Tr key={activity.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-800">
                        {activity.name}
                      </p>
                      <p className="font-mono text-xs text-slate-400">
                        {activity.code} · WBS {activity.wbsPath}
                      </p>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {projectName(activity.projectId)}
                  </Td>
                  <Td className="text-slate-600">{activity.owner}</Td>
                  <Td>
                    <ActivityStatusBadge status={activity.status} />
                  </Td>
                  <Td>
                    <ProgressBar value={activity.progress} />
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatDate(activity.plannedStart)} –{" "}
                    {formatDate(activity.plannedEnd)}
                  </Td>
                  <Td className="text-center text-slate-600">
                    {activity.linkedRecords}
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
