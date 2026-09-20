"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchProjectActivities, fetchProjects } from "@/lib/api/projects";
import type { Project, ScheduleActivity } from "@/types";

export const ALL_PROJECTS_ID = "all";

interface ProjectContextValue {
  projects: Project[];
  activities: ScheduleActivity[];
  selectedProjectId: string;
  selectedProject: Project | null;
  setSelectedProjectId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    ALL_PROJECTS_ID
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const projectList = await fetchProjects();
        const activityLists = await Promise.all(
          projectList.map((p) => fetchProjectActivities(p.id))
        );
        if (cancelled) return;
        setProjects(projectList);
        setActivities(activityLists.flat());
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load project data."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const value = useMemo(
    () => ({
      projects,
      activities,
      selectedProjectId,
      selectedProject,
      setSelectedProjectId,
      isLoading,
      error,
      refetch,
    }),
    [projects, activities, selectedProjectId, selectedProject, isLoading, error, refetch]
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
