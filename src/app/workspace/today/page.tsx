import React from "react";
import { redirect } from "next/navigation";
import { getWorkspaceDailyOverview } from "@/actions/workspace";
import { WorkspaceTodayClient } from "@/components/workspace/WorkspaceTodayClient";

export default async function WorkspaceTodayPage() {
  const overview = await getWorkspaceDailyOverview();

  if (!overview) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  return <WorkspaceTodayClient overview={overview} />;
}
