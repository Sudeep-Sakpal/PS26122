import Link from "next/link";
import type { ActivityComparison } from "@/lib/api/activities";
import { DelayStatusBadge } from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { ChevronRightIcon, LinkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className={cn("text-xl font-semibold tabular-nums text-slate-900", tone)}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// Driven entirely by a real B3 match result (POST .../execution-updates/:id/link)
// and, once it resolves, the matched activity's real B3 comparison
// (GET .../activities/:activityId/comparison) — `comparison` is `null`
// until that second call finishes, so the planned/actual/variance section
// is simply omitted rather than showing a fabricated placeholder.
export function MatchResult({
  activityId,
  activityCode,
  activityName,
  confidence,
  matchMethod,
  comparison,
}: {
  activityId: string;
  activityCode: string;
  activityName: string;
  confidence: number;
  matchMethod: string;
  comparison: ActivityComparison | null;
}) {
  const confidenceTone =
    confidence >= 90
      ? "text-emerald-600"
      : confidence >= 75
        ? "text-amber-600"
        : "text-rose-600";
  const varianceTone =
    comparison && comparison.variance !== null
      ? comparison.variance >= 0
        ? "text-emerald-600"
        : comparison.variance >= -10
          ? "text-amber-600"
          : "text-rose-600"
      : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
            <LinkIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {activityCode} — {activityName}
            </p>
            <p className="text-xs text-slate-500">
              Matched via <span className="font-mono">{matchMethod}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-semibold tabular-nums", confidenceTone)}>
            {confidence}%
          </p>
          <p className="text-xs text-slate-500">Match confidence</p>
        </div>
      </div>

      {comparison && (
        <>
          <PlannedActualBar
            planned={comparison.plannedProgress}
            actual={comparison.actualProgress ?? 0}
            size="lg"
            showLabels
            className="mt-5"
          />

          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            <Stat label="Planned" value={`${comparison.plannedProgress}%`} />
            <Stat
              label="Actual"
              value={
                comparison.actualProgress !== null
                  ? `${comparison.actualProgress}%`
                  : "—"
              }
            />
            <Stat
              label="Variance"
              value={
                comparison.variance !== null
                  ? `${comparison.variance > 0 ? "+" : ""}${comparison.variance}%`
                  : "—"
              }
              tone={varianceTone}
            />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Resulting status
            </span>
            <DelayStatusBadge status={comparison.status} />
          </div>
        </>
      )}

      <Link
        href={`/activities/${activityId}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
      >
        View full activity
        <ChevronRightIcon className="h-3 w-3" />
      </Link>
    </div>
  );
}
