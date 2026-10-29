import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "compact" | "icon" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const isWhite = variant === "white";

  return (
    <div className={cn("inline-flex items-center gap-2.5 font-sans select-none", className)}>
      {/* Precision Geometric SVG Emblem representing End-to-End connectivity */}
      <svg
        className={cn("flex-shrink-0 transition-transform duration-200", iconSizes[size])}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="E2E Procurement Logo Emblem"
      >
        <rect width="40" height="40" rx="10" fill={isWhite ? "#2563EB" : "#0F172A"} />
        {/* Connecting E2E nodes and circuit line */}
        <path
          d="M10 20H30"
          stroke={isWhite ? "#FFFFFF" : "#38BDF8"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="20" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="28" cy="20" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
        <path
          d="M18 14L23 20L18 26"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {variant !== "icon" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-extrabold tracking-tight",
                textSizes[size],
                isWhite ? "text-white" : "text-navy-900"
              )}
            >
              E2E
            </span>
            <span
              className={cn(
                "font-semibold tracking-wider uppercase text-xs px-1.5 py-0.5 rounded",
                isWhite
                  ? "bg-white/20 text-blue-100"
                  : "bg-brand-50 text-brand-700 font-bold border border-brand-200"
              )}
            >
              PROCUREMENT
            </span>
          </div>
          {variant === "full" && (
            <span
              className={cn(
                "text-[10px] tracking-wide mt-1 font-medium",
                isWhite ? "text-slate-300" : "text-navy-500"
              )}
            >
              Recruiter Academy & Operations
            </span>
          )}
        </div>
      )}
    </div>
  );
}
