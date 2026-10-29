import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedRecruiter } from "@/actions/workspace";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  UserCheck,
  Calendar,
  MessageSquare,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default async function WorkspaceHistoryPage() {
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  // Fetch recruiter's audit logs
  const logs = await prisma.auditLog.findMany({
    where: {
      userId: recruiter.id,
      action: {
        in: [
          "JOB_CANDIDATE_CREATED",
          "JOB_CANDIDATE_UPDATED",
          "STAGE_TRANSITIONED",
          "NOTE_ADDED",
          "INTERVIEW_SCHEDULED",
          "DAILY_REPORT_SUBMITTED",
          "CHECKLIST_UPDATED",
          "TARGETS_UPDATED",
          "CERTIFICATE_ISSUED",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Operational History &amp; Audit Trail</h1>
          <Badge variant="primary" size="sm">
            Recruiter Activity
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Chronological record of candidate updates, stage progressions, interview scheduling, and operations logs for {recruiter.fullName}.
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Recruiter Action Timeline
          </CardTitle>
          <CardDescription className="text-xs">
            Tamper-proof event logs maintaining governance across candidate ownership and pipeline transitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 space-y-2">
              <Clock className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-bold text-gray-800">No Operations Activity Logged Yet</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                As you source candidates, schedule interviews, and log notes, your activity timeline will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                let parsedDetails: Record<string, unknown> = {};
                try {
                  parsedDetails = log.details ? JSON.parse(log.details) : {};
                } catch {
                  parsedDetails = {};
                }

                return (
                  <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {log.targetType}
                        </span>
                      </div>
                      <div className="text-gray-600 text-[11px]">
                        {Object.entries(parsedDetails).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            <span className="text-gray-400 capitalize">{k}:</span>{" "}
                            <span className="font-medium text-gray-800">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
