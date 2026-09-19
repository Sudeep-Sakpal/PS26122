import { cn } from "@/lib/utils";

function varianceTone(varianceValue: number) {
  if (varianceValue >= 0) return "bg-emerald-500";
  if (varianceValue >= -10) return "bg-amber-500";
  return "bg-rose-500";
}

export function PlannedActualBar({
  planned,
  actual,
  size = "md",
  showLabels = false,
  className,
}: {
  planned: number;
  actual: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}) {
  const clampedPlanned = Math.min(100, Math.max(0, planned));
  const clampedActual = Math.min(100, Math.max(0, actual));
  const varianceValue = actual - planned;
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-visible rounded-full bg-slate-100",
          height
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            varianceTone(varianceValue)
          )}
          style={{ width: `${clampedActual}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-slate-700"
          style={{ left: `calc(${clampedPlanned}% - 1.5px)` }}
          title={`Planned: ${planned}%`}
        />
      </div>
      {showLabels && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Actual{" "}
            <span className="font-semibold tabular-nums text-slate-700">
              {clampedActual}%
            </span>
          </span>
          <span>
            Planned{" "}
            <span className="font-semibold tabular-nums text-slate-700">
              {clampedPlanned}%
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
