"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  toggleChecklistItem,
  createJobCandidate,
  checkDuplicateCandidate,
} from "@/actions/workspace";
import {
  CalendarCheck,
  Users,
  PhoneCall,
  FileCheck,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  ExternalLink,
  Target,
  Sparkles,
} from "lucide-react";

interface WorkspaceTodayProps {
  overview: {
    recruiter: {
      fullName: string;
      candidateId: string;
      email: string;
    };
    pendingFollowUps: Array<{
      id: string;
      noteType: string;
      content: string;
      followUpDate: Date | string | null;
      jobCandidate: {
        id: string;
        fullName: string;
        phone: string;
        pipelineStage: string;
      };
    }>;
    todayInterviews: Array<{
      id: string;
      clientName: string;
      jobRole: string;
      roundName: string;
      scheduledAt: Date | string;
      meetingType: string;
      meetingLinkOrVenue: string | null;
      jobCandidate: {
        id: string;
        fullName: string;
        phone: string;
      };
    }>;
    todayTarget: {
      callsTarget: number;
      callsAchieved: number;
      submitsTarget: number;
      submitsAchieved: number;
      interviewsTarget: number;
      interviewsAchieved: number;
    } | null;
    todayChecklist: Array<{
      key: string;
      title: string;
      isCompleted: boolean;
    }>;
    activeRequirements: Array<{
      id: string;
      clientName: string;
      jobTitle: string;
      location: string;
      openPositions: number;
      experienceRange: string | null;
      budgetRange: string | null;
    }>;
    totalCandidates: number;
    stageCounts: Record<string, number>;
  };
}

export function WorkspaceTodayClient({ overview }: WorkspaceTodayProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Checklist state
  const [checklist, setChecklist] = useState(overview.todayChecklist);

  // Quick Add recruiter Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [formSource, setFormSource] = useState("Naukri");
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  const completedChecklistCount = checklist.filter((item) => item.isCompleted).length;
  const checklistPercent = Math.round((completedChecklistCount / checklist.length) * 100);

  const handleToggleChecklist = (itemKey: string, currentStatus: boolean, title: string) => {
    const nextStatus = !currentStatus;
    setChecklist((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, isCompleted: nextStatus } : item))
    );

    startTransition(async () => {
      await toggleChecklistItem(itemKey, nextStatus, title);
      router.refresh();
    });
  };

  const handleCheckDuplicate = async () => {
    if (!formEmail.trim() && !formPhone.trim()) return;
    const res = await checkDuplicateCandidate({ email: formEmail, phone: formPhone });
    if (res.isDuplicate) {
      setDupWarning(res.message || "Duplicate candidate detected!");
    } else {
      setDupWarning(null);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError("Full Name, Email, and Phone number are required.");
      return;
    }

    startTransition(async () => {
      const res = await createJobCandidate({
        fullName: formName,
        email: formEmail,
        phone: formPhone,
        jobTitle: formJobTitle || undefined,
        clientName: formClient || undefined,
        keySkills: formSkills || undefined,
        source: formSource,
        initialNote: formNote || undefined,
      });

      if (res.success) {
        setAddModalOpen(false);
        setFormName("");
        setFormEmail("");
        setFormPhone("");
        setFormJobTitle("");
        setFormClient("");
        setFormSkills("");
        setFormNote("");
        setDupWarning(null);
        router.refresh();
      } else {
        setFormError(res.message || "Failed to create candidate.");
      }
    });
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const targets = overview.todayTarget || {
    callsTarget: 30,
    callsAchieved: 0,
    submitsTarget: 5,
    submitsAchieved: 0,
    interviewsTarget: 2,
    interviewsAchieved: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {overview.recruiter.candidateId}
              </span>
              <Badge variant="success" size="sm" className="font-semibold">
                Recruiter Ready
              </Badge>
              <span className="text-xs text-slate-400">&bull; {todayStr}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Operations Center &bull; {overview.recruiter.fullName}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Track candidate pipelines, coordinate client interviews, execute cold outreach, and submit daily recruiter achievements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError(null);
                setDupWarning(null);
                setAddModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add recruiter  
            </Button>
            <Link href="/workspace/daily-report">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
              >
                <CalendarCheck className="w-4 h-4" />
                Daily Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Target Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium">Active Pipeline</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">{overview.totalCandidates}</div>
            <p className="text-[11px] text-gray-400">Total job candidates managed</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium">Calls Target</span>
              <PhoneCall className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">
              {targets.callsAchieved}{" "}
              <span className="text-xs font-normal text-gray-400">/ {targets.callsTarget}</span>
            </div>
            <ProgressBar
              value={targets.callsAchieved}
              max={targets.callsTarget}
              variant="success"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium">Submissions Target</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">
              {targets.submitsAchieved}{" "}
              <span className="text-xs font-normal text-gray-400">/ {targets.submitsTarget}</span>
            </div>
            <ProgressBar
              value={targets.submitsAchieved}
              max={targets.submitsTarget}
              variant="brand"
              size="sm"
            />
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium">Interviews Today</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">
              {overview.todayInterviews.length}
            </div>
            <p className="text-[11px] text-gray-400">Scheduled client interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Priority Actions (Left) & Operations Tools (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Pending Follow-ups */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Follow-ups Due Today
                </CardTitle>
                <CardDescription className="text-xs">
                  Candidate interactions requiring recruiter action or status verification
                </CardDescription>
              </div>
              <Badge variant={overview.pendingFollowUps.length > 0 ? "warning" : "default"} size="sm">
                {overview.pendingFollowUps.length} Pending
              </Badge>
            </CardHeader>
            <CardContent>
              {overview.pendingFollowUps.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">All Follow-ups Complete</h4>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    No overdue candidate follow-ups for today. Reach out to new prospects or review your pipeline.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {overview.pendingFollowUps.map((item) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {item.jobCandidate.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            {item.jobCandidate.phone}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                            {item.jobCandidate.pipelineStage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{item.content}</p>
                      </div>
                      <Link href="/workspace/pipeline">
                        <Button variant="outline" size="sm" className="text-xs gap-1 flex-shrink-0">
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Scheduled Interviews Today */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Interviews Scheduled Today
                </CardTitle>
                <CardDescription className="text-xs">
                  Coordinate candidate readiness and interviewer attendance
                </CardDescription>
              </div>
              <Badge variant={overview.todayInterviews.length > 0 ? "primary" : "default"} size="sm">
                {overview.todayInterviews.length} Scheduled
              </Badge>
            </CardHeader>
            <CardContent>
              {overview.todayInterviews.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">No Interviews Scheduled Today</h4>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    Screen candidates in your pipeline to line up interview slots with client panels.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {overview.todayInterviews.map((itv) => {
                    const timeStr = new Date(itv.scheduledAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={itv.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {itv.jobCandidate.fullName}
                            </span>
                            <span className="text-xs text-gray-500">&bull; {itv.clientName}</span>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {itv.jobRole}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{timeStr}</span>
                            <span>&bull;</span>
                            <span>{itv.roundName}</span>
                            <span>&bull;</span>
                            <span className="uppercase text-[10px]">{itv.meetingType}</span>
                          </div>
                        </div>

                        <Link href="/workspace/pipeline">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Active Client Requirements */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Active Sourcing Requirements
                </CardTitle>
                <CardDescription className="text-xs">
                  Priority mandates open for sourcing within E2E Procurement
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {overview.activeRequirements.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  No active client mandates configured yet. Check back or consult your operations manager.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {overview.activeRequirements.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{req.jobTitle}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {req.openPositions} Open
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {req.clientName} &bull; {req.location}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                        <span>Exp: {req.experienceRange || "1-5 Yrs"}</span>
                        <span>CTC: {req.budgetRange || "Standard"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Daily Checklist & Recruiter Toolkit Quick Access */}
        <div className="space-y-6">
          {/* Daily Recruiter Checklist Widget */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  Daily Recruiter SOP
                </CardTitle>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {completedChecklistCount}/{checklist.length}
                </span>
              </div>
              <CardDescription className="text-xs">
                Essential standard operating tasks for each working day
              </CardDescription>
              <div className="pt-2">
                <ProgressBar value={checklistPercent} max={100} variant="success" size="sm" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {checklist.map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    item.isCompleted
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium line-through opacity-80"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleToggleChecklist(item.key, item.isCompleted, item.title)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="leading-tight">{item.title}</span>
                </label>
              ))}
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/workspace/checklist" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Full Checklist Details
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Quick Workflows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/workspace/pipeline" className="block">
                <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Manage Pipeline</h5>
                    <p className="text-[11px] text-gray-500">View stages from Sourced to Joined</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>

              <Link href="/workspace/toolkit" className="block">
                <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Recruiter Toolkit</h5>
                    <p className="text-[11px] text-gray-500">Copy calling scripts, boolean searches, JD checklists</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>

              <Link href="/workspace/insights" className="block">
                <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Performance Insights</h5>
                    <p className="text-[11px] text-gray-500">Conversion ratios &amp; funnel metrics</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add recruiter Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Job recruiter"
        description="Add a sourced talent profile to your recruitment operations pipeline with automatic duplicate detection."
        size="lg"
      >
        <form onSubmit={handleCreateCandidate} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {dupWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{dupWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Full Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email Address *</label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  setDupWarning(null);
                }}
                onBlur={handleCheckDuplicate}
                placeholder="ramesh.kumar@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Phone Number *</label>
              <Input
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(e.target.value);
                  setDupWarning(null);
                }}
                onBlur={handleCheckDuplicate}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Sourcing Source</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Naukri">Naukri.com</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Job Fair">Job Fair</option>
                <option value="Campus">Campus / Polytechnic</option>
                <option value="Referral">Employee Referral</option>
                <option value="Cold Call">Cold Outreach</option>
                <option value="Other">Other Channel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Job Title / Mandate</label>
              <Input
                value={formJobTitle}
                onChange={(e) => setFormJobTitle(e.target.value)}
                placeholder="e.g. Quality Inspector"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Client Organization</label>
              <Input
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="e.g. Tata Motors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Key Skills</label>
            <Input
              value={formSkills}
              onChange={(e) => setFormSkills(e.target.value)}
              placeholder="e.g. Vernier Calipers, CMM, ISO 9001, GD&T"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Initial Screening / Recruiter Note</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="e.g. Spoke briefly. Candidate has 3 years quality inspection experience, open for relocation to Bangalore."
              rows={3}
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isPending ? "Adding Candidate..." : "Create Candidate Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
