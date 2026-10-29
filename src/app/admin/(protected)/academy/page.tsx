import React from "react";
import Link from "next/link";
import { ACADEMY_MODULES, FINAL_ASSESSMENT_CONFIG } from "@/lib/design-system";
import { GraduationCap, Award, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Academy Management | E2E Admin",
  description: "Manage curriculum modules, assessment benchmarks, and question banks.",
};

export default function AdminAcademyPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
            Academy Governance
          </span>
          <h1 className="text-2xl font-bold text-navy-950 mt-1">
            Curriculum, Modules & Assessment Bank
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Standardized 5-module recruiter training track and 70% passing threshold benchmarks.
          </p>
        </div>

        <Link
          href="/admin/certificates"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs"
        >
          <Award className="w-4 h-4" />
          Review Certificates
        </Link>
      </div>

      {/* Final Assessment Benchmark Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-950">{FINAL_ASSESSMENT_CONFIG.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{FINAL_ASSESSMENT_CONFIG.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block">Questions</span>
            <span className="font-bold text-navy-900">{FINAL_ASSESSMENT_CONFIG.totalQuestions}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Duration</span>
            <span className="font-bold text-navy-900">{FINAL_ASSESSMENT_CONFIG.durationMinutes} mins</span>
          </div>
          <div>
            <span className="text-slate-400 block">Passing Score</span>
            <span className="font-bold text-emerald-700">{FINAL_ASSESSMENT_CONFIG.passingScore}%</span>
          </div>
        </div>
      </div>

      {/* 5 Modules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACADEMY_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Module {mod.number}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Passing: {mod.passingScore}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-navy-950 mt-1">{mod.title}</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{mod.description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">5 Lessons &bull; 10 Quizzes</span>
              <Link
                href={`/academy/module/${mod.id}`}
                className="text-brand-600 font-semibold hover:text-brand-800 flex items-center gap-1"
              >
                Inspect Module <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
