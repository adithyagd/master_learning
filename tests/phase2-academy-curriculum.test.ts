// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  markLessonComplete,
  getModuleWithProgress,
  getLessonWithNavigation,
} from "@/actions/academy";
import { seedAcademyCurriculum } from "@/lib/academy-seed";

describe("Phase 2: Academy Modules, Lessons & Progress Persistence", () => {
  let candidateA: { id: string; userId: string };
  let candidateB: { id: string; userId: string };

  beforeAll(async () => {
    // Ensure curriculum is seeded
    await seedAcademyCurriculum();

    // Clean up test candidates
    await prisma.lessonProgress.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-REC-A", "TEST-REC-B"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["candA@test.com", "candB@test.com"] } },
    });

    const passHash = await hashPassword("TestPass123!");

    // Create Candidate A
    const userA = await prisma.user.create({
      data: {
        email: "candA@test.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "TEST-REC-A",
            fullName: "Candidate Alpha",
            joiningDate: new Date(),
            currentModuleNumber: 1, // Only Module 1 unlocked
          },
        },
      },
      include: { candidateProfile: true },
    });
    candidateA = { id: userA.candidateProfile!.id, userId: userA.id };

    // Create Candidate B
    const userB = await prisma.user.create({
      data: {
        email: "candB@test.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "TEST-REC-B",
            fullName: "Candidate Beta",
            joiningDate: new Date(),
            currentModuleNumber: 1, // Only Module 1 unlocked
          },
        },
      },
      include: { candidateProfile: true },
    });
    candidateB = { id: userB.candidateProfile!.id, userId: userB.id };
  });

  afterAll(async () => {
    await prisma.lessonProgress.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["TEST-REC-A", "TEST-REC-B"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["candA@test.com", "candB@test.com"] } },
    });
  });

  describe("1. Database Curriculum Structure & Exact Module Names", () => {
    it("has exactly 5 database modules with exact required titles", async () => {
      const modules = await prisma.module.findMany({
        orderBy: { moduleNumber: "asc" },
      });

      expect(modules).toHaveLength(5);
      expect(modules[0].title).toBe("Module 1 — Recruitment Fundamentals");
      expect(modules[1].title).toBe("Module 2 — JD Decoding & Requirement Understanding");
      expect(modules[2].title).toBe("Module 3 — Candidate Sourcing & Recruitment Preparation");
      expect(modules[3].title).toBe("Module 4 — Communication, Screening & Interview Management");
      expect(modules[4].title).toBe("Module 5 — Recruitment Operations");

      modules.forEach((mod) => {
        expect(mod.passingScore).toBe(70);
      });
    });

    it("strictly verifies Module 5 and all its lessons contain zero ATS mentions", async () => {
      const mod5 = await prisma.module.findUnique({
        where: { moduleNumber: 5 },
        include: { lessons: true },
      });

      expect(mod5).not.toBeNull();
      expect(mod5!.title.toLowerCase()).not.toContain("ats");
      expect(mod5!.description.toLowerCase()).not.toContain("ats");

      mod5!.lessons.forEach((lesson) => {
        expect(lesson.title.toLowerCase()).not.toContain("ats");
        expect(lesson.summary.toLowerCase()).not.toContain("ats");
        expect(lesson.content.toLowerCase()).not.toContain("ats");
      });
    });

    it("verifies each module has structured lessons with summaries and content", async () => {
      const modules = await prisma.module.findMany({
        include: { lessons: true },
      });

      modules.forEach((mod) => {
        expect(mod.lessons.length).toBeGreaterThanOrEqual(5);
        mod.lessons.forEach((lesson) => {
          expect(lesson.title).toBeDefined();
          expect(lesson.summary).toBeDefined();
          expect(lesson.content.length).toBeGreaterThan(100);
          expect(lesson.estimatedMinutes).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("2. Module Unlocking & Locked State Enforcement", () => {
    it("unlocks only Module 1 for a new candidate with currentModuleNumber = 1", async () => {
      const mod1 = await getModuleWithProgress("recruitment-fundamentals", candidateA.id);
      expect(mod1).not.toBeNull();
      expect(mod1!.isLocked).toBe(false);

      const mod2 = await getModuleWithProgress("jd-decoding", candidateA.id);
      expect(mod2).not.toBeNull();
      expect(mod2!.isLocked).toBe(true);

      const mod5 = await getModuleWithProgress("recruitment-operations", candidateA.id);
      expect(mod5).not.toBeNull();
      expect(mod5!.isLocked).toBe(true);
    });

    it("strictly prevents completing lessons in locked modules", async () => {
      const mod2 = await prisma.module.findUnique({
        where: { moduleNumber: 2 },
        include: { lessons: true },
      });

      const lessonInMod2 = mod2!.lessons[0];
      const res = await markLessonComplete(lessonInMod2.id, candidateA.id);

      expect(res.success).toBe(false);
      expect(res.message).toContain("locked");

      // Verify no progress record was created
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          candidateProfileId_lessonId: {
            candidateProfileId: candidateA.id,
            lessonId: lessonInMod2.id,
          },
        },
      });
      expect(progress).toBeNull();
    });
  });

  describe("3. Explicit Lesson Completion & Database Persistence", () => {
    it("does not mark lesson complete just by viewing it", async () => {
      const mod1 = await prisma.module.findUnique({
        where: { moduleNumber: 1 },
        include: { lessons: { orderBy: { lessonNumber: "asc" } } },
      });
      const firstLesson = mod1!.lessons[0];

      // Viewing lesson via getLessonWithNavigation
      const viewData = await getLessonWithNavigation(
        "recruitment-fundamentals",
        firstLesson.slug,
        candidateA.id
      );

      expect(viewData?.isCompleted).toBe(false);

      // Verify DB record does not exist
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          candidateProfileId_lessonId: {
            candidateProfileId: candidateA.id,
            lessonId: firstLesson.id,
          },
        },
      });
      expect(progress).toBeNull();
    });

    it("explicitly marks lesson complete in the database with audit trail", async () => {
      const mod1 = await prisma.module.findUnique({
        where: { moduleNumber: 1 },
        include: { lessons: { orderBy: { lessonNumber: "asc" } } },
      });
      const firstLesson = mod1!.lessons[0];

      const res = await markLessonComplete(firstLesson.id, candidateA.id);
      expect(res.success).toBe(true);
      expect(res.data?.nextLessonUrl).toBeDefined();

      // Verify DB persistence
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          candidateProfileId_lessonId: {
            candidateProfileId: candidateA.id,
            lessonId: firstLesson.id,
          },
        },
      });

      expect(progress).not.toBeNull();
      expect(progress?.isCompleted).toBe(true);
      expect(progress?.completedAt).toBeInstanceOf(Date);

      // Verify Audit Log recorded
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "LESSON_COMPLETED",
          targetId: firstLesson.id,
          userId: candidateA.userId,
        },
      });
      expect(auditLog).not.toBeNull();
    });
  });

  describe("4. Candidate Progress Isolation", () => {
    it("ensures candidate A's lesson completion is NOT marked for candidate B", async () => {
      const mod1 = await prisma.module.findUnique({
        where: { moduleNumber: 1 },
        include: { lessons: { orderBy: { lessonNumber: "asc" } } },
      });
      const firstLesson = mod1!.lessons[0];

      // Candidate A completed it in previous test
      const progA = await prisma.lessonProgress.findUnique({
        where: {
          candidateProfileId_lessonId: {
            candidateProfileId: candidateA.id,
            lessonId: firstLesson.id,
          },
        },
      });
      expect(progA?.isCompleted).toBe(true);

      // Candidate B should NOT have it completed
      const progB = await prisma.lessonProgress.findUnique({
        where: {
          candidateProfileId_lessonId: {
            candidateProfileId: candidateB.id,
            lessonId: firstLesson.id,
          },
        },
      });
      expect(progB).toBeNull();

      // Module overview for candidate B should show 0 completed lessons
      const modB = await getModuleWithProgress("recruitment-fundamentals", candidateB.id);
      expect(modB?.completedLessons).toBe(0);
      expect(modB?.progressPercentage).toBe(0);

      // Module overview for candidate A should show 1 completed lesson
      const modA = await getModuleWithProgress("recruitment-fundamentals", candidateA.id);
      expect(modA?.completedLessons).toBe(1);
    });
  });

  describe("5. Lesson Navigation & Ordering", () => {
    it("returns correct prevLesson and nextLesson links", async () => {
      const mod1 = await prisma.module.findUnique({
        where: { moduleNumber: 1 },
        include: { lessons: { orderBy: { lessonNumber: "asc" } } },
      });

      const lesson2 = mod1!.lessons[1]; // Lesson 2

      const navData = await getLessonWithNavigation(
        "recruitment-fundamentals",
        lesson2.slug,
        candidateA.id
      );

      expect(navData).not.toBeNull();
      expect(navData?.prevLesson?.lessonNumber).toBe(1);
      expect(navData?.nextLesson?.lessonNumber).toBe(3);
    });
  });
});
