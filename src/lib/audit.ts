import { prisma } from "./prisma";

export type AuditAction =
  | "ADMIN_LOGIN"
  | "CANDIDATE_LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "CANDIDATE_CREATED"
  | "CANDIDATE_UPDATED"
  | "STATUS_CHANGED"
  | "CREDENTIAL_RESET_REQUESTED"
  | "CREDENTIAL_RESET_COMPLETED"
  | "UNAUTHORIZED_ACCESS_ATTEMPT"
  | "LESSON_COMPLETED"
  | "ASSESSMENT_STARTED"
  | "ASSESSMENT_SUBMITTED"
  | "CERTIFICATE_APPROVED"
  | "CERTIFICATE_REJECTED"
  | "CERTIFICATE_ISSUED"
  | "JOB_CANDIDATE_CREATED"
  | "JOB_CANDIDATE_UPDATED"
  | "STAGE_TRANSITIONED"
  | "NOTE_ADDED"
  | "INTERVIEW_SCHEDULED"
  | "DAILY_REPORT_SUBMITTED"
  | "DAILY_REPORT_REVIEWED"
  | "CHECKLIST_UPDATED"
  | "TARGETS_UPDATED"
  | "TARGET_CONFIGURED"
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "CLIENT_ACTIVATED"
  | "CLIENT_DEACTIVATED"
  | "MANAGER_LOGIN"
  | "TEAM_ASSIGNED"
  | "REPORT_APPROVED"
  | "REPORT_RETURNED";

export interface RecordAuditParams {
  userId?: string | null;
  action: AuditAction;
  targetType:
    | "USER"
    | "CANDIDATE"
    | "AUTH"
    | "LESSON"
    | "ASSESSMENT"
    | "CERTIFICATE"
    | "JOB_CANDIDATE"
    | "INTERVIEW"
    | "DAILY_REPORT"
    | "CHECKLIST"
    | "TARGETS"
    | "CLIENT"
    | "TEAM"
    | "REPORT";
  targetId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog({
  userId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  userAgent,
}: RecordAuditParams) {
  try {
    const detailsString =
      typeof details === "object" ? JSON.stringify(details) : details ?? null;

    return await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        targetType,
        targetId: targetId ?? null,
        details: detailsString,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Do not throw to avoid crashing the main transaction
    return null;
  }
}
