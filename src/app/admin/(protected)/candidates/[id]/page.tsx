import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CandidateDetailClient } from "./CandidateDetailClient";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateProfilePage({ params }: PageProps) {
  const { id } = await params;

  const candidate = await prisma.candidateProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  // Fetch audit logs for this candidate
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { targetId: candidate.id },
        { targetId: candidate.user.id },
        { userId: candidate.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/candidates">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Candidate Registry
          </Button>
        </Link>
      </div>

      <CandidateDetailClient
        candidate={{
          id: candidate.id,
          candidateId: candidate.candidateId,
          fullName: candidate.fullName,
          phone: candidate.phone,
          location: candidate.location,
          joiningDate: candidate.joiningDate.toISOString(),
          isCertified: candidate.isCertified,
          certificateStatus: candidate.certificateStatus,
          currentModuleNumber: candidate.currentModuleNumber,
          user: {
            id: candidate.user.id,
            email: candidate.user.email,
            status: candidate.user.status,
            createdAt: candidate.user.createdAt.toISOString(),
            lastLoginAt: candidate.user.lastLoginAt?.toISOString() || null,
          },
          auditLogs: auditLogs.map((log) => ({
            id: log.id,
            action: log.action,
            targetType: log.targetType,
            details: log.details,
            createdAt: log.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
