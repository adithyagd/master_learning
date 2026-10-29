"use client";

import React from "react";
import { RecruitmentFunnelResult } from "@/actions/analytics";
import { Filter, ArrowDown, TrendingDown, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecruitmentFunnelChartProps {
  funnel: RecruitmentFunnelResult;
  title?: string;
  subtitle?: string;
}

export function RecruitmentFunnelChart({
  funnel,
  title = "9-Stage Recruitment Conversion Funnel",
  subtitle = "Sequential candidate lifecycle progression from initial outreach to confirmed joining with explicit denominators",
}: RecruitmentFunnelChartProps) {
  const { stages, totalPipelineDropOff, overallThroughputRatePct } = funnel;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-navy-950">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400 block">Overall Conversion</span>
            <span className="text-base font-extrabold text-emerald-700">
              {overallThroughputRatePct}%
            </span>
          </div>
          <div className="border-l border-slate-200 pl-5">
            <span className="text-slate-400 block">Total Attrition / Drop-off</span>
            <span className="text-base font-extrabold text-slate-700">
              {totalPipelineDropOff} candidates
            </span>
          </div>
        </div>
      </div>

      {/* Funnel Stages Table / Visual Representation */}
      <div className="space-y-3" role="region" aria-label="Recruitment Conversion Funnel">
        {stages.map((stage, idx) => {
          const barWidth = Math.max(6, Math.round((stage.count / maxCount) * 100));

          // Color gradient down the funnel
          const stageColors = [
            "bg-slate-700 text-white",
            "bg-blue-600 text-white",
            "bg-indigo-600 text-white",
            "bg-purple-600 text-white",
            "bg-amber-600 text-white",
            "bg-orange-600 text-white",
            "bg-teal-600 text-white",
            "bg-emerald-600 text-white",
            "bg-emerald-700 text-white",
          ];
          const colorClass = stageColors[idx % stageColors.length];

          return (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2 font-bold text-navy-950">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                    {stage.stepNumber}
                  </span>
                  <span>{stage.stageName}</span>
                  <span className="text-slate-400 font-normal">
                    ({stage.count.toLocaleString()} candidates)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  {idx > 0 && (
                    <span className="text-slate-600">
                      Step Conv:{" "}
                      <strong className="text-navy-900">{stage.stepConversionRatePct}%</strong>{" "}
                      <span className="text-slate-400">({stage.denominatorLabel})</span>
                    </span>
                  )}
                  {idx > 0 && stage.stepDropOffRatePct > 0 && (
                    <span className="text-rose-600 font-medium flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      Drop-off: {stage.stepDropOffRatePct}%
                    </span>
                  )}
                  <span className="font-semibold text-brand-700">
                    {stage.cumulativeConversionPct}% from Calls
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="w-full bg-slate-100 rounded-lg h-7 overflow-hidden p-0.5 flex">
                <div
                  className={cn(
                    "h-full rounded-md flex items-center px-3 font-semibold text-xs transition-all duration-500",
                    colorClass
                  )}
                  style={{ width: `${barWidth}%` }}
                  role="progressbar"
                  aria-valuenow={stage.count}
                  aria-valuemin={0}
                  aria-valuemax={maxCount}
                  aria-label={`${stage.stageName}: ${stage.count}`}
                >
                  <span className="truncate">{stage.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
