"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, UserCheck, LogOut, Menu } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: "ADMIN" | "CANDIDATE" | "MANAGER";
    isCertified?: boolean;
    candidateCode?: string;
  } | null;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function Navbar({
  user,
  onLogout,
  onToggleSidebar,
  showSidebarToggle = false,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-navy-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-navy-600 hover:bg-navy-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo variant="full" size="md" />
          </Link>
        </div>

        {/* Right: User State or Login Links */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Role Indicator */}
              {user.role === "ADMIN" ? (
                <Badge variant="primary" size="md" dot>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
                  Admin Portal
                </Badge>
              ) : user.role === "MANAGER" ? (
                <Badge variant="info" size="md" dot>
                  <UserCheck className="w-3.5 h-3.5 mr-1 inline" />
                  Team Manager
                </Badge>
              ) : user.isCertified ? (
                <Badge variant="success" size="md" dot>
                  <UserCheck className="w-3.5 h-3.5 mr-1 inline" />
                  Recruiter Ready
                </Badge>
              ) : (
                <Badge variant="warning" size="md" dot>
                  Academy Trainee
                </Badge>
              )}

              {/* Notification Center */}
              <NotificationCenter />

              {/* User Identity Chip */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-navy-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-navy-500 font-mono">
                  {user.candidateCode || user.email}
                </span>
              </div>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  aria-label="Log out"
                  className="text-navy-600 hover:text-danger-600"
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Candidate Login
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="secondary" size="sm" leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  Admin Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
