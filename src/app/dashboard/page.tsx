"use client";

import { useMemo } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { activities, intakeRecords, risks } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { ProjectStatusBadge, RiskSeverityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivitiesIcon,
  DashboardIcon,
  IntakeIcon,
  RisksIcon,
} from "@/components/icons";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { projects, selectedProjectId, selectedProject } = useProjectContext();
  const isPortfolio = selectedProjectId === ALL_PROJECTS_ID;

  const visibleProjects = isPortfolio
    ? projects
    : projects.filter((p) => p.id === selectedProjectId);

  const scopedActivities = useMemo(
    () =>
      isPortfolio
        ? activities
        : activities.filter((a) => a.projectId === selectedProjectId),
    [isPortfolio, selectedProjectId]
  );

  const scopedRisks = useMemo(
    () =>
      isPortfolio ? risks : risks.filter((r) => r.projectId === selectedProjectId),
    [isPortfolio, selectedProjectId]
  );

  const scopedIntake = useMemo(
    () =>
      isPortfolio
        ? intakeRecords
        : intakeRecords.filter((r) => r.projectId === selectedProjectId),
    [isPortfolio, selectedProjectId]
  );

  const openRisks = scopedRisks.filter(
    (r) => r.status === "open" || r.status === "mitigating"
  ).length;
  const activeActivities = scopedActivities.filter(
    (a) => a.status === "in-progress"
  ).length;
  const pendingIntake = scopedIntake.filter(
    (r) => r.status === "pending-review" || r.status === "flagged"
  ).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          isPortfolio
            ? "Portfolio-wide execution intelligence across all active projects."
            : `Execution intelligence for ${selectedProject?.name}.`
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects in scope"
          value={visibleProjects.length}
          hint={isPortfolio ? "Across all sectors" : selectedProject?.sector}
          tone="info"
          icon={<DashboardIcon className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Active activities"
          value={activeActivities}
          hint={`${scopedActivities.length} tracked total`}
          tone="success"
          icon={<ActivitiesIcon className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Open risks"
          value={openRisks}
          hint={`${scopedRisks.length} logged total`}
          tone="danger"
          icon={<RisksIcon className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Records to review"
          value={pendingIntake}
          hint={`${scopedIntake.length} captured total`}
          tone="warning"
          icon={<IntakeIcon className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Project progress</CardTitle>
              <CardDescription>
                Physical progress against planned schedule.
              </CardDescription>
            </div>
          </CardHeader>
          {visibleProjects.length === 0 ? (
            <EmptyState
              title="No projects in scope"
              description="Select a different project from the selector above."
            />
          ) : (
            <Table>
              <THead>
                <Th>Project</Th>
                <Th>Sector</Th>
                <Th>Status</Th>
                <Th className="w-48">Progress</Th>
              </THead>
              <TBody>
                {visibleProjects.map((project) => (
                  <Tr key={project.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-slate-800">
                          {project.name}
                        </p>
                        <p className="font-mono text-xs text-slate-400">
                          {project.code}
                        </p>
                      </div>
                    </Td>
                    <Td className="text-slate-500">{project.sector}</Td>
                    <Td>
                      <ProjectStatusBadge status={project.status} />
                    </Td>
                    <Td>
                      <ProgressBar value={project.progress} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top risks</CardTitle>
              <CardDescription>By severity, most urgent first.</CardDescription>
            </div>
          </CardHeader>
          {scopedRisks.length === 0 ? (
            <EmptyState
              title="No risks logged"
              description="This scope currently has no recorded risks."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {scopedRisks
                .slice()
                .sort((a, b) => severityWeight(b) - severityWeight(a))
                .slice(0, 5)
                .map((risk) => (
                  <li key={risk.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {risk.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {risk.code} · Due {risk.dueDate ? formatDate(risk.dueDate) : "—"}
                        </p>
                      </div>
                      <RiskSeverityBadge severity={risk.severity} />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function severityWeight(risk: { severity: string }) {
  const order: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return order[risk.severity] ?? 0;
}
