"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  FileText,
  CheckSquare,
  Target,
  Users,
  Clock,
  BarChart3,
  Briefcase,
  User,
  LayoutDashboard,
  UserPlus,
  Award,
  GraduationCap,
  Building2,
  CheckCircle2,
  Crosshair,
  PieChart,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { WORKSPACE_NAV_ITEMS, ADMIN_NAV_ITEMS, MANAGER_NAV_ITEMS } from "@/lib/design-system";

export interface SidebarProps {
  type: "workspace" | "admin" | "manager";
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const ICON_MAP = {
  CalendarCheck,
  FileText,
  CheckSquare,
  Target,
  Users,
  Clock,
  BarChart3,
  Briefcase,
  User,
  LayoutDashboard,
  UserPlus,
  Award,
  GraduationCap,
  Building2,
  CheckCircle2,
  Crosshair,
  PieChart,
  ShieldCheck,
  TrendingUp,
};

export function Sidebar({ type, isOpen = false, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const navItems =
    type === "workspace"
      ? WORKSPACE_NAV_ITEMS
      : type === "manager"
      ? MANAGER_NAV_ITEMS
      : ADMIN_NAV_ITEMS;

  const title =
    type === "workspace"
      ? "Operations Workspace"
      : type === "manager"
      ? "Manager Portal"
      : "Admin Center";

  const subtitle =
    type === "workspace"
      ? "Recruiter Execution Portal"
      : type === "manager"
      ? "Team Leadership & Approvals"
      : "Platform Governance & Approvals";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-navy-200 transition-transform duration-200 ease-in-out flex flex-col justify-between",
          "lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-navy-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-500">
                {title}
              </h2>
              <p className="text-[11px] text-navy-400 mt-0.5">{subtitle}</p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-100"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label={`${title} navigation`}>
            {navItems.map((item) => {
              const IconComponent =
                ICON_MAP[item.icon as keyof typeof ICON_MAP] || FileText;
              const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none",
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600 rounded-l-none"
                      : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-brand-600" : "text-navy-400"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info badge */}
        <div className="p-4 border-t border-navy-100 bg-navy-50/50">
          <div className="text-[10px] text-navy-500 leading-tight">
            <span className="font-semibold text-navy-700">E2E Procurement Pvt Ltd</span>
            <br />
            Bangalore &bull; CIN: U78300KA2025PTC204064
          </div>
        </div>
      </aside>
    </>
  );
}
