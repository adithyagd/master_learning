import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAssessmentDetails, startAssessmentAttempt, getAssessmentReview } from "@/actions/assessment";
import { AssessmentEngine } from "@/components/academy/AssessmentEngine";
import { Navbar } from "@/components/layout/Navbar";
import { logoutUser } from "@/actions/auth";
import { prisma } from "@/lib/prisma";

interface AssessmentPageProps {
  params: Promise<{ assessmentSlug: string }>;
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Resolve candidate profile (or most recent if admin inspecting)
  let candidateProfile = user.candidateProfile;
  if (!candidateProfile && user.role === "ADMIN") {
    candidateProfile = await prisma.candidateProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  if (!candidateProfile) {
    redirect("/login");
  }

  const { assessmentSlug } = await params;
  const detailsRes = await getAssessmentDetails(assessmentSlug, candidateProfile.id);

  if (!detailsRes.success || !detailsRes.data) {
    notFound();
  }

  const { assessment, isLocked, lockReason, activeAttempt, latestAttempt } = detailsRes.data;

  // If there's an active IN_PROGRESS attempt, pre-load it server-side
  let initialActiveAttempt = null;
  if (activeAttempt) {
    const resumeRes = await startAssessmentAttempt(assessmentSlug, candidateProfile.id);
    if (resumeRes.success && resumeRes.data) {
      initialActiveAttempt = resumeRes.data.attempt;
    }
  }

  // Look up the next module slug server-side so the client doesn't need to guess it
  let nextModuleSlug: string | null = null;
  if (assessment.module) {
    const nextModule = await prisma.module.findFirst({
      where: { moduleNumber: assessment.module.moduleNumber + 1 },
      select: { slug: true },
    });
    nextModuleSlug = nextModule?.slug ?? null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: candidateProfile.fullName,
          email: user.email,
          role: user.role as "ADMIN" | "CANDIDATE" | "MANAGER",
          isCertified: candidateProfile.isCertified,
          candidateCode: candidateProfile.candidateId,
        }}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AssessmentEngine
          assessment={assessment}
          isLocked={isLocked}
          lockReason={lockReason}
          initialActiveAttempt={initialActiveAttempt}
          nextModuleSlug={nextModuleSlug}
          latestAttemptSummary={
            latestAttempt
              ? {
                  attemptNumber: latestAttempt.attemptNumber,
                  scorePercentage: latestAttempt.scorePercentage,
                  isPassed: latestAttempt.isPassed,
                  submittedAt: latestAttempt.submittedAt,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
