import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedRecruiter } from "@/actions/workspace";
import { getRecruiterTargets, getTargetChangeHistory } from "@/actions/target";
import { TargetPeriodType } from "@/lib/target-calculator";
import { WorkspaceTargetsClient } from "@/components/workspace/WorkspaceTargetsClient";

export default async function WorkspaceTargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const params = await searchParams;
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  const periodType = (params.period?.toUpperCase() as TargetPeriodType) || "DAILY";
  const validPeriodType: TargetPeriodType = ["DAILY", "WEEKLY", "MONTHLY"].includes(periodType)
    ? periodType
    : "DAILY";

  const targetsRes = await getRecruiterTargets({
    recruiterProfileId: recruiter.profileId,
    periodType: validPeriodType,
    periodDate: params.date,
  });

  if (!targetsRes.success || !targetsRes.data) {
    redirect("/workspace?error=target_load_failed");
  }

  const historyRes = await getTargetChangeHistory({
    recruiterProfileId: recruiter.profileId,
  });

  return (
    <WorkspaceTargetsClient
      initialData={targetsRes.data}
      targetHistory={historyRes.data || []}
    />
  );
}
