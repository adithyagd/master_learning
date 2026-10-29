// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  getCertificatesList,
  getCandidateCertificateDetails,
  approveCertificate,
  rejectCertificate,
  issueCertificate,
  verifyCertificate,
} from "@/actions/certificate";
import { seedAcademyCurriculum } from "@/lib/academy-seed";
import { seedQuestionBank } from "@/lib/question-bank-seed";

describe("Phase 6: Certificate Review & Issuance Workflow", () => {
  let adminUser: { id: string; email: string; role: string };
  let candidateUser: { id: string; email: string; role: string; profileId: string };
  let eligibleCandidateUser: { id: string; email: string; role: string; profileId: string };
  let secondEligibleCandidate: { id: string; email: string; role: string; profileId: string };

  beforeAll(async () => {
    // 1. Seed base curriculum and question bank
    await seedAcademyCurriculum();
    await seedQuestionBank();

    // 2. Clean up any existing test records
    await prisma.certificate.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P6-CAND-INELIGIBLE", "P6-CAND-ELIGIBLE", "P6-CAND-SECOND"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p6_admin@e2epvtltd.com",
            "p6_ineligible@e2epvtltd.com",
            "p6_eligible@e2epvtltd.com",
            "p6_second@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword("Password123!");

    // 3. Create Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p6_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: admin.role };

    // 4. Create Ineligible Candidate (Module 2, has not taken Final Assessment)
    const ineligUser = await prisma.user.create({
      data: {
        email: "p6_ineligible@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P6-CAND-INELIGIBLE",
            fullName: "Ineligible Candidate",
            joiningDate: new Date(),
            currentModuleNumber: 2,
            isCertified: false,
            certificateStatus: "NOT_ELIGIBLE",
            academyStatus: "IN_PROGRESS",
          },
        },
      },
      include: { candidateProfile: true },
    });
    candidateUser = {
      id: ineligUser.id,
      email: ineligUser.email,
      role: ineligUser.role,
      profileId: ineligUser.candidateProfile!.id,
    };

    // 5. Create Eligible Candidate (Completed M1-M5 and Final Assessment)
    const finalAssessment = await prisma.assessment.findUnique({
      where: { slug: "final-assessment" },
    });

    const eligUser = await prisma.user.create({
      data: {
        email: "p6_eligible@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P6-CAND-ELIGIBLE",
            fullName: "Eligible Candidate",
            joiningDate: new Date(),
            currentModuleNumber: 6, // Beyond Module 5
            isCertified: false,
            certificateStatus: "PENDING_APPROVAL",
            academyStatus: "COMPLETED",
            academyCompletedAt: new Date(),
          },
        },
      },
      include: { candidateProfile: true },
    });
    eligibleCandidateUser = {
      id: eligUser.id,
      email: eligUser.email,
      role: eligUser.role,
      profileId: eligUser.candidateProfile!.id,
    };

    // Add passing Final Assessment attempt for Eligible Candidate
    if (finalAssessment) {
      await prisma.assessmentAttempt.create({
        data: {
          candidateProfileId: eligibleCandidateUser.profileId,
          assessmentId: finalAssessment.id,
          attemptNumber: 1,
          scorePercentage: 85,
          totalQuestions: 20,
          correctAnswers: 17,
          isPassed: true,
          status: "SUBMITTED",
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          submittedAt: new Date(),
        },
      });
    }

    // 6. Create Second Eligible Candidate (for Uniqueness testing)
    const secondUser = await prisma.user.create({
      data: {
        email: "p6_second@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P6-CAND-SECOND",
            fullName: "Second Candidate",
            joiningDate: new Date(),
            currentModuleNumber: 6,
            isCertified: false,
            certificateStatus: "PENDING_APPROVAL",
            academyStatus: "COMPLETED",
            academyCompletedAt: new Date(),
          },
        },
      },
      include: { candidateProfile: true },
    });
    secondEligibleCandidate = {
      id: secondUser.id,
      email: secondUser.email,
      role: secondUser.role,
      profileId: secondUser.candidateProfile!.id,
    };

    if (finalAssessment) {
      await prisma.assessmentAttempt.create({
        data: {
          candidateProfileId: secondEligibleCandidate.profileId,
          assessmentId: finalAssessment.id,
          attemptNumber: 1,
          scorePercentage: 90,
          totalQuestions: 20,
          correctAnswers: 18,
          isPassed: true,
          status: "SUBMITTED",
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          submittedAt: new Date(),
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.certificate.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P6-CAND-INELIGIBLE", "P6-CAND-ELIGIBLE", "P6-CAND-SECOND"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p6_admin@e2epvtltd.com",
            "p6_ineligible@e2epvtltd.com",
            "p6_eligible@e2epvtltd.com",
            "p6_second@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. AUTHORIZED ADMIN REVIEW & RBAC GUARDS
  // =========================================================================
  describe("1. Authorized Admin Review & Access Control", () => {
    it("strictly blocks unauthenticated and non-admin callers from viewing certificate queues", async () => {
      // Calling getCertificatesList without admin override
      const unauthRes = await getCertificatesList("PENDING_APPROVAL");
      expect(unauthRes.success).toBe(false);
      expect(unauthRes.message).toMatch(/unauthorized/i);

      // Calling with a candidate user override
      const candidateCaller = { id: candidateUser.id, email: candidateUser.email, role: "CANDIDATE" };
      const nonAdminRes = await getCertificatesList("ALL", candidateCaller);
      expect(nonAdminRes.success).toBe(false);
      expect(nonAdminRes.message).toMatch(/unauthorized/i);
    });

    it("allows authorized Admin to fetch pending, approved, and issued queues", async () => {
      const res = await getCertificatesList("ALL", adminUser);
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.counts).toBeDefined();
      expect(res.data?.counts.pending).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(res.data?.candidates)).toBe(true);

      const foundEligible = res.data?.candidates.find(
        (c) => c.candidateId === "P6-CAND-ELIGIBLE"
      );
      expect(foundEligible).toBeDefined();
      expect(foundEligible?.certificateStatus).toBe("PENDING_APPROVAL");
      expect(foundEligible?.finalScore).toBe(85);
    });

    it("blocks candidates from approving their own certificates (Self-Approval Block)", async () => {
      const candidateAsAdminAttempt = {
        id: eligibleCandidateUser.id, // Candidate trying to act on self
        email: eligibleCandidateUser.email,
        role: "ADMIN", // Even if role was spoofed or claimed
      };

      const res = await approveCertificate(
        eligibleCandidateUser.profileId,
        "Self approval attempt",
        candidateAsAdminAttempt
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/cannot approve their own certificate/i);
    });

    it("blocks non-admin users from approving or issuing certificates", async () => {
      const candidateUserOverride = {
        id: candidateUser.id,
        email: candidateUser.email,
        role: "CANDIDATE",
      };

      const approveRes = await approveCertificate(
        eligibleCandidateUser.profileId,
        "Notes",
        candidateUserOverride
      );
      expect(approveRes.success).toBe(false);
      expect(approveRes.message).toMatch(/unauthorized/i);

      const issueRes = await issueCertificate(
        eligibleCandidateUser.profileId,
        candidateUserOverride
      );
      expect(issueRes.success).toBe(false);
      expect(issueRes.message).toMatch(/unauthorized/i);
    });
  });

  // =========================================================================
  // 2. ELIGIBILITY VERIFICATION BEFORE APPROVAL
  // =========================================================================
  describe("2. Server-Side Eligibility Verification", () => {
    it("strictly blocks approving an ineligible candidate who has not completed the Academy", async () => {
      const res = await approveCertificate(
        candidateUser.profileId,
        "Premature approval",
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/eligibility requirements/i);

      // Verify DB record remained untouched
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: candidateUser.profileId },
      });
      expect(profile?.certificateStatus).toBe("NOT_ELIGIBLE");
      expect(profile?.approvedAt).toBeNull();
    });

    it("correctly evaluates eligibility via getCandidateCertificateDetails", async () => {
      const ineligibleDetails = await getCandidateCertificateDetails(candidateUser.profileId);
      expect(ineligibleDetails?.isEligible).toBe(false);

      const eligibleDetails = await getCandidateCertificateDetails(eligibleCandidateUser.profileId);
      expect(eligibleDetails).toBeDefined();
      expect(eligibleDetails?.candidate.candidateId).toBe("P6-CAND-ELIGIBLE");
      expect(eligibleDetails?.finalScore).toBe(85);
    });
  });

  // =========================================================================
  // 3. ADMIN ACTIONS: REJECT / REQUEST REVIEW
  // =========================================================================
  describe("3. Admin Rejection with Recorded Reason", () => {
    it("requires a specific reason when rejecting or requesting review", async () => {
      const emptyReasonRes = await rejectCertificate(
        eligibleCandidateUser.profileId,
        "",
        adminUser
      );
      expect(emptyReasonRes.success).toBe(false);
      expect(emptyReasonRes.message).toMatch(/reason is required/i);
    });

    it("records rejection reason and updates certificateStatus to REJECTED with audit trail", async () => {
      const rejectionReason = "Assessment integrity review required by panel.";
      const res = await rejectCertificate(
        eligibleCandidateUser.profileId,
        rejectionReason,
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.certificateStatus).toBe("REJECTED");
      expect(res.data?.rejectionReason).toBe(rejectionReason);

      // Verify in DB
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: eligibleCandidateUser.profileId },
      });
      expect(profile?.certificateStatus).toBe("REJECTED");
      expect(profile?.rejectionReason).toBe(rejectionReason);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetId: eligibleCandidateUser.profileId,
          action: "CERTIFICATE_REJECTED",
        },
      });
      expect(audit).toBeDefined();
      expect(audit?.details).toMatch(/Assessment integrity review/i);
    });
  });

  // =========================================================================
  // 4. ADMIN ACTIONS: APPROVE CERTIFICATE
  // =========================================================================
  describe("4. Authorized Admin Approval", () => {
    it("approves certificate for eligible candidate, logs approval audit, and clears rejection reason", async () => {
      const res = await approveCertificate(
        eligibleCandidateUser.profileId,
        "Re-verified after panel clarification. Passed with distinction.",
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.certificateStatus).toBe("APPROVED");
      expect(res.data?.approvedAt).toBeDefined();

      const profile = await prisma.candidateProfile.findUnique({
        where: { id: eligibleCandidateUser.profileId },
      });
      expect(profile?.certificateStatus).toBe("APPROVED");
      expect(profile?.approvedByAdminId).toBe(adminUser.id);
      expect(profile?.rejectionReason).toBeNull();

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetId: eligibleCandidateUser.profileId,
          action: "CERTIFICATE_APPROVED",
        },
      });
      expect(audit).toBeDefined();
      expect(audit?.userId).toBe(adminUser.id);
    });
  });

  // =========================================================================
  // 5. CERTIFICATE ISSUANCE, UNIQUENESS & WORKSPACE UNLOCKING
  // =========================================================================
  describe("5. Certificate Issuance & Workspace Unlocking", () => {
    let issuedCert1: { certificateNumber: string; verificationCode: string };
    let issuedCert2: { certificateNumber: string; verificationCode: string };

    it("generates a genuine certificate, marks candidate isCertified = true, and unlocks workspace", async () => {
      const res = await issueCertificate(eligibleCandidateUser.profileId, adminUser);

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.certificateNumber).toMatch(/^E2E-CERT-\d{4}-P6CANDELIGIBLE-[A-F0-9]{6}$/);
      expect(res.data?.verificationCode).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

      issuedCert1 = {
        certificateNumber: res.data!.certificateNumber,
        verificationCode: res.data!.verificationCode,
      };

      // Verify database state: Candidate is now Recruiter Ready
      const updatedProfile = await prisma.candidateProfile.findUnique({
        where: { id: eligibleCandidateUser.profileId },
        include: { certificate: true },
      });

      expect(updatedProfile?.isCertified).toBe(true);
      expect(updatedProfile?.certificateStatus).toBe("ISSUED");
      expect(updatedProfile?.certificate).toBeDefined();
      expect(updatedProfile?.certificate?.certificateNumber).toBe(issuedCert1.certificateNumber);
      expect(updatedProfile?.certificate?.status).toBe("ISSUED");
      expect(updatedProfile?.certificate?.finalScore).toBe(85);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetId: updatedProfile?.certificate?.id,
          action: "CERTIFICATE_ISSUED",
        },
      });
      expect(audit).toBeDefined();
    });

    it("guarantees unique Certificate IDs and verification codes across candidates", async () => {
      // Approve and issue second candidate
      await approveCertificate(secondEligibleCandidate.profileId, "Approved", adminUser);
      const res2 = await issueCertificate(secondEligibleCandidate.profileId, adminUser);

      expect(res2.success).toBe(true);
      issuedCert2 = {
        certificateNumber: res2.data!.certificateNumber,
        verificationCode: res2.data!.verificationCode,
      };

      // Ensure Certificate IDs and Verification Codes are completely unique
      expect(issuedCert1.certificateNumber).not.toBe(issuedCert2.certificateNumber);
      expect(issuedCert1.verificationCode).not.toBe(issuedCert2.verificationCode);
    });

    it("prevents duplicate certificate issuance for an already issued candidate", async () => {
      const initialCertCount = await prisma.certificate.count();

      // Attempt to issue certificate again to the first candidate
      const duplicateRes = await issueCertificate(
        eligibleCandidateUser.profileId,
        adminUser
      );

      expect(duplicateRes.success).toBe(true);
      expect(duplicateRes.message).toMatch(/already been issued/i);
      expect(duplicateRes.data?.certificateNumber).toBe(issuedCert1.certificateNumber);

      const finalCertCount = await prisma.certificate.count();
      expect(finalCertCount).toBe(initialCertCount); // No duplicate rows created
    });
  });

  // =========================================================================
  // 6. CERTIFICATE VERIFICATION (PUBLIC / AUDIT LOOKUP)
  // =========================================================================
  describe("6. Certificate Verification & Lookup", () => {
    it("verifies an authentic certificate using its Certificate Number", async () => {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: eligibleCandidateUser.profileId },
        include: { certificate: true },
      });

      const certNumber = profile!.certificate!.certificateNumber;
      const verifyRes = await verifyCertificate(certNumber);

      expect(verifyRes).not.toBeNull();
      expect(verifyRes?.isValid).toBe(true);
      expect(verifyRes?.certificateNumber).toBe(certNumber);
      expect(verifyRes?.candidateName).toBe("Eligible Candidate");
      expect(verifyRes?.candidateId).toBe("P6-CAND-ELIGIBLE");
      expect(verifyRes?.finalScore).toBe(85);
      expect(verifyRes?.status).toBe("ISSUED");
    });

    it("verifies an authentic certificate using its 16-character Verification Code", async () => {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: eligibleCandidateUser.profileId },
        include: { certificate: true },
      });

      const code = profile!.certificate!.verificationCode;
      const verifyRes = await verifyCertificate(code);

      expect(verifyRes).not.toBeNull();
      expect(verifyRes?.isValid).toBe(true);
      expect(verifyRes?.verificationCode).toBe(code);
      expect(verifyRes?.candidateId).toBe("P6-CAND-ELIGIBLE");
    });

    it("returns null for counterfeit or non-existent certificate identifiers", async () => {
      const fakeRes = await verifyCertificate("E2E-CERT-FAKE-NOT-REAL-9999");
      expect(fakeRes).toBeNull();
    });
  });
});
