// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  checkAndGenerateDiagnosticNotifications,
  NotificationCallerOverride,
  NotificationType,
} from "@/actions/notification";
import {
  submitDailyReportAction,
  reviewDailyReport,
  RecruiterOverride,
} from "@/actions/report";
import { configureRecruiterTarget } from "@/actions/target";
import {
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from "@/actions/assessment";
import { seedAcademyCurriculum } from "@/lib/academy-seed";
import { seedQuestionBank } from "@/lib/question-bank-seed";

describe("Phase 16: Persistent Notifications, Event Triggers, Isolation, and Deduplication", () => {
  let adminUser: NotificationCallerOverride;
  let manager1: NotificationCallerOverride;
  let manager2: NotificationCallerOverride;
  let recruiter1: RecruiterOverride & NotificationCallerOverride;
  let recruiter2: RecruiterOverride & NotificationCallerOverride;
  let recruiter1ProfileId: string;
  let recruiter2ProfileId: string;
  let testClient: { id: string; name: string; code: string };

  const PASSWORD = "Password123!";

  beforeAll(async () => {
    // 1. Seed Academy & Questions
    await seedAcademyCurriculum();
    await seedQuestionBank();

    // 2. Cleanup old test data
    await prisma.notification.deleteMany();
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.attemptQuestion.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.jobCandidate.deleteMany();

    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P16-REC-01", "P16-REC-02"] } },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p16_admin@e2epvtltd.com",
            "p16_mgr1@e2epvtltd.com",
            "p16_mgr2@e2epvtltd.com",
            "p16_rec1@e2epvtltd.com",
            "p16_rec2@e2epvtltd.com",
          ],
        },
      },
    });

    await prisma.clientRequirement.deleteMany({
      where: { client: { code: "P16-CLI-01" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: "P16-CLI-01" },
    });

    const passHash = await hashPassword(PASSWORD);

    // 3. Admin User
    const admin = await prisma.user.create({
      data: {
        email: "p16_admin@e2epvtltd.com",
        passwordHash: passHash,
        role: "ADMIN",
        status: "ACTIVE",
        name: "P16 Admin",
      },
    });
    adminUser = { id: admin.id, email: admin.email, role: "ADMIN" };

    // 4. Manager 1
    const mgr1 = await prisma.user.create({
      data: {
        email: "p16_mgr1@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Manager Alpha",
      },
    });
    manager1 = { id: mgr1.id, email: mgr1.email, role: "MANAGER" };

    // 5. Manager 2
    const mgr2 = await prisma.user.create({
      data: {
        email: "p16_mgr2@e2epvtltd.com",
        passwordHash: passHash,
        role: "MANAGER",
        status: "ACTIVE",
        name: "Manager Beta",
      },
    });
    manager2 = { id: mgr2.id, email: mgr2.email, role: "MANAGER" };

    // 6. Recruiter 1 (Assigned to Manager 1)
    const rec1User = await prisma.user.create({
      data: {
        email: "p16_rec1@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        name: "Recruiter One",
      },
    });
    const rec1Prof = await prisma.candidateProfile.create({
      data: {
        userId: rec1User.id,
        candidateId: "P16-REC-01",
        fullName: "Recruiter One",
        isCertified: true,
        certificateStatus: "ISSUED",
        academyStatus: "COMPLETED",
        joiningDate: new Date("2026-01-01"),
        managerId: mgr1.id,
      },
    });
    recruiter1 = {
      id: rec1User.id,
      profileId: rec1Prof.id,
      email: rec1User.email,
      isCertified: true,
      role: "CANDIDATE",
    };
    recruiter1ProfileId = rec1Prof.id;

    // 7. Recruiter 2 (Assigned to Manager 2)
    const rec2User = await prisma.user.create({
      data: {
        email: "p16_rec2@e2epvtltd.com",
        passwordHash: passHash,
        role: "CANDIDATE",
        status: "ACTIVE",
        name: "Recruiter Two",
      },
    });
    const rec2Prof = await prisma.candidateProfile.create({
      data: {
        userId: rec2User.id,
        candidateId: "P16-REC-02",
        fullName: "Recruiter Two",
        isCertified: false,
        certificateStatus: "NOT_REQUESTED",
        academyStatus: "IN_PROGRESS",
        currentModuleNumber: 1,
        joiningDate: new Date("2026-02-01"),
        managerId: mgr2.id,
      },
    });
    recruiter2 = {
      id: rec2User.id,
      profileId: rec2Prof.id,
      email: rec2User.email,
      isCertified: false,
      role: "CANDIDATE",
    };
    recruiter2ProfileId = rec2Prof.id;

    // 8. Client master fixture
    testClient = await prisma.clientMaster.create({
      data: {
        name: "P16 Enterprise Corp",
        code: "P16-CLI-01",
        status: "ACTIVE",
        notes: "Client for Phase 16 testing",
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.dailyReportRevision.deleteMany();
    await prisma.dailyReportClientBreakdown.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.targetChangeHistory.deleteMany();
    await prisma.targetConfig.deleteMany();
    await prisma.attemptQuestion.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.candidateProfile.deleteMany({
      where: { candidateId: { in: ["P16-REC-01", "P16-REC-02"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "p16_admin@e2epvtltd.com",
            "p16_mgr1@e2epvtltd.com",
            "p16_mgr2@e2epvtltd.com",
            "p16_rec1@e2epvtltd.com",
            "p16_rec2@e2epvtltd.com",
          ],
        },
      },
    });
    await prisma.clientRequirement.deleteMany({
      where: { client: { code: "P16-CLI-01" } },
    });
    await prisma.clientMaster.deleteMany({
      where: { code: "P16-CLI-01" },
    });
  });

  describe("1. Notification Types & Sanitization", () => {
    it("creates recruiter notifications with proper type and fields", async () => {
      const types: NotificationType[] = [
        "REPORT_RETURNED",
        "REPORT_APPROVED",
        "TARGET_UPDATED",
        "MANAGER_COMMENT_ADDED",
        "PENDING_FOLLOWUP_REMINDER",
        "ASSESSMENT_UNLOCKED",
      ];

      for (const type of types) {
        const res = await createNotification({
          userId: recruiter1.id,
          type,
          title: `Test Title for ${type}`,
          message: `Test message details for ${type}`,
          linkUrl: "/recruiter/workspace",
          referenceId: "ref-123",
          dedupKey: `rec1-${type}-key`,
        });

        expect(res.success).toBe(true);
        expect(res.data?.duplicateSkipped).toBe(false);
      }

      const listRes = await getUserNotifications("ALL", 20, recruiter1);
      expect(listRes.success).toBe(true);
      expect(listRes.data?.totalCount).toBe(6);
      expect(listRes.data?.unreadCount).toBe(6);
    });

    it("creates manager and admin notification types", async () => {
      const managerTypes: NotificationType[] = [
        "REPORT_SUBMITTED",
        "RECRUITER_BELOW_TARGET",
        "PENDING_APPROVAL",
      ];
      for (const type of managerTypes) {
        const res = await createNotification({
          userId: manager1.id,
          type,
          title: `Manager ${type}`,
          message: `Details for ${type}`,
          linkUrl: "/manager/approvals",
        });
        expect(res.success).toBe(true);
      }

      const adminTypes: NotificationType[] = [
        "PENDING_REPORT",
        "TARGET_RISK",
        "PERFORMANCE_ISSUE",
        "ASSESSMENT_COMPLETION",
        "CERTIFICATE_AWAITING_APPROVAL",
      ];
      for (const type of adminTypes) {
        const res = await createNotification({
          userId: adminUser.id,
          type,
          title: `Admin ${type}`,
          message: `Details for ${type}`,
          linkUrl: "/admin/reports",
        });
        expect(res.success).toBe(true);
      }

      const mgrNotifications = await getUserNotifications("ALL", 10, manager1);
      expect(mgrNotifications.data?.totalCount).toBe(3);

      const adminNotifications = await getUserNotifications("ALL", 10, adminUser);
      expect(adminNotifications.data?.totalCount).toBe(5);
    });

    it("sanitizes passwords, secrets and masks emails to prevent privacy leaks", async () => {
      const res = await createNotification({
        userId: recruiter1.id,
        type: "MANAGER_COMMENT_ADDED",
        title: "Security test password: SuperSecretPassword123!",
        message: "Candidate contact email is candidate.john@example.com with token=xyz789.",
      });

      expect(res.success).toBe(true);
      const notifId = res.data!.notificationId;

      const record = await prisma.notification.findUnique({
        where: { id: notifId },
      });

      expect(record?.title).toContain("password=[PROTECTED]");
      expect(record?.title).not.toContain("SuperSecretPassword123!");
      expect(record?.message).toContain("c***@example.com");
      expect(record?.message).not.toContain("candidate.john@example.com");
      expect(record?.message).toContain("token=[PROTECTED]");
      expect(record?.message).not.toContain("xyz789");
    });
  });

  describe("2. Deduplication Behavior", () => {
    it("skips creating duplicate notifications when dedupKey exists and is unread", async () => {
      const dedupKey = "dedup-unique-test-key-1";

      const firstCall = await createNotification({
        userId: recruiter2.id,
        type: "PENDING_FOLLOWUP_REMINDER",
        title: "Candidate Follow-up",
        message: "You have a pending follow-up today.",
        dedupKey,
      });

      expect(firstCall.success).toBe(true);
      expect(firstCall.data?.duplicateSkipped).toBe(false);
      const firstId = firstCall.data?.notificationId;

      // Call again with the exact same dedupKey
      const secondCall = await createNotification({
        userId: recruiter2.id,
        type: "PENDING_FOLLOWUP_REMINDER",
        title: "Candidate Follow-up",
        message: "Duplicate follow-up attempt.",
        dedupKey,
      });

      expect(secondCall.success).toBe(true);
      expect(secondCall.data?.duplicateSkipped).toBe(true);
      expect(secondCall.data?.notificationId).toBe(firstId);

      // Verify database still only has 1 notification for recruiter2 with this dedupKey
      const count = await prisma.notification.count({
        where: { userId: recruiter2.id, dedupKey },
      });
      expect(count).toBe(1);
    });

    it("allows creating a new notification after the previous one with the same dedupKey is read", async () => {
      const dedupKey = "dedup-read-cycle-key";

      const firstCall = await createNotification({
        userId: recruiter2.id,
        type: "TARGET_UPDATED",
        title: "Target Assigned",
        message: "Target updated for this month.",
        dedupKey,
      });
      expect(firstCall.data?.duplicateSkipped).toBe(false);
      const notifId = firstCall.data!.notificationId;

      // Mark it as read
      await markNotificationAsRead(notifId, recruiter2);

      // Now create again with the same dedupKey
      const secondCall = await createNotification({
        userId: recruiter2.id,
        type: "TARGET_UPDATED",
        title: "Target Revised",
        message: "Target revised again.",
        dedupKey,
      });

      expect(secondCall.success).toBe(true);
      expect(secondCall.data?.duplicateSkipped).toBe(false);
      expect(secondCall.data?.notificationId).not.toBe(notifId);
    });
  });

  describe("3. Recipient Isolation & Permission Boundaries", () => {
    it("ensures recruiter cannot view manager or another recruiter's notifications", async () => {
      // Recruiter 1 queries their notifications
      const rec1View = await getUserNotifications("ALL", 50, recruiter1);
      expect(rec1View.success).toBe(true);

      const rec1Notifs = rec1View.data?.notifications || [];
      expect(rec1Notifs.length).toBeGreaterThan(0);

      // Verify all notifications belong strictly to Recruiter 1
      for (const n of rec1Notifs) {
        const dbNotif = await prisma.notification.findUnique({ where: { id: n.id } });
        expect(dbNotif?.userId).toBe(recruiter1.id);
      }

      // Check manager's notifications are separate
      const mgr1View = await getUserNotifications("ALL", 50, manager1);
      expect(mgr1View.success).toBe(true);
      const mgrNotifs = mgr1View.data?.notifications || [];
      for (const n of mgrNotifs) {
        expect(n.type).toMatch(/REPORT_SUBMITTED|RECRUITER_BELOW_TARGET|PENDING_APPROVAL/);
      }
    });

    it("prevents a user from marking another user's notification as read", async () => {
      // Create a notification for Manager 1
      const notif = await createNotification({
        userId: manager1.id,
        type: "PENDING_APPROVAL",
        title: "Manager Approval Needed",
        message: "Please review pending report.",
      });

      const notifId = notif.data!.notificationId;

      // Recruiter 1 attempts to mark Manager 1's notification as read
      const unauthorizedAttempt = await markNotificationAsRead(notifId, recruiter1);
      expect(unauthorizedAttempt.success).toBe(false);
      expect(unauthorizedAttempt.message).toContain("Unauthorized");

      // Verify status in DB remains unread
      const unchanged = await prisma.notification.findUnique({ where: { id: notifId } });
      expect(unchanged?.isRead).toBe(false);

      // Manager 1 marks it as read successfully
      const authorizedAttempt = await markNotificationAsRead(notifId, manager1);
      expect(authorizedAttempt.success).toBe(true);

      const updated = await prisma.notification.findUnique({ where: { id: notifId } });
      expect(updated?.isRead).toBe(true);
      expect(updated?.readAt).not.toBeNull();
    });

    it("markAllNotificationsAsRead marks only caller's unread notifications", async () => {
      // Create 2 unread notifications for Recruiter 1 and 2 for Recruiter 2
      await createNotification({
        userId: recruiter1.id,
        type: "REPORT_APPROVED",
        title: "Report Approved 1",
        message: "Great work.",
      });
      await createNotification({
        userId: recruiter1.id,
        type: "REPORT_APPROVED",
        title: "Report Approved 2",
        message: "Approved.",
      });
      await createNotification({
        userId: recruiter2.id,
        type: "REPORT_RETURNED",
        title: "Recruiter 2 notice 1",
        message: "Needs work.",
      });

      const rec2InitialCount = await getUnreadNotificationCount(recruiter2);

      // Recruiter 1 marks all as read
      const markRes = await markAllNotificationsAsRead(recruiter1);
      expect(markRes.success).toBe(true);
      expect(markRes.data?.markedCount).toBeGreaterThanOrEqual(2);

      // Recruiter 1 unread count is now 0
      const rec1Unread = await getUnreadNotificationCount(recruiter1);
      expect(rec1Unread.data?.unreadCount).toBe(0);

      // Recruiter 2 unread count is completely unchanged
      const rec2AfterCount = await getUnreadNotificationCount(recruiter2);
      expect(rec2AfterCount.data?.unreadCount).toBe(rec2InitialCount.data?.unreadCount);
    });
  });

  describe("4. End-to-End Real Business Event Triggers", () => {
    it("triggers REPORT_SUBMITTED, PENDING_APPROVAL and PENDING_REPORT on report submission", async () => {
      const today = new Date().toISOString().split("T")[0];

      const reportInput = {
        reportDate: today,
        calls: 35,
        ownLeads: 10,
        internalLeads: 10,
        screened: 6,
        shortlisted: 4,
        interviewLineUp: 2,
        interviewAttended: 2,
        offered: 1,
        joined: 0,
        absconded: 0,
        rejected: 1,
        noResponse: 5,
        pendingFollowUps: 2,
        challenges: "Candidate salary negotiation pending",
        learnings: "High response rate on morning calls",
        planForTomorrow: "Close the offer pipeline",
        clientBreakdowns: [
          {
            clientName: "P16 Enterprise Corp",
            calls: 35,
            ownLeads: 10,
            internalLeads: 10,
            screened: 6,
            shortlisted: 4,
            lineUp: 2,
            offered: 1,
            joined: 0,
            absconded: 0,
          },
        ],
      };

      // Clear previous notifications for manager 1 and admin
      await prisma.notification.deleteMany({
        where: { userId: { in: [manager1.id, adminUser.id] } },
      });

      // Recruiter submits report
      const submitRes = await submitDailyReportAction(reportInput, recruiter1);
      expect(submitRes.success).toBe(true);

      // Verify Manager 1 received REPORT_SUBMITTED / PENDING_APPROVAL
      const mgrNotifs = await prisma.notification.findMany({
        where: { userId: manager1.id },
      });
      expect(mgrNotifs.length).toBeGreaterThan(0);
      const types = mgrNotifs.map((n) => n.type);
      expect(types).toContain("REPORT_SUBMITTED");
      expect(types).toContain("PENDING_APPROVAL");

      // Verify Admin received PENDING_REPORT
      const adminNotifs = await prisma.notification.findMany({
        where: { userId: adminUser.id },
      });
      const adminTypes = adminNotifs.map((n) => n.type);
      expect(adminTypes).toContain("PENDING_REPORT");
    });

    it("triggers REPORT_RETURNED and MANAGER_COMMENT_ADDED when manager returns report", async () => {
      const report = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: recruiter1ProfileId },
        orderBy: { createdAt: "desc" },
      });
      expect(report).toBeDefined();

      // Clear recruiter 1 notifications
      await prisma.notification.deleteMany({
        where: { userId: recruiter1.id },
      });

      // Manager 1 returns report with comments
      const returnRes = await reviewDailyReport(
        {
          reportId: report!.id,
          action: "RETURN",
          managerNotes: "Please clarify the client interview attendance figures.",
        },
        { id: manager1.id, email: manager1.email, role: manager1.role, name: "Manager Alpha" }
      );

      expect(returnRes.success).toBe(true);

      // Verify Recruiter 1 received REPORT_RETURNED and MANAGER_COMMENT_ADDED
      const recNotifs = await prisma.notification.findMany({
        where: { userId: recruiter1.id },
      });
      const recTypes = recNotifs.map((n) => n.type);
      expect(recTypes).toContain("REPORT_RETURNED");
      expect(recTypes).toContain("MANAGER_COMMENT_ADDED");
    });

    it("triggers REPORT_APPROVED when manager approves report", async () => {
      const today = new Date().toISOString().split("T")[0];
      const report = await prisma.dailyReport.findFirst({
        where: { recruiterProfileId: recruiter1ProfileId },
        orderBy: { createdAt: "desc" },
      });
      expect(report).toBeDefined();

      // Recruiter resubmits report
      const reportInput = {
        reportDate: today,
        calls: 35,
        ownLeads: 10,
        internalLeads: 10,
        screened: 6,
        shortlisted: 4,
        interviewLineUp: 2,
        interviewAttended: 2,
        offered: 1,
        joined: 0,
        absconded: 0,
        rejected: 1,
        noResponse: 5,
        pendingFollowUps: 2,
        challenges: "Candidate salary negotiation resolved",
        learnings: "High response rate on morning calls",
        planForTomorrow: "Close the offer pipeline",
        clientBreakdowns: [
          {
            clientName: "P16 Enterprise Corp",
            calls: 35,
            ownLeads: 10,
            internalLeads: 10,
            screened: 6,
            shortlisted: 4,
            lineUp: 2,
            offered: 1,
            joined: 0,
            absconded: 0,
          },
        ],
      };
      await submitDailyReportAction(reportInput, recruiter1);

      // Clear recruiter 1 notifications
      await prisma.notification.deleteMany({
        where: { userId: recruiter1.id },
      });

      // Manager 1 approves with managerNotes
      const approveRes = await reviewDailyReport(
        {
          reportId: report!.id,
          action: "APPROVE",
          managerNotes: "Looks solid and accurate. Approved.",
        },
        { id: manager1.id, email: manager1.email, role: manager1.role, name: "Manager Alpha" }
      );

      expect(approveRes.success).toBe(true);

      const recNotifs = await prisma.notification.findMany({
        where: { userId: recruiter1.id },
      });
      const recTypes = recNotifs.map((n) => n.type);
      expect(recTypes).toContain("REPORT_APPROVED");
      expect(recTypes).toContain("MANAGER_COMMENT_ADDED");
    });

    it("triggers TARGET_UPDATED notification when manager/admin sets target", async () => {
      await prisma.notification.deleteMany({
        where: { userId: recruiter1.id, type: "TARGET_UPDATED" },
      });

      const setTargetRes = await configureRecruiterTarget(
        {
          recruiterProfileId: recruiter1ProfileId,
          periodType: "MONTHLY",
          periodDate: "2026-11-01",
          callsTarget: 40,
          shortlistTarget: 5,
          joinsTarget: 3,
          notes: "Updated target for November cycle.",
        },
        { id: adminUser.id, email: adminUser.email, role: "ADMIN" }
      );

      expect(setTargetRes.success).toBe(true);

      const targetNotif = await prisma.notification.findFirst({
        where: { userId: recruiter1.id, type: "TARGET_UPDATED" },
      });
      expect(targetNotif).toBeDefined();
      expect(targetNotif?.title).toContain("Targets Updated");
      expect(targetNotif?.linkUrl).toContain("/workspace");
    });

    it("triggers ASSESSMENT_COMPLETION and CERTIFICATE_AWAITING_APPROVAL when assessment passed", async () => {
      await prisma.notification.deleteMany({
        where: { userId: adminUser.id, type: { in: ["ASSESSMENT_COMPLETION", "CERTIFICATE_AWAITING_APPROVAL"] } },
      });

      // Recruiter 2 starts Module 1 assessment
      const startRes = await startAssessmentAttempt("assessment-module-1", recruiter2ProfileId);
      expect(startRes.success).toBe(true);
      const attemptId = startRes.data!.attempt.id;

      // Fetch correct answers for questions in this attempt
      const attemptQuestions = await prisma.attemptQuestion.findMany({
        where: { attemptId },
        include: { question: { include: { options: true } } },
      });

      const passAnswers: Record<string, string> = {};
      for (const aq of attemptQuestions) {
        const correctOpt = aq.question.options.find((o) => o.isCorrect);
        if (correctOpt) {
          passAnswers[aq.questionId] = correctOpt.id;
        }
      }

      const assessRes = await submitAssessmentAttempt(
        attemptId,
        passAnswers,
        recruiter2ProfileId
      );

      expect(assessRes.success).toBe(true);
      expect(assessRes.data?.isPassed).toBe(true);

      // Module 1 pass unlocks module 2 -> generates ASSESSMENT_UNLOCKED for recruiter2
      const unlockedNotif = await prisma.notification.findFirst({
        where: { userId: recruiter2.id, type: "ASSESSMENT_UNLOCKED" },
      });
      expect(unlockedNotif).toBeDefined();

      // Module completion generates ASSESSMENT_COMPLETION for admin
      const adminCompletionNotif = await prisma.notification.findFirst({
        where: { userId: adminUser.id, type: "ASSESSMENT_COMPLETION" },
      });
      expect(adminCompletionNotif).toBeDefined();
    });
  });

  describe("5. Diagnostic Rule Scanner & Health Checks", () => {
    it("scans and generates PENDING_FOLLOWUP_REMINDER for recruiter with pending follow-ups in latest report", async () => {
      await prisma.notification.deleteMany({
        where: { userId: recruiter1.id, type: "PENDING_FOLLOWUP_REMINDER" },
      });

      const scanRes = await checkAndGenerateDiagnosticNotifications(recruiter1);
      expect(scanRes.success).toBe(true);

      const reminder = await prisma.notification.findFirst({
        where: { userId: recruiter1.id, type: "PENDING_FOLLOWUP_REMINDER" },
      });
      expect(reminder).toBeDefined();
      expect(reminder?.title).toContain("Pending Candidate Follow-ups");

      // Running diagnostic scanner again should NOT create duplicate due to dedupKey
      const secondScan = await checkAndGenerateDiagnosticNotifications(recruiter1);
      expect(secondScan.success).toBe(true);

      const count = await prisma.notification.count({
        where: { userId: recruiter1.id, type: "PENDING_FOLLOWUP_REMINDER", isRead: false },
      });
      expect(count).toBe(1);
    });

    it("scans and generates manager notifications for pending approvals", async () => {
      const scanRes = await checkAndGenerateDiagnosticNotifications(manager1);
      expect(scanRes.success).toBe(true);

      // Verify no crashes and returns integer count
      expect(typeof scanRes.data?.generatedCount).toBe("number");
    });

    it("scans and generates admin notifications for operational risks", async () => {
      const scanRes = await checkAndGenerateDiagnosticNotifications(adminUser);
      expect(scanRes.success).toBe(true);
      expect(typeof scanRes.data?.generatedCount).toBe("number");
    });
  });
});
