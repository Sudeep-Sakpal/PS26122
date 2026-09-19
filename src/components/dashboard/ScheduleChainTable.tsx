"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActivityStatus, ScheduleActivity } from "@/types";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type SortKey = "sequence" | "planned" | "actual" | "variance" | "delayDays";

const filters: Array<{ label: string; value: ActivityStatus | "all" }> = [
  { label: "All stages", value: "all" },
  { label: "In Progress", value: "in-progress" },
  { label: "At Risk", value: "at-risk" },
  { label: "Delayed", value: "delayed" },
  { label: "Not Started", value: "not-started" },
  { label: "Completed", value: "completed" },
];

function SortableTh({
  label,
  sortableKey,
  sortKey,
  sortAsc,
  onSort,
}: {
  label: string;
  sortableKey: SortKey;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === sortableKey;
  return (
    <Th>
      <button
        onClick={() => onSort(sortableKey)}
        className={cn(
          "flex items-center gap-1 uppercase tracking-wide",
          active ? "text-slate-700" : "text-slate-500 hover:text-slate-700"
        )}
      >
        {label}
        <span className="text-[10px]">{active ? (sortAsc ? "▲" : "▼") : ""}</span>
      </button>
    </Th>
  );
}

export function ScheduleChainTable({
  activities,
}: {
  activities: ScheduleActivity[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "all">(
    "all"
  );
  const [sortKey, setSortKey] = useState<SortKey>("sequence");
  const [sortAsc, setSortAsc] = useState(true);

  const byId = new Map(activities.map((a) => [a.id, a]));

  const rows = useMemo(() => {
    const filtered = activities.filter((a) => {
      const matchesQuery =
        query.trim() === "" ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.owner.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    const sorted = filtered.slice().sort((a, b) => {
      const valueOf = (a: ScheduleActivity) =>
        sortKey === "variance" ? a.actual - a.planned : a[sortKey];
      const diff = valueOf(a) - valueOf(b);
      return sortAsc ? diff : -diff;
    });

    return sorted;
  }, [activities, query, statusFilter, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search stage, code or owner…"
            className="w-64 rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No stages match this filter"
          description="Try a different search term or status filter."
        />
      ) : (
        <Table>
          <THead>
            <SortableTh
              label="Stage"
              sortableKey="sequence"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={toggleSort}
            />
            <Th>Depends on</Th>
            <Th>Owner</Th>
            <SortableTh
              label="Planned"
              sortableKey="planned"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={toggleSort}
            />
            <SortableTh
              label="Actual"
              sortableKey="actual"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={toggleSort}
            />
            <SortableTh
              label="Variance"
              sortableKey="variance"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={toggleSort}
            />
            <Th>Status</Th>
            <SortableTh
              label="Delay"
              sortableKey="delayDays"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={toggleSort}
            />
            <Th />
          </THead>
          <TBody>
            {rows.map((activity) => {
              const varianceValue = activity.actual - activity.planned;
              const predecessor = activity.dependsOn
                .map((id) => byId.get(id)?.name)
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
    </div>
  );
}
