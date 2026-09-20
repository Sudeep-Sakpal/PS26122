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

// Driven by one real extracted ExecutionUpdate (POST /projects/:id/reports)
// — every field here is either present in that response or shown as "—",
// never invented. `confidence` is omitted entirely (not shown as "—")
// when the extractor didn't report one, since that's a different fact
// than "reported a zero".
export function ExtractionResult({
  activityName,
  activityCode,
  reportDate,
  actualProgress,
  reason,
  confidence,
}: {
  activityName: string;
  activityCode?: string;
  reportDate: string;
  actualProgress: number;
  reason: string;
  confidence?: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Field
        label="Activity"
        value={activityCode ? `${activityName} (${activityCode})` : activityName}
      />
      <Field label="Report date" value={formatDate(reportDate)} />
      <Field label="Actual progress" value={`${actualProgress}%`} />
      <Field label="Reason" value={reason || "—"} />
      {confidence !== undefined && (
        <Field label="Extraction confidence" value={`${confidence}%`} />
      )}
    </dl>
  );
}
