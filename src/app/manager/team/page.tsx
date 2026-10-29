import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerTeam } from "@/actions/manager";
import { ManagerTeamClient } from "@/components/manager/ManagerTeamClient";

export const metadata = {
  title: "My Team | E2E Manager Portal",
  description: "View and manage assigned recruiters, active candidate pipelines, and report statuses.",
};

export default async function ManagerTeamPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const team = await getManagerTeam();

  return <ManagerTeamClient team={team} />;
}
