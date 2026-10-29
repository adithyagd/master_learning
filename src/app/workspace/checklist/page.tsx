import React from "react";
import { redirect } from "next/navigation";
import { getChecklistForDate } from "@/actions/workspace";
import { WorkspaceChecklistClient } from "@/components/workspace/WorkspaceChecklistClient";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WorkspaceChecklistPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checklistData = await getChecklistForDate(params.date);

  if (!checklistData) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  return (
    <WorkspaceChecklistClient
      initialData={{
        recruiter: {
          fullName: checklistData.recruiter.fullName,
          candidateId: checklistData.recruiter.candidateId,
        },
        dateStr: checklistData.dateStr,
        totalCount: checklistData.totalCount,
        completedCount: checklistData.completedCount,
        overallPercentage: checklistData.overallPercentage,
        isDayCompleted: checklistData.isDayCompleted,
        sections: checklistData.sections as any,
      }}
    />
  );
}
