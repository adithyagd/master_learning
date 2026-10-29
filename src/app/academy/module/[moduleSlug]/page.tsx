import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getModuleWithProgress } from "@/actions/academy";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logoutUser } from "@/actions/auth";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Clock,
  Award,
  Sparkles,
} from "lucide-react";

interface ModulePageProps {
  params: Promise<{ moduleSlug: string }>;
}

export default async function ModuleOverviewPage({ params }: ModulePageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    redirect("/login");
  }

  const { moduleSlug } = await params;
  const moduleData = await getModuleWithProgress(moduleSlug, user.candidateProfile.id);

  if (!moduleData) {
    notFound();
  }

  const firstIncompleteLesson = moduleData.lessons.find((l) => !l.isCompleted);
  const primaryActionLesson = firstIncompleteLesson || moduleData.lessons[0];

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

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <Link href="/academy" className="hover:text-brand-600 transition-colors font-medium">
            Academy
          </Link>
          <span>/</span>
          <span className="text-navy-800 font-semibold">{moduleData.title}</span>
        </div>

        {/* Module Header Hero Card */}
        <Card className="bg-white border-navy-200/90 shadow-sm overflow-hidden">
          <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-navy-50/70 via-white to-navy-50/30 border-b border-navy-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Module {moduleData.moduleNumber} of 5</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  {moduleData.title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-navy-600 max-w-2xl leading-relaxed">
                  {moduleData.description}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 bg-white p-4 rounded-xl border border-navy-200 shadow-xs">
                <span className="text-[11px] text-navy-500 font-medium">Passing Benchmark</span>
                <Badge variant="primary" size="md">
                  {moduleData.passingScore}% Assessment Score
                </Badge>
                <span className="text-[10px] text-navy-400">
                  {moduleData.completedLessons} of {moduleData.totalLessons} Lessons Completed
                </span>
              </div>
            </div>

            {/* Module Progress Bar */}
            <div className="mt-6 pt-6 border-t border-navy-100">
              <div className="flex justify-between items-center text-xs mb-1.5 text-navy-700 font-medium">
                <span>Lesson Curriculum Progress</span>
                <span className="font-semibold text-navy-900">
                  {moduleData.progressPercentage}%
                </span>
              </div>
              <ProgressBar
                value={moduleData.progressPercentage}
                max={100}
                variant={moduleData.allLessonsCompleted ? "success" : "brand"}
                size="md"
              />
            </div>
          </CardHeader>

          {/* Module Action Bar */}
          {!moduleData.isLocked && (
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 sm:px-8 py-4">
              <div className="text-xs text-navy-500">
                {moduleData.allLessonsCompleted ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    All {moduleData.totalLessons} lessons completed!
                  </span>
                ) : (
                  <span>
                    Continue with Lesson {primaryActionLesson?.lessonNumber}:{" "}
                    <strong>{primaryActionLesson?.title}</strong>
                  </span>
                )}
              </div>

              {primaryActionLesson && (
                <Link
                  href={`/academy/module/${moduleData.slug}/${primaryActionLesson.slug}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {moduleData.allLessonsCompleted
                      ? "Review Lesson 1"
                      : `Continue Lesson ${primaryActionLesson.lessonNumber}`}
                  </Button>
                </Link>
              )}
            </CardFooter>
          )}
        </Card>

        {/* Locked Banner if Module is Locked */}
        {moduleData.isLocked ? (
          <Card className="text-center p-8 bg-amber-50/30 border-amber-200">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <CardTitle className="text-navy-900">Module Currently Locked</CardTitle>
              <CardDescription className="text-navy-600 max-w-md mx-auto">
                This module unlocks strictly after passing the assessment of the preceding module with &ge;70%. Progression cannot be bypassed.
              </CardDescription>
              <Link href="/academy" className="block pt-2">
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Trainee Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Lessons List */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900">Module Lessons</h2>
              <span className="text-xs text-navy-500">
                {moduleData.totalLessons} structured lessons
              </span>
            </div>

            <div className="space-y-3">
              {moduleData.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`p-4 sm:p-5 rounded-xl border bg-white transition-all hover:border-navy-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    lesson.isCompleted ? "border-navy-200/90" : "border-navy-200"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        lesson.isCompleted
                          ? "bg-success-100 text-success-700 border border-success-200"
                          : "bg-navy-100 text-navy-700"
                      }`}
                    >
                      {lesson.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        lesson.lessonNumber
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-navy-900">{lesson.title}</h3>
                        {lesson.isCompleted && (
                          <Badge variant="success" size="sm">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-navy-500 mt-1 max-w-2xl leading-relaxed">
                        {lesson.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-navy-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.estimatedMinutes} mins
                        </span>
                        {lesson.completedAt && (
                          <span>
                            &bull; Completed{" "}
                            {new Date(lesson.completedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Link href={`/academy/module/${moduleData.slug}/${lesson.slug}`}>
                      <Button
                        variant={lesson.isCompleted ? "outline" : "primary"}
                        size="sm"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {lesson.isCompleted ? "Review Lesson" : "Start Lesson"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Assessment Milestone Box */}
            <Card className="border-brand-200 bg-gradient-to-r from-brand-50/40 to-slate-50 mt-6">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900">
                      Module Assessment &bull; Passing Score: {moduleData.passingScore}%
                    </h4>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {moduleData.allLessonsCompleted
                        ? "All module lessons completed! Take the dynamic 10-question evaluation to test your competency."
                        : "Complete all module lessons to qualify for the dynamic module assessment."}
                    </p>
                  </div>
                </div>

                {moduleData.allLessonsCompleted ? (
                  <Link href={`/academy/assessment/assessment-module-${moduleData.moduleNumber}`}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Take Assessment
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="default" size="md">
                    Lessons Pending
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
