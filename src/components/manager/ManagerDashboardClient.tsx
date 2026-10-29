"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewTeamReport } from "@/actions/manager";
import {
  Users,
  PhoneCall,
  UserCheck,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  MessageSquare,
} from "lucide-react";

interface ManagerDashboardClientProps {
  data: {
    manager: { id: string; email: string; name: string; role: string };
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
    rankings: Array<{
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
    }>;
    approvalQueue: Array<{
      reportId: string;
      recruiterName: string;
      candidateId: string;
      reportDate: Date | string;
      calls: number;
      shortlisted: number;
      joins: number;
      submittedAt: Date | string | null;
      challenges: string | null;
    }>;
    belowTargetRecruiters: Array<{
      recruiterId: string;
      fullName: string;
      candidateId: string;
      achievementPct: number;
      achievementBand: string;
      calls: number;
      shortlisted: number;
    }>;
  };
}

export function ManagerDashboardClient({ data }: ManagerDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { manager, teamSummary, rankings, approvalQueue, belowTargetRecruiters } = data;

  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [managerComment, setManagerComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReview = (action: "APPROVE" | "RETURN") => {
    if (!selectedReport) return;
    setReviewError(null);

    if (action === "RETURN" && (!managerComment.trim() || managerComment.trim().length === 0)) {
      setReviewError("Manager feedback comments are mandatory when returning a report for revision.");
      return;
    }

    startTransition(async () => {
      const res = await reviewTeamReport({
        reportId: selectedReport.reportId,
        action,
        managerNotes: managerComment.trim() || undefined,
      });

      if (!res.success) {
        setReviewError(res.message || "Failed to process review.");
      } else {
        setSelectedReport(null);
        setManagerComment("");
        setStatusMessage({ type: "success", text: res.message || "Report reviewed successfully." });
        router.refresh();
      }
    });
  };

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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
              <Users className="w-5 h-5 text-indigo-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Team Leadership Dashboard</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Welcome back, {manager.name}. Managing a team of {teamSummary.teamSize} recruiter{teamSummary.teamSize === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/manager/approvals">
            <Button variant="outline" size="sm" className="relative flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              Approvals Queue
              {approvalQueue.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {approvalQueue.length}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/manager/reports">
            <Button size="sm" className="bg-navy-900 hover:bg-navy-800 text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Team Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Below-Target Recruiters Alert Banner */}
      {belowTargetRecruiters.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Below-Target Recruiter Alert</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {belowTargetRecruiters.length} team member{belowTargetRecruiters.length === 1 ? "" : "s"} currently in Critical or Low achievement band:{" "}
                <span className="font-semibold">
                  {belowTargetRecruiters.map((r) => `${r.fullName} (${r.achievementPct}%)`).join(", ")}
                </span>
              </p>
            </div>
          </div>
          <Link href="/manager/insights">
            <Button size="sm" variant="outline" className="text-xs shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100">
              View Coaching Insights
            </Button>
          </Link>
        </div>
      )}

      {/* 5 Core Metric Cards + Target Achievement */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-navy-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Team Calls</span>
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-navy-950">{teamSummary.totalCalls}</div>
            <p className="text-xs text-navy-500 mt-1">Target: {teamSummary.targetCalls} calls</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 shadow-sm bg-indigo-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Shortlisted</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-950">{teamSummary.totalShortlisted}</div>
            <p className="text-xs text-indigo-700 mt-1">Target: {teamSummary.targetShortlists} candidates</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-amber-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Line-ups</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">{teamSummary.totalLineUps}</div>
            <p className="text-xs text-amber-700 mt-1">Interviews scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 shadow-sm bg-teal-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-teal-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Offers Released</span>
              <Award className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-950">{teamSummary.totalOffers}</div>
            <p className="text-xs text-teal-700 mt-1">Formal offers extended</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Joined</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">
              {teamSummary.totalJoins}{" "}
              <span className="text-xs font-normal text-emerald-700">/ {teamSummary.targetJoins} target</span>
            </div>
            <div className="mt-1">
              <Badge variant={getBandBadgeVariant(teamSummary.achievementBand)} className="text-[10px]">
                {teamSummary.achievementPct}% {teamSummary.achievementBand}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Reports Approval Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-navy-100 shadow-sm">
            <CardHeader className="p-4 border-b border-navy-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-navy-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Report Approvals Queue
                </CardTitle>
                <CardDescription className="text-xs text-navy-500">
                  Daily operational reports submitted by team members waiting for your formal review.
                </CardDescription>
              </div>
              <Link href="/manager/approvals" className="text-xs font-semibold text-blue-600 hover:underline">
                View all ({approvalQueue.length})
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {approvalQueue.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                  title="Approval queue is all clear"
                  description="No pending daily reports waiting for your approval right now."
                />
              ) : (
                <div className="divide-y divide-navy-100">
                  {approvalQueue.slice(0, 5).map((item) => (
                    <div
                      key={item.reportId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-navy-50/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-950 text-sm">{item.recruiterName}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {item.candidateId}
                          </Badge>
                          <span className="text-xs text-navy-500">
                            for {new Date(item.reportDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-navy-600 mt-1">
                          <span>Calls: <strong className="text-navy-900">{item.calls}</strong></span>
                          <span>Shortlisted: <strong className="text-navy-900">{item.shortlisted}</strong></span>
                          <span>Joined: <strong className="text-emerald-700">{item.joins}</strong></span>
                        </div>
                        {item.challenges && (
                          <p className="text-xs text-navy-500 italic mt-1 line-clamp-1">
                            &quot;{item.challenges}&quot;
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReport(item);
                          setManagerComment("");
                          setReviewError(null);
                        }}
                        className="bg-navy-900 hover:bg-navy-800 text-white text-xs shrink-0 self-start sm:self-auto"
                      >
                        Review Report
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recruiter Performance Ranking (1 col) */}
        <div>
          <Card className="border-navy-100 shadow-sm">
            <CardHeader className="p-4 border-b border-navy-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-navy-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Team Performance Ranking
                </CardTitle>
                <CardDescription className="text-xs text-navy-500">
                  Leaderboard ranked by verified joinings & outreach.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rankings.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-8 h-8 text-navy-400" />}
                  title="No recruiters assigned"
                  description="Assign recruiters to this manager to see performance rankings."
                />
              ) : (
                <div className="divide-y divide-navy-100">
                  {rankings.map((rec, idx) => (
                    <div
                      key={rec.recruiterId}
                      className="p-3.5 flex items-center justify-between text-xs hover:bg-navy-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 font-extrabold"
                              : idx === 1
                              ? "bg-slate-200 text-slate-800"
                              : idx === 2
                              ? "bg-amber-50 text-amber-900"
                              : "bg-navy-100 text-navy-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-navy-900">{rec.fullName}</div>
                          <div className="text-[11px] text-navy-500">
                            {rec.calls} calls • {rec.shortlisted} shortlisted • {rec.joins} joined
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant={getBandBadgeVariant(rec.achievementBand)} className="text-[10px]">
                          {rec.achievementPct}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Review Report: ${selectedReport?.recruiterName || ""}`}
        description={`Report Date: ${selectedReport ? new Date(selectedReport.reportDate).toLocaleDateString() : ""}`}
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-navy-500">Calls Made</span>
                <div className="font-bold text-navy-900 text-base">{selectedReport.calls}</div>
              </div>
              <div>
                <span className="text-navy-500">Shortlisted</span>
                <div className="font-bold text-navy-900 text-base">{selectedReport.shortlisted}</div>
              </div>
              <div>
                <span className="text-navy-500">Joins</span>
                <div className="font-bold text-emerald-800 text-base">{selectedReport.joins}</div>
              </div>
            </div>

            {selectedReport.challenges && (
              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider block mb-1">
                  Recruiter Challenges
                </span>
                <p className="text-xs text-navy-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                  &quot;{selectedReport.challenges}&quot;
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Manager Review Comments
              </label>
              <textarea
                rows={3}
                placeholder="Enter feedback notes or revision instructions (mandatory when returning for revision)..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                className="w-full p-2.5 text-sm bg-white border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all text-navy-900"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-navy-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                disabled={isPending}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleReview("RETURN")}
                  disabled={isPending}
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  Return for Revision
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleReview("APPROVE")}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
