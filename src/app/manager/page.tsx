import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerDashboard } from "@/actions/manager";
import { ManagerDashboardClient } from "@/components/manager/ManagerDashboardClient";

export const metadata = {
  title: "Team Dashboard | E2E Manager Portal",
  description: "Monitor assigned team calls, shortlists, line-ups, target achievement, and approvals.",
};

export default async function ManagerPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const res = await getManagerDashboard();
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-sm text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Failed to load manager dashboard. Please try again.
      </div>
    );
  }

  return <ManagerDashboardClient data={res.data} />;
}
