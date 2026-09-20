import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { getProjectById } from "./project.service";
import { compareActivity, type ActivityComparison } from "./comparison.service";
import { getProjectRisks, type RiskRecord } from "./riskEngine.service";
import { listExecutionUpdatesForProject } from "./executionUpdate.service";

// B5: read-only aggregation over B1-B4's existing services. No new
// calculation logic lives here — every number is either B1 baseline data
// (planned progress, schedule status) or B3/B4's already-computed
// deterministic results (comparison, risk). This just assembles one
// frontend-friendly payload out of them.

const RECENT_UPDATES_LIMIT = 5;

export interface DashboardActivitySummary {
  id: string;
  code: string;
  name: string;
  sequence: number;
  owner: string;
  // B1's static schedule-import status (kebab-case, e.g. "delayed") —
  // kept distinct in name and casing from `delayStatus` below so the two
  // conceptually different fields are never confused with one another.
  scheduleStatus: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  // B3's computed planned-vs-actual result (DELAYED/ON_TRACK/AHEAD/NO_DATA).
  delayStatus: ActivityComparison["status"];
  reason: string | null;
}

export interface DashboardSummary {
  totalActivities: number;
  completedActivities: number;
  activitiesWithData: number;
  activitiesWithoutData: number;
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  delayedActivities: number;
  onTrackActivities: number;
  aheadActivities: number;
  atRiskActivities: number;
  potentialImpactActivities: number;
  totalRisks: number;
}

export interface ProjectDashboard {
  project: Awaited<ReturnType<typeof getProjectById>>;
  summary: DashboardSummary;
  activities: DashboardActivitySummary[];
  risks: RiskRecord[];
  recentUpdates: Array<Record<string, unknown>>;
}

export async function getProjectDashboard(projectId: string): Promise<ProjectDashboard> {
  // Throws 404 if the project doesn't exist — no separate existence
  // check needed before this.
  const project = await getProjectById(projectId);

  const activities = await ScheduleActivity.find({ project: new Types.ObjectId(projectId) })
    .sort({ sequence: 1 })
    .lean();

  const comparisons = await Promise.all(activities.map((activity) => compareActivity(activity)));

  const activitySummaries: DashboardActivitySummary[] = activities.map((activity, i) => {
    const comparison = comparisons[i];
    return {
      id: activity._id.toString(),
      code: activity.code,
      name: activity.name,
      sequence: activity.sequence,
      owner: activity.owner,
      scheduleStatus: activity.status,
      plannedStart: activity.plannedStart,
      plannedEnd: activity.plannedEnd,
      actualStart: activity.actualStart,
      actualEnd: activity.actualEnd,
      plannedProgress: comparison.plannedProgress,
      actualProgress: comparison.actualProgress,
      variance: comparison.variance,
      delayStatus: comparison.status,
      reason: comparison.reason,
    };
  });

  // Planned progress is B1 baseline data — always present, so a plain
  // average across every activity is unambiguous.
  const plannedProgress =
    activities.length > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.planned, 0) / activities.length)
      : 0;

  // Actual progress is only known for activities with a linked execution
  // update. Averaging in 0 for the rest would falsely claim "0% done"
  // for activities that simply haven't reported yet — NO_DATA is a
  // distinct state (per B3) and is excluded from this average rather
  // than assumed.
  const activitiesWithData = comparisons.filter((c) => c.status !== "NO_DATA");
  const actualProgress =
    activitiesWithData.length > 0
      ? Math.round(
          activitiesWithData.reduce((sum, c) => sum + (c.actualProgress ?? 0), 0) /
            activitiesWithData.length
        )
      : null;
  // Deliberately NOT `actualProgress - plannedProgress`: those two
  // aggregates can cover different populations (actualProgress only
  // averages activities that have reported; plannedProgress averages
  // every activity), so subtracting them would compare mismatched
  // baselines and could show "ahead" overall while the one activity with
  // data is badly delayed. Instead, average each reporting activity's
  // own variance (already computed against its own planned figure).
  const variance =
    activitiesWithData.length > 0
      ? Math.round(
          activitiesWithData.reduce((sum, c) => sum + (c.variance ?? 0), 0) /
            activitiesWithData.length
        )
      : null;

  const delayedActivities = comparisons.filter((c) => c.status === "DELAYED").length;
  const onTrackActivities = comparisons.filter((c) => c.status === "ON_TRACK").length;
  const aheadActivities = comparisons.filter((c) => c.status === "AHEAD").length;
  const completedActivities = activities.filter((a) => a.status === "completed").length;

  // Reuses B4's risk engine as-is (see riskEngine.service.ts) — this does
  // mean the delayed-trigger comparisons above get recomputed once more
  // inside getProjectRisks; at this prototype's scale (a handful of
  // cheap, indexed findOne queries per activity) that's not worth
  // restructuring B4's public contract to avoid. See B5 report.
  const risks = await getProjectRisks(projectId);
  const atRiskActivityIds = new Set(
    risks.filter((r) => r.riskStatus === "AT_RISK").map((r) => r.impactedActivity.id)
  );
  const potentialImpactActivityIds = new Set(
    risks.filter((r) => r.riskStatus === "POTENTIAL_IMPACT").map((r) => r.impactedActivity.id)
  );

  const recentUpdatesRaw = await listExecutionUpdatesForProject(projectId);
  const recentUpdates = recentUpdatesRaw.slice(0, RECENT_UPDATES_LIMIT).map((update) => {
    // extractedText can run to several KB (B2 truncates at 20k chars) —
    // irrelevant for a dashboard feed and not worth shipping.
    const { extractedText: _extractedText, ...rest } = update as Record<string, unknown>;
    return rest;
  });

  return {
    project,
    summary: {
      totalActivities: activities.length,
      completedActivities,
      activitiesWithData: activitiesWithData.length,
      activitiesWithoutData: activities.length - activitiesWithData.length,
      plannedProgress,
      actualProgress,
      variance,
      delayedActivities,
      onTrackActivities,
      aheadActivities,
      atRiskActivities: atRiskActivityIds.size,
      potentialImpactActivities: potentialImpactActivityIds.size,
      totalRisks: risks.length,
    },
    activities: activitySummaries,
    risks,
    recentUpdates,
  };
}
