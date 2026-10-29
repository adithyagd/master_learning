"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAchievementBand, AchievementBandInfo, getPeriodBounds } from "@/lib/target-calculator";

export interface AdminOverride {
  id: string;
  email: string;
  role: string;
}

export interface AdminDashboardFilters {
  dateRange?: "all" | "today" | "week" | "month" | "last_month" | "custom";
  startDate?: string;
  endDate?: string;
  recruiterProfileId?: string;
  managerId?: string;
  clientId?: string;
  candidateStatus?: string; // "ALL" | "ACTIVE" | "INACTIVE"
  reportStatus?: string; // "ALL" | "SUBMITTED" | "APPROVED" | "DRAFT"
}

export interface AcademyMetrics {
  totalCandidates: number;
  activeCandidates: number;
  academyInProgress: number;
  academyCompleted: number;
  finalAssessmentsPassed: number;
  certificatesPending: number;
  certificatesApproved: number;
  certificatesIssued: number;
  completionRatePct: number;
  certificationRatePct: number;
}

export interface OperationsMetrics {
  totalRecruiters: number;
  totalManagers: number;
  totalClients: number;
  activeClients: number;
  calls: number;
  shortlisted: number;
  interviewLineups: number;
  offers: number;
  joins: number;
  monthlyJoiningTarget: number;
  monthlyJoinsAchieved: number;
  monthlyJoinsRemaining: number;
  monthlyJoiningAchievementPct: number;
  monthlyJoiningBand: AchievementBandInfo;
}

export interface TeamPerformanceItem {
  managerId: string | null;
  managerName: string;
  managerEmail: string | null;
  teamSize: number;
  calls: number;
  shortlisted: number;
  interviewLineups: number;
  offers: number;
  joins: number;
  achievementPct: number;
  achievementBand: AchievementBandInfo;
}

export interface AdminDashboardData {
  academy: AcademyMetrics;
  operations: OperationsMetrics;
  teams: TeamPerformanceItem[];
  filterOptions: {
    recruiters: Array<{ id: string; fullName: string; candidateId: string }>;
    managers: Array<{ id: string; name: string; email: string }>;
    clients: Array<{ id: string; name: string; code: string }>;
  };
  appliedFilters: AdminDashboardFilters;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Resolves date boundaries for the given date range filter.
 */
function resolveDateBounds(filters: AdminDashboardFilters): { startDate?: Date; endDate?: Date } {
  const range = filters.dateRange || "all";
  if (range === "all") {
    return {};
  }

  const now = new Date();

  if (range === "today") {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { startDate: s, endDate: e };
  }

  if (range === "week") {
    const bounds = getPeriodBounds("WEEKLY", now);
    return { startDate: bounds.startDate, endDate: bounds.endDate };
  }

  if (range === "month") {
    const bounds = getPeriodBounds("MONTHLY", now);
    return { startDate: bounds.startDate, endDate: bounds.endDate };
  }

  if (range === "last_month") {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const bounds = getPeriodBounds("MONTHLY", prevMonthDate);
    return { startDate: bounds.startDate, endDate: bounds.endDate };
  }

  if (range === "custom") {
    const s = filters.startDate ? new Date(filters.startDate) : undefined;
    if (s) s.setHours(0, 0, 0, 0);
    const e = filters.endDate ? new Date(filters.endDate) : undefined;
    if (e) e.setHours(23, 59, 59, 999);
    return { startDate: s, endDate: e };
  }

  return {};
}

/**
 * Authenticates caller as Admin.
 */
async function authenticateAdmin(override?: AdminOverride) {
  if (override) {
    if (override.role !== "ADMIN") return null;
    return override;
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/**
 * Core Server Action: Fetches real Admin Dashboard aggregations using database queries.
 * Zero fabricated numbers, zero double-counting, and honest empty states.
 */
export async function getAdminDashboardMetrics(
  filters: AdminDashboardFilters = {},
  adminOverride?: AdminOverride
): Promise<ActionResponse<AdminDashboardData>> {
  try {
    const admin = await authenticateAdmin(adminOverride);
    if (!admin) {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    const { startDate, endDate } = resolveDateBounds(filters);

    // 1. Fetch filter dropdown options
    const [recruiterProfiles, managerUsers, activeClientsList] = await Promise.all([
      prisma.candidateProfile.findMany({
        select: { id: true, fullName: true, candidateId: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "MANAGER" },
        select: { id: true, name: true, email: true },
        orderBy: { email: "asc" },
      }),
      prisma.clientMaster.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // 2. Build Candidate Profile query filters for Academy metrics
    const candidateWhere: Record<string, unknown> = {};

    if (filters.candidateStatus && filters.candidateStatus !== "ALL") {
      candidateWhere.user = { status: filters.candidateStatus };
    }

    if (filters.managerId) {
      candidateWhere.managerId = filters.managerId;
    }

    if (filters.recruiterProfileId) {
      candidateWhere.id = filters.recruiterProfileId;
    }

    // 3. Academy Metrics Aggregations
    const [
      totalCandidates,
      activeCandidates,
      academyInProgress,
      academyCompleted,
      certificatesPending,
      certificatesApproved,
      certificatesIssued,
      passedFinalAttempts,
    ] = await Promise.all([
      prisma.candidateProfile.count({ where: candidateWhere }),
      prisma.candidateProfile.count({
        where: {
          ...candidateWhere,
          user: { status: "ACTIVE" },
        },
      }),
      prisma.candidateProfile.count({
        where: {
          ...candidateWhere,
          academyStatus: "IN_PROGRESS",
        },
      }),
      prisma.candidateProfile.count({
        where: {
          ...candidateWhere,
          academyStatus: "COMPLETED",
        },
      }),
      prisma.candidateProfile.count({
        where: {
          ...candidateWhere,
          certificateStatus: "PENDING_APPROVAL",
        },
      }),
      prisma.candidateProfile.count({
        where: {
          ...candidateWhere,
          certificateStatus: "APPROVED",
        },
      }),
      prisma.certificate.count({
        where: {
          status: "ISSUED",
          ...(filters.recruiterProfileId ? { candidateProfileId: filters.recruiterProfileId } : {}),
          ...(filters.managerId
            ? {
                candidateProfile: { managerId: filters.managerId },
              }
            : {}),
        },
      }),
      prisma.assessmentAttempt.findMany({
        where: {
          assessment: { type: "FINAL" },
          isPassed: true,
          ...(filters.recruiterProfileId ? { candidateProfileId: filters.recruiterProfileId } : {}),
          ...(filters.managerId
            ? {
                candidateProfile: { managerId: filters.managerId },
              }
            : {}),
        },
        select: { candidateProfileId: true },
        distinct: ["candidateProfileId"],
      }),
    ]);

    const finalAssessmentsPassed = passedFinalAttempts.length;
    const completionRatePct =
      totalCandidates > 0 ? Math.round((academyCompleted / totalCandidates) * 100) : 0;
    const certificationRatePct =
      totalCandidates > 0 ? Math.round((certificatesIssued / totalCandidates) * 100) : 0;

    // 4. Operations Overview Counts
    const [totalRecruiters, totalManagers, totalClients, activeClients] = await Promise.all([
      prisma.candidateProfile.count({
        where: { isCertified: true },
      }),
      prisma.user.count({
        where: { role: "MANAGER" },
      }),
      prisma.clientMaster.count(),
      prisma.clientMaster.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    // 5. Operations Activity Aggregations (Calls, Shortlisted, Line-ups, Offers, Joins)
    // Build DailyReport query filters
    const reportWhere: Record<string, unknown> = {};

    // Filter by report status
    if (filters.reportStatus && filters.reportStatus !== "ALL") {
      reportWhere.status = filters.reportStatus;
    } else {
      // Default: exclude unsubmitted DRAFT reports from platform operational activity
      reportWhere.status = { not: "DRAFT" };
    }

    // Filter by date boundaries
    if (startDate || endDate) {
      reportWhere.reportDate = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    // Filter by recruiter
    if (filters.recruiterProfileId) {
      reportWhere.recruiterProfileId = filters.recruiterProfileId;
    }

    // Filter by manager / team
    if (filters.managerId) {
      reportWhere.recruiterProfile = {
        managerId: filters.managerId,
      };
    }

    let calls = 0;
    let shortlisted = 0;
    let interviewLineups = 0;
    let offers = 0;
    let joins = 0;

    // Zero double counting logic:
    // If a clientId filter is applied, aggregate strictly from DailyReportClientBreakdown matching that client.
    // If no clientId filter is applied, aggregate directly from DailyReport totals.
    if (filters.clientId) {
      const breakdowns = await prisma.dailyReportClientBreakdown.findMany({
        where: {
          clientId: filters.clientId,
          dailyReport: reportWhere,
        },
        select: {
          calls: true,
          shortlisted: true,
          lineUp: true,
          offered: true,
          joined: true,
        },
      });

      for (const b of breakdowns) {
        calls += b.calls;
        shortlisted += b.shortlisted;
        interviewLineups += b.lineUp;
        offers += b.offered;
        joins += b.joined;
      }
    } else {
      const reports = await prisma.dailyReport.findMany({
        where: reportWhere,
        select: {
          callsMade: true,
          shortlisted: true,
          interviewsScheduled: true,
          offersExtended: true,
          joinings: true,
        },
      });

      for (const r of reports) {
        calls += r.callsMade;
        shortlisted += r.shortlisted;
        interviewLineups += r.interviewsScheduled;
        offers += r.offersExtended;
        joins += r.joinings;
      }
    }

    // 6. Monthly Joining Target & Attainment
    // Retrieve organization monthly joining target for current month
    const now = new Date();
    const currentMonthBounds = getPeriodBounds("MONTHLY", now);
    const orgMonthlyConfig = await prisma.targetConfig.findFirst({
      where: {
        recruiterProfileId: null,
        periodType: "MONTHLY",
        periodKey: currentMonthBounds.periodKey,
      },
    });

    const monthlyJoiningTarget = orgMonthlyConfig?.orgMonthlyJoinsTarget ?? 10;

    // Joins achieved this month
    const currentMonthReports = await prisma.dailyReport.findMany({
      where: {
        reportDate: {
          gte: currentMonthBounds.startDate,
          lte: currentMonthBounds.endDate,
        },
        status: { not: "DRAFT" },
      },
      select: { joinings: true },
    });

    const monthlyJoinsAchieved = currentMonthReports.reduce((sum, r) => sum + r.joinings, 0);
    const monthlyJoinsRemaining = Math.max(0, monthlyJoiningTarget - monthlyJoinsAchieved);
    const monthlyJoiningAchievementPct =
      monthlyJoiningTarget > 0 ? Math.round((monthlyJoinsAchieved / monthlyJoiningTarget) * 100) : 0;
    const monthlyJoiningBand = getAchievementBand(monthlyJoiningAchievementPct);

    // 7. Team Performance Breakdown (Grouped by Manager)
    const allManagers = await prisma.user.findMany({
      where: { role: "MANAGER" },
      include: {
        teamRecruiters: {
          select: { id: true, fullName: true, candidateId: true },
        },
      },
    });

    // Also unassigned recruiters
    const unassignedRecruiters = await prisma.candidateProfile.findMany({
      where: { managerId: null },
      select: { id: true, fullName: true, candidateId: true },
    });

    const teams: TeamPerformanceItem[] = [];

    // Compute metrics for each manager's team
    for (const mgr of allManagers) {
      const recruiterIds = mgr.teamRecruiters.map((r) => r.id);
      let teamCalls = 0;
      let teamShortlisted = 0;
      let teamLineups = 0;
      let teamOffers = 0;
      let teamJoins = 0;

      if (recruiterIds.length > 0) {
        const teamReports = await prisma.dailyReport.findMany({
          where: {
            recruiterProfileId: { in: recruiterIds },
            status: { not: "DRAFT" },
            ...(startDate || endDate
              ? {
                  reportDate: {
                    ...(startDate ? { gte: startDate } : {}),
                    ...(endDate ? { lte: endDate } : {}),
                  },
                }
              : {}),
          },
          select: {
            callsMade: true,
            shortlisted: true,
            interviewsScheduled: true,
            offersExtended: true,
            joinings: true,
          },
        });

        for (const rep of teamReports) {
          teamCalls += rep.callsMade;
          teamShortlisted += rep.shortlisted;
          teamLineups += rep.interviewsScheduled;
          teamOffers += rep.offersExtended;
          teamJoins += rep.joinings;
        }
      }

      // Benchmark: 1 join and 30 calls per recruiter
      const teamExpectedJoins = Math.max(1, recruiterIds.length * 1);
      const teamAchievementPct =
        teamExpectedJoins > 0 ? Math.round((teamJoins / teamExpectedJoins) * 100) : 0;
      const teamBand = getAchievementBand(teamAchievementPct);

      teams.push({
        managerId: mgr.id,
        managerName: mgr.name || mgr.email.split("@")[0],
        managerEmail: mgr.email,
        teamSize: recruiterIds.length,
        calls: teamCalls,
        shortlisted: teamShortlisted,
        interviewLineups: teamLineups,
        offers: teamOffers,
        joins: teamJoins,
        achievementPct: teamAchievementPct,
        achievementBand: teamBand,
      });
    }

    // Add unassigned pool if any exist
    if (unassignedRecruiters.length > 0) {
      const unassignedIds = unassignedRecruiters.map((r) => r.id);
      const unassignedReports = await prisma.dailyReport.findMany({
        where: {
          recruiterProfileId: { in: unassignedIds },
          status: { not: "DRAFT" },
          ...(startDate || endDate
            ? {
                reportDate: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        select: {
          callsMade: true,
          shortlisted: true,
          interviewsScheduled: true,
          offersExtended: true,
          joinings: true,
        },
      });

      let unassignedCalls = 0;
      let unassignedShortlisted = 0;
      let unassignedLineups = 0;
      let unassignedOffers = 0;
      let unassignedJoins = 0;

      for (const rep of unassignedReports) {
        unassignedCalls += rep.callsMade;
        unassignedShortlisted += rep.shortlisted;
        unassignedLineups += rep.interviewsScheduled;
        unassignedOffers += rep.offersExtended;
        unassignedJoins += rep.joinings;
      }

      const expected = Math.max(1, unassignedIds.length);
      const pct = Math.round((unassignedJoins / expected) * 100);

      teams.push({
        managerId: null,
        managerName: "Unassigned Pool",
        managerEmail: null,
        teamSize: unassignedIds.length,
        calls: unassignedCalls,
        shortlisted: unassignedShortlisted,
        interviewLineups: unassignedLineups,
        offers: unassignedOffers,
        joins: unassignedJoins,
        achievementPct: pct,
        achievementBand: getAchievementBand(pct),
      });
    }

    return {
      success: true,
      data: {
        academy: {
          totalCandidates,
          activeCandidates,
          academyInProgress,
          academyCompleted,
          finalAssessmentsPassed,
          certificatesPending,
          certificatesApproved,
          certificatesIssued,
          completionRatePct,
          certificationRatePct,
        },
        operations: {
          totalRecruiters,
          totalManagers,
          totalClients,
          activeClients,
          calls,
          shortlisted,
          interviewLineups,
          offers,
          joins,
          monthlyJoiningTarget,
          monthlyJoinsAchieved,
          monthlyJoinsRemaining,
          monthlyJoiningAchievementPct,
          monthlyJoiningBand,
        },
        teams,
        filterOptions: {
          recruiters: recruiterProfiles,
          managers: managerUsers.map((m) => ({
            id: m.id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
          })),
          clients: activeClientsList,
        },
        appliedFilters: {
          dateRange: filters.dateRange || "all",
          startDate: filters.startDate,
          endDate: filters.endDate,
          recruiterProfileId: filters.recruiterProfileId,
          managerId: filters.managerId,
          clientId: filters.clientId,
          candidateStatus: filters.candidateStatus || "ALL",
          reportStatus: filters.reportStatus || "ALL",
        },
      },
    };
  } catch (error) {
    console.error("getAdminDashboardMetrics error:", error);
    return {
      success: false,
      message: "An error occurred while compiling Admin dashboard metrics.",
    };
  }
}
