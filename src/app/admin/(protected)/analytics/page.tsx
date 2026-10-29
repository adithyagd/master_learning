import React from "react";
import { prisma } from "@/lib/prisma";
import {
  getPeriodComparisonMetrics,
  getRecruitmentFunnelAnalytics,
  getPerformanceInsightsAndForecast,
} from "@/actions/analytics";
import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export const metadata = {
  title: "Funnel & Analytics | E2E Admin",
  description: "Recruitment funnel progression ratios, period comparisons, and predictive forecasting.",
};

export default async function AdminAnalyticsPage() {
  const [compRes, funnelRes, insightsRes, recruiters, clients] = await Promise.all([
    getPeriodComparisonMetrics({ periodType: "DAILY" }),
    getRecruitmentFunnelAnalytics({}),
    getPerformanceInsightsAndForecast({}),
    prisma.candidateProfile.findMany({
      select: { id: true, fullName: true, candidateId: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.clientMaster.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const comparison = compRes.success && compRes.data ? compRes.data : {
    periodType: "DAILY" as const,
    currentPeriodLabel: "Today",
    previousPeriodLabel: "Yesterday",
    currentBounds: { startDate: new Date(), endDate: new Date() },
    previousBounds: { startDate: new Date(), endDate: new Date() },
    metrics: {} as any,
  };

  const funnel = funnelRes.success && funnelRes.data ? funnelRes.data : {
    stages: [],
    totalPipelineDropOff: 0,
    overallThroughputRatePct: 0,
  };

  const insights = insightsRes.success && insightsRes.data ? insightsRes.data.insights : [];
  const forecast = insightsRes.success && insightsRes.data ? insightsRes.data.forecast : {
    isSufficientData: false,
    forecastStatus: "INSUFFICIENT_DATA" as const,
    confidenceLevel: "NONE" as const,
    distinctDaysOfData: 0,
    minimumRequiredDays: 14,
    currentMonthJoins: 0,
    targetMonthJoins: 10,
    projectedJoins: null,
    varianceFromTarget: null,
    explanation: "No data available.",
    forecastMethodology: "N/A",
  };

  return (
    <AdminAnalyticsClient
      initialComparison={comparison}
      initialFunnel={funnel}
      initialInsights={insights}
      initialForecast={forecast}
      recruitersList={recruiters}
      clientsList={clients}
    />
  );
}
