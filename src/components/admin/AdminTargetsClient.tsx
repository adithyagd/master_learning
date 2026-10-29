"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { configureRecruiterTarget } from "@/actions/target";
import { TargetPeriodType } from "@/lib/target-calculator";
import {
  Target,
  Crosshair,
  ShieldAlert,
  Save,
  Clock,
  History,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface AdminTargetsClientProps {
  recruiters: Array<{
    id: string;
    fullName: string;
    candidateId: string;
    user: { email: string };
  }>;
  recentHistory: Array<{
    id: string;
    adminEmail: string;
    changedAt: Date | string;
    reason: string | null;
    previousValues: string;
    newValues: string;
    effectiveFrom: Date | string;
    effectiveTo: Date | string | null;
    targetConfig: {
      periodType: string;
      periodKey: string;
      recruiterProfile?: { fullName: string; candidateId: string } | null;
    };
  }>;
}

export function AdminTargetsClient({
  recruiters,
  recentHistory,
}: AdminTargetsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [targetScope, setTargetScope] = useState<string>("ORG_DEFAULT"); // "ORG_DEFAULT" or recruiterId
  const [periodType, setPeriodType] = useState<TargetPeriodType>("DAILY");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // 8 Target Benchmark Metrics
  const [callsTarget, setCallsTarget] = useState<number>(30);
  const [shortlistTarget, setShortlistTarget] = useState<number>(5);
  const [interviewsTarget, setInterviewsTarget] = useState<number>(2);
  const [offersTarget, setOffersTarget] = useState<number>(1);
  const [joinsTarget, setJoinsTarget] = useState<number>(1);
  const [ownLeadsTarget, setOwnLeadsTarget] = useState<number>(5);
  const [internalLeadsTarget, setInternalLeadsTarget] = useState<number>(5);
  const [orgMonthlyJoinsTarget, setOrgMonthlyJoinsTarget] = useState<number>(10);

  const [notes, setNotes] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-adjust default numbers when period changes
  const handlePeriodChange = (newPeriod: TargetPeriodType) => {
    setPeriodType(newPeriod);
    const d = new Date(startDate);
    if (newPeriod === "DAILY") {
      setCallsTarget(30);
      setShortlistTarget(5);
      setInterviewsTarget(2);
      setOffersTarget(1);
      setJoinsTarget(1);
      setOwnLeadsTarget(5);
      setInternalLeadsTarget(5);
      setOrgMonthlyJoinsTarget(10);
      setEndDate(startDate);
    } else if (newPeriod === "WEEKLY") {
      setCallsTarget(150);
      setShortlistTarget(25);
      setInterviewsTarget(10);
      setOffersTarget(3);
      setJoinsTarget(2);
      setOwnLeadsTarget(25);
      setInternalLeadsTarget(25);
      setOrgMonthlyJoinsTarget(10);
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      setEndDate(end.toISOString().split("T")[0]);
    } else {
      setCallsTarget(600);
      setShortlistTarget(100);
      setInterviewsTarget(40);
      setOffersTarget(10);
      setJoinsTarget(5);
      setOwnLeadsTarget(100);
      setInternalLeadsTarget(100);
      setOrgMonthlyJoinsTarget(20);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await configureRecruiterTarget({
        recruiterProfileId: targetScope === "ORG_DEFAULT" ? null : targetScope,
        periodType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        callsTarget: Number(callsTarget),
        shortlistTarget: Number(shortlistTarget),
        interviewsTarget: Number(interviewsTarget),
        offersTarget: Number(offersTarget),
        joinsTarget: Number(joinsTarget),
        ownLeadsTarget: Number(ownLeadsTarget),
        internalLeadsTarget: Number(internalLeadsTarget),
        orgMonthlyJoinsTarget: Number(orgMonthlyJoinsTarget),
        notes: notes || undefined,
        reason: reason || undefined,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Target successfully configured for ${
            targetScope === "ORG_DEFAULT" ? "Organization Default" : "Selected Recruiter"
          } (${periodType}). Audit log created.`,
        });
        setReason("");
        router.refresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Failed to configure target.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Recruiter Targets Configuration
            </h1>
            <Badge variant="primary" size="sm">
              Admin Console
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure daily, weekly, and monthly performance targets across all 8 operational recruitment metrics.
          </p>
        </div>
      </div>

      {/* Status Alerts */}
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

      {/* Target Configuration Form */}
      <Card className="border-gray-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-blue-600" />
            Set Recruiter Target Benchmarks
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Define target quotas and effective dates. All changes generate audit trail entries with recorded reasons.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Scope & Period Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  Target Assignment
                </label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 font-medium"
                >
                  <option value="ORG_DEFAULT">★ Organization-Wide Default</option>
                  {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.candidateId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  Period Cadence
                </label>
                <select
                  value={periodType}
                  onChange={(e) => handlePeriodChange(e.target.value as TargetPeriodType)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 font-medium"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Effective Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Effective End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs bg-white"
                  required
                />
              </div>
            </div>

            {/* 8 Target Metric Inputs Grid */}
            <div>
              <span className="font-bold text-gray-900 block mb-2.5 text-xs">
                Metric Target Benchmarks ({periodType.toLowerCase()})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">1. Calls Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={callsTarget}
                    onChange={(e) => setCallsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Phone outreach</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">2. Shortlist Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={shortlistTarget}
                    onChange={(e) => setShortlistTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Shortlisted candidates</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">3. Interview Line-ups</label>
                  <Input
                    type="number"
                    min="0"
                    value={interviewsTarget}
                    onChange={(e) => setInterviewsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Scheduled interviews</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">4. Offers Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={offersTarget}
                    onChange={(e) => setOffersTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Job offers extended</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">5. Joins Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={joinsTarget}
                    onChange={(e) => setJoinsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Candidate onboardings</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">6. Own Leads Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={ownLeadsTarget}
                    onChange={(e) => setOwnLeadsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Personal network/direct</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">7. Internal Leads Target</label>
                  <Input
                    type="number"
                    min="0"
                    value={internalLeadsTarget}
                    onChange={(e) => setInternalLeadsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Database &amp; portal leads</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                  <label className="text-gray-600 block text-[11px] font-medium">8. Org Monthly Joins</label>
                  <Input
                    type="number"
                    min="0"
                    value={orgMonthlyJoinsTarget}
                    onChange={(e) => setOrgMonthlyJoinsTarget(parseInt(e.target.value) || 0)}
                    className="font-bold font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-400">Team enterprise goal</span>
                </div>
              </div>
            </div>

            {/* Strategic Notes & Change Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Reason for Target Adjustment (Audit Requirement)</label>
                <Input
                  placeholder="e.g. Q4 automotive recruitment drive ramp-up or client onboarding SLA"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Strategy Notes for Recruiters</label>
                <Input
                  placeholder="e.g. Focus on assembly technician profiles for Bangalore hub"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isPending ? "Applying Target..." : "Save & Apply Target"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Target Modification Audit History */}
      <Card className="border-gray-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            Target Modification Audit Trail
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Immutable log of all target configurations, effective dates, and authorized admin revisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-3 text-center">No target change history recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Target Scope</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Effective Range</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Configured By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentHistory.map((item) => {
                    const recruiterName = item.targetConfig.recruiterProfile
                      ? `${item.targetConfig.recruiterProfile.fullName} (${item.targetConfig.recruiterProfile.candidateId})`
                      : "Organization Default";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">
                          {new Date(item.changedAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">
                          {recruiterName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                            {item.targetConfig.periodType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                          {new Date(item.effectiveFrom).toLocaleDateString()} &rarr;{" "}
                          {item.effectiveTo ? new Date(item.effectiveTo).toLocaleDateString() : "Ongoing"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          {item.reason || "Target benchmark configuration"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                          {item.adminEmail}
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
    </div>
  );
}
