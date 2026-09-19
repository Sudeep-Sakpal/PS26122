import type { ScheduleActivity } from "@/types";
import { formatDate } from "@/lib/utils";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export function ExtractionResult({
  activity,
  reportDate,
  reportReason,
}: {
  activity: ScheduleActivity;
  reportDate: string;
  reportReason: string;
}) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Field label="Activity" value={activity.name} />
      <Field label="Report date" value={formatDate(reportDate)} />
      <Field label="Actual progress" value={`${activity.actual}%`} />
      <Field label="Reason" value={reportReason} />
    </dl>
  );
}
