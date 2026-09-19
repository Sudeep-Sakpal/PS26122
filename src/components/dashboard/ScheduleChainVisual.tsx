import Link from "next/link";
import type { ScheduleActivity } from "@/types";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { PlannedActualBar } from "@/components/dashboard/PlannedActualBar";
import { cn } from "@/lib/utils";

const nodeTone: Record<ScheduleActivity["status"], string> = {
  "not-started": "bg-slate-300",
  "in-progress": "bg-sky-500",
  completed: "bg-emerald-500",
  delayed: "bg-rose-500",
  "at-risk": "bg-amber-500",
  blocked: "bg-rose-500",
};

export function ScheduleChainVisual({
  activities,
}: {
  activities: ScheduleActivity[];
}) {
  const byId = new Map(activities.map((a) => [a.id, a]));

  return (
    <div className="px-5 py-4">
      <ol className="relative">
        {activities.map((activity, index) => {
          const isLast = index === activities.length - 1;
          const predecessor = activity.dependsOn
            .map((id) => byId.get(id)?.name)
            .filter(Boolean)
            .join(", ");

          return (
            <li key={activity.id} className="relative pb-6 pl-9 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[9px] top-5 h-full w-px bg-slate-200"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full text-[10px] font-semibold text-white ring-4 ring-white",
                  nodeTone[activity.status]
                )}
              >
                {activity.sequence}
              </span>

              <Link
                href={`/activities/${activity.id}`}
                className="block rounded-md p-2.5 -m-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-slate-800">
                      {activity.name}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">
                      {activity.code}
                    </span>
                    {predecessor && (
                      <span className="ml-2 text-[11px] text-slate-400">
                        after {predecessor}
                      </span>
                    )}
                  </div>
                  <ActivityStatusBadge status={activity.status} />
                </div>

                <PlannedActualBar
                  planned={activity.planned}
                  actual={activity.actual}
                  showLabels
                  className="mt-2.5 max-w-md"
                />

                {activity.riskReason && (
                  <p className="mt-2 max-w-2xl text-xs text-slate-500">
                    <span
                      className={cn(
                        "mr-1 font-medium",
                        activity.status === "delayed"
                          ? "text-rose-600"
                          : "text-amber-600"
                      )}
                    >
                      {activity.status === "delayed"
                        ? `${activity.delayDays}-day slip —`
                        : "Downstream risk —"}
                    </span>
                    {activity.riskReason}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
