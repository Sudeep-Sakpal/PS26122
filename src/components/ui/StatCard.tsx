import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const iconToneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-sky-50 text-sky-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
              iconToneClasses[tone]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
