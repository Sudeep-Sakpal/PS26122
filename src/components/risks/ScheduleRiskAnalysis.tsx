import Link from "next/link";
import type { ScheduleRisk } from "@/lib/schedule-data";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RiskSeverityBadge, RiskStatusBadge } from "@/components/ui/Badge";
import { DependencyConsequence } from "@/components/intake/DependencyConsequence";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertIcon, ChevronRightIcon } from "@/components/icons";

export function ScheduleRiskAnalysis({ risks }: { risks: ScheduleRisk[] }) {
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
      {risks.map((risk) => (
        <Card key={risk.id}>
          <CardHeader className="flex-wrap gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskSeverityBadge severity={risk.severity} />
              <h3 className="text-sm font-semibold text-slate-900">
                {risk.trigger.name} delay threatens downstream schedule
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-800">
                  {risk.confidence}%
                </p>
                <p className="text-[11px] text-slate-500">Confidence</p>
              </div>
              <RiskStatusBadge status={risk.status} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{risk.reason}</p>

            <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              Trigger activity → impacted activities
            </p>
            <DependencyConsequence chain={[risk.trigger, ...risk.impacted]} />

            <Link
              href={`/activities/${risk.trigger.id}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              View trigger activity
              <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
