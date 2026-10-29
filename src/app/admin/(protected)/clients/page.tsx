import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClients } from "@/actions/client";
import { AdminClientsListClient } from "@/components/admin/AdminClientsListClient";

export const metadata = {
  title: "Client Master Management | E2E Admin",
  description: "Manage persistent corporate clients, unique codes, statuses, requirements, and performance.",
};

export default async function AdminClientsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const res = await getClients({ sortBy: "createdAt", sortOrder: "desc" });

  const clients = res.success && res.data ? res.data.clients : [];
  const stats = res.success && res.data ? res.data.stats : {
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalOpenPositions: 0,
  };

  return <AdminClientsListClient initialClients={clients} stats={stats} />;
}
