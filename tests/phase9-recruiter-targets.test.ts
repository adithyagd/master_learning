// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  configureRecruiterTarget,
  getRecruiterTargets,
  getTargetChangeHistory,
} from "@/actions/target";
import {
  getAchievementBand,
  getPeriodBounds,
} from "@/lib/target-calculator";

describe("Phase 9: Configurable Recruiter Targets (Daily, Weekly, Monthly)", () => {
  let adminUser: { id: string; email: string; role: string };
  let certifiedRecruiterA: { id: string; profileId: string; email: string; isCertified: boolean; role: string };
  let certifiedRecruiterB: { id: string; profileId: string; email: string; isCertified: boolean; role: string };
  let uncertifiedRecruiter: { id: string; profileId: string; email: string; isCertified: boolean; role: string };

  const TODAY_STR = "2026-10-15";
  const TOMORROW_STR = "2026-10-16";

  beforeAll(async () => {
    // 1. Clean up target test records
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.scheduledInterview.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.recruiterNote.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.jobCandidate.deleteMany({
      where: {
        email: {
          contains: "p9_test",
        },
      },
    });

    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P9-ADMIN-REC", "P9-CERT-REC-A", "P9-CERT-REC-B", "P9-UNCERT-REC"],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p9_admin@e2epvtltd.com",
            "p9_rec_a@e2epvtltd.com",
            "p9_rec_b@e2epvtltd.com",
            "p9_uncert@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword("SecurePass123!");

    // 2. Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p9_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN" };

    // 3. Certified Recruiter A
    const aUser = await prisma.user.create({
      data: {
        email: "p9_rec_a@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P9-CERT-REC-A",
            fullName: "P9 Certified Lead Recruiter A",
            joiningDate: new Date(),
            currentModuleNumber: 5,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });
    certifiedRecruiterA = {
      id: aUser.id,
      profileId: aUser.candidateProfile!.id,
      email: aUser.email,
      isCertified: true,
      role: "CANDIDATE",
    };

    // 4. Certified Recruiter B
    const bUser = await prisma.user.create({
      data: {
        email: "p9_rec_b@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P9-CERT-REC-B",
            fullName: "P9 Certified Recruiter B",
            joiningDate: new Date(),
            currentModuleNumber: 5,
            isCertified: true,
            certificateStatus: "ISSUED",
          },
        },
      },
      include: { candidateProfile: true },
    });
    certifiedRecruiterB = {
      id: bUser.id,
      profileId: bUser.candidateProfile!.id,
      email: bUser.email,
      isCertified: true,
      role: "CANDIDATE",
    };

    // 5. Uncertified Trainee
    const uUser = await prisma.user.create({
      data: {
        email: "p9_uncert@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P9-UNCERT-REC",
            fullName: "P9 Uncertified Trainee",
            joiningDate: new Date(),
            currentModuleNumber: 2,
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
      role: "CANDIDATE",
    };
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.scheduledInterview.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.recruiterNote.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.jobCandidate.deleteMany({
      where: { email: { contains: "p9_test" } },
    });
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: { in: ["P9-ADMIN-REC", "P9-CERT-REC-A", "P9-CERT-REC-B", "P9-UNCERT-REC"] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p9_admin@e2epvtltd.com",
            "p9_rec_a@e2epvtltd.com",
            "p9_rec_b@e2epvtltd.com",
            "p9_uncert@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. PERMISSIONS & ROLE-BASED ACCESS CONTROL
  // =========================================================================
  describe("1. Permission Restrictions & Security", () => {
    it("strictly blocks candidates/recruiters from configuring targets", async () => {
      // Recruiter attempts to configure targets
      const res = await configureRecruiterTarget(
        {
          recruiterProfileId: certifiedRecruiterA.profileId,
          periodType: "DAILY",
          callsTarget: 50,
        },
        certifiedRecruiterA as any
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("Administrator privileges required");
    });

    it("strictly blocks unauthenticated callers from configuring targets", async () => {
      const res = await configureRecruiterTarget({
        periodType: "DAILY",
        callsTarget: 50,
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Administrator privileges required");
    });

    it("allows authorized Admins to configure targets", async () => {
      const res = await configureRecruiterTarget(
        {
          recruiterProfileId: certifiedRecruiterA.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
          callsTarget: 40,
          shortlistTarget: 8,
          interviewsTarget: 3,
          offersTarget: 2,
          joinsTarget: 1,
          ownLeadsTarget: 10,
          internalLeadsTarget: 10,
          orgMonthlyJoinsTarget: 15,
          reason: "Q4 Target Calibration",
        },
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.targetConfigId).toBeDefined();
    });

    it("allows recruiters to view their own targets but blocks viewing another recruiter's targets", async () => {
      // Recruiter A viewing own targets
      const ownRes = await getRecruiterTargets(
        {
          recruiterProfileId: certifiedRecruiterA.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
        },
        certifiedRecruiterA
      );
      expect(ownRes.success).toBe(true);
      expect(ownRes.data?.recruiterProfileId).toBe(certifiedRecruiterA.profileId);
      expect(ownRes.data?.metrics.CALLS.target).toBe(40);

      // Recruiter A trying to view Recruiter B's targets
      const otherRes = await getRecruiterTargets(
        {
          recruiterProfileId: certifiedRecruiterB.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
        },
        certifiedRecruiterA
      );
      expect(otherRes.success).toBe(false);
      expect(otherRes.message).toContain("Forbidden");
    });

    it("strictly blocks uncertified candidates from accessing workspace targets", async () => {
      const uncertRes = await getRecruiterTargets(
        {
          recruiterProfileId: uncertifiedRecruiter.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
        },
        uncertifiedRecruiter
      );
      expect(uncertRes.success).toBe(false);
      expect(uncertRes.message).toContain("Certified Recruiter access required");
    });
  });

  // =========================================================================
  // 2. DETERMINISTIC CALCULATIONS & ANTI-DOUBLE-COUNTING ENGINE
  // =========================================================================
  describe("2. Deterministic Metric Calculations & Anti-Double-Counting", () => {
    it("de-duplicates calls between notes and daily reports on the same day", async () => {
      const today = new Date(TODAY_STR);
      today.setHours(10, 0, 0, 0);

      // Candidate 1 for Recruiter A
      const cand1 = await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: certifiedRecruiterA.profileId,
          fullName: "P9 Test Candidate One",
          email: "p9_test_cand1@example.com",
          phone: "+919876543201",
          source: "LinkedIn",
          createdAt: today,
        },
      });

      // Recruiter A logs 3 CALL_LOG notes on today
      await prisma.recruiterNote.createMany({
        data: [
          { jobCandidateId: cand1.id, recruiterProfileId: certifiedRecruiterA.profileId, noteType: "CALL_LOG", content: "Screening 1", createdAt: today },
          { jobCandidateId: cand1.id, recruiterProfileId: certifiedRecruiterA.profileId, noteType: "CALL_LOG", content: "Screening 2", createdAt: today },
          { jobCandidateId: cand1.id, recruiterProfileId: certifiedRecruiterA.profileId, noteType: "CALL_LOG", content: "Screening 3", createdAt: today },
        ],
      });

      // Recruiter A also submits a DailyReport stating 5 callsMade on today
      const reportDate = new Date(TODAY_STR);
      reportDate.setHours(0, 0, 0, 0);
      await prisma.dailyReport.create({
        data: {
          recruiterProfileId: certifiedRecruiterA.profileId,
          reportDate,
          callsMade: 5,
        },
      });

      // Anti-double-counting check:
      // Calls for today should be Math.max(3, 5) = 5, NOT 8!
      const perf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      expect(perf.data?.metrics.CALLS.achieved).toBe(5);
      expect(perf.data?.metrics.CALLS.remaining).toBe(35); // 40 - 5
    });

    it("calculates distinct shortlisted candidates, interview line-ups, offers, and joins", async () => {
      const today = new Date(TODAY_STR);
      today.setHours(11, 0, 0, 0);

      const cand2 = await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: certifiedRecruiterA.profileId,
          fullName: "P9 Test Candidate Two",
          email: "p9_test_cand2@example.com",
          phone: "+919876543202",
          source: "Internal Database",
          createdAt: today,
        },
      });

      // 1. Shortlisted: Move cand2 to SHORTLISTED twice (e.g. re-evaluated)
      await prisma.candidateStageHistory.createMany({
        data: [
          { jobCandidateId: cand2.id, changedByRecruiterId: certifiedRecruiterA.profileId, toStage: "SHORTLISTED", reason: "First shortlist", createdAt: today },
          { jobCandidateId: cand2.id, changedByRecruiterId: certifiedRecruiterA.profileId, toStage: "SHORTLISTED", reason: "Second shortlist", createdAt: today },
        ],
      });

      // 2. Interview Line-ups: Schedule interview for cand2 today
      await prisma.scheduledInterview.create({
        data: {
          jobCandidateId: cand2.id,
          recruiterProfileId: certifiedRecruiterA.profileId,
          clientName: "Bosch India",
          jobRole: "Assembly Specialist",
          scheduledAt: today,
          status: "SCHEDULED",
        },
      });

      // 3. Offer: Move cand2 to OFFERED
      await prisma.candidateStageHistory.create({
        data: {
          jobCandidateId: cand2.id,
          changedByRecruiterId: certifiedRecruiterA.profileId,
          toStage: "OFFERED",
          reason: "Selected by client",
          createdAt: today,
        },
      });

      // 4. Join: Move cand2 to JOINED
      await prisma.candidateStageHistory.create({
        data: {
          jobCandidateId: cand2.id,
          changedByRecruiterId: certifiedRecruiterA.profileId,
          toStage: "JOINED",
          reason: "Onboarding complete",
          createdAt: today,
        },
      });

      const perf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      // Shortlisted should be 1 (distinct candidate, not 2)
      expect(perf.data?.metrics.SHORTLISTED.achieved).toBe(1);
      // Interview line-ups should be 1
      expect(perf.data?.metrics.INTERVIEWS.achieved).toBe(1);
      // Offers should be 1
      expect(perf.data?.metrics.OFFERS.achieved).toBe(1);
      // Joins should be 1
      expect(perf.data?.metrics.JOINS.achieved).toBe(1);
      expect(perf.data?.metrics.JOINS.remaining).toBe(0); // target was 1
    });

    it("segregates own leads vs internal leads by sourcing channel", async () => {
      const perf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      // cand1 was created with "LinkedIn" (Own Lead)
      // cand2 was created with "Internal Database" (Internal Lead)
      expect(perf.data?.metrics.OWN_LEADS.achieved).toBe(1);
      expect(perf.data?.metrics.INTERNAL_LEADS.achieved).toBe(1);
    });

    it("calculates team / org monthly joining target across all recruiters", async () => {
      const today = new Date(TODAY_STR);
      today.setHours(14, 0, 0, 0);

      // Candidate 3 belonging to Recruiter B
      const cand3 = await prisma.jobCandidate.create({
        data: {
          recruiterProfileId: certifiedRecruiterB.profileId,
          fullName: "P9 Test Candidate Three",
          email: "p9_test_cand3@example.com",
          phone: "+919876543203",
          source: "Naukri",
          createdAt: today,
        },
      });

      // Recruiter B closes joining for cand3 today
      await prisma.candidateStageHistory.create({
        data: {
          jobCandidateId: cand3.id,
          changedByRecruiterId: certifiedRecruiterB.profileId,
          toStage: "JOINED",
          reason: "Recruiter B closed joining",
          createdAt: today,
        },
      });

      // Check Recruiter A's targets: Org monthly joins should count BOTH cand2 (by Recruiter A) and cand3 (by Recruiter B) = 2!
      const perfA = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      expect(perfA.data?.metrics.ORG_MONTHLY_JOINS.achieved).toBe(2);
      expect(perfA.data?.metrics.ORG_MONTHLY_JOINS.remaining).toBe(13); // target 15 - 2 = 13
    });
  });

  // =========================================================================
  // 3. ACHIEVEMENT BANDS & MATH ACCURACY
  // =========================================================================
  describe("3. Achievement Bands (0–25% Critical, 26–50% Low, 51–75% Med, 76–90% Good, 91–100% Great, >100% Outstanding)", () => {
    it("accurately classifies achievement percentages into mandatory bands", () => {
      expect(getAchievementBand(0).band).toBe("Critical");
      expect(getAchievementBand(25).band).toBe("Critical");
      expect(getAchievementBand(26).band).toBe("Low");
      expect(getAchievementBand(50).band).toBe("Low");
      expect(getAchievementBand(51).band).toBe("Medium");
      expect(getAchievementBand(75).band).toBe("Medium");
      expect(getAchievementBand(76).band).toBe("Good");
      expect(getAchievementBand(90).band).toBe("Good");
      expect(getAchievementBand(91).band).toBe("Great");
      expect(getAchievementBand(100).band).toBe("Great");
      expect(getAchievementBand(101).band).toBe("Outstanding");
      expect(getAchievementBand(150).band).toBe("Outstanding");
    });

    it("verifies achieved vs remaining and attainment percentage in target results", async () => {
      const perf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      // Calls: 5 achieved out of 40 = 12.5% -> Critical
      const callsMetric = perf.data?.metrics.CALLS;
      expect(callsMetric?.achievementPercentage).toBe(12.5);
      expect(callsMetric?.band.band).toBe("Critical");
      expect(callsMetric?.remaining).toBe(35);

      // Joins: 1 achieved out of 1 = 100% -> Great
      const joinsMetric = perf.data?.metrics.JOINS;
      expect(joinsMetric?.achievementPercentage).toBe(100);
      expect(joinsMetric?.band.band).toBe("Great");
      expect(joinsMetric?.remaining).toBe(0);
    });
  });

  // =========================================================================
  // 4. PERIOD BOUNDARIES (DAILY, WEEKLY, MONTHLY)
  // =========================================================================
  describe("4. Period Boundaries Isolation", () => {
    it("does not bleed activity on Date 1 into Date 2 in Daily period", async () => {
      // Date 2 (Tomorrow): Recruiter A has no activity logged yet
      const tomorrowPerf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TOMORROW_STR },
        adminUser
      );

      expect(tomorrowPerf.data?.metrics.CALLS.achieved).toBe(0);
      expect(tomorrowPerf.data?.metrics.SHORTLISTED.achieved).toBe(0);
      expect(tomorrowPerf.data?.metrics.INTERVIEWS.achieved).toBe(0);
      expect(tomorrowPerf.data?.metrics.OFFERS.achieved).toBe(0);
      expect(tomorrowPerf.data?.metrics.JOINS.achieved).toBe(0);
    });

    it("aggregates the full calendar week in Weekly period", async () => {
      const weeklyPerf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "WEEKLY", periodDate: TODAY_STR },
        adminUser
      );

      expect(weeklyPerf.success).toBe(true);
      expect(weeklyPerf.data?.periodType).toBe("WEEKLY");
      expect(weeklyPerf.data?.periodKey).toContain("-W");
      // Activity from 2026-10-15 is included in that week's totals
      expect(weeklyPerf.data?.metrics.CALLS.achieved).toBe(5);
      expect(weeklyPerf.data?.metrics.JOINS.achieved).toBe(1);
    });

    it("aggregates the full calendar month in Monthly period", async () => {
      const monthlyPerf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "MONTHLY", periodDate: TODAY_STR },
        adminUser
      );

      expect(monthlyPerf.success).toBe(true);
      expect(monthlyPerf.data?.periodType).toBe("MONTHLY");
      expect(monthlyPerf.data?.periodKey).toBe("2026-10");
      expect(monthlyPerf.data?.metrics.CALLS.achieved).toBe(5);
      expect(monthlyPerf.data?.metrics.JOINS.achieved).toBe(1);
    });
  });

  // =========================================================================
  // 5. TARGET CHANGES, EFFECTIVE DATES & AUDIT HISTORY
  // =========================================================================
  describe("5. Target Changes & Audit History", () => {
    it("records target changes, previous/new values, and effective dates in audit history", async () => {
      // Modify target for Recruiter A
      const updateRes = await configureRecruiterTarget(
        {
          recruiterProfileId: certifiedRecruiterA.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
          callsTarget: 60, // Changed from 40 to 60
          shortlistTarget: 12, // Changed from 8 to 12
          reason: "Increased calling quota for Bangalore blitz",
        },
        adminUser
      );

      expect(updateRes.success).toBe(true);
      const configId = updateRes.data?.targetConfigId;

      // Query audit change history
      const historyRes = await getTargetChangeHistory(
        { targetConfigId: configId },
        adminUser
      );

      expect(historyRes.success).toBe(true);
      expect(historyRes.data?.length).toBeGreaterThanOrEqual(1);

      const latestChange = historyRes.data![0];
      expect(latestChange.adminEmail).toBe("p9_admin@e2epvtltd.com");
      expect(latestChange.reason).toBe("Increased calling quota for Bangalore blitz");
      expect((latestChange.previousValues as any).callsTarget).toBe(40);
      expect((latestChange.newValues as any).callsTarget).toBe(60);
      expect(latestChange.effectiveFrom).toBeDefined();

      // Recruiter target query reflects new target
      const updatedPerf = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterA.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );
      expect(updatedPerf.data?.metrics.CALLS.target).toBe(60);
    });
  });

  // =========================================================================
  // 6. ZERO TARGETS & EDGE CASES
  // =========================================================================
  describe("6. Zero Targets & Edge Case Handling", () => {
    it("handles zero targets gracefully without NaN or division-by-zero errors", async () => {
      // Set zero targets for all metrics
      await configureRecruiterTarget(
        {
          recruiterProfileId: certifiedRecruiterB.profileId,
          periodType: "DAILY",
          periodDate: TODAY_STR,
          callsTarget: 0,
          shortlistTarget: 0,
          interviewsTarget: 0,
          offersTarget: 0,
          joinsTarget: 0,
          ownLeadsTarget: 0,
          internalLeadsTarget: 0,
          orgMonthlyJoinsTarget: 0,
          reason: "Zero target test",
        },
        adminUser
      );

      const perfB = await getRecruiterTargets(
        { recruiterProfileId: certifiedRecruiterB.profileId, periodType: "DAILY", periodDate: TODAY_STR },
        adminUser
      );

      expect(perfB.success).toBe(true);
      // Ensure zero targets produce valid numbers, not NaN
      expect(Number.isNaN(perfB.data?.overallAveragePercentage)).toBe(false);
      expect(Number.isFinite(perfB.data?.overallAveragePercentage)).toBe(true);

      const callsB = perfB.data?.metrics.CALLS;
      expect(callsB?.target).toBe(0);
      expect(callsB?.remaining).toBe(0);
      expect(Number.isNaN(callsB?.achievementPercentage)).toBe(false);
      expect(callsB?.band).toBeDefined();
    });
  });
});
