"use client";

import React from "react";
import { PeriodComparisonResult, MetricComparisonItem } from "@/actions/analytics";
import {
  PhoneCall,
  UserPlus,
  Users,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsComparisonGridProps {
  comparison: PeriodComparisonResult;
  onPeriodChange?: (period: "DAILY" | "WEEKLY" | "MONTHLY") => void;
  isLoading?: boolean;
}

const METRIC_ICONS: Record<string, React.ElementType> = {
  calls: PhoneCall,
  ownLeads: UserPlus,
  internalLeads: Users,
  screened: CheckCircle2,
  shortlisted: Users,
  interviewLineup: CalendarCheck,
  interviewAttended: CalendarCheck,
  offers: TrendingUp,
  joins: Award,
  absconded: AlertTriangle,
};

export function AnalyticsComparisonGrid({
  comparison,
  onPeriodChange,
  isLoading = false,
}: AnalyticsComparisonGridProps) {
  const { periodType, currentPeriodLabel, previousPeriodLabel, metrics } = comparison;

  return (
    <div className="space-y-4">
      {/* Header with Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              Operational Period Comparison
            </h3>
            {isLoading && (
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparing <span className="font-semibold text-navy-900">{currentPeriodLabel}</span> against previous baseline <span className="font-semibold text-slate-700">{previousPeriodLabel}</span>
          </p>
        </div>

        {onPeriodChange && (
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onPeriodChange("DAILY")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                periodType === "DAILY"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-600 hover:text-navy-900"
              )}
            >
              Daily (Today vs Yest.)
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange("WEEKLY")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                periodType === "WEEKLY"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-600 hover:text-navy-900"
              )}
            >
              Weekly (Week vs Last)
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange("MONTHLY")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                periodType === "MONTHLY"
                  ? "bg-white text-navy-950 shadow-xs"
                  : "text-slate-600 hover:text-navy-900"
              )}
            >
              Monthly (Month vs Last)
            </button>
          </div>
        )}
      </div>

      {/* 10 Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(metrics).map(([key, item]) => {
          const Icon = METRIC_ICONS[key] || TrendingUp;
          const isAbsconded = key === "absconded";

          // For positive growth: good for most, but inverted for absconded
          const isPositiveTrend = isAbsconded
            ? item.trend === "down"
            : item.trend === "up";
          const isNegativeTrend = isAbsconded
            ? item.trend === "up"
            : item.trend === "down";

          return (
            <div
              key={key}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-navy-950">{item.current}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    prev: {item.previous}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Absolute Change */}
                <span className="text-[11px] font-medium text-slate-500">
                  &Delta; {item.absoluteChange > 0 ? `+${item.absoluteChange}` : item.absoluteChange}
                </span>

                {/* Percentage Growth Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    item.isNew
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : isPositiveTrend
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isNegativeTrend
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  )}
                >
                  {item.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                  {item.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                  {item.trend === "neutral" && <Minus className="w-3 h-3" />}
                  <span>{item.formattedGrowth}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
