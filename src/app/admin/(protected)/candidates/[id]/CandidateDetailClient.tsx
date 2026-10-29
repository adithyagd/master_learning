"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  toggleCandidateStatus,
  adminResetCandidatePassword,
  updateCandidateProfile,
} from "@/actions/candidate";
import {
  ACADEMY_MODULES,
  FINAL_ASSESSMENT_CONFIG,
  CERTIFICATE_STATUS_CONFIG,
  CertificateStatus,
} from "@/lib/design-system";
import {
  User,
  GraduationCap,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Power,
  Edit3,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface CandidateDetailProps {
  candidate: {
    id: string;
    candidateId: string;
    fullName: string;
    phone: string | null;
    location: string | null;
    joiningDate: string;
    isCertified: boolean;
    certificateStatus: string;
    currentModuleNumber: number;
    user: {
      id: string;
      email: string;
      status: string;
      createdAt: string;
      lastLoginAt: string | null;
    };
    auditLogs: Array<{
      id: string;
      action: string;
      targetType: string;
      details: string | null;
      createdAt: string;
    }>;
  };
}

export function CandidateDetailClient({ candidate }: CandidateDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "academy" | "assessments" | "activity" | "certificate"
  >("overview");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [resetTokenUrl, setResetTokenUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Status toggle
  async function handleToggleStatus() {
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    const newStatus = candidate.user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await toggleCandidateStatus(candidate.user.id, newStatus);
    setIsUpdatingStatus(false);
    if (res.success) {
      setStatusMessage(res.message || "Status updated.");
    }
  }

  // Admin trigger credential reset
  async function handleResetPassword() {
    setIsResettingPass(true);
    setStatusMessage(null);
    const res = await adminResetCandidatePassword(candidate.user.id);
    setIsResettingPass(false);
    if (res.success && res.data?.resetToken) {
      const url = `${window.location.origin}/reset-password?token=${res.data.resetToken}`;
      setResetTokenUrl(url);
    }
  }

  const certConfig =
    CERTIFICATE_STATUS_CONFIG[candidate.certificateStatus as CertificateStatus] ||
    CERTIFICATE_STATUS_CONFIG.NOT_ELIGIBLE;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                {candidate.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-navy-900">{candidate.fullName}</h1>
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {candidate.candidateId}
                  </span>
                  <Badge
                    variant={candidate.user.status === "ACTIVE" ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {candidate.user.status}
                  </Badge>
                  <Badge variant={certConfig.badgeVariant} size="sm">
                    {certConfig.label}
                  </Badge>
                </div>
                <div className="text-xs text-navy-500 mt-1 flex flex-wrap gap-4">
                  <span>Email: <strong className="text-navy-700">{candidate.user.email}</strong></span>
                  <span>Joined: <strong className="text-navy-700 font-mono">{new Date(candidate.joiningDate).toLocaleDateString("en-IN")}</strong></span>
                  <span>
                    Last Login:{" "}
                    <strong className="text-navy-700">
                      {candidate.user.lastLoginAt
                        ? new Date(candidate.user.lastLoginAt).toLocaleString("en-IN")
                        : "Never"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={candidate.user.status === "ACTIVE" ? "outline" : "success"}
                size="sm"
                onClick={handleToggleStatus}
                isLoading={isUpdatingStatus}
                leftIcon={<Power className="w-3.5 h-3.5" />}
              >
                {candidate.user.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                isLoading={isResettingPass}
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              >
                Reset Password
              </Button>
            </div>
          </div>

          {/* Feedback & Reset URL Drawer */}
          {statusMessage && (
            <div className="mt-4 p-3 bg-brand-50 border border-brand-200 text-brand-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {resetTokenUrl && (
            <div className="mt-4 p-3.5 bg-navy-50 border border-navy-200 rounded-lg">
              <span className="text-[11px] font-semibold text-navy-700 uppercase tracking-wide block mb-1">
                Generated Single-Use Password Reset Link (Valid for 24h):
              </span>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={resetTokenUrl}
                  className="w-full text-xs font-mono bg-white border border-navy-300 rounded px-2.5 py-1.5 text-navy-900 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(resetTokenUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-navy-200">
        <nav className="flex space-x-6" aria-label="Candidate profile tabs">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "academy", label: "Academy Progress", icon: GraduationCap },
            { id: "assessments", label: "Assessments", icon: Award },
            { id: "activity", label: "Activity", icon: Clock },
            { id: "certificate", label: "Certificate", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                  isActive
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Official candidate registration information</CardDescription>
              </CardHeader>
              <form
                action={async (formData) => {
                  const res = await updateCandidateProfile(candidate.id, formData);
                  if (res.message) setStatusMessage(res.message);
                }}
              >
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="fullName"
                      defaultValue={candidate.fullName}
                      required
                    />
                    <Input
                      label="Candidate ID"
                      name="candidateId"
                      defaultValue={candidate.candidateId}
                      disabled
                      helperText="System identifier cannot be modified"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      defaultValue={candidate.user.email}
                      disabled
                      helperText="Primary authentication email"
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      defaultValue={candidate.phone || ""}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Location"
                      name="location"
                      defaultValue={candidate.location || ""}
                      placeholder="Bangalore, Karnataka"
                    />
                    <Input
                      label="Joining Date"
                      name="joiningDate"
                      type="date"
                      defaultValue={candidate.joiningDate.split("T")[0]}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Readiness Status</CardTitle>
                <CardDescription>Role authorization and workspace access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-navy-100">
                  <span className="text-navy-500">Current Role</span>
                  <Badge variant="primary" size="sm">CANDIDATE</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-navy-100">
                  <span className="text-navy-500">Academy Status</span>
                  <span className="font-semibold text-navy-800">
                    Module {candidate.currentModuleNumber} of 5
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-navy-100">
                  <span className="text-navy-500">Recruiter Ready</span>
                  <Badge variant={candidate.isCertified ? "success" : "default"} size="sm">
                    {candidate.isCertified ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-navy-500">Operations Workspace</span>
                  <Badge variant={candidate.isCertified ? "success" : "danger"} size="sm">
                    {candidate.isCertified ? "UNLOCKED" : "LOCKED"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMY PROGRESS */}
      {activeTab === "academy" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Academy Curriculum Status</CardTitle>
                <CardDescription>
                  Tracking candidate progress across the mandatory 5 modules
                </CardDescription>
              </div>
              <Badge variant="primary" size="md">
                Passing Score: 70%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ACADEMY_MODULES.map((module) => {
              const isCompleted = candidate.currentModuleNumber > module.number;
              const isCurrent = candidate.currentModuleNumber === module.number;

              return (
                <div
                  key={module.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? "bg-success-50/20 border-success-200"
                      : isCurrent
                      ? "bg-brand-50/20 border-brand-300"
                      : "bg-slate-50/50 border-navy-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? "bg-success-600 text-white"
                            : isCurrent
                            ? "bg-brand-600 text-white"
                            : "bg-navy-200 text-navy-700"
                        }`}
                      >
                        {module.number}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy-900">{module.title}</h4>
                        <p className="text-[11px] text-navy-500 mt-0.5">{module.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant={isCompleted ? "success" : isCurrent ? "warning" : "default"}
                      size="sm"
                    >
                      {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Locked"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ASSESSMENTS */}
      {activeTab === "assessments" && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Attempts &amp; Results</CardTitle>
            <CardDescription>
              Real attempt history, randomized quiz scores, and Final Assessment verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Award className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-navy-800">
                No Assessment Attempts Recorded Yet
              </p>
              <p className="text-[11px] text-navy-500 max-w-sm mx-auto mt-1">
                Candidate has not yet launched a dynamic quiz attempt. Scores and question-level responses will appear here upon completion.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === "activity" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Audit History Timeline</CardTitle>
              <CardDescription>
                Chronological record of account events and candidate milestones
              </CardDescription>
            </div>
            <Link href={`/admin/candidates/${candidate.id}/activity`}>
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Full Activity Route
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {candidate.auditLogs.length === 0 ? (
              <p className="text-xs text-navy-500 text-center py-6">
                No activity logged yet for this candidate.
              </p>
            ) : (
              candidate.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-navy-100 rounded-lg text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-navy-800">{log.action}</span>
                    {log.details && (
                      <span className="text-navy-500 text-[11px] block mt-0.5">
                        {log.details}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-navy-400">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: CERTIFICATE */}
      {activeTab === "certificate" && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Status &amp; Admin Approval</CardTitle>
            <CardDescription>
              Official verification state machine governing access to Recruitment Operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-navy-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-navy-500">Current Status:</span>
                <div className="mt-1">
                  <Badge variant={certConfig.badgeVariant} size="md">
                    {certConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-navy-500">Eligibility:</span>
                <p className="font-semibold text-navy-800 mt-1">
                  {candidate.currentModuleNumber > 5 ? "Eligible for Approval" : "Modules 1–5 Required"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
              <strong className="block font-semibold mb-1">Mandatory Workflow Gatekeeper:</strong>
              Certificates transition to <code className="bg-blue-100 px-1 rounded font-mono">PENDING APPROVAL</code> only after the candidate passes all 5 Academy modules and the Final Assessment (&ge;70%). Only an authorized Admin approval issues the certificate and marks the candidate as <strong>Recruiter Ready</strong>.
            </div>

            <div className="pt-2 flex justify-end">
              <Link href="/admin/certificates">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Manage in Certificate Review Portal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
