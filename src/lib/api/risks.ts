import { apiFetch } from "@/lib/api/client";
import type { RiskSeverity } from "@/types";
import type { DelayStatus } from "@/lib/api/activities";

// Raw shapes mirror backend/src/services/riskEngine.service.ts (RiskRecord,
// ActivityImpactResult) — see backend/API.md "Risks (B4)". This is the
// canonical home for B4's risk-record shape: GET /projects/:id/risks and
// the `risks` field embedded in GET /projects/:id/dashboard both return
// the exact same RiskRecord[] (the dashboard just calls the same service),
// so @/lib/api/dashboard imports the raw type and severity mapper from
// here rather than redefining them.

export type RawRiskStatus = "AT_RISK" | "POTENTIAL_IMPACT";
export type RawRiskSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface RawActivityRef {
  id: string;
  code: string;
  name: string;
}

export interface RawRiskRecord {
  triggerActivity: RawActivityRef & { status: "DELAYED"; variance: number };
  impactedActivity: RawActivityRef;
  distance: number;
  riskStatus: RawRiskStatus;
  severity: RawRiskSeverity;
  reason: string;
  confidence?: number;
}

interface RawProjectRisksResponse {
  risks: RawRiskRecord[];
}

interface RawDownstreamImpactEntry extends RawActivityRef {
  distance: number;
  riskStatus: RawRiskStatus | null;
  severity: RawRiskSeverity | null;
  reason: string | null;
  confidence?: number;
}

interface RawActivityImpactResponse {
  activity: {
    id: string;
    code: string;
    name: string;
    status: DelayStatus;
    variance: number | null;
  };
  isTrigger: boolean;
  downstream: RawDownstreamImpactEntry[];
}

// ---- Frontend-facing types --------------------------------------------

// B4's risk status — a distinct vocabulary from both B1's ActivityStatus
// and B3's DelayStatus (see backend/API.md's "two status vocabularies"
// note). Never merged with either.
export type DependencyRiskStatus = RawRiskStatus;

export const severityMap: Record<RawRiskSeverity, RiskSeverity> = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export interface DependencyRisk {
  id: string;
  triggerId: string;
  triggerCode: string;
  triggerName: string;
  triggerVariance: number;
  impactedId: string;
  impactedCode: string;
  impactedName: string;
  distance: number;
  riskStatus: DependencyRiskStatus;
  severity: RiskSeverity;
  reason: string;
  confidence?: number;
}

export interface DownstreamImpactEntry {
  id: string;
  code: string;
  name: string;
  distance: number;
  riskStatus: DependencyRiskStatus | null;
  severity: RiskSeverity | null;
  reason: string | null;
  confidence?: number;
}

export interface ActivityImpact {
  activityId: string;
  activityCode: string;
  activityName: string;
  status: DelayStatus;
  variance: number | null;
  isTrigger: boolean;
  downstream: DownstreamImpactEntry[];
}

function mapRiskRecord(raw: RawRiskRecord): DependencyRisk {
  return {
    id: `${raw.triggerActivity.id}-${raw.impactedActivity.id}`,
    triggerId: raw.triggerActivity.id,
    triggerCode: raw.triggerActivity.code,
    triggerName: raw.triggerActivity.name,
    triggerVariance: raw.triggerActivity.variance,
    impactedId: raw.impactedActivity.id,
    impactedCode: raw.impactedActivity.code,
    impactedName: raw.impactedActivity.name,
    distance: raw.distance,
    riskStatus: raw.riskStatus,
    severity: severityMap[raw.severity],
    reason: raw.reason,
    confidence: raw.confidence,
  };
}

export async function fetchProjectRisks(projectId: string): Promise<DependencyRisk[]> {
  const raw = await apiFetch<RawProjectRisksResponse>(`/projects/${projectId}/risks`);
  return raw.risks.map(mapRiskRecord);
}

export async function fetchActivityImpact(
  projectId: string,
  activityId: string
): Promise<ActivityImpact> {
  const raw = await apiFetch<RawActivityImpactResponse>(
    `/projects/${projectId}/activities/${activityId}/impact`
  );
  return {
    activityId: raw.activity.id,
    activityCode: raw.activity.code,
    activityName: raw.activity.name,
    status: raw.activity.status,
    variance: raw.activity.variance,
    isTrigger: raw.isTrigger,
    downstream: raw.downstream.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      distance: d.distance,
      riskStatus: d.riskStatus,
      severity: d.severity ? severityMap[d.severity] : null,
      reason: d.reason,
      confidence: d.confidence,
    })),
  };
}
