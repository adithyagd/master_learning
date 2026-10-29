import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportData, GeneratedReportResult } from "@/actions/export";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export const metadata = {
  title: "Reporting & Export Center | E2E Admin",
  description:
    "Generate, inspect, and export verified daily operations reports, candidate pipelines, recruiter performance, and enterprise metrics.",
};

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch filter dropdown options
  const [recruiters, managers, clients, initialReportRes] = await Promise.all([
    prisma.candidateProfile.findMany({
      where: { isCertified: true },
      select: { id: true, fullName: true, candidateId: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MANAGER" },
      select: { id: true, name: true, email: true },
      orderBy: { email: "asc" },
    }),
    prisma.clientMaster.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    generateReportData("DAILY_REPORTS", { page: 1, pageSize: 25 }),
  ]);

  const fallbackReportData: GeneratedReportResult = {
    reportType: "DAILY_REPORTS",
    title: "Daily Operations Reports",
    subtitle: "Verified daily recruiter operational activity, calls, and interview milestones",
    columns: [],
    rows: [],
    totalRecords: 0,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    filterSummary: "All Authorized Operations",
  };

  const initialReportData = initialReportRes.success && initialReportRes.data
    ? initialReportRes.data
    : fallbackReportData;

  return (
    <AdminReportsClient
      initialReportData={initialReportData}
      recruitersList={recruiters}
      managersList={managers}
      clientsList={clients}
    />
  );
}
