import { apiFetch } from "@/lib/api/client";
import type { ActivityStatus } from "@/types";

// Raw shapes mirror backend/src/services/activity.service.ts
// (getActivityDetail) and comparison.service.ts (ActivityComparison) —
// see backend/API.md "Activities" and the B3 comparison contract. Kept
// private to this module; components only ever see the mapped types
// below.

export type DelayStatus = "DELAYED" | "ON_TRACK" | "AHEAD" | "NO_DATA";

interface RawLinkedExecutionUpdate {
  id: string;
  activityName: string;
  updateDate: string;
  actualProgress: number;
  reason: string;
  remarks?: string | null;
  matchConfidence?: number | null;
  matchMethod?: string | null;
  matchedAt?: string | null;
  source: string;
}

interface RawComparison {
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  status: DelayStatus;
  reason: string | null;
  linkedExecutionUpdate: RawLinkedExecutionUpdate | null;
}

interface RawActivityIdentity {
  _id: string;
  project: string;
  sequence: number;
  code: string;
  name: string;
  owner: string;
  status: ActivityStatus;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  delayDays: number;
  dependsOn: string[];
}

interface RawSourceReport {
  _id: string;
  fileName: string;
  fileType: string;
  extractionMethod?: string;
  createdAt: string;
}

interface RawActivityDetailResponse {
  activity: RawActivityIdentity;
  comparison: RawComparison;
  source: RawSourceReport | null;
}

// ---- Frontend-facing types --------------------------------------------

// B3's planned-vs-actual result — the only authoritative source for these
// numbers. matchConfidence/matchMethod are flattened up from the linked
// execution update since that's the only place a matched activity's match
// info lives; both are omitted (not defaulted to 0/"") when there is no
// link, so callers can tell "no match" from "matched with confidence 0".
export interface ActivityComparison {
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  status: DelayStatus;
  reason: string | null;
  matchConfidence?: number;
  matchMethod?: string;
  linkedUpdateDate?: string;
}

export interface ActivitySource {
  fileName: string;
  fileType: string;
  extractionMethod?: string;
  uploadedAt: string;
}

export interface ActivityIntelligence {
  id: string;
  projectId: string;
  code: string;
  name: string;
  comparison: ActivityComparison;
  source: ActivitySource | null;
}

function mapComparison(raw: RawComparison): ActivityComparison {
  return {
    plannedProgress: raw.plannedProgress,
    actualProgress: raw.actualProgress,
    variance: raw.variance,
    status: raw.status,
    reason: raw.reason,
    matchConfidence: raw.linkedExecutionUpdate?.matchConfidence ?? undefined,
    matchMethod: raw.linkedExecutionUpdate?.matchMethod ?? undefined,
    linkedUpdateDate: raw.linkedExecutionUpdate?.updateDate,
  };
}

function mapSource(raw: RawSourceReport | null): ActivitySource | null {
  if (!raw) return null;
  return {
    fileName: raw.fileName,
    fileType: raw.fileType,
    extractionMethod: raw.extractionMethod,
    uploadedAt: raw.createdAt,
  };
}

// GET /projects/:id/activities/:activityId already bundles identity +
// comparison + source report in one response, so this is the single
// fetch the Activity Detail page needs — no separate call to .../comparison
// required for the main page load (that endpoint is exposed below only
// for callers that genuinely want the comparison alone).
export async function fetchActivityIntelligence(
  projectId: string,
  activityId: string
): Promise<ActivityIntelligence> {
  const raw = await apiFetch<RawActivityDetailResponse>(
    `/projects/${projectId}/activities/${activityId}`
  );
  return {
    id: raw.activity._id,
    projectId: raw.activity.project,
    code: raw.activity.code,
    name: raw.activity.name,
    comparison: mapComparison(raw.comparison),
    source: mapSource(raw.source),
  };
}

export async function fetchActivityComparison(
  projectId: string,
  activityId: string
): Promise<ActivityComparison> {
  const raw = await apiFetch<RawComparison>(
    `/projects/${projectId}/activities/${activityId}/comparison`
  );
  return mapComparison(raw);
}
