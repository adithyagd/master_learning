"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  startAssessmentAttempt,
  saveAssessmentAnswer,
  submitAssessmentAttempt,
  getAssessmentReview,
} from "@/actions/assessment";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  HelpCircle,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface AssessmentOption {
  id: string;
  optionText: string;
  isCorrect?: boolean;
}

interface AssessmentQuestion {
  questionId: string;
  displayOrder: number;
  topic: string;
  difficulty: string;
  questionText: string;
  selectedOptionId: string | null;
  explanation?: string;
  isCorrect?: boolean;
  options: AssessmentOption[];
}

interface ActiveAttemptData {
  id: string;
  attemptNumber: number;
  assessmentSlug: string;
  assessmentTitle: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  startedAt: Date | string;
  totalQuestions: number;
  questions: AssessmentQuestion[];
}

interface ReviewResultData {
  scorePercentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  attemptNumber: number;
  submittedAt: Date | string | null;
  review: AssessmentQuestion[];
}

interface AssessmentEngineProps {
  assessment: {
    id: string;
    type: string;
    slug: string;
    title: string;
    description: string;
    passingScore: number;
    questionCount: number;
    timeLimitMinutes: number | null;
    module?: {
      id: string;
      moduleNumber: number;
      title: string;
      slug: string;
    } | null;
  };
  isLocked?: boolean;
  lockReason?: string;
  initialActiveAttempt?: ActiveAttemptData | null;
  initialReviewResult?: ReviewResultData | null;
  nextModuleSlug?: string | null;
  latestAttemptSummary?: {
    attemptNumber: number;
    scorePercentage: number;
    isPassed: boolean;
    submittedAt: Date | string | null;
  } | null;
}

export function AssessmentEngine({
  assessment,
  isLocked = false,
  lockReason,
  initialActiveAttempt = null,
  initialReviewResult = null,
  nextModuleSlug = null,
  latestAttemptSummary = null,
}: AssessmentEngineProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Engine Modes: "INTRO" | "IN_PROGRESS" | "REVIEW"
  const [engineState, setEngineState] = useState<"INTRO" | "IN_PROGRESS" | "REVIEW">(() => {
    if (initialReviewResult) return "REVIEW";
    if (initialActiveAttempt) return "IN_PROGRESS";
    return "INTRO";
  });

  const [activeAttempt, setActiveAttempt] = useState<ActiveAttemptData | null>(initialActiveAttempt);
  const [reviewResult, setReviewResult] = useState<ReviewResultData | null>(initialReviewResult);

  // In-progress test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initialAnswers: Record<string, string> = {};
    if (initialActiveAttempt) {
      for (const q of initialActiveAttempt.questions) {
        if (q.selectedOptionId) {
          initialAnswers[q.questionId] = q.selectedOptionId;
        }
      }
    }
    return initialAnswers;
  });

  // Modal & review filter state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

  // Timer countdown
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (initialActiveAttempt && initialActiveAttempt.timeLimitMinutes) {
      const elapsed = Math.floor(
        (Date.now() - new Date(initialActiveAttempt.startedAt).getTime()) / 1000
      );
      const totalSec = initialActiveAttempt.timeLimitMinutes * 60;
      return Math.max(0, totalSec - elapsed);
    }
    return null;
  });

  // Submit attempt
  const handleFinalSubmission = useCallback(() => {
    if (!activeAttempt) return;
    setShowSubmitModal(false);
    setActionError(null);

    startTransition(async () => {
      const res = await submitAssessmentAttempt(activeAttempt.id, answers);
      if (res.success && res.data) {
        setReviewResult(res.data);
        setActiveAttempt(null);
        setEngineState("REVIEW");
      } else {
        setActionError(res.message || "Error submitting assessment. Please try again.");
      }
    });
  }, [activeAttempt, answers]);

  // Handle countdown timer
  useEffect(() => {
    if (engineState !== "IN_PROGRESS" || secondsRemaining === null) return;

    if (secondsRemaining <= 0) {
      handleFinalSubmission();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [engineState, secondsRemaining, handleFinalSubmission]);

  // Start new attempt or resume
  const handleStartAttempt = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await startAssessmentAttempt(assessment.slug);
      if (res.success && res.data) {
        setActiveAttempt(res.data.attempt);
        // Pre-fill any resumed draft answers
        const draftAnswers: Record<string, string> = {};
        for (const q of res.data.attempt.questions) {
          if (q.selectedOptionId) {
            draftAnswers[q.questionId] = q.selectedOptionId;
          }
        }
        setAnswers(draftAnswers);
        setCurrentQuestionIndex(0);

        // Setup timer
        if (res.data.attempt.timeLimitMinutes) {
          const elapsed = Math.floor(
            (Date.now() - new Date(res.data.attempt.startedAt).getTime()) / 1000
          );
          const totalSec = res.data.attempt.timeLimitMinutes * 60;
          setSecondsRemaining(Math.max(0, totalSec - elapsed));
        } else {
          setSecondsRemaining(null);
        }

        setEngineState("IN_PROGRESS");
      } else {
        setActionError(res.message || "Failed to start assessment attempt.");
      }
    });
  };

  // Option selection
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (!activeAttempt || engineState !== "IN_PROGRESS") return;

    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    // Real-time server sync
    saveAssessmentAnswer(activeAttempt.id, questionId, optionId).catch((err) => {
      console.warn("Background draft answer sync warning:", err);
    });
  };

  // Helper formatting for timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // -------------------------------------------------------------
  // STATE 1: LOCKED VIEW
  // -------------------------------------------------------------
  if (isLocked) {
    return (
      <Card className="max-w-3xl mx-auto border-amber-200 bg-amber-50/50 shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment Locked</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {lockReason || "This assessment is locked. You must complete preceding modules before attempting it."}
          </p>
          <div className="pt-4">
            <Link href="/academy">
              <Button variant="primary">
                Return to Academy Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: INTRO VIEW
  // -------------------------------------------------------------
  if (engineState === "INTRO") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/academy" className="hover:text-blue-600">Academy</Link>
          <ChevronRight className="w-4 h-4" />
          {assessment.module && (
            <>
              <Link href={`/academy/module/${assessment.module.slug}`} className="hover:text-blue-600">
                Module {assessment.module.moduleNumber}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-900 font-medium">{assessment.title}</span>
        </div>

        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-white/20 text-white border-none font-semibold">
                {assessment.type === "FINAL" ? "CAPSTONE FINAL ASSESSMENT" : `MODULE ${assessment.module?.moduleNumber} EVALUATION`}
              </Badge>
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-none font-medium">
                Pass Mark: {assessment.passingScore}%
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">
              {assessment.title}
            </CardTitle>
            <CardDescription className="text-blue-100 text-base leading-relaxed">
              {assessment.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {actionError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {latestAttemptSummary && (
              <div className={`p-5 rounded-xl border flex items-center justify-between ${
                latestAttemptSummary.isPassed
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}>
                <div className="flex items-center gap-3">
                  {latestAttemptSummary.isPassed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">
                      Previous Attempt #{latestAttemptSummary.attemptNumber}: {latestAttemptSummary.scorePercentage}% ({latestAttemptSummary.isPassed ? "Passed" : "Needs Improvement"})
                    </div>
                    <div className="text-xs opacity-80">
                      Passing threshold benchmark is {assessment.passingScore}%.
                    </div>
                  </div>
                </div>
                {latestAttemptSummary.isPassed ? (
                  <Badge variant="success">Completed</Badge>
                ) : (
                  <Badge variant="warning">Retry Eligible</Badge>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{assessment.questionCount}</div>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Questions</div>
                <div className="text-xs text-gray-400 mt-1">Randomized Selection</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} min` : "Untimed"}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Time Limit</div>
                <div className="text-xs text-gray-400 mt-1">Automatic Submission</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{assessment.passingScore}%</div>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Passing Benchmark</div>
                <div className="text-xs text-gray-400 mt-1">E2E Certification Standard</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-gray-900">Assessment Guidelines & Rules</h4>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li>Questions are drawn dynamically from our verified recruitment competency question bank.</li>
                <li>Your exact question set and draft answers are securely preserved if you refresh your browser.</li>
                <li>On retries, new and previously unused questions are prioritized.</li>
                <li>Full question-by-question explanations will be revealed immediately upon submission.</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Link href={assessment.module ? `/academy/module/${assessment.module.slug}` : "/academy"}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Curriculum
              </Button>
            </Link>

            <Button
              variant="primary"
              onClick={handleStartAttempt}
              disabled={isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-semibold text-base shadow-sm"
            >
              {isPending ? "Generating Attempt..." : "Start Assessment"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: IN PROGRESS VIEW
  // -------------------------------------------------------------
  if (engineState === "IN_PROGRESS" && activeAttempt) {
    const totalQuestions = activeAttempt.questions.length;
    const currentQ = activeAttempt.questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const answeredPercentage = Math.round((answeredCount / totalQuestions) * 100);
    const isCurrentAnswered = Boolean(answers[currentQ.questionId]);
    const unansweredCount = totalQuestions - answeredCount;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Assessment Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="info">Attempt #{activeAttempt.attemptNumber}</Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {assessment.type === "FINAL" ? "Capstone Evaluation" : "Module Assessment"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-1">{activeAttempt.assessmentTitle}</h1>
            </div>

            {/* Countdown Timer */}
            {secondsRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-semibold border ${
                secondsRemaining <= 180
                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}>
                <Clock className="w-5 h-5" />
                <span>Time Remaining: {formatTime(secondsRemaining)}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>Progress: {answeredCount} of {totalQuestions} answered ({answeredPercentage}%)</span>
              <span>Passing: {activeAttempt.passingScore}%</span>
            </div>
            <ProgressBar value={answeredPercentage} variant="brand" className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/80 border-b border-gray-100 p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                Q{currentQuestionIndex + 1}
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Competency: {currentQ.topic}
                </span>
                <div className="text-xs text-gray-400">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>
            </div>

            <Badge
              variant={
                currentQ.difficulty === "HARD"
                  ? "danger"
                  : currentQ.difficulty === "MEDIUM"
                  ? "warning"
                  : "default"
              }
            >
              {currentQ.difficulty}
            </Badge>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQ.questionText}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentQ.questionId] === option.id;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.questionId, option.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm md:text-base text-gray-800 font-normal pt-0.5 leading-snug">
                      {option.optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>

          {/* Navigation and Question Palette */}
          <CardFooter className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === totalQuestions - 1}
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick jump palette */}
            <div className="flex flex-wrap items-center gap-1.5 justify-center max-w-md">
              {activeAttempt.questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.questionId]);
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${
                      isCurrent
                        ? "ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white"
                        : isAnswered
                        ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    title={`Question ${idx + 1}: ${isAnswered ? "Answered" : "Unanswered"}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              onClick={() => setShowSubmitModal(true)}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm"
            >
              Submit Assessment
            </Button>
          </CardFooter>
        </Card>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Submit Assessment?"
          description="Are you ready to submit your answers for evaluation?"
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold text-gray-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Answered Questions:</span>
                <span className="font-semibold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unanswered Questions:</span>
                <span className={`font-semibold ${unansweredCount > 0 ? "text-rose-600" : "text-gray-500"}`}>
                  {unansweredCount}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  You have {unansweredCount} unanswered question(s). Unanswered questions will be evaluated as incorrect.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setShowSubmitModal(false)} disabled={isPending}>
                Keep Answering
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalSubmission}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isPending ? "Evaluating Server Score..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: REVIEW & RESULTS VIEW
  // -------------------------------------------------------------
  if (engineState === "REVIEW" && reviewResult) {
    const isPassed = reviewResult.isPassed;
    const filteredQuestions = reviewResult.review.filter((q) => {
      if (reviewFilter === "CORRECT") return q.isCorrect;
      if (reviewFilter === "INCORRECT") return !q.isCorrect;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Result Banner */}
        <Card
          className={`border overflow-hidden shadow-md ${
            isPassed ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
          }`}
        >
          <div
            className={`p-8 text-center space-y-4 ${
              isPassed
                ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white"
                : "bg-gradient-to-b from-rose-600 to-rose-700 text-white"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-inner">
              {isPassed ? <Award className="w-8 h-8 text-white" /> : <AlertTriangle className="w-8 h-8 text-white" />}
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-bold opacity-80 mb-1">
                Attempt #{reviewResult.attemptNumber} Completed
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {isPassed ? "Assessment Passed!" : "Assessment Needs Improvement"}
              </h1>
            </div>

            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
              <span className="text-2xl font-black">{reviewResult.scorePercentage}%</span>
              <span className="text-sm opacity-80">
                ({reviewResult.correctAnswers} of {reviewResult.totalQuestions} Correct)
              </span>
              <span className="text-xs opacity-75 border-l border-white/20 pl-3">
                Passing Benchmark: {reviewResult.passingScore}%
              </span>
            </div>

            <p className="max-w-lg mx-auto text-sm text-white/90">
              {isPassed
                ? "Excellent performance. You have demonstrated the required competency standards for this recruitment curriculum."
                : "You did not achieve the required 70% passing benchmark. Please review the detailed explanations below to strengthen your understanding, then retry the assessment."}
            </p>
          </div>

          {/* CRITICAL BUSINESS RULE:
              Passing results show ONLY progression action.
              Failed results show ONLY Retry action.
              NEVER display Continue and Retry simultaneously! */}
          <CardFooter className="p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/academy">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <BookOpen className="w-4 h-4" />
                Academy Dashboard
              </Button>
            </Link>

            {isPassed ? (
              // PASSING: Display ONLY progression action
              assessment.type === "FINAL" ? (
                <Link href="/academy" className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 gap-2 text-white font-semibold">
                    View Academy & Certification Status
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link
                  href={nextModuleSlug ? `/academy/module/${nextModuleSlug}` : "/academy/assessment/final-assessment"}
                  className="w-full sm:w-auto"
                >
                  <Button variant="primary" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-2 text-white font-semibold">
                    {nextModuleSlug ? `Continue to Next Module` : "Proceed to Final Assessment"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )
            ) : (
              // FAILED: Display ONLY Retry action
              <Button
                variant="primary"
                onClick={handleStartAttempt}
                disabled={isPending}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {isPending ? "Preparing New Attempt..." : "Retry Assessment"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Detailed Question Review & Explanations */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Question-by-Question Review</h2>
              <p className="text-xs text-gray-500">
                Detailed explanations and verified answers for comprehensive skill reinforcement.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReviewFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({reviewResult.totalQuestions})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("CORRECT")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === "CORRECT" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Correct ({reviewResult.correctAnswers})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("INCORRECT")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === "INCORRECT" ? "bg-rose-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Incorrect ({reviewResult.incorrectAnswers})
              </button>
            </div>
          </div>

          {/* Questions review list */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isCorrect = q.isCorrect;

              return (
                <Card
                  key={q.questionId}
                  className={`border transition-all ${
                    isCorrect ? "border-emerald-200 bg-white" : "border-rose-200 bg-white"
                  }`}
                >
                  <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        Q{q.displayOrder}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={isCorrect ? "success" : "danger"} className="gap-1">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Incorrect
                          </>
                        )}
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        {q.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    <p className="text-base font-medium text-gray-900 leading-snug">
                      {q.questionText}
                    </p>

                    {/* Options status */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCandidateChoice = q.selectedOptionId === opt.id;
                        const isTrueCorrect = Boolean(opt.isCorrect);

                        let cardStyle = "bg-gray-50 border-gray-200 text-gray-700 opacity-70";
                        let badge = null;

                        if (isTrueCorrect && isCandidateChoice) {
                          cardStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium";
                          badge = <Badge variant="success" className="text-xs">Your Answer (Correct)</Badge>;
                        } else if (isTrueCorrect) {
                          cardStyle = "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium";
                          badge = <Badge variant="success" className="text-xs">Correct Answer</Badge>;
                        } else if (isCandidateChoice) {
                          cardStyle = "bg-rose-50 border-rose-300 text-rose-950 font-medium";
                          badge = <Badge variant="danger" className="text-xs">Your Answer (Incorrect)</Badge>;
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm ${cardStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {letter}
                              </span>
                              <span>{opt.optionText}</span>
                            </div>
                            {badge}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-sm space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-xs uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4 text-blue-600" />
                          Explanation & Rationale:
                        </div>
                        <p className="text-sm leading-relaxed text-blue-950">{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
