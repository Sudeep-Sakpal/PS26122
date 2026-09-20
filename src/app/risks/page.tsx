"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { projects, risks } from "@/lib/mock-data";
import { fetchProjectRisks, type DependencyRisk } from "@/lib/api/risks";
import type { RiskStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import {
  RiskLikelihoodBadge,
  RiskSeverityBadge,
  RiskStatusBadge,
} from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { RisksIcon } from "@/components/icons";
import { ScheduleRiskAnalysis } from "@/components/risks/ScheduleRiskAnalysis";
import { cn, formatDate } from "@/lib/utils";

const filters: Array<{ label: string; value: RiskStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Mitigating", value: "mitigating" },
  { label: "Monitoring", value: "monitoring" },
  { label: "Closed", value: "closed" },
];

export default function RisksPage() {
  const {
    projects: realProjects,
    activities,
    selectedProjectId,
  } = useProjectContext();
  const [filter, setFilter] = useState<RiskStatus | "all">("all");

  // Manually-tracked risk register (category/likelihood/owner/due date) —
  // B4 has no concept matching this at all, so it stays on mock data,
  // naturally empty for real projects since mock risk.projectId values
  // never match a real Mongo id.
  const scoped = useMemo(
    () =>
      selectedProjectId === ALL_PROJECTS_ID
        ? risks
        : risks.filter((r) => r.projectId === selectedProjectId),
    [selectedProjectId]
  );

  const filtered = useMemo(
    () => (filter === "all" ? scoped : scoped.filter((r) => r.status === filter)),
    [scoped, filter]
  );

  const critical = scoped.filter((r) => r.severity === "critical").length;
  const openCount = scoped.filter(
    (r) => r.status === "open" || r.status === "mitigating"
  ).length;

  const projectCode = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

  // Real B4 dependency risks (GET /projects/:id/risks).
  const [scheduleRisks, setScheduleRisks] = useState<DependencyRisk[]>([]);
  const [riskLoading, setRiskLoading] = useState(true);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setRiskLoading(true);
      setRiskError(null);
      // Clear the previous project's risks immediately so a project
      // switch never leaves stale risk cards on screen while the new
      // project's risks load.
      setScheduleRisks([]);

      try {
        const data =
          selectedProjectId === ALL_PROJECTS_ID
            ? (await Promise.all(realProjects.map((p) => fetchProjectRisks(p.id)))).flat()
            : await fetchProjectRisks(selectedProjectId);
        if (!cancelled) setScheduleRisks(data);
      } catch (err) {
        if (!cancelled) {
          setRiskError(err instanceof Error ? err.message : "Failed to load schedule risks.");
        }
      } finally {
        if (!cancelled) setRiskLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, realProjects, reloadToken]);

  const activityById = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities]
  );

  return (
    <div>
      <PageHeader
        title="Risks"
        description="What happened, which activities it affects, and what it could delay next."
      />

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Schedule risk analysis
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Risks detected directly from delayed schedule activities, with the
          downstream activities each one threatens.
        </p>
      </div>

      <div className="mb-8">
        {riskError ? (
          <Card>
            <ErrorState
              title="Couldn't load schedule risks"
              description={riskError}
              onRetry={() => setReloadToken((t) => t + 1)}
            />
          </Card>
        ) : riskLoading ? (
          <Card>
            <LoadingState />
          </Card>
        ) : (
          <ScheduleRiskAnalysis risks={scheduleRisks} activityById={activityById} />
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Risk register
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Manually tracked risks with severity, likelihood, and ownership.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total risks in scope" value={scoped.length} tone="neutral" />
        <StatCard
          label="Open or mitigating"
          value={openCount}
          tone="warning"
          icon={<RisksIcon className="h-[18px] w-[18px]" />}
        />
        <StatCard label="Critical severity" value={critical} tone="danger" />
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
            title="No risks match this filter"
            description="Try a different status filter or project scope."
          />
        ) : (
          <Table>
            <THead>
              <Th>Risk</Th>
              <Th>Project</Th>
              <Th>Category</Th>
              <Th>Severity</Th>
              <Th>Likelihood</Th>
              <Th>Status</Th>
              <Th>Owner</Th>
              <Th>Due</Th>
            </THead>
            <TBody>
              {filtered.map((risk) => (
                <Tr key={risk.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-800">{risk.title}</p>
                      <p className="font-mono text-xs text-slate-400">
                        {risk.code}
                      </p>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {projectCode(risk.projectId)}
                  </Td>
                  <Td className="text-slate-500">{risk.category}</Td>
                  <Td>
                    <RiskSeverityBadge severity={risk.severity} />
                  </Td>
                  <Td>
                    <RiskLikelihoodBadge likelihood={risk.likelihood} />
                  </Td>
                  <Td>
                    <RiskStatusBadge status={risk.status} />
                  </Td>
                  <Td className="text-slate-600">{risk.owner}</Td>
                  <Td className="text-xs text-slate-500">
                    {risk.dueDate ? formatDate(risk.dueDate) : "—"}
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
