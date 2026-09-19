import Link from "next/link";
import type { ScheduleActivity } from "@/types";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function DependencyConsequence({
  chain,
  currentId,
}: {
  chain: ScheduleActivity[];
  /** Marks a specific node as "you are here", independent of trigger styling. */
  currentId?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((activity, index) => (
        <div key={activity.id} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <Link
              href={`/activities/${activity.id}`}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-3.5 py-3 text-center transition-colors hover:bg-slate-50",
                activity.id === currentId
                  ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200"
                  : index === 0
                    ? "border-slate-300 bg-slate-50"
                    : activity.status === "at-risk"
                      ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200"
                      : activity.status === "delayed"
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200 bg-white"
              )}
            >
              <span className="text-sm font-medium text-slate-800">
                {activity.name}
              </span>
              <ActivityStatusBadge status={activity.status} />
            </Link>
            {activity.id === currentId && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-sky-600">
                You are here
              </span>
            )}
          </div>
          {index < chain.length - 1 && (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
          )}
        </div>
      ))}
    </div>
  );
}
