import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Clock, ShieldCheck, Activity } from "lucide-react";

interface ActivityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateActivityRoute({ params }: ActivityPageProps) {
  const { id } = await params;

  const candidate = await prisma.candidateProfile.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!candidate) {
    notFound();
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { targetId: candidate.id },
        { targetId: candidate.user.id },
        { userId: candidate.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/admin/candidates/${candidate.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Candidate Profile
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">Candidate Audit Timeline</h1>
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {candidate.candidateId}
            </span>
          </div>
          <p className="text-xs text-navy-500 mt-1">
            Complete immutable audit log for <strong className="text-navy-800">{candidate.fullName}</strong> ({candidate.user.email})
          </p>
        </div>

        <Badge variant="primary" size="md">
          {logs.length} Total Audit Records
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Ledger</CardTitle>
          <CardDescription>
            Chronological security events, status updates, and credential lifecycle actions
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-navy-500">
              No audit records exist for this candidate yet.
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center font-mono font-bold text-xs">
                        <Activity className="w-4 h-4 text-brand-600" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-navy-900 font-mono">
                          {log.action}
                        </span>
                        <div className="text-[11px] text-navy-500">
                          Target: <span className="font-semibold">{log.targetType}</span>
                          {log.ipAddress && ` &bull; IP: ${log.ipAddress}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] text-navy-500">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>

                  {log.details && (
                    <div className="mt-2.5 p-2.5 bg-navy-50/80 rounded border border-navy-200/80 text-[11px] font-mono text-navy-700 break-all">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
