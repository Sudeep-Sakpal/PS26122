"use client";

import { useMemo, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { projects, risks } from "@/lib/mock-data";
import { getScheduleRisks } from "@/lib/schedule-data";
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
  const { selectedProjectId } = useProjectContext();
  const [filter, setFilter] = useState<RiskStatus | "all">("all");

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

  const scheduleRisks = useMemo(
    () =>
      getScheduleRisks(
        selectedProjectId === ALL_PROJECTS_ID ? undefined : selectedProjectId
      ),
    [selectedProjectId]
  );

  const projectCode = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.code ?? "—";

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
        <ScheduleRiskAnalysis risks={scheduleRisks} />
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
