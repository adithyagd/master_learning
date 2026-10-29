"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CertificatePreview } from "@/components/academy/CertificatePreview";
import {
  approveCertificate,
  rejectCertificate,
  issueCertificate,
} from "@/actions/certificate";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FileCheck,
  Send,
  RotateCcw,
  ShieldCheck,
  Calendar,
  User,
  Filter,
} from "lucide-react";

interface CandidateQueueItem {
  id: string;
  candidateId: string;
  fullName: string;
  email: string;
  location: string | null;
  joiningDate: Date | string;
  certificateStatus: string;
  isCertified: boolean;
  academyStatus: string;
  academyCompletedAt: Date | string | null;
  rejectionReason: string | null;
  approvedAt: Date | string | null;
  moduleScores: Array<{
    moduleNumber: number;
    moduleTitle: string;
    scorePercentage: number;
    isPassed: boolean;
  }>;
  finalScore: number | null;
  totalAttempts: number;
  certificateNumber?: string | null;
  issuedAt?: Date | string | null;
  verificationCode?: string | null;
}

interface CertificatesClientProps {
  initialTab?: "pending" | "approved" | "issued" | "rejected" | "all";
  counts: {
    pending: number;
    approved: number;
    issued: number;
    rejected: number;
    total: number;
  };
  candidates: CandidateQueueItem[];
}

export function CertificatesClient({
  initialTab = "pending",
  counts,
  candidates,
}: CertificatesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "issued" | "rejected" | "all">(initialTab);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateQueueItem | null>(null);

  // Modals state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter candidates by active tab
  const filteredCandidates = candidates.filter((c) => {
    if (activeTab === "pending") return c.certificateStatus === "PENDING_APPROVAL";
    if (activeTab === "approved") return c.certificateStatus === "APPROVED";
    if (activeTab === "issued") return c.certificateStatus === "ISSUED";
    if (activeTab === "rejected") return c.certificateStatus === "REJECTED";
    return true;
  });

  // Action handlers
  const handleApprove = (candidate: CandidateQueueItem) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await approveCertificate(candidate.id);
      if (res.success) {
        setActionSuccess(`Certificate approved for ${candidate.fullName}.`);
        setPreviewModalOpen(false);
        router.refresh();
      } else {
        setActionError(res.message || "Failed to approve certificate.");
      }
    });
  };

  const handleIssue = (candidate: CandidateQueueItem) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await issueCertificate(candidate.id);
      if (res.success) {
        setActionSuccess(`Certificate officially issued for ${candidate.fullName}! Candidate is now Recruiter Ready.`);
        setPreviewModalOpen(false);
        router.refresh();
      } else {
        setActionError(res.message || "Failed to issue certificate.");
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!selectedCandidate || !rejectReason.trim()) {
      setActionError("Please provide a specific reason for rejection or review request.");
      return;
    }

    startTransition(async () => {
      const res = await rejectCertificate(selectedCandidate.id, rejectReason);
      if (res.success) {
        setActionSuccess(`Certificate rejected for ${selectedCandidate.fullName}. Reason logged.`);
        setRejectModalOpen(false);
        setRejectReason("");
        setPreviewModalOpen(false);
        router.refresh();
      } else {
        setActionError(res.message || "Failed to reject certificate.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Review & Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Authorize recruiter certifications, review competency scorecards, and issue official credentials.
          </p>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <Link href="/admin/certificates/pending">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Approval
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
            }`}>
              {counts.pending}
            </span>
          </button>
        </Link>

        <Link href="/admin/certificates/approved">
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "approved"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Approved
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "approved" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
            }`}>
              {counts.approved}
            </span>
          </button>
        </Link>

        <Link href="/admin/certificates/issued">
          <button
            type="button"
            onClick={() => setActiveTab("issued")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "issued"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Issued
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "issued" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
            }`}>
              {counts.issued}
            </span>
          </button>
        </Link>

        <Link href="/admin/certificates">
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Rejected
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "rejected" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
            }`}>
              {counts.rejected}
            </span>
          </button>
        </Link>

        <Link href="/admin/certificates">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Candidates ({counts.total})
          </button>
        </Link>
      </div>

      {/* Candidate Queue List */}
      {filteredCandidates.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No candidates in this queue</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are currently no candidates matching the &quot;{activeTab}&quot; status filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCandidates.map((cand) => {
            const isPendingApproval = cand.certificateStatus === "PENDING_APPROVAL";
            const isApproved = cand.certificateStatus === "APPROVED";
            const isIssued = cand.certificateStatus === "ISSUED";
            const isRejected = cand.certificateStatus === "REJECTED";

            return (
              <Card
                key={cand.id}
                className="border-gray-200 hover:border-gray-300 transition-shadow shadow-sm overflow-hidden"
              >
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Candidate Info & Scorecard */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-gray-900">{cand.fullName}</h3>
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {cand.candidateId}
                      </span>
                      <Badge
                        variant={
                          isIssued
                            ? "success"
                            : isApproved
                            ? "info"
                            : isPendingApproval
                            ? "warning"
                            : isRejected
                            ? "danger"
                            : "default"
                        }
                      >
                        {cand.certificateStatus.replace("_", " ")}
                      </Badge>
                      {cand.isCertified && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Recruiter Ready
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Email: {cand.email}</span>
                      <span>Location: {cand.location || "Bangalore"}</span>
                      <span>
                        Completion Date:{" "}
                        {cand.academyCompletedAt
                          ? new Date(cand.academyCompletedAt).toLocaleDateString("en-IN")
                          : "In Progress"}
                      </span>
                    </div>

                    {/* Competency Module Scores */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-gray-700 mr-1">Modules:</span>
                      {cand.moduleScores.map((ms) => (
                        <span
                          key={ms.moduleNumber}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${
                            ms.isPassed
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                          title={`${ms.moduleTitle}: ${ms.scorePercentage}%`}
                        >
                          M{ms.moduleNumber}: {ms.scorePercentage}%
                        </span>
                      ))}

                      {/* Final Score Pill */}
                      <span
                        className={`text-xs px-3 py-1 rounded-lg font-bold border ml-2 ${
                          (cand.finalScore || 0) >= 70
                            ? "bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-300"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        Final Assessment: {cand.finalScore !== null ? `${cand.finalScore}%` : "Pending"}
                      </span>
                    </div>

                    {/* Rejection notice if rejected */}
                    {isRejected && cand.rejectionReason && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-0.5">
                        <span className="font-bold">Rejection / Review Reason:</span>
                        <p>{cand.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2.5 flex-shrink-0 min-w-[180px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setPreviewModalOpen(true);
                      }}
                      className="gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                      Preview Certificate
                    </Button>

                    {isPendingApproval && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleApprove(cand)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setRejectReason("");
                            setRejectModalOpen(true);
                          }}
                          className="text-rose-700 border-rose-300 hover:bg-rose-50 gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject / Review
                        </Button>
                      </>
                    )}

                    {isApproved && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleIssue(cand)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
                      >
                        <Award className="w-4 h-4" />
                        Issue Certificate
                      </Button>
                    )}

                    {isIssued && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setPreviewModalOpen(true);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        View / Print
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Certificate & Scorecard Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title="Formal Certificate Preview & Audit"
          description={`Reviewing credential eligibility for ${selectedCandidate.fullName} (${selectedCandidate.candidateId})`}
          size="xl"
        >
          <div className="space-y-6 pt-2">
            <CertificatePreview
              certificateNumber={
                selectedCandidate.certificateNumber ||
                `E2E-CERT-PREVIEW-${selectedCandidate.candidateId}`
              }
              verificationCode={
                selectedCandidate.verificationCode || "PREVIEW-AUTHENTICATED-SAMPLE-HASH"
              }
              candidateName={selectedCandidate.fullName}
              candidateId={selectedCandidate.candidateId}
              finalScore={selectedCandidate.finalScore || 80}
              completionDate={selectedCandidate.academyCompletedAt || new Date()}
              issuedAt={selectedCandidate.issuedAt || new Date()}
              approvedByAdminName="E2E Operations Controller"
              isDownloadable={selectedCandidate.certificateStatus === "ISSUED"}
            />

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                Close Preview
              </Button>

              <div className="flex items-center gap-2.5">
                {selectedCandidate.certificateStatus === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectReason("");
                        setRejectModalOpen(true);
                      }}
                      className="text-rose-700 border-rose-300 hover:bg-rose-50"
                    >
                      Reject with Reason
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(selectedCandidate)}
                      disabled={isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {isPending ? "Approving..." : "Approve Certificate"}
                    </Button>
                  </>
                )}

                {selectedCandidate.certificateStatus === "APPROVED" && (
                  <Button
                    variant="primary"
                    onClick={() => handleIssue(selectedCandidate)}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isPending ? "Issuing..." : "Issue Certificate (Unlock Workspace)"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject / Request Review Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject or Request Review"
          description={`Please provide an official audit reason for rejecting ${selectedCandidate.fullName}'s certificate.`}
        >
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Assessment completion anomalies detected; panel review requested before re-evaluation."
                rows={4}
                className="w-full text-sm rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRejectConfirm}
                disabled={isPending || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isPending ? "Logging Rejection..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
