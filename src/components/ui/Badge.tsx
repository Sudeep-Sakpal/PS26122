import { cn } from "@/lib/utils";
import type {
  ActivityStatus,
  IntakeStatus,
  ProjectStatus,
  RiskLikelihood,
  RiskSeverity,
  RiskStatus,
} from "@/types";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/15",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const projectStatusTone: Record<ProjectStatus, Tone> = {
  "on-track": "success",
  "at-risk": "warning",
  delayed: "danger",
  completed: "info",
};

const activityStatusTone: Record<ActivityStatus, Tone> = {
  "not-started": "neutral",
  "in-progress": "info",
  completed: "success",
  delayed: "danger",
  "at-risk": "warning",
  blocked: "danger",
};

const riskSeverityTone: Record<RiskSeverity, Tone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const riskStatusTone: Record<RiskStatus, Tone> = {
  open: "danger",
  mitigating: "warning",
  monitoring: "info",
  closed: "neutral",
};

const riskLikelihoodTone: Record<RiskLikelihood, Tone> = {
  unlikely: "neutral",
  possible: "info",
  likely: "warning",
  "almost-certain": "danger",
};

const intakeStatusTone: Record<IntakeStatus, Tone> = {
  "pending-review": "warning",
  linked: "success",
  flagged: "danger",
  processed: "neutral",
};

function label(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={projectStatusTone[status]}>{label(status)}</Badge>;
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return <Badge tone={activityStatusTone[status]}>{label(status)}</Badge>;
}

export function RiskSeverityBadge({ severity }: { severity: RiskSeverity }) {
  return <Badge tone={riskSeverityTone[severity]}>{label(severity)}</Badge>;
}

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  return <Badge tone={riskStatusTone[status]}>{label(status)}</Badge>;
}

export function RiskLikelihoodBadge({ likelihood }: { likelihood: RiskLikelihood }) {
  return <Badge tone={riskLikelihoodTone[likelihood]}>{label(likelihood)}</Badge>;
}

export function IntakeStatusBadge({ status }: { status: IntakeStatus }) {
  return <Badge tone={intakeStatusTone[status]}>{label(status)}</Badge>;
}
