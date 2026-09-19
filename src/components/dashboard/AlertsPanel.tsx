import Link from "next/link";
import type { Risk, RiskSeverity, ScheduleActivity } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, type Tone } from "@/components/ui/Badge";
import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  href?: string;
}

const severityWeight: Record<RiskSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const severityTone: Record<RiskSeverity, Tone> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export function AlertsPanel({
  activities,
  risks,
}: {
  activities: ScheduleActivity[];
  risks: Risk[];
}) {
  const cascadeAlerts: Alert[] = activities
    .filter((a) => a.riskReason && (a.status === "delayed" || a.status === "at-risk"))
    .map((a) => ({
      id: `cascade-${a.id}`,
      title:
        a.status === "delayed"
          ? `${a.name} is ${a.delayDays} days behind schedule`
          : `${a.name} is at risk from an upstream delay`,
      description: a.riskReason!,
      severity: a.status === "delayed" ? "high" : "medium",
      href: `/activities/${a.id}`,
    }));

  const registerAlerts: Alert[] = risks
    .filter((r) => r.status !== "closed")
    .map((r) => ({
      id: `risk-${r.id}`,
      title: r.title,
      description: `${r.category} · owner ${r.owner}`,
      severity: r.severity,
    }));

  const combined = [...cascadeAlerts, ...registerAlerts]
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
    .slice(0, 6);

  if (combined.length === 0) {
    return (
      <EmptyState
        icon={<AlertIcon className="h-5 w-5" />}
        title="No active alerts"
        description="This project has no open risks or schedule cascades right now."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {combined.map((alert) => {
        const content = (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{alert.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{alert.description}</p>
            </div>
            <Badge tone={severityTone[alert.severity]} className="shrink-0">
              {alert.severity}
            </Badge>
          </div>
        );

        return (
          <li key={alert.id} className="px-5 py-3">
            {alert.href ? (
              <Link
                href={alert.href}
                className={cn("block rounded-md -m-1 p-1 hover:bg-slate-50")}
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
