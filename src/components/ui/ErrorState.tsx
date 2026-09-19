"use client";

import { AlertIcon, RefreshIcon } from "@/components/icons";

export function ErrorState({
  title = "Something went wrong",
  description = "This section couldn't be loaded. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
