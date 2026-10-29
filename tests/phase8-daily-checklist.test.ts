// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  getChecklistForDate,
  toggleChecklistItem,
  markWorkdayCompleted,
} from "@/actions/workspace";
import { MASTER_CHECKLIST_ITEMS, CHECKLIST_SECTIONS } from "@/lib/checklist-data";

describe("Phase 8: Persistent 3-Section Daily Recruiter SOP Checklist", () => {
  let uncertifiedRecruiter: { id: string; profileId: string; email: string; isCertified: boolean };
  let certifiedRecruiterA: { id: string; profileId: string; email: string; isCertified: boolean };
  let certifiedRecruiterB: { id: string; profileId: string; email: string; isCertified: boolean };

  const TODAY_STR = "2026-10-15";
  const YESTERDAY_STR = "2026-10-14";
  const TOMORROW_STR = "2026-10-16";

  beforeAll(async () => {
    // 1. Clean up existing test records
    await prisma.recruiterChecklist.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P8-UNCERT-REC", "P8-CERT-REC-A", "P8-CERT-REC-B"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p8_uncert@e2epvtltd.com",
            "p8_rec_a@e2epvtltd.com",
            "p8_rec_b@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword("SecurePass123!");

    // 2. Uncertified Candidate User
    const uUser = await prisma.user.create({
      data: {
        email: "p8_uncert@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P8-UNCERT-REC",
            fullName: "P8 Uncertified Trainee",
            joiningDate: new Date(),
            currentModuleNumber: 3,
            isCertified: false,
            certificateStatus: "IN_PROGRESS",
          },
        },
      },
      include: { candidateProfile: true },
    });
    uncertifiedRecruiter = {
      id: uUser.id,
      profileId: uUser.candidateProfile!.id,
      email: uUser.email,
      isCertified: false,
    };

    // 3. Certified Recruiter A
    const aUser = await prisma.user.create({
      data: {
        email: "p8_rec_a@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P8-CERT-REC-A",
            fullName: "P8 Certified Recruiter A",
            joiningDate: new Date(),
            currentModuleNumber: 6,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });
    await prisma.certificate.create({
      data: {
        certificateNumber: "E2E-CERT-2026-P8RECA-001",
        candidateProfileId: aUser.candidateProfile!.id,
        finalScore: 92,
        approvedByAdminId: "admin-id",
        approvedByAdminName: "admin@e2epvtltd.com",
        status: "ISSUED",
        verificationCode: "P8A-VERI-1234-5678",
      },
    });
    certifiedRecruiterA = {
      id: aUser.id,
      profileId: aUser.candidateProfile!.id,
      email: aUser.email,
      isCertified: true,
    };

    // 4. Certified Recruiter B
    const bUser = await prisma.user.create({
      data: {
        email: "p8_rec_b@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P8-CERT-REC-B",
            fullName: "P8 Certified Recruiter B",
            joiningDate: new Date(),
            currentModuleNumber: 6,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });
    await prisma.certificate.create({
      data: {
        certificateNumber: "E2E-CERT-2026-P8RECB-002",
        candidateProfileId: bUser.candidateProfile!.id,
        finalScore: 85,
        approvedByAdminId: "admin-id",
        approvedByAdminName: "admin@e2epvtltd.com",
        status: "ISSUED",
        verificationCode: "P8B-VERI-9876-5432",
      },
    });
    certifiedRecruiterB = {
      id: bUser.id,
      profileId: bUser.candidateProfile!.id,
      email: bUser.email,
      isCertified: true,
    };
  });

  afterAll(async () => {
    await prisma.recruiterChecklist.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P8-UNCERT-REC", "P8-CERT-REC-A", "P8-CERT-REC-B"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p8_uncert@e2epvtltd.com",
            "p8_rec_a@e2epvtltd.com",
            "p8_rec_b@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. EXACT 3 SECTIONS & 22 TASKS STRUCTURE VERIFICATION
  // =========================================================================
  describe("1. Exact 3 Sections & 22 Checklist Items Specification", () => {
    it("guarantees exactly 22 items across the 3 mandatory sections", () => {
      expect(MASTER_CHECKLIST_ITEMS.length).toBe(22);

      const morning = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "MORNING");
      expect(morning.length).toBe(8);

      const day = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "DURING_DAY");
      expect(day.length).toBe(8);

      const eod = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "END_OF_DAY");
      expect(eod.length).toBe(6);
    });

    it("verifies exact item titles for Morning (8 items)", () => {
      const morningTitles = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "MORNING").map((i) => i.title);
      expect(morningTitles).toEqual([
        "Log in",
        "Review requirements",
        "Review pending follow-ups",
        "Complete morning follow-ups",
        "Send line-up reminders",
        "Send WhatsApp reminders where applicable",
        "Confirm interviews",
        "Review daily targets",
      ]);
    });

    it("verifies exact item titles for During the day (8 items)", () => {
      const dayTitles = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "DURING_DAY").map((i) => i.title);
      expect(dayTitles).toEqual([
        "Source candidates",
        "Make calls",
        "Screen candidates",
        "Update candidate information",
        "Schedule interviews",
        "Follow up with shortlisted candidates",
        "Follow up on offers",
        "Follow up on joining",
      ]);
    });

    it("verifies exact item titles for End of day (6 items)", () => {
      const eodTitles = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "END_OF_DAY").map((i) => i.title);
      expect(eodTitles).toEqual([
        "Update reports and statuses",
        "Complete pending follow-ups",
        "Prepare tomorrow's plan",
        "Update the manager",
        "Submit the daily report",
        "Mark the day completed when applicable",
      ]);
    });
  });

  // =========================================================================
  // 2. CERTIFICATE GATING & ACCESS CONTROL
  // =========================================================================
  describe("2. Certificate Gating", () => {
    it("strictly blocks uncertified candidate from accessing or toggling checklist", async () => {
      const getRes = await getChecklistForDate(TODAY_STR, uncertifiedRecruiter);
      expect(getRes).toBeNull();

      const toggleRes = await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        TODAY_STR,
        uncertifiedRecruiter
      );
      expect(toggleRes.success).toBe(false);
      expect(toggleRes.message).toMatch(/unauthorized/i);
    });

    it("allows certified recruiter with issued certificate to access checklist", async () => {
      const res = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(res).not.toBeNull();
      expect(res?.totalCount).toBe(22);
      expect(res?.completedCount).toBe(0);
      expect(res?.overallPercentage).toBe(0);
      expect(res?.isDayCompleted).toBe(false);
    });
  });

  // =========================================================================
  // 3. ITEM PERSISTENCE & ACCURATE PERCENTAGE CALCULATION
  // =========================================================================
  describe("3. Item Persistence & Percentage Calculations", () => {
    it("toggles item to true, records completion timestamp, and accurately computes percentages", async () => {
      // Toggle 2 items in Morning
      const res1 = await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterA
      );
      expect(res1.success).toBe(true);
      expect(res1.data?.isCompleted).toBe(true);
      expect(res1.data?.completedAt).toBeDefined();

      await toggleChecklistItem(
        "morning_review_requirements",
        true,
        "Review requirements",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterA
      );

      // Verify state via getChecklistForDate
      const state = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(state).not.toBeNull();
      expect(state?.completedCount).toBe(2);
      // 2 / 22 = 9.09% -> 9%
      expect(state?.overallPercentage).toBe(9);

      const morningSec = state?.sections.find((s) => s.id === "MORNING");
      expect(morningSec?.completed).toBe(2);
      expect(morningSec?.total).toBe(8);
      // 2 / 8 = 25%
      expect(morningSec?.percentage).toBe(25);
    });

    it("un-toggles item to false and resets completedAt to null", async () => {
      const unToggleRes = await toggleChecklistItem(
        "morning_review_requirements",
        false,
        "Review requirements",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterA
      );

      expect(unToggleRes.success).toBe(true);
      expect(unToggleRes.data?.isCompleted).toBe(false);
      expect(unToggleRes.data?.completedAt).toBeNull();

      const state = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(state?.completedCount).toBe(1);
    });

    it("accurately calculates 50% when exactly 11 items are completed", async () => {
      // Toggle all 8 morning items
      const morningKeys = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "MORNING").map((i) => i.key);
      for (const key of morningKeys) {
        await toggleChecklistItem(key, true, undefined, "MORNING", TODAY_STR, certifiedRecruiterA);
      }

      // Toggle 3 items in During the Day (total 8 + 3 = 11 items)
      const dayKeys = MASTER_CHECKLIST_ITEMS.filter((i) => i.section === "DURING_DAY").map((i) => i.key);
      for (let i = 0; i < 3; i++) {
        await toggleChecklistItem(dayKeys[i], true, undefined, "DURING_DAY", TODAY_STR, certifiedRecruiterA);
      }

      const state = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(state?.completedCount).toBe(11);
      // 11 / 22 = 50%
      expect(state?.overallPercentage).toBe(50);
    });
  });

  // =========================================================================
  // 4. DATE BOUNDARIES & HISTORICAL INDEPENDENCE
  // =========================================================================
  describe("4. Date Boundaries & Work Date Persistence", () => {
    it("maintains complete independence between different work dates", async () => {
      // Today (TODAY_STR) currently has 11 completed items for Recruiter A.
      // Querying Yesterday (YESTERDAY_STR) should have 0 completed items.
      const yesterdayState = await getChecklistForDate(YESTERDAY_STR, certifiedRecruiterA);
      expect(yesterdayState?.completedCount).toBe(0);
      expect(yesterdayState?.overallPercentage).toBe(0);

      // Toggle 1 item on Yesterday
      await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        YESTERDAY_STR,
        certifiedRecruiterA
      );

      // Verify yesterday has 1 completed item
      const updatedYesterday = await getChecklistForDate(YESTERDAY_STR, certifiedRecruiterA);
      expect(updatedYesterday?.completedCount).toBe(1);

      // Verify Today was NOT mutated (still has 11 completed items)
      const todayState = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(todayState?.completedCount).toBe(11);
      expect(todayState?.overallPercentage).toBe(50);
    });

    it("accessing a new date initializes a clean uncompleted checklist without auto-spoofing", async () => {
      const tomorrowState = await getChecklistForDate(TOMORROW_STR, certifiedRecruiterA);
      expect(tomorrowState?.completedCount).toBe(0);
      expect(tomorrowState?.overallPercentage).toBe(0);
      expect(tomorrowState?.isDayCompleted).toBe(false);
    });
  });

  // =========================================================================
  // 5. REPEATED ACCESS & IDEMPOTENCE
  // =========================================================================
  describe("5. Repeated Access & State Preservation", () => {
    it("retains exact persisted state on repeated reads", async () => {
      const read1 = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      const read2 = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);

      expect(read1?.completedCount).toBe(read2?.completedCount);
      expect(read1?.overallPercentage).toBe(read2?.overallPercentage);
      expect(read1?.items).toEqual(read2?.items);
    });

    it("repeatedly toggling an already-true item retains completion state without error", async () => {
      const res = await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterA
      );
      expect(res.success).toBe(true);
      expect(res.data?.isCompleted).toBe(true);

      const state = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(state?.completedCount).toBe(11); // Count did not double or duplicate
    });
  });

  // =========================================================================
  // 6. WORKDAY COMPLETION (MARK DAY COMPLETED)
  // =========================================================================
  describe("6. Workday Completion Flag", () => {
    it("marks workday completed when eod_mark_day_completed is toggled or via markWorkdayCompleted", async () => {
      const res = await markWorkdayCompleted(TODAY_STR, certifiedRecruiterA);
      expect(res.success).toBe(true);
      expect(res.data?.isCompleted).toBe(true);

      const state = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(state?.isDayCompleted).toBe(true);

      const markItem = state?.items.find((i) => i.key === "eod_mark_day_completed");
      expect(markItem?.isCompleted).toBe(true);
      expect(markItem?.completedAt).toBeDefined();
    });
  });

  // =========================================================================
  // 7. RECRUITER OWNERSHIP ISOLATION
  // =========================================================================
  describe("7. Recruiter Ownership Isolation", () => {
    it("guarantees Recruiter B's checklist is completely isolated from Recruiter A", async () => {
      // Recruiter A has 12 items completed on TODAY_STR (including mark day completed).
      // Recruiter B has toggled 0 items on TODAY_STR.
      const stateB = await getChecklistForDate(TODAY_STR, certifiedRecruiterB);
      expect(stateB?.completedCount).toBe(0);
      expect(stateB?.overallPercentage).toBe(0);
      expect(stateB?.isDayCompleted).toBe(false);

      // Recruiter B toggles 3 items on TODAY_STR
      await toggleChecklistItem(
        "morning_login",
        true,
        "Log in",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterB
      );
      await toggleChecklistItem(
        "morning_review_requirements",
        true,
        "Review requirements",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterB
      );
      await toggleChecklistItem(
        "morning_confirm_interviews",
        true,
        "Confirm interviews",
        "MORNING",
        TODAY_STR,
        certifiedRecruiterB
      );

      const updatedStateB = await getChecklistForDate(TODAY_STR, certifiedRecruiterB);
      expect(updatedStateB?.completedCount).toBe(3);

      // Verify Recruiter A's count remained 12
      const stateA = await getChecklistForDate(TODAY_STR, certifiedRecruiterA);
      expect(stateA?.completedCount).toBe(12);
    });
  });
});
