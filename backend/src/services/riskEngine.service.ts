import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { getActivityForProject } from "./activity.service";
import { compareActivity } from "./comparison.service";
import { getDownstreamActivities } from "./dependencyGraph.service";

// Deterministic dependency + risk engine (B4). Consumes B3's delay state
// and the stored Dependency graph — no LLM, no ML, nothing invented.
// riskStatus/severity are a pure function of dependency distance from a
// DELAYED trigger; nothing here ever changes a downstream activity's own
// ScheduleActivity/ExecutionUpdate data.

export type RiskStatus = "AT_RISK" | "POTENTIAL_IMPACT";
export type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";

const DIRECT_IMPACT_DISTANCE = 1;
// Per extra dependency hop beyond the direct one, confidence is
// discounted a bit further — each additional step is one more
// assumption that the impact actually propagates that far.
const CONFIDENCE_HOP_DISCOUNT = 0.15;

export interface ActivityRef {
  id: string;
  code: string;
  name: string;
}

export interface TriggerActivityRef extends ActivityRef {
  status: "DELAYED";
  variance: number;
}

export interface RiskRecord {
  triggerActivity: TriggerActivityRef;
  impactedActivity: ActivityRef;
  distance: number;
  riskStatus: RiskStatus;
  severity: RiskSeverity;
  reason: string;
  /** 0-100. Derived from the trigger's own match confidence (B3),
   * discounted per dependency hop — never an invented/predicted score.
   * Omitted when the trigger has no match confidence to base it on. */
  confidence?: number;
}

export function riskStatusForDistance(distance: number): RiskStatus {
  return distance === DIRECT_IMPACT_DISTANCE ? "AT_RISK" : "POTENTIAL_IMPACT";
}

export function severityForRiskStatus(riskStatus: RiskStatus): RiskSeverity {
  return riskStatus === "AT_RISK" ? "HIGH" : "MEDIUM";
}

function buildReason(trigger: TriggerActivityRef, distance: number): string {
  const magnitude = Math.abs(Math.round(trigger.variance));
  if (distance === DIRECT_IMPACT_DISTANCE) {
    return `Upstream ${trigger.name} activity is delayed by ${magnitude} percentage points.`;
  }
  return `Downstream of ${trigger.name}, which is delayed by ${magnitude} percentage points (${distance} dependency steps away).`;
}

function computeRiskConfidence(
  triggerMatchConfidence: number | null | undefined,
  distance: number
): number | undefined {
  if (triggerMatchConfidence === null || triggerMatchConfidence === undefined) {
    return undefined;
  }
  const hopDiscount = Math.max(0, 1 - (distance - DIRECT_IMPACT_DISTANCE) * CONFIDENCE_HOP_DISCOUNT);
  return Math.round(triggerMatchConfidence * hopDiscount);
}

interface DelayedTrigger {
  ref: TriggerActivityRef;
  matchConfidence: number | null | undefined;
}

/** Every currently-DELAYED activity in the project, per B3's comparison —
 * the only activities that can ever be a risk *trigger*. */
async function findDelayedTriggers(projectId: string): Promise<DelayedTrigger[]> {
  const activities = await ScheduleActivity.find({ project: new Types.ObjectId(projectId) })
    .select("_id code name planned")
    .lean();

  const comparisons = await Promise.all(activities.map((a) => compareActivity(a)));

  const triggers: DelayedTrigger[] = [];
  activities.forEach((activity, i) => {
    const comparison = comparisons[i];
    if (comparison.status !== "DELAYED" || comparison.variance === null) return;
    triggers.push({
      ref: {
        id: activity._id.toString(),
        code: activity.code,
        name: activity.name,
        status: "DELAYED",
        variance: comparison.variance,
      },
      matchConfidence: comparison.linkedExecutionUpdate?.matchConfidence,
    });
  });
  return triggers;
}

/**
 * Every downstream risk in the project: for each currently-delayed
 * activity, walk its dependency graph and flag every successor as
 * AT_RISK (direct) or POTENTIAL_IMPACT (further downstream). Handles
 * multiple simultaneous triggers and parallel branches by construction —
 * one BFS per trigger, all results merged and deduplicated by
 * (trigger, impacted) pair.
 */
export async function getProjectRisks(projectId: string): Promise<RiskRecord[]> {
  const triggers = await findDelayedTriggers(projectId);
  if (triggers.length === 0) return [];

  const allActivities = await ScheduleActivity.find({ project: new Types.ObjectId(projectId) })
    .select("_id code name")
    .lean();
  const activityById = new Map(allActivities.map((a) => [a._id.toString(), a]));

  const seenPairs = new Set<string>();
  const risks: RiskRecord[] = [];

  for (const trigger of triggers) {
    const downstream = await getDownstreamActivities(projectId, trigger.ref.id);

    for (const { activityId, distance } of downstream) {
      const dedupeKey = `${trigger.ref.id}:${activityId}`;
      if (seenPairs.has(dedupeKey)) continue;
      seenPairs.add(dedupeKey);

      const impacted = activityById.get(activityId);
      if (!impacted) continue; // defensive: stale edge pointing at a deleted activity

      const riskStatus = riskStatusForDistance(distance);
      risks.push({
        triggerActivity: trigger.ref,
        impactedActivity: { id: impacted._id.toString(), code: impacted.code, name: impacted.name },
        distance,
        riskStatus,
        severity: severityForRiskStatus(riskStatus),
        reason: buildReason(trigger.ref, distance),
        confidence: computeRiskConfidence(trigger.matchConfidence, distance),
      });
    }
  }

  risks.sort(
    (a, b) =>
      a.triggerActivity.code.localeCompare(b.triggerActivity.code) ||
      a.distance - b.distance ||
      a.impactedActivity.code.localeCompare(b.impactedActivity.code)
  );

  return risks;
}

export interface DownstreamImpactEntry extends ActivityRef {
  distance: number;
  riskStatus: RiskStatus | null;
  severity: RiskSeverity | null;
  reason: string | null;
  confidence?: number;
}

export interface ActivityImpactResult {
  activity: {
    id: string;
    code: string;
    name: string;
    status: string;
    variance: number | null;
  };
  /** Whether this activity is itself currently DELAYED — i.e. a genuine
   * active risk trigger, as opposed to just a node in the chain. */
  isTrigger: boolean;
  downstream: DownstreamImpactEntry[];
}

/**
 * "If this activity is delayed, which downstream activities are
 * affected?" — any activity is traversable, not just delayed ones; if
 * the activity isn't currently DELAYED, the downstream chain is still
 * returned (for exploring the schedule structure) but with no risk
 * flags, since there is no actual delay to propagate from it.
 */
export async function getActivityImpact(
  projectId: string,
  activityId: string
): Promise<ActivityImpactResult> {
  const activity = await getActivityForProject(projectId, activityId);
  const comparison = await compareActivity(activity);
  const isTrigger = comparison.status === "DELAYED" && comparison.variance !== null;

  const trigger: TriggerActivityRef | null = isTrigger
    ? {
        id: activity._id.toString(),
        code: activity.code,
        name: activity.name,
        status: "DELAYED",
        variance: comparison.variance as number,
      }
    : null;
  const triggerMatchConfidence = comparison.linkedExecutionUpdate?.matchConfidence;

  const downstreamNodes = await getDownstreamActivities(projectId, activityId);
  const downstreamIds = downstreamNodes.map((n) => new Types.ObjectId(n.activityId));
  const downstreamDocs =
    downstreamIds.length > 0
      ? await ScheduleActivity.find({ _id: { $in: downstreamIds } })
          .select("_id code name")
          .lean()
      : [];
  const docById = new Map(downstreamDocs.map((d) => [d._id.toString(), d]));

  const downstream: DownstreamImpactEntry[] = downstreamNodes
    .map(({ activityId: id, distance }) => {
      const doc = docById.get(id);
      const riskStatus = trigger ? riskStatusForDistance(distance) : null;
      return {
        id,
        code: doc?.code ?? "",
        name: doc?.name ?? "",
        distance,
        riskStatus,
        severity: riskStatus ? severityForRiskStatus(riskStatus) : null,
        reason: trigger ? buildReason(trigger, distance) : null,
        confidence: trigger ? computeRiskConfidence(triggerMatchConfidence, distance) : undefined,
      };
    })
    .sort((a, b) => a.distance - b.distance || a.code.localeCompare(b.code));

  return {
    activity: {
      id: activity._id.toString(),
      code: activity.code,
      name: activity.name,
      status: comparison.status,
      variance: comparison.variance,
    },
    isTrigger,
    downstream,
  };
}
