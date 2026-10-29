import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { CertificatePreview } from "@/components/academy/CertificatePreview";
import { logoutUser } from "@/actions/auth";
import {
  Award,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  XCircle,
  FileText,
} from "lucide-react";

export default async function CandidateCertificatePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    redirect("/login");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { id: user.candidateProfile.id },
    include: {
      certificate: true,
      assessmentAttempts: {
        where: { status: "SUBMITTED" },
        include: { assessment: true },
        orderBy: { scorePercentage: "desc" },
      },
    },
  });

  if (!profile) {
    redirect("/login");
  }

  const finalAttempt = profile.assessmentAttempts.find(
    (a) => a.assessment.type === "FINAL" && a.isPassed
  );

  const finalScore = profile.certificate?.finalScore || finalAttempt?.scorePercentage || 0;
  const isIssued = profile.certificateStatus === "ISSUED" && profile.isCertified && profile.certificate;
  const isPending = profile.certificateStatus === "PENDING_APPROVAL";
  const isApproved = profile.certificateStatus === "APPROVED";
  const isRejected = profile.certificateStatus === "REJECTED";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: profile.fullName,
          email: user.email,
          role: "CANDIDATE",
          isCertified: profile.isCertified,
          candidateCode: profile.candidateId,
        }}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/academy">
            <Button variant="ghost" size="sm" className="gap-2 text-navy-700 hover:text-navy-900">
              <ArrowLeft className="w-4 h-4" />
              Back to Recruiter Academy
            </Button>
          </Link>


        </div>

        {/* ISSUED STATE: Official Authenticated Certificate */}
        {isIssued && profile.certificate && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-950">
                    Credential Verified &amp; Officially Issued
                  </h2>
                  <p className="text-xs text-emerald-800">
                    Congratulations! Your E2E Procurement Recruiter Academy Credential is authenticated.
                  </p>
                </div>
              </div>

            </div>

            <CertificatePreview
              certificateNumber={profile.certificate.certificateNumber}
              verificationCode={profile.certificate.verificationCode}
              candidateName={profile.fullName}
              candidateId={profile.candidateId}
              finalScore={profile.certificate.finalScore}
              completionDate={profile.academyCompletedAt || profile.certificate.issuedAt}
              issuedAt={profile.certificate.issuedAt}
              approvedByAdminName={profile.certificate.approvedByAdminName || "Operations Controller"}
              isDownloadable={true}
            />
          </div>
        )}

        {/* PENDING APPROVAL STATE */}
        {isPending && (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="text-center pt-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-amber-950">
                Capstone Completed &bull; Certificate Pending Admin Review
              </CardTitle>
              <CardDescription className="text-amber-800 max-w-lg mx-auto text-xs">
                You have passed all 5 Academy modules and the Final Assessment with a qualifying score of {finalScore}%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl mx-auto text-center text-xs text-amber-900 leading-relaxed pb-8">
              <p>
                Per E2E Procurement quality governance standards, every candidate certification requires formal verification by an authorized Admin before issuance.
              </p>
              <div className="p-4 rounded-xl bg-white border border-amber-200 text-left space-y-2 text-xs">
                <div className="font-semibold text-navy-900">Current Verification Checklist:</div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Modules 1–5 Assessments Passed (&ge; 70%)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Final Capstone Evaluation Passed ({finalScore}%)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Authorized Admin Review &amp; Issuance: Pending</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Upon approval and issuance, your official credential and Recruitment Operations Workspace will automatically unlock.
              </p>
            </CardContent>
          </Card>
        )}

        {/* APPROVED STATE (Pending Issuance) */}
        {isApproved && (
          <Card className="border-blue-200 bg-blue-50/40">
            <CardHeader className="text-center pt-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-blue-950">
                Certificate Approved &bull; Final Issuance Queued
              </CardTitle>
              <CardDescription className="text-blue-800 max-w-lg mx-auto text-xs">
                Your qualification has been reviewed and authorized by an E2E Procurement Administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl mx-auto text-center text-xs text-blue-900 leading-relaxed pb-8">
              <p>
                Credential number generation and official sealing are underway. Please refresh shortly or await final issuance notification.
              </p>
            </CardContent>
          </Card>
        )}

        {/* REJECTED STATE */}
        {isRejected && (
          <Card className="border-rose-200 bg-rose-50/40">
            <CardHeader className="text-center pt-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-rose-950">
                Certification Review Requested / Not Approved
              </CardTitle>
              <CardDescription className="text-rose-800 max-w-lg mx-auto text-xs">
                The administrative panel has reviewed your submission and requested further review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl mx-auto text-xs text-rose-900 leading-relaxed pb-8">
              {profile.rejectionReason && (
                <div className="p-4 rounded-xl bg-white border border-rose-200 text-left space-y-1">
                  <span className="font-bold text-rose-950 block">Official Reason / Feedback:</span>
                  <p className="text-rose-800">{profile.rejectionReason}</p>
                </div>
              )}
              <div className="text-center pt-2">
                <Link href="/academy">
                  <Button variant="outline" size="sm" className="gap-2">
                    Return to Academy &bull; Reattempt Assessments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NOT ELIGIBLE STATE */}
        {!isIssued && !isPending && !isApproved && !isRejected && (
          <Card className="border-gray-200">
            <CardHeader className="text-center pt-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Certification Requirements Incomplete
              </CardTitle>
              <CardDescription className="text-gray-500 max-w-md mx-auto text-xs">
                To become an E2E Certified Recruiter, you must complete the entire curriculum and pass the Final Assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md mx-auto text-center text-xs text-gray-600 pb-8">
              <p>
                You are currently at Module {profile.currentModuleNumber} of 5. Finish all remaining lessons and assessments to unlock certificate review.
              </p>
              <Link href="/academy">
                <Button variant="primary" size="sm" className="gap-2">
                  Continue Learning
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
