"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback in test runners
  }
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Returns certificate queues grouped by status: PENDING_APPROVAL, APPROVED, ISSUED, REJECTED.
 * Strictly restricted to authorized Admins.
 */
export async function getCertificatesList(
  statusFilter?: "ALL" | "PENDING_APPROVAL" | "APPROVED" | "ISSUED" | "REJECTED",
  adminUserOverride?: { id: string; email: string; role: string }
): Promise<ActionResponse<{
  counts: {
    pending: number;
    approved: number;
    issued: number;
    rejected: number;
    total: number;
  };
  candidates: Array<{
    id: string;
    candidateId: string;
    fullName: string;
    email: string;
    location: string | null;
    joiningDate: Date;
    certificateStatus: string;
    isCertified: boolean;
    academyStatus: string;
    academyCompletedAt: Date | null;
    rejectionReason: string | null;
    approvedAt: Date | null;
    moduleScores: Array<{
      moduleNumber: number;
      moduleTitle: string;
      scorePercentage: number;
      isPassed: boolean;
    }>;
    finalScore: number | null;
    totalAttempts: number;
    certificateNumber?: string | null;
    issuedAt?: Date | null;
    verificationCode?: string | null;
  }>;
}>> {
  try {
    const user = adminUserOverride || (await getCurrentUser());
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    // Fetch all candidates with attempts and certificate relation
    const allCandidates = await prisma.candidateProfile.findMany({
      include: {
        user: { select: { email: true } },
        certificate: true,
        assessmentAttempts: {
          where: { status: "SUBMITTED" },
          orderBy: { createdAt: "desc" },
          include: {
            assessment: {
              include: { module: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Counts
    const counts = {
      pending: allCandidates.filter((c) => c.certificateStatus === "PENDING_APPROVAL").length,
      approved: allCandidates.filter((c) => c.certificateStatus === "APPROVED").length,
      issued: allCandidates.filter((c) => c.certificateStatus === "ISSUED").length,
      rejected: allCandidates.filter((c) => c.certificateStatus === "REJECTED").length,
      total: allCandidates.length,
    };

    // Filter candidates
    let filtered = allCandidates;
    if (statusFilter && statusFilter !== "ALL") {
      filtered = allCandidates.filter((c) => c.certificateStatus === statusFilter);
    }

    const mappedCandidates = filtered.map((c) => {
      // Calculate highest score for each module 1..5
      const moduleScores: Array<{
        moduleNumber: number;
        moduleTitle: string;
        scorePercentage: number;
        isPassed: boolean;
      }> = [];

      for (let m = 1; m <= 5; m++) {
        const attemptsForMod = c.assessmentAttempts.filter(
          (a) => a.assessment.module?.moduleNumber === m
        );
        const bestAttempt = attemptsForMod.sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

        moduleScores.push({
          moduleNumber: m,
          moduleTitle: bestAttempt?.assessment.title || `Module ${m}`,
          scorePercentage: bestAttempt ? bestAttempt.scorePercentage : 0,
          isPassed: bestAttempt ? bestAttempt.isPassed : false,
        });
      }

      // Final Assessment attempt
      const finalAttempts = c.assessmentAttempts.filter((a) => a.assessment.type === "FINAL");
      const bestFinal = finalAttempts.sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

      return {
        id: c.id,
        candidateId: c.candidateId,
        fullName: c.fullName,
        email: c.user.email,
        location: c.location,
        joiningDate: c.joiningDate,
        certificateStatus: c.certificateStatus,
        isCertified: c.isCertified,
        academyStatus: c.academyStatus,
        academyCompletedAt: c.academyCompletedAt,
        rejectionReason: c.rejectionReason,
        approvedAt: c.approvedAt,
        moduleScores,
        finalScore: bestFinal ? bestFinal.scorePercentage : null,
        totalAttempts: c.assessmentAttempts.length,
        certificateNumber: c.certificate?.certificateNumber || null,
        issuedAt: c.certificate?.issuedAt || null,
        verificationCode: c.certificate?.verificationCode || null,
      };
    });

    return {
      success: true,
      data: {
        counts,
        candidates: mappedCandidates,
      },
    };
  } catch (error) {
    console.error("getCertificatesList error:", error);
    return { success: false, message: "Internal server error fetching certificate queue." };
  }
}

/**
 * Returns comprehensive certificate profile data for formal preview, eligibility audit, and issuance.
 */
export async function getCandidateCertificateDetails(candidateProfileId: string) {
  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        user: { select: { email: true } },
        certificate: true,
        assessmentAttempts: {
          where: { status: "SUBMITTED" },
          orderBy: { createdAt: "desc" },
          include: {
            assessment: {
              include: { module: true },
            },
          },
        },
      },
    });

    if (!candidate) return null;

    // Module scores
    const moduleScores: Array<{
      moduleNumber: number;
      moduleTitle: string;
      scorePercentage: number;
      isPassed: boolean;
      attemptsCount: number;
    }> = [];

    for (let m = 1; m <= 5; m++) {
      const attemptsForMod = candidate.assessmentAttempts.filter(
        (a) => a.assessment.module?.moduleNumber === m
      );
      const bestAttempt = attemptsForMod.sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

      moduleScores.push({
        moduleNumber: m,
        moduleTitle: bestAttempt?.assessment.title || `Module ${m}`,
        scorePercentage: bestAttempt ? bestAttempt.scorePercentage : 0,
        isPassed: bestAttempt ? bestAttempt.isPassed : false,
        attemptsCount: attemptsForMod.length,
      });
    }

    const finalAttempts = candidate.assessmentAttempts.filter((a) => a.assessment.type === "FINAL");
    const bestFinal = finalAttempts.sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

    // Eligibility validation
    const hasPassedAllModules = moduleScores.every((ms) => ms.isPassed);
    const hasPassedFinal = bestFinal ? bestFinal.scorePercentage >= 70 : false;
    const isEligible = hasPassedAllModules && hasPassedFinal;

    return {
      candidate: {
        id: candidate.id,
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        email: candidate.user.email,
        location: candidate.location,
        joiningDate: candidate.joiningDate,
        certificateStatus: candidate.certificateStatus,
        isCertified: candidate.isCertified,
        academyStatus: candidate.academyStatus,
        academyCompletedAt: candidate.academyCompletedAt,
        rejectionReason: candidate.rejectionReason,
        approvedAt: candidate.approvedAt,
        approvedByAdminId: candidate.approvedByAdminId,
      },
      moduleScores,
      finalScore: bestFinal ? bestFinal.scorePercentage : null,
      finalAttemptsCount: finalAttempts.length,
      isEligible,
      certificate: candidate.certificate,
    };
  } catch (error) {
    console.error("getCandidateCertificateDetails error:", error);
    return null;
  }
}

/**
 * Approve a candidate's certificate.
 * Strictly restricted to authorized Admins.
 * Validates eligibility server-side and logs audit trail.
 */
export async function approveCertificate(
  candidateProfileId: string,
  adminNotes?: string,
  adminUserOverride?: { id: string; email: string; role: string }
): Promise<ActionResponse<{ certificateStatus: string; approvedAt: Date }>> {
  try {
    const admin = adminUserOverride || (await getCurrentUser());
    if (!admin || admin.role !== "ADMIN") {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        certificate: true,
        assessmentAttempts: {
          where: { status: "SUBMITTED" },
          include: { assessment: true },
        },
      },
    });

    if (!candidate) {
      return { success: false, message: "Candidate profile not found." };
    }

    // Candidate cannot approve their own certificate
    if (admin.id === candidate.userId) {
      return { success: false, message: "Unauthorized. A candidate cannot approve their own certificate." };
    }

    // Eligibility check
    const bestFinal = candidate.assessmentAttempts
      .filter((a) => a.assessment.type === "FINAL" && a.isPassed)
      .sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

    if (!bestFinal || candidate.currentModuleNumber <= 5) {
      return {
        success: false,
        message: "Candidate does not meet eligibility requirements: All 5 modules and Final Assessment must be passed with >= 70%.",
      };
    }

    // Duplicate issuance protection
    if (candidate.certificate && candidate.certificateStatus === "ISSUED") {
      return {
        success: true,
        message: "Certificate has already been issued.",
        data: { certificateStatus: "ISSUED", approvedAt: candidate.approvedAt || new Date() },
      };
    }

    const approvedAt = new Date();

    // Generate unique Certificate Number and Verification Hash
    const year = new Date().getFullYear();
    const cleanCandId = candidate.candidateId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const certificateNumber = `E2E-CERT-${year}-${cleanCandId}-${randomHex}`;

    const rawHash = crypto
      .createHash("sha256")
      .update(`${certificateNumber}-${candidate.id}-${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    const verificationCode = `${rawHash.slice(0, 4)}-${rawHash.slice(4, 8)}-${rawHash.slice(8, 12)}-${rawHash.slice(12, 16)}`;

    // Atomically approve + issue certificate and unlock workspace
    await prisma.$transaction(async (tx) => {
      await tx.certificate.create({
        data: {
          certificateNumber,
          candidateProfileId: candidate.id,
          finalScore: bestFinal.scorePercentage,
          issuedAt: approvedAt,
          approvedByAdminId: admin.id,
          approvedByAdminName: admin.email,
          status: "ISSUED",
          verificationCode,
          metadata: JSON.stringify({
            organization: "E2E Procurement Private Limited",
            cin: "U78300KA2025PTC204064",
            credentialTitle: "Certified Recruiter — Recruiter Ready",
            candidateName: candidate.fullName,
            candidateId: candidate.candidateId,
            finalScore: bestFinal.scorePercentage,
            passingBenchmark: 70,
            completionDate: candidate.academyCompletedAt?.toISOString() || approvedAt.toISOString(),
            approvedBy: admin.email,
            adminNotes: adminNotes || null,
          }),
        },
      });

      await tx.candidateProfile.update({
        where: { id: candidate.id },
        data: {
          isCertified: true,
          certificateStatus: "ISSUED",
          approvedAt,
          approvedByAdminId: admin.id,
          rejectionReason: null,
        },
      });
    });

    await recordAuditLog({
      userId: admin.id,
      action: "CERTIFICATE_APPROVED",
      targetType: "CERTIFICATE",
      targetId: candidate.id,
      details: {
        candidateId: candidate.candidateId,
        candidateName: candidate.fullName,
        approvedBy: admin.email,
        certificateNumber,
        adminNotes: adminNotes || null,
      },
    });

    safeRevalidate("/admin/certificates");
    safeRevalidate("/admin/certificates/pending");
    safeRevalidate("/admin/certificates/approved");
    safeRevalidate("/admin/certificates/issued");
    safeRevalidate(`/admin/candidates/${candidate.id}`);
    safeRevalidate("/academy/certificate");

    return {
      success: true,
      data: {
        certificateStatus: "ISSUED",
        approvedAt,
      },
    };
  } catch (error) {
    console.error("approveCertificate error:", error);
    return { success: false, message: "Internal server error approving certificate." };
  }
}

/**
 * Rejects or requests review of a candidate's certificate with a recorded reason.
 * Strictly restricted to authorized Admins.
 */
export async function rejectCertificate(
  candidateProfileId: string,
  reason: string,
  adminUserOverride?: { id: string; email: string; role: string }
): Promise<ActionResponse<{ certificateStatus: string; rejectionReason: string }>> {
  try {
    const admin = adminUserOverride || (await getCurrentUser());
    if (!admin || admin.role !== "ADMIN") {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, message: "A specific rejection or review reason is required." };
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
    });

    if (!candidate) {
      return { success: false, message: "Candidate profile not found." };
    }

    const trimmedReason = reason.trim();

    await prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        certificateStatus: "REJECTED",
        rejectionReason: trimmedReason,
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "CERTIFICATE_REJECTED",
      targetType: "CERTIFICATE",
      targetId: candidate.id,
      details: {
        candidateId: candidate.candidateId,
        candidateName: candidate.fullName,
        rejectedBy: admin.email,
        rejectionReason: trimmedReason,
      },
    });

    safeRevalidate("/admin/certificates");
    safeRevalidate("/admin/certificates/pending");
    safeRevalidate("/admin/certificates/rejected");
    safeRevalidate(`/admin/candidates/${candidate.id}`);

    return {
      success: true,
      data: {
        certificateStatus: "REJECTED",
        rejectionReason: trimmedReason,
      },
    };
  } catch (error) {
    console.error("rejectCertificate error:", error);
    return { success: false, message: "Internal server error rejecting certificate." };
  }
}

/**
 * Issues the formal certificate, generates unique Certificate ID and Verification Hash,
 * marks candidate RECRUITER READY (isCertified = true), and unlocks /workspace.
 * Strictly restricted to authorized Admins.
 * Protects against duplicate issuance and unauthorized self-issuance.
 */
export async function issueCertificate(
  candidateProfileId: string,
  adminUserOverride?: { id: string; email: string; role: string }
): Promise<ActionResponse<{
  certificateId: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: Date;
}>> {
  try {
    const admin = adminUserOverride || (await getCurrentUser());
    if (!admin || admin.role !== "ADMIN") {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        certificate: true,
        assessmentAttempts: {
          where: { status: "SUBMITTED" },
          include: { assessment: true },
        },
      },
    });

    if (!candidate) {
      return { success: false, message: "Candidate profile not found." };
    }

    // Candidate cannot issue their own certificate
    if (admin.id === candidate.userId) {
      return { success: false, message: "Unauthorized. A candidate cannot issue their own certificate." };
    }

    // Duplicate issuance protection
    if (candidate.certificate && candidate.certificateStatus === "ISSUED") {
      return {
        success: true,
        message: "Certificate has already been issued.",
        data: {
          certificateId: candidate.certificate.id,
          certificateNumber: candidate.certificate.certificateNumber,
          verificationCode: candidate.certificate.verificationCode,
          issuedAt: candidate.certificate.issuedAt,
        },
      };
    }

    // Eligibility check
    const bestFinal = candidate.assessmentAttempts
      .filter((a) => a.assessment.type === "FINAL" && a.isPassed)
      .sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

    if (!bestFinal || candidate.currentModuleNumber <= 5) {
      return {
        success: false,
        message: "Candidate does not meet certification criteria: Final Assessment must be passed with >= 70%.",
      };
    }

    // Generate unique Certificate Number: E2E-CERT-YYYY-CANDIDATEID-XXXX
    const year = new Date().getFullYear();
    const cleanCandId = candidate.candidateId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const certificateNumber = `E2E-CERT-${year}-${cleanCandId}-${randomHex}`;

    // Generate unique verification code (16-char formatted hash)
    const rawHash = crypto
      .createHash("sha256")
      .update(`${certificateNumber}-${candidate.id}-${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    const verificationCode = `${rawHash.slice(0, 4)}-${rawHash.slice(4, 8)}-${rawHash.slice(8, 12)}-${rawHash.slice(12, 16)}`;

    const issuedAt = new Date();

    // Transactional certificate creation & Recruiter Ready activation
    const newCert = await prisma.$transaction(async (tx) => {
      const cert = await tx.certificate.create({
        data: {
          certificateNumber,
          candidateProfileId: candidate.id,
          finalScore: bestFinal.scorePercentage,
          issuedAt,
          approvedByAdminId: admin.id,
          approvedByAdminName: admin.email,
          status: "ISSUED",
          verificationCode,
          metadata: JSON.stringify({
            organization: "E2E Procurement Private Limited",
            cin: "U78300KA2025PTC204064",
            credentialTitle: "Certified Recruiter — Recruiter Ready",
            candidateName: candidate.fullName,
            candidateId: candidate.candidateId,
            finalScore: bestFinal.scorePercentage,
            passingBenchmark: 70,
            completionDate: candidate.academyCompletedAt?.toISOString() || issuedAt.toISOString(),
            approvedBy: admin.email,
          }),
        },
      });

      // Mark candidate RECRUITER READY and allow access to /workspace
      await tx.candidateProfile.update({
        where: { id: candidate.id },
        data: {
          isCertified: true,
          certificateStatus: "ISSUED",
          approvedAt: candidate.approvedAt || issuedAt,
          approvedByAdminId: candidate.approvedByAdminId || admin.id,
        },
      });

      return cert;
    });

    // Record Audit Log
    await recordAuditLog({
      userId: admin.id,
      action: "CERTIFICATE_ISSUED",
      targetType: "CERTIFICATE",
      targetId: newCert.id,
      details: {
        certificateNumber,
        candidateId: candidate.candidateId,
        candidateName: candidate.fullName,
        issuedBy: admin.email,
        verificationCode,
        finalScore: bestFinal.scorePercentage,
      },
    });

    safeRevalidate("/admin/certificates");
    safeRevalidate("/admin/certificates/pending");
    safeRevalidate("/admin/certificates/approved");
    safeRevalidate("/admin/certificates/issued");
    safeRevalidate(`/admin/candidates/${candidate.id}`);
    safeRevalidate("/academy");
    safeRevalidate("/workspace");

    return {
      success: true,
      data: {
        certificateId: newCert.id,
        certificateNumber: newCert.certificateNumber,
        verificationCode: newCert.verificationCode,
        issuedAt: newCert.issuedAt,
      },
    };
  } catch (error) {
    console.error("issueCertificate error:", error);
    return { success: false, message: "Internal server error issuing certificate." };
  }
}

/**
 * Public or authorized verification of a certificate by certificateNumber or verificationCode.
 */
export async function verifyCertificate(identifier: string) {
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateNumber: identifier.trim().toUpperCase() },
          { verificationCode: identifier.trim().toUpperCase() },
        ],
      },
      include: {
        candidateProfile: {
          select: {
            candidateId: true,
            fullName: true,
            location: true,
            joiningDate: true,
          },
        },
      },
    });

    if (!cert) return null;

    let meta: Record<string, unknown> = {};
    try {
      meta = cert.metadata ? JSON.parse(cert.metadata) : {};
    } catch {
      meta = {};
    }

    return {
      isValid: true,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      status: cert.status,
      issuedAt: cert.issuedAt,
      candidateName: cert.candidateProfile.fullName,
      candidateId: cert.candidateProfile.candidateId,
      finalScore: cert.finalScore,
      approvedByAdminName: cert.approvedByAdminName,
      metadata: meta,
    };
  } catch (error) {
    console.error("verifyCertificate error:", error);
    return null;
  }
}
