import Link from "next/link";
import type { DashboardExecutionUpdate } from "@/lib/api/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export function ExecutionFeed({ updates }: { updates: DashboardExecutionUpdate[] }) {
  const items = [...updates]
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
        </li>
      ))}
    </ul>
  );
}
