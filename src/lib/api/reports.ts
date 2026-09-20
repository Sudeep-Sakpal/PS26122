import { apiFetch } from "@/lib/api/client";

// Raw shapes mirror backend/src/models/Report.ts, Report.service.ts, and
// serializers.ts's toExecutionUpdateJSON — see backend/API.md "Reports
// (B2)" and "Execution updates + schedule linking (B3)". Kept private to
// this module; components only ever see the mapped types below.

export type ReportFileType = "txt" | "pdf" | "xlsx";
export type ReportStatus = "processed" | "no-data" | "failed";
export type ExtractionMethod = "demo" | "openai" | "anthropic";

interface RawLinkedActivity {
  _id: string;
  code: string;
  name: string;
  sequence: number;
}

interface RawExecutionUpdate {
  _id: string;
  project: string;
  source: string;
  activityName: string;
  activityCode?: string;
  updateDate: string;
  actualProgress: number;
  status?: string;
  reason?: string;
  remarks?: string;
  // Already rescaled 0-100 at the API boundary (serializers.ts).
  extractionConfidence?: number;
  // Absent entirely until B3 links it (never a fabricated 0/null here).
  linkedActivity?: RawLinkedActivity | null;
  matchConfidence?: number | null;
  matchMethod?: string | null;
  matchedAt?: string | null;
  createdAt: string;
}

interface RawReport {
  _id: string;
  project: string;
  fileName: string;
  fileType: ReportFileType;
  mimeType: string;
  sizeBytes: number;
  extractionMethod?: ExtractionMethod;
  status: ReportStatus;
  errorMessage?: string;
  createdAt: string;
}

interface RawReportWithUpdates extends RawReport {
  executionUpdates: RawExecutionUpdate[];
}

interface RawUploadReportResponse {
  report: RawReport;
  executionUpdates: RawExecutionUpdate[];
  extraction: { provider: string; warnings: string[] };
}

interface RawReportsListResponse {
  reports: RawReportWithUpdates[];
  executionUpdates: RawExecutionUpdate[];
}

// ---- Frontend-facing types --------------------------------------------

export interface Report {
  id: string;
  projectId: string;
  fileName: string;
  fileType: ReportFileType;
  sizeBytes: number;
  status: ReportStatus;
  extractionMethod?: ExtractionMethod;
  errorMessage?: string;
  uploadedAt: string;
  executionUpdateCount: number;
  /** Activity names extracted from this report, if any (real data only —
   * empty when nothing was extracted). */
  activitiesExtracted: string[];
}

export interface ExecutionUpdate {
  id: string;
  reportId: string;
  activityName: string;
  activityCode?: string;
  date: string;
  actualProgress: number;
  reason: string;
  remarks?: string;
  /** 0-100, present only when the extractor actually reported one. */
  confidence?: number;
  linkedActivityId?: string;
  linkedActivityCode?: string;
  linkedActivityName?: string;
  matchConfidence?: number;
}

export interface UploadReportResult {
  report: Report;
  executionUpdates: ExecutionUpdate[];
  warnings: string[];
}

function mapReport(raw: RawReport, executionUpdates: RawExecutionUpdate[]): Report {
  return {
    id: raw._id,
    projectId: raw.project,
    fileName: raw.fileName,
    fileType: raw.fileType,
    sizeBytes: raw.sizeBytes,
    status: raw.status,
    extractionMethod: raw.extractionMethod,
    errorMessage: raw.errorMessage,
    uploadedAt: raw.createdAt,
    executionUpdateCount: executionUpdates.length,
    activitiesExtracted: executionUpdates.map((u) => u.activityName),
  };
}

function mapExecutionUpdate(raw: RawExecutionUpdate): ExecutionUpdate {
  return {
    id: raw._id,
    reportId: raw.source,
    activityName: raw.activityName,
    activityCode: raw.activityCode,
    date: raw.updateDate,
    actualProgress: raw.actualProgress,
    reason: raw.reason || "",
    remarks: raw.remarks,
    confidence: raw.extractionConfidence,
    linkedActivityId: raw.linkedActivity?._id,
    linkedActivityCode: raw.linkedActivity?.code,
    linkedActivityName: raw.linkedActivity?.name,
    matchConfidence: raw.matchConfidence ?? undefined,
  };
}

export async function uploadReport(
  projectId: string,
  file: File
): Promise<UploadReportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const raw = await apiFetch<RawUploadReportResponse>(`/projects/${projectId}/reports`, {
    method: "POST",
    body: formData,
  });

  return {
    report: mapReport(raw.report, raw.executionUpdates),
    executionUpdates: raw.executionUpdates.map(mapExecutionUpdate),
    warnings: raw.extraction.warnings,
  };
}

export async function fetchReports(projectId: string): Promise<Report[]> {
  const raw = await apiFetch<RawReportsListResponse>(`/projects/${projectId}/reports`);
  return raw.reports.map((r) => mapReport(r, r.executionUpdates));
}

export async function fetchExecutionUpdates(projectId: string): Promise<ExecutionUpdate[]> {
  const raw = await apiFetch<RawExecutionUpdate[]>(`/projects/${projectId}/execution-updates`);
  return raw.map(mapExecutionUpdate);
}

// B3's deterministic schedule-matching outcome (see
// backend/src/services/scheduleMatching.service.ts). Never forced — an
// unmatched result is a genuine, real outcome, not an error, and always
// carries a real reason from the backend rather than a guess.
export type MatchMethod = "exact-code" | "exact-name" | "keyword" | "fuzzy";

export interface MatchedOutcome {
  matched: true;
  executionUpdateId: string;
  activityId: string;
  activityCode: string;
  activityName: string;
  confidence: number;
  matchMethod: MatchMethod;
}

export interface UnmatchedOutcome {
  matched: false;
  executionUpdateId: string;
  reason: string;
}

export type MatchOutcome = MatchedOutcome | UnmatchedOutcome;

interface RawLinkResponse {
  executionUpdate: RawExecutionUpdate;
  match: MatchOutcome;
}

export interface LinkResult {
  executionUpdate: ExecutionUpdate;
  match: MatchOutcome;
}

export async function linkExecutionUpdate(
  projectId: string,
  updateId: string
): Promise<LinkResult> {
  const raw = await apiFetch<RawLinkResponse>(
    `/projects/${projectId}/execution-updates/${updateId}/link`,
    { method: "POST" }
  );
  return {
    executionUpdate: mapExecutionUpdate(raw.executionUpdate),
    match: raw.match,
  };
}
