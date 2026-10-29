"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  Filter,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  MessageSquare,
  Download,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { exportReport } from "@/actions/export";

interface TeamReportItem {
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
  managerNotes: string | null;
  status: string;
  submittedAt: Date | string | null;
  reviewedAt: Date | string | null;
  approvedAt: Date | string | null;
  reviewedByName: string | null;
  recruiterProfile: {
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
  revisions: Array<{
    id: string;
    revisionNumber: number;
    status: string;
    managerNotes: string | null;
    submittedAt: Date | string;
  }>;
}

interface ManagerReportsClientProps {
  reports: TeamReportItem[];
}

export function ManagerReportsClient({ reports }: ManagerReportsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReport, setSelectedReport] = useState<TeamReportItem | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const filteredReports = reports.filter((report) => {
    if (statusFilter === "ALL") return true;
    return report.status === statusFilter;
  });

  const handleExport = async (format: "csv" | "excel" | "print") => {
    if (format === "print") {
      const query = new URLSearchParams({
        reportType: "DAILY_REPORTS",
        format: "print",
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      });
      window.open(`/api/export?${query.toString()}`, "_blank");
      return;
    }

    try {
      setIsExporting(format);
      const res = await exportReport("DAILY_REPORTS", format, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });

      if (res.success && res.data) {
        const { filename, mimeType, content } = res.data;
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert(res.message || "Export failed");
      }
    } catch (err) {
      console.error("Manager export error:", err);
      alert("Failed to export report.");
    } finally {
      setIsExporting(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "SUBMITTED":
        return "warning";
      case "RETURNED":
        return "danger";
      case "DRAFT":
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
              <FileText className="w-5 h-5 text-indigo-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Team Operations Reports</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Historical archive of daily operations reports submitted by your assigned recruiters.
          </p>
        </div>

        {/* Status Filters & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-navy-100 shadow-sm">
            {["ALL", "SUBMITTED", "APPROVED", "RETURNED", "DRAFT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === st
                    ? "bg-navy-900 text-white shadow-xs"
                    : "bg-transparent text-navy-600 hover:bg-navy-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={isExporting !== null || filteredReports.length === 0}
              className="text-xs bg-white flex items-center gap-1 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("excel")}
              disabled={isExporting !== null || filteredReports.length === 0}
              className="text-xs bg-white flex items-center gap-1 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("print")}
              disabled={filteredReports.length === 0}
              className="text-xs bg-white flex items-center gap-1 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-navy-600" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <Card className="border-navy-100 shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-navy-400" />}
            title="No reports match filter"
            description="No daily reports found in this status category."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Recruiter</th>
                  <th className="py-3 px-4">Report Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Calls</th>
                  <th className="py-3 px-4 text-center">Shortlisted</th>
                  <th className="py-3 px-4 text-center">Line-up</th>
                  <th className="py-3 px-4 text-center">Offers</th>
                  <th className="py-3 px-4 text-center">Joined</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-navy-50/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy-950">
                      <div>{report.recruiterProfile.fullName}</div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {report.recruiterProfile.candidateId}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-navy-800 font-medium">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(report.status)} className="text-xs">
                        {report.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{report.callsMade}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.shortlisted}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.interviewsScheduled}</td>
                    <td className="py-3 px-4 text-center font-mono">{report.offersExtended}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800 font-mono">
                      {report.joinings}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReport(report)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Report Details: ${selectedReport?.recruiterProfile.fullName || ""}`}
        description={`Report Date: ${selectedReport ? new Date(selectedReport.reportDate).toLocaleDateString() : ""}`}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            {/* Status and timestamps */}
            <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-navy-500 font-medium">Status: </span>
                <Badge variant={getStatusBadgeVariant(selectedReport.status)} className="text-xs">
                  {selectedReport.status}
                </Badge>
              </div>
              <div className="text-right text-navy-500 text-[11px]">
                {selectedReport.submittedAt && (
                  <div>Submitted: {new Date(selectedReport.submittedAt).toLocaleString()}</div>
                )}
                {selectedReport.approvedAt && (
                  <div>Approved: {new Date(selectedReport.approvedAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            {/* 13 Metrics summary */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-white rounded-xl border border-navy-100">
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Calls</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.callsMade}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Own Leads</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.ownLeads}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Internal Leads</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.internalLeads}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Screened</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.candidatesScreened}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Shortlisted</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.shortlisted}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Line-ups</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.interviewsScheduled}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Attended</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.interviewsAttended}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Offered</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.offersExtended}</div>
              </div>
              <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                <span className="text-emerald-700">Joined</span>
                <div className="font-bold text-sm text-emerald-950">{selectedReport.joinings}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Absconded</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.absconded}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Rejected</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.rejected}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500">Pending F/U</span>
                <div className="font-bold text-sm text-navy-900">{selectedReport.pendingFollowUps}</div>
              </div>
            </div>

            {/* Manager Comments Callout if present */}
            {selectedReport.managerNotes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950">
                <span className="font-bold block mb-0.5">Manager Feedback Notes:</span>
                <p className="italic">{selectedReport.managerNotes}</p>
                {selectedReport.reviewedByName && (
                  <span className="text-[10px] text-amber-700 block mt-1">
                    Reviewed by {selectedReport.reviewedByName}
                  </span>
                )}
              </div>
            )}

            {/* Revision History */}
            {selectedReport.revisions && selectedReport.revisions.length > 0 && (
              <div>
                <span className="font-bold text-navy-900 uppercase tracking-wider block mb-1">
                  Revision History ({selectedReport.revisions.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedReport.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2 bg-navy-50/50 rounded border border-navy-100 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Rev #{rev.revisionNumber}
                        </Badge>
                        <span className="font-medium text-navy-800">{rev.status}</span>
                        {rev.managerNotes && <span className="italic text-navy-600">&quot;{rev.managerNotes}&quot;</span>}
                      </div>
                      <span className="text-navy-400">{new Date(rev.submittedAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
