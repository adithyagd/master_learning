"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  PeriodComparisonResult,
  RecruitmentFunnelResult,
  PerformanceInsightItem,
  JoiningForecastResult,
  getPeriodComparisonMetrics,
  getRecruitmentFunnelAnalytics,
} from "@/actions/analytics";
import { AnalyticsComparisonGrid } from "@/components/analytics/AnalyticsComparisonGrid";
import { RecruitmentFunnelChart } from "@/components/analytics/RecruitmentFunnelChart";
import { PerformanceInsightsBanner } from "@/components/analytics/PerformanceInsightsBanner";
import { PieChart, Filter, RotateCcw, Building2, User } from "lucide-react";

interface AdminAnalyticsClientProps {
  initialComparison: PeriodComparisonResult;
  initialFunnel: RecruitmentFunnelResult;
  initialInsights: PerformanceInsightItem[];
  initialForecast: JoiningForecastResult;
  recruitersList: Array<{ id: string; fullName: string; candidateId: string }>;
  clientsList: Array<{ id: string; name: string; code: string }>;
}

export function AdminAnalyticsClient({
  initialComparison,
  initialFunnel,
  initialInsights,
  initialForecast,
  recruitersList,
  clientsList,
}: AdminAnalyticsClientProps) {
  const [comparison, setComparison] = useState<PeriodComparisonResult>(initialComparison);
  const [funnel, setFunnel] = useState<RecruitmentFunnelResult>(initialFunnel);
  const [insights, setInsights] = useState<PerformanceInsightItem[]>(initialInsights);
  const [forecast, setForecast] = useState<JoiningForecastResult>(initialForecast);

  const [periodType, setPeriodType] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    initialComparison.periodType
  );
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: "DAILY" | "WEEKLY" | "MONTHLY") => {
    setPeriodType(newPeriod);
    startTransition(async () => {
      const res = await getPeriodComparisonMetrics({
        periodType: newPeriod,
        recruiterProfileId: selectedRecruiter || undefined,
        clientId: selectedClient || undefined,
      });
      if (res.success && res.data) {
        setComparison(res.data);
      }
    });
  };

  const handleFilterApply = (recruiterId: string, clientId: string) => {
    setSelectedRecruiter(recruiterId);
    setSelectedClient(clientId);
    startTransition(async () => {
      const [compRes, funnelRes] = await Promise.all([
        getPeriodComparisonMetrics({
          periodType,
          recruiterProfileId: recruiterId || undefined,
          clientId: clientId || undefined,
        }),
        getRecruitmentFunnelAnalytics({
          recruiterProfileId: recruiterId || undefined,
          clientId: clientId || undefined,
        }),
      ]);

      if (compRes.success && compRes.data) setComparison(compRes.data);
      if (funnelRes.success && funnelRes.data) setFunnel(funnelRes.data);
    });
  };

  const handleResetFilters = () => {
    setSelectedRecruiter("");
    setSelectedClient("");
    setPeriodType("DAILY");
    startTransition(async () => {
      const [compRes, funnelRes] = await Promise.all([
        getPeriodComparisonMetrics({ periodType: "DAILY" }),
        getRecruitmentFunnelAnalytics({}),
      ]);
      if (compRes.success && compRes.data) setComparison(compRes.data);
      if (funnelRes.success && funnelRes.data) setFunnel(funnelRes.data);
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
              Analytics Center
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-950 mt-1">
            Recruitment Funnel & Performance Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Data-driven comparisons, step-by-step funnel drop-offs, diagnostic bottleneck alerts, and honest joining forecasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Scope Filters:
            </span>
          </div>

          <div>
            <select
              value={selectedRecruiter}
              onChange={(e) => handleFilterApply(e.target.value, selectedClient)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Platform Recruiters</option>
              {recruitersList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.candidateId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClient}
              onChange={(e) => handleFilterApply(selectedRecruiter, e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Client Mandates</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* 1. Period Comparison Grid */}
      <AnalyticsComparisonGrid
        comparison={comparison}
        onPeriodChange={handlePeriodChange}
        isLoading={isPending}
      />

      {/* 2. 9-Stage Sequential Funnel Chart */}
      <RecruitmentFunnelChart funnel={funnel} />

      {/* 3. Performance Insights & Joining Forecast */}
      <PerformanceInsightsBanner insights={insights} forecast={forecast} />
    </div>
  );
}
