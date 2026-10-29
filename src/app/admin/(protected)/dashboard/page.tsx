import React from "react";
import { getAdminDashboardMetrics } from "@/actions/admin-dashboard";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | E2E Procurement Recruiter Platform",
  description: "Enterprise operations and academy overview dashboard for administrators.",
};

export default async function AdminDashboardPage() {
  const res = await getAdminDashboardMetrics();

  if (!res.success || !res.data) {
    if (res.message?.includes("Unauthorized")) {
      redirect("/admin/login");
    }

    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200">
        <h2 className="text-lg font-bold text-red-700">Failed to load Admin Dashboard</h2>
        <p className="text-sm text-slate-600 mt-2">{res.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return <AdminDashboardClient initialData={res.data} />;
}
