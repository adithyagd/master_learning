"use client";

import React, { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
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

interface TeamMemberRanking {
  recruiterId: string;
  fullName: string;
  candidateId: string;
  calls: number;
  shortlisted: number;
  lineUp: number;
  offers: number;
  joins: number;
  achievementPct: number;
  achievementBand: string;
}

interface ManagerInsightsClientProps {
  teamSummary: {
    teamSize: number;
    totalCalls: number;
    totalShortlisted: number;
    totalLineUps: number;
    totalOffers: number;
    totalJoins: number;
    targetCalls: number;
    targetShortlists: number;
    targetJoins: number;
    achievementPct: number;
    achievementBand: string;
  };
  rankings: TeamMemberRanking[];
  belowTargetRecruiters: Array<{
    recruiterId: string;
    fullName: string;
    candidateId: string;
    achievementPct: number;
    achievementBand: string;
    calls: number;
    shortlisted: number;
  }>;
  comparison?: PeriodComparisonResult;
  funnel?: RecruitmentFunnelResult;
  insights?: PerformanceInsightItem[];
  forecast?: JoiningForecastResult;
}

export function ManagerInsightsClient({
  teamSummary,
  rankings,
  belowTargetRecruiters,
  comparison: initialComparison,
  funnel,
  insights,
  forecast,
}: ManagerInsightsClientProps) {
  const [comparison, setComparison] = useState<PeriodComparisonResult | undefined>(
    initialComparison
  );
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: "DAILY" | "WEEKLY" | "MONTHLY") => {
    startTransition(async () => {
      const res = await getPeriodComparisonMetrics({ periodType: newPeriod });
      if (res.success && res.data) {
        setComparison(res.data);
      }
    });
  };

  // Conversion Ratios (strict 0 if denominator 0)
  const lineupToAttendedPct =
    teamSummary.totalLineUps > 0
      ? Math.round((teamSummary.totalOffers / teamSummary.totalLineUps) * 100)
      : 0;

  const offerToJoinPct =
    teamSummary.totalOffers > 0
      ? Math.round((teamSummary.totalJoins / teamSummary.totalOffers) * 100)
      : 0;

  const callsToShortlistPct =
    teamSummary.totalCalls > 0
      ? Math.round((teamSummary.totalShortlisted / teamSummary.totalCalls) * 100)
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
            <TrendingUp className="w-5 h-5 text-indigo-700" />
          </span>
          <h1 className="text-2xl font-bold text-navy-950">Team Performance Insights & Coaching</h1>
        </div>
        <p className="text-sm text-navy-600 mt-1">
          In-depth recruitment funnel ratios, leaderboard analysis, and targeted coaching interventions.
        </p>
      </div>

      {/* Period Comparison Grid (if provided) */}
      {comparison && (
        <AnalyticsComparisonGrid
          comparison={comparison}
          onPeriodChange={handlePeriodChange}
          isLoading={isPending}
        />
      )}

      {/* 9-Stage Funnel (if provided) */}
      {funnel && (
        <RecruitmentFunnelChart
          funnel={funnel}
          title="Team Recruitment Conversion Funnel"
          subtitle="9-stage aggregate velocity across all recruiters under your direct supervision"
        />
      )}

      {/* Automated Diagnostic Insights & Forecast (if provided) */}
      {insights && forecast && (
        <PerformanceInsightsBanner insights={insights} forecast={forecast} />
      )}

      {/* Funnel Conversion Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-navy-100 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
              Outreach Conversion
            </span>
            <div className="text-2xl font-bold text-navy-950 mt-1">{callsToShortlistPct}%</div>
            <p className="text-xs text-navy-600 mt-1">
              Calls to Shortlist ratio ({teamSummary.totalShortlisted} shortlists / {teamSummary.totalCalls} calls)
            </p>
          </CardContent>
        </Card>

        <Card className="border-navy-100 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
              Lineup-to-Offer
            </span>
            <div className="text-2xl font-bold text-navy-950 mt-1">{lineupToAttendedPct}%</div>
            <p className="text-xs text-navy-600 mt-1">
              Interview Lineups leading to formal offers
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Offer-to-Join
            </span>
            <div className="text-2xl font-bold text-emerald-950 mt-1">{offerToJoinPct}%</div>
            <p className="text-xs text-emerald-700 mt-1">
              Offer acceptance & onboarding completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Below-Target Coaching Interventions */}
      <Card className="border-amber-200 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-amber-100 bg-amber-50/50">
          <CardTitle className="text-base text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Recruiter Coaching & Intervention Queue
          </CardTitle>
          <CardDescription className="text-xs text-amber-800">
            Recruiters needing priority managerial guidance based on target achievement bands.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {belowTargetRecruiters.length === 0 ? (
            <div className="text-center py-6 text-xs text-emerald-700 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              <p className="font-semibold">All team recruiters are meeting or exceeding baseline target expectations!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {belowTargetRecruiters.map((rec) => (
                <div
                  key={rec.recruiterId}
                  className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 text-sm">{rec.fullName}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {rec.candidateId}
                      </Badge>
                      <Badge variant="danger" className="text-[10px]">
                        {rec.achievementBand} ({rec.achievementPct}%)
                      </Badge>
                    </div>
                    <p className="text-navy-600 text-xs mt-1">
                      Logged {rec.calls} calls and {rec.shortlisted} shortlisted candidates so far.
                    </p>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-amber-100 text-[11px] text-amber-950 max-w-sm flex items-start gap-1.5 shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Recommended Action: Review candidate boolean strings and practice telephonic pitch calibration.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recruiter Ranking Table */}
      <Card className="border-navy-100 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-navy-100">
          <CardTitle className="text-base text-navy-950">Team Leaderboard</CardTitle>
          <CardDescription className="text-xs text-navy-500">
            Ranked by overall conversion effectiveness and joining delivery.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4 text-center">Calls</th>
                <th className="py-3 px-4 text-center">Shortlisted</th>
                <th className="py-3 px-4 text-center">Line-ups</th>
                <th className="py-3 px-4 text-center">Offers</th>
                <th className="py-3 px-4 text-center">Joined</th>
                <th className="py-3 px-4 text-center">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {rankings.map((rec, idx) => (
                <tr key={rec.recruiterId} className="hover:bg-navy-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy-900">#{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-navy-950">
                    <div>{rec.fullName}</div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {rec.candidateId}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{rec.calls}</td>
                  <td className="py-3 px-4 text-center font-mono">{rec.shortlisted}</td>
                  <td className="py-3 px-4 text-center font-mono">{rec.lineUp}</td>
                  <td className="py-3 px-4 text-center font-mono">{rec.offers}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-800 font-mono">{rec.joins}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {rec.achievementPct}% {rec.achievementBand}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
