import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const PROCESSING_STEPS = [
  "Reading document",
  "Extracting information",
  "Identifying activity",
  "Linking to schedule",
  "Comparing planned vs. actual",
  "Detecting downstream risk",
];

export function ProcessingSteps({
  currentIndex,
  complete,
}: {
  currentIndex: number;
  complete: boolean;
}) {
  return (
    <ol>
      {PROCESSING_STEPS.map((label, index) => {
        const isDone = complete || index < currentIndex;
        const isActive = !complete && index === currentIndex;

        return (
          <li key={label} className="flex items-center gap-3 py-1.5">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                isDone
                  ? "bg-emerald-500 text-white"
                  : isActive
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-400"
              )}
            >
              {isDone ? (
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : isActive ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                isDone
                  ? "text-slate-600"
                  : isActive
                    ? "font-medium text-slate-900"
                    : "text-slate-400"
              )}
            >
              {label}
            </span>
            {isActive && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-sky-600">
                <span className="h-1.5 w-1.5 animate-spin rounded-full border-[1.5px] border-sky-600 border-t-transparent" />
                Processing…
              </span>
            )}
            {isDone && !complete && (
              <span className="ml-auto text-xs text-emerald-600">Done</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
