"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav-items";
import {
  ActivitiesIcon,
  DashboardIcon,
  IntakeIcon,
  RisksIcon,
} from "@/components/icons";
import type { NavItem } from "@/types";

const iconMap: Record<NavItem["icon"], typeof DashboardIcon> = {
  dashboard: DashboardIcon,
  intake: IntakeIcon,
  activities: ActivitiesIcon,
  risks: RisksIcon,
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500 font-mono text-sm font-bold text-white">
          IL
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">InfraLink</p>
          <p className="text-[11px] text-slate-400">Project Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4">
        <p className="text-[11px] text-slate-500">
          SIH 2026 · PS 26122
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-600">
          build 0.1.0-prototype
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 lg:flex">
      <SidebarContent />
    </aside>
  );
}
