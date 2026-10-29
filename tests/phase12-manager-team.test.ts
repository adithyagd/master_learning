// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { loginCandidate } from "@/actions/auth";
import {
  getManagerDashboard,
  getManagerTeam,
  getManagerReports,
  getManagerApprovalsQueue,
  reviewTeamReport,
  assignRecruiterToManager,
} from "@/actions/manager";
import { saveDailyReportDraft, submitDailyReportAction, reviewDailyReport } from "@/actions/report";
import { createClient } from "@/actions/client";

describe("Phase 12: Manager & Team Functionality, Team Isolation, and Approvals", () => {
  let adminUser: { id: string; email: string; role: string; name: string };
  let managerUser1: { id: string; email: string; role: string; name: string };
  let managerUser2: { id: string; email: string; role: string; name: string };
  let recruiterA: { id: string; profileId: string; email: string; isCertified: boolean; role: string };
  let recruiterB: { id: string; profileId: string; email: string; isCertified: boolean; role: string };

  const PASSWORD = "SecurePassword123!";

  beforeAll(async () => {
    // 1. Cleanup existing test data
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: { in: ["P12-REC-A", "P12-REC-B"] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p12_admin@e2epvtltd.com",
            "p12_mgr1@e2epvtltd.com",
            "p12_mgr2@e2epvtltd.com",
            "p12_rec_a@e2epvtltd.com",
            "p12_rec_b@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword(PASSWORD);

    // 2. Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p12_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P12 System Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN", name: "P12 System Admin" };

    // 3. Manager 1
    const mgr1 = await prisma.user.create({
      data: {
        email: "p12_mgr1@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Manager Alpha",
      },
    });
    managerUser1 = { id: mgr1.id, email: mgr1.email, role: "MANAGER", name: "Manager Alpha" };

    // 4. Manager 2
    const mgr2 = await prisma.user.create({
      data: {
        email: "p12_mgr2@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Manager Beta",
      },
    });
    managerUser2 = { id: mgr2.id, email: mgr2.email, role: "MANAGER", name: "Manager Beta" };

    // 5. Recruiter A (Assigned to Manager 1)
    const userA = await prisma.user.create({
      data: {
        email: "p12_rec_a@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const profA = await prisma.candidateProfile.create({
      data: {
        userId: userA.id,
        candidateId: "P12-REC-A",
        fullName: "Recruiter Alice",
        isCertified: true,
        certificateStatus: "ISSUED",
        academyStatus: "COMPLETED",
        joiningDate: new Date("2026-01-15"),
        managerId: mgr1.id, // Assigned to Manager 1
      },
    });
    recruiterA = {
      id: userA.id,
      profileId: profA.id,
      email: userA.email,
      isCertified: true,
      role: "CANDIDATE",
    };

    // 6. Recruiter B (Assigned to Manager 2)
    const userB = await prisma.user.create({
      data: {
        email: "p12_rec_b@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    const profB = await prisma.candidateProfile.create({
      data: {
        userId: userB.id,
        candidateId: "P12-REC-B",
        fullName: "Recruiter Bob",
        isCertified: true,
        certificateStatus: "ISSUED",
        academyStatus: "COMPLETED",
        joiningDate: new Date("2026-02-01"),
        managerId: mgr2.id, // Assigned to Manager 2
      },
    });
    recruiterB = {
      id: userB.id,
      profileId: profB.id,
      email: userB.email,
      isCertified: true,
      role: "CANDIDATE",
    };
  });

  afterAll(async () => {
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P12-REC-A", "P12-REC-B"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p12_admin@e2epvtltd.com",
            "p12_mgr1@e2epvtltd.com",
            "p12_mgr2@e2epvtltd.com",
            "p12_rec_a@e2epvtltd.com",
            "p12_rec_b@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. Protected Role Auth & Access Permissions
  // =========================================================================
  describe("1. Protected Role Authentication & Access Enforcement", () => {
    it("allows manager to log in via standard loginCandidate without public UI clutter, redirecting to /manager", async () => {
      const formData = new FormData();
      formData.set("identifier", "p12_mgr1@e2epvtltd.com");
      formData.set("password", PASSWORD);

      const res = await loginCandidate(formData);

      expect(res.success).toBe(true);
      expect(res.redirectTo).toBe("/manager");

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          userId: managerUser1.id,
          action: "MANAGER_LOGIN",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("strictly blocks candidates from accessing manager actions", async () => {
      const res = await getManagerDashboard({
        id: recruiterA.id,
        email: recruiterA.email,
        role: "CANDIDATE",
      });
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Manager access required/i);
    });

    it("does not grant managers unrestricted Admin permissions", async () => {
      // Manager attempting to create client (Admin-only action)
      const res = await createClient(
        { name: "Unauthorized Client", code: "P12-UNAUTH" },
        { id: managerUser1.id, email: managerUser1.email, role: "MANAGER" } as any
      );
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Administrator privileges required/i);
    });
  });

  // =========================================================================
  // 2. Strict Team Isolation
  // =========================================================================
  describe("2. Strict Team Isolation", () => {
    it("Manager 1 sees only Recruiter A in team roster (Recruiter B is hidden)", async () => {
      const team = await getManagerTeam(managerUser1);
      expect(team.length).toBe(1);
      expect(team[0].candidateId).toBe("P12-REC-A");
      expect(team[0].fullName).toBe("Recruiter Alice");

      const recBFound = team.find((m) => m.candidateId === "P12-REC-B");
      expect(recBFound).toBeUndefined();
    });

    it("Manager 2 sees only Recruiter B in team roster (Recruiter A is hidden)", async () => {
      const team = await getManagerTeam(managerUser2);
      expect(team.length).toBe(1);
      expect(team[0].candidateId).toBe("P12-REC-B");
      expect(team[0].fullName).toBe("Recruiter Bob");

      const recAFound = team.find((m) => m.candidateId === "P12-REC-A");
      expect(recAFound).toBeUndefined();
    });

    it("Manager 1 querying reports sees only Recruiter A's reports", async () => {
      // Create reports for both recruiters
      await prisma.dailyReport.create({
        data: {
          recruiterProfileId: recruiterA.profileId,
          reportDate: new Date("2026-10-14T00:00:00.000Z"),
          callsMade: 25,
          status: "SUBMITTED",
        },
      });

      await prisma.dailyReport.create({
        data: {
          recruiterProfileId: recruiterB.profileId,
          reportDate: new Date("2026-10-14T00:00:00.000Z"),
          callsMade: 35,
          status: "SUBMITTED",
        },
      });

      const mgr1Reports = await getManagerReports({}, managerUser1);
      expect(mgr1Reports.length).toBe(1);
      expect(mgr1Reports[0].recruiterProfile.candidateId).toBe("P12-REC-A");

      // Manager 1 explicitly filtering by Recruiter B returns empty (cross-team query rejected)
      const crossReports = await getManagerReports({ recruiterId: recruiterB.profileId }, managerUser1);
      expect(crossReports.length).toBe(0);
    });
  });

  // =========================================================================
  // 3. Unauthorized Cross-Team Review Prevention
  // =========================================================================
  describe("3. Cross-Team Review Prevention", () => {
    let reportBId: string;

    beforeAll(async () => {
      const rep = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: recruiterB.profileId },
      });
      reportBId = rep!.id;
    });

    it("strictly blocks Manager 1 from reviewing or approving Recruiter B's report", async () => {
      const res = await reviewTeamReport(
        {
          reportId: reportBId,
          action: "APPROVE",
        },
        managerUser1 // Manager 1 attempting to approve Manager 2's recruiter
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/recruiter is not assigned to your team/i);
    });
  });

  // =========================================================================
  // 4. Self-Approval Prevention
  // =========================================================================
  describe("4. Self-Approval Prevention", () => {
    let reportAId: string;

    beforeAll(async () => {
      const rep = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: recruiterA.profileId },
      });
      reportAId = rep!.id;
    });

    it("strictly prevents recruiter from approving their own report via reviewTeamReport", async () => {
      const res = await reviewTeamReport(
        {
          reportId: reportAId,
          action: "APPROVE",
        },
        { id: recruiterA.id, email: recruiterA.email, role: "CANDIDATE" }
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Manager or Admin access required/i);
    });

    it("strictly prevents recruiter from approving their own report via reviewDailyReport", async () => {
      const res = await reviewDailyReport(
        {
          reportId: reportAId,
          action: "APPROVE",
        },
        { id: recruiterA.id, email: recruiterA.email, role: "CANDIDATE" }
      );

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Recruiters are strictly prohibited from reviewing or approving/i);
    });
  });

  // =========================================================================
  // 5. Report Lifecycle: DRAFT → SUBMITTED → RETURNED → RESUBMITTED → APPROVED
  // =========================================================================
  describe("5. Complete Report Workflow & Revision History", () => {
    const DATE_WORKFLOW = "2026-10-18";
    let reportId: string;

    it("Step 1: Recruiter creates a DRAFT report", async () => {
      const draftRes = await saveDailyReportDraft(
        {
          reportDate: DATE_WORKFLOW,
          calls: 15,
          ownLeads: 3,
          internalLeads: 2,
          screened: 5,
          shortlisted: 2,
          interviewLineUp: 1,
          interviewAttended: 1,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 1,
          noResponse: 2,
          pendingFollowUps: 1,
          challenges: "JD calibration required for senior tier.",
          learnings: "Candidate salaries above budget.",
          planForTomorrow: "Target tier-2 companies.",
        },
        recruiterA
      );

      expect(draftRes.success).toBe(true);
      expect(draftRes.data?.status).toBe("DRAFT");
      reportId = draftRes.data!.reportId;
    });

    it("Step 2: Recruiter submits report → status becomes SUBMITTED", async () => {
      const submitRes = await submitDailyReportAction(
        {
          reportDate: DATE_WORKFLOW,
          calls: 30,
          ownLeads: 5,
          internalLeads: 5,
          screened: 10,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 1,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 3,
          pendingFollowUps: 2,
          challenges: "JD specific skills required niche experience.",
          learnings: "Telecom candidates showed high alignment.",
          planForTomorrow: "Follow up with shortlisted candidates.",
        },
        recruiterA
      );

      expect(submitRes.success).toBe(true);
      expect(submitRes.data?.status).toBe("SUBMITTED");
      expect(submitRes.data?.revisionNumber).toBe(1);

      const inDb = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(inDb?.status).toBe("SUBMITTED");
      expect(inDb?.submittedAt).toBeDefined();
    });

    it("Step 3: Manager 1 returns report for revision (validates mandatory comment)", async () => {
      // 1. Attempting return without comment fails
      const failRes = await reviewTeamReport(
        {
          reportId,
          action: "RETURN",
          managerNotes: " ",
        },
        managerUser1
      );
      expect(failRes.success).toBe(false);
      expect(failRes.message).toMatch(/Manager feedback comment is mandatory/i);

      // 2. Returning with comment succeeds
      const returnRes = await reviewTeamReport(
        {
          reportId,
          action: "RETURN",
          managerNotes: "Please clarify the 2 shortlisted profiles before formal client presentation.",
        },
        managerUser1
      );
      expect(returnRes.success).toBe(true);
      expect(returnRes.data?.status).toBe("RETURNED");

      const inDb = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(inDb?.status).toBe("RETURNED");
      expect(inDb?.managerNotes).toBe("Please clarify the 2 shortlisted profiles before formal client presentation.");
      expect(inDb?.reviewedAt).toBeDefined();

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetId: reportId,
          action: "REPORT_RETURNED",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("Step 4: Recruiter edits and resubmits report → status becomes SUBMITTED (Revision #3)", async () => {
      const resubmitRes = await submitDailyReportAction(
        {
          reportDate: DATE_WORKFLOW,
          calls: 32,
          ownLeads: 5,
          internalLeads: 5,
          screened: 10,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 1, // Candidate joined
          absconded: 0,
          rejected: 2,
          noResponse: 3,
          pendingFollowUps: 1,
          challenges: "JD specific skills required niche experience.",
          learnings: "Profiles clarified and verified with client HR.",
          planForTomorrow: "Line-up round 2 interviews.",
        },
        recruiterA
      );

      expect(resubmitRes.success).toBe(true);
      expect(resubmitRes.data?.status).toBe("SUBMITTED");

      const inDb = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(inDb?.status).toBe("SUBMITTED");
      expect(inDb?.joinings).toBe(1);
    });

    it("Step 5: Manager 1 approves report → status becomes APPROVED with approvedAt timestamp", async () => {
      const approveRes = await reviewTeamReport(
        {
          reportId,
          action: "APPROVE",
          managerNotes: "Excellent turnaround and clarification. Approved.",
        },
        managerUser1
      );

      expect(approveRes.success).toBe(true);
      expect(approveRes.data?.status).toBe("APPROVED");

      const inDb = await prisma.dailyReport.findUnique({ where: { id: reportId } });
      expect(inDb?.status).toBe("APPROVED");
      expect(inDb?.approvedAt).toBeDefined();
      expect(inDb?.reviewedAt).toBeDefined();
      expect(inDb?.reviewedByUserId).toBe(managerUser1.id);
      expect(inDb?.reviewedByName).toBe(managerUser1.name);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          targetId: reportId,
          action: "REPORT_APPROVED",
        },
      });
      expect(audit).not.toBeNull();

      // Verify revision history has all transitions recorded
      const revisions = await prisma.dailyReportRevision.findMany({
        where: { dailyReportId: reportId },
        orderBy: { revisionNumber: "asc" },
      });
      expect(revisions.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // 6. Manager Dashboard Aggregations (Zero Fake Numbers)
  // =========================================================================
  describe("6. Manager Dashboard Aggregations", () => {
    it("accurately computes team summary metrics strictly from database records", async () => {
      const dashRes = await getManagerDashboard(managerUser1);
      expect(dashRes.success).toBe(true);

      const d = dashRes.data!;
      expect(d.teamSummary.teamSize).toBe(1);
      expect(d.teamSummary.totalCalls).toBeGreaterThanOrEqual(32);
      expect(d.teamSummary.totalShortlisted).toBeGreaterThanOrEqual(4);
      expect(d.teamSummary.totalJoins).toBeGreaterThanOrEqual(1);

      // Recruiter rankings should feature Recruiter Alice
      expect(d.rankings.length).toBe(1);
      expect(d.rankings[0].fullName).toBe("Recruiter Alice");

      // Verify team summary calculation has genuine percentage and valid band
      expect(d.teamSummary.achievementPct).toBeGreaterThan(0);
      expect(["Critical", "Low", "Medium", "Good", "Great", "Outstanding"]).toContain(
        d.teamSummary.achievementBand
      );
    });

    it("assignRecruiterToManager successfully reassigns a recruiter and reflects in team queries", async () => {
      // Assign Recruiter B to Manager 1 as well
      const assignRes = await assignRecruiterToManager(
        managerUser1.id,
        recruiterB.profileId,
        adminUser
      );
      expect(assignRes.success).toBe(true);

      // Manager 1 now has 2 team members
      const team = await getManagerTeam(managerUser1);
      expect(team.length).toBe(2);
      expect(team.some((m) => m.candidateId === "P12-REC-B")).toBe(true);

      // Revert Recruiter B back to Manager 2 to keep test state clean
      await assignRecruiterToManager(
        managerUser2.id,
        recruiterB.profileId,
        adminUser
      );
      const teamAfterRevert = await getManagerTeam(managerUser1);
      expect(teamAfterRevert.length).toBe(1);
    });
  });
});
