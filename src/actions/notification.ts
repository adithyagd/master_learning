"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback during tests
  }
}

export type NotificationType =
  // Recruiter notifications
  | "REPORT_RETURNED"
  | "REPORT_APPROVED"
  | "TARGET_UPDATED"
  | "MANAGER_COMMENT_ADDED"
  | "PENDING_FOLLOWUP_REMINDER"
  | "ASSESSMENT_UNLOCKED"
  // Manager notifications
  | "REPORT_SUBMITTED"
  | "RECRUITER_BELOW_TARGET"
  | "PENDING_APPROVAL"
  // Admin notifications
  | "PENDING_REPORT"
  | "TARGET_RISK"
  | "PERFORMANCE_ISSUE"
  | "ASSESSMENT_COMPLETION"
  | "CERTIFICATE_AWAITING_APPROVAL";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  referenceId?: string;
  dedupKey?: string;
}

export interface NotificationCallerOverride {
  id: string;
  email: string;
  role: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Resolves authenticated caller or fallback override.
 */
async function authenticateCaller(override?: NotificationCallerOverride) {
  if (override) return override;
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

/**
 * Sanitizes notification title and message to prevent leaking private secrets,
 * passwords, authentication tokens, or internal credentials.
 */
function sanitizeNotificationContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/(password|passwordHash|token|authKey)\s*[:=]\s*\S+/gi, "$1=[PROTECTED]")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (match) => {
      // Keep domain visible for clarity e.g. a***@company.com
      const [local, domain] = match.split("@");
      return `${local.slice(0, 1)}***@${domain}`;
    })
    .trim();
}

/**
 * Creates a notification with duplicate prevention and content sanitization.
 */
export async function createNotification(
  input: CreateNotificationInput,
  callerOverride?: NotificationCallerOverride
): Promise<ActionResponse<{ notificationId: string; duplicateSkipped?: boolean }>> {
  try {
    const { userId, type, title, message, linkUrl, referenceId, dedupKey } = input;

    if (!userId || !title || !message) {
      return { success: false, message: "Missing required notification fields." };
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!recipient || recipient.status === "INACTIVE" || recipient.status === "SUSPENDED") {
      return { success: false, message: "Recipient user not found or inactive." };
    }

    // Duplicate Prevention:
    // If a dedupKey is provided, check if an unread notification or identical recent notification exists
    if (dedupKey) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          dedupKey,
          isRead: false,
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Duplicate unread notification exists; skipped.",
          data: { notificationId: existing.id, duplicateSkipped: true },
        };
      }
    }

    const safeTitle = sanitizeNotificationContent(title);
    const safeMessage = sanitizeNotificationContent(message);

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title: safeTitle,
        message: safeMessage,
        linkUrl: linkUrl || null,
        referenceId: referenceId || null,
        dedupKey: dedupKey || null,
        isRead: false,
      },
    });

    return {
      success: true,
      message: "Notification created successfully.",
      data: { notificationId: notification.id, duplicateSkipped: false },
    };
  } catch (error) {
    console.error("createNotification error:", error);
    return { success: false, message: "Failed to create notification." };
  }
}

/**
 * Retrieves notifications for the currently authenticated user.
 * Enforces strict recipient isolation: users can ONLY query their own notifications.
 */
export async function getUserNotifications(
  filter: "ALL" | "UNREAD" = "ALL",
  limit: number = 30,
  callerOverride?: NotificationCallerOverride
): Promise<
  ActionResponse<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      linkUrl: string | null;
      referenceId: string | null;
      isRead: boolean;
      readAt: Date | null;
      createdAt: Date;
    }>;
    unreadCount: number;
    totalCount: number;
  }>
> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const where = {
      userId: caller.id,
      ...(filter === "UNREAD" ? { isRead: false } : {}),
    };

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          linkUrl: true,
          referenceId: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId: caller.id, isRead: false },
      }),
      prisma.notification.count({
        where: { userId: caller.id },
      }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
        totalCount,
      },
    };
  } catch (error) {
    console.error("getUserNotifications error:", error);
    return { success: false, message: "Failed to fetch notifications." };
  }
}

/**
 * Marks a specific notification as read.
 * Enforces recipient ownership: caller can only mark their own notification.
 */
export async function markNotificationAsRead(
  notificationId: string,
  callerOverride?: NotificationCallerOverride
): Promise<ActionResponse<{ notificationId: string; isRead: boolean }>> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, message: "Notification not found." };
    }

    // Ownership check: strictly block modifying other users' notifications
    if (notification.userId !== caller.id) {
      return { success: false, message: "Unauthorized. You cannot modify another user's notifications." };
    }

    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return {
      success: true,
      message: "Notification marked as read.",
      data: { notificationId, isRead: true },
    };
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    return { success: false, message: "Failed to mark notification as read." };
  }
}

/**
 * Marks all unread notifications for the caller as read.
 */
export async function markAllNotificationsAsRead(
  callerOverride?: NotificationCallerOverride
): Promise<ActionResponse<{ markedCount: number }>> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: caller.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: "All notifications marked as read.",
      data: { markedCount: result.count },
    };
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    return { success: false, message: "Failed to mark all notifications as read." };
  }
}

/**
 * Gets the fast unread badge count for the caller.
 */
export async function getUnreadNotificationCount(
  callerOverride?: NotificationCallerOverride
): Promise<ActionResponse<{ unreadCount: number }>> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized." };
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: caller.id,
        isRead: false,
      },
    });

    return {
      success: true,
      data: { unreadCount },
    };
  } catch (error) {
    console.error("getUnreadNotificationCount error:", error);
    return { success: false, message: "Failed to get unread count." };
  }
}

/**
 * Automated Rule & Diagnostic Scanner:
 * Scans business events and system rules for the caller's authorized scope and
 * generates deduplicated actionable notifications.
 */
export async function checkAndGenerateDiagnosticNotifications(
  callerOverride?: NotificationCallerOverride
): Promise<ActionResponse<{ generatedCount: number }>> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized." };
    }

    let generatedCount = 0;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // ==========================================
    // 1. RECRUITER DIAGNOSTICS & REMINDERS
    // ==========================================
    if (caller.role === "CANDIDATE") {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: caller.id },
      });

      if (profile && profile.isCertified) {
        // Rule: Pending Follow-up reminder if recruiter has unresolved follow-ups in recent report
        const latestReport = await prisma.dailyReport.findFirst({
          where: { recruiterProfileId: profile.id },
          orderBy: { reportDate: "desc" },
        });

        if (latestReport && latestReport.pendingFollowUps > 0) {
          const res = await createNotification({
            userId: caller.id,
            type: "PENDING_FOLLOWUP_REMINDER",
            title: "Pending Candidate Follow-ups",
            message: `You have ${latestReport.pendingFollowUps} candidate follow-up(s) awaiting contact. Review your pipeline today.`,
            linkUrl: "/workspace/pipeline",
            referenceId: latestReport.id,
            dedupKey: `FOLLOWUP:${profile.id}:${todayStr}`,
          });
          if (res.success && !res.data?.duplicateSkipped) generatedCount++;
        }
      }
    }

    // ==========================================
    // 2. MANAGER DIAGNOSTICS & SUPERVISORY ALERTS
    // ==========================================
    if (caller.role === "MANAGER") {
      // Find assigned team recruiters
      const teamRecruiters = await prisma.candidateProfile.findMany({
        where: { managerId: caller.id, isCertified: true },
        include: {
          user: true,
          dailyReports: {
            where: {
              reportDate: {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
              },
              status: { not: "DRAFT" },
            },
          },
        },
      });

      for (const rec of teamRecruiters) {
        // Rule: Pending reports awaiting review in manager's team
        const pendingReports = await prisma.dailyReport.findMany({
          where: {
            recruiterProfileId: rec.id,
            status: "SUBMITTED",
          },
        });

        for (const rep of pendingReports) {
          const res = await createNotification({
            userId: caller.id,
            type: "PENDING_APPROVAL",
            title: "Daily Report Pending Review",
            message: `${rec.fullName} has submitted a daily operations report awaiting your review.`,
            linkUrl: "/manager/approvals",
            referenceId: rep.id,
            dedupKey: `PENDING_APPROVAL:${caller.id}:${rep.id}`,
          });
          if (res.success && !res.data?.duplicateSkipped) generatedCount++;
        }

        // Rule: Recruiter below target (if passed 10th of month and 0 joins)
        const totalJoins = rec.dailyReports.reduce((s, r) => s + r.joinings, 0);
        if (now.getDate() >= 10 && totalJoins === 0) {
          const res = await createNotification({
            userId: caller.id,
            type: "RECRUITER_BELOW_TARGET",
            title: "Recruiter Below Target Pacing",
            message: `${rec.fullName} has 0 placements recorded this month against monthly target pacing.`,
            linkUrl: "/manager/targets",
            referenceId: rec.id,
            dedupKey: `BELOW_TARGET:${rec.id}:${monthKey}`,
          });
          if (res.success && !res.data?.duplicateSkipped) generatedCount++;
        }
      }
    }

    // ==========================================
    // 3. ADMIN DIAGNOSTICS & SYSTEM MONITORING
    // ==========================================
    if (caller.role === "ADMIN") {
      // Rule 1: Pending reports awaiting review in organization
      const submittedReportsCount = await prisma.dailyReport.count({
        where: { status: "SUBMITTED" },
      });

      if (submittedReportsCount > 0) {
        const res = await createNotification({
          userId: caller.id,
          type: "PENDING_REPORT",
          title: "Reports Awaiting Manager Review",
          message: `${submittedReportsCount} operational daily report(s) are currently in submitted queue awaiting manager review.`,
          linkUrl: "/admin/reports",
          dedupKey: `ADMIN_PENDING_REPORTS:${todayStr}`,
        });
        if (res.success && !res.data?.duplicateSkipped) generatedCount++;
      }

      // Rule 2: Certificates awaiting admin approval
      const pendingCertsCount = await prisma.candidateProfile.count({
        where: { certificateStatus: "PENDING_APPROVAL" },
      });

      if (pendingCertsCount > 0) {
        const res = await createNotification({
          userId: caller.id,
          type: "CERTIFICATE_AWAITING_APPROVAL",
          title: "Certificates Awaiting Approval",
          message: `${pendingCertsCount} recruiter candidate(s) have passed Academy final assessments and require certificate approval.`,
          linkUrl: "/admin/certificates",
          dedupKey: `ADMIN_PENDING_CERTS:${todayStr}`,
        });
        if (res.success && !res.data?.duplicateSkipped) generatedCount++;
      }

      // Rule 3: Performance Issue / Low Shortlisting Conversion Detection
      const allReportsThisMonth = await prisma.dailyReport.findMany({
        where: {
          status: { not: "DRAFT" },
          reportDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        select: { callsMade: true, shortlisted: true },
      });

      const totalCalls = allReportsThisMonth.reduce((s, r) => s + r.callsMade, 0);
      const totalShortlisted = allReportsThisMonth.reduce((s, r) => s + r.shortlisted, 0);

      if (totalCalls >= 50 && totalShortlisted / totalCalls < 0.1) {
        const res = await createNotification({
          userId: caller.id,
          type: "PERFORMANCE_ISSUE",
          title: "Sourcing Conversion Alert",
          message: `Organization shortlisting conversion is below 10% (${totalShortlisted} shortlists from ${totalCalls} calls). Review candidate screening quality.`,
          linkUrl: "/admin/analytics",
          dedupKey: `PERF_ISSUE_SHORTLIST:${monthKey}`,
        });
        if (res.success && !res.data?.duplicateSkipped) generatedCount++;
      }

      // Rule 4: Target Risk Detection
      const zeroJoinsRecruiters = await prisma.candidateProfile.count({
        where: {
          isCertified: true,
          dailyReports: {
            none: {
              reportDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
              joinings: { gt: 0 },
            },
          },
        },
      });

      if (now.getDate() >= 15 && zeroJoinsRecruiters > 0) {
        const res = await createNotification({
          userId: caller.id,
          type: "TARGET_RISK",
          title: "Monthly Target Attrition Risk",
          message: `${zeroJoinsRecruiters} certified recruiter(s) have not recorded joinings mid-month. Review pacing targets.`,
          linkUrl: "/admin/targets",
          dedupKey: `TARGET_RISK_MIDMONTH:${monthKey}`,
        });
        if (res.success && !res.data?.duplicateSkipped) generatedCount++;
      }
    }

    return {
      success: true,
      data: { generatedCount },
    };
  } catch (error) {
    console.error("checkAndGenerateDiagnosticNotifications error:", error);
    return { success: false, message: "Failed to evaluate diagnostic notifications." };
  }
}
