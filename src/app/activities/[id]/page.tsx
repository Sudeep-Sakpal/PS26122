import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, risks } from "@/lib/mock-data";
import { getScheduleActivity, getScheduleForProject } from "@/lib/schedule-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ActivityStatusBadge, RiskSeverityBadge } from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = getScheduleActivity(id);
  if (!activity) notFound();

  const project = projects.find((p) => p.id === activity.projectId);
  const chain = getScheduleForProject(activity.projectId);
  const byId = new Map(chain.map((a) => [a.id, a]));

  const predecessors = activity.dependsOn
    .map((depId) => byId.get(depId))
    .filter(Boolean);
  const successors = chain.filter((a) => a.dependsOn.includes(activity.id));
  const varianceValue = activity.actual - activity.planned;
  const projectRisks = risks.filter(
    (r) => r.projectId === activity.projectId && r.status !== "closed"
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-700">
          Dashboard
        </Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-slate-700">{activity.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {activity.name}
            </h2>
            <ActivityStatusBadge status={activity.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-mono text-xs text-slate-400">
              {activity.code}
            </span>{" "}
            · Stage {activity.sequence} of {chain.length} ·{" "}
            {project ? (
              <Link href="/risks" className="hover:text-slate-700">
                {project.name}
              </Link>
            ) : (
              "Unknown project"
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Planned vs. actual progress</CardTitle>
                <CardDescription>
                  Variance drives delay; delay cascades into downstream risk.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <PlannedActualBar
                planned={activity.planned}
                actual={activity.actual}
                size="lg"
                showLabels
              />
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {activity.planned}%
                  </p>
                  <p className="text-xs text-slate-500">Planned</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {activity.actual}%
                  </p>
                  <p className="text-xs text-slate-500">Actual</p>
                </div>
                <div>
                  <p
                    className={
                      "text-2xl font-semibold tabular-nums " +
                      (varianceValue >= 0
                        ? "text-emerald-600"
                        : varianceValue >= -10
                          ? "text-amber-600"
                          : "text-rose-600")
                    }
                  >
                    {varianceValue > 0 ? "+" : ""}
                    {varianceValue}%
                  </p>
                  <p className="text-xs text-slate-500">Variance</p>
                </div>
              </div>

              {activity.riskReason && (
                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {activity.status === "delayed"
                      ? `${activity.delayDays}-day slip`
                      : "Downstream risk"}
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    {activity.riskReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Execution updates</CardTitle>
                <CardDescription>
                  Field reports logged against this stage, most recent first.
                </CardDescription>
              </div>
            </CardHeader>
            {activity.updates.length === 0 ? (
              <EmptyState
                title="No updates yet"
                description="This stage hasn't started reporting field progress."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {activity.updates.map((update) => (
                  <li key={update.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {update.author}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(update.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {update.note}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Row label="Owner" value={activity.owner} />
              <Row
                label="Planned window"
                value={`${formatDate(activity.plannedStart)} – ${formatDate(
                  activity.plannedEnd
                )}`}
              />
              <Row
                label="Actual start"
                value={
                  activity.actualStart ? formatDate(activity.actualStart) : "—"
                }
              />
              <Row
                label="Delay"
                value={activity.delayDays > 0 ? `${activity.delayDays} days` : "None"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependency chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Depends on
                </p>
                {predecessors.length === 0 ? (
                  <p className="mt-1 text-slate-500">
                    No predecessor — this is the first stage.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1.5">
                    {predecessors.map(
                      (p) =>
                        p && (
                          <li key={p.id}>
                            <Link
                              href={`/activities/${p.id}`}
                              className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 hover:bg-slate-50"
                            >
                              <span className="text-slate-700">{p.name}</span>
                              <ActivityStatusBadge status={p.status} />
                            </Link>
                          </li>
                        )
                    )}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Blocks
                </p>
                {successors.length === 0 ? (
                  <p className="mt-1 text-slate-500">
                    No downstream stage depends on this one.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1.5">
                    {successors.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/activities/${s.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 hover:bg-slate-50"
                        >
                          <span className="text-slate-700">{s.name}</span>
                          <ActivityStatusBadge status={s.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project risk register</CardTitle>
            </CardHeader>
            {projectRisks.length === 0 ? (
              <EmptyState
                title="No open risks"
                description="This project has no open risks logged."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {projectRisks.slice(0, 4).map((risk) => (
                  <li key={risk.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-700">{risk.title}</p>
                      <RiskSeverityBadge severity={risk.severity} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
