"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { ProjectSelector } from "@/components/layout/ProjectSelector";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { BellIcon, MenuIcon, UserIcon } from "@/components/icons";

function usePageTitle() {
  const pathname = usePathname();
  const match = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.label ?? "Overview";
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const title = usePageTitle();

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden"
        aria-label="Toggle navigation"
      >
        <MenuIcon className="h-[18px] w-[18px]" />
      </button>

      <div className="hidden lg:block">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <GlobalSearch />

        <ProjectSelector />

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <BellIcon className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-slate-800">Site Engineer</p>
            <p className="text-[11px] text-slate-500">Field Operations</p>
          </div>
        </div>
      </div>
    </header>
  );
}
