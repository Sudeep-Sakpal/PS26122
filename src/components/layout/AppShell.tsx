"use client";

import { useState } from "react";
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CloseIcon } from "@/components/icons";
import { useProjectContext } from "@/context/ProjectContext";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isLoading, error, refetch } = useProjectContext();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 bg-slate-900">
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-screen w-full flex-1 flex-col lg:min-w-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {error ? (
              <Card>
                <ErrorState
                  title="Couldn't load project data"
                  description={error}
                  onRetry={refetch}
                />
              </Card>
            ) : isLoading ? (
              <Card>
                <LoadingState />
              </Card>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
