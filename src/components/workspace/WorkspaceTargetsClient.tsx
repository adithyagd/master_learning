"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  PeriodTargetsPerformance,
  MetricKey,
  TargetPeriodType,
} from "@/lib/target-calculator";
import {
  Target,
  PhoneCall,
  UserCheck,
  Calendar,
  Award,
  Users2,
  Share2,
  Building,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
} from "lucide-react";

interface WorkspaceTargetsClientProps {
  initialData: PeriodTargetsPerformance;
  targetHistory?: Array<{
    id: string;
    adminEmail: string;
    changedAt: Date | string;
    reason: string | null;
    previousValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
    effectiveFrom: Date | string;
    effectiveTo: Date | string | null;
  }>;
}

const METRIC_ICONS: Record<MetricKey, React.ComponentType<{ className?: string }>> = {
  CALLS: PhoneCall,
  SHORTLISTED: UserCheck,
  INTERVIEWS: Calendar,
  OFFERS: Award,
  JOINS: Users2,
  OWN_LEADS: Share2,
  INTERNAL_LEADS: Building,
  ORG_MONTHLY_JOINS: Briefcase,
};

export function WorkspaceTargetsClient({
  initialData,
  targetHistory = [],
}: WorkspaceTargetsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [periodType, setPeriodType] = useState<TargetPeriodType>(initialData.periodType);
  const [selectedMetric, setSelectedMetric] = useState<string>("ALL");
  const [dateStr, setDateStr] = useState<string>(
    new Date(initialData.startDate).toISOString().split("T")[0]
  );
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const navigatePeriod = (newPeriod: TargetPeriodType, newDate?: string) => {
    setPeriodType(newPeriod);
    const dateQuery = newDate || dateStr;
    startTransition(() => {
      router.push(`/workspace/targets?period=${newPeriod}&date=${dateQuery}`);
    });
  };

  const handleDateChange = (newDate: string) => {
    setDateStr(newDate);
    startTransition(() => {
      router.push(`/workspace/targets?period=${periodType}&date=${newDate}`);
    });
  };

  const stepDate = (days: number) => {
    const current = new Date(dateStr);
    current.setDate(current.getDate() + days);
    const nextStr = current.toISOString().split("T")[0];
    handleDateChange(nextStr);
  };

  const filteredMetrics =
    selectedMetric === "ALL"
      ? initialData.metricList
      : initialData.metricList.filter((m) => m.key === selectedMetric);

  const getBandBadgeClass = (band: string) => {
    switch (band) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Low":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Medium":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "Good":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Great":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Outstanding":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getProgressVariant = (band: string): "brand" | "success" | "warning" | "danger" => {
    switch (band) {
      case "Critical":
        return "danger";
      case "Low":
        return "warning";
      case "Medium":
        return "brand";
      case "Good":
        return "brand";
      case "Great":
      case "Outstanding":
        return "success";
      default:
        return "brand";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Recruiter Performance Targets
            </h1>
            <Badge variant="primary" size="sm">
              E2E Recruiter Academy
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tracking performance for <span className="font-semibold text-gray-800">{initialData.recruiterName}</span> ({initialData.candidateId}) against admin-configured targets.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto">
          {(["DAILY", "WEEKLY", "MONTHLY"] as TargetPeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => navigatePeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodType === p
                  ? "bg-white text-blue-700 shadow-xs border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p === "DAILY" ? "Daily" : p === "WEEKLY" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepDate(periodType === "DAILY" ? -1 : periodType === "WEEKLY" ? -7 : -30)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">{initialData.label}</span>
          </div>
          <button
            onClick={() => stepDate(periodType === "DAILY" ? 1 : periodType === "WEEKLY" ? 7 : 30)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDateChange(new Date().toISOString().split("T")[0])}
            className="text-[11px] font-semibold text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded-md ml-2"
          >
            Current
          </button>
        </div>

        {/* Metric Filter & Custom Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium hidden sm:inline">Filter Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border border-gray-200 bg-white rounded-lg px-2.5 py-1 text-xs text-gray-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All 8 Metrics</option>
              {initialData.metricList.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={dateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-gray-50"
          />
        </div>
      </div>

      {/* Executive Overview KPI Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-navy-900 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Average Target Attainment
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getBandBadgeClass(initialData.overallBand.band)}`}>
                {initialData.overallBand.label}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-black">{initialData.overallAveragePercentage}%</span>
              <span className="text-xs text-slate-300 font-medium">overall period progress</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 mt-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Targets configured by Authorized Administration</span>
            </div>
            {targetHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-300 hover:text-white underline font-medium"
              >
                {showHistory ? "Hide target changes" : "View change history"}
              </button>
            )}
          </div>
        </div>

        {/* Achievement Bands Legend */}
        <div className="md:col-span-2 bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-900 block mb-2">
              Achievement Performance Bands
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
              <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                <span className="text-[10px] font-bold block">0–25%</span>
                <span className="text-[10px] uppercase font-bold">Critical</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <span className="text-[10px] font-bold block">26–50%</span>
                <span className="text-[10px] uppercase font-bold">Low</span>
              </div>
              <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800">
                <span className="text-[10px] font-bold block">51–75%</span>
                <span className="text-[10px] uppercase font-bold">Medium</span>
              </div>
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800">
                <span className="text-[10px] font-bold block">76–90%</span>
                <span className="text-[10px] uppercase font-bold">Good</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="text-[10px] font-bold block">91–100%</span>
                <span className="text-[10px] uppercase font-bold">Great</span>
              </div>
              <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                <span className="text-[10px] font-bold block">&gt; 100%</span>
                <span className="text-[10px] uppercase font-bold">Outstanding</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-100">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Metrics are computed deterministically from verified call logs, pipeline stage histories, and reports.</span>
          </div>
        </div>
      </div>

      {/* Target Change History Drawer (if toggled) */}
      {showHistory && targetHistory.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
              <Clock className="w-4 h-4 text-blue-700" />
              Target Adjustments &amp; Effective Dates History
            </CardTitle>
            <CardDescription className="text-xs text-blue-700">
              Audit trail of target revisions configured for your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {targetHistory.map((h) => (
                <div key={h.id} className="p-2.5 rounded-lg bg-white border border-blue-100 text-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-gray-900">{h.reason || "Target modification"}</span>
                    <span className="text-gray-500 block text-[11px]">
                      Effective: {new Date(h.effectiveFrom).toLocaleDateString()} to {h.effectiveTo ? new Date(h.effectiveTo).toLocaleDateString() : "Ongoing"}
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-gray-500">
                    <span>Configured by {h.adminEmail}</span>
                    <span className="block">{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map((m) => {
          const Icon = METRIC_ICONS[m.key] || Target;
          const bandClass = getBandBadgeClass(m.band.band);
          const progressVariant = getProgressVariant(m.band.band);

          return (
            <Card
              key={m.key}
              className={`border-gray-200 shadow-xs transition hover:shadow-sm ${
                m.band.band === "Outstanding" ? "ring-2 ring-purple-200" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500">
                    {m.unit}
                  </span>
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-gray-900 mt-1">
                  {m.label}
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 line-clamp-1">
                  {m.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Numbers Row */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-gray-900">{m.achieved}</span>
                    <span className="text-xs font-semibold text-gray-400"> / {m.target}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${bandClass}`}>
                    {m.band.band}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <ProgressBar
                    value={Math.min(100, m.achievementPercentage)}
                    max={100}
                    variant={progressVariant}
                    size="sm"
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-500 pt-0.5">
                    <span>
                      Remaining:{" "}
                      <strong className={m.remaining > 0 ? "text-gray-900" : "text-emerald-600 font-bold"}>
                        {m.remaining === 0 ? "Goal met!" : `${m.remaining} ${m.unit}`}
                      </strong>
                    </span>
                    <span className="font-bold text-gray-900">
                      {m.achievementPercentage}%
                    </span>
                  </div>
                </div>

                {/* Verified Source Footer */}
                <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500 flex items-start gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{m.source}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
