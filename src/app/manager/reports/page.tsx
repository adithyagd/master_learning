import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerReports } from "@/actions/manager";
import { ManagerReportsClient } from "@/components/manager/ManagerReportsClient";

export const metadata = {
  title: "Team Reports | E2E Manager Portal",
  description: "View and filter daily operations reports submitted by your assigned team members.",
};

export default async function ManagerReportsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const reports = await getManagerReports();

  return <ManagerReportsClient reports={reports as any} />;
}
