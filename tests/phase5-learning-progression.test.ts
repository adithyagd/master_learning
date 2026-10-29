// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  getAssessmentDetails,
  startAssessmentAttempt,
  saveAssessmentAnswer,
  submitAssessmentAttempt,
  getAssessmentReview,
} from "@/actions/assessment";
import { markLessonComplete, getLessonWithNavigation } from "@/actions/academy";
import { seedQuestionBank } from "@/lib/question-bank-seed";
import { seedAcademyCurriculum } from "@/lib/academy-seed";

describe("Phase 5: Academy Progression & Assessment Unlocking Pipeline", () => {
  let freshCandidate: { id: string; profileId: string; userId: string };

  beforeAll(async () => {
    // 1. Seed curriculum and question bank
    await seedAcademyCurriculum();
    await seedQuestionBank();

    // 2. Clean up test users
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-PROG-CAND"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["prog_cand@e2epvtltd.com"] } },
    });

    const passHash = await hashPassword("ProgressPass123!");

    // Create fresh candidate starting at Module 1
    const user = await prisma.user.create({
      data: {
        email: "prog_cand@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "TEST-PROG-CAND",
            fullName: "Progression Test Candidate",
            joiningDate: new Date(),
            currentModuleNumber: 1, // Initially Module 1 only
            isCertified: false,
            certificateStatus: "NOT_ELIGIBLE",
            academyStatus: "IN_PROGRESS",
          },
        },
      },
      include: { candidateProfile: true },
    });

    freshCandidate = {
      id: user.id,
      profileId: user.candidateProfile!.id,
      userId: user.id,
    };
  });

  afterAll(async () => {
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-PROG-CAND"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["prog_cand@e2epvtltd.com"] } },
    });
  });

  // =========================================================================
  // 1. INITIAL STATE & DIRECT URL / API ACCESS PREVENTION
  // =========================================================================
  describe("1. Initial State & Locked Module Gating", () => {
    it("initializes candidate with only Module 1 unlocked", async () => {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: freshCandidate.profileId },
      });
      expect(profile?.currentModuleNumber).toBe(1);
      expect(profile?.academyStatus).toBe("IN_PROGRESS");
      expect(profile?.certificateStatus).toBe("NOT_ELIGIBLE");
      expect(profile?.isCertified).toBe(false);
    });

    it("strictly blocks direct API requests to start locked module assessments", async () => {
      // Trying to access Module 2 assessment while on Module 1
      const resM2 = await startAssessmentAttempt("assessment-module-2", freshCandidate.profileId);
      expect(resM2.success).toBe(false);
      expect(resM2.message).toMatch(/locked/i);

      // Trying to access Module 5 assessment while on Module 1
      const resM5 = await startAssessmentAttempt("assessment-module-5", freshCandidate.profileId);
      expect(resM5.success).toBe(false);
      expect(resM5.message).toMatch(/locked/i);
    });

    it("strictly blocks direct API requests to start Final Assessment before completing all modules", async () => {
      const resFinal = await startAssessmentAttempt("final-assessment", freshCandidate.profileId);
      expect(resFinal.success).toBe(false);
      expect(resFinal.message).toMatch(/Final Assessment is locked/i);
    });

    it("strictly blocks completing lessons or accessing lesson navigation in locked modules", async () => {
      const mod2Lessons = await prisma.lesson.findMany({
        where: { module: { moduleNumber: 2 } },
      });

      // Direct call to mark lesson complete in locked Module 2
      const markRes = await markLessonComplete(mod2Lessons[0].id, freshCandidate.profileId);
      expect(markRes.success).toBe(false);
      expect(markRes.message).toMatch(/locked/i);

      // Direct call to retrieve lesson navigation in locked Module 2
      const navRes = await getLessonWithNavigation(
        "jd-decoding",
        mod2Lessons[0].slug,
        freshCandidate.profileId
      );
      expect(navRes).not.toBeNull();
      expect(navRes?.isLocked).toBe(true);
    });
  });

  // =========================================================================
  // 2. FAILED ASSESSMENT HANDLING & RETRY WITHOUT PROGRESSION
  // =========================================================================
  describe("2. Failed Assessment Handling & Retry Policy", () => {
    it("does not advance candidate when assessment score is below 70%", async () => {
      const startRes = await startAssessmentAttempt("assessment-module-1", freshCandidate.profileId);
      expect(startRes.success).toBe(true);
      const attempt = startRes.data!.attempt;

      // Submit with 5 correct answers (50% < 70% passing score)
      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({ where: { questionId: qId } });
        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        answers[qId] = i < 5 ? correctOpt!.id : wrongOpt!.id;
      }

      const submitRes = await submitAssessmentAttempt(attempt.id, answers, freshCandidate.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.scorePercentage).toBe(50);
      expect(submitRes.data!.isPassed).toBe(false);

      // Verify candidate's currentModuleNumber DID NOT advance
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: freshCandidate.profileId },
      });
      expect(profile?.currentModuleNumber).toBe(1);
    });

    it("allows retrying the assessment and preserves retry attempt increment", async () => {
      const retryRes = await startAssessmentAttempt("assessment-module-1", freshCandidate.profileId);
      expect(retryRes.success).toBe(true);
      expect(retryRes.data!.resumed).toBe(false);
      expect(retryRes.data!.attempt.attemptNumber).toBe(2);
    });
  });

  // =========================================================================
  // 3. PASSING MODULE 1 UNLOCKS MODULE 2
  // =========================================================================
  describe("3. Passing Module 1 Unlocks Module 2", () => {
    it("advances candidate to Module 2 upon achieving >= 70% on Module 1 assessment", async () => {
      const startRes = await startAssessmentAttempt("assessment-module-1", freshCandidate.profileId);
      const attempt = startRes.data!.attempt;

      // Answer 8 of 10 correctly (80% >= 70%)
      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({ where: { questionId: qId } });
        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        answers[qId] = i < 8 ? correctOpt!.id : wrongOpt!.id;
      }

      const submitRes = await submitAssessmentAttempt(attempt.id, answers, freshCandidate.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.isPassed).toBe(true);
      expect(submitRes.data!.scorePercentage).toBe(80);

      // Candidate profile must now have currentModuleNumber = 2
      const updatedProfile = await prisma.candidateProfile.findUnique({
        where: { id: freshCandidate.profileId },
      });
      expect(updatedProfile?.currentModuleNumber).toBe(2);
    });

    it("allows candidate to access Module 2 assessment and lessons now that Module 2 is unlocked", async () => {
      const startM2Res = await startAssessmentAttempt("assessment-module-2", freshCandidate.profileId);
      expect(startM2Res.success).toBe(true);
      expect(startM2Res.data!.attempt.assessmentSlug).toBe("assessment-module-2");
    });
  });

  // =========================================================================
  // 4. FULL SEQUENTIAL PROGRESSION (MODULES 2 -> 3 -> 4 -> 5 -> FINAL UNLOCK)
  // =========================================================================
  describe("4. Full Sequential Learning Progression (Modules 2 to 5)", () => {
    // Helper to pass a module assessment with 80%
    async function passModule(moduleNum: number) {
      const slug = `assessment-module-${moduleNum}`;
      const startRes = await startAssessmentAttempt(slug, freshCandidate.profileId);
      expect(startRes.success).toBe(true);
      const attempt = startRes.data!.attempt;

      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({ where: { questionId: qId } });
        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        answers[qId] = i < 8 ? correctOpt!.id : wrongOpt!.id;
      }

      const submitRes = await submitAssessmentAttempt(attempt.id, answers, freshCandidate.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.isPassed).toBe(true);
    }

    it("progresses sequentially from Module 2 through Module 5", async () => {
      // Pass Module 2 -> Unlocks Module 3
      await passModule(2);
      let profile = await prisma.candidateProfile.findUnique({ where: { id: freshCandidate.profileId } });
      expect(profile?.currentModuleNumber).toBe(3);

      // Pass Module 3 -> Unlocks Module 4
      await passModule(3);
      profile = await prisma.candidateProfile.findUnique({ where: { id: freshCandidate.profileId } });
      expect(profile?.currentModuleNumber).toBe(4);

      // Pass Module 4 -> Unlocks Module 5
      await passModule(4);
      profile = await prisma.candidateProfile.findUnique({ where: { id: freshCandidate.profileId } });
      expect(profile?.currentModuleNumber).toBe(5);

      // Pass Module 5 -> Unlocks Final Assessment (currentModuleNumber = 6)
      await passModule(5);
      profile = await prisma.candidateProfile.findUnique({ where: { id: freshCandidate.profileId } });
      expect(profile?.currentModuleNumber).toBe(6);
    });

    it("verifies Final Assessment is now unlocked for the candidate", async () => {
      const details = await getAssessmentDetails("final-assessment", freshCandidate.profileId);
      expect(details.success).toBe(true);
      expect(details.data!.isLocked).toBe(false);
    });
  });

  // =========================================================================
  // 5. FINAL ASSESSMENT SPECIFICATIONS & ATTEMPT PERSISTENCE
  // =========================================================================
  describe("5. Final Assessment Configuration & Attempt Set Persistence", () => {
    it("launches Final Assessment with exactly 20 randomized questions and 20-minute time limit", async () => {
      const res = await startAssessmentAttempt("final-assessment", freshCandidate.profileId);
      expect(res.success).toBe(true);

      const attempt = res.data!.attempt;
      expect(attempt.totalQuestions).toBe(20);
      expect(attempt.questions.length).toBe(20);
      expect(attempt.timeLimitMinutes).toBe(20);
      expect(attempt.passingScore).toBe(70);

      // Verify question balance across all 5 modules (4 per module)
      const questionIds = attempt.questions.map((q) => q.questionId);
      const dbQuestions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
      });

      for (let m = 1; m <= 5; m++) {
        const countForMod = dbQuestions.filter((q) => q.moduleNumber === m).length;
        expect(countForMod).toBe(4);
      }
    });

    it("preserves exact Final Assessment question set across browser reload/resume", async () => {
      const firstRes = await startAssessmentAttempt("final-assessment", freshCandidate.profileId);
      const firstQuestions = firstRes.data!.attempt.questions.map((q) => q.questionId);

      const reloadRes = await startAssessmentAttempt("final-assessment", freshCandidate.profileId);
      expect(reloadRes.data!.resumed).toBe(true);
      const reloadedQuestions = reloadRes.data!.attempt.questions.map((q) => q.questionId);

      expect(reloadedQuestions).toEqual(firstQuestions);
    });
  });

  // =========================================================================
  // 6. TIMER EXPIRATION & SERVER-SIDE CONSISTENCY
  // =========================================================================
  describe("6. Timer Expiration Handling by Trusted Server Logic", () => {
    it("rejects draft answer saves when attempt time limit has expired", async () => {
      // Find the in-progress Final Assessment attempt and simulate startedAt in the past
      const attempt = await prisma.assessmentAttempt.findFirst({
        where: {
          candidateProfileId: freshCandidate.profileId,
          assessment: { slug: "final-assessment" },
          status: "IN_PROGRESS",
        },
      });

      expect(attempt).not.toBeNull();

      // Set startedAt to 25 minutes ago (exceeding 20 minute limit + 30s grace)
      const twentyFiveMinutesAgo = new Date(Date.now() - 25 * 60 * 1000);
      await prisma.assessmentAttempt.update({
        where: { id: attempt!.id },
        data: { startedAt: twentyFiveMinutesAgo },
      });

      // Attempt to save an answer after time expiration
      const firstQ = await prisma.attemptQuestion.findFirst({
        where: { attemptId: attempt!.id },
      });
      const dbOption = await prisma.questionOption.findFirst({
        where: { questionId: firstQ!.questionId },
      });

      const saveRes = await saveAssessmentAnswer(
        attempt!.id,
        firstQ!.questionId,
        dbOption!.id,
        freshCandidate.profileId
      );

      expect(saveRes.success).toBe(false);
      expect(saveRes.message).toMatch(/time limit has expired/i);
    });

    it("safely scores and finalizes expired attempt without throwing or bypassing", async () => {
      const attempt = await prisma.assessmentAttempt.findFirst({
        where: {
          candidateProfileId: freshCandidate.profileId,
          assessment: { slug: "final-assessment" },
          status: "IN_PROGRESS",
        },
      });

      // Submit the expired attempt
      const submitRes = await submitAssessmentAttempt(attempt!.id, {}, freshCandidate.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.isPassed).toBe(false);

      // Verify attempt is finalized as SUBMITTED
      const dbAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt!.id },
      });
      expect(dbAttempt?.status).toBe("SUBMITTED");
      expect(dbAttempt?.submittedAt).not.toBeNull();
    });
  });

  // =========================================================================
  // 7. PASSING FINAL ASSESSMENT & ACADEMY COMPLETION
  // =========================================================================
  describe("7. Passing Final Assessment & Academy Completion", () => {
    it("allows retry of Final Assessment and marks Academy COMPLETED with PENDING APPROVAL on pass", async () => {
      // Start Attempt 2 for Final Assessment
      const retryRes = await startAssessmentAttempt("final-assessment", freshCandidate.profileId);
      expect(retryRes.success).toBe(true);
      const attempt = retryRes.data!.attempt;
      expect(attempt.attemptNumber).toBe(2);

      // Provide 16 correct answers out of 20 (80% >= 70%)
      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({ where: { questionId: qId } });
        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        answers[qId] = i < 16 ? correctOpt!.id : wrongOpt!.id;
      }

      const submitRes = await submitAssessmentAttempt(attempt.id, answers, freshCandidate.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.isPassed).toBe(true);
      expect(submitRes.data!.scorePercentage).toBe(80);
      expect(submitRes.data!.correctAnswers).toBe(16);

      // Verify Candidate Profile state:
      // 1. academyStatus = "COMPLETED"
      // 2. certificateStatus = "PENDING_APPROVAL"
      // 3. STRICT: isCertified MUST REMAIN FALSE until Admin explicitly issues certificate in Phase 6!
      const finalProfile = await prisma.candidateProfile.findUnique({
        where: { id: freshCandidate.profileId },
      });

      expect(finalProfile?.academyStatus).toBe("COMPLETED");
      expect(finalProfile?.academyCompletedAt).not.toBeNull();
      expect(finalProfile?.certificateStatus).toBe("PENDING_APPROVAL");
      expect(finalProfile?.isCertified).toBe(false);
    });

    it("verifies audit log recorded ACADEMY_COMPLETED event", async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          targetId: freshCandidate.profileId,
          action: "CANDIDATE_UPDATED",
        },
      });

      const academyCompletedLog = logs.find((l) => l.details?.includes("ACADEMY_COMPLETED"));
      expect(academyCompletedLog).toBeDefined();
      expect(academyCompletedLog?.details).toContain("PENDING_APPROVAL");
    });
  });
});
