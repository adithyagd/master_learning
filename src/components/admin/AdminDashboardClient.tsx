"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminDashboardData,
  AdminDashboardFilters,
  getAdminDashboardMetrics,
} from "@/actions/admin-dashboard";
import {
  Users,
  UserCheck,
  BookOpen,
  CheckCircle2,
  Award,
  Clock,
  ShieldCheck,
  Building2,
  PhoneCall,
  UserPlus,
  CalendarCheck,
  Target,
  Briefcase,
  TrendingUp,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Crosshair,
  PieChart,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminDashboardClientProps {
  initialData: AdminDashboardData;
}

export function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [filters, setFilters] = useState<AdminDashboardFilters>(initialData.appliedFilters);

  const handleFilterChange = (key: keyof AdminDashboardFilters, value: string) => {
    const updated: AdminDashboardFilters = {
      ...filters,
      [key]: value === "" ? undefined : (value as any),
    };
    setFilters(updated);
    startTransition(async () => {
      const res = await getAdminDashboardMetrics(updated);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const handleResetFilters = () => {
    const resetValues: AdminDashboardFilters = {
      dateRange: "all",
      startDate: undefined,
      endDate: undefined,
      recruiterProfileId: undefined,
      managerId: undefined,
      clientId: undefined,
      candidateStatus: "ALL",
      reportStatus: "ALL",
    };
    setFilters(resetValues);
    startTransition(async () => {
      const res = await getAdminDashboardMetrics(resetValues);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const { academy, operations, teams, filterOptions } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-800 border border-navy-200 uppercase tracking-wider">
              Platform Administration
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Central Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight mt-1">
            Admin Operations & Academy Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time verified platform metrics across recruiter training progression, daily operations, and manager teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
            Reset Filters
          </button>
          <Link
            href="/admin/candidates/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add recruiter
          </Link>
        </div>
      </div>

      {/* 2. Quick Navigation Hub */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            Platform Management Modules
          </h2>
          <span className="text-[11px] text-slate-400">Direct Governance Links</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            href="/admin/candidates"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Candidates</span>
            <span className="text-[10px] text-slate-500">Profiles & Provision</span>
          </Link>

          <Link
            href="/admin/academy"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Academy</span>
            <span className="text-[10px] text-slate-500">5 Modules & Bank</span>
          </Link>

          <Link
            href="/admin/certificates"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Certificates</span>
            <span className="text-[10px] text-slate-500">Review & Issuance</span>
          </Link>

          <Link
            href="/admin/reports"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Reports</span>
            <span className="text-[10px] text-slate-500">Daily Operations</span>
          </Link>

          <Link
            href="/admin/analytics"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <PieChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Analytics</span>
            <span className="text-[10px] text-slate-500">Funnel Ratios</span>
          </Link>

          <Link
            href="/admin/audit"
            className="flex flex-col items-center text-center p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-navy-900 group-hover:text-brand-700">Audit</span>
            <span className="text-[10px] text-slate-500">System Logs</span>
          </Link>
        </div>
      </div>




      {/* 4. Academy Metrics Section */}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-navy-950">
                Academy Certification & Learning Progression
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5 Modules, Lesson Quizzes, Question Bank Attempts & Official Certificate Issuance
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              Completion Rate: <span className="font-bold text-navy-900">{academy.completionRatePct}%</span>
            </div>
            <div>
              Certification Rate: <span className="font-bold text-navy-900">{academy.certificationRatePct}%</span>
            </div>
          </div>
        </div>

        {/* 8 Academy KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total Candidates */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-navy-950">{academy.totalCandidates}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Total Enrolled</p>
            </div>
          </div>

          {/* Active Candidates */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-700">{academy.activeCandidates}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Active Accounts</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-700">{academy.academyInProgress}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Modules 1–5 Learning</p>
            </div>
          </div>

          {/* Academy Completed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700">{academy.academyCompleted}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">5 Modules Passed</p>
            </div>
          </div>

          {/* Final Passed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Final Passed</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700">{academy.finalAssessmentsPassed}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">&ge; 70% Final Score</p>
            </div>
          </div>

          {/* Pending Approval */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cert Pending</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-orange-700">{academy.certificatesPending}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Awaiting Admin Review</p>
            </div>
          </div>

          {/* Certificates Approved */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Approved</span>
              <ShieldCheck className="w-4 h-4 text-teal-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-teal-700">{academy.certificatesApproved}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Review Completed</p>
            </div>
          </div>

          {/* Certificates Issued */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Issued</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-800">{academy.certificatesIssued}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Certified & Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

