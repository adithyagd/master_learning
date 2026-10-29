// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  saveDailyReportDraft,
  submitDailyReportAction,
  getDailyReportForDate,
  getRecruiterReportsHistory,
  reviewDailyReport,
} from "@/actions/report";

describe("Phase 10: Persistent Daily Recruitment Report (/workspace/report)", () => {
  let adminUser: { id: string; email: string; role: string; name: string };
  let managerUser: { id: string; email: string; role: string; name: string };
  let certifiedRecruiterA: { id: string; profileId: string; email: string; isCertified: boolean; role: string };
  let certifiedRecruiterB: { id: string; profileId: string; email: string; isCertified: boolean; role: string };
  let uncertifiedRecruiter: { id: string; profileId: string; email: string; isCertified: boolean; role: string };

  const DATE_1 = "2026-10-15";
  const DATE_2 = "2026-10-16";

  beforeAll(async () => {
    // 1. Clean up existing test records
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: {
        candidateId: {
          in: ["P10-ADMIN", "P10-REC-A", "P10-REC-B", "P10-UNCERT"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p10_admin@e2epvtltd.com",
            "p10_mgr@e2epvtltd.com",
            "p10_rec_a@e2epvtltd.com",
            "p10_rec_b@e2epvtltd.com",
            "p10_uncert@e2epvtltd.com",
          ],
        },
      },
    });

    const passHash = await hashPassword("SecurePass123!");

    // 2. Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p10_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN", name: "E2E Lead Admin" };

    // 3. Manager User
    const mgr = await prisma.user.create({
      data: {
        email: "p10_mgr@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
      },
    });
    managerUser = { id: mgr.id, email: mgr.email, role: "MANAGER", name: "Recruitment Manager" };

    // 4. Certified Recruiter A
    const aUser = await prisma.user.create({
      data: {
        email: "p10_rec_a@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P10-REC-A",
            fullName: "P10 Certified Recruiter A",
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

    // 5. Certified Recruiter B
    const bUser = await prisma.user.create({
      data: {
        email: "p10_rec_b@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P10-REC-B",
            fullName: "P10 Certified Recruiter B",
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

    // 6. Uncertified Recruiter
    const uUser = await prisma.user.create({
      data: {
        email: "p10_uncert@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        candidateProfile: {
          create: {
            candidateId: "P10-UNCERT",
            fullName: "P10 Uncertified Trainee",
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
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P10-ADMIN", "P10-REC-A", "P10-REC-B", "P10-UNCERT"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p10_admin@e2epvtltd.com",
            "p10_mgr@e2epvtltd.com",
            "p10_rec_a@e2epvtltd.com",
            "p10_rec_b@e2epvtltd.com",
            "p10_uncert@e2epvtltd.com",
          ],
        },
      },
    });
  });

  // =========================================================================
  // 1. DRAFT SAVING & RESUMING
  // =========================================================================
  describe("1. Draft Saving and Resuming", () => {
    it("saves a report draft with partial data and allows resuming without validation errors", async () => {
      const draftRes = await saveDailyReportDraft(
        {
          reportDate: DATE_1,
          calls: 15,
          ownLeads: 4,
          internalLeads: 3,
          screened: 6,
          shortlisted: 2,
          interviewLineUp: 1,
          interviewAttended: 1,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 1,
          noResponse: 3,
          pendingFollowUps: 2,
          challenges: "Candidate salary negotiation pending",
          // Note: learnings, tomorrow plan omitted in draft — draft allows partial entry!
        },
        certifiedRecruiterA
      );

      expect(draftRes.success).toBe(true);
      expect(draftRes.data?.status).toBe("DRAFT");
      expect(draftRes.data?.reportId).toBeDefined();

      // Retrieve report for DATE_1
      const retrieved = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(retrieved?.report).not.toBeNull();
      expect(retrieved?.report?.status).toBe("DRAFT");
      expect(retrieved?.report?.callsMade).toBe(15);
      expect(retrieved?.report?.ownLeads).toBe(4);
      expect(retrieved?.report?.challenges).toBe("Candidate salary negotiation pending");
      expect(retrieved?.report?.learnings).toBeNull();
    });

    it("updates existing draft on repeated saveDraft calls without duplicating", async () => {
      const updateDraftRes = await saveDailyReportDraft(
        {
          reportDate: DATE_1,
          calls: 25, // Updated from 15 to 25
          ownLeads: 6,
          internalLeads: 5,
          screened: 10,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 5,
          pendingFollowUps: 3,
          challenges: "Updated challenges note",
          learnings: "Cold calls before 11 AM yield better pickup",
        },
        certifiedRecruiterA
      );

      expect(updateDraftRes.success).toBe(true);

      const retrieved = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(retrieved?.report?.callsMade).toBe(25);
      expect(retrieved?.report?.shortlisted).toBe(4);
      expect(retrieved?.report?.learnings).toBe("Cold calls before 11 AM yield better pickup");

      // Verify exactly 1 report exists for DATE_1
      const count = await prisma.dailyReport.count({
        where: { recruiterProfileId: certifiedRecruiterA.profileId },
      });
      expect(count).toBe(1);
    });
  });

  // =========================================================================
  // 2. FIELD VALIDATIONS ON SUBMISSION
  // =========================================================================
  describe("2. Field Validations on Submission", () => {
    it("rejects submission if metric values are negative", async () => {
      const res = await submitDailyReportAction(
        {
          reportDate: DATE_1,
          calls: -5, // Invalid negative number
          ownLeads: 2,
          internalLeads: 2,
          screened: 4,
          shortlisted: 1,
          interviewLineUp: 1,
          interviewAttended: 1,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 0,
          noResponse: 0,
          pendingFollowUps: 0,
          challenges: "Valid challenge",
          learnings: "Valid learning",
          planForTomorrow: "Valid plan",
        },
        certifiedRecruiterA
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("cannot be negative");
    });

    it("rejects submission if mandatory qualitative reflections are missing", async () => {
      const res = await submitDailyReportAction(
        {
          reportDate: DATE_1,
          calls: 25,
          ownLeads: 5,
          internalLeads: 5,
          screened: 8,
          shortlisted: 3,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 1,
          noResponse: 2,
          pendingFollowUps: 2,
          challenges: "", // Missing mandatory reflection
          learnings: "Some learning",
          planForTomorrow: "Some plan",
        },
        certifiedRecruiterA
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("Challenges reflection is mandatory");
    });
  });

  // =========================================================================
  // 3. 10-COLUMN CLIENT-WISE TABLE & TOTALS
  // =========================================================================
  describe("3. Client-Wise Table Breakdown & Totals", () => {
    it("persists client-wise table breakdown across multiple enterprise accounts", async () => {
      const clientBreakdowns = [
        {
          clientName: "Bosch India Ltd",
          calls: 15,
          ownLeads: 3,
          internalLeads: 2,
          screened: 5,
          shortlisted: 2,
          lineUp: 1,
          offered: 1,
          joined: 0,
          absconded: 0,
        },
        {
          clientName: "Tata Motors Manufacturing",
          calls: 10,
          ownLeads: 2,
          internalLeads: 3,
          screened: 4,
          shortlisted: 2,
          lineUp: 1,
          offered: 0,
          joined: 0,
          absconded: 0,
        },
      ];

      const submitRes = await submitDailyReportAction(
        {
          reportDate: DATE_1,
          calls: 25,
          ownLeads: 5,
          internalLeads: 5,
          screened: 9,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 3,
          pendingFollowUps: 2,
          challenges: "Candidate salary expectations 25% higher than Bosch budget",
          learnings: "Candidates prefer direct factory bus commute options",
          pendingFollowUpsDesc: "Two candidates waiting for offer release",
          planForTomorrow: "Target ITI tool and die graduates in Peenya cluster",
          clientBreakdowns,
        },
        certifiedRecruiterA
      );

      expect(submitRes.success).toBe(true);
      expect(submitRes.data?.status).toBe("SUBMITTED");

      // Verify client breakdowns stored in database
      const reportData = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(reportData?.report?.clientBreakdowns?.length).toBe(2);

      const bosch = reportData?.report?.clientBreakdowns?.find((c) => c.clientName === "Bosch India Ltd");
      expect(bosch?.calls).toBe(15);
      expect(bosch?.offered).toBe(1);

      const tata = reportData?.report?.clientBreakdowns?.find((c) => c.clientName === "Tata Motors Manufacturing");
      expect(tata?.calls).toBe(10);
      expect(tata?.screened).toBe(4);

      // Verify client-wise totals sum up
      const totalClientCalls = reportData?.report?.clientBreakdowns?.reduce((sum, c) => sum + c.calls, 0);
      expect(totalClientCalls).toBe(25);
    });
  });

  // =========================================================================
  // 4. DUPLICATE REPORT PREVENTION
  // =========================================================================
  describe("4. Duplicate Report Prevention", () => {
    it("strictly prevents creating or submitting duplicate reports for the same date while pending review", async () => {
      // Recruiter A attempts to submit another report for DATE_1 while first is SUBMITTED
      const dupRes = await submitDailyReportAction(
        {
          reportDate: DATE_1,
          calls: 30,
          ownLeads: 5,
          internalLeads: 5,
          screened: 10,
          shortlisted: 5,
          interviewLineUp: 3,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 1,
          noResponse: 2,
          pendingFollowUps: 1,
          challenges: "Duplicate attempt",
          learnings: "Duplicate attempt",
          planForTomorrow: "Duplicate attempt",
        },
        certifiedRecruiterA
      );

      expect(dupRes.success).toBe(false);
      expect(dupRes.message).toContain("already submitted");

      // Draft save is also blocked over submitted report
      const draftRes = await saveDailyReportDraft(
        {
          reportDate: DATE_1,
          calls: 10,
          ownLeads: 0,
          internalLeads: 0,
          screened: 0,
          shortlisted: 0,
          interviewLineUp: 0,
          interviewAttended: 0,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 0,
          noResponse: 0,
          pendingFollowUps: 0,
        },
        certifiedRecruiterA
      );
      expect(draftRes.success).toBe(false);
      expect(draftRes.message).toContain("already submitted");
    });
  });

  // =========================================================================
  // 5. MANAGER REVIEW WORKFLOW & SELF-APPROVAL RESTRICTION
  // =========================================================================
  describe("5. Manager Review Workflow & Self-Approval Prevention", () => {
    it("strictly blocks recruiters from approving or reviewing their own reports", async () => {
      const reportData = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      const reportId = reportData!.report!.id;

      // Recruiter A attempts to approve their own report
      const selfApproveRes = await reviewDailyReport(
        {
          reportId,
          action: "APPROVE",
        },
        certifiedRecruiterA as any
      );

      expect(selfApproveRes.success).toBe(false);
      expect(selfApproveRes.message).toContain("prohibited from reviewing or approving");
    });

    it("allows recruitment manager to return report with feedback notes requesting revision", async () => {
      const reportData = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      const reportId = reportData!.report!.id;

      const returnRes = await reviewDailyReport(
        {
          reportId,
          action: "RETURN",
          managerNotes: "Please clarify why offered candidate notice period was not documented.",
        },
        managerUser
      );

      expect(returnRes.success).toBe(true);
      expect(returnRes.data?.status).toBe("RETURNED");

      // Verify report reflects RETURNED status and manager notes
      const returnedReport = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(returnedReport?.report?.status).toBe("RETURNED");
      expect(returnedReport?.report?.managerNotes).toBe(
        "Please clarify why offered candidate notice period was not documented."
      );
      expect(returnedReport?.report?.reviewedByName).toBe(managerUser.name);
    });

    it("allows recruiter to resubmit returned report and captures revision history", async () => {
      // Recruiter A updates reflections addressing manager feedback and resubmits
      const resubmitRes = await submitDailyReportAction(
        {
          reportDate: DATE_1,
          calls: 28, // Updated calls
          ownLeads: 6,
          internalLeads: 5,
          screened: 10,
          shortlisted: 4,
          interviewLineUp: 2,
          interviewAttended: 2,
          offered: 1,
          joined: 0,
          absconded: 0,
          rejected: 2,
          noResponse: 3,
          pendingFollowUps: 2,
          challenges: "Candidate salary expectations 25% higher than Bosch budget",
          learnings: "Candidates prefer direct factory bus commute options",
          pendingFollowUpsDesc: "Two candidates waiting for offer release. Candidate Ramesh agreed to 15-day notice period buyout.",
          planForTomorrow: "Target ITI tool and die graduates in Peenya cluster",
          clientBreakdowns: [
            {
              clientName: "Bosch India Ltd",
              calls: 18,
              ownLeads: 4,
              internalLeads: 2,
              screened: 6,
              shortlisted: 2,
              lineUp: 1,
              offered: 1,
              joined: 0,
              absconded: 0,
            },
          ],
        },
        certifiedRecruiterA
      );

      expect(resubmitRes.success).toBe(true);
      expect(resubmitRes.data?.status).toBe("SUBMITTED");
      expect(resubmitRes.data?.revisionNumber).toBe(2);

      // Verify revision snapshot in database
      const reportWithRevisions = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(reportWithRevisions?.report?.revisions?.length).toBe(2);
      expect(reportWithRevisions?.report?.revisions[0].revisionNumber).toBe(2);
    });

    it("allows manager to formally approve the resubmitted report and permanently locks it", async () => {
      const reportData = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      const reportId = reportData!.report!.id;

      const approveRes = await reviewDailyReport(
        {
          reportId,
          action: "APPROVE",
          managerNotes: "Approved. Excellent follow-up on notice period buyout.",
        },
        managerUser
      );

      expect(approveRes.success).toBe(true);
      expect(approveRes.data?.status).toBe("APPROVED");

      const finalReport = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      expect(finalReport?.report?.status).toBe("APPROVED");

      // Verify report cannot be modified once approved
      const editApprovedRes = await saveDailyReportDraft(
        {
          reportDate: DATE_1,
          calls: 30,
          ownLeads: 0,
          internalLeads: 0,
          screened: 0,
          shortlisted: 0,
          interviewLineUp: 0,
          interviewAttended: 0,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 0,
          noResponse: 0,
          pendingFollowUps: 0,
        },
        certifiedRecruiterA
      );
      expect(editApprovedRes.success).toBe(false);
      expect(editApprovedRes.message).toContain("Approved reports cannot be modified");
    });
  });

  // =========================================================================
  // 6. DATE HANDLING & MULTI-DAY ISOLATION
  // =========================================================================
  describe("6. Date Handling, Multi-Day Isolation & History", () => {
    it("keeps report data isolated between distinct calendar dates", async () => {
      // Date 2: Recruiter A submits report for Date 2
      await submitDailyReportAction(
        {
          reportDate: DATE_2,
          calls: 35,
          ownLeads: 7,
          internalLeads: 6,
          screened: 12,
          shortlisted: 5,
          interviewLineUp: 3,
          interviewAttended: 3,
          offered: 2,
          joined: 1,
          absconded: 0,
          rejected: 1,
          noResponse: 4,
          pendingFollowUps: 1,
          challenges: "Rain delayed afternoon interview arrivals",
          learnings: "WhatsApp reminder 1 hour prior reduced no-shows to 0",
          planForTomorrow: "Follow up on Tata Motors joining clearances",
        },
        certifiedRecruiterA
      );

      // Verify Date 1 and Date 2 reports remain distinct
      const rep1 = await getDailyReportForDate(DATE_1, certifiedRecruiterA);
      const rep2 = await getDailyReportForDate(DATE_2, certifiedRecruiterA);

      expect(rep1?.report?.callsMade).toBe(28);
      expect(rep1?.report?.status).toBe("APPROVED");

      expect(rep2?.report?.callsMade).toBe(35);
      expect(rep2?.report?.status).toBe("SUBMITTED");
      expect(rep2?.report?.joinings).toBe(1);
    });

    it("retrieves complete recruiter report history in chronological order", async () => {
      const history = await getRecruiterReportsHistory(certifiedRecruiterA);
      expect(history.length).toBe(2);
      const toLocalDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // Most recent date first
      expect(toLocalDate(new Date(history[0].reportDate))).toBe(DATE_2);
      expect(toLocalDate(new Date(history[1].reportDate))).toBe(DATE_1);
    });

    it("strictly blocks uncertified candidates from accessing daily report operations", async () => {
      const uncertRes = await saveDailyReportDraft(
        {
          reportDate: DATE_1,
          calls: 10,
          ownLeads: 0,
          internalLeads: 0,
          screened: 0,
          shortlisted: 0,
          interviewLineUp: 0,
          interviewAttended: 0,
          offered: 0,
          joined: 0,
          absconded: 0,
          rejected: 0,
          noResponse: 0,
          pendingFollowUps: 0,
        },
        uncertifiedRecruiter
      );

      expect(uncertRes.success).toBe(false);
      expect(uncertRes.message).toContain("Certified Recruiter access required");
    });
  });
});
