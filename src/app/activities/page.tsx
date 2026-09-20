"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import type { ActivityStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const filters: Array<{ label: string; value: ActivityStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in-progress" },
  { label: "At Risk", value: "at-risk" },
  { label: "Delayed", value: "delayed" },
  { label: "Not Started", value: "not-started" },
  { label: "Completed", value: "completed" },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const { projects, activities, selectedProjectId } = useProjectContext();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActivityStatus | "all">("all");

  const byId = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities]
  );

  const scoped = useMemo(
    () =>
      selectedProjectId === ALL_PROJECTS_ID
        ? activities
        : activities.filter((a) => a.projectId === selectedProjectId),
    [activities, selectedProjectId]
  );

  const filtered = useMemo(() => {
    return scoped
      .filter((a) => filter === "all" || a.status === filter)
      .filter(
        (a) =>
          query.trim() === "" ||
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.code.toLowerCase().includes(query.toLowerCase()) ||
          a.owner.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => a.projectId.localeCompare(b.projectId) || a.sequence - b.sequence);
  }, [scoped, filter, query]);

  const projectCode = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

  return (
    <div>
      <PageHeader
        title="Activities"
        description="Every schedule stage across your projects, linked to submitted field data."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search stage, code or owner…"
            className="w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="No activities match this filter"
            description="Try a different search term, status filter, or project scope."
          />
        ) : (
          <Table>
            <THead>
              <Th>Stage</Th>
              <Th>Project</Th>
              <Th>Depends on</Th>
              <Th>Owner</Th>
              <Th>Planned</Th>
              <Th>Actual</Th>
              <Th>Variance</Th>
              <Th>Status</Th>
              <Th>Delay</Th>
              <Th />
            </THead>
            <TBody>
              {filtered.map((activity) => {
                const varianceValue = activity.actual - activity.planned;
                const predecessor = activity.dependsOn
                  .map((depId) => byId.get(depId)?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <Tr
                    key={activity.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/activities/${activity.id}`)}
                  >
                    <Td>
                      <div>
                        <p className="font-medium text-slate-800">
                          {activity.name}
                        </p>
                        <p className="font-mono text-xs text-slate-400">
                          {activity.code}
                        </p>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs text-slate-500">
                      {projectCode(activity.projectId)}
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {predecessor || "—"}
                    </Td>
                    <Td className="text-slate-600">{activity.owner}</Td>
                    <Td className="tabular-nums text-slate-600">
                      {activity.planned}%
                    </Td>
                    <Td className="tabular-nums text-slate-600">
                      {activity.actual}%
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          varianceValue >= 0
                            ? "text-emerald-600"
                            : varianceValue >= -10
                              ? "text-amber-600"
                              : "text-rose-600"
                        )}
                      >
                        {varianceValue > 0 ? "+" : ""}
                        {varianceValue}%
                      </span>
                    </Td>
                    <Td>
                      <ActivityStatusBadge status={activity.status} />
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {activity.delayDays > 0 ? `${activity.delayDays} d` : "—"}
                    </Td>
                    <Td>
                      <ChevronRightIcon className="h-4 w-4 text-slate-300" />
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
