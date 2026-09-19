import Link from "next/link";
import type { ScheduleActivity } from "@/types";
import { ActivityStatusBadge } from "@/components/ui/Badge";
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

export function MatchResult({
  activity,
  confidence,
}: {
  activity: ScheduleActivity;
  confidence: number;
}) {
  const varianceValue = activity.actual - activity.planned;
  const confidenceTone =
    confidence >= 90
      ? "text-emerald-600"
      : confidence >= 75
        ? "text-amber-600"
        : "text-rose-600";
  const varianceTone =
    varianceValue >= 0
      ? "text-emerald-600"
      : varianceValue >= -10
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
            <LinkIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {activity.code} — {activity.name}
            </p>
            <p className="text-xs text-slate-500">Matched schedule activity</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-semibold tabular-nums", confidenceTone)}>
            {confidence}%
          </p>
          <p className="text-xs text-slate-500">Match confidence</p>
        </div>
      </div>

      <PlannedActualBar
        planned={activity.planned}
        actual={activity.actual}
        size="lg"
        showLabels
        className="mt-5"
      />

      <div className="mt-5 grid grid-cols-3 gap-4 text-center">
        <Stat label="Planned" value={`${activity.planned}%`} />
        <Stat label="Actual" value={`${activity.actual}%`} />
        <Stat
          label="Variance"
          value={`${varianceValue > 0 ? "+" : ""}${varianceValue}%`}
          tone={varianceTone}
        />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Resulting status
        </span>
        <ActivityStatusBadge status={activity.status} />
      </div>

      <Link
        href={`/activities/${activity.id}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
      >
        View full activity
        <ChevronRightIcon className="h-3 w-3" />
      </Link>
    </div>
  );
}
