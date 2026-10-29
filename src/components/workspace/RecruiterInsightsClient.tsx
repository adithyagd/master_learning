"use client";

import React, { useState, useTransition } from "react";
import {
  PeriodComparisonResult,
  RecruitmentFunnelResult,
  PerformanceInsightItem,
  JoiningForecastResult,
  getPeriodComparisonMetrics,
} from "@/actions/analytics";
import { AnalyticsComparisonGrid } from "@/components/analytics/AnalyticsComparisonGrid";
import { RecruitmentFunnelChart } from "@/components/analytics/RecruitmentFunnelChart";
import { PerformanceInsightsBanner } from "@/components/analytics/PerformanceInsightsBanner";
import { BarChart3, Sparkles } from "lucide-react";

interface RecruiterInsightsClientProps {
  initialComparison: PeriodComparisonResult;
  funnel: RecruitmentFunnelResult;
  insights: PerformanceInsightItem[];
  forecast: JoiningForecastResult;
  recruiterName: string;
}

export function RecruiterInsightsClient({
  initialComparison,
  funnel,
  insights,
  forecast,
  recruiterName,
}: RecruiterInsightsClientProps) {
  const [comparison, setComparison] = useState<PeriodComparisonResult>(initialComparison);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: "DAILY" | "WEEKLY" | "MONTHLY") => {
    startTransition(async () => {
      const res = await getPeriodComparisonMetrics({ periodType: newPeriod });
      if (res.success && res.data) {
        setComparison(res.data);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 border border-brand-200 uppercase tracking-wider">
            Recruiter Execution Intelligence
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs text-slate-500 font-medium">{recruiterName}</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-950 mt-1">
          Personal Recruitment Insights & Funnel Velocity
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Objective conversion metrics, candidate progression ratios, and personal coaching interventions computed from verified daily operational logs.
        </p>
      </div>

      {/* 1. Period Comparison Grid */}
      <AnalyticsComparisonGrid
        comparison={comparison}
        onPeriodChange={handlePeriodChange}
        isLoading={isPending}
      />

      {/* 2. Sequential Funnel Chart */}
      <RecruitmentFunnelChart
        funnel={funnel}
        title="My Recruitment Conversion Funnel"
        subtitle="Full 9-stage progression of your active candidates from initial outreach through joined placements"
      />

      {/* 3. Diagnostic Insights & Forecast */}
      <PerformanceInsightsBanner insights={insights} forecast={forecast} />
    </div>
  );
}
