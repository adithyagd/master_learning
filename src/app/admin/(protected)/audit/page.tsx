import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, Clock, User } from "lucide-react";

export const metadata = {
  title: "Audit History | E2E Admin",
  description: "Platform security audit trail, user authentication events, and administrative actions.",
};

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { email: true, role: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider">
            Governance & Compliance
          </span>
          <h1 className="text-2xl font-bold text-navy-950 mt-1">Platform Audit Trail</h1>
          <p className="text-sm text-slate-600 mt-1">
            Immutable system audit logs tracking logins, certificate decisions, target updates, and role events.
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-between">
          <span>Recent System Audit Events ({logs.length} Logged Events)</span>
          <span className="text-[11px] text-slate-400">Strict chronological order</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/60">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 font-mono text-[10px] font-bold border border-navy-200">
                  {log.action}
                </span>
                <span className="text-slate-700">
                  Target: <span className="font-semibold">{log.targetType}</span> {log.targetId && `(${log.targetId})`}
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                {log.user && <span>Actor: {log.user.email}</span>}
                <span>
                  {new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
