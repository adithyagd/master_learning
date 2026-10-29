"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback for test environments
  }
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Utility: In-place array shuffle (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Resolves the active candidate profile or falls back to override/admin inspection.
 */
async function resolveCandidate(candidateProfileIdOverride?: string) {
  if (candidateProfileIdOverride) {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileIdOverride },
      include: { user: true },
    });
    return candidate;
  }

  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "CANDIDATE" && user.candidateProfile) {
    return user.candidateProfile;
  }

  if (user.role === "ADMIN") {
    // If admin is inspecting without an override, find the most recent candidate
    return prisma.candidateProfile.findFirst({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  }

  return null;
}

/**
 * Fetches assessment details, prerequisites, and candidate's latest attempt status.
 */
export async function getAssessmentDetails(
  assessmentSlug: string,
  candidateProfileIdOverride?: string
): Promise<ActionResponse<{
  assessment: {
    id: string;
    type: string;
    slug: string;
    title: string;
    description: string;
    passingScore: number;
    questionCount: number;
    timeLimitMinutes: number | null;
    module?: {
      id: string;
      moduleNumber: number;
      title: string;
      slug: string;
    } | null;
  };
  isLocked: boolean;
  lockReason?: string;
  activeAttempt?: {
    id: string;
    attemptNumber: number;
    startedAt: Date;
    totalQuestions: number;
  } | null;
  latestAttempt?: {
    id: string;
    attemptNumber: number;
    status: string;
    scorePercentage: number;
    isPassed: boolean;
    submittedAt: Date | null;
  } | null;
}>> {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { slug: assessmentSlug },
      include: {
        module: {
          select: {
            id: true,
            moduleNumber: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!assessment) {
      return { success: false, message: "Assessment not found." };
    }

    const candidate = await resolveCandidate(candidateProfileIdOverride);
    if (!candidate) {
      return { success: false, message: "Candidate profile not found or unauthorized." };
    }

    // Check module/assessment lock status
    let isLocked = false;
    let lockReason: string | undefined;

    if (assessment.type === "MODULE" && assessment.module) {
      if (assessment.module.moduleNumber > candidate.currentModuleNumber) {
        isLocked = true;
        lockReason = `Module ${assessment.module.moduleNumber} is locked. You must complete preceding modules and pass their evaluations first.`;
      }
    } else if (assessment.type === "FINAL") {
      if (candidate.currentModuleNumber <= 5) {
        isLocked = true;
        lockReason = "Final Assessment is locked. You must complete Modules 1 to 5 and pass all module evaluations before unlocking the capstone evaluation.";
      }
    }

    // Check active IN_PROGRESS attempt
    const activeAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        candidateProfileId: candidate.id,
        assessmentId: assessment.id,
        status: "IN_PROGRESS",
      },
      select: {
        id: true,
        attemptNumber: true,
        startedAt: true,
        totalQuestions: true,
      },
    });

    // Check latest SUBMITTED attempt
    const latestAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        candidateProfileId: candidate.id,
        assessmentId: assessment.id,
        status: "SUBMITTED",
      },
      orderBy: { attemptNumber: "desc" },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        scorePercentage: true,
        isPassed: true,
        submittedAt: true,
      },
    });

    return {
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          type: assessment.type,
          slug: assessment.slug,
          title: assessment.title,
          description: assessment.description,
          passingScore: assessment.passingScore,
          questionCount: assessment.questionCount,
          timeLimitMinutes: assessment.timeLimitMinutes,
          module: assessment.module,
        },
        isLocked,
        lockReason,
        activeAttempt,
        latestAttempt,
      },
    };
  } catch (error) {
    console.error("getAssessmentDetails error:", error);
    return { success: false, message: "Internal server error fetching assessment details." };
  }
}

/**
 * Starts a new assessment attempt or resumes an existing IN_PROGRESS attempt.
 * Preserves the exact question set and draft answers across refresh/resume.
 * On retries, prioritizes unused or recently unused questions.
 * PROTECTS CORRECT ANSWERS: Never exposes `isCorrect` or `explanation` during active attempt.
 */
export async function startAssessmentAttempt(
  assessmentSlug: string,
  candidateProfileIdOverride?: string
): Promise<ActionResponse<{
  resumed: boolean;
  attempt: {
    id: string;
    attemptNumber: number;
    assessmentSlug: string;
    assessmentTitle: string;
    passingScore: number;
    timeLimitMinutes: number | null;
    startedAt: Date;
    totalQuestions: number;
    questions: Array<{
      questionId: string;
      displayOrder: number;
      topic: string;
      difficulty: string;
      questionText: string;
      selectedOptionId: string | null;
      options: Array<{
        id: string;
        optionText: string;
      }>;
    }>;
  };
}>> {
  try {
    const candidate = await resolveCandidate(candidateProfileIdOverride);
    if (!candidate) {
      return { success: false, message: "Unauthorized. Candidate session required." };
    }

    const assessment = await prisma.assessment.findUnique({
      where: { slug: assessmentSlug },
      include: { module: true },
    });

    if (!assessment) {
      return { success: false, message: "Assessment not found." };
    }

    // Verify lock status for module and final assessments
    if (assessment.type === "MODULE" && assessment.module) {
      if (assessment.module.moduleNumber > candidate.currentModuleNumber) {
        return {
          success: false,
          message: `Module ${assessment.module.moduleNumber} is locked. Complete preceding modules first.`,
        };
      }
    } else if (assessment.type === "FINAL") {
      if (candidate.currentModuleNumber <= 5) {
        return {
          success: false,
          message: "Final Assessment is locked. Complete Modules 1–5 and pass all module evaluations first.",
        };
      }
    }

    // 1. Check for existing IN_PROGRESS attempt (Resume / Refresh preservation)
    const existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        candidateProfileId: candidate.id,
        assessmentId: assessment.id,
        status: "IN_PROGRESS",
      },
      include: {
        attemptQuestions: {
          orderBy: { displayOrder: "asc" },
          include: {
            question: {
              include: {
                options: {
                  select: {
                    id: true,
                    optionText: true,
                    orderIndex: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingAttempt) {
      // Return preserved attempt without leaking answers or explanations
      return {
        success: true,
        data: {
          resumed: true,
          attempt: {
            id: existingAttempt.id,
            attemptNumber: existingAttempt.attemptNumber,
            assessmentSlug: assessment.slug,
            assessmentTitle: assessment.title,
            passingScore: assessment.passingScore,
            timeLimitMinutes: assessment.timeLimitMinutes,
            startedAt: existingAttempt.startedAt,
            totalQuestions: existingAttempt.totalQuestions,
            questions: existingAttempt.attemptQuestions.map((aq) => ({
              questionId: aq.questionId,
              displayOrder: aq.displayOrder,
              topic: aq.question.topic,
              difficulty: aq.question.difficulty,
              questionText: aq.question.questionText,
              selectedOptionId: aq.selectedOptionId,
              options: aq.question.options.map((opt) => ({
                id: opt.id,
                optionText: opt.optionText,
              })),
            })),
          },
        },
      };
    }

    // 2. Generate a NEW attempt
    // Get past attempts to determine next attemptNumber and track recently used questions
    const pastAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        candidateProfileId: candidate.id,
        assessmentId: assessment.id,
      },
      include: {
        attemptQuestions: true,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const nextAttemptNumber = pastAttempts.length > 0 ? pastAttempts[0].attemptNumber + 1 : 1;
    const lastAttempt = pastAttempts[0];
    const recentlyUsedQuestionIds = new Set(
      lastAttempt ? lastAttempt.attemptQuestions.map((aq) => aq.questionId) : []
    );

    let selectedQuestions: Array<{
      id: string;
      topic: string;
      difficulty: string;
      questionText: string;
      options: Array<{ id: string; optionText: string }>;
    }> = [];

    if (assessment.type === "MODULE") {
      const moduleNum = assessment.module?.moduleNumber || 1;
      const questionPool = await prisma.question.findMany({
        where: {
          moduleNumber: moduleNum,
          isApproved: true,
          isActive: true,
        },
        include: {
          options: {
            select: { id: true, optionText: true },
          },
        },
      });

      if (questionPool.length === 0) {
        return { success: false, message: "No approved questions found for this module assessment." };
      }

      // Prioritize unused / not recently used questions
      const freshQuestions = questionPool.filter((q) => !recentlyUsedQuestionIds.has(q.id));
      const recentQuestions = questionPool.filter((q) => recentlyUsedQuestionIds.has(q.id));

      const shuffledFresh = shuffleArray(freshQuestions);
      const shuffledRecent = shuffleArray(recentQuestions);

      const combined = [...shuffledFresh, ...shuffledRecent];
      const targetCount = Math.min(assessment.questionCount, combined.length);
      selectedQuestions = shuffleArray(combined.slice(0, targetCount));
    } else {
      // FINAL ASSESSMENT: Select questions evenly across all 5 modules
      const questionsPerModule = Math.floor(assessment.questionCount / 5); // 4 questions per module for 20 total
      const allSelected: typeof selectedQuestions = [];

      for (let m = 1; m <= 5; m++) {
        const modulePool = await prisma.question.findMany({
          where: {
            moduleNumber: m,
            isApproved: true,
            isActive: true,
          },
          include: {
            options: {
              select: { id: true, optionText: true },
            },
          },
        });

        const fresh = modulePool.filter((q) => !recentlyUsedQuestionIds.has(q.id));
        const recent = modulePool.filter((q) => recentlyUsedQuestionIds.has(q.id));
        const combined = [...shuffleArray(fresh), ...shuffleArray(recent)];
        const picked = combined.slice(0, questionsPerModule);
        allSelected.push(...picked);
      }

      selectedQuestions = shuffleArray(allSelected);
    }

    // 3. Persist Attempt and Question Set in a database transaction
    const newAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.assessmentAttempt.create({
        data: {
          candidateProfileId: candidate.id,
          assessmentId: assessment.id,
          attemptNumber: nextAttemptNumber,
          status: "IN_PROGRESS",
          totalQuestions: selectedQuestions.length,
          startedAt: new Date(),
        },
      });

      for (let idx = 0; idx < selectedQuestions.length; idx++) {
        await tx.attemptQuestion.create({
          data: {
            attemptId: attempt.id,
            questionId: selectedQuestions[idx].id,
            displayOrder: idx + 1,
            selectedOptionId: null,
          },
        });
      }

      return attempt;
    });

    // Record Audit Log
    await recordAuditLog({
      userId: candidate.userId,
      action: "ASSESSMENT_STARTED",
      targetType: "ASSESSMENT",
      targetId: newAttempt.id,
      details: {
        assessmentSlug: assessment.slug,
        attemptNumber: nextAttemptNumber,
        candidateProfileId: candidate.id,
      },
    });

    safeRevalidate(`/academy/assessment/${assessment.slug}`);

    // Return sanitized data with shuffled options (NO isCorrect, NO explanation)
    return {
      success: true,
      data: {
        resumed: false,
        attempt: {
          id: newAttempt.id,
          attemptNumber: newAttempt.attemptNumber,
          assessmentSlug: assessment.slug,
          assessmentTitle: assessment.title,
          passingScore: assessment.passingScore,
          timeLimitMinutes: assessment.timeLimitMinutes,
          startedAt: newAttempt.startedAt,
          totalQuestions: newAttempt.totalQuestions,
          questions: selectedQuestions.map((q, idx) => ({
            questionId: q.id,
            displayOrder: idx + 1,
            topic: q.topic,
            difficulty: q.difficulty,
            questionText: q.questionText,
            selectedOptionId: null,
            options: shuffleArray(q.options).map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
            })),
          })),
        },
      },
    };
  } catch (error) {
    console.error("startAssessmentAttempt error:", error);
    return { success: false, message: "Internal server error starting assessment." };
  }
}

/**
 * Saves candidate's draft answer choice for a specific question in real time.
 */
export async function saveAssessmentAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string,
  candidateProfileIdOverride?: string
): Promise<ActionResponse<void>> {
  try {
    const candidate = await resolveCandidate(candidateProfileIdOverride);
    if (!candidate) {
      return { success: false, message: "Unauthorized. Candidate session required." };
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt || attempt.candidateProfileId !== candidate.id) {
      return { success: false, message: "Assessment attempt not found or unauthorized." };
    }

    if (attempt.status !== "IN_PROGRESS") {
      return { success: false, message: "Cannot modify answers for a submitted attempt." };
    }

    // Check timer expiration
    if (attempt.assessment.timeLimitMinutes) {
      const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const allowedSec = attempt.assessment.timeLimitMinutes * 60 + 30; // 30s network latency grace
      if (elapsedSec > allowedSec) {
        return {
          success: false,
          message: "Assessment time limit has expired. Please submit your attempt for evaluation.",
        };
      }
    }

    await prisma.attemptQuestion.updateMany({
      where: {
        attemptId,
        questionId,
      },
      data: {
        selectedOptionId,
        answeredAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("saveAssessmentAnswer error:", error);
    return { success: false, message: "Failed to save answer choice." };
  }
}

/**
 * Submits an assessment attempt, calculates score using TRUSTED server-side database truth,
 * records pass/fail against 70% threshold, and records audit trail.
 * Prevents duplicate submissions.
 */
export async function submitAssessmentAttempt(
  attemptId: string,
  candidateAnswers?: Record<string, string>, // Optional client batch of questionId -> selectedOptionId
  candidateProfileIdOverride?: string
): Promise<ActionResponse<{
  scorePercentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  attemptNumber: number;
  submittedAt: Date;
  review: Array<{
    questionId: string;
    displayOrder: number;
    questionText: string;
    topic: string;
    difficulty: string;
    explanation: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    options: Array<{
      id: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}>> {
  try {
    const candidate = await resolveCandidate(candidateProfileIdOverride);
    if (!candidate) {
      return { success: false, message: "Unauthorized. Candidate session required." };
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            module: true,
          },
        },
        attemptQuestions: {
          orderBy: { displayOrder: "asc" },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.candidateProfileId !== candidate.id) {
      return { success: false, message: "Assessment attempt not found or unauthorized." };
    }

    // Protection against duplicate submissions
    if (attempt.status === "SUBMITTED") {
      return { success: false, message: "This assessment attempt has already been submitted." };
    }

    // Check timer / expiration
    let isAttemptExpired = false;
    if (attempt.assessment.timeLimitMinutes) {
      const elapsedSec = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const allowedSec = attempt.assessment.timeLimitMinutes * 60 + 30; // 30s latency grace
      if (elapsedSec > allowedSec) {
        isAttemptExpired = true;
      }
    }

    // Apply any answers passed at submission time (only if within allowed time)
    if (candidateAnswers && Object.keys(candidateAnswers).length > 0 && !isAttemptExpired) {
      for (const [qId, optId] of Object.entries(candidateAnswers)) {
        await prisma.attemptQuestion.updateMany({
          where: { attemptId, questionId: qId },
          data: { selectedOptionId: optId, answeredAt: new Date() },
        });
      }
    }

    // Reload latest attemptQuestions to ensure all answers are captured
    const updatedAttemptQuestions = await prisma.attemptQuestion.findMany({
      where: { attemptId },
      orderBy: { displayOrder: "asc" },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });

    let correctCount = 0;
    const reviewData: Array<{
      questionId: string;
      displayOrder: number;
      questionText: string;
      topic: string;
      difficulty: string;
      explanation: string;
      selectedOptionId: string | null;
      isCorrect: boolean;
      options: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    }> = [];

    // Evaluate each question strictly on the server
    for (const aq of updatedAttemptQuestions) {
      const selectedOptionId = candidateAnswers?.[aq.questionId] ?? aq.selectedOptionId;
      const chosenOption = aq.question.options.find((o) => o.id === selectedOptionId);
      const isQuestionCorrect = chosenOption ? Boolean(chosenOption.isCorrect) : false;

      if (isQuestionCorrect) {
        correctCount++;
      }

      await prisma.attemptQuestion.update({
        where: { id: aq.id },
        data: {
          selectedOptionId: selectedOptionId ?? null,
          isCorrect: isQuestionCorrect,
          answeredAt: aq.answeredAt || new Date(),
        },
      });

      reviewData.push({
        questionId: aq.questionId,
        displayOrder: aq.displayOrder,
        questionText: aq.question.questionText,
        topic: aq.question.topic,
        difficulty: aq.question.difficulty,
        explanation: aq.question.explanation,
        selectedOptionId: selectedOptionId ?? null,
        isCorrect: isQuestionCorrect,
        options: aq.question.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    const totalQuestions = attempt.totalQuestions;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= attempt.assessment.passingScore;
    const submittedAt = new Date();

    // Persist final submission
    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        scorePercentage,
        isPassed,
        submittedAt,
      },
    });

    // Record Audit Log
    await recordAuditLog({
      userId: candidate.userId,
      action: "ASSESSMENT_SUBMITTED",
      targetType: "ASSESSMENT",
      targetId: attempt.id,
      details: {
        assessmentSlug: attempt.assessment.slug,
        attemptNumber: attempt.attemptNumber,
        scorePercentage,
        isPassed,
        correctAnswers: correctCount,
        totalQuestions,
      },
    });

    // Learning Progression Execution
    if (isPassed) {
      if (attempt.assessment.type === "MODULE" && attempt.assessment.module) {
        const passedModNumber = attempt.assessment.module.moduleNumber;
        // Advance candidate if they just passed their current module threshold
        if (candidate.currentModuleNumber === passedModNumber) {
          const nextModNumber = passedModNumber + 1; // 2..6 (6 unlocks Final Assessment)
          await prisma.candidateProfile.update({
            where: { id: candidate.id },
            data: { currentModuleNumber: nextModNumber },
          });

          await recordAuditLog({
            userId: candidate.userId,
            action: "CANDIDATE_UPDATED",
            targetType: "CANDIDATE",
            targetId: candidate.id,
            details: {
              event: "MODULE_UNLOCKED",
              passedModule: passedModNumber,
              unlockedModuleNumber: nextModNumber,
              scorePercentage,
            },
          });

          // Phase 16: Notify candidate of unlocked module assessment
          await createNotification({
            userId: candidate.userId,
            type: "ASSESSMENT_UNLOCKED",
            title: "Next Assessment Unlocked",
            message: `Congratulations! You passed Module ${passedModNumber}. Module ${nextModNumber <= 5 ? nextModNumber : "Final"} curriculum is now unlocked.`,
            linkUrl: "/academy",
            referenceId: candidate.id,
            dedupKey: `ASSESSMENT_UNLOCKED:${candidate.id}:${nextModNumber}`,
          });
        }
      } else if (attempt.assessment.type === "FINAL") {
        // Capstone Final Assessment passed!
        // Set Academy status to COMPLETED and certificate status to PENDING APPROVAL.
        // Strictly do NOT issue the certificate automatically (isCertified remains false).
        await prisma.candidateProfile.update({
          where: { id: candidate.id },
          data: {
            academyStatus: "COMPLETED",
            academyCompletedAt: submittedAt,
            certificateStatus: "PENDING_APPROVAL",
          },
        });

        await recordAuditLog({
          userId: candidate.userId,
          action: "CANDIDATE_UPDATED",
          targetType: "CANDIDATE",
          targetId: candidate.id,
          details: {
            event: "ACADEMY_COMPLETED",
            finalAssessmentScore: scorePercentage,
            certificateStatus: "PENDING_APPROVAL",
            isCertified: false,
          },
        });

        // Phase 16: Notify Admins of certificate awaiting approval
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE" },
          select: { id: true },
        });

        for (const adm of admins) {
          await createNotification({
            userId: adm.id,
            type: "CERTIFICATE_AWAITING_APPROVAL",
            title: "Certificate Awaiting Approval",
            message: `${candidate.fullName} passed the Final Capstone Assessment with ${scorePercentage}% and is awaiting certificate verification.`,
            linkUrl: "/admin/certificates",
            referenceId: candidate.id,
            dedupKey: `CERT_PENDING:${candidate.id}`,
          });
        }
      }
    }

    // Phase 16: Notify Admins of any assessment completion
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    for (const adm of adminUsers) {
      await createNotification({
        userId: adm.id,
        type: "ASSESSMENT_COMPLETION",
        title: "Assessment Completed",
        message: `${candidate.fullName} completed ${attempt.assessment.title} with score ${scorePercentage}% (${isPassed ? "PASSED" : "FAILED"}).`,
        linkUrl: "/admin/academy",
        referenceId: attempt.id,
        dedupKey: `ASSESSMENT_COMPLETION:${attempt.id}`,
      });
    }

    safeRevalidate(`/academy`);
    safeRevalidate(`/academy/assessment/${attempt.assessment.slug}`);

    return {
      success: true,
      data: {
        scorePercentage,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        totalQuestions,
        isPassed,
        passingScore: attempt.assessment.passingScore,
        attemptNumber: attempt.attemptNumber,
        submittedAt,
        review: reviewData,
      },
    };
  } catch (error) {
    console.error("submitAssessmentAttempt error:", error);
    return { success: false, message: "Internal server error submitting assessment." };
  }
}

/**
 * Retrieves full post-submission review for an attempt.
 * Strictly prevents review access for unsubmitted / in-progress attempts.
 */
export async function getAssessmentReview(
  attemptId: string,
  candidateProfileIdOverride?: string
): Promise<ActionResponse<{
  scorePercentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  attemptNumber: number;
  submittedAt: Date | null;
  assessmentTitle: string;
  assessmentType: string;
  moduleNumber?: number;
  review: Array<{
    questionId: string;
    displayOrder: number;
    questionText: string;
    topic: string;
    difficulty: string;
    explanation: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    options: Array<{
      id: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}>> {
  try {
    const candidate = await resolveCandidate(candidateProfileIdOverride);
    if (!candidate) {
      return { success: false, message: "Unauthorized. Candidate session required." };
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            module: true,
          },
        },
        attemptQuestions: {
          orderBy: { displayOrder: "asc" },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.candidateProfileId !== candidate.id) {
      return { success: false, message: "Assessment attempt not found or unauthorized." };
    }

    if (attempt.status !== "SUBMITTED") {
      return { success: false, message: "Cannot view review for an in-progress attempt." };
    }

    const review = attempt.attemptQuestions.map((aq) => ({
      questionId: aq.questionId,
      displayOrder: aq.displayOrder,
      questionText: aq.question.questionText,
      topic: aq.question.topic,
      difficulty: aq.question.difficulty,
      explanation: aq.question.explanation,
      selectedOptionId: aq.selectedOptionId,
      isCorrect: Boolean(aq.isCorrect),
      options: aq.question.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
      })),
    }));

    return {
      success: true,
      data: {
        scorePercentage: attempt.scorePercentage,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        totalQuestions: attempt.totalQuestions,
        isPassed: attempt.isPassed,
        passingScore: attempt.assessment.passingScore,
        attemptNumber: attempt.attemptNumber,
        submittedAt: attempt.submittedAt,
        assessmentTitle: attempt.assessment.title,
        assessmentType: attempt.assessment.type,
        moduleNumber: attempt.assessment.module?.moduleNumber,
        review,
      },
    };
  } catch (error) {
    console.error("getAssessmentReview error:", error);
    return { success: false, message: "Internal server error fetching review." };
  }
}
