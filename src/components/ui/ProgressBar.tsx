import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const tone =
    clamped >= 100
      ? "bg-emerald-500"
      : clamped >= 60
        ? "bg-sky-500"
        : clamped >= 30
          ? "bg-amber-500"
          : "bg-rose-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={cn("h-1.5 rounded-full", barClassName ?? tone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500">
        {clamped}%
      </span>
    </div>
  );
}
