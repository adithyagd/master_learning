"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { markLessonComplete } from "@/actions/academy";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface LessonViewerProps {
  module: {
    id: string;
    moduleNumber: number;
    title: string;
    slug: string;
  };
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    estimatedMinutes: number;
  };
  isCompleted: boolean;
  completedAt: string | null;
  prevLesson?: {
    lessonNumber: number;
    title: string;
    slug: string;
  } | null;
  nextLesson?: {
    lessonNumber: number;
    title: string;
    slug: string;
  } | null;
}

export function LessonViewer({
  module,
  lesson,
  isCompleted: initialCompleted,
  completedAt: initialCompletedAt,
  prevLesson,
  nextLesson,
}: LessonViewerProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [completedAt, setCompletedAt] = useState<string | null>(initialCompletedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMarkComplete() {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await markLessonComplete(lesson.id);
    setIsLoading(false);

    if (res.success) {
      setIsCompleted(true);
      setCompletedAt(new Date().toISOString());

      if (res.data?.nextLessonUrl) {
        router.push(res.data.nextLessonUrl);
      }
    } else {
      setErrorMessage(res.message || "Failed to update lesson progress.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-navy-500">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/academy" className="hover:text-brand-600 transition-colors font-medium">
            Academy
          </Link>
          <span>/</span>
          <Link
            href={`/academy/module/${module.slug}`}
            className="hover:text-brand-600 transition-colors font-medium"
          >
            {module.title}
          </Link>
          <span>/</span>
          <span className="text-navy-800 font-semibold">Lesson {lesson.lessonNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-navy-600">
            <Clock className="w-3.5 h-3.5 text-navy-400" />
            <span>{lesson.estimatedMinutes} mins read</span>
          </span>
          {isCompleted ? (
            <Badge variant="success" size="sm" dot>
              Completed
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {/* Main Lesson Article Container */}
      <article className="bg-white border border-navy-200/90 rounded-2xl shadow-card overflow-hidden">
        {/* Article Header */}
        <header className="p-6 sm:p-8 bg-gradient-to-b from-navy-50/50 to-white border-b border-navy-100">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              Module {module.moduleNumber} &bull; Lesson {lesson.lessonNumber}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight leading-tight">
            {lesson.title}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-navy-600 leading-relaxed max-w-2xl">
            {lesson.summary}
          </p>
        </header>

        {/* Lesson Body Content */}
        <div className="p-6 sm:p-8 mode-learning text-navy-900 text-sm leading-relaxed prose prose-slate max-w-none">
          <div className="whitespace-pre-line space-y-4">{lesson.content}</div>
        </div>

        {/* Completion Control Bar */}
        <footer className="p-6 bg-navy-50/60 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {isCompleted ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Lesson completed
                  {completedAt &&
                    ` on ${new Date(completedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`}
                </span>
              </div>
            ) : (
              <p className="text-xs text-navy-500">
                Read through the material carefully before marking this lesson complete.
              </p>
            )}

            {errorMessage && (
              <p className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isCompleted ? (
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto text-sm px-6"
                onClick={handleMarkComplete}
                isLoading={isLoading}
                rightIcon={<FileCheck className="w-4 h-4" />}
              >
                Mark Complete &amp; Continue
              </Button>
            ) : nextLesson ? (
              <Link href={`/academy/module/${module.slug}/${nextLesson.slug}`} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto text-sm px-6"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next Lesson
                </Button>
              </Link>
            ) : (
              <Link href={`/academy/module/${module.slug}`} className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto text-sm px-6">
                  Back to Module Overview
                </Button>
              </Link>
            )}
          </div>
        </footer>
      </article>

      {/* Prev / Next Footer Links */}
      <div className="flex items-center justify-between pt-4 text-xs">
        {prevLesson ? (
          <Link
            href={`/academy/module/${module.slug}/${prevLesson.slug}`}
            className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              Previous: Lesson {prevLesson.lessonNumber}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson && (
          <Link
            href={`/academy/module/${module.slug}/${nextLesson.slug}`}
            className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium transition-colors"
          >
            <span>
              Next: Lesson {nextLesson.lessonNumber}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
