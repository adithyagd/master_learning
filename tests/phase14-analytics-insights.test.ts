// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { calculateGrowthPct, resolveComparisonBounds } from "@/lib/analytics-calculator";
import {
  getPeriodComparisonMetrics,
  getRecruitmentFunnelAnalytics,
  getPerformanceInsightsAndForecast,
} from "@/actions/analytics";

describe("Phase 14: Data-Driven Recruitment Analytics & Performance Insights", () => {
  let adminUser: { id: string; email: string; role: string };
  let managerUser: { id: string; email: string; role: string };
  let recruiter1: { id: string; profileId: string; email: string; candidateId: string };
  let recruiter2: { id: string; profileId: string; email: string; candidateId: string };
  let client1: { id: string; name: string; code: string };

  const PASSWORD = "Password123!";

  beforeAll(async () => {
    // 1. Cleanup old test data
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateStageHistory.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.scheduledInterview.deleteMany();
    await prisma.targetConfig.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P14-REC-01", "P14-REC-02"] } },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["p14_admin@e2epvtltd.com", "p14_mgr@e2epvtltd.com", "p14_rec1@e2epvtltd.com", "p14_rec2@e2epvtltd.com"],
        },
      },
    });

    await prisma.clientMaster.deleteMany({
      where: { code: "P14-CLI-01" },
    });

    const passwordHash = await hashPassword(PASSWORD);

    // 2. Create users
    const admin = await prisma.user.create({
      data: {
        email: "p14_admin@e2epvtltd.com",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P14 Super Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: admin.role };

    const mgr = await prisma.user.create({
      data: {
        email: "p14_mgr@e2epvtltd.com",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "P14 Analytics Manager",
      },
    });
    managerUser = { id: mgr.id, email: mgr.email, role: mgr.role };

    // 3. Create client
    client1 = await prisma.clientMaster.create({
      data: {
        name: "P14 Analytics Client",
        code: "P14-CLI-01",
        status: "ACTIVE",
      },
    });

    // 4. Create recruiters
    const u1 = await prisma.user.create({
      data: {
        email: "p14_rec1@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp1 = await prisma.candidateProfile.create({
      data: {
        userId: u1.id,
        candidateId: "P14-REC-01",
        fullName: "P14 Recruiter One",
        joiningDate: new Date(),
        isCertified: true,
        certificateStatus: "ISSUED",
        managerId: managerUser.id,
      },
    });
    recruiter1 = { id: u1.id, profileId: cp1.id, email: u1.email, candidateId: cp1.candidateId };

    const u2 = await prisma.user.create({
      data: {
        email: "p14_rec2@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp2 = await prisma.candidateProfile.create({
      data: {
        userId: u2.id,
        candidateId: "P14-REC-02",
        fullName: "P14 Recruiter Two",
        joiningDate: new Date(),
        isCertified: true,
        certificateStatus: "ISSUED",
        managerId: null,
      },
    });
    recruiter2 = { id: u2.id, profileId: cp2.id, email: u2.email, candidateId: cp2.candidateId };

    // 5. Create Daily Reports for comparison tests
    const now = new Date();
    const today = new Date(now);
    today.setHours(12, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    // Today's report for Recruiter 1: 50 calls, 5 own, 5 internal, 8 screened, 3 shortlists, 2 lineups, 2 attended, 1 offer, 1 join, 0 absconded
    await prisma.dailyReport.create({
      data: {
        recruiterProfileId: recruiter1.profileId,
        reportDate: today,
        callsMade: 50,
        ownLeads: 5,
        internalLeads: 5,
        profilesSubmitted: 8,
        shortlisted: 3,
        interviewsScheduled: 2,
        interviewsAttended: 2,
        offersExtended: 1,
        joinings: 1,
        absconded: 0,
        pendingFollowUps: 2,
        status: "SUBMITTED",
        clientBreakdowns: {
          create: [
            {
              clientId: client1.id,
              clientName: client1.name,
              calls: 50,
              ownLeads: 5,
              internalLeads: 5,
              screened: 8,
              shortlisted: 3,
              lineUp: 2,
              offered: 1,
              joined: 1,
              absconded: 0,
            },
          ],
        },
      },
    });

    // Yesterday's report for Recruiter 1: 30 calls, 2 own, 3 internal, 4 screened, 2 shortlists, 1 lineup, 1 attended, 0 offers, 0 joins, 0 absconded
    await prisma.dailyReport.create({
      data: {
        recruiterProfileId: recruiter1.profileId,
        reportDate: yesterday,
        callsMade: 30,
        ownLeads: 2,
        internalLeads: 3,
        profilesSubmitted: 4,
        shortlisted: 2,
        interviewsScheduled: 1,
        interviewsAttended: 1,
        offersExtended: 0,
        joinings: 0,
        absconded: 0,
        pendingFollowUps: 0,
        status: "APPROVED",
        clientBreakdowns: {
          create: [
            {
              clientId: client1.id,
              clientName: client1.name,
              calls: 30,
              ownLeads: 2,
              internalLeads: 3,
              screened: 4,
              shortlisted: 2,
              lineUp: 1,
              offered: 0,
              joined: 0,
              absconded: 0,
            },
          ],
        },
      },
    });

    // Configure Target for Recruiter 1
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const periodKey = `${year}-${month}`;

    await prisma.targetConfig.create({
      data: {
        recruiterProfileId: recruiter1.profileId,
        periodType: "MONTHLY",
        periodKey,
        startDate: new Date(year, today.getMonth(), 1),
        endDate: new Date(year, today.getMonth() + 1, 0, 23, 59, 59, 999),
        joinsTarget: 5,
        configuredByAdminId: adminUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.dailyReportClientBreakdown.deleteMany({
      where: { dailyReport: { recruiterProfile: { candidateId: { startsWith: "P14-" } } } },
    });
    await prisma.dailyReport.deleteMany({
      where: { recruiterProfile: { candidateId: { startsWith: "P14-" } } },
    });
    await prisma.targetConfig.deleteMany({
      where: { configuredByAdminId: adminUser?.id },
    });
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { startsWith: "P14-" } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "p14_" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: "P14-CLI-01" },
    });
  });

  describe("1. Growth & Percentage Formula Mathematics (Zero Denominators)", () => {
    it("handles zero denominator safely when previous is 0 and current is 0", () => {
      const res = calculateGrowthPct(0, 0);
      expect(res.growthPct).toBe(0);
      expect(res.formattedGrowth).toBe("0%");
      expect(res.isNew).toBe(false);
      expect(res.trend).toBe("neutral");
    });

    it("handles zero denominator safely when previous is 0 and current is >0 (New Activity)", () => {
      const res = calculateGrowthPct(5, 0);
      expect(res.growthPct).toBe(100);
      expect(res.formattedGrowth).toBe("+100% (New)");
      expect(res.isNew).toBe(true);
      expect(res.trend).toBe("up");
    });

    it("handles negative growth when current is 0 and previous is >0", () => {
      const res = calculateGrowthPct(0, 10);
      expect(res.growthPct).toBe(-100);
      expect(res.formattedGrowth).toBe("-100%");
      expect(res.isNew).toBe(false);
      expect(res.trend).toBe("down");
    });

    it("calculates accurate positive percentage growth", () => {
      // 50 vs 25 = +100%
      const res = calculateGrowthPct(50, 25);
      expect(res.growthPct).toBe(100);
      expect(res.formattedGrowth).toBe("+100%");
      expect(res.trend).toBe("up");
    });

    it("calculates accurate negative percentage growth", () => {
      // 25 vs 50 = -50%
      const res = calculateGrowthPct(25, 50);
      expect(res.growthPct).toBe(-50);
      expect(res.formattedGrowth).toBe("-50%");
      expect(res.trend).toBe("down");
    });
  });

  describe("2. Period-over-Period Operational Comparisons", () => {
    it("calculates Daily Comparison (Today vs Yesterday) accurately across all 10 metrics", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "DAILY", recruiterProfileId: recruiter1.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const { metrics } = res.data!;

      // Calls: 50 today vs 30 yesterday -> absolute change = +20, growth = +67%
      expect(metrics.calls.current).toBe(50);
      expect(metrics.calls.previous).toBe(30);
      expect(metrics.calls.absoluteChange).toBe(20);
      expect(metrics.calls.growthPct).toBe(67);
      expect(metrics.calls.trend).toBe("up");

      // Own leads: 5 vs 2 -> absolute change = +3
      expect(metrics.ownLeads.current).toBe(5);
      expect(metrics.ownLeads.previous).toBe(2);
      expect(metrics.ownLeads.absoluteChange).toBe(3);

      // Internal leads: 5 vs 3 -> absolute change = +2
      expect(metrics.internalLeads.current).toBe(5);
      expect(metrics.internalLeads.previous).toBe(3);

      // Screened: 8 vs 4 -> +100%
      expect(metrics.screened.current).toBe(8);
      expect(metrics.screened.previous).toBe(4);
      expect(metrics.screened.growthPct).toBe(100);

      // Shortlisted: 3 vs 2 -> absolute change = +1
      expect(metrics.shortlisted.current).toBe(3);
      expect(metrics.shortlisted.previous).toBe(2);

      // Line-up: 2 vs 1 -> +100%
      expect(metrics.interviewLineup.current).toBe(2);
      expect(metrics.interviewLineup.previous).toBe(1);

      // Attended: 2 vs 1 -> +100%
      expect(metrics.interviewAttended.current).toBe(2);
      expect(metrics.interviewAttended.previous).toBe(1);

      // Offers: 1 vs 0 -> +100% (New)
      expect(metrics.offers.current).toBe(1);
      expect(metrics.offers.previous).toBe(0);
      expect(metrics.offers.isNew).toBe(true);

      // Joins: 1 vs 0 -> +100% (New)
      expect(metrics.joins.current).toBe(1);
      expect(metrics.joins.previous).toBe(0);
      expect(metrics.joins.isNew).toBe(true);

      // Absconded: 0 vs 0 -> 0%
      expect(metrics.absconded.current).toBe(0);
      expect(metrics.absconded.previous).toBe(0);
      expect(metrics.absconded.growthPct).toBe(0);
    });

    it("calculates Weekly Comparison (This Week vs Last Week)", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "WEEKLY", recruiterProfileId: recruiter1.profileId },
        adminUser
      );
      expect(res.success).toBe(true);
      expect(res.data!.periodType).toBe("WEEKLY");
      expect(res.data!.currentBounds).toBeDefined();
      expect(res.data!.previousBounds).toBeDefined();
    });

    it("calculates Monthly Comparison (This Month vs Last Month)", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "MONTHLY", recruiterProfileId: recruiter1.profileId },
        adminUser
      );
      expect(res.success).toBe(true);
      expect(res.data!.periodType).toBe("MONTHLY");
      expect(res.data!.currentBounds).toBeDefined();
      expect(res.data!.previousBounds).toBeDefined();
    });
  });

  describe("3. 9-Stage Sequential Recruitment Funnel Accuracy", () => {
    it("builds the exact 9 sequential stages in proper order with explicit denominators", async () => {
      const res = await getRecruitmentFunnelAnalytics(
        { recruiterProfileId: recruiter1.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const { stages, totalPipelineDropOff, overallThroughputRatePct } = res.data!;

      expect(stages).toHaveLength(9);

      // Expected stage sequence:
      // Calls -> Interested -> Screened -> Shortlisted -> Interview Scheduled -> Interview Attended -> Offered -> Offer Accepted -> Joined
      const expectedNames = [
        "Calls",
        "Interested",
        "Screened",
        "Shortlisted",
        "Interview Scheduled",
        "Interview Attended",
        "Offered",
        "Offer Accepted",
        "Joined",
      ];

      expect(stages.map((s) => s.stageName)).toEqual(expectedNames);

      // Verify denominators are defined and explicit
      stages.forEach((stg, idx) => {
        expect(stg.stepNumber).toBe(idx + 1);
        expect(stg.denominatorLabel).toBeDefined();
        expect(stg.stepConversionRatePct).toBeGreaterThanOrEqual(0);
        expect(stg.stepDropOffRatePct).toBeGreaterThanOrEqual(0);
        expect(stg.cumulativeConversionPct).toBeGreaterThanOrEqual(0);
      });

      // Drop-off calculations
      expect(totalPipelineDropOff).toBeGreaterThanOrEqual(0);
      expect(overallThroughputRatePct).toBeGreaterThanOrEqual(0);
    });
  });

  describe("4. Automated Diagnostic Insights & Bottleneck Triggers", () => {
    it("generates pending follow-ups alert when pending follow-ups exist", async () => {
      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter1.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const { insights } = res.data!;

      const followUpInsight = insights.find((i) => i.id === "pending-follow-ups");
      expect(followUpInsight).toBeDefined();
      expect(followUpInsight!.type).toBe("FOLLOW_UP");
      expect(followUpInsight!.diagnostic).toContain("pending candidate follow-ups");
    });

    it("triggers Sourcing Channel bottleneck alert when calls are high and shortlists are low (<10%)", async () => {
      // Seed a high call / low shortlist report for testing
      const now = new Date();
      const testReport = await prisma.dailyReport.create({
        data: {
          recruiterProfileId: recruiter2.profileId,
          reportDate: now,
          callsMade: 60,
          shortlisted: 2, // 2 / 60 = 3.3% (< 10%)
          status: "APPROVED",
        },
      });

      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter2.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const bottleneck = res.data!.insights.find((i) => i.id === "bottleneck-calling-shortlist");
      expect(bottleneck).toBeDefined();
      expect(bottleneck!.severity).toBe("warning");
      expect(bottleneck!.diagnostic).toContain("High calling outreach");
      expect(bottleneck!.recommendation).toContain("Boolean search strings");

      // Cleanup test report
      await prisma.dailyReport.delete({ where: { id: testReport.id } });
    });

    it("triggers Interview Attendance bottleneck alert when shortlisted is high and attendance is low (<50%)", async () => {
      const now = new Date();
      const testReport = await prisma.dailyReport.create({
        data: {
          recruiterProfileId: recruiter2.profileId,
          reportDate: now,
          callsMade: 20,
          shortlisted: 10,
          interviewsScheduled: 8,
          interviewsAttended: 2, // 2 / 8 = 25% (< 50%)
          status: "APPROVED",
        },
      });

      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter2.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const bottleneck = res.data!.insights.find((i) => i.id === "bottleneck-interview-attendance");
      expect(bottleneck).toBeDefined();
      expect(bottleneck!.severity).toBe("warning");
      expect(bottleneck!.diagnostic).toContain("interviews were lined up, but only");
      expect(bottleneck!.recommendation).toContain("WhatsApp confirmations");

      await prisma.dailyReport.delete({ where: { id: testReport.id } });
    });

    it("triggers Post-Offer Dropout alert when offers are high and joins are low (<50%)", async () => {
      const now = new Date();
      const testReport = await prisma.dailyReport.create({
        data: {
          recruiterProfileId: recruiter2.profileId,
          reportDate: now,
          callsMade: 20,
          shortlisted: 5,
          interviewsScheduled: 3,
          interviewsAttended: 3,
          offersExtended: 4,
          joinings: 1, // 1 / 4 = 25% (< 50%)
          absconded: 1,
          status: "APPROVED",
        },
      });

      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter2.profileId },
        adminUser
      );

      expect(res.success).toBe(true);
      const bottleneck = res.data!.insights.find((i) => i.id === "bottleneck-offer-dropoff");
      expect(bottleneck).toBeDefined();
      expect(bottleneck!.severity).toBe("danger");
      expect(bottleneck!.diagnostic).toContain("offers were extended, resulting in only");
      expect(bottleneck!.recommendation).toContain("counter-offers");

      await prisma.dailyReport.delete({ where: { id: testReport.id } });
    });
  });

  describe("5. Honest Joining Forecast with Explicit Data Sufficiency", () => {
    it("returns INSUFFICIENT_DATA and zero fabricated numbers when historical records are <14 days", async () => {
      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter1.profileId, forceSufficientDataForTesting: false },
        adminUser
      );

      expect(res.success).toBe(true);
      const { forecast } = res.data!;

      expect(forecast.isSufficientData).toBe(false);
      expect(forecast.forecastStatus).toBe("INSUFFICIENT_DATA");
      expect(forecast.confidenceLevel).toBe("NONE");
      expect(forecast.projectedJoins).toBeNull();
      expect(forecast.explanation).toContain("Insufficient historical operational records");
    });

    it("returns PROJECTED_ESTIMATE and explicit methodology when sufficient historical data is simulated", async () => {
      const res = await getPerformanceInsightsAndForecast(
        { recruiterProfileId: recruiter1.profileId, forceSufficientDataForTesting: true },
        adminUser
      );

      expect(res.success).toBe(true);
      const { forecast } = res.data!;

      expect(forecast.isSufficientData).toBe(true);
      expect(forecast.forecastStatus).toBe("PROJECTED_ESTIMATE");
      expect(forecast.projectedJoins).not.toBeNull();
      expect(forecast.explanation).toContain("Projected");
      expect(forecast.forecastMethodology).toContain("Probabilistic Run-Rate");
    });
  });

  describe("6. Scoped Role Views & Security", () => {
    it("allows certified recruiter to access personal comparison metrics", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "DAILY" },
        { id: recruiter1.id, email: recruiter1.email, role: "CANDIDATE", profileId: recruiter1.profileId }
      );
      expect(res.success).toBe(true);
      expect(res.data!.metrics.calls.current).toBe(50);
    });

    it("allows manager to access team-scoped comparison metrics", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "DAILY" },
        { id: managerUser.id, email: managerUser.email, role: "MANAGER" }
      );
      expect(res.success).toBe(true);
      // Recruiter 1 is assigned to managerUser
      expect(res.data!.metrics.calls.current).toBe(50);
    });

    it("allows client-filtered comparison isolating client data", async () => {
      const res = await getPeriodComparisonMetrics(
        { periodType: "DAILY", clientId: client1.id },
        adminUser
      );
      expect(res.success).toBe(true);
      expect(res.data!.metrics.calls.current).toBe(50);
    });
  });
});
