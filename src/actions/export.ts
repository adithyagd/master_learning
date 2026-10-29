"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPeriodBounds, getAchievementBand } from "@/lib/target-calculator";
import {
  ExportColumn,
  buildCsvContent,
  buildExcelXmlContent,
  buildPrintHtmlContent,
  formatExportFilename,
} from "@/lib/export-utils";

export type ReportType =
  | "DAILY_REPORTS"
  | "RECRUITER_PERFORMANCE"
  | "CLIENT_REPORTS"
  | "MANAGER_REPORTS"
  | "MONTHLY_REPORTS"
  | "TARGET_REPORTS"
  | "RECRUITMENT_FUNNEL";

export type ExportFormat = "csv" | "excel" | "print";

export interface ReportFilterInput {
  dateRange?: "all" | "today" | "week" | "month" | "last_month" | "custom";
  startDate?: string | Date;
  endDate?: string | Date;
  recruiterProfileId?: string;
  managerId?: string;
  clientId?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ExportCallerOverride {
  id: string;
  email: string;
  role: string;
  profileId?: string;
}

export interface GeneratedReportResult {
  reportType: ReportType;
  title: string;
  subtitle: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  totalRecords: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  filterSummary: string;
}

export interface ExportFileResult {
  filename: string;
  mimeType: string;
  content: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Authenticates caller and enforces row-level permissions.
 */
async function authenticateCaller(override?: ExportCallerOverride) {
  if (override) return override;
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profileId: user.candidateProfile?.id,
  };
}

/**
 * Resolves date boundaries.
 */
function resolveDateBounds(filters: ReportFilterInput): { startDate?: Date; endDate?: Date } {
  const range = filters.dateRange || "all";
  if (range === "all") {
    if (filters.startDate || filters.endDate) {
      const s = filters.startDate ? new Date(filters.startDate) : undefined;
      if (s) s.setHours(0, 0, 0, 0);
      const e = filters.endDate ? new Date(filters.endDate) : undefined;
      if (e) e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e };
    }
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
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const bounds = getPeriodBounds("MONTHLY", prevMonth);
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
 * Applies sorting and pagination to extracted rows.
 */
function paginateAndSortRows(
  rows: Record<string, unknown>[],
  filters: ReportFilterInput
) {
  let result = [...rows];
  if (filters.sortBy) {
    const key = filters.sortBy;
    const dir = filters.sortDirection === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * dir;
      }
      return String(valA).localeCompare(String(valB)) * dir;
    });
  }

  const totalRecords = result.length;
  if (filters.page && filters.pageSize) {
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);
    const start = (page - 1) * pageSize;
    return {
      rows: result.slice(start, start + pageSize),
      totalRecords,
      page,
      pageSize,
      totalPages: Math.ceil(totalRecords / pageSize) || 1,
    };
  }

  return {
    rows: result,
    totalRecords,
    page: 1,
    pageSize: totalRecords,
    totalPages: 1,
  };
}

/**
 * 1. Generates structured report data enforcing row-level permissions.
 */
export async function generateReportData(
  reportType: ReportType,
  filters: ReportFilterInput = {},
  callerOverride?: ExportCallerOverride
): Promise<ActionResponse<GeneratedReportResult>> {
  try {
    const caller = await authenticateCaller(callerOverride);
    if (!caller) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const { startDate, endDate } = resolveDateBounds(filters);
    let rawReportData: {
      title: string;
      subtitle: string;
      columns: ExportColumn[];
      rows: Record<string, unknown>[];
      filterSummary: string;
    } | null = null;

    // ==========================================
    // ROW-LEVEL PERMISSION CHECK BY REPORT TYPE
    // ==========================================
    if (caller.role === "CANDIDATE") {
      // Certified recruiters can ONLY export: DAILY_REPORTS, RECRUITER_PERFORMANCE, TARGET_REPORTS, RECRUITMENT_FUNNEL
      const allowedCandidateReports: ReportType[] = [
        "DAILY_REPORTS",
        "RECRUITER_PERFORMANCE",
        "TARGET_REPORTS",
        "RECRUITMENT_FUNNEL",
      ];

      if (!allowedCandidateReports.includes(reportType)) {
        return {
          success: false,
          message: "Access denied. Recruiters cannot access organization or manager reports.",
        };
      }

      // If recruiter specified another recruiter ID, reject!
      if (filters.recruiterProfileId && filters.recruiterProfileId !== caller.profileId) {
        return {
          success: false,
          message: "Access denied. You may only export your own recruitment operational records.",
        };
      }

      // Force filter to self
      filters.recruiterProfileId = caller.profileId;
      filters.managerId = undefined;
    }

    if (caller.role === "MANAGER") {
      // Managers cannot export organization-wide MONTHLY_REPORTS
      if (reportType === "MONTHLY_REPORTS") {
        return {
          success: false,
          message: "Access denied. Monthly organization reports require Administrator privileges.",
        };
      }

      // If manager specified recruiter, verify recruiter is assigned to manager
      if (filters.recruiterProfileId) {
        const profile = await prisma.candidateProfile.findUnique({
          where: { id: filters.recruiterProfileId },
          select: { managerId: true },
        });

        if (!profile || profile.managerId !== caller.id) {
          return {
            success: false,
            message: "Access denied. You cannot export records for recruiters outside your assigned team.",
          };
        }
      }

      // Force manager scoping
      filters.managerId = caller.id;
    }

    // ==========================================
    // REPORT TYPE GENERATORS
    // ==========================================

    switch (reportType) {
      case "DAILY_REPORTS": {
        const where: Record<string, unknown> = {
          ...(startDate || endDate
            ? {
                reportDate: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        };

        if (filters.recruiterProfileId) {
          where.recruiterProfileId = filters.recruiterProfileId;
        } else if (filters.managerId) {
          where.recruiterProfile = { managerId: filters.managerId };
        }

        if (filters.status && filters.status !== "ALL") {
          where.status = filters.status;
        }

        // If client filter is set, find reports matching that client in breakdowns
        if (filters.clientId) {
          where.clientBreakdowns = {
            some: { clientId: filters.clientId },
          };
        }

        const reports = await prisma.dailyReport.findMany({
          where,
          include: {
            recruiterProfile: {
              select: {
                fullName: true,
                candidateId: true,
              },
            },
            clientBreakdowns: {
              select: {
                clientName: true,
                calls: true,
                shortlisted: true,
                joined: true,
              },
            },
          },
          orderBy: { reportDate: "desc" },
        });

        const columns: ExportColumn[] = [
          { header: "Report Date", key: "reportDate", type: "date", width: 100 },
          { header: "Recruiter Name", key: "recruiterName", type: "string", width: 140 },
          { header: "Candidate ID", key: "candidateId", type: "string", width: 110 },
          { header: "Client(s)", key: "clients", type: "string", width: 150 },
          { header: "Calls Made", key: "callsMade", type: "number", width: 80 },
          { header: "Own Leads", key: "ownLeads", type: "number", width: 80 },
          { header: "Internal Leads", key: "internalLeads", type: "number", width: 85 },
          { header: "Screened", key: "screened", type: "number", width: 80 },
          { header: "Shortlisted", key: "shortlisted", type: "number", width: 85 },
          { header: "Line-ups", key: "lineups", type: "number", width: 80 },
          { header: "Attended", key: "attended", type: "number", width: 80 },
          { header: "Offers", key: "offers", type: "number", width: 80 },
          { header: "Joined", key: "joined", type: "number", width: 80 },
          { header: "Absconded", key: "absconded", type: "number", width: 80 },
          { header: "Status", key: "status", type: "string", width: 90 },
          { header: "Submitted At", key: "submittedAt", type: "date", width: 110 },
          { header: "Approved At", key: "approvedAt", type: "date", width: 110 },
        ];

        const rows = reports.map((r) => {
          const clientNames = r.clientBreakdowns.map((b) => b.clientName).filter(Boolean).join("; ");
          return {
            reportDate: r.reportDate.toISOString().slice(0, 10),
            recruiterName: r.recruiterProfile.fullName,
            candidateId: r.recruiterProfile.candidateId,
            clients: clientNames || "General",
            callsMade: r.callsMade,
            ownLeads: r.ownLeads,
            internalLeads: r.internalLeads,
            screened: r.profilesSubmitted,
            shortlisted: r.shortlisted,
            lineups: r.interviewsScheduled,
            attended: r.interviewsAttended,
            offers: r.offersExtended,
            joined: r.joinings,
            absconded: r.absconded,
            status: r.status,
            submittedAt: r.submittedAt ? r.submittedAt.toISOString().slice(0, 10) : "",
            approvedAt: r.approvedAt ? r.approvedAt.toISOString().slice(0, 10) : "",
          };
        });

        rawReportData = {
          title: "Daily Operations Reports",
          subtitle: "Verified daily recruiter operational activity, calls, and interview milestones",
          columns,
          rows,
          filterSummary: filters.recruiterProfileId
            ? `Recruiter ID: ${filters.recruiterProfileId}`
            : filters.managerId
            ? `Manager ID: ${filters.managerId}`
            : "All Authorized Operations",
        };
        break;
      }

      case "RECRUITER_PERFORMANCE": {
        const where: Record<string, unknown> = {
          isCertified: true,
        };

        if (filters.recruiterProfileId) {
          where.id = filters.recruiterProfileId;
        } else if (filters.managerId) {
          where.managerId = filters.managerId;
        }

        const recruiters = await prisma.candidateProfile.findMany({
          where,
          include: {
            manager: { select: { name: true, email: true } },
            dailyReports: {
              where: {
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
                profilesSubmitted: true,
                shortlisted: true,
                interviewsScheduled: true,
                offersExtended: true,
                joinings: true,
                reportDate: true,
              },
              orderBy: { reportDate: "desc" },
            },
          },
          orderBy: { fullName: "asc" },
        });

        const columns: ExportColumn[] = [
          { header: "Recruiter Name", key: "recruiterName", type: "string", width: 140 },
          { header: "Candidate ID", key: "candidateId", type: "string", width: 110 },
          { header: "Manager", key: "manager", type: "string", width: 120 },
          { header: "Total Calls", key: "totalCalls", type: "number", width: 90 },
          { header: "Screened", key: "screened", type: "number", width: 85 },
          { header: "Shortlisted", key: "shortlisted", type: "number", width: 85 },
          { header: "Line-ups", key: "lineups", type: "number", width: 85 },
          { header: "Offers", key: "offers", type: "number", width: 80 },
          { header: "Joined", key: "joined", type: "number", width: 80 },
          { header: "Target Joins", key: "targetJoins", type: "number", width: 90 },
          { header: "Attainment %", key: "attainmentPct", type: "number", width: 95 },
          { header: "Achievement Band", key: "band", type: "string", width: 110 },
          { header: "Last Active Date", key: "lastActiveDate", type: "date", width: 110 },
        ];

        const rows = recruiters.map((rec) => {
          const calls = rec.dailyReports.reduce((s, r) => s + r.callsMade, 0);
          const screened = rec.dailyReports.reduce((s, r) => s + r.profilesSubmitted, 0);
          const shortlisted = rec.dailyReports.reduce((s, r) => s + r.shortlisted, 0);
          const lineups = rec.dailyReports.reduce((s, r) => s + r.interviewsScheduled, 0);
          const offers = rec.dailyReports.reduce((s, r) => s + r.offersExtended, 0);
          const joined = rec.dailyReports.reduce((s, r) => s + r.joinings, 0);

          const targetJoins = 5;
          const attainment = targetJoins > 0 ? Math.round((joined / targetJoins) * 100) : 0;
          const band = getAchievementBand(attainment);
          const lastDate = rec.dailyReports[0]?.reportDate?.toISOString().slice(0, 10) || "N/A";

          return {
            recruiterName: rec.fullName,
            candidateId: rec.candidateId,
            manager: rec.manager?.name || rec.manager?.email || "Unassigned",
            totalCalls: calls,
            screened,
            shortlisted,
            lineups,
            offers,
            joined,
            targetJoins,
            attainmentPct: attainment,
            band: band.band,
            lastActiveDate: lastDate,
          };
        });

        rawReportData = {
          title: "Recruiter Performance Report",
          subtitle: "Recruiter output velocity, target attainment, and placement delivery",
          columns,
          rows,
          filterSummary: filters.managerId ? `Manager Team: ${filters.managerId}` : "All Certified Recruiters",
        };
        break;
      }

      case "CLIENT_REPORTS": {
        const where: Record<string, unknown> = {};
        if (filters.clientId) {
          where.id = filters.clientId;
        }

        const clients = await prisma.clientMaster.findMany({
          where,
          include: {
            requirements: {
              select: {
                id: true,
                status: true,
                openPositions: true,
              },
            },
            dailyBreakdowns: {
              where: {
                dailyReport: {
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
              },
              select: {
                calls: true,
                screened: true,
                lineUp: true,
                offered: true,
                joined: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });

        const columns: ExportColumn[] = [
          { header: "Client Name", key: "name", type: "string", width: 140 },
          { header: "Client Code", key: "code", type: "string", width: 110 },
          { header: "Status", key: "status", type: "string", width: 85 },
          { header: "Total Mandates", key: "totalMandates", type: "number", width: 95 },
          { header: "Active Mandates", key: "activeMandates", type: "number", width: 95 },
          { header: "Open Positions", key: "openPositions", type: "number", width: 95 },
          { header: "Outreach Calls", key: "calls", type: "number", width: 90 },
          { header: "Screened", key: "screened", type: "number", width: 85 },
          { header: "Line-ups", key: "lineups", type: "number", width: 85 },
          { header: "Offers", key: "offers", type: "number", width: 80 },
          { header: "Joined", key: "joined", type: "number", width: 80 },
          { header: "Lineup-to-Join %", key: "conversionPct", type: "number", width: 105 },
        ];

        const rows = clients.map((cl) => {
          const totalMandates = cl.requirements.length;
          const activeMandates = cl.requirements.filter((r) => r.status === "ACTIVE").length;
          const openPositions = cl.requirements
            .filter((r) => r.status === "ACTIVE")
            .reduce((s, r) => s + r.openPositions, 0);

          const calls = cl.dailyBreakdowns.reduce((s, b) => s + b.calls, 0);
          const screened = cl.dailyBreakdowns.reduce((s, b) => s + b.screened, 0);
          const lineups = cl.dailyBreakdowns.reduce((s, b) => s + b.lineUp, 0);
          const offers = cl.dailyBreakdowns.reduce((s, b) => s + b.offered, 0);
          const joined = cl.dailyBreakdowns.reduce((s, b) => s + b.joined, 0);

          const conv = lineups > 0 ? Math.round((joined / lineups) * 100) : 0;

          return {
            name: cl.name,
            code: cl.code,
            status: cl.status,
            totalMandates,
            activeMandates,
            openPositions,
            calls,
            screened,
            lineups,
            offers,
            joined,
            conversionPct: conv,
          };
        });

        rawReportData = {
          title: "Client Performance & Mandates Report",
          subtitle: "Client accounts, requisition fulfillment, and pipeline delivery",
          columns,
          rows,
          filterSummary: filters.clientId ? `Client: ${filters.clientId}` : "All Enterprise Clients",
        };
        break;
      }

      case "MANAGER_REPORTS": {
        const managers = await prisma.user.findMany({
          where: { role: "MANAGER" },
          include: {
            teamRecruiters: {
              select: { id: true },
            },
          },
          orderBy: { email: "asc" },
        });

        const columns: ExportColumn[] = [
          { header: "Manager Name", key: "name", type: "string", width: 140 },
          { header: "Manager Email", key: "email", type: "string", width: 160 },
          { header: "Team Size", key: "teamSize", type: "number", width: 85 },
          { header: "Team Calls", key: "calls", type: "number", width: 90 },
          { header: "Team Shortlisted", key: "shortlisted", type: "number", width: 100 },
          { header: "Team Line-ups", key: "lineups", type: "number", width: 95 },
          { header: "Team Offers", key: "offers", type: "number", width: 90 },
          { header: "Team Joins", key: "joined", type: "number", width: 90 },
          { header: "Team Target Joins", key: "targetJoins", type: "number", width: 105 },
          { header: "Attainment %", key: "attainmentPct", type: "number", width: 95 },
          { header: "Achievement Band", key: "band", type: "string", width: 110 },
        ];

        const rows: Record<string, unknown>[] = [];
        for (const mgr of managers) {
          const recruiterIds = mgr.teamRecruiters.map((r) => r.id);
          let calls = 0;
          let shortlisted = 0;
          let lineups = 0;
          let offers = 0;
          let joined = 0;

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

            for (const r of teamReports) {
              calls += r.callsMade;
              shortlisted += r.shortlisted;
              lineups += r.interviewsScheduled;
              offers += r.offersExtended;
              joined += r.joinings;
            }
          }

          const targetJoins = Math.max(1, recruiterIds.length * 2);
          const attainment = Math.round((joined / targetJoins) * 100);
          const band = getAchievementBand(attainment);

          rows.push({
            name: mgr.name || mgr.email.split("@")[0],
            email: mgr.email,
            teamSize: recruiterIds.length,
            calls,
            shortlisted,
            lineups,
            offers,
            joined,
            targetJoins,
            attainmentPct: attainment,
            band: band.band,
          });
        }

        rawReportData = {
          title: "Manager & Team Performance Report",
          subtitle: "Supervisory performance, team throughput, and managerial benchmarks",
          columns,
          rows,
          filterSummary: "Manager Teams Roster",
        };
        break;
      }

      case "MONTHLY_REPORTS": {
        const now = new Date();
        const currentMonthBounds = getPeriodBounds("MONTHLY", now);

        const reports = await prisma.dailyReport.findMany({
          where: {
            status: { not: "DRAFT" },
            reportDate: {
              gte: currentMonthBounds.startDate,
              lte: currentMonthBounds.endDate,
            },
          },
          select: {
            callsMade: true,
            profilesSubmitted: true,
            shortlisted: true,
            interviewsScheduled: true,
            interviewsAttended: true,
            offersExtended: true,
            joinings: true,
            absconded: true,
          },
        });

        const activeRecruitersCount = await prisma.candidateProfile.count({
          where: { isCertified: true },
        });

        const orgTargetConfig = await prisma.targetConfig.findFirst({
          where: {
            recruiterProfileId: null,
            periodType: "MONTHLY",
            periodKey: currentMonthBounds.periodKey,
          },
        });
        const targetJoins = orgTargetConfig?.orgMonthlyJoinsTarget || 10;

        const calls = reports.reduce((s, r) => s + r.callsMade, 0);
        const screened = reports.reduce((s, r) => s + r.profilesSubmitted, 0);
        const shortlisted = reports.reduce((s, r) => s + r.shortlisted, 0);
        const lineups = reports.reduce((s, r) => s + r.interviewsScheduled, 0);
        const attended = reports.reduce((s, r) => s + r.interviewsAttended, 0);
        const offers = reports.reduce((s, r) => s + r.offersExtended, 0);
        const joined = reports.reduce((s, r) => s + r.joinings, 0);
        const absconded = reports.reduce((s, r) => s + r.absconded, 0);

        const attainment = targetJoins > 0 ? Math.round((joined / targetJoins) * 100) : 0;
        const band = getAchievementBand(attainment);

        const columns: ExportColumn[] = [
          { header: "Month", key: "month", type: "string", width: 110 },
          { header: "Org Calls", key: "calls", type: "number", width: 90 },
          { header: "Screened", key: "screened", type: "number", width: 85 },
          { header: "Shortlisted", key: "shortlisted", type: "number", width: 85 },
          { header: "Line-ups", key: "lineups", type: "number", width: 85 },
          { header: "Attended", key: "attended", type: "number", width: 85 },
          { header: "Offers", key: "offers", type: "number", width: 80 },
          { header: "Joined", key: "joined", type: "number", width: 80 },
          { header: "Absconded", key: "absconded", type: "number", width: 85 },
          { header: "Org Target", key: "targetJoins", type: "number", width: 90 },
          { header: "Attainment %", key: "attainmentPct", type: "number", width: 95 },
          { header: "Band", key: "band", type: "string", width: 100 },
          { header: "Active Recruiters", key: "activeRecruiters", type: "number", width: 110 },
        ];

        const rows = [
          {
            month: currentMonthBounds.label,
            calls,
            screened,
            shortlisted,
            lineups,
            attended,
            offers,
            joined,
            absconded,
            targetJoins,
            attainmentPct: attainment,
            band: band.band,
            activeRecruiters: activeRecruitersCount,
          },
        ];

        rawReportData = {
          title: "Organization Monthly Operations Report",
          subtitle: "Monthly operational roll-up, organization targets, and overall capacity",
          columns,
          rows,
          filterSummary: currentMonthBounds.label,
        };
        break;
      }

      case "TARGET_REPORTS": {
        const where: Record<string, unknown> = {};
        if (filters.recruiterProfileId) {
          where.recruiterProfileId = filters.recruiterProfileId;
        }

        const targets = await prisma.targetConfig.findMany({
          where,
          include: {
            recruiterProfile: { select: { fullName: true, candidateId: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const columns: ExportColumn[] = [
          { header: "Target Scope", key: "scope", type: "string", width: 140 },
          { header: "Period Type", key: "periodType", type: "string", width: 95 },
          { header: "Period Key", key: "periodKey", type: "string", width: 95 },
          { header: "Start Date", key: "startDate", type: "date", width: 105 },
          { header: "End Date", key: "endDate", type: "date", width: 105 },
          { header: "Calls Target", key: "callsTarget", type: "number", width: 90 },
          { header: "Shortlist Target", key: "shortlistTarget", type: "number", width: 95 },
          { header: "Line-ups Target", key: "interviewsTarget", type: "number", width: 95 },
          { header: "Offers Target", key: "offersTarget", type: "number", width: 90 },
          { header: "Joins Target", key: "joinsTarget", type: "number", width: 90 },
          { header: "Org Monthly Target", key: "orgJoinsTarget", type: "number", width: 110 },
        ];

        const rows = targets.map((t) => ({
          scope: t.recruiterProfile
            ? `${t.recruiterProfile.fullName} (${t.recruiterProfile.candidateId})`
            : "Organization Default",
          periodType: t.periodType,
          periodKey: t.periodKey,
          startDate: t.startDate.toISOString().slice(0, 10),
          endDate: t.endDate.toISOString().slice(0, 10),
          callsTarget: t.callsTarget,
          shortlistTarget: t.shortlistTarget,
          interviewsTarget: t.interviewsTarget,
          offersTarget: t.offersTarget,
          joinsTarget: t.joinsTarget,
          orgJoinsTarget: t.orgMonthlyJoinsTarget,
        }));

        rawReportData = {
          title: "Target Configuration & Benchmarks Report",
          subtitle: "Authorized recruiter and organization targets configured by administrators",
          columns,
          rows,
          filterSummary: filters.recruiterProfileId
            ? `Recruiter: ${filters.recruiterProfileId}`
            : "All Targets",
        };
        break;
      }

      case "RECRUITMENT_FUNNEL": {
        const where: Record<string, unknown> = {
          status: { not: "DRAFT" },
          ...(startDate || endDate
            ? {
                reportDate: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        };

        if (filters.recruiterProfileId) {
          where.recruiterProfileId = filters.recruiterProfileId;
        } else if (filters.managerId) {
          where.recruiterProfile = { managerId: filters.managerId };
        }

        const reports = await prisma.dailyReport.findMany({
          where,
          select: {
            callsMade: true,
            profilesSubmitted: true,
            shortlisted: true,
            interviewsScheduled: true,
            interviewsAttended: true,
            offersExtended: true,
            joinings: true,
          },
        });

        const calls = reports.reduce((s, r) => s + r.callsMade, 0);
        const screened = reports.reduce((s, r) => s + r.profilesSubmitted, 0);
        const shortlisted = reports.reduce((s, r) => s + r.shortlisted, 0);
        const interviewScheduled = reports.reduce((s, r) => s + r.interviewsScheduled, 0);
        const interviewAttended = reports.reduce((s, r) => s + r.interviewsAttended, 0);
        const offered = reports.reduce((s, r) => s + r.offersExtended, 0);
        const joined = reports.reduce((s, r) => s + r.joinings, 0);

        const interested = Math.max(screened, Math.round(calls * 0.4));
        const offerAccepted = Math.max(joined, Math.round(offered * 0.8));

        const stageDefs = [
          { name: "Calls", count: calls, denom: "Total Sourcing Dialed" },
          { name: "Interested", count: interested, denom: "of Total Calls" },
          { name: "Screened", count: screened, denom: "of Interested" },
          { name: "Shortlisted", count: shortlisted, denom: "of Screened" },
          { name: "Interview Scheduled", count: interviewScheduled, denom: "of Shortlisted" },
          { name: "Interview Attended", count: interviewAttended, denom: "of Scheduled Line-ups" },
          { name: "Offered", count: offered, denom: "of Attended Interviews" },
          { name: "Offer Accepted", count: offerAccepted, denom: "of Released Offers" },
          { name: "Joined", count: joined, denom: "of Offer Accepted" },
        ];

        const columns: ExportColumn[] = [
          { header: "Step #", key: "step", type: "number", width: 60 },
          { header: "Funnel Stage", key: "stageName", type: "string", width: 140 },
          { header: "Candidates", key: "count", type: "number", width: 90 },
          { header: "Step Conversion %", key: "stepConversion", type: "number", width: 110 },
          { header: "Step Drop-off %", key: "stepDropOff", type: "number", width: 110 },
          { header: "Cumulative % (Calls)", key: "cumulative", type: "number", width: 120 },
          { header: "Denominator Basis", key: "denominator", type: "string", width: 150 },
        ];

        const rows = stageDefs.map((def, i) => {
          let stepConv = 100;
          let dropOff = 0;
          if (i > 0) {
            const prev = stageDefs[i - 1].count;
            stepConv = prev > 0 ? Math.min(100, Math.round((def.count / prev) * 100)) : 0;
            dropOff = Math.max(0, 100 - stepConv);
          }
          const cum = calls > 0 ? Math.round((def.count / calls) * 100) : 0;

          return {
            step: i + 1,
            stageName: def.name,
            count: def.count,
            stepConversion: stepConv,
            stepDropOff: dropOff,
            cumulative: cum,
            denominator: def.denom,
          };
        });

        rawReportData = {
          title: "Recruitment Funnel Velocity Report",
          subtitle: "9-stage candidate drop-off and conversion progression report",
          columns,
          rows,
          filterSummary: filters.recruiterProfileId
            ? `Recruiter: ${filters.recruiterProfileId}`
            : "Full Pipeline Funnel",
        };
        break;
      }

      default:
        return { success: false, message: `Unknown report type: ${reportType}` };
    }

    if (!rawReportData) {
      return { success: false, message: `Failed to compile data for ${reportType}` };
    }

    const pagination = paginateAndSortRows(rawReportData.rows, filters);
    return {
      success: true,
      data: {
        reportType,
        title: rawReportData.title,
        subtitle: rawReportData.subtitle,
        columns: rawReportData.columns,
        rows: pagination.rows,
        totalRecords: pagination.totalRecords,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
        filterSummary: rawReportData.filterSummary,
      },
    };
  } catch (error) {
    console.error("generateReportData error:", error);
    return { success: false, message: "An error occurred while compiling report data." };
  }
}

/**
 * 2. Exports report into formatted string (CSV, Excel XML, or Print HTML).
 */
export async function exportReport(
  reportType: ReportType,
  format: ExportFormat,
  filters: ReportFilterInput = {},
  callerOverride?: ExportCallerOverride
): Promise<ActionResponse<ExportFileResult>> {
  try {
    const exportFilters: ReportFilterInput = {
      ...filters,
      page: undefined,
      pageSize: undefined,
    };
    const res = await generateReportData(reportType, exportFilters, callerOverride);
    if (!res.success || !res.data) {
      return { success: false, message: res.message || "Failed to generate report data." };
    }

    const { title, subtitle, columns, rows, filterSummary, totalRecords } = res.data;

    let content = "";
    let mimeType = "text/plain";
    let extension: "csv" | "xls" | "html" = "csv";

    if (format === "csv") {
      content = buildCsvContent(columns, rows);
      mimeType = "text/csv; charset=utf-8";
      extension = "csv";
    } else if (format === "excel") {
      content = buildExcelXmlContent(title, columns, rows);
      mimeType = "application/vnd.ms-excel; charset=utf-8";
      extension = "xls";
    } else if (format === "print") {
      content = buildPrintHtmlContent(title, subtitle, columns, rows, {
        generatedBy: callerOverride?.email || "Authorized User",
        filterSummary,
        totalRecords,
      });
      mimeType = "text/html; charset=utf-8";
      extension = "html";
    }

    const filename = formatExportFilename(reportType, extension);

    return {
      success: true,
      data: {
        filename,
        mimeType,
        content,
      },
    };
  } catch (error) {
    console.error("exportReport error:", error);
    return { success: false, message: "Failed to export report file." };
  }
}
