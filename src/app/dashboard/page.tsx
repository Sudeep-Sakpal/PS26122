"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { risks } from "@/lib/mock-data";
import { fetchProjectDashboard, type ProjectDashboard } from "@/lib/api/dashboard";
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
import { AlertsPanel, type CascadeRisk } from "@/components/dashboard/AlertsPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, Skeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { projects, activities, selectedProjectId, selectedProject } =
    useProjectContext();
  const focusProject = selectedProject ?? projects[0];
  const focusProjectId = focusProject?.id ?? null;

  // I1's real per-project activities — still the source for the schedule
  // chain (it carries `dependsOn`, which the dashboard's own activity
  // summaries don't) so the chain visualization/table keep working exactly
  // as I1 left them.
  const chain = useMemo(
    () =>
      focusProjectId
        ? activities
            .filter((a) => a.projectId === focusProjectId)
            .sort((a, b) => a.sequence - b.sequence)
        : [],
    [activities, focusProjectId]
  );
  // Mock risk register — projectId-keyed to mock projects, so this is
  // naturally empty for the real backend project until I5.
  const projectRisks = useMemo(
    () => (focusProjectId ? risks.filter((r) => r.projectId === focusProjectId) : []),
    [focusProjectId]
  );

  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!focusProjectId) {
        setDashboard(null);
        setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);
      setDashboardError(null);
      // Clear the previous project's numbers immediately so a project
      // switch never leaves the old project's KPIs/risks on screen while
      // the new one loads.
      setDashboard(null);

      try {
        const data = await fetchProjectDashboard(focusProjectId);
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) {
          setDashboardError(
            err instanceof Error ? err.message : "Failed to load the dashboard."
          );
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [focusProjectId, reloadToken]);

  // B4's risk records don't carry `delayDays` (a B1 schedule field) — it's
  // resolved here from the same real chain the schedule visual already uses.
  const cascadeRisks: CascadeRisk[] = useMemo(
    () =>
      (dashboard?.risks ?? []).map((r) => ({
        id: r.id,
        triggerId: r.triggerId,
        triggerName: r.triggerName,
        triggerDelayDays: chain.find((a) => a.id === r.triggerId)?.delayDays ?? 0,
        reason: r.reason,
        severity: r.severity,
        confidence: r.confidence,
      })),
    [dashboard, chain]
  );

  if (!focusProject) {
    return (
      <Card>
        <EmptyState
          title="No projects yet"
          description="Create a project in the backend to see its command center here."
        />
      </Card>
    );
  }

  const summary = dashboard?.summary ?? null;
  const plannedProgress = summary?.plannedProgress ?? 0;
  const actualProgress = summary?.actualProgress ?? null;
  const variance = summary?.variance ?? null;
  const maxDelay = Math.max(0, ...chain.map((a) => a.delayDays));

  const varianceTone =
    variance === null
      ? "neutral"
      : variance >= 0
        ? "success"
        : variance >= -10
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
            {dashboard ? (
              <PlannedActualBar
                planned={plannedProgress}
                actual={actualProgress ?? 0}
                size="lg"
                showLabels
              />
            ) : (
              <Skeleton className="h-8 w-full" />
            )}
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

      {dashboardError ? (
        <Card>
          <ErrorState
            title="Couldn't load the dashboard"
            description={dashboardError}
            onRetry={() => setReloadToken((t) => t + 1)}
          />
        </Card>
      ) : dashboardLoading || !dashboard ? (
        <Card>
          <LoadingState />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Planned progress"
              value={`${plannedProgress}%`}
              hint="Critical path, to date"
              tone="neutral"
            />
            <StatCard
              label="Actual progress"
              value={actualProgress !== null ? `${actualProgress}%` : "—"}
              hint={actualProgress !== null ? "Reported from field" : "No reports linked yet"}
              tone="info"
            />
            <StatCard
              label="Schedule variance"
              value={
                variance !== null
                  ? `${variance > 0 ? "+" : ""}${variance}%`
                  : "—"
              }
              hint={maxDelay > 0 ? `${maxDelay}d slip on critical path` : "On schedule"}
              tone={varianceTone}
            />
            <StatCard
              label="Delayed stages"
              value={dashboard.summary.delayedActivities}
              hint={`of ${dashboard.summary.totalActivities} tracked`}
              tone="danger"
            />
            <StatCard
              label="At-risk stages"
              value={dashboard.summary.atRiskActivities}
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
              <AlertsPanel scheduleRisks={cascadeRisks} risks={projectRisks} />
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
              <ExecutionFeed updates={dashboard.recentUpdates} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
