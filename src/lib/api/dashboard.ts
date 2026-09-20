import { apiFetch } from "@/lib/api/client";
import { mapProject, type RawProject } from "@/lib/api/projects";
import { severityMap, type RawRiskRecord } from "@/lib/api/risks";
import type { Project, RiskSeverity } from "@/types";

// Raw shapes mirror backend/src/services/dashboard.service.ts
// (ProjectDashboard) and riskEngine.service.ts (RiskRecord) — see
// backend/API.md "Dashboard response shape". Kept private to this module;
// components only ever see the mapped types below.

type RawDelayStatus = "DELAYED" | "ON_TRACK" | "AHEAD" | "NO_DATA";

interface RawDashboardSummary {
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

// Typed for fidelity with the actual response, but deliberately NOT
// mapped into ProjectDashboard below: this per-activity summary has no
// `dependsOn`, so it can't drive the schedule chain visualization (I1's
// real ProjectContext.activities already can, via GET /activities, and
// that's what the dashboard page keeps using). Its per-activity
// plannedProgress/actualProgress/variance/delayStatus are exactly what
// `summary` already aggregates, so nothing here is lost by not exposing
// this array separately.
interface RawDashboardActivity {
  id: string;
  code: string;
  name: string;
  sequence: number;
  owner: string;
  scheduleStatus: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  plannedProgress: number;
  actualProgress: number | null;
  variance: number | null;
  delayStatus: RawDelayStatus;
  reason: string | null;
}

interface RawRecentUpdate {
  _id: string;
  activityName: string;
  activityCode?: string;
  updateDate: string;
  actualProgress: number;
  reason?: string;
  remarks?: string;
  linkedActivity?: { _id: string; code: string; name: string; sequence: number } | null;
}

interface RawProjectDashboard {
  project: RawProject;
  summary: RawDashboardSummary;
  activities: RawDashboardActivity[];
  risks: RawRiskRecord[];
  recentUpdates: RawRecentUpdate[];
}

// ---- Frontend-facing types --------------------------------------------

export type DashboardSummary = RawDashboardSummary;

// What AlertsPanel's cascade-alert mapping actually reads (see
// src/components/dashboard/AlertsPanel.tsx). `delayDays` isn't part of
// B4's risk record (that's a B1 schedule concept) — callers resolve it
// from the already-fetched real ScheduleActivity for triggerId.
export interface DashboardScheduleRisk {
  id: string;
  triggerId: string;
  triggerName: string;
  reason: string;
  severity: RiskSeverity;
  confidence?: number;
}

// Only execution updates linked to a real schedule activity are surfaced
// (matches ExecutionFeed's own empty-state copy: "Field updates linked to
// this project's schedule"). There is no "author" in this data model —
// updates are extracted from documents, not attributed to a person — so
// this type deliberately has no author field rather than inventing one.
export interface DashboardExecutionUpdate {
  id: string;
  date: string;
  note: string;
  activityId: string;
  activityName: string;
}

export interface ProjectDashboard {
  project: Project;
  summary: DashboardSummary;
  risks: DashboardScheduleRisk[];
  recentUpdates: DashboardExecutionUpdate[];
}

function mapRisk(raw: RawRiskRecord): DashboardScheduleRisk {
  return {
    id: `${raw.triggerActivity.id}-${raw.impactedActivity.id}`,
    triggerId: raw.triggerActivity.id,
    triggerName: raw.triggerActivity.name,
    reason: raw.reason,
    severity: severityMap[raw.severity],
    confidence: raw.confidence,
  };
}

function mapRecentUpdate(raw: RawRecentUpdate): DashboardExecutionUpdate | null {
  if (!raw.linkedActivity) return null;
  return {
    id: raw._id,
    date: raw.updateDate,
    note: raw.reason || "Field progress update.",
    activityId: raw.linkedActivity._id,
    activityName: raw.linkedActivity.name,
  };
}

export async function fetchProjectDashboard(projectId: string): Promise<ProjectDashboard> {
  const raw = await apiFetch<RawProjectDashboard>(`/projects/${projectId}/dashboard`);

  return {
    project: mapProject(raw.project),
    summary: raw.summary,
    risks: raw.risks.map(mapRisk),
    recentUpdates: raw.recentUpdates
      .map(mapRecentUpdate)
      .filter((u): u is DashboardExecutionUpdate => u !== null),
  };
}
