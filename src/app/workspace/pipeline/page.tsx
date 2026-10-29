import React from "react";
import { redirect } from "next/navigation";
import { getRecruiterCandidates, getAuthenticatedRecruiter } from "@/actions/workspace";
import { WorkspacePipelineClient } from "@/components/workspace/WorkspacePipelineClient";

export default async function WorkspacePipelinePage() {
  const recruiter = await getAuthenticatedRecruiter();
  if (!recruiter) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  const res = await getRecruiterCandidates();
  const candidates = res.data || [];

  return (
    <WorkspacePipelineClient
      initialCandidates={candidates}
      recruiterName={recruiter.fullName}
      candidateId={recruiter.candidateId}
    />
  );
}
