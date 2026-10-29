"use client";

import React from "react";
import { PerformanceInsightItem, JoiningForecastResult } from "@/actions/analytics";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Target,
  ShieldAlert,
  Info,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceInsightsBannerProps {
  insights: PerformanceInsightItem[];
  forecast: JoiningForecastResult;
}

export function PerformanceInsightsBanner({
  insights,
  forecast,
}: PerformanceInsightsBannerProps) {
  return (
    <div className="space-y-6">
      {/* 1. Automated Diagnostic Insights & Bottleneck Warnings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
            Diagnostic Performance Insights & Bottleneck Alerts
          </h3>
        </div>

        {insights.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center text-xs text-slate-500 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <span className="font-semibold text-slate-700">No Critical Pipeline Bottlenecks Detected</span>
            <p className="mt-0.5 text-slate-400">
              Operations conversion ratios and attendance metrics are currently within expected thresholds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((item) => {
              const borderColors: Record<string, string> = {
                danger: "border-rose-200 bg-rose-50/50",
                warning: "border-amber-200 bg-amber-50/50",
                info: "border-blue-200 bg-blue-50/50",
                success: "border-emerald-200 bg-emerald-50/50",
              };

              const badgeColors: Record<string, string> = {
                danger: "bg-rose-100 text-rose-800 border-rose-300",
                warning: "bg-amber-100 text-amber-800 border-amber-300",
                info: "bg-blue-100 text-blue-800 border-blue-300",
                success: "bg-emerald-100 text-emerald-800 border-emerald-300",
              };

              const Icon =
                item.severity === "danger"
                  ? ShieldAlert
                  : item.severity === "warning"
                  ? AlertTriangle
                  : item.severity === "success"
                  ? CheckCircle2
                  : Info;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-4.5 shadow-xs flex flex-col justify-between space-y-3",
                    borderColors[item.severity] || "border-slate-200 bg-white"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            item.severity === "danger"
                              ? "text-rose-600"
                              : item.severity === "warning"
                              ? "text-amber-600"
                              : item.severity === "success"
                              ? "text-emerald-600"
                              : "text-blue-600"
                          )}
                        />
                        <h4 className="text-xs font-bold text-navy-950">{item.title}</h4>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          badgeColors[item.severity]
                        )}
                      >
                        {item.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.diagnostic}
                    </p>
                  </div>

                  <div className="p-3 bg-white/80 rounded-lg border border-slate-200/60 text-xs">
                    <span className="font-bold text-navy-950 block text-[11px] mb-0.5">
                      Recommended Intervention:
                    </span>
                    <span className="text-slate-600 leading-relaxed">{item.recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Honest Joining Forecast with Data Sufficiency */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-navy-950">Joining Forecast & Pacing Model</h3>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    forecast.isSufficientData
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  )}
                >
                  {forecast.forecastStatus.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Projections are probabilistic estimates based on active throughput without fabricating data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block">Current Joins</span>
              <span className="text-base font-bold text-navy-900">{forecast.currentMonthJoins}</span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-slate-400 block">Monthly Target</span>
              <span className="text-base font-bold text-navy-900">{forecast.targetMonthJoins}</span>
            </div>
            {forecast.projectedJoins !== null && (
              <div className="border-l border-slate-200 pl-6">
                <span className="text-slate-400 block">Projected End-of-Month</span>
                <span className="text-base font-bold text-purple-700">{forecast.projectedJoins} Joins</span>
              </div>
            )}
          </div>
        </div>

        {/* Forecast Status Body */}
        {!forecast.isSufficientData ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Data Baseline Requirements In Progress</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{forecast.explanation}</p>
            <div className="text-[11px] text-slate-400 pt-1">
              Recorded: <strong className="text-slate-600">{forecast.distinctDaysOfData} days</strong> &bull;
              Required: <strong className="text-slate-600">{forecast.minimumRequiredDays} days</strong> for high-confidence projection
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                Projection: {forecast.projectedJoins} End-of-Month Placements
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                Confidence: {forecast.confidenceLevel}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{forecast.explanation}</p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-purple-200/50">
              Methodology: {forecast.forecastMethodology}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
