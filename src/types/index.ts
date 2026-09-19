// Domain types for the PS 26122 frontend prototype.
// These mirror the shape future backend APIs are expected to return.

export type ProjectStatus = "on-track" | "at-risk" | "delayed" | "completed";

export interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  sector: string;
  status: ProjectStatus;
  progress: number; // 0-100
  startDate: string;
  endDate: string;
  budgetUtilized: number; // 0-100 percent of sanctioned budget
  contractor: string;
}

export type ActivityStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "delayed"
  | "blocked";

export interface Activity {
  id: string;
  projectId: string;
  code: string;
  name: string;
  wbsPath: string;
  owner: string;
  status: ActivityStatus;
  progress: number; // 0-100
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  linkedRecords: number;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskLikelihood = "unlikely" | "possible" | "likely" | "almost-certain";
export type RiskStatus = "open" | "mitigating" | "monitoring" | "closed";

export interface Risk {
  id: string;
  projectId: string;
  code: string;
  title: string;
  category: string;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
  status: RiskStatus;
  owner: string;
  linkedActivityId?: string;
  identifiedOn: string;
  dueDate?: string;
}

export type IntakeSourceType =
  | "site-report"
  | "drone-survey"
  | "sensor-feed"
  | "manual-entry"
  | "email"
  | "spreadsheet";

export type IntakeStatus = "pending-review" | "linked" | "flagged" | "processed";

export interface DataIntakeRecord {
  id: string;
  projectId: string;
  source: IntakeSourceType;
  fileName: string;
  submittedBy: string;
  submittedOn: string;
  status: IntakeStatus;
  linkedActivityId?: string;
  confidence?: number; // schedule-link matching confidence, 0-100
  sizeKb?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: "dashboard" | "intake" | "activities" | "risks";
}
