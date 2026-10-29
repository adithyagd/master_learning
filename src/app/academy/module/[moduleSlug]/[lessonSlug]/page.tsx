import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLessonWithNavigation } from "@/actions/academy";
import { Navbar } from "@/components/layout/Navbar";
import { LessonViewer } from "@/components/academy/LessonViewer";
import { logoutUser } from "@/actions/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

interface LessonPageProps {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    redirect("/login");
  }

  const { moduleSlug, lessonSlug } = await params;
  const data = await getLessonWithNavigation(
    moduleSlug,
    lessonSlug,
    user.candidateProfile.id
  );

  if (!data) {
    notFound();
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {data.isLocked ? (
          <div className="max-w-md mx-auto py-12">
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <CardTitle className="text-navy-900">Module Locked</CardTitle>
                <CardDescription className="text-navy-500">
                  This module is locked. Candidates must complete preceding modules and pass their respective assessments (&ge;70%) before unlocking this content.
                </CardDescription>
                <Link href="/academy" className="block pt-2">
                  <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Academy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <LessonViewer
            module={{
              id: data.module.id,
              moduleNumber: data.module.moduleNumber,
              title: data.module.title,
              slug: data.module.slug,
            }}
            lesson={{
              id: data.lesson!.id,
              lessonNumber: data.lesson!.lessonNumber,
              title: data.lesson!.title,
              slug: data.lesson!.slug,
              summary: data.lesson!.summary,
              content: data.lesson!.content,
              estimatedMinutes: data.lesson!.estimatedMinutes,
            }}
            isCompleted={Boolean(data.isCompleted)}
            completedAt={data.completedAt ? data.completedAt.toISOString() : null}
            prevLesson={
              data.prevLesson
                ? {
                    lessonNumber: data.prevLesson.lessonNumber,
                    title: data.prevLesson.title,
                    slug: data.prevLesson.slug,
                  }
                : null
            }
            nextLesson={
              data.nextLesson
                ? {
                    lessonNumber: data.nextLesson.lessonNumber,
                    title: data.nextLesson.title,
                    slug: data.nextLesson.slug,
                  }
                : null
            }
          />
        )}
      </main>
    </div>
  );
}
