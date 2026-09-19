"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { projects } from "@/lib/mock-data";
import type { Project } from "@/types";

export const ALL_PROJECTS_ID = "all";

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId: string;
  selectedProject: Project | null;
  setSelectedProjectId: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    ALL_PROJECTS_ID
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [selectedProjectId]
  );

  const value = useMemo(
    () => ({ projects, selectedProjectId, selectedProject, setSelectedProjectId }),
    [selectedProjectId, selectedProject]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return ctx;
}
