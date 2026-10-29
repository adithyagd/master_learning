// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { loginAdmin } from "@/actions/auth";
import { getAdminDashboardMetrics } from "@/actions/admin-dashboard";

describe("Phase 13: Real Admin Dashboard & Authorized Aggregations", () => {
  let adminUser: { id: string; email: string; role: string };
  let managerUser: { id: string; email: string; role: string; name: string };
  let recruiter1: { id: string; profileId: string; email: string; candidateId: string };
  let recruiter2: { id: string; profileId: string; email: string; candidateId: string };
  let candidate3: { id: string; profileId: string; email: string; candidateId: string };
  let candidate4: { id: string; profileId: string; email: string; candidateId: string };
  let candidateInactive: { id: string; profileId: string; email: string; candidateId: string };

  let clientA: { id: string; name: string; code: string };
  let clientB: { id: string; name: string; code: string };
  let finalAssessment: { id: string };

  const PASSWORD = "AdminPassword123!";

  beforeAll(async () => {
    // 1. Cleanup old test data
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.attemptQuestion.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.certificate.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P13-REC-01", "P13-REC-02", "P13-REC-03", "P13-REC-04", "P13-REC-05"],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p13_admin@e2epvtltd.com",
            "p13_mgr@e2epvtltd.com",
            "p13_rec1@e2epvtltd.com",
            "p13_rec2@e2epvtltd.com",
            "p13_rec3@e2epvtltd.com",
            "p13_rec4@e2epvtltd.com",
            "p13_rec5@e2epvtltd.com",
          ],
        },
      },
    });

    await prisma.clientMaster.deleteMany({
      where: { code: { in: ["P13-CLI-A", "P13-CLI-B"] } },
    });

    const passwordHash = await hashPassword(PASSWORD);

    // 2. Create Admin user
    const admin = await prisma.user.create({
      data: {
        email: "p13_admin@e2epvtltd.com",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P13 Super Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: admin.role };

    // 3. Create Manager user
    const mgr = await prisma.user.create({
      data: {
        email: "p13_mgr@e2epvtltd.com",
        passwordHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "P13 Tech Manager",
      },
    });
    managerUser = { id: mgr.id, email: mgr.email, role: mgr.role, name: mgr.name! };

    // 4. Create Clients
    clientA = await prisma.clientMaster.create({
      data: {
        name: "P13 Client Alpha",
        code: "P13-CLI-A",
        status: "ACTIVE",
      },
    });

    clientB = await prisma.clientMaster.create({
      data: {
        name: "P13 Client Beta",
        code: "P13-CLI-B",
        status: "INACTIVE",
      },
    });

    // 5. Ensure Final Assessment exists
    let fa = await prisma.assessment.findFirst({
      where: { type: "FINAL" },
    });
    if (!fa) {
      fa = await prisma.assessment.create({
        data: {
          type: "FINAL",
          slug: "final-assessment-p13",
          title: "Final Assessment",
          description: "Final comprehensive test",
          passingScore: 70,
          questionCount: 20,
        },
      });
    }
    finalAssessment = { id: fa.id };

    // 6. Create Candidates
    // Recruiter 1: Certified, assigned to managerUser, academy completed, certificate issued
    const u1 = await prisma.user.create({
      data: {
        email: "p13_rec1@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp1 = await prisma.candidateProfile.create({
      data: {
        userId: u1.id,
        candidateId: "P13-REC-01",
        fullName: "P13 Recruiter One",
        joiningDate: new Date(),
        isCertified: true,
        certificateStatus: "ISSUED",
        academyStatus: "COMPLETED",
        managerId: managerUser.id,
      },
    });
    recruiter1 = {
      id: u1.id,
      profileId: cp1.id,
      email: u1.email,
      candidateId: cp1.candidateId,
    };

    // Create Certificate for Recruiter 1
    await prisma.certificate.create({
      data: {
        certificateNumber: "E2E-CERT-P13-001",
        candidateProfileId: cp1.id,
        finalScore: 85,
        verificationCode: "VERIFY-P13-001",
        approvedByAdminId: adminUser.id,
        approvedByAdminName: "P13 Super Admin",
        status: "ISSUED",
      },
    });

    // Record passed final assessment attempt for Recruiter 1
    await prisma.assessmentAttempt.create({
      data: {
        candidateProfileId: cp1.id,
        assessmentId: finalAssessment.id,
        status: "SUBMITTED",
        scorePercentage: 85,
        isPassed: true,
        totalQuestions: 20,
        correctAnswers: 17,
        submittedAt: new Date(),
      },
    });

    // Recruiter 2: In progress, not certified, unassigned
    const u2 = await prisma.user.create({
      data: {
        email: "p13_rec2@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp2 = await prisma.candidateProfile.create({
      data: {
        userId: u2.id,
        candidateId: "P13-REC-02",
        fullName: "P13 Recruiter Two",
        joiningDate: new Date(),
        isCertified: false,
        certificateStatus: "NOT_ELIGIBLE",
        academyStatus: "IN_PROGRESS",
        managerId: null,
      },
    });
    recruiter2 = {
      id: u2.id,
      profileId: cp2.id,
      email: u2.email,
      candidateId: cp2.candidateId,
    };

    // Candidate 3: Completed Academy, passed Final assessment, certificate PENDING_APPROVAL
    const u3 = await prisma.user.create({
      data: {
        email: "p13_rec3@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp3 = await prisma.candidateProfile.create({
      data: {
        userId: u3.id,
        candidateId: "P13-REC-03",
        fullName: "P13 Candidate Three",
        joiningDate: new Date(),
        isCertified: false,
        certificateStatus: "PENDING_APPROVAL",
        academyStatus: "COMPLETED",
        managerId: managerUser.id,
      },
    });
    candidate3 = {
      id: u3.id,
      profileId: cp3.id,
      email: u3.email,
      candidateId: cp3.candidateId,
    };

    await prisma.assessmentAttempt.create({
      data: {
        candidateProfileId: cp3.id,
        assessmentId: finalAssessment.id,
        status: "SUBMITTED",
        scorePercentage: 80,
        isPassed: true,
        totalQuestions: 20,
        correctAnswers: 16,
        submittedAt: new Date(),
      },
    });

    // Candidate 4: Completed Academy, certificate APPROVED (awaiting issuance)
    const u4 = await prisma.user.create({
      data: {
        email: "p13_rec4@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const cp4 = await prisma.candidateProfile.create({
      data: {
        userId: u4.id,
        candidateId: "P13-REC-04",
        fullName: "P13 Candidate Four",
        joiningDate: new Date(),
        isCertified: false,
        certificateStatus: "APPROVED",
        academyStatus: "COMPLETED",
      },
    });
    candidate4 = {
      id: u4.id,
      profileId: cp4.id,
      email: u4.email,
      candidateId: cp4.candidateId,
    };

    // Candidate 5: INACTIVE user status, Academy in progress
    const u5 = await prisma.user.create({
      data: {
        email: "p13_rec5@e2epvtltd.com",
        passwordHash,
        role: "CANDIDATE",
        status: "INACTIVE",
      },
    });
    const cp5 = await prisma.candidateProfile.create({
      data: {
        userId: u5.id,
        candidateId: "P13-REC-05",
        fullName: "P13 Inactive Candidate",
        joiningDate: new Date(),
        isCertified: false,
        certificateStatus: "NOT_ELIGIBLE",
        academyStatus: "IN_PROGRESS",
      },
    });
    candidateInactive = {
      id: u5.id,
      profileId: cp5.id,
      email: u5.email,
      candidateId: cp5.candidateId,
    };

    // 7. Seed Daily Reports
    // Report 1: Today for Recruiter 1
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const rep1 = await prisma.dailyReport.create({
      data: {
        recruiterProfileId: recruiter1.profileId,
        reportDate: today,
        callsMade: 40,
        shortlisted: 6,
        interviewsScheduled: 3,
        interviewsAttended: 2,
        offersExtended: 2,
        joinings: 1,
        status: "SUBMITTED",
        clientBreakdowns: {
          create: [
            {
              clientId: clientA.id,
              clientName: clientA.name,
              calls: 25,
              shortlisted: 4,
              lineUp: 2,
              offered: 1,
              joined: 1,
            },
            {
              clientId: clientB.id,
              clientName: clientB.name,
              calls: 15,
              shortlisted: 2,
              lineUp: 1,
              offered: 1,
              joined: 0,
            },
          ],
        },
      },
    });

    // Report 2: 5 days ago for Recruiter 1
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(12, 0, 0, 0);

    await prisma.dailyReport.create({
      data: {
        recruiterProfileId: recruiter1.profileId,
        reportDate: fiveDaysAgo,
        callsMade: 30,
        shortlisted: 4,
        interviewsScheduled: 2,
        interviewsAttended: 2,
        offersExtended: 1,
        joinings: 1,
        status: "APPROVED",
        clientBreakdowns: {
          create: [
            {
              clientId: clientA.id,
              clientName: clientA.name,
              calls: 30,
              shortlisted: 4,
              lineUp: 2,
              offered: 1,
              joined: 1,
            },
          ],
        },
      },
    });

    // Report 3: Draft report (should be excluded by default from operational aggregations)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    await prisma.dailyReport.create({
      data: {
        recruiterProfileId: recruiter2.profileId,
        reportDate: yesterday,
        callsMade: 50,
        shortlisted: 10,
        interviewsScheduled: 5,
        offersExtended: 3,
        joinings: 2,
        status: "DRAFT",
      },
    });

    // 8. Configure Org Monthly Joining Target
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const periodKey = `${year}-${month}`;

    await prisma.targetConfig.create({
      data: {
        recruiterProfileId: null, // Org-wide default
        periodType: "MONTHLY",
        periodKey,
        startDate: new Date(year, today.getMonth(), 1),
        endDate: new Date(year, today.getMonth() + 1, 0, 23, 59, 59, 999),
        orgMonthlyJoinsTarget: 10,
        configuredByAdminId: adminUser.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.dailyReportClientBreakdown.deleteMany({
      where: { dailyReport: { recruiterProfile: { candidateId: { startsWith: "P13-" } } } },
    });
    await prisma.dailyReport.deleteMany({
      where: { recruiterProfile: { candidateId: { startsWith: "P13-" } } },
    });
    await prisma.assessmentAttempt.deleteMany({
      where: { candidateProfile: { candidateId: { startsWith: "P13-" } } },
    });
    await prisma.certificate.deleteMany({
      where: { candidateProfile: { candidateId: { startsWith: "P13-" } } },
    });
    await prisma.targetConfig.deleteMany({
      where: { configuredByAdminId: adminUser?.id },
    });
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { startsWith: "P13-" } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "p13_" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: { in: ["P13-CLI-A", "P13-CLI-B"] } },
    });
  });

  describe("1. Admin Authorization Enforcement", () => {
    it("strictly rejects unauthenticated callers", async () => {
      const res = await getAdminDashboardMetrics();
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
    });

    it("strictly rejects candidates attempting to fetch admin dashboard metrics", async () => {
      const res = await getAdminDashboardMetrics({}, {
        id: recruiter1.id,
        email: recruiter1.email,
        role: "CANDIDATE",
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
    });

    it("strictly rejects managers attempting to access admin dashboard metrics", async () => {
      const res = await getAdminDashboardMetrics({}, {
        id: managerUser.id,
        email: managerUser.email,
        role: "MANAGER",
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
    });

    it("authorizes valid admin callers and returns complete metrics payload", async () => {
      const res = await getAdminDashboardMetrics({}, adminUser);
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data!.academy).toBeDefined();
      expect(res.data!.operations).toBeDefined();
      expect(res.data!.teams).toBeDefined();
      expect(res.data!.filterOptions).toBeDefined();
    });
  });

  describe("2. Academy Metrics Aggregation Accuracy", () => {
    it("correctly calculates all 8 Academy metrics from database records", async () => {
      const res = await getAdminDashboardMetrics({}, adminUser);
      expect(res.success).toBe(true);
      const { academy } = res.data!;

      // Total candidates: 5 candidates created in test
      expect(academy.totalCandidates).toBeGreaterThanOrEqual(5);

      // Active vs Inactive: 1 is INACTIVE (candidate5), others ACTIVE
      expect(academy.activeCandidates).toBeLessThan(academy.totalCandidates);

      // Academy Status counts:
      // In progress: candidate2, candidate5 (at least 2)
      expect(academy.academyInProgress).toBeGreaterThanOrEqual(2);
      // Completed: recruiter1, candidate3, candidate4 (at least 3)
      expect(academy.academyCompleted).toBeGreaterThanOrEqual(3);

      // Final Assessments passed: unique candidateProfileIds (recruiter1, candidate3 = at least 2)
      expect(academy.finalAssessmentsPassed).toBeGreaterThanOrEqual(2);

      // Certificate Statuses:
      // Pending: candidate3 (at least 1)
      expect(academy.certificatesPending).toBeGreaterThanOrEqual(1);
      // Approved: candidate4 (at least 1)
      expect(academy.certificatesApproved).toBeGreaterThanOrEqual(1);
      // Issued: recruiter1 (at least 1)
      expect(academy.certificatesIssued).toBeGreaterThanOrEqual(1);

      // Completion & Certification rates
      expect(academy.completionRatePct).toBeGreaterThan(0);
      expect(academy.certificationRatePct).toBeGreaterThan(0);
    });
  });

  describe("3. Operations Metrics Aggregation & Zero Double Counting", () => {
    it("accurately aggregates operations metrics without double-counting client breakdowns", async () => {
      const res = await getAdminDashboardMetrics({}, adminUser);
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      // Recruiters: recruiter1 is certified
      expect(operations.totalRecruiters).toBeGreaterThanOrEqual(1);

      // Managers: managerUser is MANAGER
      expect(operations.totalManagers).toBeGreaterThanOrEqual(1);

      // Clients: clientA (ACTIVE) and clientB (INACTIVE)
      expect(operations.totalClients).toBeGreaterThanOrEqual(2);
      expect(operations.activeClients).toBeGreaterThanOrEqual(1);

      // Operational activity across verified reports (Report 1: 40 calls, Report 2: 30 calls = 70 calls)
      // DRAFT Report 3 (50 calls) is strictly excluded by default!
      expect(operations.calls).toBe(70);
      // Shortlisted: 6 + 4 = 10
      expect(operations.shortlisted).toBe(10);
      // Line-ups: 3 + 2 = 5
      expect(operations.interviewLineups).toBe(5);
      // Offers: 2 + 1 = 3
      expect(operations.offers).toBe(3);
      // Joins: 1 + 1 = 2
      expect(operations.joins).toBe(2);
    });

    it("correctly isolates metrics strictly to a specific client when client filter is applied", async () => {
      // Filter by Client Alpha (Report 1 had 25 calls, Report 2 had 30 calls = 55 calls)
      const res = await getAdminDashboardMetrics({ clientId: clientA.id }, adminUser);
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      expect(operations.calls).toBe(55);
      expect(operations.shortlisted).toBe(8); // 4 + 4
      expect(operations.interviewLineups).toBe(4); // 2 + 2
      expect(operations.offers).toBe(2); // 1 + 1
      expect(operations.joins).toBe(2); // 1 + 1
    });

    it("correctly isolates metrics strictly to Client Beta", async () => {
      // Client Beta: Report 1 had 15 calls, 2 shortlisted, 1 lineup, 1 offer, 0 joins
      const res = await getAdminDashboardMetrics({ clientId: clientB.id }, adminUser);
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      expect(operations.calls).toBe(15);
      expect(operations.shortlisted).toBe(2);
      expect(operations.interviewLineups).toBe(1);
      expect(operations.offers).toBe(1);
      expect(operations.joins).toBe(0);
    });
  });

  describe("4. Multi-Dimensional Date Boundaries & Entity Filters", () => {
    it("filters operations metrics to 'today' boundary", async () => {
      const res = await getAdminDashboardMetrics({ dateRange: "today" }, adminUser);
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      // Only Report 1 was dated today (40 calls, 6 shortlisted, 1 join)
      expect(operations.calls).toBe(40);
      expect(operations.shortlisted).toBe(6);
      expect(operations.joins).toBe(1);
    });

    it("filters metrics by specific recruiter profile ID", async () => {
      const res = await getAdminDashboardMetrics(
        { recruiterProfileId: recruiter1.profileId },
        adminUser
      );
      expect(res.success).toBe(true);
      const { operations, academy } = res.data!;

      expect(operations.calls).toBe(70);
      expect(academy.totalCandidates).toBe(1);
      expect(academy.certificatesIssued).toBe(1);
    });

    it("filters metrics by manager / team", async () => {
      const res = await getAdminDashboardMetrics(
        { managerId: managerUser.id },
        adminUser
      );
      expect(res.success).toBe(true);
      const { operations, academy } = res.data!;

      // recruiter1 and candidate3 are under managerUser
      expect(academy.totalCandidates).toBe(2);
      expect(operations.calls).toBe(70);
    });

    it("filters reports by status (e.g. APPROVED only)", async () => {
      const res = await getAdminDashboardMetrics(
        { reportStatus: "APPROVED" },
        adminUser
      );
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      // Only Report 2 was APPROVED (30 calls, 4 shortlisted, 1 join)
      expect(operations.calls).toBe(30);
      expect(operations.shortlisted).toBe(4);
      expect(operations.joins).toBe(1);
    });
  });

  describe("5. Monthly Joining Target & Attainment Bands", () => {
    it("retrieves monthly joining target and computes accurate achievement band", async () => {
      const res = await getAdminDashboardMetrics({}, adminUser);
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      expect(operations.monthlyJoiningTarget).toBe(10);
      expect(operations.monthlyJoinsAchieved).toBe(2);
      expect(operations.monthlyJoinsRemaining).toBe(8);
      // 2 / 10 = 20%
      expect(operations.monthlyJoiningAchievementPct).toBe(20);
      // 0–25% = Critical
      expect(operations.monthlyJoiningBand.band).toBe("Critical");
    });
  });

  describe("6. Team Performance Grouping & Honest Empty States", () => {
    it("groups team performance by manager and unassigned cohort", async () => {
      const res = await getAdminDashboardMetrics({}, adminUser);
      expect(res.success).toBe(true);
      const { teams } = res.data!;

      const mgrTeam = teams.find((t) => t.managerId === managerUser.id);
      expect(mgrTeam).toBeDefined();
      expect(mgrTeam!.managerName).toBe(managerUser.name);
      expect(mgrTeam!.calls).toBe(70);
      expect(mgrTeam!.joins).toBe(2);
    });

    it("returns honest empty states with 0 values when filters match no data", async () => {
      // Non-existent client ID
      const res = await getAdminDashboardMetrics(
        { clientId: "non-existent-client-id" },
        adminUser
      );
      expect(res.success).toBe(true);
      const { operations } = res.data!;

      expect(operations.calls).toBe(0);
      expect(operations.shortlisted).toBe(0);
      expect(operations.interviewLineups).toBe(0);
      expect(operations.offers).toBe(0);
      expect(operations.joins).toBe(0);
    });
  });

  describe("7. Admin Login Redirect Verification", () => {
    it("verifies loginAdmin redirects directly to /admin/dashboard", async () => {
      const formData = new FormData();
      formData.set("email", adminUser.email);
      formData.set("password", PASSWORD);

      const res = await loginAdmin(formData);
      expect(res.success).toBe(true);
      expect(res.redirectTo).toBe("/admin/dashboard");
    });
  });
});
