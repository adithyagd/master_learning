import { prisma } from "./prisma";

export type TargetPeriodType = "DAILY" | "WEEKLY" | "MONTHLY";

export type MetricKey =
  | "CALLS"
  | "SHORTLISTED"
  | "INTERVIEWS"
  | "OFFERS"
  | "JOINS"
  | "OWN_LEADS"
  | "INTERNAL_LEADS"
  | "ORG_MONTHLY_JOINS";

export type AchievementBand =
  | "Critical"
  | "Low"
  | "Medium"
  | "Good"
  | "Great"
  | "Outstanding";

export interface AchievementBandInfo {
  band: AchievementBand;
  label: string;
  badgeVariant: "danger" | "warning" | "info" | "primary" | "success" | "brand";
  colorClasses: string;
  badgeClasses: string;
  minPercent: number;
  maxPercent: number;
}

export const OWN_LEAD_SOURCES = [
  "Own Network",
  "Referral",
  "Cold Call",
  "LinkedIn",
  "Personal Network",
  "Direct",
  "Social Media",
];

export const INTERNAL_LEAD_SOURCES = [
  "Internal Database",
  "Portal",
  "Naukri",
  "Job Fair",
  "Campus",
  "Internal",
  "Company Pool",
  "Client Mandate",
  "Other",
];

/**
 * Maps attainment percentage to the 6 mandatory achievement bands:
 * 0–25% Critical; 26–50% Low; 51–75% Medium; 76–90% Good; 91–100% Great; above 100% Outstanding.
 */
export function getAchievementBand(percentage: number): AchievementBandInfo {
  if (percentage <= 25) {
    return {
      band: "Critical",
      label: "Critical (0–25%)",
      badgeVariant: "danger",
      colorClasses: "text-rose-700 bg-rose-50 border-rose-200",
      badgeClasses: "bg-rose-100 text-rose-800 border-rose-300",
      minPercent: 0,
      maxPercent: 25,
    };
  }
  if (percentage <= 50) {
    return {
      band: "Low",
      label: "Low (26–50%)",
      badgeVariant: "warning",
      colorClasses: "text-amber-700 bg-amber-50 border-amber-200",
      badgeClasses: "bg-amber-100 text-amber-800 border-amber-300",
      minPercent: 26,
      maxPercent: 50,
    };
  }
  if (percentage <= 75) {
    return {
      band: "Medium",
      label: "Medium (51–75%)",
      badgeVariant: "info",
      colorClasses: "text-sky-700 bg-sky-50 border-sky-200",
      badgeClasses: "bg-sky-100 text-sky-800 border-sky-300",
      minPercent: 51,
      maxPercent: 75,
    };
  }
  if (percentage <= 90) {
    return {
      band: "Good",
      label: "Good (76–90%)",
      badgeVariant: "primary",
      colorClasses: "text-indigo-700 bg-indigo-50 border-indigo-200",
      badgeClasses: "bg-indigo-100 text-indigo-800 border-indigo-300",
      minPercent: 76,
      maxPercent: 90,
    };
  }
  if (percentage <= 100) {
    return {
      band: "Great",
      label: "Great (91–100%)",
      badgeVariant: "success",
      colorClasses: "text-emerald-700 bg-emerald-50 border-emerald-200",
      badgeClasses: "bg-emerald-100 text-emerald-800 border-emerald-300",
      minPercent: 91,
      maxPercent: 100,
    };
  }
  return {
    band: "Outstanding",
    label: "Outstanding (>100%)",
    badgeVariant: "brand",
    colorClasses: "text-purple-700 bg-purple-50 border-purple-200",
    badgeClasses: "bg-purple-100 text-purple-800 border-purple-300",
    minPercent: 101,
    maxPercent: Infinity,
  };
}

export function formatLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates start and end timestamps and formatted keys for a given period.
 */
export function getPeriodBounds(
  periodType: TargetPeriodType,
  dateInput?: Date | string
): {
  startDate: Date;
  endDate: Date;
  periodKey: string;
  label: string;
  periodType: TargetPeriodType;
} {
  let d: Date;
  if (typeof dateInput === "string" && dateInput.includes("-") && !dateInput.includes("T")) {
    const [y, m, day] = dateInput.split("-").map(Number);
    d = new Date(y, m - 1, day, 12, 0, 0);
  } else if (dateInput) {
    d = new Date(dateInput);
  } else {
    d = new Date();
  }

  if (periodType === "DAILY") {
    const startDate = new Date(d);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(d);
    endDate.setHours(23, 59, 59, 999);

    const periodKey = formatLocalDateKey(startDate);
    const label = startDate.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return { startDate, endDate, periodKey, label, periodType: "DAILY" };
  }

  if (periodType === "WEEKLY") {
    const current = new Date(d);
    const day = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);

    const startDate = new Date(current.setDate(diffToMonday));
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Week number calculation (ISO)
    const tempDate = new Date(startDate.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);

    const year = tempDate.getFullYear();
    const periodKey = `${year}-W${String(weekNum).padStart(2, "0")}`;

    const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const label = `Week ${weekNum} (${startStr} – ${endStr})`;

    return { startDate, endDate, periodKey, label, periodType: "WEEKLY" };
  }

  // MONTHLY
  const startDate = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthStr = String(d.getMonth() + 1).padStart(2, "0");
  const periodKey = `${d.getFullYear()}-${monthStr}`;
  const label = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return { startDate, endDate, periodKey, label, periodType: "MONTHLY" };
}

/**
 * Standard default target values by period when no custom admin target is configured.
 */
export function getDefaultTargetsForPeriod(periodType: TargetPeriodType): {
  callsTarget: number;
  shortlistTarget: number;
  interviewsTarget: number;
  offersTarget: number;
  joinsTarget: number;
  ownLeadsTarget: number;
  internalLeadsTarget: number;
  orgMonthlyJoinsTarget: number;
} {
  if (periodType === "DAILY") {
    return {
      callsTarget: 30,
      shortlistTarget: 5,
      interviewsTarget: 2,
      offersTarget: 1,
      joinsTarget: 0,
      ownLeadsTarget: 5,
      internalLeadsTarget: 5,
      orgMonthlyJoinsTarget: 10,
    };
  }
  if (periodType === "WEEKLY") {
    return {
      callsTarget: 150,
      shortlistTarget: 25,
      interviewsTarget: 10,
      offersTarget: 3,
      joinsTarget: 2,
      ownLeadsTarget: 25,
      internalLeadsTarget: 25,
      orgMonthlyJoinsTarget: 10,
    };
  }
  // MONTHLY
  return {
    callsTarget: 600,
    shortlistTarget: 100,
    interviewsTarget: 40,
    offersTarget: 10,
    joinsTarget: 5,
    ownLeadsTarget: 100,
    internalLeadsTarget: 100,
    orgMonthlyJoinsTarget: 20,
  };
}

export interface MetricPerformance {
  key: MetricKey;
  label: string;
  description: string;
  unit: string;
  target: number;
  achieved: number;
  remaining: number;
  achievementPercentage: number;
  band: AchievementBandInfo;
  source: string;
}

export interface PeriodTargetsPerformance {
  periodType: TargetPeriodType;
  periodKey: string;
  label: string;
  startDate: Date;
  endDate: Date;
  recruiterProfileId: string;
  recruiterName: string;
  candidateId: string;
  isCustomConfigured: boolean;
  configuredByAdminId?: string;
  targetConfigId?: string;
  notes?: string | null;
  overallAveragePercentage: number;
  overallBand: AchievementBandInfo;
  metrics: Record<MetricKey, MetricPerformance>;
  metricList: MetricPerformance[];
}

/**
 * Calculates recruiter performance for a given period and date without double-counting.
 */
export async function calculatePeriodTargets(params: {
  recruiterProfileId: string;
  periodType: TargetPeriodType;
  periodDate?: Date | string;
}): Promise<PeriodTargetsPerformance | null> {
  const { recruiterProfileId, periodType, periodDate } = params;

  // 1. Recruiter validation
  const recruiter = await prisma.candidateProfile.findUnique({
    where: { id: recruiterProfileId },
    select: { id: true, fullName: true, candidateId: true, isCertified: true },
  });

  if (!recruiter) {
    return null;
  }

  // 2. Resolve period boundaries
  const bounds = getPeriodBounds(periodType, periodDate);
  const { startDate, endDate, periodKey, label } = bounds;

  // Month boundaries for organization monthly target
  const refDate = periodDate ? new Date(periodDate) : new Date();
  const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

  // 3. Find configured targets (recruiter specific -> org default -> baseline default)
  const [specificConfig, orgConfig] = await Promise.all([
    prisma.targetConfig.findUnique({
      where: {
        recruiterProfileId_periodType_periodKey: {
          recruiterProfileId,
          periodType,
          periodKey,
        },
      },
    }),
    prisma.targetConfig.findFirst({
      where: {
        recruiterProfileId: null,
        periodType,
        periodKey,
      },
    }),
  ]);

  const activeConfig = specificConfig || orgConfig;
  const isCustomConfigured = !!activeConfig;
  const defaults = getDefaultTargetsForPeriod(periodType);

  const targetCalls = activeConfig?.callsTarget ?? defaults.callsTarget;
  const targetShortlist = activeConfig?.shortlistTarget ?? defaults.shortlistTarget;
  const targetInterviews = activeConfig?.interviewsTarget ?? defaults.interviewsTarget;
  const targetOffers = activeConfig?.offersTarget ?? defaults.offersTarget;
  const targetJoins = activeConfig?.joinsTarget ?? defaults.joinsTarget;
  const targetOwnLeads = activeConfig?.ownLeadsTarget ?? defaults.ownLeadsTarget;
  const targetInternalLeads = activeConfig?.internalLeadsTarget ?? defaults.internalLeadsTarget;
  const targetOrgMonthlyJoins = activeConfig?.orgMonthlyJoinsTarget ?? defaults.orgMonthlyJoinsTarget;

  // 4. Retrieve real recruitment activity records in parallel
  const [
    callNotes,
    dailyReports,
    shortlistHistories,
    scheduledInterviews,
    offerHistories,
    joinHistories,
    ownCandidates,
    internalCandidates,
    orgJoinHistories,
  ] = await Promise.all([
    // Calls: RecruiterNotes of type CALL_LOG
    prisma.recruiterNote.findMany({
      where: {
        recruiterProfileId,
        noteType: "CALL_LOG",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    }),

    // Calls: DailyReports for the period
    prisma.dailyReport.findMany({
      where: {
        recruiterProfileId,
        reportDate: { gte: startDate, lte: endDate },
      },
      select: { reportDate: true, callsMade: true },
    }),

    // Shortlisted: Distinct candidates transitioned to SHORTLISTED
    prisma.candidateStageHistory.findMany({
      where: {
        changedByRecruiterId: recruiterProfileId,
        toStage: "SHORTLISTED",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { jobCandidateId: true },
    }),

    // Interviews: Distinct scheduled interview records
    prisma.scheduledInterview.findMany({
      where: {
        recruiterProfileId,
        scheduledAt: { gte: startDate, lte: endDate },
      },
      select: { id: true, jobCandidateId: true },
    }),

    // Offers: Distinct candidates transitioned to OFFERED or OFFER_ACCEPTED
    prisma.candidateStageHistory.findMany({
      where: {
        changedByRecruiterId: recruiterProfileId,
        toStage: { in: ["OFFERED", "OFFER_ACCEPTED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { jobCandidateId: true },
    }),

    // Joins: Distinct candidates transitioned to JOINED by this recruiter
    prisma.candidateStageHistory.findMany({
      where: {
        changedByRecruiterId: recruiterProfileId,
        toStage: "JOINED",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { jobCandidateId: true },
    }),

    // Own Leads: Candidates created with own direct sourcing channels
    prisma.jobCandidate.findMany({
      where: {
        recruiterProfileId,
        createdAt: { gte: startDate, lte: endDate },
        source: { in: OWN_LEAD_SOURCES },
      },
      select: { id: true },
    }),

    // Internal Leads: Candidates created with internal / company channels
    prisma.jobCandidate.findMany({
      where: {
        recruiterProfileId,
        createdAt: { gte: startDate, lte: endDate },
        source: { notIn: OWN_LEAD_SOURCES },
      },
      select: { id: true },
    }),

    // Org Monthly Joins: All candidates transitioned to JOINED across company in monthly window
    prisma.candidateStageHistory.findMany({
      where: {
        toStage: "JOINED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { jobCandidateId: true },
    }),
  ]);

  // 5. Anti-Double-Counting Calculation for Calls
  // Group call notes by local YYYY-MM-DD
  const dayCallNotesMap = new Map<string, number>();
  for (const n of callNotes) {
    const dayKey = formatLocalDateKey(n.createdAt);
    dayCallNotesMap.set(dayKey, (dayCallNotesMap.get(dayKey) || 0) + 1);
  }

  // Group daily report calls by local YYYY-MM-DD
  const dayReportCallsMap = new Map<string, number>();
  for (const r of dailyReports) {
    const dayKey = formatLocalDateKey(r.reportDate);
    dayReportCallsMap.set(dayKey, Math.max(dayReportCallsMap.get(dayKey) || 0, r.callsMade));
  }

  // Union of all dates in the period that logged call activity
  const allCallDates = new Set([...dayCallNotesMap.keys(), ...dayReportCallsMap.keys()]);
  let achievedCalls = 0;
  for (const dayKey of allCallDates) {
    const notesCount = dayCallNotesMap.get(dayKey) || 0;
    const reportCalls = dayReportCallsMap.get(dayKey) || 0;
    achievedCalls += Math.max(notesCount, reportCalls);
  }

  // 6. Distinct entity counts
  const achievedShortlists = new Set(shortlistHistories.map((h) => h.jobCandidateId)).size;
  const achievedInterviews = scheduledInterviews.length;
  const achievedOffers = new Set(offerHistories.map((h) => h.jobCandidateId)).size;
  const achievedJoins = new Set(joinHistories.map((h) => h.jobCandidateId)).size;
  const achievedOwnLeads = new Set(ownCandidates.map((c) => c.id)).size;
  const achievedInternalLeads = new Set(internalCandidates.map((c) => c.id)).size;
  const achievedOrgMonthlyJoins = new Set(orgJoinHistories.map((h) => h.jobCandidateId)).size;

  // 7. Assemble MetricPerformance objects with achievement percentages and bands
  const buildMetric = (
    key: MetricKey,
    label: string,
    description: string,
    unit: string,
    target: number,
    achieved: number,
    source: string
  ): MetricPerformance => {
    const remaining = Math.max(0, target - achieved);
    // Handle zero target gracefully without NaN or Infinity
    const achievementPercentage =
      target === 0
        ? achieved > 0
          ? 100
          : 0
        : Math.round((achieved / target) * 1000) / 10;
    const band = getAchievementBand(achievementPercentage);

    return {
      key,
      label,
      description,
      unit,
      target,
      achieved,
      remaining,
      achievementPercentage,
      band,
      source,
    };
  };

  const metrics: Record<MetricKey, MetricPerformance> = {
    CALLS: buildMetric(
      "CALLS",
      "Calls",
      "Candidate telephone screenings & outreach logs",
      "calls",
      targetCalls,
      achievedCalls,
      "Linked Call Logs & Daily Operations Reports (de-duplicated per calendar day)"
    ),
    SHORTLISTED: buildMetric(
      "SHORTLISTED",
      "Shortlisted Candidates",
      "Candidates evaluated and transitioned to Shortlisted stage",
      "candidates",
      targetShortlist,
      achievedShortlists,
      "Distinct candidates moved to SHORTLISTED in pipeline history"
    ),
    INTERVIEWS: buildMetric(
      "INTERVIEWS",
      "Interview Line-ups",
      "Client interview line-ups coordinated and scheduled",
      "interviews",
      targetInterviews,
      achievedInterviews,
      "Distinct interview coordination records scheduled for this period"
    ),
    OFFERS: buildMetric(
      "OFFERS",
      "Offers Extended",
      "Client employment offers released and negotiated",
      "offers",
      targetOffers,
      achievedOffers,
      "Distinct candidates moved to OFFERED or OFFER_ACCEPTED in pipeline history"
    ),
    JOINS: buildMetric(
      "JOINS",
      "Candidates Joined",
      "Candidates successfully onboarded at client organization",
      "joinings",
      targetJoins,
      achievedJoins,
      "Distinct candidates moved to JOINED in pipeline history"
    ),
    OWN_LEADS: buildMetric(
      "OWN_LEADS",
      "Own Leads",
      "Direct talent sourced through own network, cold outreach & direct channels",
      "leads",
      targetOwnLeads,
      achievedOwnLeads,
      "Candidates created from personal network, referrals, direct search & LinkedIn"
    ),
    INTERNAL_LEADS: buildMetric(
      "INTERNAL_LEADS",
      "Internal Leads",
      "Candidates sourced from company database, portals, job fairs & campus",
      "leads",
      targetInternalLeads,
      achievedInternalLeads,
      "Candidates created from internal company databases, portals & pooled mandates"
    ),
    ORG_MONTHLY_JOINS: buildMetric(
      "ORG_MONTHLY_JOINS",
      "Team / Org Monthly Joins",
      "Total enterprise joinings across all recruiters this calendar month",
      "joinings",
      targetOrgMonthlyJoins,
      achievedOrgMonthlyJoins,
      `Company-wide joinings verified across entire organization for ${bounds.label.split("(")[0]}`
    ),
  };

  const metricList = Object.values(metrics);
  const totalPercentage = metricList.reduce((acc, m) => acc + m.achievementPercentage, 0);
  const overallAveragePercentage = Math.round((totalPercentage / metricList.length) * 10) / 10;
  const overallBand = getAchievementBand(overallAveragePercentage);

  return {
    periodType,
    periodKey,
    label,
    startDate,
    endDate,
    recruiterProfileId,
    recruiterName: recruiter.fullName,
    candidateId: recruiter.candidateId,
    isCustomConfigured,
    configuredByAdminId: activeConfig?.configuredByAdminId,
    targetConfigId: activeConfig?.id,
    notes: activeConfig?.notes,
    overallAveragePercentage,
    overallBand,
    metrics,
    metricList,
  };
}
