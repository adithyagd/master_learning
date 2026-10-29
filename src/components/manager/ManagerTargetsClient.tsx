"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Target,
  Crosshair,
  Award,
  Users,
  CheckCircle2,
  Calendar,
} from "lucide-react";

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

interface ManagerTargetsClientProps {
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
}

export function ManagerTargetsClient({ teamSummary, rankings }: ManagerTargetsClientProps) {
  const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");

  const getBandBadgeVariant = (band: string) => {
    switch (band) {
      case "Critical":
        return "danger";
      case "Low":
        return "warning";
      case "Medium":
        return "info";
      case "Good":
      case "Great":
      case "Outstanding":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
              <Target className="w-5 h-5 text-indigo-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Team Targets & Achievement</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Monitor target benchmarks and real operational achievement across your assigned recruiters.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-navy-100 shadow-sm">
          {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                period === p
                  ? "bg-navy-900 text-white shadow-xs"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Team Overall Target Summary Card */}
      <Card className="border-navy-100 shadow-sm bg-linear-to-r from-navy-900 to-indigo-950 text-white p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-white border-white/30 text-xs">
                {period} TEAM BENCHMARK
              </Badge>
              <Badge variant={getBandBadgeVariant(teamSummary.achievementBand)} className="text-xs">
                {teamSummary.achievementBand} Band
              </Badge>
            </div>
            <h2 className="text-2xl font-bold">Team Operational Target Achievement</h2>
            <p className="text-xs text-navy-200 max-w-xl">
              Composite score derived from actual phone screenings, shortlisted candidate submissions, and joining milestones across {teamSummary.teamSize} recruiter{teamSummary.teamSize === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="p-4 bg-white/10 rounded-xl border border-white/20 text-center shrink-0 min-w-36">
            <span className="text-xs uppercase tracking-wider text-navy-200">Achievement</span>
            <div className="text-3xl font-extrabold mt-0.5">{teamSummary.achievementPct}%</div>
            <span className="text-[11px] text-navy-300">of team goal</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <div className="text-navy-200">Calls Target</div>
            <div className="text-lg font-bold mt-0.5">
              {teamSummary.totalCalls} / {teamSummary.targetCalls}
            </div>
          </div>
          <div>
            <div className="text-navy-200">Shortlisted Target</div>
            <div className="text-lg font-bold mt-0.5">
              {teamSummary.totalShortlisted} / {teamSummary.targetShortlists}
            </div>
          </div>
          <div>
            <div className="text-navy-200">Joins Target</div>
            <div className="text-lg font-bold mt-0.5 text-emerald-400">
              {teamSummary.totalJoins} / {teamSummary.targetJoins}
            </div>
          </div>
        </div>
      </Card>

      {/* Recruiter Breakdown Table */}
      <Card className="border-navy-100 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-navy-100">
          <CardTitle className="text-base text-navy-950">Team Member Target Progress</CardTitle>
          <CardDescription className="text-xs text-navy-500">
            Individual target achievement and achievement band per recruiter.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4 text-center">Calls (Goal 30)</th>
                <th className="py-3 px-4 text-center">Shortlisted (Goal 5)</th>
                <th className="py-3 px-4 text-center">Line-ups</th>
                <th className="py-3 px-4 text-center">Offers</th>
                <th className="py-3 px-4 text-center">Joins (Goal 1)</th>
                <th className="py-3 px-4 text-center">Achievement</th>
                <th className="py-3 px-4 text-center">Band</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {rankings.map((rec) => (
                <tr key={rec.recruiterId} className="hover:bg-navy-50/40 transition-colors">
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
                    <span className="font-bold text-xs">{rec.achievementPct}%</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={getBandBadgeVariant(rec.achievementBand)} className="text-[10px]">
                      {rec.achievementBand}
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
