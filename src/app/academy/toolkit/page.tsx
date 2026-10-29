import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ToolkitClient } from "@/components/academy/ToolkitClient";
import { TOOLKIT_ITEMS } from "@/lib/toolkit-data";
import { logoutUser } from "@/actions/auth";
import { Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function RecruiterToolkitPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: user.candidateProfile.fullName,
          email: user.email,
          role: "CANDIDATE",
          isCertified: user.candidateProfile.isCertified,
          candidateCode: user.candidateProfile.candidateId,
        }}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <Link href="/academy" className="hover:text-brand-600 transition-colors font-medium">
              Academy
            </Link>
            <span>/</span>
            <span className="text-navy-800 font-semibold">Recruiter Toolkit</span>
          </div>

          <Link href="/academy">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Trainee Dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white p-6 sm:p-8 rounded-2xl shadow-card border border-navy-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-300 bg-brand-900/80 px-2.5 py-1 rounded-md border border-brand-700">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Recruiter Execution Library</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Recruiter Reference Toolkit
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Practical operational resources, standardized calling scripts, verified Boolean search strings, qualification frameworks, and candidate follow-up templates ready for daily recruitment execution.
          </p>
        </div>

        {/* Toolkit Client Component */}
        <ToolkitClient items={TOOLKIT_ITEMS} />
      </main>
    </div>
  );
}
