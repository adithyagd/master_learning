import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logoutUser } from "@/actions/auth";
import {
  FINAL_ASSESSMENT_CONFIG,
  CERTIFICATE_STATUS_CONFIG,
  CertificateStatus,
} from "@/lib/design-system";
import {
  GraduationCap,
  Award,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

interface AcademyPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    redirect("/login");
  }

  const profile = user.candidateProfile;
  const currentMod = profile.currentModuleNumber;
  const isCertified = Boolean(profile.isCertified);
  const isAcademyCompleted = profile.academyStatus === "COMPLETED";
  const certStatus = (profile.certificateStatus || "NOT_ELIGIBLE") as CertificateStatus;
  const certConfig =
    CERTIFICATE_STATUS_CONFIG[certStatus] || CERTIFICATE_STATUS_CONFIG.NOT_ELIGIBLE;

  // Query database modules with candidate's lesson progress
  const dbModules = await prisma.module.findMany({
    orderBy: { moduleNumber: "asc" },
    include: {
      lessons: {
        orderBy: { lessonNumber: "asc" },
        include: {
          progress: {
            where: { candidateProfileId: profile.id },
          },
        },
      },
    },
  });

  // Calculate overall metrics
  let totalLessonsInCurriculum = 0;
  let totalCompletedLessons = 0;

  const modulesWithMetrics = dbModules.map((mod) => {
    const totalLessons = mod.lessons.length;
    const completedLessons = mod.lessons.filter(
      (l) => l.progress.length > 0 && l.progress[0].isCompleted
    ).length;

    totalLessonsInCurriculum += totalLessons;
    totalCompletedLessons += completedLessons;

    const isLocked = mod.moduleNumber > currentMod;
    const isCurrent = mod.moduleNumber === currentMod;
    const isAllLessonsDone = totalLessons > 0 && completedLessons === totalLessons;

    return {
      ...mod,
      totalLessons,
      completedLessons,
      isLocked,
      isCurrent,
      isAllLessonsDone,
      percentDone: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });

  const overallProgress =
    totalLessonsInCurriculum > 0
      ? Math.round((totalCompletedLessons / totalLessonsInCurriculum) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: profile.fullName,
          email: user.email,
          role: "CANDIDATE",
          isCertified,
          candidateCode: profile.candidateId,
        }}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Workspace Lock Warning Banner */}
        {params.error === "certification_required_for_workspace" && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Recruitment Operations Workspace Locked</p>
              <p className="mt-1 leading-relaxed">
                Candidates must never access the Operations Workspace before the required certification is approved and issued by an authorized Admin. Complete Modules 1–5 and pass the Final Assessment to request certification.
              </p>
            </div>
          </div>
        )}

        {/* Trainee Welcome Card */}
        <Card className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white border-navy-800">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="primary"
                    size="sm"
                    className="bg-brand-900/80 text-brand-300 border-brand-700"
                  >
                    Candidate Recruiter Portal
                  </Badge>
                  <span className="font-mono text-xs text-brand-400 font-bold">
                    {profile.candidateId}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome, {profile.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Complete the 5 recruitment competency modules and pass the Final Assessment (&ge;70%) to achieve official E2E Procurement certification.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 bg-navy-900/80 p-4 rounded-xl border border-navy-800">
                <span className="text-[11px] text-slate-400 font-medium">Certificate Status</span>
                <Badge variant={certConfig.badgeVariant} size="md">
                  {certConfig.label}
                </Badge>
                <Link
                  href="/academy/certificate"
                  className="text-[11px] text-brand-300 hover:text-white underline underline-offset-2 flex items-center gap-1 mt-1 font-medium"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isCertified ? "View Official Certificate" : "Check Certificate Status"}</span>
                </Link>

              </div>
            </div>

            {/* Overall Curriculum Progress */}
            <div className="mt-6 pt-6 border-t border-navy-800/80">
              <div className="flex justify-between items-center text-xs mb-2 text-slate-300">
                <span>Overall Lesson Progress</span>
                <span className="font-semibold text-white">
                  {totalCompletedLessons} of {totalLessonsInCurriculum} lessons completed ({overallProgress}%)
                </span>
              </div>
              <ProgressBar
                value={overallProgress}
                max={100}
                variant="brand"
                size="md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-navy-900">Curriculum Modules</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-navy-500 font-medium hidden sm:inline">
                Passing benchmark: 70% per assessment
              </span>
              <Link href="/academy/toolkit">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<BookOpen className="w-4 h-4 text-brand-600" />}
                >
                  Recruiter Reference Toolkit
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modulesWithMetrics.map((module) => (
              <Card
                key={module.id}
                hoverable={!module.isLocked}
                className={module.isLocked ? "opacity-60 bg-slate-100/60" : "bg-white"}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      Module {module.moduleNumber}
                    </span>
                    <Badge
                      variant={
                        module.isAllLessonsDone
                          ? "success"
                          : module.isCurrent
                          ? "warning"
                          : "default"
                      }
                      size="sm"
                    >
                      {module.isLocked
                        ? "Locked"
                        : module.isAllLessonsDone
                        ? "Lessons Complete"
                        : `${module.completedLessons}/${module.totalLessons} Done`}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-sm">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-xs text-navy-600 space-y-2">
                  <div className="flex items-center gap-2">
                    {module.isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-navy-400" />
                        <span className="text-navy-400">Locked until preceding module passed</span>
                      </>
                    ) : module.isAllLessonsDone ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">
                          All {module.totalLessons} lessons completed
                        </span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                        <span>
                          {module.completedLessons} of {module.totalLessons} lessons finished
                        </span>
                      </>
                    )}
                  </div>

                  {!module.isLocked && (
                    <div className="pt-1">
                      <ProgressBar
                        value={module.percentDone}
                        max={100}
                        size="sm"
                        variant={module.isAllLessonsDone ? "success" : "brand"}
                      />
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  {module.isLocked ? (
                    <Button variant="outline" size="sm" disabled className="w-full text-xs">
                      Locked
                    </Button>
                  ) : (
                    <Link href={`/academy/module/${module.slug}`} className="w-full">
                      <Button
                        variant={module.isAllLessonsDone ? "outline" : "primary"}
                        size="sm"
                        className="w-full text-xs"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {module.isAllLessonsDone ? "Review Module" : "Open Module"}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}

            {/* Separate Final Assessment Entry */}
            <Card
              hoverable={currentMod > 5}
              className={
                currentMod <= 5
                  ? "opacity-60 bg-slate-100/60"
                  : "border-brand-400 bg-brand-50/10"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Capstone Evaluation
                  </span>
                  <Badge
                    variant={isAcademyCompleted ? "success" : currentMod > 5 ? "warning" : "default"}
                    size="sm"
                  >
                    {isAcademyCompleted ? "Completed" : currentMod > 5 ? "Unlocked" : "Locked"}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-sm">
                  {FINAL_ASSESSMENT_CONFIG.title}
                </CardTitle>
                <CardDescription>
                  {FINAL_ASSESSMENT_CONFIG.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-navy-600">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-600" />
                  <span>
                    20 Questions &bull; 20 Minutes &bull; 70% Passing Score
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {isAcademyCompleted ? (
                  <Link href="/academy/assessment/final-assessment" className="w-full">
                    <Button variant="success" size="sm" className="w-full text-xs gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      View Final Assessment Review
                    </Button>
                  </Link>
                ) : currentMod > 5 ? (
                  <Link href="/academy/assessment/final-assessment" className="w-full">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      Launch Final Assessment
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled
                    className="w-full text-xs"
                  >
                    Pass Modules 1–5 to Unlock
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
