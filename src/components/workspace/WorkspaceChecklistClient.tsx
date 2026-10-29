"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { toggleChecklistItem, markWorkdayCompleted } from "@/actions/workspace";
import {
  CheckSquare,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Sun,
  Briefcase,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Award,
} from "lucide-react";

interface ChecklistItemState {
  key: string;
  section: "MORNING" | "DURING_DAY" | "END_OF_DAY";
  sectionTitle: string;
  order: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date | string | null;
}

interface ChecklistSectionState {
  id: "MORNING" | "DURING_DAY" | "END_OF_DAY";
  label: string;
  total: number;
  completed: number;
  percentage: number;
  items: ChecklistItemState[];
}

interface WorkspaceChecklistProps {
  initialData: {
    recruiter: {
      fullName: string;
      candidateId: string;
    };
    dateStr: string;
    totalCount: number;
    completedCount: number;
    overallPercentage: number;
    isDayCompleted: boolean;
    sections: ChecklistSectionState[];
  };
}

export function WorkspaceChecklistClient({ initialData }: WorkspaceChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dateStr, setDateStr] = useState(initialData.dateStr);
  const [sections, setSections] = useState(initialData.sections);
  const [isDayCompleted, setIsDayCompleted] = useState(initialData.isDayCompleted);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Recalculate totals dynamically from current state
  const allItems = sections.flatMap((s) => s.items);
  const totalCount = allItems.length; // 22
  const completedCount = allItems.filter((i) => i.isCompleted).length;
  const overallPercentage = Math.round((completedCount / totalCount) * 100);

  // Date switching
  const handleDateChange = (newDateStr: string) => {
    setDateStr(newDateStr);
    router.push(`/workspace/checklist?date=${newDateStr}`);
  };

  const handleShiftDate = (days: number) => {
    const current = new Date(dateStr);
    current.setDate(current.getDate() + days);
    const newStr = current.toISOString().split("T")[0];
    handleDateChange(newStr);
  };

  // Toggle checklist item
  const handleToggle = (
    sectionId: "MORNING" | "DURING_DAY" | "END_OF_DAY",
    itemKey: string,
    currentStatus: boolean,
    title: string
  ) => {
    const nextStatus = !currentStatus;
    const now = nextStatus ? new Date() : null;

    // Optimistic state update
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const updatedItems = sec.items.map((item) =>
          item.key === itemKey ? { ...item, isCompleted: nextStatus, completedAt: now } : item
        );
        const secDone = updatedItems.filter((i) => i.isCompleted).length;
        return {
          ...sec,
          completed: secDone,
          percentage: Math.round((secDone / sec.total) * 100),
          items: updatedItems,
        };
      })
    );

    if (itemKey === "eod_mark_day_completed") {
      setIsDayCompleted(nextStatus);
    }

    startTransition(async () => {
      const res = await toggleChecklistItem(itemKey, nextStatus, title, sectionId, dateStr);
      if (res.success) {
        if (itemKey === "eod_mark_day_completed" && nextStatus) {
          setStatusMessage("Workday officially marked completed for this date!");
        }
      }
    });
  };

  // Mark Day Completed button handler
  const handleMarkDayCompleted = () => {
    handleToggle("END_OF_DAY", "eod_mark_day_completed", false, "Mark the day completed when applicable");
  };

  const formattedDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isToday = new Date().toISOString().split("T")[0] === dateStr;

  const getSectionIcon = (id: string) => {
    if (id === "MORNING") return <Sun className="w-5 h-5 text-amber-500" />;
    if (id === "DURING_DAY") return <Briefcase className="w-5 h-5 text-blue-600" />;
    return <Moon className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {initialData.recruiter.candidateId}
            </span>
            <Badge variant="primary" size="sm">
              Standard Operating Procedure
            </Badge>
            {isToday && (
              <Badge variant="success" size="sm" dot>
                Today
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Recruiter Daily SOP Checklist
          </h1>
          <p className="text-xs text-gray-500">
            Persistent 3-section daily workflow for {initialData.recruiter.fullName} &bull; {formattedDate}
          </p>
        </div>

        {/* Date Picker Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              title="Previous Day"
              className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs font-semibold text-gray-800 px-2 py-1.5 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              title="Next Day"
              className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(new Date().toISOString().split("T")[0])}
            disabled={isToday}
            className="text-xs"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Completion Banner if Marked Done */}
      {isDayCompleted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Workday Officially Completed</h3>
              <p className="text-xs text-emerald-100">
                All mandatory operational tasks for {formattedDate} have been fulfilled and verified.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" className="bg-white/20 text-white border-white/30 font-bold">
              {completedCount}/{totalCount} Tasks Done
            </Badge>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Overall Progress Scorecard */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Daily Completion Progress
              </span>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                {completedCount} of {totalCount} Tasks Completed ({overallPercentage}%)
              </div>
            </div>

            {/* Section Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                    sec.completed === sec.total
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-gray-200"
                  }`}
                >
                  <span>{sec.id === "MORNING" ? "Morning" : sec.id === "DURING_DAY" ? "During Day" : "End of Day"}:</span>
                  <span className="font-bold">{sec.completed}/{sec.total}</span>
                </div>
              ))}
            </div>
          </div>

          <ProgressBar
            value={overallPercentage}
            max={100}
            variant={overallPercentage === 100 ? "success" : "brand"}
            size="md"
          />
        </CardContent>
      </Card>

      {/* The 3 Dedicated Operational Sections */}
      <div className="space-y-6">
        {sections.map((section) => {
          const isAllDone = section.completed === section.total;

          return (
            <Card key={section.id} className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-gray-200 py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getSectionIcon(section.id)}
                    <div>
                      <CardTitle className="text-base text-gray-900">
                        {section.label}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {section.id === "MORNING"
                          ? "Essential morning preparations, lineup verification, and target calibration (8 tasks)"
                          : section.id === "DURING_DAY"
                          ? "Execution of active candidate sourcing, calls, screening, interviews, and offers (8 tasks)"
                          : "Status updates, report submission, tomorrow planning, and workday closeout (6 tasks)"}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isAllDone
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-white text-gray-800 border-gray-300"
                      }`}
                    >
                      {section.completed} / {section.total} ({section.percentage}%)
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-gray-100">
                {section.items.map((item) => {
                  const completedTimeStr = item.completedAt
                    ? new Date(item.completedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggle(section.id, item.key, item.isCompleted, item.title)}
                      className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer select-none ${
                        item.isCompleted
                          ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => {}} // Handled by container onClick for better mobile touch hit target
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer flex-shrink-0"
                      />

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              item.isCompleted
                                ? "text-emerald-950 line-through opacity-80"
                                : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.key === "eod_mark_day_completed" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                              Workday Milestone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {item.isCompleted && (
                        <div className="text-right flex-shrink-0 space-y-0.5">
                          <Badge variant="success" size="sm" className="gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </Badge>
                          {completedTimeStr && (
                            <span className="text-[10px] text-gray-400 block font-mono">
                              at {completedTimeStr}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>

              {/* Special Closeout Action on End of Day */}
              {section.id === "END_OF_DAY" && !isDayCompleted && (
                <CardFooter className="bg-slate-50 border-t border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Finished all daily recruiter operations? Formally close out the workday.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isPending}
                    onClick={handleMarkDayCompleted}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm text-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Mark Workday Completed
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
