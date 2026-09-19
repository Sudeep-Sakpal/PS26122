"use client";

import { useMemo } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { risks } from "@/lib/mock-data";
import { getScheduleForProject } from "@/lib/schedule-data";
import { StatCard } from "@/components/ui/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { ScheduleChainVisual } from "@/components/dashboard/ScheduleChainVisual";
import { ScheduleChainTable } from "@/components/dashboard/ScheduleChainTable";
import { ExecutionFeed } from "@/components/dashboard/ExecutionFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { projects, selectedProjectId, selectedProject } = useProjectContext();
  const focusProject = selectedProject ?? projects[0];

  const chain = useMemo(
    () => getScheduleForProject(focusProject.id),
    [focusProject.id]
  );
  const projectRisks = useMemo(
    () => risks.filter((r) => r.projectId === focusProject.id),
    [focusProject.id]
  );

  const plannedProgress = Math.round(
    chain.reduce((sum, a) => sum + a.planned, 0) / chain.length
  );
  const actualProgress = Math.round(
    chain.reduce((sum, a) => sum + a.actual, 0) / chain.length
  );
  const overallVariance = actualProgress - plannedProgress;
  const delayedCount = chain.filter((a) => a.status === "delayed").length;
  const atRiskCount = chain.filter((a) => a.status === "at-risk").length;
  const maxDelay = Math.max(0, ...chain.map((a) => a.delayDays));

  const varianceTone =
    overallVariance >= 0
      ? "success"
      : overallVariance >= -10
        ? "warning"
        : "danger";

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {focusProject.name}
              </h2>
              <ProjectStatusBadge status={focusProject.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">
              {focusProject.code} · {focusProject.location}
            </p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <div>
                <dt className="inline text-slate-400">Sector </dt>
                <dd className="inline font-medium text-slate-600">
                  {focusProject.sector}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-400">Contractor </dt>
                <dd className="inline font-medium text-slate-600">
                  {focusProject.contractor}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-400">Timeline </dt>
                <dd className="inline font-medium text-slate-600">
                  {formatDate(focusProject.startDate)} –{" "}
                  {formatDate(focusProject.endDate)}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-400">Budget utilized </dt>
                <dd className="inline font-medium text-slate-600">
                  {focusProject.budgetUtilized}%
                </dd>
              </div>
            </dl>
          </div>
          <div className="w-full max-w-xs">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              Critical path progress
            </p>
            <PlannedActualBar
              planned={plannedProgress}
              actual={actualProgress}
              size="lg"
              showLabels
            />
          </div>
        </CardContent>
      </Card>

      {selectedProjectId === ALL_PROJECTS_ID && (
        <p className="mb-4 text-xs text-slate-500">
          Showing the command center for{" "}
          <strong className="font-medium text-slate-700">
            {focusProject.name}
          </strong>{" "}
          — select a different project above to switch focus.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Planned progress"
          value={`${plannedProgress}%`}
          hint="Critical path, to date"
          tone="neutral"
        />
        <StatCard
          label="Actual progress"
          value={`${actualProgress}%`}
          hint="Reported from field"
          tone="info"
        />
        <StatCard
          label="Schedule variance"
          value={`${overallVariance > 0 ? "+" : ""}${overallVariance}%`}
          hint={maxDelay > 0 ? `${maxDelay}d slip on critical path` : "On schedule"}
          tone={varianceTone}
        />
        <StatCard
          label="Delayed stages"
          value={delayedCount}
          hint={`of ${chain.length} tracked`}
          tone="danger"
        />
        <StatCard
          label="At-risk stages"
          value={atRiskCount}
          hint="Blocked by a dependency"
          tone="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Execution chain — planned vs. actual</CardTitle>
              <CardDescription>
                Each stage depends on the one before it. A slip upstream
                cascades into risk downstream.
              </CardDescription>
            </div>
          </CardHeader>
          <ScheduleChainVisual activities={chain} />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active alerts</CardTitle>
              <CardDescription>
                Schedule cascades and open risks for this project.
              </CardDescription>
            </div>
          </CardHeader>
          <AlertsPanel activities={chain} risks={projectRisks} />
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Activity status</CardTitle>
              <CardDescription>
                Every tracked stage in this project&apos;s schedule, searchable
                and sortable.
              </CardDescription>
            </div>
          </CardHeader>
          <ScheduleChainTable activities={chain} />
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent execution updates</CardTitle>
              <CardDescription>
                Latest field reports linked to this project&apos;s schedule.
              </CardDescription>
            </div>
          </CardHeader>
          <ExecutionFeed activities={chain} />
        </Card>
      </div>
    </div>
  );
}
