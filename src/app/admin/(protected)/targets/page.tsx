import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAdminTargetsOverview } from "@/actions/target";
import { AdminTargetsClient } from "@/components/admin/AdminTargetsClient";

export default async function AdminTargetsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const overview = await getAdminTargetsOverview("DAILY");
  if (!overview) {
    redirect("/admin/dashboard?error=unauthorized");
  }

  return (
    <AdminTargetsClient
      recruiters={overview.recruiters}
      recentHistory={overview.recentHistory}
    />
  );
}
