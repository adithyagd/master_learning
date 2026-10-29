import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedRecruiter } from "@/actions/workspace";
import {
  getPeriodComparisonMetrics,
  getRecruitmentFunnelAnalytics,
  getPerformanceInsightsAndForecast,
} from "@/actions/analytics";
import { RecruiterInsightsClient } from "@/components/workspace/RecruiterInsightsClient";

export const metadata = {
  title: "Recruitment Insights | Operations Workspace",
  description: "Objective conversion metrics, candidate progression ratios, and personal coaching interventions.",
};

export default async function WorkspaceInsightsPage() {
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  const [compRes, funnelRes, insightsRes] = await Promise.all([
    getPeriodComparisonMetrics({ periodType: "DAILY" }),
    getRecruitmentFunnelAnalytics({}),
    getPerformanceInsightsAndForecast({}),
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
    <RecruiterInsightsClient
      initialComparison={comparison}
      funnel={funnel}
      insights={insights}
      forecast={forecast}
      recruiterName={recruiter.fullName}
    />
  );
}
