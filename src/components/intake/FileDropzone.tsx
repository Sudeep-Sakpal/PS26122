"use client";

import { useRef, useState } from "react";
import { CloseIcon, FileIcon, UploadCloudIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileDropzone({
  label,
  hint,
  accept,
  file,
  disabled,
  onSelect,
  onClear,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const selected = files?.[0];
    if (selected) onSelect(selected);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
          <FileIcon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {file.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatBytes(file.size)} · Ready to process
          </p>
        </div>
        {!disabled && (
          <button
            onClick={onClear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={`Remove ${label}`}
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          inputRef.current?.click();
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50/60 opacity-60"
          : isDragging
            ? "cursor-pointer border-sky-400 bg-sky-50"
            : "cursor-pointer border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/60"
      )}
    >
      <UploadCloudIcon className="h-5 w-5 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
