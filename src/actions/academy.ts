"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback for test runners
  }
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Mark a lesson complete for the authenticated candidate
 */
export async function markLessonComplete(
  lessonId: string,
  candidateProfileIdOverride?: string
): Promise<ActionResponse<{ nextLessonUrl?: string }>> {
  try {
    let candidateProfileId = candidateProfileIdOverride;

    if (!candidateProfileId) {
      const user = await getCurrentUser();
      if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
        return { success: false, message: "Unauthorized. Candidate session required." };
      }
      candidateProfileId = user.candidateProfile.id;
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
    });

    if (!candidate) {
      return { success: false, message: "Candidate profile not found." };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { lessons: { orderBy: { lessonNumber: "asc" } } } } },
    });

    if (!lesson) {
      return { success: false, message: "Lesson not found." };
    }

    // Access check: Candidate can only complete lessons in unlocked modules
    if (lesson.module.moduleNumber > candidate.currentModuleNumber) {
      return {
        success: false,
        message: "Module is locked. You must complete preceding modules and assessments first.",
      };
    }

    // Upsert lesson progress
    await prisma.lessonProgress.upsert({
      where: {
        candidateProfileId_lessonId: {
          candidateProfileId: candidate.id,
          lessonId: lesson.id,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        candidateProfileId: candidate.id,
        lessonId: lesson.id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Record Audit Log
    await recordAuditLog({
      userId: candidate.userId,
      action: "LESSON_COMPLETED" as any,
      targetType: "LESSON" as any,
      targetId: lesson.id,
      details: {
        moduleNumber: lesson.module.moduleNumber,
        lessonNumber: lesson.lessonNumber,
        lessonTitle: lesson.title,
      },
    });

    // Determine next lesson in the current module if available
    const currentIndex = lesson.module.lessons.findIndex((l) => l.id === lesson.id);
    let nextLessonUrl: string | undefined = undefined;

    if (currentIndex >= 0 && currentIndex < lesson.module.lessons.length - 1) {
      const nextLesson = lesson.module.lessons[currentIndex + 1];
      nextLessonUrl = `/academy/module/${lesson.module.slug}/${nextLesson.slug}`;
    } else {
      // Completed all lessons in module -> return to module overview
      nextLessonUrl = `/academy/module/${lesson.module.slug}`;
    }

    safeRevalidate("/academy");
    safeRevalidate(`/academy/module/${lesson.module.slug}`);
    safeRevalidate(`/academy/module/${lesson.module.slug}/${lesson.slug}`);

    return {
      success: true,
      message: `Lesson "${lesson.title}" marked as complete.`,
      data: { nextLessonUrl },
    };
  } catch (error: any) {
    console.error("Mark lesson complete error:", error);
    return {
      success: false,
      message: error?.message || "Failed to record lesson completion.",
    };
  }
}

/**
 * Retrieve Module details with Candidate's Lesson Progress
 */
export async function getModuleWithProgress(
  moduleSlug: string,
  candidateProfileId: string
) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: candidateProfileId },
  });

  if (!candidate) return null;

  const moduleData = await prisma.module.findUnique({
    where: { slug: moduleSlug },
    include: {
      lessons: {
        orderBy: { lessonNumber: "asc" },
        include: {
          progress: {
            where: { candidateProfileId: candidate.id },
          },
        },
      },
    },
  });

  if (!moduleData) return null;

  const isLocked = moduleData.moduleNumber > candidate.currentModuleNumber;

  const lessonsWithStatus = moduleData.lessons.map((lesson) => {
    const isCompleted = lesson.progress.length > 0 && lesson.progress[0].isCompleted;
    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      isCompleted,
      completedAt: isCompleted ? lesson.progress[0].completedAt : null,
    };
  });

  const totalLessons = lessonsWithStatus.length;
  const completedLessons = lessonsWithStatus.filter((l) => l.isCompleted).length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const allLessonsCompleted = totalLessons > 0 && completedLessons === totalLessons;

  return {
    ...moduleData,
    isLocked,
    totalLessons,
    completedLessons,
    progressPercentage,
    allLessonsCompleted,
    lessons: lessonsWithStatus,
  };
}

/**
 * Retrieve a specific Lesson with Candidate's Progress and surrounding navigation
 */
export async function getLessonWithNavigation(
  moduleSlug: string,
  lessonSlug: string,
  candidateProfileId: string
) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: candidateProfileId },
  });

  if (!candidate) return null;

  const moduleData = await prisma.module.findUnique({
    where: { slug: moduleSlug },
    include: {
      lessons: {
        orderBy: { lessonNumber: "asc" },
      },
    },
  });

  if (!moduleData) return null;

  const isModuleLocked = moduleData.moduleNumber > candidate.currentModuleNumber;
  if (isModuleLocked) {
    return { isLocked: true, module: moduleData };
  }

  const lessonIndex = moduleData.lessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) return null;

  const lesson = moduleData.lessons[lessonIndex];

  // Fetch progress for this specific candidate
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      candidateProfileId_lessonId: {
        candidateProfileId: candidate.id,
        lessonId: lesson.id,
      },
    },
  });

  const prevLesson = lessonIndex > 0 ? moduleData.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < moduleData.lessons.length - 1
      ? moduleData.lessons[lessonIndex + 1]
      : null;

  return {
    isLocked: false,
    module: moduleData,
    lesson,
    isCompleted: Boolean(progress?.isCompleted),
    completedAt: progress?.completedAt || null,
    prevLesson,
    nextLesson,
  };
}
