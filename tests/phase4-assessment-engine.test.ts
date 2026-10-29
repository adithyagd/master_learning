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
import { seedQuestionBank } from "@/lib/question-bank-seed";
import { seedAcademyCurriculum } from "@/lib/academy-seed";

describe("Phase 4: Dynamic Assessment Engine & Question Bank", () => {
  let candidateTestUser: { id: string; profileId: string };
  let candidateLockedUser: { id: string; profileId: string };

  beforeAll(async () => {
    // 1. Ensure curriculum and question bank are seeded
    await seedAcademyCurriculum();
    await seedQuestionBank();

    // 2. Clean up test users
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-ASSESS-1", "TEST-ASSESS-2"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["assess1@test.com", "assess2@test.com"] } },
    });

    const passHash = await hashPassword("AssessPass123!");

    // Test Candidate 1: Module 5 unlocked (can test all module quizzes and final)
    const user1 = await prisma.user.create({
      data: {
        email: "assess1@test.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "TEST-ASSESS-1",
            fullName: "Assessment Tester One",
            joiningDate: new Date(),
            currentModuleNumber: 5,
          },
        },
      },
      include: { candidateProfile: true },
    });
    candidateTestUser = { id: user1.id, profileId: user1.candidateProfile!.id };

    // Test Candidate 2: Module 1 only (Module 2+ locked)
    const user2 = await prisma.user.create({
      data: {
        email: "assess2@test.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "TEST-ASSESS-2",
            fullName: "Assessment Tester Locked",
            joiningDate: new Date(),
            currentModuleNumber: 1,
          },
        },
      },
      include: { candidateProfile: true },
    });
    candidateLockedUser = { id: user2.id, profileId: user2.candidateProfile!.id };
  });

  afterAll(async () => {
    await prisma.assessmentAttempt.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-ASSESS-1", "TEST-ASSESS-2"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["assess1@test.com", "assess2@test.com"] } },
    });
  });

  // =========================================================================
  // 1. QUESTION BANK SEEDING & CONTENT INTEGRITY
  // =========================================================================
  describe("1. Question Bank Seeding & Integrity", () => {
    it("seeds approved questions across all 5 recruitment competency modules", async () => {
      const allQuestions = await prisma.question.findMany({
        where: { isApproved: true, isActive: true },
        include: { options: true },
      });

      expect(allQuestions.length).toBeGreaterThanOrEqual(50);

      // Verify each module has at least 10 approved questions
      for (let m = 1; m <= 5; m++) {
        const modQuestions = allQuestions.filter((q) => q.moduleNumber === m);
        expect(modQuestions.length).toBeGreaterThanOrEqual(10);
      }
    });

    it("verifies question schemas include topic, difficulty, explanation, and valid options", async () => {
      const sampleQuestions = await prisma.question.findMany({
        take: 10,
        include: { options: true },
      });

      for (const q of sampleQuestions) {
        expect(q.topic.trim().length).toBeGreaterThan(0);
        expect(["EASY", "MEDIUM", "HARD"]).toContain(q.difficulty);
        expect(q.questionText.trim().length).toBeGreaterThan(15);
        expect(q.explanation.trim().length).toBeGreaterThan(15);
        expect(q.options.length).toBeGreaterThanOrEqual(4);

        // Exactly one option is marked correct
        const correctOptions = q.options.filter((o) => o.isCorrect);
        expect(correctOptions.length).toBe(1);
      }
    });

    it("STRICT: ensures zero ATS terminology in Module 5 questions and explanations", async () => {
      const module5Questions = await prisma.question.findMany({
        where: { moduleNumber: 5 },
        include: { options: true },
      });

      const atsRegex = /\b(ats)\b/i;

      for (const q of module5Questions) {
        expect(q.questionText).not.toMatch(atsRegex);
        expect(q.explanation).not.toMatch(atsRegex);
        for (const opt of q.options) {
          expect(opt.optionText).not.toMatch(atsRegex);
        }
      }
    });
  });

  // =========================================================================
  // 2. ATTEMPT INITIALIZATION & QUESTION SET PERSISTENCE (REFRESH/RESUME)
  // =========================================================================
  describe("2. Attempt Initialization & Refresh/Resume Persistence", () => {
    it("generates and persists exact question set at attempt start", async () => {
      const res = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const attempt = res.data!.attempt;
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.totalQuestions).toBe(10);
      expect(attempt.questions.length).toBe(10);
      expect(res.data!.resumed).toBe(false);

      // Verify records in database
      const dbAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt.id },
        include: { attemptQuestions: true },
      });
      expect(dbAttempt).not.toBeNull();
      expect(dbAttempt?.status).toBe("IN_PROGRESS");
      expect(dbAttempt?.attemptQuestions.length).toBe(10);
    });

    it("preserves exact question set without alteration upon browser refresh or resume", async () => {
      // First call (started previously or existing)
      const firstRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(firstRes.success).toBe(true);
      const firstAttempt = firstRes.data!.attempt;

      // Second call (simulating page reload while IN_PROGRESS)
      const reloadRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(reloadRes.success).toBe(true);
      expect(reloadRes.data!.resumed).toBe(true);

      const reloadedAttempt = reloadRes.data!.attempt;
      expect(reloadedAttempt.id).toBe(firstAttempt.id);
      expect(reloadedAttempt.attemptNumber).toBe(firstAttempt.attemptNumber);

      // Verify question IDs and displayOrder match exactly
      const firstQIds = firstAttempt.questions.map((q) => q.questionId);
      const reloadedQIds = reloadedAttempt.questions.map((q) => q.questionId);
      expect(reloadedQIds).toEqual(firstQIds);
    });

    it("preserves draft answers across reload when saveAssessmentAnswer is called", async () => {
      const activeRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      const attempt = activeRes.data!.attempt;
      const firstQ = attempt.questions[0];
      const selectedOptId = firstQ.options[0].id;

      // Save answer
      const saveRes = await saveAssessmentAnswer(
        attempt.id,
        firstQ.questionId,
        selectedOptId,
        candidateTestUser.profileId
      );
      expect(saveRes.success).toBe(true);

      // Re-load attempt
      const resumeRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(resumeRes.success).toBe(true);
      const resumedQ1 = resumeRes.data!.attempt.questions.find((q) => q.questionId === firstQ.questionId);
      expect(resumedQ1?.selectedOptionId).toBe(selectedOptId);
    });
  });

  // =========================================================================
  // 3. SECURITY: PROTECTION OF CORRECT ANSWERS BEFORE SUBMISSION
  // =========================================================================
  describe("3. Security & Anti-Cheating Data Sanitization", () => {
    it("strictly prevents leakage of isCorrect on options during active attempts", async () => {
      const res = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(res.success).toBe(true);

      for (const q of res.data!.attempt.questions) {
        for (const opt of q.options) {
          expect((opt as any).isCorrect).toBeUndefined();
        }
      }
    });

    it("strictly prevents leakage of explanations during active attempts", async () => {
      const res = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(res.success).toBe(true);

      for (const q of res.data!.attempt.questions) {
        expect((q as any).explanation).toBeUndefined();
      }
    });

    it("strictly blocks review access for in-progress / unsubmitted attempts", async () => {
      const activeRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      const reviewRes = await getAssessmentReview(activeRes.data!.attempt.id, candidateTestUser.profileId);

      expect(reviewRes.success).toBe(false);
      expect(reviewRes.message).toMatch(/cannot view review for an in-progress attempt/i);
    });
  });

  // =========================================================================
  // 4. RETRY LOGIC & UNUSED QUESTION PREFERENCE
  // =========================================================================
  describe("4. Retry Logic & Unused Question Preference", () => {
    it("submits failed attempt and generates fresh question set on retry preferring unused questions", async () => {
      const activeRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      const attemptId = activeRes.data!.attempt.id;
      const attempt1QuestionIds = new Set(activeRes.data!.attempt.questions.map((q) => q.questionId));

      // Submit attempt 1 with zero answers (0% score -> FAILED)
      const submitRes = await submitAssessmentAttempt(attemptId, {}, candidateTestUser.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.isPassed).toBe(false);
      expect(submitRes.data!.scorePercentage).toBe(0);

      // Now candidate retries: starts Attempt 2
      const retryRes = await startAssessmentAttempt("assessment-module-1", candidateTestUser.profileId);
      expect(retryRes.success).toBe(true);
      expect(retryRes.data!.resumed).toBe(false);

      const attempt2 = retryRes.data!.attempt;
      expect(attempt2.id).not.toBe(attemptId);
      expect(attempt2.attemptNumber).toBe(2);

      // In Module 1 there are 12 questions in the bank. Attempt 1 used 10 questions.
      // There are 2 questions that were UNUSED in Attempt 1.
      // The retry algorithm must preferentially include those unused questions!
      const attempt2QuestionIds = new Set(attempt2.questions.map((q) => q.questionId));
      const allMod1Questions = await prisma.question.findMany({
        where: { moduleNumber: 1, isApproved: true, isActive: true },
      });
      const unusedInAttempt1 = allMod1Questions.filter((q) => !attempt1QuestionIds.has(q.id));

      if (unusedInAttempt1.length > 0) {
        // Verify that unused questions were selected in Attempt 2
        const unusedIncludedInAttempt2 = unusedInAttempt1.filter((q) => attempt2QuestionIds.has(q.id));
        expect(unusedIncludedInAttempt2.length).toBe(unusedInAttempt1.length);
      }
    });
  });

  // =========================================================================
  // 5. TRUSTED SERVER-SIDE SCORING & 70% PASSING THRESHOLD
  // =========================================================================
  describe("5. Trusted Server-Side Scoring & 70% Passing Threshold", () => {
    it("evaluates a passing score (>= 70%) strictly on trusted server truth", async () => {
      const startRes = await startAssessmentAttempt("assessment-module-2", candidateTestUser.profileId);
      const attempt = startRes.data!.attempt;

      // Look up true database correct answers for 8 of the 10 questions (80%)
      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({
          where: { questionId: qId },
        });

        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        if (i < 8) {
          // 8 correct answers
          answers[qId] = correctOpt!.id;
        } else {
          // 2 wrong answers
          answers[qId] = wrongOpt!.id;
        }
      }

      // Submit attempt
      const submitRes = await submitAssessmentAttempt(attempt.id, answers, candidateTestUser.profileId);
      expect(submitRes.success).toBe(true);

      const result = submitRes.data!;
      expect(result.totalQuestions).toBe(10);
      expect(result.correctAnswers).toBe(8);
      expect(result.incorrectAnswers).toBe(2);
      expect(result.scorePercentage).toBe(80);
      expect(result.isPassed).toBe(true);

      // Verify database record
      const dbAttempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attempt.id },
      });
      expect(dbAttempt?.status).toBe("SUBMITTED");
      expect(dbAttempt?.scorePercentage).toBe(80);
      expect(dbAttempt?.isPassed).toBe(true);
      expect(dbAttempt?.submittedAt).not.toBeNull();
    });

    it("evaluates a failing score (< 70%) and records failed status", async () => {
      const startRes = await startAssessmentAttempt("assessment-module-3", candidateTestUser.profileId);
      const attempt = startRes.data!.attempt;

      // Provide only 5 correct answers (50% < 70% passing threshold)
      const answers: Record<string, string> = {};
      for (let i = 0; i < attempt.questions.length; i++) {
        const qId = attempt.questions[i].questionId;
        const dbOptions = await prisma.questionOption.findMany({
          where: { questionId: qId },
        });

        const correctOpt = dbOptions.find((o) => o.isCorrect);
        const wrongOpt = dbOptions.find((o) => !o.isCorrect);

        if (i < 5) {
          answers[qId] = correctOpt!.id;
        } else {
          answers[qId] = wrongOpt!.id;
        }
      }

      const submitRes = await submitAssessmentAttempt(attempt.id, answers, candidateTestUser.profileId);
      expect(submitRes.success).toBe(true);
      expect(submitRes.data!.scorePercentage).toBe(50);
      expect(submitRes.data!.isPassed).toBe(false);
      expect(submitRes.data!.correctAnswers).toBe(5);
    });

    it("strictly blocks duplicate submissions on already submitted attempts", async () => {
      // Find the previously submitted attempt
      const submitted = await prisma.assessmentAttempt.findFirst({
        where: { candidateProfileId: candidateTestUser.profileId, status: "SUBMITTED" },
      });

      const duplicateRes = await submitAssessmentAttempt(submitted!.id, {}, candidateTestUser.profileId);
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.message).toMatch(/already been submitted/i);
    });
  });

  // =========================================================================
  // 6. POST-SUBMISSION REVIEW & EXPLANATIONS
  // =========================================================================
  describe("6. Post-Submission Review & Detailed Explanations", () => {
    it("reveals comprehensive explanations and correct options after submission", async () => {
      const submitted = await prisma.assessmentAttempt.findFirst({
        where: { candidateProfileId: candidateTestUser.profileId, status: "SUBMITTED" },
      });

      const reviewRes = await getAssessmentReview(submitted!.id, candidateTestUser.profileId);
      expect(reviewRes.success).toBe(true);

      const review = reviewRes.data!.review;
      expect(review.length).toBeGreaterThan(0);

      for (const q of review) {
        expect(q.explanation).toBeDefined();
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(typeof q.isCorrect).toBe("boolean");

        // Verify options now reveal isCorrect
        const correctOpts = q.options.filter((o) => o.isCorrect);
        expect(correctOpts.length).toBe(1);
      }
    });
  });

  // =========================================================================
  // 7. MODULE LOCK ACCESS CONTROL & AUDIT LOGGING
  // =========================================================================
  describe("7. Access Control & Audit Logging", () => {
    it("strictly blocks candidate from starting assessment for locked modules", async () => {
      // candidateLockedUser only has currentModuleNumber = 1. Module 3 is locked!
      const lockedRes = await startAssessmentAttempt("assessment-module-3", candidateLockedUser.profileId);
      expect(lockedRes.success).toBe(false);
      expect(lockedRes.message).toMatch(/locked/i);
    });

    it("records audit logs for assessment start and submission events", async () => {
      const startLogs = await prisma.auditLog.findMany({
        where: { action: "ASSESSMENT_STARTED" },
      });
      expect(startLogs.length).toBeGreaterThan(0);

      const submitLogs = await prisma.auditLog.findMany({
        where: { action: "ASSESSMENT_SUBMITTED" },
      });
      expect(submitLogs.length).toBeGreaterThan(0);
    });
  });
});
