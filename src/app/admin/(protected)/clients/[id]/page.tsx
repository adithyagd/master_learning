import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getClientDetails, getClientPerformance } from "@/actions/client";
import { AdminClientDetailClient } from "@/components/admin/AdminClientDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getClientDetails(id);
  if (!res.success || !res.data?.client) {
    return { title: "Client Details | E2E Admin" };
  }
  return {
    title: `${res.data.client.name} (${res.data.client.code}) | E2E Admin`,
  };
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { id } = await params;

  const [detailsRes, perfRes] = await Promise.all([
    getClientDetails(id),
    getClientPerformance(id),
  ]);

  if (!detailsRes.success || !detailsRes.data?.client) {
    notFound();
  }

  const client = detailsRes.data.client;
  const auditLogs = detailsRes.data.auditLogs || [];
  const performance = perfRes.success && perfRes.data
    ? perfRes.data
    : {
        requirements: { total: 0, active: 0, closed: 0, onHold: 0, openPositions: 0 },
        pipeline: { totalCandidates: 0, stages: {} },
        interviews: { total: 0, scheduled: 0, attended: 0, rescheduled: 0, cancelled: 0 },
        operationsOutreach: {
          calls: 0,
          ownLeads: 0,
          internalLeads: 0,
          screened: 0,
          shortlisted: 0,
          lineUp: 0,
          offered: 0,
          joined: 0,
          absconded: 0,
        },
        conversionRates: {
          lineupToAttendedPct: 0,
          attendedToOfferPct: 0,
          offerToJoinPct: 0,
          shortlistToJoinPct: 0,
        },
      };

  return (
    <AdminClientDetailClient
      client={client}
      performance={performance as any}
      auditLogs={auditLogs}
    />
  );
}
