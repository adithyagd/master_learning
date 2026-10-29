"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { submitDailyReport } from "@/actions/workspace";
import {
  FileText,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  History,
} from "lucide-react";

interface DailyReportItem {
  id: string;
  reportDate: Date | string;
  profilesSourced: number;
  callsMade: number;
  candidatesInterested: number;
  candidatesScreened: number;
  profilesSubmitted: number;
  interviewsScheduled: number;
  interviewsAttended: number;
  selections: number;
  offersExtended: number;
  joinings: number;
  highlights: string | null;
  challenges: string | null;
  planForTomorrow: string | null;
  status: string;
}

interface WorkspaceDailyReportProps {
  initialReports: DailyReportItem[];
  recruiterName: string;
  candidateId: string;
}

export function WorkspaceDailyReportClient({
  initialReports,
  recruiterName,
  candidateId,
}: WorkspaceDailyReportProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sourced, setSourced] = useState(0);
  const [calls, setCalls] = useState(0);
  const [interested, setInterested] = useState(0);
  const [screened, setScreened] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [itvScheduled, setItvScheduled] = useState(0);
  const [itvAttended, setItvAttended] = useState(0);
  const [selections, setSelections] = useState(0);
  const [offers, setOffers] = useState(0);
  const [joinings, setJoinings] = useState(0);

  const [highlights, setHighlights] = useState("");
  const [challenges, setChallenges] = useState("");
  const [planTomorrow, setPlanTomorrow] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const res = await submitDailyReport({
        profilesSourced: Number(sourced),
        callsMade: Number(calls),
        candidatesInterested: Number(interested),
        candidatesScreened: Number(screened),
        profilesSubmitted: Number(submitted),
        interviewsScheduled: Number(itvScheduled),
        interviewsAttended: Number(itvAttended),
        selections: Number(selections),
        offersExtended: Number(offers),
        joinings: Number(joinings),
        highlights: highlights || undefined,
        challenges: challenges || undefined,
        planForTomorrow: planTomorrow || undefined,
      });

      if (res.success) {
        setMessage("Daily operations report submitted successfully! Targets updated.");
        router.refresh();
      } else {
        setError(res.message || "Failed to submit daily report.");
      }
    });
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">End-of-Day Recruiter Report</h1>
          <Badge variant="primary" size="sm">
            EOD Operations Log
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Record your daily sourcing, outreach, interview coordination, and offer progression metrics for {todayStr}.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs text-emerald-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-rose-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Form (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Submit Today&apos;s Daily Metrics
              </CardTitle>
              <CardDescription className="text-xs">
                Accurate recordkeeping is required for platform targets and recruiter SLAs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                {/* Sourcing & Outreach */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-blue-800 border-b border-gray-100 pb-1">
                    1. Sourcing &amp; Outreach
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Profiles Sourced</label>
                      <Input
                        type="number"
                        min="0"
                        value={sourced}
                        onChange={(e) => setSourced(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Calls Made</label>
                      <Input
                        type="number"
                        min="0"
                        value={calls}
                        onChange={(e) => setCalls(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Interested</label>
                      <Input
                        type="number"
                        min="0"
                        value={interested}
                        onChange={(e) => setInterested(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Screened</label>
                      <Input
                        type="number"
                        min="0"
                        value={screened}
                        onChange={(e) => setScreened(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Submissions & Interviews */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-blue-800 border-b border-gray-100 pb-1">
                    2. Client Submissions &amp; Interviews
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Profiles Submitted</label>
                      <Input
                        type="number"
                        min="0"
                        value={submitted}
                        onChange={(e) => setSubmitted(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Interviews Scheduled</label>
                      <Input
                        type="number"
                        min="0"
                        value={itvScheduled}
                        onChange={(e) => setItvScheduled(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Interviews Attended</label>
                      <Input
                        type="number"
                        min="0"
                        value={itvAttended}
                        onChange={(e) => setItvAttended(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Selections, Offers & Joins */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-blue-800 border-b border-gray-100 pb-1">
                    3. Selections, Offers &amp; Joinings
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Selections</label>
                      <Input
                        type="number"
                        min="0"
                        value={selections}
                        onChange={(e) => setSelections(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Offers Extended</label>
                      <Input
                        type="number"
                        min="0"
                        value={offers}
                        onChange={(e) => setOffers(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Candidates Joined</label>
                      <Input
                        type="number"
                        min="0"
                        value={joinings}
                        onChange={(e) => setJoinings(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Qualitative Highlights */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider text-blue-800 border-b border-gray-100 pb-1">
                    4. Operational Summary &amp; Next Steps
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Key Highlights of the Day</label>
                      <textarea
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        placeholder="e.g. Conducted 15 calls for CNC operator role; shortlisted 3 strong profiles."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Bottlenecks or Challenges</label>
                      <textarea
                        value={challenges}
                        onChange={(e) => setChallenges(e.target.value)}
                        placeholder="e.g. High salary expectation for mechanical roles in Bangalore; need budget review."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Focus Plan for Tomorrow</label>
                      <textarea
                        value={planTomorrow}
                        onChange={(e) => setPlanTomorrow(e.target.value)}
                        placeholder="e.g. Target ITI colleges for entry-level technician sourcing; follow up on 2 client interviews."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {isPending ? "Submitting Report..." : "Submit Daily Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History Column (1 col) */}
        <div>
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Submitted Reports History
              </CardTitle>
              <CardDescription className="text-xs">
                Recent EOD logs recorded for {recruiterName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 space-y-1">
                  <Clock className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="font-medium text-gray-700">No past reports submitted yet</p>
                  <p className="text-[11px] text-gray-400">
                    Your submitted reports will be archived here chronologically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {initialReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 rounded-xl border border-gray-200 bg-slate-50/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="font-bold text-gray-900">
                          {new Date(rep.reportDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <Badge variant="success" size="sm">
                          {rep.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                        <div>
                          <span className="text-gray-400 block">Calls:</span>
                          <span className="font-bold text-gray-800">{rep.callsMade}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Submits:</span>
                          <span className="font-bold text-gray-800">{rep.profilesSubmitted}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Interviews:</span>
                          <span className="font-bold text-gray-800">{rep.interviewsScheduled}</span>
                        </div>
                      </div>

                      {rep.highlights && (
                        <p className="text-[11px] text-gray-600 line-clamp-2 italic pt-1 border-t border-gray-100">
                          &quot;{rep.highlights}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
