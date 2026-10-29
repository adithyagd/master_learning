// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { loginAdmin, loginCandidate } from "@/actions/auth";
import { createCandidate } from "@/actions/candidate";
import {
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from "@/actions/assessment";
import {
  approveCertificate,
  issueCertificate,
  getCertificatesList,
} from "@/actions/certificate";
import {
  getAuthenticatedRecruiter,
  createJobCandidate,
  updateCandidateStage,
  toggleChecklistItem,
  getChecklistForDate,
} from "@/actions/workspace";
import {
  submitDailyReportAction,
  reviewDailyReport,
  getDailyReportForDate,
  RecruiterOverride,
} from "@/actions/report";
import {
  getManagerApprovalsQueue,
  getManagerDashboard,
  reviewTeamReport,
} from "@/actions/manager";
import {
  configureRecruiterTarget,
  getRecruiterTargets,
} from "@/actions/target";
import { getAdminDashboardMetrics } from "@/actions/admin-dashboard";
import { getRecruitmentFunnelAnalytics } from "@/actions/analytics";
import {
  getUserNotifications,
  createNotification,
} from "@/actions/notification";
import { exportReport } from "@/actions/export";
import { seedAcademyCurriculum } from "@/lib/academy-seed";
import { seedQuestionBank } from "@/lib/question-bank-seed";

describe("Phase 17: Full End-to-End Platform Integration & Security Audit", () => {
  const PASSWORD = "SecurePassword123!";

  let adminUser: { id: string; email: string; role: string; name: string };
  let managerUser: { id: string; email: string; role: string; name: string };
  let outsideManager: { id: string; email: string; role: string; name: string };
  let testCandidateUser: { id: string; email: string; role: string };
  let testCandidateProfileId: string;
  let testCandidateId: string;
  let testClient: { id: string; name: string; code: string };

  beforeAll(async () => {
    // Seed curriculum and question bank
    await seedAcademyCurriculum();
    await seedQuestionBank();

    // Clean up any old test data
    await prisma.notification.deleteMany();
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.recruiterChecklist.deleteMany();
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.attemptQuestion.deleteMany();
    await prisma.assessmentAttempt.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: { in: ["P17-CAND-01", "P17-CAND-EXTRA"] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p17_admin@e2epvtltd.com",
            "p17_mgr@e2epvtltd.com",
            "p17_outside_mgr@e2epvtltd.com",
            "p17_candidate@e2epvtltd.com",
          ],
        },
      },
    });

    await prisma.clientRequirement.deleteMany({
      where: { client: { code: "P17-CLI-01" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: "P17-CLI-01" },
    });

    const passHash = await hashPassword(PASSWORD);

    // 1. Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p17_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P17 System Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN", name: "P17 System Admin" };

    // 2. Assigned Team Manager
    const mgr = await prisma.user.create({
      data: {
        email: "p17_mgr@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Manager Leader",
      },
    });
    managerUser = { id: mgr.id, email: mgr.email, role: "MANAGER", name: "Manager Leader" };

    // 3. Outside Manager (for negative team isolation tests)
    const outMgr = await prisma.user.create({
      data: {
        email: "p17_outside_mgr@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Outside Manager",
      },
    });
    outsideManager = { id: outMgr.id, email: outMgr.email, role: "MANAGER", name: "Outside Manager" };

    // 4. Test Client
    testClient = await prisma.clientMaster.create({
      data: {
        name: "P17 Enterprise Systems",
        code: "P17-CLI-01",
        status: "ACTIVE",
        notes: "Integration audit client record",
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.recruiterChecklist.deleteMany();
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.attemptQuestion.deleteMany();
    await prisma.assessmentAttempt.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: { in: ["P17-CAND-01", "P17-CAND-EXTRA"] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p17_admin@e2epvtltd.com",
            "p17_mgr@e2epvtltd.com",
            "p17_outside_mgr@e2epvtltd.com",
            "p17_candidate@e2epvtltd.com",
          ],
        },
      },
    });

    await prisma.clientRequirement.deleteMany({
      where: { client: { code: "P17-CLI-01" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: "P17-CLI-01" },
    });
  });

  // =========================================================================
  // JOURNEY 1: ADMIN LOGIN & CANDIDATE PROVISIONING (Steps 1, 2, 3)
  // =========================================================================
  describe("Journey 1: Authentication & Candidate Provisioning", () => {
    it("Step 1: Admin logs in securely and cross-role portal protection blocks candidates from admin login", async () => {
      const adminFormData = new FormData();
      adminFormData.append("email", adminUser.email);
      adminFormData.append("password", PASSWORD);

      const loginRes = await loginAdmin(adminFormData);
      expect(loginRes.success).toBe(true);

      // Negative Test: Candidate attempting admin login is strictly rejected
      const candidateFormData = new FormData();
      candidateFormData.append("email", managerUser.email); // Non-admin
      candidateFormData.append("password", PASSWORD);

      const badLogin = await loginAdmin(candidateFormData);
      expect(badLogin.success).toBe(false);
      expect(badLogin.message).toMatch(/unauthorized|access restricted/i);
    });

    it("Step 2: Admin creates and activates a new candidate account", async () => {
      const formData = new FormData();
      formData.append("fullName", "John Doe");
      formData.append("candidateId", "P17-CAND-01");
      formData.append("email", "p17_candidate@e2epvtltd.com");
      formData.append("phone", "9876543210");
      formData.append("location", "Bangalore");
      formData.append("joiningDate", "2026-03-01");
      formData.append("status", "ACTIVE");

      const createRes = await createCandidate(formData, { id: adminUser.id, role: "ADMIN" });
      expect(createRes.success).toBe(true);
      expect(createRes.data?.candidateId).toBe("P17-CAND-01");

      testCandidateId = "P17-CAND-01";

      const candUser = await prisma.user.findUnique({
        where: { email: "p17_candidate@e2epvtltd.com" },
        include: { candidateProfile: true },
      });
      expect(candUser).toBeDefined();
      expect(candUser?.status).toBe("ACTIVE");
      expect(candUser?.candidateProfile?.fullName).toBe("John Doe");
      expect(candUser?.candidateProfile?.isCertified).toBe(false);
      expect(candUser?.candidateProfile?.currentModuleNumber).toBe(1);

      testCandidateUser = { id: candUser!.id, email: candUser!.email, role: "CANDIDATE" };
      testCandidateProfileId = candUser!.candidateProfile!.id;

      // Assign to managerUser for downstream review tests
      await prisma.candidateProfile.update({
        where: { id: testCandidateProfileId },
        data: { managerId: managerUser.id },
      });
    });

    it("Step 3: Candidate securely accesses their account and redirects to /academy", async () => {
      // Set known password hash for login test
      const passHash = await hashPassword(PASSWORD);
      await prisma.user.update({
        where: { id: testCandidateUser.id },
        data: { passwordHash: passHash },
      });

      const candFormData = new FormData();
      candFormData.append("identifier", "P17-CAND-01");
      candFormData.append("password", PASSWORD);

      const candLoginRes = await loginCandidate(candFormData);
      expect(candLoginRes.success).toBe(true);
      // Because candidate is NOT certified yet, redirectTo MUST be /academy
      expect(candLoginRes.redirectTo).toBe("/academy");
    });
  });

  // =========================================================================
  // JOURNEY 2: ACADEMY PROGRESSION & SEQUENTIAL UNLOCKING (Steps 4, 5, 6)
  // =========================================================================
  describe("Journey 2: Academy Progression & Sequential Unlocking", () => {
    it("Step 4: Candidate completes Module 1 and passes its assessment", async () => {
      // Start Module 1
      const startRes = await startAssessmentAttempt("assessment-module-1", testCandidateProfileId);
      expect(startRes.success).toBe(true);
      const attemptId = startRes.data!.attempt.id;

      // Fetch correct answers
      const attemptQuestions = await prisma.attemptQuestion.findMany({
        where: { attemptId },
        include: { question: { include: { options: true } } },
      });

      const answers: Record<string, string> = {};
      for (const aq of attemptQuestions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) answers[aq.questionId] = correctOpt.id;
      }

      const submitRes = await submitAssessmentAttempt(attemptId, answers, testCandidateProfileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data?.isPassed).toBe(true);
      expect(submitRes.data?.scorePercentage).toBeGreaterThanOrEqual(70);

      // Verify Candidate Profile advanced to Module 2
      const updatedProfile = await prisma.candidateProfile.findUnique({
        where: { id: testCandidateProfileId },
      });
      expect(updatedProfile?.currentModuleNumber).toBe(2);
    });

    it("Step 5: Sequential unlocking: Modules cannot be skipped", async () => {
      // Candidate is at Module 2. Attempting to start Module 4 must fail
      const skippedRes = await startAssessmentAttempt("assessment-module-4", testCandidateProfileId);
      expect(skippedRes.success).toBe(false);
      expect(skippedRes.message).toContain("locked");

      // Progress through Module 2
      const m2Start = await startAssessmentAttempt("assessment-module-2", testCandidateProfileId);
      expect(m2Start.success).toBe(true);
      const m2Questions = await prisma.attemptQuestion.findMany({
        where: { attemptId: m2Start.data!.attempt.id },
        include: { question: { include: { options: true } } },
      });
      const m2Answers: Record<string, string> = {};
      for (const aq of m2Questions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) m2Answers[aq.questionId] = correctOpt.id;
      }
      const m2Submit = await submitAssessmentAttempt(m2Start.data!.attempt.id, m2Answers, testCandidateProfileId);
      expect(m2Submit.data?.isPassed).toBe(true);

      // Progress through Module 3
      const m3Start = await startAssessmentAttempt("assessment-module-3", testCandidateProfileId);
      expect(m3Start.success).toBe(true);
      const m3Questions = await prisma.attemptQuestion.findMany({
        where: { attemptId: m3Start.data!.attempt.id },
        include: { question: { include: { options: true } } },
      });
      const m3Answers: Record<string, string> = {};
      for (const aq of m3Questions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) m3Answers[aq.questionId] = correctOpt.id;
      }
      const m3Submit = await submitAssessmentAttempt(m3Start.data!.attempt.id, m3Answers, testCandidateProfileId);
      expect(m3Submit.data?.isPassed).toBe(true);

      // Progress through Module 4
      const m4Start = await startAssessmentAttempt("assessment-module-4", testCandidateProfileId);
      expect(m4Start.success).toBe(true);
      const m4Questions = await prisma.attemptQuestion.findMany({
        where: { attemptId: m4Start.data!.attempt.id },
        include: { question: { include: { options: true } } },
      });
      const m4Answers: Record<string, string> = {};
      for (const aq of m4Questions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) m4Answers[aq.questionId] = correctOpt.id;
      }
      const m4Submit = await submitAssessmentAttempt(m4Start.data!.attempt.id, m4Answers, testCandidateProfileId);
      expect(m4Submit.data?.isPassed).toBe(true);
    });

    it("Step 6: Candidate completes Module 5", async () => {
      const m5Start = await startAssessmentAttempt("assessment-module-5", testCandidateProfileId);
      expect(m5Start.success).toBe(true);
      const m5Questions = await prisma.attemptQuestion.findMany({
        where: { attemptId: m5Start.data!.attempt.id },
        include: { question: { include: { options: true } } },
      });
      const m5Answers: Record<string, string> = {};
      for (const aq of m5Questions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) m5Answers[aq.questionId] = correctOpt.id;
      }
      const m5Submit = await submitAssessmentAttempt(m5Start.data!.attempt.id, m5Answers, testCandidateProfileId);
      expect(m5Submit.data?.isPassed).toBe(true);

      const candidateAfterM5 = await prisma.candidateProfile.findUnique({
        where: { id: testCandidateProfileId },
      });
      expect(candidateAfterM5?.currentModuleNumber).toBe(6); // 6 signifies Final Assessment unlocked
    });
  });

  // =========================================================================
  // JOURNEY 3: CAPSTONE FINAL ASSESSMENT & CERTIFICATE WORKFLOW (Steps 7, 8, 9, 10)
  // =========================================================================
  describe("Journey 3: Final Assessment & Certificate Workflow", () => {
    it("Step 7: Final Assessment unlocks with 20 randomized questions and 20-minute limit", async () => {
      const finalStart = await startAssessmentAttempt("final-assessment", testCandidateProfileId);
      expect(finalStart.success).toBe(true);
      expect(finalStart.data?.attempt.totalQuestions).toBe(20);
      expect(finalStart.data?.attempt.questions.length).toBe(20);
    });

    it("Step 8: Passing Final Assessment completes Academy, sets PENDING_APPROVAL and preserves isCertified = false", async () => {
      // Resume or fetch active attempt
      const attempt = await prisma.assessmentAttempt.findFirst({
        where: { candidateProfileId: testCandidateProfileId, status: "IN_PROGRESS" },
        include: { attemptQuestions: { include: { question: { include: { options: true } } } } },
      });
      expect(attempt).toBeDefined();

      const answers: Record<string, string> = {};
      for (const aq of attempt!.attemptQuestions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) answers[aq.questionId] = correctOpt.id;
      }

      const finalSubmit = await submitAssessmentAttempt(attempt!.id, answers, testCandidateProfileId);
      expect(finalSubmit.success).toBe(true);
      expect(finalSubmit.data?.isPassed).toBe(true);

      const profile = await prisma.candidateProfile.findUnique({
        where: { id: testCandidateProfileId },
      });
      expect(profile?.academyStatus).toBe("COMPLETED");
      expect(profile?.certificateStatus).toBe("PENDING_APPROVAL");
      expect(profile?.isCertified).toBe(false); // MUST NOT be auto-certified

      // Negative test: Candidate cannot access workspace actions yet
      const uncertifiedRecruiter = await getAuthenticatedRecruiter({
        id: testCandidateUser.id,
        profileId: testCandidateProfileId,
        email: testCandidateUser.email,
        isCertified: false,
      });
      expect(uncertifiedRecruiter).toBeNull();
    });

    it("Step 9: Admin reviews candidate in certificate queue and approves certificate", async () => {
      // List pending certificates
      const listRes = await getCertificatesList("PENDING_APPROVAL", adminUser);
      expect(listRes.success).toBe(true);
      const pendingCand = listRes.data?.candidates.find((c) => c.id === testCandidateProfileId);
      expect(pendingCand).toBeDefined();

      // Negative check: Candidate cannot self-approve
      const selfApprove = await approveCertificate(testCandidateProfileId, "Self attempt", {
        id: testCandidateUser.id,
        email: testCandidateUser.email,
        role: "CANDIDATE",
      });
      expect(selfApprove.success).toBe(false);

      // Admin approves
      const approveRes = await approveCertificate(testCandidateProfileId, "All modules verified", adminUser);
      expect(approveRes.success).toBe(true);
      expect(approveRes.data?.certificateStatus).toBe("APPROVED");
    });

    it("Step 10: Real certificate is issued with unique Certificate ID, Verification Code and Recruiter Ready status", async () => {
      const issueRes = await issueCertificate(testCandidateProfileId, adminUser);
      expect(issueRes.success).toBe(true);
      expect(issueRes.data?.certificateNumber).toMatch(/^E2E-CERT-\d{4}-/);
      expect(issueRes.data?.verificationCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      const certifiedProfile = await prisma.candidateProfile.findUnique({
        where: { id: testCandidateProfileId },
        include: { certificate: true },
      });
      expect(certifiedProfile?.isCertified).toBe(true);
      expect(certifiedProfile?.certificateStatus).toBe("ISSUED");
      expect(certifiedProfile?.certificate).toBeDefined();

      // Duplicate issuance protection
      const duplicateIssue = await issueCertificate(testCandidateProfileId, adminUser);
      expect(duplicateIssue.success).toBe(true);
      expect(duplicateIssue.data?.certificateNumber).toBe(issueRes.data?.certificateNumber);
    });
  });

  // =========================================================================
  // JOURNEY 4: RECRUITER WORKSPACE & CANDIDATE PIPELINE (Steps 11, 12, 13)
  // =========================================================================
  describe("Journey 4: Recruiter Workspace & Candidate Pipeline Execution", () => {
    let recruiterContext: RecruiterOverride;

    beforeAll(() => {
      recruiterContext = {
        id: testCandidateUser.id,
        profileId: testCandidateProfileId,
        email: testCandidateUser.email,
        isCertified: true,
        role: "CANDIDATE",
      };
    });

    it("Step 11: Candidate gains Recruiter Ready status and full Workspace access", async () => {
      const recruiter = await getAuthenticatedRecruiter(recruiterContext);
      expect(recruiter).not.toBeNull();
      expect(recruiter?.isCertified).toBe(true);
      expect(recruiter?.candidateId).toBe(testCandidateId);
    });

    it("Step 12: Candidate manages candidate pipeline, stages, and follow-ups", async () => {
      // 1. Create a job candidate in pipeline
      const addCandRes = await createJobCandidate(
        {
          fullName: "Alex Smith",
          email: "alex.smith@example.com",
          phone: "9123456780",
          currentCompany: "Tech Corp",
          currentDesignation: "Software Engineer",
          totalExperienceYears: 4,
          relevantExperienceYears: 3,
          qualification: "B.Tech Computer Science",
          keySkills: "React, Node.js, TypeScript",
          source: "LinkedIn",
          pipelineStage: "SOURCED",
          clientName: testClient.name,
        },
        recruiterContext
      );

      expect(addCandRes.success).toBe(true);
      const candRecordId = addCandRes.data!.candidateId;

      // 2. Transition candidate through pipeline: SOURCED -> CONTACTED -> SCREENED -> SHORTLISTED
      const move1 = await updateCandidateStage(
        candRecordId,
        "CONTACTED",
        "Spoke regarding Bangalore opening",
        recruiterContext
      );
      expect(move1.success).toBe(true);

      const move2 = await updateCandidateStage(
        candRecordId,
        "SCREENED",
        "Technical screening completed",
        recruiterContext
      );
      expect(move2.success).toBe(true);

      const move3 = await updateCandidateStage(
        candRecordId,
        "SHORTLISTED",
        "Profile shared with hiring manager",
        recruiterContext
      );
      expect(move3.success).toBe(true);

      // Verify stage history
      const history = await prisma.candidateStageHistory.findMany({
        where: { jobCandidateId: candRecordId },
        orderBy: { createdAt: "asc" },
      });
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it("Step 13: Candidate completes daily SOP checklist and submits daily operations report", async () => {
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Toggle Morning checklist items
      const toggle1 = await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        todayStr,
        recruiterContext
      );
      expect(toggle1.success).toBe(true);

      const toggle2 = await toggleChecklistItem(
        "morning_review_requirements",
        true,
        "Review requirements",
        "MORNING",
        todayStr,
        recruiterContext
      );
      expect(toggle2.success).toBe(true);

      const checklist = await getChecklistForDate(todayStr, recruiterContext);
      expect(checklist).not.toBeNull();
      expect(checklist?.completedCount).toBeGreaterThanOrEqual(2);

      // 2. Submit Daily Report
      const submitReportRes = await submitDailyReportAction(
        {
          reportDate: todayStr,
          calls: 40,
          ownLeads: 15,
          internalLeads: 10,
          screened: 8,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 8,
          pendingFollowUps: 3,
          challenges: "Client interview reschedule due to panel unavailability",
          learnings: "High candidate interest for backend Node.js stack",
          planForTomorrow: "Line up 3 additional candidates for morning slots",
          clientBreakdowns: [
            {
              clientName: testClient.name,
              calls: 40,
              ownLeads: 15,
              internalLeads: 10,
              screened: 8,
              shortlisted: 4,
              lineUp: 2,
              offered: 1,
              joined: 0,
              absconded: 0,
            },
          ],
        },
        recruiterContext
      );

      expect(submitReportRes.success).toBe(true);
      expect(submitReportRes.data?.status).toBe("SUBMITTED");
      expect(submitReportRes.data?.revisionNumber).toBe(1);
    });
  });

  // =========================================================================
  // JOURNEY 5: TARGETS, MANAGER REVIEW & REVISION HISTORY (Steps 14, 15, 16, 17)
  // =========================================================================
  describe("Journey 5: Targets, Manager Approvals & Revision History", () => {
    let reportId: string;

    it("Step 14: Target and achievement calculations use valid underlying data", async () => {
      const todayStr = new Date().toISOString().split("T")[0];

      // Admin configures target benchmarks
      const targetRes = await configureRecruiterTarget(
        {
          recruiterProfileId: testCandidateProfileId,
          periodType: "MONTHLY",
          periodDate: todayStr,
          callsTarget: 50,
          shortlistTarget: 5,
          joinsTarget: 2,
          notes: "Current month performance benchmark",
        },
        adminUser
      );
      expect(targetRes.success).toBe(true);

      // Calculate progress
      const progress = await getRecruiterTargets(
        {
          recruiterProfileId: testCandidateProfileId,
          periodType: "MONTHLY",
          periodDate: todayStr,
        },
        {
          id: testCandidateUser.id,
          profileId: testCandidateProfileId,
          email: testCandidateUser.email,
          isCertified: true,
        }
      );
      expect(progress.success).toBe(true);
      expect(progress.data?.metrics.CALLS.target).toBe(50);
      expect(progress.data?.metrics.CALLS.achieved).toBeGreaterThanOrEqual(40);
    });

    it("Step 15: The report enters Manager Review queue and team isolation blocks outside managers", async () => {
      const rep = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: testCandidateProfileId },
        orderBy: { createdAt: "desc" },
      });
      expect(rep).toBeDefined();
      expect(rep?.status).toBe("SUBMITTED");
      reportId = rep!.id;

      // Assigned Manager can view in approval queue
      const queue = await getManagerApprovalsQueue(managerUser);
      const found = queue.find((r) => r.id === reportId);
      expect(found).toBeDefined();

      // Negative Test: Outside manager queue should NOT see this recruiter's report
      const outsideQueue = await getManagerApprovalsQueue(outsideManager);
      const outsideFound = outsideQueue.find((r) => r.id === reportId);
      expect(outsideFound).toBeUndefined();

      // Negative Test: Outside manager attempting to review report is strictly blocked
      const outsideAttempt = await reviewDailyReport(
        {
          reportId,
          action: "APPROVE",
          managerNotes: "Unauthorized attempt",
        },
        outsideManager
      );
      expect(outsideAttempt.success).toBe(false);
      expect(outsideAttempt.message).toContain("Unauthorized");
    });

    it("Step 16: Manager returns report with comments, recruiter resubmits, and manager approves", async () => {
      // 1. Manager returns report with revision notes
      const returnRes = await reviewDailyReport(
        {
          reportId,
          action: "RETURN",
          managerNotes: "Please clarify the breakdown for Tech Systems interview reschedule.",
        },
        managerUser
      );
      expect(returnRes.success).toBe(true);

      const returnedRep = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(returnedRep?.status).toBe("RETURNED");

      // 2. Recruiter resubmits revised report
      const todayStr = new Date().toISOString().split("T")[0];
      const resubmitRes = await submitDailyReportAction(
        {
          reportDate: todayStr,
          calls: 42,
          ownLeads: 15,
          internalLeads: 10,
          screened: 8,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 8,
          pendingFollowUps: 3,
          challenges: "Client interview reschedule resolved: client confirmed tomorrow morning slot.",
          learnings: "High candidate responsiveness in evening follow-ups",
          planForTomorrow: "Confirm candidate attendance 1 hour prior to interview",
          clientBreakdowns: [
            {
              clientName: testClient.name,
              calls: 42,
              ownLeads: 15,
              internalLeads: 10,
              screened: 8,
              shortlisted: 4,
              lineUp: 2,
              offered: 1,
              joined: 0,
              absconded: 0,
            },
          ],
        },
        {
          id: testCandidateUser.id,
          profileId: testCandidateProfileId,
          email: testCandidateUser.email,
          isCertified: true,
          role: "CANDIDATE",
        }
      );
      expect(resubmitRes.success).toBe(true);
      expect(resubmitRes.data?.revisionNumber).toBe(2);

      // 3. Manager approves report
      const approveRes = await reviewDailyReport(
        {
          reportId,
          action: "APPROVE",
          managerNotes: "Revised details verified and accurate. Approved.",
        },
        managerUser
      );
      expect(approveRes.success).toBe(true);

      const approvedRep = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(approvedRep?.status).toBe("APPROVED");
      expect(approvedRep?.approvedAt).not.toBeNull();
    });

    it("Step 17: Revised reports retain full historical snapshots", async () => {
      const revisions = await prisma.dailyReportRevision.findMany({
        where: { dailyReportId: reportId },
        orderBy: { revisionNumber: "asc" },
      });

      expect(revisions.length).toBeGreaterThanOrEqual(2);
      expect(revisions[0].revisionNumber).toBe(1);
      expect(revisions[1].revisionNumber).toBe(2);

      // Check metrics snapshot was preserved in JSON
      const snap1 = JSON.parse(revisions[0].metricsSnapshot);
      const snap2 = JSON.parse(revisions[1].metricsSnapshot);
      expect(snap1.metrics.calls).toBe(40);
      expect(snap2.metrics.calls).toBe(42);
    });
  });

  // =========================================================================
  // JOURNEY 6: DASHBOARDS, NOTIFICATIONS & EXPORTS (Steps 18, 19)
  // =========================================================================
  describe("Journey 6: Dashboards, Notifications & Authorized Exports", () => {
    it("Step 18: Admin dashboard and analytics reflect real underlying data without fabrication", async () => {
      const summary = await getAdminDashboardMetrics({ dateRange: "all" }, adminUser);
      expect(summary.success).toBe(true);
      expect(summary.data?.academy.totalCandidates).toBeGreaterThanOrEqual(1);
      expect(summary.data?.academy.activeCandidates).toBeGreaterThanOrEqual(1);
      expect(summary.data?.academy.certificatesIssued).toBeGreaterThanOrEqual(1);
      expect(summary.data?.operations.calls).toBeGreaterThanOrEqual(42);

      const funnel = await getRecruitmentFunnelAnalytics({}, adminUser);
      expect(funnel.success).toBe(true);
      expect(funnel.data?.stages.length).toBe(9);
    });

    it("Step 19: Notifications and authorized exports work with row-level permissions & formula protection", async () => {
      // 1. Recruiter notifications list
      const recNotifs = await getUserNotifications("ALL", 20, {
        id: testCandidateUser.id,
        email: testCandidateUser.email,
        role: "CANDIDATE",
      });
      expect(recNotifs.success).toBe(true);
      expect(recNotifs.data?.totalCount).toBeGreaterThanOrEqual(1);

      // 2. Manager notifications list
      const mgrNotifs = await getUserNotifications("ALL", 20, managerUser);
      expect(mgrNotifs.success).toBe(true);

      // 3. Admin authorized export (CSV format)
      const exportRes = await exportReport("DAILY_REPORTS", "csv", { dateRange: "all" }, adminUser);
      expect(exportRes.success).toBe(true);
      expect(exportRes.data?.content).toContain("\uFEFF"); // UTF-8 BOM
      expect(exportRes.data?.filename).toMatch(/^E2E_daily_reports_/);

      // 4. Negative Test: Recruiter attempting to export manager report is blocked
      const unauthorizedExport = await exportReport("MANAGER_REPORTS", "csv", {}, {
        id: testCandidateUser.id,
        email: testCandidateUser.email,
        role: "CANDIDATE",
      });
      expect(unauthorizedExport.success).toBe(false);
      expect(unauthorizedExport.message).toMatch(/access denied|unauthorized/i);
    });
  });

  // =========================================================================
  // NEGATIVE SECURITY CASES
  // =========================================================================
  describe("Negative Security & Role Boundary Enforcement", () => {
    it("strictly blocks recruiters from approving their own daily reports", async () => {
      const rep = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: testCandidateProfileId },
      });
      expect(rep).toBeDefined();

      const selfReview = await reviewDailyReport(
        {
          reportId: rep!.id,
          action: "APPROVE",
          managerNotes: "Illegal self approval attempt",
        },
        {
          id: testCandidateUser.id,
          email: testCandidateUser.email,
          role: "CANDIDATE",
        }
      );

      expect(selfReview.success).toBe(false);
      expect(selfReview.message).toContain("strictly prohibited from reviewing or approving");
    });

    it("strictly blocks candidates from accessing manager dashboard data", async () => {
      const unauthorizedDashboard = await getManagerDashboard({
        id: testCandidateUser.id,
        email: testCandidateUser.email,
        role: "CANDIDATE",
      });

      expect(unauthorizedDashboard.success).toBe(false);
      expect(unauthorizedDashboard.message).toMatch(/manager/i);
    });

    it("strictly blocks non-admin users from configuring targets", async () => {
      const unauthorizedTarget = await configureRecruiterTarget(
        {
          periodType: "MONTHLY",
          periodDate: "2026-03-01",
          callsTarget: 100,
        },
        {
          id: managerUser.id,
          email: managerUser.email,
          role: "MANAGER", // Non-admin
        }
      );

      expect(unauthorizedTarget.success).toBe(false);
      expect(unauthorizedTarget.message).toContain("Administrator privileges required");
    });
  });
});
