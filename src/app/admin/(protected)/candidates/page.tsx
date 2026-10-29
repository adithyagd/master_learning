import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CERTIFICATE_STATUS_CONFIG, CertificateStatus } from "@/lib/design-system";
import { UserPlus, Users, ArrowUpRight, Search, ShieldCheck } from "lucide-react";

export default async function CandidatesListPage() {
  const candidates = await prisma.candidateProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">Candidate Management</h1>
            <Badge variant="primary" size="sm">
              {candidates.length} Registered
            </Badge>
          </div>
          <p className="text-xs text-navy-500 mt-1">
            Provision recruiter accounts, track curriculum progress, and manage credential lifecycles.
          </p>
        </div>

        <Link href="/admin/candidates/add">
          <Button variant="primary" size="md" leftIcon={<UserPlus className="w-4 h-4" />}>
            Add recruiter
            
          </Button>
        </Link>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Recruiter Trainees &amp; Candidates</CardTitle>
            <CardDescription>
              All provisioned recruiter candidates within E2E Procurement Private Limited
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Users className="w-8 h-8 text-navy-400" />}
                title="No Candidates Provisioned Yet"
                description="Begin by adding your first recruiter candidate. An account will be initialized and a secure invitation link generated."
                actionLabel="Create Candidate Account"
                action={
                  <Link href="/admin/candidates/add">
                    <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                      Create Candidate Account
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-reports">
                <thead>
                  <tr>
                    <th>Candidate ID</th>
                    <th>Full Name &amp; Email</th>
                    <th>Location</th>
                    <th>Joining Date</th>
                    <th>Account Status</th>
                    <th>Certification</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 text-xs">
                  {candidates.map((c) => {
                    const certConfig =
                      CERTIFICATE_STATUS_CONFIG[c.certificateStatus as CertificateStatus] ||
                      CERTIFICATE_STATUS_CONFIG.NOT_ELIGIBLE;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="font-mono font-semibold text-brand-700">
                          {c.candidateId}
                        </td>
                        <td>
                          <div className="font-semibold text-navy-900">{c.fullName}</div>
                          <div className="text-[11px] text-navy-400">{c.user.email}</div>
                        </td>
                        <td className="text-navy-600">
                          {c.location || <span className="text-navy-300 italic">Not specified</span>}
                        </td>
                        <td className="text-navy-600 font-mono text-[11px]">
                          {new Date(c.joiningDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <Badge
                            variant={c.user.status === "ACTIVE" ? "success" : "danger"}
                            size="sm"
                            dot
                          >
                            {c.user.status}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={certConfig.badgeVariant} size="sm">
                            {certConfig.label}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <Link href={`/admin/candidates/${c.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                            >
                              Manage Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
