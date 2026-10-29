import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerDashboard } from "@/actions/manager";
import { ManagerTargetsClient } from "@/components/manager/ManagerTargetsClient";

export const metadata = {
  title: "Team Targets | E2E Manager Portal",
  description: "Track operational recruitment targets and achievement bands across assigned recruiters.",
};

export default async function ManagerTargetsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const res = await getManagerDashboard();
  const teamSummary = res.success && res.data ? res.data.teamSummary : {
    teamSize: 0,
    totalCalls: 0,
    totalShortlisted: 0,
    totalLineUps: 0,
    totalOffers: 0,
    totalJoins: 0,
    targetCalls: 0,
    targetShortlists: 0,
    targetJoins: 0,
    achievementPct: 0,
    achievementBand: "No Team Members",
  };
  const rankings = res.success && res.data ? res.data.rankings : [];

  return <ManagerTargetsClient teamSummary={teamSummary} rankings={rankings} />;
}
