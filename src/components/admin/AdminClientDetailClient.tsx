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
import {
  updateClient,
  toggleClientStatus,
  createClientRequirement,
} from "@/actions/client";
import {
  Building2,
  ArrowLeft,
  Edit2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  PhoneCall,
  UserCheck,
  Award,
  AlertCircle,
  Plus,
  FileText,
  User,
} from "lucide-react";

interface AdminClientDetailClientProps {
  client: {
    id: string;
    name: string;
    code: string;
    status: string;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    requirements: Array<{
      id: string;
      jobTitle: string;
      location: string;
      openPositions: number;
      experienceRange: string | null;
      budgetRange: string | null;
      status: string;
      createdAt: Date | string;
    }>;
    jobCandidates: Array<{
      id: string;
      fullName: string;
      email: string;
      phone: string;
      jobTitle: string | null;
      pipelineStage: string;
      source: string;
      createdAt: Date | string;
      recruiterProfile?: {
        fullName: string;
        candidateId: string;
      } | null;
    }>;
    interviews: Array<{
      id: string;
      roundName: string;
      jobRole: string;
      scheduledAt: Date | string;
      meetingType: string;
      status: string;
      jobCandidate?: { fullName: string } | null;
    }>;
  };
  performance: {
    requirements: {
      total: number;
      active: number;
      closed: number;
      onHold: number;
      openPositions: number;
    };
    pipeline: {
      totalCandidates: number;
      stages: Record<string, number>;
    };
    interviews: {
      total: number;
      scheduled: number;
      attended: number;
      rescheduled: number;
      cancelled: number;
    };
    operationsOutreach: {
      calls: number;
      ownLeads: number;
      internalLeads: number;
      screened: number;
      shortlisted: number;
      lineUp: number;
      offered: number;
      joined: number;
      absconded: number;
    };
    conversionRates: {
      lineupToAttendedPct: number;
      attendedToOfferPct: number;
      offerToJoinPct: number;
      shortlistToJoinPct: number;
    };
  };
  auditLogs: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: Date | string;
    user?: { email: string; role: string } | null;
  }>;
}

export function AdminClientDetailClient({
  client,
  performance,
  auditLogs,
}: AdminClientDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "candidates" | "audit">("overview");

  // Edit Client Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [editCode, setEditCode] = useState(client.code);
  const [editNotes, setEditNotes] = useState(client.notes || "");
  const [editError, setEditError] = useState<string | null>(null);

  // Add Requirement Modal
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqJobTitle, setReqJobTitle] = useState("");
  const [reqLocation, setReqLocation] = useState("Bangalore, India");
  const [reqPositions, setReqPositions] = useState(1);
  const [reqExpRange, setReqExpRange] = useState("3-6 Years");
  const [reqBudgetRange, setReqBudgetRange] = useState("8-14 LPA");
  const [reqError, setReqError] = useState<string | null>(null);

  // Status Notification Banner
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isActive = client.status === "ACTIVE";

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    startTransition(async () => {
      const res = await updateClient(client.id, {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        notes: editNotes.trim() || undefined,
      });

      if (!res.success) {
        setEditError(res.message || "Failed to update client.");
      } else {
        setIsEditModalOpen(false);
        setStatusMessage({ type: "success", text: res.message || "Client updated successfully." });
        router.refresh();
      }
    });
  };

  const handleToggleStatus = () => {
    const targetStatus = isActive ? "INACTIVE" : "ACTIVE";
    const actionLabel = targetStatus === "ACTIVE" ? "activate" : "deactivate";

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} client '${client.name}' (${client.code})? Historical records will remain intact.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await toggleClientStatus(client.id, targetStatus);
      if (!res.success) {
        setStatusMessage({ type: "error", text: res.message || `Failed to ${actionLabel} client.` });
      } else {
        setStatusMessage({
          type: "success",
          text: res.message || `Client ${actionLabel}d successfully.`,
        });
        router.refresh();
      }
    });
  };

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);

    if (!reqJobTitle.trim()) {
      setReqError("Job title is required.");
      return;
    }

    startTransition(async () => {
      const res = await createClientRequirement(client.id, {
        jobTitle: reqJobTitle.trim(),
        location: reqLocation.trim(),
        openPositions: Number(reqPositions) > 0 ? Number(reqPositions) : 1,
        experienceRange: reqExpRange.trim(),
        budgetRange: reqBudgetRange.trim(),
        status: "ACTIVE",
      });

      if (!res.success) {
        setReqError(res.message || "Failed to create requirement.");
      } else {
        setIsReqModalOpen(false);
        setReqJobTitle("");
        setStatusMessage({ type: "success", text: res.message || "Requirement created successfully." });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Client Master
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-navy-100 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-navy-50 text-navy-800 rounded-xl">
              <Building2 className="w-7 h-7 text-navy-700" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-navy-950">{client.name}</h1>
                <Badge variant="outline" className="font-mono text-xs uppercase px-2 py-0.5">
                  {client.code}
                </Badge>
                <Badge variant={isActive ? "success" : "default"}>
                  {isActive ? "Active Client" : "Inactive Client"}
                </Badge>
              </div>
              <p className="text-xs text-navy-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-navy-400" />
                  Registered {new Date(client.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>ID: {client.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(client.name);
                setEditCode(client.code);
                setEditNotes(client.notes || "");
                setEditError(null);
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>

            <Button
              variant={isActive ? "outline" : "primary"}
              size="sm"
              onClick={handleToggleStatus}
              disabled={isPending}
              className={
                isActive
                  ? "border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-900"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {isActive ? (
                <>
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Activate
                </>
              )}
            </Button>
          </div>
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
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
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

      {/* Performance Summary Cards (Genuine Calculated Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-navy-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-navy-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Mandates & Positions</span>
              <Briefcase className="w-4 h-4 text-navy-600" />
            </div>
            <div className="text-2xl font-bold text-navy-950">
              {performance.requirements.openPositions} <span className="text-sm font-normal text-navy-500">open positions</span>
            </div>
            <p className="text-xs text-navy-600 mt-1">
              Across {performance.requirements.active} active mandates ({performance.requirements.total} total)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm bg-blue-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Candidates</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-950">{performance.pipeline.totalCandidates}</div>
            <p className="text-xs text-blue-700 mt-1">
              Mapped in operational pipeline
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-amber-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Interviews Attended</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">
              {performance.interviews.attended}{" "}
              <span className="text-xs font-normal text-amber-700">
                / {performance.interviews.total} coordinated
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Attendance rate: {performance.conversionRates.lineupToAttendedPct}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm bg-emerald-50/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Joined Placements</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">
              {performance.operationsOutreach.joined}{" "}
              <span className="text-xs font-normal text-emerald-700">
                ({performance.operationsOutreach.offered} offered)
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Offer-to-Join rate: {performance.conversionRates.offerToJoinPct}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-200">
        {[
          { id: "overview", label: "Performance Overview", icon: TrendingUp },
          { id: "requirements", label: `Requirements (${client.requirements.length})`, icon: Briefcase },
          { id: "candidates", label: `Pipeline (${client.jobCandidates.length})`, icon: Users },
          { id: "audit", label: `Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-navy-900 text-navy-950"
                  : "border-transparent text-navy-500 hover:text-navy-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Performance Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Profile & Notes */}
          <Card className="border-navy-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-navy-100">
              <CardTitle className="text-base text-navy-950">Client Profile & Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Official Name</span>
                <p className="text-sm font-semibold text-navy-900">{client.name}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Client Code</span>
                <p className="text-sm font-mono text-navy-900">{client.code}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Operational Notes</span>
                <p className="text-xs text-navy-700 mt-1 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-lg border border-navy-100">
                  {client.notes || "No operational notes recorded for this client."}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Database Status</span>
                <div className="mt-1">
                  <Badge variant={isActive ? "success" : "default"}>
                    {isActive ? "Active in system" : "Deactivated (Historical reference only)"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Operational Outreach Volume (From Recruiter Daily Reports) */}
          <Card className="border-navy-100 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-navy-950">Daily Operational Outreach Volume</CardTitle>
                <CardDescription className="text-xs text-navy-500">
                  Aggregated genuine activity recorded by recruiters in daily operations reports.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 text-center">
                  <span className="text-[11px] text-navy-500 font-medium">Calls Logged</span>
                  <div className="text-xl font-bold text-navy-900 mt-0.5">{performance.operationsOutreach.calls}</div>
                </div>

                <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 text-center">
                  <span className="text-[11px] text-navy-500 font-medium">Own Leads</span>
                  <div className="text-xl font-bold text-navy-900 mt-0.5">{performance.operationsOutreach.ownLeads}</div>
                </div>

                <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 text-center">
                  <span className="text-[11px] text-navy-500 font-medium">Internal Leads</span>
                  <div className="text-xl font-bold text-navy-900 mt-0.5">{performance.operationsOutreach.internalLeads}</div>
                </div>

                <div className="p-3 bg-navy-50/50 rounded-xl border border-navy-100 text-center">
                  <span className="text-[11px] text-navy-500 font-medium">Screened</span>
                  <div className="text-xl font-bold text-navy-900 mt-0.5">{performance.operationsOutreach.screened}</div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                  <span className="text-[11px] text-indigo-700 font-medium">Shortlisted</span>
                  <div className="text-xl font-bold text-indigo-950 mt-0.5">{performance.operationsOutreach.shortlisted}</div>
                </div>

                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                  <span className="text-[11px] text-amber-700 font-medium">Line-ups</span>
                  <div className="text-xl font-bold text-amber-950 mt-0.5">{performance.operationsOutreach.lineUp}</div>
                </div>

                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-center">
                  <span className="text-[11px] text-teal-700 font-medium">Offered</span>
                  <div className="text-xl font-bold text-teal-950 mt-0.5">{performance.operationsOutreach.offered}</div>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[11px] text-emerald-700 font-medium">Joined</span>
                  <div className="text-xl font-bold text-emerald-950 mt-0.5">{performance.operationsOutreach.joined}</div>
                </div>
              </div>

              {/* Conversion Ratios */}
              <div className="mt-4 pt-4 border-t border-navy-100">
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                  Key Conversion Ratios
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Lineup &rarr; Attended</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {performance.conversionRates.lineupToAttendedPct}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Attended &rarr; Offered</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {performance.conversionRates.attendedToOfferPct}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Offered &rarr; Joined</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {performance.conversionRates.offerToJoinPct}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Requirements */}
      {activeTab === "requirements" && (
        <Card className="border-navy-100 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-navy-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-navy-950">Active & Past Requirements</CardTitle>
              <CardDescription className="text-xs text-navy-500">
                Job openings and recruitment mandates commissioned by this client.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setReqError(null);
                setIsReqModalOpen(true);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Requirement
            </Button>
          </CardHeader>
          {client.requirements.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-8 h-8 text-navy-400" />}
              title="No requirements created"
              description="No job requirements are currently linked to this client."
              actionLabel="Add Requirement"
              onAction={() => {
                setReqError(null);
                setIsReqModalOpen(true);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Job Title</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Open Positions</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Budget Range</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {client.requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-navy-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy-950">{req.jobTitle}</td>
                      <td className="py-3 px-4 text-navy-700">{req.location}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold text-xs border border-amber-200">
                          {req.openPositions} positions
                        </span>
                      </td>
                      <td className="py-3 px-4 text-navy-600 text-xs">{req.experienceRange || "N/A"}</td>
                      <td className="py-3 px-4 text-navy-600 text-xs">{req.budgetRange || "N/A"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={req.status === "ACTIVE" ? "success" : req.status === "CLOSED" ? "default" : "warning"}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-navy-500 text-xs">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Pipeline Candidates */}
      {activeTab === "candidates" && (
        <Card className="border-navy-100 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-navy-100">
            <CardTitle className="text-base text-navy-950">Linked Pipeline Candidates</CardTitle>
            <CardDescription className="text-xs text-navy-500">
              Candidates sourced, screened, or interviewed specifically for this client mandate.
            </CardDescription>
          </CardHeader>
          {client.jobCandidates.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-navy-400" />}
              title="No candidates mapped yet"
              description="No candidates have been tagged with this client name in the operational pipeline yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-navy-50/70 border-b border-navy-100 text-navy-700 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Target Role</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Pipeline Stage</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Recruiter</th>
                    <th className="py-3 px-4">Added Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {client.jobCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-navy-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-navy-950">{cand.fullName}</td>
                      <td className="py-3 px-4 text-navy-800">{cand.jobTitle || "General Mandate"}</td>
                      <td className="py-3 px-4 text-xs text-navy-600">
                        <div>{cand.email}</div>
                        <div className="text-navy-400">{cand.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs font-medium">
                          {cand.pipelineStage}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-navy-600 text-xs">{cand.source}</td>
                      <td className="py-3 px-4 text-navy-600 text-xs">
                        {cand.recruiterProfile?.fullName || "Assigned Recruiter"}
                      </td>
                      <td className="py-3 px-4 text-navy-500 text-xs">
                        {new Date(cand.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === "audit" && (
        <Card className="border-navy-100 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-navy-100">
            <CardTitle className="text-base text-navy-950">Client Audit History</CardTitle>
            <CardDescription className="text-xs text-navy-500">
              Immutable audit trail recording client registration, profile modifications, and status activations/deactivations.
            </CardDescription>
          </CardHeader>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8 text-navy-400" />}
              title="No audit entries"
              description="No audit logs recorded for this client yet."
            />
          ) : (
            <div className="p-4 space-y-3">
              {auditLogs.map((log) => {
                let parsedDetails: any = null;
                try {
                  if (log.details) parsedDetails = JSON.parse(log.details);
                } catch {
                  parsedDetails = log.details;
                }

                return (
                  <div
                    key={log.id}
                    className="p-3 bg-navy-50/40 border border-navy-100 rounded-xl flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {log.action}
                        </Badge>
                        <span className="text-navy-800 font-semibold">
                          by {log.user?.email || "System Administrator"}
                        </span>
                      </div>
                      {parsedDetails && (
                        <div className="mt-1 text-navy-600">
                          {typeof parsedDetails === "object" ? (
                            <pre className="text-[11px] font-mono text-navy-700 bg-white p-2 rounded border border-navy-100 mt-1 max-w-xl overflow-x-auto">
                              {JSON.stringify(parsedDetails, null, 2)}
                            </pre>
                          ) : (
                            <span>{parsedDetails}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-navy-400 text-[11px] shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Client: ${client.name}`}
        description="Update corporate client name, unique code, or operational notes."
        size="md"
      >
        <form onSubmit={handleUpdateClient} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Client Code <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              required
              className="font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Operational Notes
            </label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all text-navy-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              {isPending ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Requirement Modal */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title={`Add Requirement for ${client.name}`}
        description="Create a new job opening mandate linked directly to this client master."
        size="md"
      >
        <form onSubmit={handleCreateRequirement} className="space-y-4">
          {reqError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{reqError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Senior Java Developer, Procurement Specialist"
              value={reqJobTitle}
              onChange={(e) => setReqJobTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Location <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={reqLocation}
                onChange={(e) => setReqLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Open Positions
              </label>
              <Input
                type="number"
                min={1}
                value={reqPositions}
                onChange={(e) => setReqPositions(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Experience Range
              </label>
              <Input
                type="text"
                placeholder="e.g. 4-8 Years"
                value={reqExpRange}
                onChange={(e) => setReqExpRange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Budget Range
              </label>
              <Input
                type="text"
                placeholder="e.g. 10-18 LPA"
                value={reqBudgetRange}
                onChange={(e) => setReqBudgetRange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReqModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              {isPending ? "Creating Requirement..." : "Create Requirement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
