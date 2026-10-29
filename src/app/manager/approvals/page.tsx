import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getManagerApprovalsQueue } from "@/actions/manager";
import { ManagerApprovalsClient } from "@/components/manager/ManagerApprovalsClient";

export const metadata = {
  title: "Approval Queue | E2E Manager Portal",
  description: "Review, approve, and return submitted team daily operations reports.",
};

export default async function ManagerApprovalsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/login");
  }

  const reports = await getManagerApprovalsQueue();

  return <ManagerApprovalsClient reports={reports as any} />;
}
