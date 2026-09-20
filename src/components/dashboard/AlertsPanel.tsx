import Link from "next/link";
import type { Risk, RiskSeverity } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, type Tone } from "@/components/ui/Badge";
import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// A B4 downstream risk (GET /projects/:id/dashboard), re-shaped for this
// panel — `triggerDelayDays` comes from the real schedule activity (a B1
// field the risk engine itself doesn't carry) resolved by the caller.
export interface CascadeRisk {
  id: string;
  triggerId: string;
  triggerName: string;
  triggerDelayDays: number;
  reason: string;
  severity: RiskSeverity;
  confidence?: number;
}

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

// Shares severity, reason, and confidence with the Risks page's schedule
// risk analysis so the same underlying fact never reads differently in
// two places.
export function AlertsPanel({
  scheduleRisks,
  risks,
}: {
  scheduleRisks: CascadeRisk[];
  risks: Risk[];
}) {
  const cascadeAlerts: Alert[] = scheduleRisks.map((risk) => ({
    id: risk.id,
    title: `${risk.triggerName} is ${risk.triggerDelayDays} days behind schedule`,
    description: risk.reason,
    severity: risk.severity,
    href: `/activities/${risk.triggerId}`,
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
                className={cn("-m-1 block rounded-md p-1 hover:bg-slate-50")}
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
