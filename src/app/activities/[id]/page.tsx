import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, risks } from "@/lib/mock-data";
import {
  getActivitySource,
  getDownstreamChain,
  getReportReason,
  getRootActivity,
  getScheduleActivity,
  getScheduleForProject,
} from "@/lib/schedule-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ActivityStatusBadge, RiskSeverityBadge } from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { DependencyConsequence } from "@/components/intake/DependencyConsequence";
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
  const fullChain = getDownstreamChain(chain, getRootActivity(chain, activity));
  const varianceValue = activity.actual - activity.planned;
  const projectRisks = risks.filter(
    (r) => r.projectId === activity.projectId && r.status !== "closed"
  );
  const reportReason = getReportReason(activity);
  const source = getActivitySource(activity);

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
                <CardTitle>Dependency &amp; risk chain</CardTitle>
                <CardDescription>
                  A slip upstream cascades into risk downstream.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DependencyConsequence chain={fullChain} currentId={activity.id} />
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
              <Row label="Activity ID" value={activity.code} mono />
              <Row label="Owner" value={activity.owner} />
              <Row label="Planned start" value={formatDate(activity.plannedStart)} />
              <Row label="Planned end" value={formatDate(activity.plannedEnd)} />
              <Row
                label="Actual start"
                value={
                  activity.actualStart ? formatDate(activity.actualStart) : "—"
                }
              />
              <Row
                label="Actual end"
                value={activity.actualEnd ? formatDate(activity.actualEnd) : "—"}
              />
              <Row
                label="Delay"
                value={activity.delayDays > 0 ? `${activity.delayDays} days` : "None"}
              />
              <Row label="Execution reason" value={reportReason} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source information</CardTitle>
            </CardHeader>
            {!source ? (
              <EmptyState
                title="No field reports yet"
                description="This stage hasn't received a site update."
              />
            ) : (
              <CardContent className="space-y-2.5 text-sm">
                <Row label="Source type" value={source.typeLabel} />
                <Row label="Reference" value={source.reference} mono />
                <Row label="Match confidence" value={`${source.confidence}%`} />
              </CardContent>
            )}
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

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={
          mono
            ? "truncate font-mono text-xs text-slate-700"
            : "text-right font-medium text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}
