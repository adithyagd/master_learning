import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedRecruiter } from "@/actions/workspace";
import { getDailyReportForDate, getRecruiterReportsHistory } from "@/actions/report";
import { getActiveClients } from "@/actions/client";
import { WorkspaceReportClient } from "@/components/workspace/WorkspaceReportClient";

export default async function WorkspaceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  const dateStr = params.date || new Date().toISOString().split("T")[0];
  const [reportData, historyReports, activeClients] = await Promise.all([
    getDailyReportForDate(dateStr),
    getRecruiterReportsHistory(),
    getActiveClients(),
  ]);

  return (
    <WorkspaceReportClient
      currentDateStr={dateStr}
      initialReport={reportData?.report as any}
      recruiterName={recruiter.fullName}
      candidateId={recruiter.candidateId}
      activeClients={activeClients}
      historyReports={historyReports.map((h) => ({
        id: h.id,
        reportDate: h.reportDate,
        status: h.status,
        callsMade: h.callsMade,
        joinings: h.joinings,
        submittedAt: h.submittedAt,
      }))}
    />
  );
}
