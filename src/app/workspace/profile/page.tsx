import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedRecruiter } from "@/actions/workspace";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Award,
  ShieldCheck,
  User,
  Calendar,
  Mail,
  MapPin,
  ExternalLink,
  Printer,
  FileCheck,
} from "lucide-react";

export default async function WorkspaceProfilePage() {
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { id: recruiter.profileId },
    include: {
      certificate: true,
      jobCandidates: { select: { id: true } },
      dailyReports: { select: { id: true } },
    },
  });

  if (!profile) {
    redirect("/academy");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Professional Profile</h1>
          <Badge variant="success" size="sm">
            Recruiter Ready
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Authorized Recruiter credentials, verified certification records, and platform governance details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruiter Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Personal &amp; Organizational Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Account registered with E2E Procurement Private Limited
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Full Legal Name</span>
                  <span className="text-sm font-bold text-gray-900">{profile.fullName}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Candidate Recruiter ID</span>
                  <span className="text-sm font-mono font-bold text-blue-900">{profile.candidateId}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Official Email</span>
                  <span className="text-xs font-semibold text-gray-800">{recruiter.email}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Operating Location</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {profile.location || "Bangalore, Karnataka, India"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Joining / Registration Date</span>
                  <span className="text-xs font-semibold text-gray-800 font-mono">
                    {new Date(profile.joiningDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 space-y-1">
                  <span className="text-gray-400 block font-medium">Operations Activity Volume</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {profile.jobCandidates.length} Candidates Managed &bull; {profile.dailyReports.length} EOD Logs
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Card */}
        <div>
          <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 mb-2">
                <Award className="w-6 h-6" />
              </div>
              <CardTitle className="text-base text-gray-900">
                Certified Recruiter Credential
              </CardTitle>
              <CardDescription className="text-xs text-gray-600">
                Authenticated by E2E Procurement Leadership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {profile.certificate ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Certificate ID
                    </span>
                    <p className="font-mono text-xs font-bold text-blue-900 break-all">
                      {profile.certificate.certificateNumber}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Verification Hash
                    </span>
                    <p className="font-mono text-[11px] font-bold text-gray-700 break-all">
                      {profile.certificate.verificationCode}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500">Capstone Result:</span>
                    <span className="font-bold text-blue-900">
                      {profile.certificate.finalScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Issue Date:</span>
                    <span className="font-bold text-gray-800 font-mono text-[11px]">
                      {new Date(profile.certificate.issuedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Link href="/academy/certificate" className="block">
                      <Button variant="primary" size="sm" className="w-full text-xs gap-1.5 shadow-sm">
                        <Printer className="w-3.5 h-3.5" />
                        View / Print Official Certificate
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No certificate record found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
