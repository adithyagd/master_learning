"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  saveDailyReportDraft,
  submitDailyReportAction,
  ClientBreakdownInput,
} from "@/actions/report";
import {
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ShieldAlert,
  History,
  MessageSquare,
  HelpCircle,
  Info,
} from "lucide-react";

interface DailyReportData {
  id?: string;
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
  reviewedByName: string | null;
  clientBreakdowns?: ClientBreakdownInput[];
  revisions?: Array<{
    id: string;
    revisionNumber: number;
    status: string;
    submittedAt: Date | string;
    managerNotes: string | null;
  }>;
}

interface WorkspaceReportClientProps {
  currentDateStr: string;
  initialReport: DailyReportData | null;
  recruiterName: string;
  candidateId: string;
  activeClients?: Array<{ id: string; name: string; code: string }>;
  historyReports?: Array<{
    id: string;
    reportDate: Date | string;
    status: string;
    callsMade: number;
    joinings: number;
    submittedAt: Date | string | null;
  }>;
}

export function WorkspaceReportClient({
  currentDateStr,
  initialReport,
  recruiterName,
  candidateId,
  activeClients = [],
  historyReports = [],
}: WorkspaceReportClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dateStr, setDateStr] = useState(currentDateStr);

  // 13 Operational Metrics
  const [calls, setCalls] = useState<number>(initialReport?.callsMade ?? 0);
  const [ownLeads, setOwnLeads] = useState<number>(initialReport?.ownLeads ?? 0);
  const [internalLeads, setInternalLeads] = useState<number>(initialReport?.internalLeads ?? 0);
  const [screened, setScreened] = useState<number>(initialReport?.candidatesScreened ?? 0);
  const [shortlisted, setShortlisted] = useState<number>(initialReport?.shortlisted ?? 0);
  const [lineUp, setLineUp] = useState<number>(initialReport?.interviewsScheduled ?? 0);
  const [attended, setAttended] = useState<number>(initialReport?.interviewsAttended ?? 0);
  const [offered, setOffered] = useState<number>(initialReport?.offersExtended ?? 0);
  const [joined, setJoined] = useState<number>(initialReport?.joinings ?? 0);
  const [absconded, setAbsconded] = useState<number>(initialReport?.absconded ?? 0);
  const [rejected, setRejected] = useState<number>(initialReport?.rejected ?? 0);
  const [noResponse, setNoResponse] = useState<number>(initialReport?.noResponse ?? 0);
  const [pendingFollowUps, setPendingFollowUps] = useState<number>(initialReport?.pendingFollowUps ?? 0);

  // 4 Recruiter Qualitative Reflections (5th is read-only managerNotes)
  const [challenges, setChallenges] = useState<string>(initialReport?.challenges ?? "");
  const [learnings, setLearnings] = useState<string>(initialReport?.learnings ?? "");
  const [pendingDesc, setPendingDesc] = useState<string>(initialReport?.pendingFollowUpsDesc ?? "");
  const [planTomorrow, setPlanTomorrow] = useState<string>(initialReport?.planForTomorrow ?? "");

  // Client-Wise Breakdown Table Rows
  const [clientRows, setClientRows] = useState<ClientBreakdownInput[]>(
    initialReport?.clientBreakdowns && initialReport.clientBreakdowns.length > 0
      ? initialReport.clientBreakdowns
      : [
          {
            clientName: "",
            calls: 0,
            ownLeads: 0,
            internalLeads: 0,
            screened: 0,
            shortlisted: 0,
            lineUp: 0,
            offered: 0,
            joined: 0,
            absconded: 0,
          },
        ]
  );

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const status = initialReport?.status || "NEW";
  const isLocked = status === "APPROVED";
  const isUnderReview = status === "SUBMITTED";
  const isEditable = !isLocked && !isUnderReview;

  const handleDateChange = (newDate: string) => {
    setDateStr(newDate);
    startTransition(() => {
      router.push(`/workspace/report?date=${newDate}`);
    });
  };

  const stepDate = (days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const nextStr = d.toISOString().split("T")[0];
    handleDateChange(nextStr);
  };

  // Client row helpers
  const handleClientRowChange = (index: number, field: keyof ClientBreakdownInput, value: string | number) => {
    const updated = [...clientRows];
    updated[index] = {
      ...updated[index],
      [field]: typeof value === "number" ? Math.max(0, value) : value,
    };
    setClientRows(updated);
  };

  const addClientRow = () => {
    setClientRows([
      ...clientRows,
      {
        clientName: "",
        calls: 0,
        ownLeads: 0,
        internalLeads: 0,
        screened: 0,
        shortlisted: 0,
        lineUp: 0,
        offered: 0,
        joined: 0,
        absconded: 0,
      },
    ]);
  };

  const removeClientRow = (index: number) => {
    if (clientRows.length === 1) {
      setClientRows([
        {
          clientName: "",
          calls: 0,
          ownLeads: 0,
          internalLeads: 0,
          screened: 0,
          shortlisted: 0,
          lineUp: 0,
          offered: 0,
          joined: 0,
          absconded: 0,
        },
      ]);
      return;
    }
    const filtered = clientRows.filter((_, i) => i !== index);
    setClientRows(filtered);
  };

  // Calculate client table totals
  const clientTotals = clientRows.reduce(
    (acc, row) => ({
      calls: acc.calls + (Number(row.calls) || 0),
      ownLeads: acc.ownLeads + (Number(row.ownLeads) || 0),
      internalLeads: acc.internalLeads + (Number(row.internalLeads) || 0),
      screened: acc.screened + (Number(row.screened) || 0),
      shortlisted: acc.shortlisted + (Number(row.shortlisted) || 0),
      lineUp: acc.lineUp + (Number(row.lineUp) || 0),
      offered: acc.offered + (Number(row.offered) || 0),
      joined: acc.joined + (Number(row.joined) || 0),
      absconded: acc.absconded + (Number(row.absconded) || 0),
    }),
    { calls: 0, ownLeads: 0, internalLeads: 0, screened: 0, shortlisted: 0, lineUp: 0, offered: 0, joined: 0, absconded: 0 }
  );

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await saveDailyReportDraft({
        reportDate: dateStr,
        calls: Number(calls),
        ownLeads: Number(ownLeads),
        internalLeads: Number(internalLeads),
        screened: Number(screened),
        shortlisted: Number(shortlisted),
        interviewLineUp: Number(lineUp),
        interviewAttended: Number(attended),
        offered: Number(offered),
        joined: Number(joined),
        absconded: Number(absconded),
        rejected: Number(rejected),
        noResponse: Number(noResponse),
        pendingFollowUps: Number(pendingFollowUps),
        challenges: challenges || undefined,
        learnings: learnings || undefined,
        pendingFollowUpsDesc: pendingDesc || undefined,
        planForTomorrow: planTomorrow || undefined,
        clientBreakdowns: clientRows.filter((c) => c.clientName && c.clientName.trim().length > 0),
      });

      if (res.success) {
        setStatusMessage({ type: "success", text: "Draft report saved successfully. You can resume editing anytime." });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to save draft." });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await submitDailyReportAction({
        reportDate: dateStr,
        calls: Number(calls),
        ownLeads: Number(ownLeads),
        internalLeads: Number(internalLeads),
        screened: Number(screened),
        shortlisted: Number(shortlisted),
        interviewLineUp: Number(lineUp),
        interviewAttended: Number(attended),
        offered: Number(offered),
        joined: Number(joined),
        absconded: Number(absconded),
        rejected: Number(rejected),
        noResponse: Number(noResponse),
        pendingFollowUps: Number(pendingFollowUps),
        challenges,
        learnings,
        pendingFollowUpsDesc: pendingDesc || undefined,
        planForTomorrow: planTomorrow,
        clientBreakdowns: clientRows.filter((c) => c.clientName && c.clientName.trim().length > 0),
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Daily report successfully submitted for manager approval.",
        });
        router.refresh();
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to submit daily report." });
      }
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="warning" size="md">Draft (In Progress)</Badge>;
      case "SUBMITTED":
        return <Badge variant="primary" size="md">Submitted (Under Manager Review)</Badge>;
      case "RETURNED":
        return <Badge variant="danger" size="md">Returned for Revision</Badge>;
      case "APPROVED":
        return <Badge variant="success" size="md">Approved by Manager</Badge>;
      default:
        return <Badge variant="default" size="md">New Report</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Daily Recruitment Operations Report
            </h1>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Official operational reporting log for <span className="font-semibold text-gray-800">{recruiterName}</span> ({candidateId}).
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepDate(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={dateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs font-bold text-gray-800 border-none bg-transparent focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => stepDate(1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition ml-2 shadow-xs"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Read-Only Manager Notes Banner */}
      {initialReport?.managerNotes && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
            status === "RETURNED"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <div className="p-2 rounded-xl bg-white/80 shrink-0">
            <MessageSquare
              className={`w-5 h-5 ${status === "RETURNED" ? "text-rose-600" : "text-emerald-600"}`}
            />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {status === "RETURNED" ? "Manager Feedback (Revision Required)" : "Manager Review Remarks"}
              </span>
              {initialReport.reviewedByName && (
                <span className="text-[11px] opacity-75">by {initialReport.reviewedByName}</span>
              )}
            </div>
            <p className="font-medium text-sm leading-relaxed">{initialReport.managerNotes}</p>
            {status === "RETURNED" && (
              <p className="text-[11px] text-rose-700 font-semibold pt-1">
                Please make the required corrections and click &quot;Resubmit Report&quot; below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Locked / Under Review Callouts */}
      {isLocked && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>This report has been approved by management and is permanently locked.</span>
        </div>
      )}

      {isUnderReview && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>This report was submitted on {initialReport?.submittedAt ? new Date(initialReport.submittedAt).toLocaleString() : ""} and is pending manager review.</span>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: 13 OPERATIONAL METRICS */}
        <Card className="border-gray-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Daily Operational Numbers (13 Core Metrics)
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Record verified candidate contacts, lead breakdown, pipeline transitions, and operational outcomes.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Outreach & Sourcing Group */}
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Outreach &amp; Lead Source Breakdown
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">1. Calls Made</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={calls}
                    onChange={(e) => setCalls(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Total calls logged</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">2. Own Leads</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={ownLeads}
                    onChange={(e) => setOwnLeads(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Direct / Network</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">3. Internal Leads</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={internalLeads}
                    onChange={(e) => setInternalLeads(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Portal / Company pool</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">4. Screened</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={screened}
                    onChange={(e) => setScreened(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">JD qualification fit</span>
                </div>
              </div>
            </div>

            {/* Pipeline Advancements Group */}
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Pipeline Progression &amp; Client Coordination
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">5. Shortlisted</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={shortlisted}
                    onChange={(e) => setShortlisted(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Submitted to client</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">6. Interview Line-up</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={lineUp}
                    onChange={(e) => setLineUp(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Interviews scheduled</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">7. Interview Attended</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={attended}
                    onChange={(e) => setAttended(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Confirmed turnout</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">8. Offered</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={offered}
                    onChange={(e) => setOffered(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Formal offer rolled out</span>
                </div>
              </div>
            </div>

            {/* Closures, Dispositions & Follow-ups Group */}
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Outcomes, Attrition &amp; Pipeline Statuses
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                  <label className="font-bold text-emerald-900 block text-[11px]">9. Joined</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={joined}
                    onChange={(e) => setJoined(parseInt(e.target.value) || 0)}
                    className="font-black text-xs bg-white text-emerald-800"
                  />
                  <span className="text-[10px] text-emerald-600">Onboarding complete</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">10. Absconded</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={absconded}
                    onChange={(e) => setAbsconded(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white text-rose-700"
                  />
                  <span className="text-[10px] text-gray-400">Dropout / No show</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">11. Rejected</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={rejected}
                    onChange={(e) => setRejected(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Client / Internal</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">12. No Response</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={noResponse}
                    onChange={(e) => setNoResponse(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Unanswered calls</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                  <label className="font-semibold text-gray-700 block text-[11px]">13. Pending Follow-ups</label>
                  <Input
                    type="number"
                    min="0"
                    disabled={!isEditable}
                    value={pendingFollowUps}
                    onChange={(e) => setPendingFollowUps(parseInt(e.target.value) || 0)}
                    className="font-bold text-xs bg-white text-amber-700"
                  />
                  <span className="text-[10px] text-gray-400">Call back needed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: 10-COLUMN CLIENT-WISE TABLE */}
        <Card className="border-gray-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>2. Client-Wise Recruitment Operations Table</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Breakdown of outreach, leads, line-ups, and outcomes by individual enterprise client account.
              </CardDescription>
            </div>

            {isEditable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addClientRow}
                className="text-xs font-semibold gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Client Account
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3 min-w-[160px]">Client</th>
                  <th className="py-2.5 px-2 text-center w-16">Calls</th>
                  <th className="py-2.5 px-2 text-center w-16">Own Leads</th>
                  <th className="py-2.5 px-2 text-center w-16">Int Leads</th>
                  <th className="py-2.5 px-2 text-center w-16">Screened</th>
                  <th className="py-2.5 px-2 text-center w-16">Shortlisted</th>
                  <th className="py-2.5 px-2 text-center w-16">Line-up</th>
                  <th className="py-2.5 px-2 text-center w-16">Offered</th>
                  <th className="py-2.5 px-2 text-center w-16">Joined</th>
                  <th className="py-2.5 px-2 text-center w-16">Absconded</th>
                  {isEditable && <th className="py-2.5 px-2 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2">
                      <Input
                        placeholder="e.g. Bosch India"
                        list="active-clients-list"
                        value={row.clientName}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "clientName", e.target.value)}
                        className="text-xs font-semibold bg-white"
                        required={isEditable}
                      />
                      <datalist id="active-clients-list">
                        {activeClients.map((ac) => (
                          <option key={ac.id} value={ac.name}>
                            {ac.code} — {ac.name}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.calls}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "calls", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.ownLeads}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "ownLeads", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.internalLeads}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "internalLeads", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.screened}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "screened", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.shortlisted}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "shortlisted", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.lineUp}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "lineUp", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.offered}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "offered", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.joined}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "joined", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white text-emerald-800 font-bold"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.absconded}
                        disabled={!isEditable}
                        onChange={(e) => handleClientRowChange(idx, "absconded", parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-xs bg-white text-rose-700"
                      />
                    </td>
                    {isEditable && (
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeClientRow(idx)}
                          className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove client row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-gray-900 border-t-2 border-gray-200">
                  <td className="py-2.5 px-3 uppercase text-[11px] tracking-wider">
                    Total Account Volume
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.calls}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.ownLeads}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.internalLeads}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.screened}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.shortlisted}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.lineUp}</td>
                  <td className="py-2.5 px-2 text-center font-mono">{clientTotals.offered}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-emerald-700">{clientTotals.joined}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-rose-700">{clientTotals.absconded}</td>
                  {isEditable && <td></td>}
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* SECTION 3: QUALITATIVE REFLECTIONS */}
        <Card className="border-gray-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>3. Qualitative Reflections, Challenges &amp; Tomorrow&apos;s Plan</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Mandatory operational summaries for management visibility and line manager review.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>Operational Challenges Faced</span>
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                disabled={!isEditable}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="e.g. Candidates asking for 30% higher salary than client budget; Notice period issues for CNC operators."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                required={isEditable}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>Key Daily Learnings &amp; Insights</span>
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                disabled={!isEditable}
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                placeholder="e.g. Evening candidate outreach yielded 40% higher response rate; Diploma candidates open to rotating shifts."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                required={isEditable}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>Pending Follow-ups Description</span>
              </label>
              <textarea
                rows={3}
                disabled={!isEditable}
                value={pendingDesc}
                onChange={(e) => setPendingDesc(e.target.value)}
                placeholder="e.g. Ramesh Kumar (Assembly tech) expecting revised offer letter; Anita Roy attending round 2 tomorrow 11 AM."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>Tomorrow&apos;s Sourcing &amp; Execution Plan</span>
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                disabled={!isEditable}
                value={planTomorrow}
                onChange={(e) => setPlanTomorrow(e.target.value)}
                placeholder="e.g. Focus on manufacturing technician sourcing for Bosch drive; Complete 35 calls before lunch; 4 interviews lined up."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                required={isEditable}
              />
            </div>
          </CardContent>
        </Card>

        {/* ACTION BAR */}
        {isEditable && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Saving a draft keeps your progress private. Submitting locks your submission for official manager review.
              </span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleSaveDraft}
                className="text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4 text-gray-600" />
                {isPending ? "Saving..." : "Save Draft"}
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {isPending
                  ? "Submitting..."
                  : status === "RETURNED"
                  ? "Resubmit Report (Save Revision)"
                  : "Submit Daily Report"}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* REVISION HISTORY VIEWER */}
      {initialReport?.revisions && initialReport.revisions.length > 0 && (
        <Card className="border-gray-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              Report Revision Audit History ({initialReport.revisions.length} Snapshots)
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Immutable snapshots generated upon each submission and resubmission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {initialReport.revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl border border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-gray-900">
                      Revision #{rev.revisionNumber}
                    </span>
                    <span className="text-gray-500 block text-[11px]">
                      Submitted: {new Date(rev.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  {rev.managerNotes && (
                    <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                      Manager Feedback: {rev.managerNotes}
                    </div>
                  )}
                  <Badge variant={rev.status === "APPROVED" ? "success" : "primary"} size="sm">
                    {rev.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REPORT HISTORY DRAWER */}
      {showHistoryDrawer && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Your Daily Reports History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            {historyReports.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">No past reports recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                      <th className="py-2 px-3">Work Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Calls</th>
                      <th className="py-2 px-3">Joinings</th>
                      <th className="py-2 px-3">Submitted At</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyReports.map((h) => {
                      const dStr = new Date(h.reportDate).toISOString().split("T")[0];
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-gray-900">{dStr}</td>
                          <td className="py-2 px-3">
                            <Badge
                              variant={
                                h.status === "APPROVED"
                                  ? "success"
                                  : h.status === "RETURNED"
                                  ? "danger"
                                  : h.status === "SUBMITTED"
                                  ? "primary"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {h.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono">{h.callsMade}</td>
                          <td className="py-2 px-3 font-mono text-emerald-700 font-bold">{h.joinings}</td>
                          <td className="py-2 px-3 text-gray-500 text-[11px]">
                            {h.submittedAt ? new Date(h.submittedAt).toLocaleDateString() : "Draft"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                handleDateChange(dStr);
                                setShowHistoryDrawer(false);
                              }}
                              className="text-blue-600 hover:underline font-semibold text-xs"
                            >
                              Open &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
