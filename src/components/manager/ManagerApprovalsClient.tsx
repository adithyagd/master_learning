"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewTeamReport } from "@/actions/manager";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  PhoneCall,
  UserCheck,
  Calendar,
  Award,
  Eye,
} from "lucide-react";

interface PendingReportItem {
  id: string;
  reportDate: Date | string;
  callsMade: number;
  ownLeads: number;
  internalLeads: number;
  candidatesScreened: number;
  shortlisted: number;
  interviewsScheduled: number;
  interviewsAttended: number;
  offersExtended: number;
  joinings: number;
  absconded: number;
  rejected: number;
  noResponse: number;
  pendingFollowUps: number;
  challenges: string | null;
  learnings: string | null;
  pendingFollowUpsDesc: string | null;
  planForTomorrow: string | null;
  submittedAt: Date | string | null;
  recruiterProfile: {
    id: string;
    fullName: string;
    candidateId: string;
  };
  clientBreakdowns: Array<{
    id: string;
    clientName: string;
    calls: number;
    shortlisted: number;
    joined: number;
  }>;
}

interface ManagerApprovalsClientProps {
  reports: PendingReportItem[];
}

export function ManagerApprovalsClient({ reports }: ManagerApprovalsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedReport, setSelectedReport] = useState<PendingReportItem | null>(null);
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
        reportId: selectedReport.id,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-800 rounded-lg">
              <CheckSquare className="w-5 h-5 text-amber-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Daily Reports Approval Queue</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Review, approve, or return reports submitted by your assigned team members.
          </p>
        </div>

        <Badge variant="warning" className="text-xs px-3 py-1 font-semibold self-start sm:self-auto">
          {reports.length} Pending Approval{reports.length === 1 ? "" : "s"}
        </Badge>
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

      {/* Reports Table */}
      <Card className="border-navy-100 shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            title="Approval queue is empty"
            description="All submitted reports from your assigned team have been reviewed and approved."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Recruiter</th>
                  <th className="py-3 px-4">Report Date</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-center">Calls</th>
                  <th className="py-3 px-4 text-center">Shortlisted</th>
                  <th className="py-3 px-4 text-center">Line-up</th>
                  <th className="py-3 px-4 text-center">Offered</th>
                  <th className="py-3 px-4 text-center">Joined</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-navy-50/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy-950">
                      <div>{report.recruiterProfile.fullName}</div>
                      <Badge variant="outline" className="font-mono text-[10px] mt-0.5">
                        {report.recruiterProfile.candidateId}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-navy-800 font-medium">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-navy-500">
                      {report.submittedAt ? new Date(report.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{report.callsMade}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.shortlisted}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.interviewsScheduled}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.offersExtended}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                      {report.joinings}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setManagerComment("");
                          setReviewError(null);
                        }}
                        className="bg-navy-900 hover:bg-navy-800 text-white text-xs"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Review Report: ${selectedReport?.recruiterProfile.fullName || ""}`}
        description={`Report Date: ${selectedReport ? new Date(selectedReport.reportDate).toLocaleDateString() : ""}`}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Operational Numbers Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-navy-50/50 rounded-xl border border-navy-100">
              <div>
                <span className="text-navy-500 text-[11px]">Calls</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.callsMade}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Screened</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.candidatesScreened}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Shortlisted</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.shortlisted}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Line-up</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.interviewsScheduled}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Attended</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.interviewsAttended}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Offered</span>
                <div className="font-bold text-navy-900 text-sm mt-0.5">{selectedReport.offersExtended}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Joined</span>
                <div className="font-bold text-emerald-800 text-sm mt-0.5">{selectedReport.joinings}</div>
              </div>
              <div>
                <span className="text-navy-500 text-[11px]">Pending F/U</span>
                <div className="font-bold text-amber-800 text-sm mt-0.5">{selectedReport.pendingFollowUps}</div>
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {selectedReport.challenges && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Challenges:</span>
                  <p className="text-slate-600 italic">&quot;{selectedReport.challenges}&quot;</p>
                </div>
              )}
              {selectedReport.learnings && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Learnings:</span>
                  <p className="text-slate-600 italic">&quot;{selectedReport.learnings}&quot;</p>
                </div>
              )}
            </div>

            {/* Client Breakdown rows */}
            {selectedReport.clientBreakdowns.length > 0 && (
              <div>
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
                  Client Account Activity
                </span>
                <div className="border border-navy-100 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-navy-50 text-[11px] text-navy-700 font-semibold">
                      <tr>
                        <th className="p-2">Client Name</th>
                        <th className="p-2 text-center">Calls</th>
                        <th className="p-2 text-center">Shortlisted</th>
                        <th className="p-2 text-center">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {selectedReport.clientBreakdowns.map((cb) => (
                        <tr key={cb.id}>
                          <td className="p-2 font-medium text-navy-900">{cb.clientName}</td>
                          <td className="p-2 text-center font-mono">{cb.calls}</td>
                          <td className="p-2 text-center font-mono">{cb.shortlisted}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-800">{cb.joined}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback textarea */}
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Manager Review Feedback <span className="text-navy-400 font-normal">(mandatory if returning)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter feedback comments or revision instructions..."
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
