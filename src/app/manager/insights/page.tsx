import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerDashboard } from "@/actions/manager";
import {
  getPeriodComparisonMetrics,
  getRecruitmentFunnelAnalytics,
  getPerformanceInsightsAndForecast,
} from "@/actions/analytics";
import { ManagerInsightsClient } from "@/components/manager/ManagerInsightsClient";

export const metadata = {
  title: "Team Insights & Coaching | E2E Manager Portal",
  description: "Leaderboard rankings, conversion ratios, period comparisons, and below-target recruiter coaching interventions.",
};

export default async function ManagerInsightsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const [res, compRes, funnelRes, insightsRes] = await Promise.all([
    getManagerDashboard(),
    getPeriodComparisonMetrics({ periodType: "DAILY" }),
    getRecruitmentFunnelAnalytics({}),
    getPerformanceInsightsAndForecast({}),
  ]);

  const teamSummary = res.success && res.data ? res.data.teamSummary : {
    teamSize: 0,
    totalCalls: 0,
    totalShortlisted: 0,
    totalLineUps: 0,
    totalOffers: 0,
    totalJoins: 0,
    targetCalls: 0,
    targetShortlists: 0,
    targetJoins: 0,
    achievementPct: 0,
    achievementBand: "No Team Members",
  };
  const rankings = res.success && res.data ? res.data.rankings : [];
  const belowTargetRecruiters = res.success && res.data ? res.data.belowTargetRecruiters : [];

  return (
    <ManagerInsightsClient
      teamSummary={teamSummary}
      rankings={rankings}
      belowTargetRecruiters={belowTargetRecruiters}
      comparison={compRes.success && compRes.data ? compRes.data : undefined}
      funnel={funnelRes.success && funnelRes.data ? funnelRes.data : undefined}
      insights={insightsRes.success && insightsRes.data ? insightsRes.data.insights : undefined}
      forecast={insightsRes.success && insightsRes.data ? insightsRes.data.forecast : undefined}
    />
  );
}
