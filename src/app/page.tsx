import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { COMPANY_INFO, ACADEMY_MODULES } from "@/lib/design-system";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Briefcase,
  Award,
  Users,
  Target,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={null} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-16 sm:py-24 border-b border-navy-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="primary" size="md" className="mb-4 bg-brand-900/60 text-brand-300 border-brand-700/60">
                Official Enterprise Portal &bull; Bangalore, Karnataka
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Recruiter Academy &amp; Recruitment Operations Platform
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Integrated talent platform by <strong className="text-white">{COMPANY_INFO.name}</strong>.
                Train recruiters across 5 competency modules, assess skills with dynamic evaluations, issue verified certificates upon Admin approval, and unlock action-oriented recruitment workspaces.
              </p>

              {/* Designated Authentication Gateways */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-3.5 shadow-lg shadow-brand-500/20"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Candidate Recruiter Portal
                  </Button>
                </Link>

                <Link href="/admin/login" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-3.5 bg-navy-800/80 border border-navy-700 text-slate-200 hover:bg-navy-700"
                    leftIcon={<ShieldCheck className="w-4 h-4 text-brand-400" />}
                  >
                    Admin Portal
                  </Button>
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                <span>Authorized invite-only access. No public self-registration.</span>
              </div>
            </div>
          </div>

          {/* Subdued background grid design */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        </section>

        {/* Mandatory Workflow Pipeline Indicator */}
        <section className="py-12 bg-white border-b border-navy-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest">
                Enforced Progression Workflow
              </h2>
              <p className="text-xl font-bold text-navy-900 mt-1">
                Zero-Bypass Certification Pipeline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-navy-200 bg-slate-50/50 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm mb-3">
                  01
                </div>
                <h3 className="text-sm font-semibold text-navy-900">Admin Provisions Account</h3>
                <p className="text-xs text-navy-500 mt-1">
                  Candidate receives secure invitation credentials. No unverified signups.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-navy-200 bg-slate-50/50 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm mb-3">
                  02
                </div>
                <h3 className="text-sm font-semibold text-navy-900">Pass Modules 1–5</h3>
                <p className="text-xs text-navy-500 mt-1">
                  Complete lessons and score &ge;70% on each module assessment in strict sequence.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-navy-200 bg-slate-50/50 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm mb-3">
                  03
                </div>
                <h3 className="text-sm font-semibold text-navy-900">Pass Final Assessment</h3>
                <p className="text-xs text-navy-500 mt-1">
                  20 questions, 20-minute timed evaluation, 70% passing threshold with review.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-brand-300 bg-brand-50/30 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-success-100 text-success-700 font-bold flex items-center justify-center text-sm mb-3">
                  04
                </div>
                <h3 className="text-sm font-semibold text-navy-900">Admin Approval &amp; Workspace</h3>
                <p className="text-xs text-navy-500 mt-1">
                  Admin approves certificate, status becomes Recruiter Ready, and Operations Workspace unlocks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Academy Curriculum Preview */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Standardized Curriculum</span>
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mt-1">The 5 Academy Modules</h2>
              <p className="text-xs text-navy-500 mt-1">
                Structured recruitment mastery designed for production hiring excellence.
              </p>
            </div>
            <Badge variant="primary" size="md">
              70% Passing Benchmark Per Module
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACADEMY_MODULES.map((module) => (
              <Card key={module.id} hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      Module {module.number}
                    </span>
                    <Badge variant="outline" size="sm">
                      Pass: {module.passingScore}%
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-sm">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-navy-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lessons, interactive exercises &amp; randomized quiz</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Final Assessment Card */}
            <Card hoverable className="border-brand-300 bg-gradient-to-br from-white to-brand-50/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Capstone Evaluation
                  </span>
                  <Badge variant="warning" size="sm">
                    20 Qs &bull; 20 Mins
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-sm">Final Assessment</CardTitle>
                <CardDescription>
                  Comprehensive cross-competency evaluation. Unlocks strictly upon passing all 5 modules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-navy-600 font-medium">
                  <Award className="w-4 h-4 text-brand-600" />
                  <span>Triggers Admin Certificate Approval upon passing (70%)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Operational Capabilities Grid */}
        <section className="py-12 bg-navy-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                Post-Certification Operations
              </h2>
              <p className="text-2xl font-bold text-white mt-1">
                Recruitment Operations Workspace
              </p>
              <p className="text-xs text-slate-400 mt-2">
                A dedicated daily command center unlocked exclusively for verified certified recruiters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl bg-navy-800/60 border border-navy-700/80">
                <Users className="w-6 h-6 text-brand-400 mb-3" />
                <h4 className="text-sm font-semibold text-white">11-Stage Pipeline</h4>
                <p className="text-xs text-slate-400 mt-1">
                  From Sourced to Joined with full status tracking, follow-ups, and disposition recording.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-800/60 border border-navy-700/80">
                <Target className="w-6 h-6 text-emerald-400 mb-3" />
                <h4 className="text-sm font-semibold text-white">Targets &amp; Checklists</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Daily, weekly, and monthly goal tracking with structured shift checklists and productivity metrics.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-800/60 border border-navy-700/80">
                <Briefcase className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="text-sm font-semibold text-white">Recruiter Toolkit</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Boolean search builders, outreach email templates, call scripts, and salary calculators.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-800/60 border border-navy-700/80">
                <ShieldCheck className="w-6 h-6 text-blue-400 mb-3" />
                <h4 className="text-sm font-semibold text-white">Manager Review &amp; Reports</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Structured end-of-day submissions. Dual-control manager approval ensures audit accuracy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-navy-950 text-slate-400 py-10 border-t border-navy-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-slate-200">{COMPANY_INFO.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Corporate Identification Number (CIN): <span className="font-mono">{COMPANY_INFO.cin}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Registered Office: {COMPANY_INFO.location} &bull; {COMPANY_INFO.roc}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-white transition-colors">
                Candidate Login
              </Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">
                Admin Login
              </Link>
              <a
                href={COMPANY_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Corporate Website
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-navy-900 text-center text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved. Recruiter Academy + Recruitment Operations Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
