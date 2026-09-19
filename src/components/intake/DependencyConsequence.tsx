import Link from "next/link";
import type { ScheduleActivity } from "@/types";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function DependencyConsequence({
  chain,
}: {
  chain: ScheduleActivity[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((activity, index) => (
        <div key={activity.id} className="flex items-center gap-1.5">
          <Link
            href={`/activities/${activity.id}`}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-3.5 py-3 text-center transition-colors hover:bg-slate-50",
              index === 0
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
          {index < chain.length - 1 && (
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
          )}
        </div>
      ))}
    </div>
  );
}
