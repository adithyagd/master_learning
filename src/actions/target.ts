"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification";
import {
  calculatePeriodTargets,
  getPeriodBounds,
  getDefaultTargetsForPeriod,
  TargetPeriodType,
  PeriodTargetsPerformance,
} from "@/lib/target-calculator";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback during tests
  }
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ConfigureTargetInput {
  recruiterProfileId?: string | null; // null for org-wide default
  periodType: TargetPeriodType;
  periodDate?: string | Date;
  periodKey?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  callsTarget?: number;
  shortlistTarget?: number;
  interviewsTarget?: number;
  offersTarget?: number;
  joinsTarget?: number;
  ownLeadsTarget?: number;
  internalLeadsTarget?: number;
  orgMonthlyJoinsTarget?: number;
  notes?: string;
  reason?: string;
}

export interface TargetAdminOverride {
  id: string;
  email: string;
  role: string;
}

export interface TargetRecruiterOverride {
  id: string;
  profileId: string;
  email: string;
  isCertified: boolean;
  role?: string;
}

/**
 * Helper to authenticate caller as Administrator.
 */
async function authenticateAdmin(override?: TargetAdminOverride) {
  if (override) {
    if (override.role !== "ADMIN") return null;
    return override;
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/**
 * Admin-Only: Configures or updates recruiter targets with effective dates and audit history.
 */
export async function configureRecruiterTarget(
  input: ConfigureTargetInput,
  adminOverride?: TargetAdminOverride
): Promise<ActionResponse<{ targetConfigId: string; periodKey: string; periodType: TargetPeriodType }>> {
  try {
    const admin = await authenticateAdmin(adminOverride);
    if (!admin) {
      return { success: false, message: "Unauthorized. Administrator privileges required." };
    }

    const { periodType } = input;
    const bounds = getPeriodBounds(periodType, input.startDate || input.periodDate);
    const startDate = input.startDate ? new Date(input.startDate) : bounds.startDate;
    const endDate = input.endDate ? new Date(input.endDate) : bounds.endDate;
    const periodKey = input.periodKey || bounds.periodKey;
    const recruiterProfileId = input.recruiterProfileId || null;

    // Verify recruiter profile exists if specified
    if (recruiterProfileId) {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: recruiterProfileId },
        select: { id: true, fullName: true, candidateId: true },
      });
      if (!profile) {
        return { success: false, message: "Specified recruiter profile not found." };
      }
    }

    const defaults = getDefaultTargetsForPeriod(periodType);

    // Existing target lookup
    const existing = recruiterProfileId
      ? await prisma.targetConfig.findUnique({
          where: {
            recruiterProfileId_periodType_periodKey: {
              recruiterProfileId,
              periodType,
              periodKey,
            },
          },
        })
      : await prisma.targetConfig.findFirst({
          where: {
            recruiterProfileId: null,
            periodType,
            periodKey,
          },
        });

    const newTargetData = {
      callsTarget: input.callsTarget ?? existing?.callsTarget ?? defaults.callsTarget,
      shortlistTarget: input.shortlistTarget ?? existing?.shortlistTarget ?? defaults.shortlistTarget,
      interviewsTarget: input.interviewsTarget ?? existing?.interviewsTarget ?? defaults.interviewsTarget,
      offersTarget: input.offersTarget ?? existing?.offersTarget ?? defaults.offersTarget,
      joinsTarget: input.joinsTarget ?? existing?.joinsTarget ?? defaults.joinsTarget,
      ownLeadsTarget: input.ownLeadsTarget ?? existing?.ownLeadsTarget ?? defaults.ownLeadsTarget,
      internalLeadsTarget: input.internalLeadsTarget ?? existing?.internalLeadsTarget ?? defaults.internalLeadsTarget,
      orgMonthlyJoinsTarget: input.orgMonthlyJoinsTarget ?? existing?.orgMonthlyJoinsTarget ?? defaults.orgMonthlyJoinsTarget,
      notes: input.notes !== undefined ? input.notes : existing?.notes,
    };

    let targetConfig;
    if (existing) {
      targetConfig = await prisma.targetConfig.update({
        where: { id: existing.id },
        data: {
          ...newTargetData,
          startDate,
          endDate,
          configuredByAdminId: admin.id,
        },
      });
    } else {
      targetConfig = await prisma.targetConfig.create({
        data: {
          recruiterProfileId,
          periodType,
          periodKey,
          startDate,
          endDate,
          ...newTargetData,
          configuredByAdminId: admin.id,
        },
      });
    }

    // Record change in TargetChangeHistory
    await prisma.targetChangeHistory.create({
      data: {
        targetConfigId: targetConfig.id,
        adminId: admin.id,
        adminEmail: admin.email,
        reason: input.reason || (existing ? "Admin adjusted target benchmarks" : "Initial target configuration"),
        previousValues: existing ? JSON.stringify({
          callsTarget: existing.callsTarget,
          shortlistTarget: existing.shortlistTarget,
          interviewsTarget: existing.interviewsTarget,
          offersTarget: existing.offersTarget,
          joinsTarget: existing.joinsTarget,
          ownLeadsTarget: existing.ownLeadsTarget,
          internalLeadsTarget: existing.internalLeadsTarget,
          orgMonthlyJoinsTarget: existing.orgMonthlyJoinsTarget,
          notes: existing.notes,
        }) : "{}",
        newValues: JSON.stringify(newTargetData),
        effectiveFrom: startDate,
        effectiveTo: endDate,
      },
    });

    // Record System Audit Log
    await recordAuditLog({
      userId: admin.id,
      action: existing ? "TARGETS_UPDATED" : "TARGET_CONFIGURED",
      targetType: "TARGETS",
      targetId: targetConfig.id,
      details: {
        recruiterProfileId,
        periodType,
        periodKey,
        targets: newTargetData,
        reason: input.reason,
        effectiveFrom: startDate.toISOString(),
        effectiveTo: endDate.toISOString(),
      },
    });

    // Phase 16: Notify recruiter if individual targets were updated
    if (recruiterProfileId) {
      const rec = await prisma.candidateProfile.findUnique({
        where: { id: recruiterProfileId },
        select: { userId: true, fullName: true },
      });
      if (rec) {
        await createNotification({
          userId: rec.userId,
          type: "TARGET_UPDATED",
          title: "Recruitment Targets Updated",
          message: `Your ${periodType.toLowerCase()} targets for ${periodKey} have been configured (${newTargetData.callsTarget} calls, ${newTargetData.joinsTarget} joins).`,
          linkUrl: "/workspace/targets",
          referenceId: targetConfig.id,
          dedupKey: `TARGET_UPDATED:${recruiterProfileId}:${periodKey}`,
        });
      }
    }

    safeRevalidate("/workspace/targets");
    safeRevalidate("/workspace/today");
    safeRevalidate("/admin/targets");

    return {
      success: true,
      data: {
        targetConfigId: targetConfig.id,
        periodKey,
        periodType,
      },
    };
  } catch (error) {
    console.error("configureRecruiterTarget error:", error);
    return { success: false, message: "Failed to configure recruiter targets." };
  }
}

/**
 * Retrieves targets, real achievements, remaining values, and achievement bands for a recruiter.
 * Accessible to certified recruiters for their own profile, or Admins for any profile.
 */
export async function getRecruiterTargets(
  params: {
    recruiterProfileId?: string;
    periodType?: TargetPeriodType;
    periodDate?: string | Date;
  },
  callerOverride?: TargetRecruiterOverride | TargetAdminOverride
): Promise<ActionResponse<PeriodTargetsPerformance>> {
  try {
    let effectiveProfileId = params.recruiterProfileId;
    let isAdmin = false;

    if (callerOverride) {
      if ("role" in callerOverride && callerOverride.role === "ADMIN") {
        isAdmin = true;
      } else if ("profileId" in callerOverride) {
        const rec = callerOverride as TargetRecruiterOverride;
        if (!rec.isCertified) {
          return { success: false, message: "Unauthorized. Certified Recruiter access required." };
        }
        if (effectiveProfileId && effectiveProfileId !== rec.profileId) {
          return { success: false, message: "Forbidden. Recruiters may only view their own targets." };
        }
        effectiveProfileId = rec.profileId;
      }
    } else {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, message: "Authentication required." };
      }

      if (user.role === "ADMIN") {
        isAdmin = true;
      } else if (user.role === "CANDIDATE" && user.candidateProfile) {
        if (!user.candidateProfile.isCertified || user.candidateProfile.certificateStatus !== "ISSUED") {
          return { success: false, message: "Unauthorized. Certified Recruiter access required." };
        }
        if (effectiveProfileId && effectiveProfileId !== user.candidateProfile.id) {
          return { success: false, message: "Forbidden. Recruiters may only view their own targets." };
        }
        effectiveProfileId = user.candidateProfile.id;
      } else {
        return { success: false, message: "Unauthorized role." };
      }
    }

    if (!effectiveProfileId) {
      return { success: false, message: "Recruiter profile ID is required." };
    }

    const performance = await calculatePeriodTargets({
      recruiterProfileId: effectiveProfileId,
      periodType: params.periodType || "DAILY",
      periodDate: params.periodDate,
    });

    if (!performance) {
      return { success: false, message: "Recruiter profile not found or invalid." };
    }

    return { success: true, data: performance };
  } catch (error) {
    console.error("getRecruiterTargets error:", error);
    return { success: false, message: "Failed to retrieve recruiter targets." };
  }
}

/**
 * Retrieves audit change history for a target configuration.
 */
export async function getTargetChangeHistory(
  params: { targetConfigId?: string; recruiterProfileId?: string },
  callerOverride?: TargetAdminOverride | TargetRecruiterOverride
): Promise<ActionResponse<Array<{
  id: string;
  adminEmail: string;
  changedAt: Date;
  reason: string | null;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}>>> {
  try {
    let isAdmin = false;
    let allowedProfileId: string | null = null;

    if (callerOverride) {
      if ("role" in callerOverride && callerOverride.role === "ADMIN") isAdmin = true;
      else if ("profileId" in callerOverride) allowedProfileId = (callerOverride as TargetRecruiterOverride).profileId;
    } else {
      const user = await getCurrentUser();
      if (!user) return { success: false, message: "Authentication required." };
      if (user.role === "ADMIN") isAdmin = true;
      else if (user.candidateProfile) allowedProfileId = user.candidateProfile.id;
    }

    const whereClause: any = {};
    if (params.targetConfigId) {
      whereClause.targetConfigId = params.targetConfigId;
    } else if (params.recruiterProfileId) {
      if (!isAdmin && allowedProfileId !== params.recruiterProfileId) {
        return { success: false, message: "Forbidden. Cannot view other recruiters' target history." };
      }
      whereClause.targetConfig = { recruiterProfileId: params.recruiterProfileId };
    }

    const history = await prisma.targetChangeHistory.findMany({
      where: whereClause,
      orderBy: { changedAt: "desc" },
      take: 20,
    });

    const parsed = history.map((h) => ({
      id: h.id,
      adminEmail: h.adminEmail,
      changedAt: h.changedAt,
      reason: h.reason,
      previousValues: JSON.parse(h.previousValues || "{}"),
      newValues: JSON.parse(h.newValues || "{}"),
      effectiveFrom: h.effectiveFrom,
      effectiveTo: h.effectiveTo,
    }));

    return { success: true, data: parsed };
  } catch (error) {
    console.error("getTargetChangeHistory error:", error);
    return { success: false, message: "Failed to retrieve target history." };
  }
}

/**
 * Admin-Only: Retrieves high-level targets overview across recruiters.
 */
export async function getAdminTargetsOverview(
  periodType: TargetPeriodType = "DAILY",
  adminOverride?: TargetAdminOverride
) {
  const admin = await authenticateAdmin(adminOverride);
  if (!admin) {
    return null;
  }

  const recruiters = await prisma.candidateProfile.findMany({
    where: { isCertified: true },
    select: {
      id: true,
      fullName: true,
      candidateId: true,
      user: { select: { email: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const bounds = getPeriodBounds(periodType);

  const configs = await prisma.targetConfig.findMany({
    where: {
      periodType,
      periodKey: bounds.periodKey,
    },
  });

  const recentHistory = await prisma.targetChangeHistory.findMany({
    orderBy: { changedAt: "desc" },
    take: 10,
    include: {
      targetConfig: {
        include: {
          recruiterProfile: { select: { fullName: true, candidateId: true } },
        },
      },
    },
  });

  return {
    periodType,
    periodBounds: bounds,
    recruiters,
    configs,
    recentHistory,
  };
}

// =============================================================================
// Phase 17 Adapter Export
// =============================================================================

/**
 * Adapter: getRecruiterTargetsWithProgress
 *
 * Bridges the Phase 17 test's expected call signature and response shape with
 * the canonical `getRecruiterTargets` function.
 *
 * Test call:
 *   getRecruiterTargetsWithProgress("2026-03-01", { id, profileId, email, isCertified })
 *
 * Expected response shape:
 *   { success, data: { targets: { monthly: { callsTarget, actualCalls, ... } } } }
 */
export async function getRecruiterTargetsWithProgress(
  periodDate: string | Date,
  callerOverride: TargetRecruiterOverride
): Promise<ActionResponse<{
  targets: {
    monthly: {
      callsTarget: number;
      actualCalls: number;
      shortlistTarget: number;
      actualShortlisted: number;
      joinsTarget: number;
      actualJoins: number;
      achievementPercentage: number;
    };
  };
}>> {
  const result = await getRecruiterTargets(
    {
      recruiterProfileId: callerOverride.profileId,
      periodType: "MONTHLY",
      periodDate,
    },
    callerOverride
  );

  if (!result.success || !result.data) {
    return { success: false, message: result.message };
  }

  const m = result.data.metrics;
  return {
    success: true,
    data: {
      targets: {
        monthly: {
          callsTarget: m.CALLS.target,
          actualCalls: m.CALLS.achieved,
          shortlistTarget: m.SHORTLISTED.target,
          actualShortlisted: m.SHORTLISTED.achieved,
          joinsTarget: m.JOINS.target,
          actualJoins: m.JOINS.achieved,
          achievementPercentage: result.data.overallAveragePercentage,
        },
      },
    },
  };
}
