import Link from "next/link";
import type { ScheduleActivity } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface FeedItem {
  id: string;
  date: string;
  author: string;
  note: string;
  activityId: string;
  activityName: string;
}

export function ExecutionFeed({ activities }: { activities: ScheduleActivity[] }) {
  const items: FeedItem[] = activities
    .flatMap((activity) =>
      activity.updates.map((update) => ({
        ...update,
        activityId: activity.id,
        activityName: activity.name,
      }))
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No execution updates yet"
        description="Field updates linked to this project's schedule will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="px-5 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/activities/${item.activityId}`}
              className="text-xs font-semibold text-slate-700 hover:text-sky-600"
            >
              {item.activityName}
            </Link>
            <span className="text-[11px] text-slate-400">
              {formatDate(item.date)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.note}</p>
          <p className="mt-1 text-[11px] text-slate-400">{item.author}</p>
        </li>
      ))}
    </ul>
  );
}
