import Link from "next/link";
import type { DependencyRisk } from "@/lib/api/risks";
import type { ScheduleActivity } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  DependencyRiskStatusBadge,
  RiskSeverityBadge,
} from "@/components/ui/Badge";
import { DependencyConsequence } from "@/components/intake/DependencyConsequence";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertIcon, ChevronRightIcon } from "@/components/icons";

// One card per real B4 (trigger, impacted) risk record — the backend
// scores each downstream activity independently (severity/confidence/
// reason all vary by distance), so grouping multiple impacted activities
// under one trigger card would mean picking a single severity to show and
// losing the others. `activityById` resolves the real ScheduleActivity
// (B1 status, for the chain visual's own coloring) for the trigger/
// impacted pair — DependencyConsequence never sees B4's risk status.
export function ScheduleRiskAnalysis({
  risks,
  activityById,
}: {
  risks: DependencyRisk[];
  activityById: Map<string, ScheduleActivity>;
}) {
  if (risks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<AlertIcon className="h-5 w-5" />}
          title="No active schedule risks"
          description="No delayed stage is currently cascading risk to downstream activities in this scope."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {risks.map((risk) => {
        const trigger = activityById.get(risk.triggerId);
        const impacted = activityById.get(risk.impactedId);

        return (
          <Card key={risk.id}>
            <CardHeader className="flex-wrap gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <RiskSeverityBadge severity={risk.severity} />
                <h3 className="text-sm font-semibold text-slate-900">
                  {risk.triggerName} delay threatens {risk.impactedName}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {risk.confidence !== undefined && (
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {risk.confidence}%
                    </p>
                    <p className="text-[11px] text-slate-500">Confidence</p>
                  </div>
                )}
                <DependencyRiskStatusBadge status={risk.riskStatus} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{risk.reason}</p>

              <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Trigger activity → impacted activity ({risk.distance}{" "}
                {risk.distance === 1 ? "hop" : "hops"})
              </p>
              {trigger && impacted ? (
                <DependencyConsequence chain={[trigger, impacted]} />
              ) : (
                <p className="text-xs text-slate-400">
                  {risk.triggerCode} → {risk.impactedCode}
                </p>
              )}

              <Link
                href={`/activities/${risk.triggerId}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                View trigger activity
                <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
