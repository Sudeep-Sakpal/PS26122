"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleActivities } from "@/lib/schedule-data";
import { projects } from "@/lib/mock-data";
import { ActivityStatusBadge } from "@/components/ui/Badge";
import { SearchIcon } from "@/components/icons";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return [];
    return scheduleActivities
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query]);

  function goTo(id: string) {
    router.push(`/activities/${id}`);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) goTo(results[0].id);
          if (e.key === "Escape") setOpen(false);
        }}
        type="search"
        placeholder="Search activities…"
        className="w-64 rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
      />

      {open && query.trim() !== "" && (
        <div className="absolute left-0 z-20 mt-1.5 w-80 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">
              No activities match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((activity) => (
              <button
                key={activity.id}
                onClick={() => goTo(activity.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {activity.name}
                  </span>
                  <span className="block font-mono text-[11px] text-slate-400">
                    {activity.code} ·{" "}
                    {projects.find((p) => p.id === activity.projectId)?.code}
                  </span>
                </span>
                <ActivityStatusBadge status={activity.status} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
