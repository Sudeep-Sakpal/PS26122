import { Types } from "mongoose";
import { ExecutionUpdate } from "../models/ExecutionUpdate";
import { ApiError } from "../utils/ApiError";

// Deterministic planned-vs-actual + delay detection (B3). No LLM, no
// dependency/risk logic — that's B4. "Delay" here is progress variance
// (actual % vs planned %), not a date/schedule slip — see ScheduleActivity
// .delayDays (B1) for that separate concept.

export type DelayStatus = "DELAYED" | "ON_TRACK" | "AHEAD" | "NO_DATA";

// Progress values in this system are whole percentages, so no rounding
// slack is needed for "on track" — kept as a named constant in case a
// future report format introduces fractional progress noise.
const VARIANCE_TOLERANCE = 0;

export function computeDelayStatus(variance: number): Exclude<DelayStatus, "NO_DATA"> {
  if (variance < -VARIANCE_TOLERANCE) return "DELAYED";
  if (variance > VARIANCE_TOLERANCE) return "AHEAD";
  return "ON_TRACK";
}

export interface ActivityComparison {
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  status: DelayStatus;
  reason: string | null;
  linkedExecutionUpdate: {
    id: string;
    activityName: string;
    updateDate: Date;
    actualProgress: number;
    reason: string;
    remarks?: string | null;
    matchConfidence?: number | null;
    matchMethod?: string | null;
    matchedAt?: Date | null;
    source: Types.ObjectId;
  } | null;
}

interface ComparableActivity {
  _id: Types.ObjectId;
  planned: number;
}

/** Most recent execution update linked to this activity — "most recent
 * applicable update" per B3's spec when multiple reports exist. */
export async function getLatestLinkedExecutionUpdate(activityId: Types.ObjectId) {
  return ExecutionUpdate.findOne({ linkedActivity: activityId })
    .sort({ updateDate: -1, createdAt: -1 })
    .lean();
}

export async function compareActivity(activity: ComparableActivity): Promise<ActivityComparison> {
  const plannedProgress = activity.planned;
  if (!Number.isFinite(plannedProgress)) {
    throw ApiError.badRequest("This activity has no valid planned progress value");
  }

  const latestUpdate = await getLatestLinkedExecutionUpdate(activity._id);

  if (!latestUpdate) {
    return {
      plannedProgress,
      actualProgress: null,
      variance: null,
      status: "NO_DATA",
      reason: null,
      linkedExecutionUpdate: null,
    };
  }

  const actualProgress = latestUpdate.actualProgress;
  if (!Number.isFinite(actualProgress)) {
    throw ApiError.badRequest("The linked execution update has no valid actual progress value");
  }

  const variance = actualProgress - plannedProgress;
  const status = computeDelayStatus(variance);

  return {
    plannedProgress,
    actualProgress,
    variance,
    status,
    reason: latestUpdate.reason || null,
    linkedExecutionUpdate: {
      id: latestUpdate._id.toString(),
      activityName: latestUpdate.activityName,
      updateDate: latestUpdate.updateDate,
      actualProgress: latestUpdate.actualProgress,
      reason: latestUpdate.reason ?? "",
      remarks: latestUpdate.remarks,
      matchConfidence: latestUpdate.matchConfidence,
      matchMethod: latestUpdate.matchMethod,
      matchedAt: latestUpdate.matchedAt,
      source: latestUpdate.source,
    },
  };
}
