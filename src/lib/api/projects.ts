import { apiFetch } from "@/lib/api/client";
import type { Project, ScheduleActivity } from "@/types";

// Raw shapes as returned by the backend (backend/API.md) — Mongo
// documents serialized as-is, so ids are `_id` and dates are ISO strings.
export interface RawProject {
  _id: string;
  name: string;
  code: string;
  location: string;
  sector: string;
  status: Project["status"];
  startDate: string;
  endDate: string;
  budgetUtilized: number;
  contractor: string;
  progress: number;
}

interface RawActivity {
  _id: string;
  project: string;
  sequence: number;
  code: string;
  name: string;
  owner: string;
  status: ScheduleActivity["status"];
  planned: number;
  actual: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  delayDays: number;
  dependsOn: string[];
}

export function mapProject(raw: RawProject): Project {
  return {
    id: raw._id,
    code: raw.code,
    name: raw.name,
    location: raw.location,
    sector: raw.sector,
    status: raw.status,
    progress: raw.progress,
    startDate: raw.startDate,
    endDate: raw.endDate,
    budgetUtilized: raw.budgetUtilized,
    contractor: raw.contractor,
  };
}

// Backend fields not yet surfaced by /activities (riskReason, updates,
// reportReason, matchConfidence) are narrative/derived data that other
// integration slices (B3/B4-backed endpoints) will populate later.
function mapActivity(raw: RawActivity): ScheduleActivity {
  return {
    id: raw._id,
    projectId: raw.project,
    sequence: raw.sequence,
    code: raw.code,
    name: raw.name,
    owner: raw.owner,
    status: raw.status,
    dependsOn: raw.dependsOn,
    planned: raw.planned,
    actual: raw.actual,
    plannedStart: raw.plannedStart,
    plannedEnd: raw.plannedEnd,
    actualStart: raw.actualStart,
    actualEnd: raw.actualEnd,
    delayDays: raw.delayDays,
    updates: [],
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const raw = await apiFetch<RawProject[]>("/projects");
  return raw.map(mapProject);
}

export async function fetchProject(projectId: string): Promise<Project> {
  const raw = await apiFetch<RawProject>(`/projects/${projectId}`);
  return mapProject(raw);
}

export async function fetchProjectActivities(
  projectId: string
): Promise<ScheduleActivity[]> {
  const raw = await apiFetch<RawActivity[]>(`/projects/${projectId}/activities`);
  return raw.map(mapActivity).sort((a, b) => a.sequence - b.sequence);
}

// GET /projects/:id/activities/:activityId also returns `comparison` (B3)
// and `source` (linked report) — intentionally left untyped/unused here.
// Wiring those in is a later integration milestone (I4), not I1; this is
// used only to resolve which project owns an activity id and to confirm
// the activity actually exists (404 => not found).
export interface ActivityDetailResponse {
  activity: {
    _id: string;
    project: string;
    sequence: number;
    code: string;
    name: string;
    owner: string;
    status: ScheduleActivity["status"];
    plannedStart: string;
    plannedEnd: string;
    actualStart?: string;
    actualEnd?: string;
    delayDays: number;
    dependsOn: string[];
  };
}

export async function fetchActivityDetail(
  projectId: string,
  activityId: string
): Promise<ActivityDetailResponse> {
  return apiFetch<ActivityDetailResponse>(
    `/projects/${projectId}/activities/${activityId}`
  );
}
