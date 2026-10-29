"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback in test runners
  }
}

export interface ManagerOverride {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Normalizes date to local midnight
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
 * Authenticates manager or supervisory admin.
 * Strictly blocks candidates.
 */
export async function getAuthenticatedManager(override?: ManagerOverride) {
  if (override) {
    if (override.role !== "MANAGER" && override.role !== "ADMIN") return null;
    return {
      id: override.id,
      email: override.email,
      role: override.role,
      name: override.name || override.email.split("@")[0],
    };
  }

  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MANAGER" && user.role !== "ADMIN") return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.candidateProfile?.fullName || user.email.split("@")[0],
  };
}

/**
 * Assigns or reassigns a recruiter profile to a manager.
 * Accessible to Admin and Managers.
 */
export async function assignRecruiterToManager(
  managerUserId: string,
  recruiterProfileId: string,
  override?: ManagerOverride
): Promise<ActionResponse> {
  try {
    const caller = await getAuthenticatedManager(override);
    if (!caller) {
      return { success: false, message: "Unauthorized. Manager or Admin privileges required." };
    }

    const managerUser = await prisma.user.findUnique({
      where: { id: managerUserId },
    });
    if (!managerUser || (managerUser.role !== "MANAGER" && managerUser.role !== "ADMIN")) {
      return { success: false, message: "Target user is not a valid Manager or Admin." };
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { id: recruiterProfileId },
    });
    if (!profile) {
      return { success: false, message: "Recruiter profile not found." };
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: recruiterProfileId },
      data: { managerId: managerUserId },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "TEAM_ASSIGNED",
      targetType: "TEAM",
      targetId: profile.id,
      details: {
        recruiterName: profile.fullName,
        candidateId: profile.candidateId,
        managerId: managerUserId,
        managerEmail: managerUser.email,
        assignedBy: caller.email,
      },
    });

    safeRevalidate("/manager/team");
    safeRevalidate("/manager");

    return {
      success: true,
      message: `Recruiter '${profile.fullName}' assigned to manager '${managerUser.email}' successfully.`,
      data: updated,
    };
  } catch (error) {
    console.error("assignRecruiterToManager error:", error);
    return { success: false, message: "Failed to assign recruiter to manager." };
  }
}

/**
 * Retrieves Manager Dashboard aggregations with strict team isolation.
 * Shows team calls, shortlisted, line-ups, offers, joins, target achievement,
 * recruiter rankings, approval queue, and below-target recruiters.
 */
export async function getManagerDashboard(override?: ManagerOverride): Promise<
  ActionResponse<{
    manager: { id: string; email: string; name: string; role: string };
    teamSummary: {
      teamSize: number;
      totalCalls: number;
      totalShortlisted: number;
      totalLineUps: number;
      totalOffers: number;
      totalJoins: number;
      targetCalls: number;
      targetShortlists: number;
      targetJoins: number;
      achievementPct: number;
      achievementBand: string;
    };
    rankings: Array<{
      recruiterId: string;
      fullName: string;
      candidateId: string;
      calls: number;
      shortlisted: number;
      lineUp: number;
      offers: number;
      joins: number;
      achievementPct: number;
      achievementBand: string;
    }>;
    approvalQueue: Array<{
      reportId: string;
      recruiterName: string;
      candidateId: string;
      reportDate: Date;
      calls: number;
      shortlisted: number;
      joins: number;
      submittedAt: Date | null;
      challenges: string | null;
    }>;
    belowTargetRecruiters: Array<{
      recruiterId: string;
      fullName: string;
      candidateId: string;
      achievementPct: number;
      achievementBand: string;
      calls: number;
      shortlisted: number;
    }>;
  }>
> {
  try {
    const manager = await getAuthenticatedManager(override);
    if (!manager) {
      return { success: false, message: "Unauthorized. Manager access required." };
    }

    // 1. Team Isolation: find assigned recruiters
    const whereTeam: { managerId?: string } = {};
    if (manager.role === "MANAGER") {
      whereTeam.managerId = manager.id;
    }

    const teamProfiles = await prisma.candidateProfile.findMany({
      where: whereTeam,
      include: {
        user: { select: { email: true, status: true } },
      },
    });

    const teamRecruiterIds = teamProfiles.map((p) => p.id);

    // If manager has no assigned recruiters yet
    if (teamRecruiterIds.length === 0) {
      return {
        success: true,
        data: {
          manager,
          teamSummary: {
            teamSize: 0,
            totalCalls: 0,
            totalShortlisted: 0,
            totalLineUps: 0,
            totalOffers: 0,
            totalJoins: 0,
            targetCalls: 0,
            targetShortlists: 0,
            targetJoins: 0,
            achievementPct: 0,
            achievementBand: "No Team Members",
          },
          rankings: [],
          approvalQueue: [],
          belowTargetRecruiters: [],
        },
      };
    }

    // 2. Aggregate Team Reports
    const submittedReports = await prisma.dailyReport.findMany({
      where: {
        recruiterProfileId: { in: teamRecruiterIds },
        status: { not: "DRAFT" },
      },
    });

    const totalCalls = submittedReports.reduce((sum, r) => sum + r.callsMade, 0);
    const totalShortlisted = submittedReports.reduce((sum, r) => sum + r.shortlisted, 0);
    const totalLineUps = submittedReports.reduce((sum, r) => sum + r.interviewsScheduled, 0);
    const totalOffers = submittedReports.reduce((sum, r) => sum + r.offersExtended, 0);
    const totalJoins = submittedReports.reduce((sum, r) => sum + r.joinings, 0);

    // Benchmarks (Team target based on active team size: 30 calls, 5 shortlists, 1 join per recruiter daily)
    const targetCalls = teamProfiles.length * 30;
    const targetShortlists = teamProfiles.length * 5;
    const targetJoins = teamProfiles.length * 1;

    // Achievement percentage (Weighted: Calls 25%, Shortlists 35%, Joins 40%)
    const callsScore = targetCalls > 0 ? Math.min(1, totalCalls / targetCalls) * 25 : 0;
    const shortlistsScore = targetShortlists > 0 ? Math.min(1, totalShortlisted / targetShortlists) * 35 : 0;
    const joinsScore = targetJoins > 0 ? Math.min(1, totalJoins / targetJoins) * 40 : 0;
    const achievementPct = Math.round(callsScore + shortlistsScore + joinsScore);

    const getBand = (pct: number) => {
      if (pct <= 25) return "Critical";
      if (pct <= 50) return "Low";
      if (pct <= 75) return "Medium";
      if (pct <= 90) return "Good";
      if (pct <= 100) return "Great";
      return "Outstanding";
    };

    // 3. Recruiter Performance Ranking
    const rankings = teamProfiles.map((rec) => {
      const recReports = submittedReports.filter((r) => r.recruiterProfileId === rec.id);
      const c = recReports.reduce((sum, r) => sum + r.callsMade, 0);
      const s = recReports.reduce((sum, r) => sum + r.shortlisted, 0);
      const l = recReports.reduce((sum, r) => sum + r.interviewsScheduled, 0);
      const o = recReports.reduce((sum, r) => sum + r.offersExtended, 0);
      const j = recReports.reduce((sum, r) => sum + r.joinings, 0);

      const rScore = Math.round(
        (Math.min(1, c / 30) * 25) +
        (Math.min(1, s / 5) * 35) +
        (Math.min(1, j / 1) * 40)
      );

      return {
        recruiterId: rec.id,
        fullName: rec.fullName,
        candidateId: rec.candidateId,
        calls: c,
        shortlisted: s,
        lineUp: l,
        offers: o,
        joins: j,
        achievementPct: rScore,
        achievementBand: getBand(rScore),
      };
    });

    // Sort descending by joins, then offers, then line-up, then calls
    rankings.sort((a, b) => b.joins - a.joins || b.offers - a.offers || b.lineUp - a.lineUp || b.calls - a.calls);

    // 4. Pending Approval Queue (Reports in SUBMITTED state)
    const pendingReports = await prisma.dailyReport.findMany({
      where: {
        recruiterProfileId: { in: teamRecruiterIds },
        status: "SUBMITTED",
      },
      include: {
        recruiterProfile: { select: { fullName: true, candidateId: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const approvalQueue = pendingReports.map((r) => ({
      reportId: r.id,
      recruiterName: r.recruiterProfile.fullName,
      candidateId: r.recruiterProfile.candidateId,
      reportDate: r.reportDate,
      calls: r.callsMade,
      shortlisted: r.shortlisted,
      joins: r.joinings,
      submittedAt: r.submittedAt,
      challenges: r.challenges,
    }));

    // 5. Below-Target Recruiters (Critical or Low band)
    const belowTargetRecruiters = rankings.filter(
      (r) => r.achievementBand === "Critical" || r.achievementBand === "Low"
    );

    return {
      success: true,
      data: {
        manager,
        teamSummary: {
          teamSize: teamProfiles.length,
          totalCalls,
          totalShortlisted,
          totalLineUps,
          totalOffers,
          totalJoins,
          targetCalls,
          targetShortlists,
          targetJoins,
          achievementPct,
          achievementBand: getBand(achievementPct),
        },
        rankings,
        approvalQueue,
        belowTargetRecruiters,
      },
    };
  } catch (error) {
    console.error("getManagerDashboard error:", error);
    return { success: false, message: "Failed to generate manager dashboard." };
  }
}

/**
 * Retrieves the assigned team member roster.
 */
export async function getManagerTeam(override?: ManagerOverride) {
  try {
    const manager = await getAuthenticatedManager(override);
    if (!manager) return [];

    const whereClause: { managerId?: string } = {};
    if (manager.role === "MANAGER") {
      whereClause.managerId = manager.id;
    }

    const team = await prisma.candidateProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { email: true, status: true, lastLoginAt: true } },
        _count: {
          select: {
            jobCandidates: true,
            dailyReports: true,
          },
        },
        dailyReports: {
          orderBy: { reportDate: "desc" },
          take: 1,
          select: {
            status: true,
            reportDate: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return team.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      candidateId: member.candidateId,
      email: member.user.email,
      status: member.user.status,
      lastLoginAt: member.user.lastLoginAt,
      isCertified: member.isCertified,
      joiningDate: member.joiningDate,
      totalCandidates: member._count.jobCandidates,
      totalReports: member._count.dailyReports,
      latestReport: member.dailyReports[0] || null,
    }));
  } catch (error) {
    console.error("getManagerTeam error:", error);
    return [];
  }
}

/**
 * Retrieves team daily reports with filtering and strict team isolation.
 */
export async function getManagerReports(
  filters?: {
    date?: string;
    recruiterId?: string;
    status?: string;
  },
  override?: ManagerOverride
) {
  try {
    const manager = await getAuthenticatedManager(override);
    if (!manager) return [];

    const whereTeam: { managerId?: string } = {};
    if (manager.role === "MANAGER") {
      whereTeam.managerId = manager.id;
    }

    const teamProfiles = await prisma.candidateProfile.findMany({
      where: whereTeam,
      select: { id: true },
    });
    const allowedRecruiterIds = new Set(teamProfiles.map((p) => p.id));

    // Team Isolation enforcement
    if (filters?.recruiterId && !allowedRecruiterIds.has(filters.recruiterId)) {
      return []; // Reject unauthorized cross-team query
    }

    const targetRecruiterIds = filters?.recruiterId
      ? [filters.recruiterId]
      : Array.from(allowedRecruiterIds);

    const whereReport: any = {
      recruiterProfileId: { in: targetRecruiterIds },
    };

    if (filters?.status && filters.status !== "ALL") {
      whereReport.status = filters.status;
    }

    if (filters?.date) {
      whereReport.reportDate = normalizeWorkDate(filters.date);
    }

    const reports = await prisma.dailyReport.findMany({
      where: whereReport,
      include: {
        recruiterProfile: {
          select: { fullName: true, candidateId: true },
        },
        clientBreakdowns: true,
        revisions: {
          orderBy: { revisionNumber: "desc" },
        },
      },
      orderBy: { reportDate: "desc" },
    });

    return reports;
  } catch (error) {
    console.error("getManagerReports error:", error);
    return [];
  }
}

/**
 * Retrieves dedicated Approval Queue for reports pending review.
 */
export async function getManagerApprovalsQueue(override?: ManagerOverride) {
  try {
    const manager = await getAuthenticatedManager(override);
    if (!manager) return [];

    const whereTeam: { managerId?: string } = {};
    if (manager.role === "MANAGER") {
      whereTeam.managerId = manager.id;
    }

    const teamProfiles = await prisma.candidateProfile.findMany({
      where: whereTeam,
      select: { id: true },
    });
    const teamRecruiterIds = teamProfiles.map((p) => p.id);

    return await prisma.dailyReport.findMany({
      where: {
        recruiterProfileId: { in: teamRecruiterIds },
        status: "SUBMITTED",
      },
      include: {
        recruiterProfile: {
          select: { id: true, fullName: true, candidateId: true },
        },
        clientBreakdowns: true,
        revisions: true,
      },
      orderBy: { submittedAt: "desc" },
    });
  } catch (error) {
    console.error("getManagerApprovalsQueue error:", error);
    return [];
  }
}

/**
 * Reviews a team member's daily report (APPROVE or RETURN).
 * Enforces:
 * 1. Self-approval prevention (recruiters cannot review/approve their own reports).
 * 2. Strict Team Isolation (managers can only approve reports of recruiters assigned to their team).
 * 3. Mandatory feedback comment when returning a report for revision.
 * 4. Storing submitted_at, reviewed_at, approved_at, reviewer identity, and revision snapshots.
 */
export async function reviewTeamReport(
  params: {
    reportId: string;
    action: "APPROVE" | "RETURN";
    managerNotes?: string;
  },
  override?: ManagerOverride
): Promise<ActionResponse<{ reportId: string; status: string }>> {
  try {
    const manager = await getAuthenticatedManager(override);
    if (!manager) {
      return { success: false, message: "Unauthorized. Manager or Admin access required." };
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id: params.reportId },
      include: {
        recruiterProfile: {
          select: { id: true, userId: true, fullName: true, managerId: true },
        },
        revisions: { orderBy: { revisionNumber: "desc" }, take: 1 },
      },
    });

    if (!report) {
      return { success: false, message: "Daily report not found." };
    }

    // 1. Self-approval prevention: recruiter cannot approve own report
    if (report.recruiterProfile.userId === manager.id) {
      return {
        success: false,
        message: "Unauthorized. Recruiters are strictly prohibited from reviewing or approving their own reports.",
      };
    }

    // 2. Team Isolation enforcement: manager can only review assigned recruiters
    if (manager.role === "MANAGER") {
      if (report.recruiterProfile.managerId !== manager.id) {
        return {
          success: false,
          message: "Unauthorized. This recruiter is not assigned to your team.",
        };
      }
    }

    // 3. Validation: Mandatory comment when returning
    if (params.action === "RETURN" && (!params.managerNotes || params.managerNotes.trim().length === 0)) {
      return {
        success: false,
        message: "Manager feedback comment is mandatory when returning a report for revision.",
      };
    }

    const now = new Date();
    const nextStatus = params.action === "APPROVE" ? "APPROVED" : "RETURNED";
    const comment = params.managerNotes?.trim() || null;

    // 4. Update DailyReport
    const updated = await prisma.dailyReport.update({
      where: { id: report.id },
      data: {
        status: nextStatus,
        reviewedAt: now,
        approvedAt: nextStatus === "APPROVED" ? now : null,
        reviewedByUserId: manager.id,
        reviewedByName: manager.name || manager.email,
        managerNotes: comment,
      },
    });

    // 5. Update latest revision or create approval/return snapshot
    const latestRevision = report.revisions[0];
    const nextRevNum = (latestRevision?.revisionNumber || 1) + 1;

    await prisma.dailyReportRevision.create({
      data: {
        dailyReportId: report.id,
        revisionNumber: nextRevNum,
        status: nextStatus,
        metricsSnapshot: latestRevision?.metricsSnapshot || JSON.stringify({ status: nextStatus }),
        managerNotes: comment,
        submittedAt: report.submittedAt || now,
      },
    });

    // 6. Record Audit Log
    await recordAuditLog({
      userId: manager.id,
      action: nextStatus === "APPROVED" ? "REPORT_APPROVED" : "REPORT_RETURNED",
      targetType: "REPORT",
      targetId: report.id,
      details: {
        recruiterName: report.recruiterProfile.fullName,
        decision: nextStatus,
        managerNotes: comment,
        reviewedBy: manager.email,
        approvedAt: nextStatus === "APPROVED" ? now : null,
      },
    });

    safeRevalidate("/manager");
    safeRevalidate("/manager/approvals");
    safeRevalidate("/manager/reports");
    safeRevalidate("/workspace/report");

    return {
      success: true,
      message:
        nextStatus === "APPROVED"
          ? `Report for ${report.recruiterProfile.fullName} approved successfully.`
          : `Report for ${report.recruiterProfile.fullName} returned with revision instructions.`,
      data: { reportId: updated.id, status: nextStatus },
    };
  } catch (error) {
    console.error("reviewTeamReport error:", error);
    return { success: false, message: "Failed to process report review." };
  }
}
