"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback in test environments
  }
}

export interface ClientBreakdownInput {
  id?: string;
  clientName: string;
  calls: number;
  ownLeads: number;
  internalLeads: number;
  screened: number;
  shortlisted: number;
  lineUp: number;
  offered: number;
  joined: number;
  absconded: number;
}

export interface DailyReportInput {
  reportDate?: string | Date;
  calls: number;
  ownLeads: number;
  internalLeads: number;
  screened: number;
  shortlisted: number;
  interviewLineUp: number;
  interviewAttended: number;
  offered: number;
  joined: number;
  absconded: number;
  rejected: number;
  noResponse: number;
  pendingFollowUps: number;
  challenges?: string;
  learnings?: string;
  pendingFollowUpsDesc?: string;
  planForTomorrow?: string;
  clientBreakdowns?: ClientBreakdownInput[];
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface RecruiterOverride {
  id: string;
  profileId: string;
  email: string;
  isCertified: boolean;
  role?: string;
}

export interface ReviewerOverride {
  id: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Normalizes any Date or date string to local midnight (00:00:00.000).
 */
function normalizeWorkDate(dateInput?: string | Date): Date {
  let d: Date;
  if (typeof dateInput === "string" && dateInput.includes("-") && !dateInput.includes("T")) {
    const [y, m, day] = dateInput.split("-").map(Number);
    d = new Date(y, m - 1, day, 0, 0, 0, 0);
  } else if (dateInput) {
    d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
  } else {
    d = new Date();
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/**
 * Authenticates recruiter for report operations.
 */
async function authenticateRecruiter(override?: RecruiterOverride) {
  if (override) {
    if (!override.isCertified) return null;
    return override;
  }

  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "ADMIN") {
    return {
      id: user.id,
      profileId: "admin-system-profile",
      email: user.email,
      isCertified: true,
      role: "ADMIN",
    };
  }

  if (user.role !== "CANDIDATE" || !user.candidateProfile) return null;
  if (!user.candidateProfile.isCertified || user.candidateProfile.certificateStatus !== "ISSUED") return null;

  return {
    id: user.id,
    profileId: user.candidateProfile.id,
    email: user.email,
    isCertified: true,
    role: "CANDIDATE",
  };
}

/**
 * Saves a daily recruitment report as a DRAFT.
 * Supports partial entry, allows repeated updates, and persists client breakdowns.
 */
export async function saveDailyReportDraft(
  input: DailyReportInput,
  recruiterOverride?: RecruiterOverride
): Promise<ActionResponse<{ reportId: string; status: string }>> {
  try {
    const recruiter = await authenticateRecruiter(recruiterOverride);
    if (!recruiter) {
      return { success: false, message: "Unauthorized. Certified Recruiter access required." };
    }

    const reportDate = normalizeWorkDate(input.reportDate);

    // Check existing report status
    const existing = await prisma.dailyReport.findUnique({
      where: {
        recruiterProfileId_reportDate: {
          recruiterProfileId: recruiter.profileId,
          reportDate,
        },
      },
    });

    if (existing && existing.status === "APPROVED") {
      return { success: false, message: "Approved reports cannot be modified." };
    }

    if (existing && existing.status === "SUBMITTED") {
      return {
        success: false,
        message: "Report is already submitted and pending manager review. Cannot overwrite with draft.",
      };
    }

    const report = await prisma.$transaction(async (tx) => {
      const upserted = await tx.dailyReport.upsert({
        where: {
          recruiterProfileId_reportDate: {
            recruiterProfileId: recruiter.profileId,
            reportDate,
          },
        },
        update: {
          callsMade: Math.max(0, input.calls || 0),
          ownLeads: Math.max(0, input.ownLeads || 0),
          internalLeads: Math.max(0, input.internalLeads || 0),
          candidatesScreened: Math.max(0, input.screened || 0),
          shortlisted: Math.max(0, input.shortlisted || 0),
          interviewsScheduled: Math.max(0, input.interviewLineUp || 0),
          interviewsAttended: Math.max(0, input.interviewAttended || 0),
          offersExtended: Math.max(0, input.offered || 0),
          joinings: Math.max(0, input.joined || 0),
          absconded: Math.max(0, input.absconded || 0),
          rejected: Math.max(0, input.rejected || 0),
          noResponse: Math.max(0, input.noResponse || 0),
          pendingFollowUps: Math.max(0, input.pendingFollowUps || 0),
          challenges: input.challenges || null,
          learnings: input.learnings || null,
          pendingFollowUpsDesc: input.pendingFollowUpsDesc || null,
          planForTomorrow: input.planForTomorrow || null,
          status: "DRAFT",
        },
        create: {
          recruiterProfileId: recruiter.profileId,
          reportDate,
          callsMade: Math.max(0, input.calls || 0),
          ownLeads: Math.max(0, input.ownLeads || 0),
          internalLeads: Math.max(0, input.internalLeads || 0),
          candidatesScreened: Math.max(0, input.screened || 0),
          shortlisted: Math.max(0, input.shortlisted || 0),
          interviewsScheduled: Math.max(0, input.interviewLineUp || 0),
          interviewsAttended: Math.max(0, input.interviewAttended || 0),
          offersExtended: Math.max(0, input.offered || 0),
          joinings: Math.max(0, input.joined || 0),
          absconded: Math.max(0, input.absconded || 0),
          rejected: Math.max(0, input.rejected || 0),
          noResponse: Math.max(0, input.noResponse || 0),
          pendingFollowUps: Math.max(0, input.pendingFollowUps || 0),
          challenges: input.challenges || null,
          learnings: input.learnings || null,
          pendingFollowUpsDesc: input.pendingFollowUpsDesc || null,
          planForTomorrow: input.planForTomorrow || null,
          status: "DRAFT",
        },
      });

      // Synchronize client-wise breakdown rows
      await tx.dailyReportClientBreakdown.deleteMany({
        where: { dailyReportId: upserted.id },
      });

      if (input.clientBreakdowns && input.clientBreakdowns.length > 0) {
        const activeClients = await tx.clientMaster.findMany();
        const clientMap = new Map(activeClients.map((cl) => [cl.name.toLowerCase().trim(), cl.id]));

        await tx.dailyReportClientBreakdown.createMany({
          data: input.clientBreakdowns
            .filter((c) => c.clientName && c.clientName.trim().length > 0)
            .map((c) => ({
              dailyReportId: upserted.id,
              clientId: clientMap.get(c.clientName.trim().toLowerCase()) || null,
              clientName: c.clientName.trim(),
              calls: Math.max(0, c.calls || 0),
              ownLeads: Math.max(0, c.ownLeads || 0),
              internalLeads: Math.max(0, c.internalLeads || 0),
              screened: Math.max(0, c.screened || 0),
              shortlisted: Math.max(0, c.shortlisted || 0),
              lineUp: Math.max(0, c.lineUp || 0),
              offered: Math.max(0, c.offered || 0),
              joined: Math.max(0, c.joined || 0),
              absconded: Math.max(0, c.absconded || 0),
            })),
        });
      }

      return upserted;
    });

    safeRevalidate("/workspace/report");
    safeRevalidate("/workspace/daily-report");

    return {
      success: true,
      message: "Draft report saved successfully.",
      data: { reportId: report.id, status: "DRAFT" },
    };
  } catch (error) {
    console.error("saveDailyReportDraft error:", error);
    return { success: false, message: "Failed to save report draft." };
  }
}

/**
 * Validates, submits, or resubmits the Daily Recruitment Operations Report.
 * Enforces field validations, prevents duplicate active reports, and records revision snapshots.
 */
export async function submitDailyReportAction(
  input: DailyReportInput,
  recruiterOverride?: RecruiterOverride
): Promise<ActionResponse<{ reportId: string; status: string; revisionNumber: number }>> {
  try {
    const recruiter = await authenticateRecruiter(recruiterOverride);
    if (!recruiter) {
      return { success: false, message: "Unauthorized. Certified Recruiter access required." };
    }

    const reportDate = normalizeWorkDate(input.reportDate);

    // Validation 1: Metric numbers must be non-negative
    const numericFields = [
      input.calls,
      input.ownLeads,
      input.internalLeads,
      input.screened,
      input.shortlisted,
      input.interviewLineUp,
      input.interviewAttended,
      input.offered,
      input.joined,
      input.absconded,
      input.rejected,
      input.noResponse,
      input.pendingFollowUps,
    ];

    if (numericFields.some((val) => typeof val === "number" && val < 0)) {
      return { success: false, message: "Report metric values cannot be negative." };
    }

    // Validation 2: Mandatory qualitative reflections
    if (!input.challenges || input.challenges.trim().length === 0) {
      return { success: false, message: "Challenges reflection is mandatory for daily report submission." };
    }

    if (!input.learnings || input.learnings.trim().length === 0) {
      return { success: false, message: "Daily learnings reflection is mandatory for submission." };
    }

    if (!input.planForTomorrow || input.planForTomorrow.trim().length === 0) {
      return { success: false, message: "Tomorrow's plan is mandatory for daily report submission." };
    }

    // Validation 3: Client breakdown rows validation
    if (input.clientBreakdowns && input.clientBreakdowns.length > 0) {
      for (const cb of input.clientBreakdowns) {
        if (!cb.clientName || cb.clientName.trim().length === 0) {
          return { success: false, message: "Client name in client-wise breakdown cannot be blank." };
        }
        const cbNumbers = [cb.calls, cb.ownLeads, cb.internalLeads, cb.screened, cb.shortlisted, cb.lineUp, cb.offered, cb.joined, cb.absconded];
        if (cbNumbers.some((val) => typeof val === "number" && val < 0)) {
          return { success: false, message: `Values for client '${cb.clientName}' cannot be negative.` };
        }
      }
    }

    // Duplicate Prevention Check
    const existing = await prisma.dailyReport.findUnique({
      where: {
        recruiterProfileId_reportDate: {
          recruiterProfileId: recruiter.profileId,
          reportDate,
        },
      },
      include: { revisions: true },
    });

    if (existing && existing.status === "APPROVED") {
      return { success: false, message: "Report for this date has already been approved and cannot be resubmitted." };
    }

    if (existing && existing.status === "SUBMITTED") {
      return {
        success: false,
        message: "A daily report for this date is already submitted and pending manager review. Duplicate submissions are not permitted.",
      };
    }

    const nextRevisionNumber = (existing?.revisions.length || 0) + 1;
    const challengesStr = input.challenges!.trim();
    const learningsStr = input.learnings!.trim();
    const planTomorrowStr = input.planForTomorrow!.trim();
    const pendingDescStr = input.pendingFollowUpsDesc?.trim() || null;

    const report = await prisma.$transaction(async (tx) => {
      const upserted = await tx.dailyReport.upsert({
        where: {
          recruiterProfileId_reportDate: {
            recruiterProfileId: recruiter.profileId,
            reportDate,
          },
        },
        update: {
          callsMade: input.calls,
          ownLeads: input.ownLeads,
          internalLeads: input.internalLeads,
          candidatesScreened: input.screened,
          shortlisted: input.shortlisted,
          interviewsScheduled: input.interviewLineUp,
          interviewsAttended: input.interviewAttended,
          offersExtended: input.offered,
          joinings: input.joined,
          absconded: input.absconded,
          rejected: input.rejected,
          noResponse: input.noResponse,
          pendingFollowUps: input.pendingFollowUps,
          challenges: challengesStr,
          learnings: learningsStr,
          pendingFollowUpsDesc: pendingDescStr,
          planForTomorrow: planTomorrowStr,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        create: {
          recruiterProfileId: recruiter.profileId,
          reportDate,
          callsMade: input.calls,
          ownLeads: input.ownLeads,
          internalLeads: input.internalLeads,
          candidatesScreened: input.screened,
          shortlisted: input.shortlisted,
          interviewsScheduled: input.interviewLineUp,
          interviewsAttended: input.interviewAttended,
          offersExtended: input.offered,
          joinings: input.joined,
          absconded: input.absconded,
          rejected: input.rejected,
          noResponse: input.noResponse,
          pendingFollowUps: input.pendingFollowUps,
          challenges: challengesStr,
          learnings: learningsStr,
          pendingFollowUpsDesc: pendingDescStr,
          planForTomorrow: planTomorrowStr,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      // Update client breakdown entries
      await tx.dailyReportClientBreakdown.deleteMany({
        where: { dailyReportId: upserted.id },
      });

      if (input.clientBreakdowns && input.clientBreakdowns.length > 0) {
        const activeClients = await tx.clientMaster.findMany();
        const clientMap = new Map(activeClients.map((cl) => [cl.name.toLowerCase().trim(), cl.id]));

        await tx.dailyReportClientBreakdown.createMany({
          data: input.clientBreakdowns.map((c) => ({
            dailyReportId: upserted.id,
            clientId: clientMap.get(c.clientName.trim().toLowerCase()) || null,
            clientName: c.clientName.trim(),
            calls: c.calls || 0,
            ownLeads: c.ownLeads || 0,
            internalLeads: c.internalLeads || 0,
            screened: c.screened || 0,
            shortlisted: c.shortlisted || 0,
            lineUp: c.lineUp || 0,
            offered: c.offered || 0,
            joined: c.joined || 0,
            absconded: c.absconded || 0,
          })),
        });
      }

      // Snapshot Revision History
      await tx.dailyReportRevision.create({
        data: {
          dailyReportId: upserted.id,
          revisionNumber: nextRevisionNumber,
          status: "SUBMITTED",
          metricsSnapshot: JSON.stringify({
            metrics: {
              calls: input.calls,
              ownLeads: input.ownLeads,
              internalLeads: input.internalLeads,
              screened: input.screened,
              shortlisted: input.shortlisted,
              interviewLineUp: input.interviewLineUp,
              interviewAttended: input.interviewAttended,
              offered: input.offered,
              joined: input.joined,
              absconded: input.absconded,
              rejected: input.rejected,
              noResponse: input.noResponse,
              pendingFollowUps: input.pendingFollowUps,
            },
            qualitative: {
              challenges: input.challenges,
              learnings: input.learnings,
              pendingFollowUpsDesc: input.pendingFollowUpsDesc,
              planForTomorrow: input.planForTomorrow,
            },
            clientBreakdowns: input.clientBreakdowns || [],
          }),
          managerNotes: upserted.managerNotes,
          submittedAt: new Date(),
        },
      });

      // Auto-sync Checklist Items for end of day
      await tx.recruiterChecklist.upsert({
        where: {
          recruiterProfileId_date_itemKey: {
            recruiterProfileId: recruiter.profileId,
            date: reportDate,
            itemKey: "eod_submit_daily_report",
          },
        },
        update: { isCompleted: true, completedAt: new Date(), section: "END_OF_DAY" },
        create: {
          recruiterProfileId: recruiter.profileId,
          date: reportDate,
          itemKey: "eod_submit_daily_report",
          title: "Submit the daily report",
          section: "END_OF_DAY",
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      await tx.recruiterChecklist.upsert({
        where: {
          recruiterProfileId_date_itemKey: {
            recruiterProfileId: recruiter.profileId,
            date: reportDate,
            itemKey: "submit_daily_report",
          },
        },
        update: { isCompleted: true, completedAt: new Date(), section: "END_OF_DAY" },
        create: {
          recruiterProfileId: recruiter.profileId,
          date: reportDate,
          itemKey: "submit_daily_report",
          title: "Submit Daily Operations Report",
          section: "END_OF_DAY",
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Auto-sync Target Metrics for today
      await tx.recruiterTarget.upsert({
        where: {
          recruiterProfileId_date: {
            recruiterProfileId: recruiter.profileId,
            date: reportDate,
          },
        },
        update: {
          callsAchieved: input.calls,
          submitsAchieved: input.shortlisted,
          interviewsAchieved: input.interviewLineUp,
        },
        create: {
          recruiterProfileId: recruiter.profileId,
          date: reportDate,
          callsTarget: 30,
          callsAchieved: input.calls,
          submitsTarget: 5,
          submitsAchieved: input.shortlisted,
          interviewsTarget: 2,
          interviewsAchieved: input.interviewLineUp,
        },
      });

      return upserted;
    });

    await recordAuditLog({
      userId: recruiter.id,
      action: "DAILY_REPORT_SUBMITTED",
      targetType: "DAILY_REPORT",
      targetId: report.id,
      details: {
        reportId: report.id,
        reportDate: reportDate.toISOString().split("T")[0],
        revisionNumber: nextRevisionNumber,
        isResubmission: nextRevisionNumber > 1,
      },
    });

    // Phase 16: Dispatch real event notifications
    const profileWithManager = await prisma.candidateProfile.findUnique({
      where: { id: recruiter.profileId },
      select: { managerId: true, fullName: true },
    });

    const isResubmission = nextRevisionNumber > 1;
    const reportDateStr = reportDate.toISOString().split("T")[0];

    // 1. Notify Assigned Manager
    if (profileWithManager?.managerId) {
      await createNotification({
        userId: profileWithManager.managerId,
        type: "REPORT_SUBMITTED",
        title: isResubmission ? "Daily Report Resubmitted" : "Daily Report Submitted",
        message: `${profileWithManager.fullName} ${isResubmission ? "resubmitted" : "submitted"} their daily operations report for ${reportDateStr}.`,
        linkUrl: "/manager/approvals",
        referenceId: report.id,
        dedupKey: `REPORT_SUBMITTED:${report.id}:${nextRevisionNumber}`,
      });

      await createNotification({
        userId: profileWithManager.managerId,
        type: "PENDING_APPROVAL",
        title: "Report Pending Review",
        message: `Daily operations report from ${profileWithManager.fullName} is awaiting your approval.`,
        linkUrl: "/manager/approvals",
        referenceId: report.id,
        dedupKey: `PENDING_APPROVAL:${profileWithManager.managerId}:${report.id}`,
      });
    }

    // 2. Notify Admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    for (const adm of admins) {
      await createNotification({
        userId: adm.id,
        type: "PENDING_REPORT",
        title: "Daily Report In Review Queue",
        message: `${profileWithManager?.fullName || "Certified Recruiter"} submitted operations report for ${reportDateStr}.`,
        linkUrl: "/admin/reports",
        referenceId: report.id,
        dedupKey: `ADMIN_PENDING_REPORT:${adm.id}:${report.id}`,
      });
    }

    // 3. Recruiter follow-up reminder if follow-ups are pending
    if (input.pendingFollowUps && input.pendingFollowUps > 0) {
      await createNotification({
        userId: recruiter.id,
        type: "PENDING_FOLLOWUP_REMINDER",
        title: "Pending Follow-up Reminder",
        message: `You reported ${input.pendingFollowUps} pending candidate follow-up(s). Keep candidate momentum active.`,
        linkUrl: "/workspace/pipeline",
        referenceId: report.id,
        dedupKey: `FOLLOWUP:${recruiter.profileId}:${reportDateStr}`,
      });
    }

    safeRevalidate("/workspace/report");
    safeRevalidate("/workspace/daily-report");
    safeRevalidate("/workspace/today");
    safeRevalidate("/workspace/checklist");

    return {
      success: true,
      message:
        nextRevisionNumber > 1
          ? `Daily report resubmitted successfully (Revision #${nextRevisionNumber}).`
          : "Daily report submitted successfully for manager review.",
      data: {
        reportId: report.id,
        status: "SUBMITTED",
        revisionNumber: nextRevisionNumber,
      },
    };
  } catch (error) {
    console.error("submitDailyReportAction error:", error);
    return { success: false, message: "Failed to submit daily report." };
  }
}

/**
 * Retrieves the daily report, client breakdown rows, revisions, and manager feedback for a specific date.
 */
export async function getDailyReportForDate(
  dateInput?: string | Date,
  recruiterOverride?: RecruiterOverride
) {
  try {
    const recruiter = await authenticateRecruiter(recruiterOverride);
    if (!recruiter) return null;

    const targetDate = normalizeWorkDate(dateInput);

    const report = await prisma.dailyReport.findUnique({
      where: {
        recruiterProfileId_reportDate: {
          recruiterProfileId: recruiter.profileId,
          reportDate: targetDate,
        },
      },
      include: {
        clientBreakdowns: { orderBy: { createdAt: "asc" } },
        revisions: { orderBy: { revisionNumber: "desc" } },
      },
    });

    return {
      reportDate: targetDate,
      dateStr: targetDate.toISOString().split("T")[0],
      report,
    };
  } catch (error) {
    console.error("getDailyReportForDate error:", error);
    return null;
  }
}

/**
 * Retrieves past daily reports submitted or drafted by the authenticated recruiter.
 */
export async function getRecruiterReportsHistory(
  recruiterOverride?: RecruiterOverride,
  limit: number = 30
) {
  try {
    const recruiter = await authenticateRecruiter(recruiterOverride);
    if (!recruiter) return [];

    const reports = await prisma.dailyReport.findMany({
      where: { recruiterProfileId: recruiter.profileId },
      orderBy: { reportDate: "desc" },
      take: limit,
      include: {
        clientBreakdowns: true,
        revisions: { select: { revisionNumber: true, status: true, submittedAt: true } },
      },
    });

    return reports;
  } catch (error) {
    console.error("getRecruiterReportsHistory error:", error);
    return [];
  }
}

/**
 * Manager / Admin Review Workflow:
 * Strictly blocks recruiters from approving or reviewing their own reports.
 * Allows managers/admins to either APPROVE a submitted report or RETURN it with recorded notes.
 */
export async function reviewDailyReport(
  params: {
    reportId: string;
    action: "APPROVE" | "RETURN";
    managerNotes?: string;
  },
  reviewerOverride?: ReviewerOverride
): Promise<ActionResponse<{ reportId: string; status: string }>> {
  try {
    let reviewer = reviewerOverride;

    if (!reviewer) {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, message: "Authentication required." };
      }
      reviewer = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.email.split("@")[0],
      };
    }

    // Role-based protection: Recruiters strictly forbidden from reviewing or approving reports
    if (reviewer.role !== "ADMIN" && reviewer.role !== "MANAGER") {
      return {
        success: false,
        message: "Unauthorized. Recruiters are strictly prohibited from reviewing or approving reports.",
      };
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id: params.reportId },
      include: {
        recruiterProfile: {
          select: { id: true, userId: true, fullName: true, managerId: true },
        },
      },
    });

    if (!report) {
      return { success: false, message: "Daily report not found." };
    }

    // Self-approval prevention
    if (report.recruiterProfile.userId === reviewer.id) {
      return {
        success: false,
        message: "Unauthorized. Recruiters are strictly prohibited from reviewing or approving their own reports.",
      };
    }

    // Team isolation check for managers (blocks reviewing other managers' assigned recruiters)
    if (
      reviewer.role === "MANAGER" &&
      report.recruiterProfile.managerId &&
      report.recruiterProfile.managerId !== reviewer.id
    ) {
      return {
        success: false,
        message: "Unauthorized. This recruiter is not assigned to your team.",
      };
    }

    if (params.action === "RETURN" && (!params.managerNotes || params.managerNotes.trim().length === 0)) {
      return { success: false, message: "Manager feedback notes are required when returning a report." };
    }

    const nextStatus = params.action === "APPROVE" ? "APPROVED" : "RETURNED";
    const now = new Date();

    const updated = await prisma.dailyReport.update({
      where: { id: params.reportId },
      data: {
        status: nextStatus,
        reviewedAt: now,
        approvedAt: nextStatus === "APPROVED" ? now : null,
        reviewedByUserId: reviewer.id,
        reviewedByName: reviewer.name || reviewer.email,
        managerNotes: params.managerNotes ? params.managerNotes.trim() : report.managerNotes,
      },
    });

    await recordAuditLog({
      userId: reviewer.id,
      action: "DAILY_REPORT_REVIEWED",
      targetType: "DAILY_REPORT",
      targetId: report.id,
      details: {
        reportId: report.id,
        decision: nextStatus,
        managerNotes: params.managerNotes,
        reviewedBy: reviewer.email,
      },
    });

    // Phase 16: Notify recruiter of manager's review decision
    const recruiterUserId = report.recruiterProfile.userId;
    const reportDateStr = report.reportDate.toISOString().split("T")[0];

    if (nextStatus === "APPROVED") {
      await createNotification({
        userId: recruiterUserId,
        type: "REPORT_APPROVED",
        title: "Daily Report Approved",
        message: `Your daily recruitment operations report for ${reportDateStr} has been reviewed and approved.`,
        linkUrl: "/workspace/report",
        referenceId: report.id,
        dedupKey: `REPORT_APPROVED:${report.id}`,
      });
    } else if (nextStatus === "RETURNED") {
      await createNotification({
        userId: recruiterUserId,
        type: "REPORT_RETURNED",
        title: "Daily Report Returned",
        message: `Your manager returned your report for ${reportDateStr}. Please inspect review feedback and resubmit.`,
        linkUrl: "/workspace/report",
        referenceId: report.id,
        dedupKey: `REPORT_RETURNED:${report.id}:${Date.now()}`,
      });
    }

    if (params.managerNotes && params.managerNotes.trim().length > 0) {
      const sanitizedNotes = params.managerNotes.trim().slice(0, 100);
      await createNotification({
        userId: recruiterUserId,
        type: "MANAGER_COMMENT_ADDED",
        title: "Manager Comment Added",
        message: `Manager feedback on your ${reportDateStr} report: "${sanitizedNotes}"`,
        linkUrl: "/workspace/report",
        referenceId: report.id,
        dedupKey: `MGR_COMMENT:${report.id}:${Date.now()}`,
      });
    }

    safeRevalidate("/workspace/report");
    safeRevalidate("/workspace/daily-report");

    return {
      success: true,
      message:
        nextStatus === "APPROVED"
          ? "Daily report approved successfully."
          : "Daily report returned to recruiter for review and resubmission.",
      data: { reportId: updated.id, status: nextStatus },
    };
  } catch (error) {
    console.error("reviewDailyReport error:", error);
    return { success: false, message: "Failed to review daily report." };
  }
}
