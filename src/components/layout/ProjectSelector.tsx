"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_PROJECTS_ID, useProjectContext } from "@/context/ProjectContext";
import { ChevronDownIcon } from "@/components/icons";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function ProjectSelector() {
  const { projects, selectedProjectId, selectedProject, setSelectedProjectId } =
    useProjectContext();
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

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-56 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors hover:border-slate-300 sm:w-64"
      >
        <span className="truncate">
          <span className="block truncate text-sm font-medium text-slate-800">
            {selectedProject ? selectedProject.name : "All Projects"}
          </span>
          <span className="block truncate font-mono text-[11px] text-slate-500">
            {selectedProject ? selectedProject.code : "Portfolio-wide view"}
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 w-80 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setSelectedProjectId(ALL_PROJECTS_ID);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
              selectedProjectId === ALL_PROJECTS_ID && "bg-sky-50"
            )}
          >
            <span className="font-medium text-slate-800">All Projects</span>
            <span className="text-xs text-slate-400">Portfolio view</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-slate-50",
                selectedProjectId === project.id && "bg-sky-50"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-800">
                  {project.name}
                </span>
                <ProjectStatusBadge status={project.status} />
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {project.code} · {project.location}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
