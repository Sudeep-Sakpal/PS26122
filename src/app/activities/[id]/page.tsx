import Link from "next/link";
import { notFound } from "next/navigation";
import { risks } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/client";
import { fetchProjectActivities, fetchProjects } from "@/lib/api/projects";
import { fetchExecutionUpdates } from "@/lib/api/reports";
import {
  fetchActivityIntelligence,
  type ActivityComparison,
} from "@/lib/api/activities";
import { fetchActivityImpact } from "@/lib/api/risks";
import { getDownstreamChain, getRootActivity } from "@/lib/schedule-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  ActivityStatusBadge,
  DelayStatusBadge,
  DependencyRiskStatusBadge,
  RiskSeverityBadge,
} from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { DependencyConsequence } from "@/components/intake/DependencyConsequence";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

// B3 always returns a real `reason` alongside a DELAYED/AHEAD comparison
// (it comes straight from the linked report); the fallbacks below only
// ever describe a genuinely reason-less real state (no link yet, or on
// schedule), never a guess at "what probably happened".
function describeComparisonReason(comparison: ActivityComparison): string {
  if (comparison.reason) return comparison.reason;
  if (comparison.status === "NO_DATA") return "No execution update linked yet.";
  if (comparison.status === "ON_TRACK") return "On schedule — no issues reported.";
  if (comparison.status === "AHEAD") return "Ahead of schedule — no issues reported.";
  return "No reason provided in the linked report.";
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projects = await fetchProjects();

  // The route only carries an activity id, but the backend scopes activity
  // lookups by project (GET /projects/:id/activities/:activityId). Probe
  // each project's detail endpoint to find the one that owns this activity;
  // a 400/404 just means "not this project", anything else is a real
  // failure and should surface as an error state, not a false not-found.
  let ownerProjectId: string | null = null;
  let intelligence: Awaited<ReturnType<typeof fetchActivityIntelligence>> | null = null;
  for (const candidate of projects) {
    try {
      intelligence = await fetchActivityIntelligence(candidate.id, id);
      ownerProjectId = candidate.id;
      break;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
        continue;
      }
      throw err;
    }
  }
  if (!ownerProjectId || !intelligence) notFound();

  const [chain, executionUpdates, impact] = await Promise.all([
    fetchProjectActivities(ownerProjectId),
    fetchExecutionUpdates(ownerProjectId),
    fetchActivityImpact(ownerProjectId, id),
  ]);
  const activity = chain.find((a) => a.id === id);
  if (!activity) notFound();

  const project = projects.find((p) => p.id === activity.projectId);
  const fullChain = getDownstreamChain(chain, getRootActivity(chain, activity));
  const comparison = intelligence.comparison;
  const projectRisks = risks.filter(
    (r) => r.projectId === activity.projectId && r.status !== "closed"
  );
  const reasonText = describeComparisonReason(comparison);
  const activityUpdates = executionUpdates
    .filter((u) => u.linkedActivityId === activity.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

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
              <DelayStatusBadge status={comparison.status} />
            </CardHeader>
            <CardContent>
              <PlannedActualBar
                planned={comparison.plannedProgress}
                actual={comparison.actualProgress ?? 0}
                size="lg"
                showLabels
              />
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {comparison.plannedProgress}%
                  </p>
                  <p className="text-xs text-slate-500">Planned</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {comparison.actualProgress !== null
                      ? `${comparison.actualProgress}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-500">Actual</p>
                </div>
                <div>
                  <p
                    className={
                      "text-2xl font-semibold tabular-nums " +
                      (comparison.variance === null
                        ? "text-slate-400"
                        : comparison.variance >= 0
                          ? "text-emerald-600"
                          : comparison.variance >= -10
                            ? "text-amber-600"
                            : "text-rose-600")
                    }
                  >
                    {comparison.variance !== null
                      ? `${comparison.variance > 0 ? "+" : ""}${comparison.variance}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-500">Variance</p>
                </div>
              </div>

              {comparison.status === "DELAYED" && comparison.reason && (
                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {activity.delayDays > 0
                      ? `${activity.delayDays}-day slip`
                      : "Delayed"}
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    {comparison.reason}
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
                <CardTitle>Downstream impact</CardTitle>
                <CardDescription>
                  What this activity&apos;s current state threatens further
                  down the schedule.
                </CardDescription>
              </div>
            </CardHeader>
            {impact.downstream.length === 0 ? (
              <EmptyState
                title="No downstream activities"
                description="Nothing in this project's schedule depends on this stage."
              />
            ) : !impact.isTrigger ? (
              <EmptyState
                title="Not currently a risk trigger"
                description="This stage isn't delayed, so it isn't propagating risk downstream right now."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {impact.downstream.map((entry) => (
                  <li key={entry.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/activities/${entry.id}`}
                        className="text-sm font-medium text-slate-800 hover:text-sky-600"
                      >
                        {entry.name}
                      </Link>
                      {entry.riskStatus && (
                        <DependencyRiskStatusBadge status={entry.riskStatus} />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {entry.distance} {entry.distance === 1 ? "hop" : "hops"}{" "}
                        away
                      </span>
                      {entry.severity && (
                        <RiskSeverityBadge severity={entry.severity} />
                      )}
                      {entry.confidence !== undefined && (
                        <span>{entry.confidence}% confidence</span>
                      )}
                    </div>
                    {entry.reason && (
                      <p className="mt-1 text-sm text-slate-600">{entry.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
            {activityUpdates.length === 0 ? (
              <EmptyState
                title="No updates yet"
                description="This stage hasn't started reporting field progress."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {activityUpdates.map((update) => (
                  <li key={update.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {formatDate(update.date)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-slate-700">
                        {update.actualProgress}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {update.reason || "—"}
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
              <Row label="Execution reason" value={reasonText} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source information</CardTitle>
            </CardHeader>
            {!intelligence.source ? (
              <EmptyState
                title="No field reports yet"
                description="This stage hasn't received a site update."
              />
            ) : (
              <CardContent className="space-y-2.5 text-sm">
                <Row label="Report file" value={intelligence.source.fileName} mono />
                <Row
                  label="File type"
                  value={intelligence.source.fileType.toUpperCase()}
                />
                {comparison.matchConfidence !== undefined && (
                  <Row
                    label="Match confidence"
                    value={`${comparison.matchConfidence}%`}
                  />
                )}
                {comparison.matchMethod && (
                  <Row label="Match method" value={comparison.matchMethod} mono />
                )}
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
