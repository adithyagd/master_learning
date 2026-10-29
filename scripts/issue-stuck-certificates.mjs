import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function issueStuckCertificates() {
  // Find all candidates stuck in APPROVED status without a certificate
  const stuckCandidates = await prisma.candidateProfile.findMany({
    where: { certificateStatus: "APPROVED" },
    include: {
      certificate: true,
      assessmentAttempts: {
        where: { status: "SUBMITTED" },
        include: { assessment: true },
      },
    },
  });

  console.log(`Found ${stuckCandidates.length} stuck candidate(s) in APPROVED state.`);

  for (const candidate of stuckCandidates) {
    if (candidate.certificate) {
      // Already has certificate record, just update status
      await prisma.candidateProfile.update({
        where: { id: candidate.id },
        data: { certificateStatus: "ISSUED", isCertified: true },
      });
      console.log(`✅ Fixed status for ${candidate.fullName} (${candidate.candidateId}) - certificate already exists`);
      continue;
    }

    const bestFinal = candidate.assessmentAttempts
      .filter((a) => a.assessment.type === "FINAL" && a.isPassed)
      .sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

    if (!bestFinal) {
      console.log(`⚠️  Skipping ${candidate.fullName} - no passed final assessment found`);
      continue;
    }

    const issuedAt = new Date();
    const year = issuedAt.getFullYear();
    const cleanCandId = candidate.candidateId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const certificateNumber = `E2E-CERT-${year}-${cleanCandId}-${randomHex}`;

    const rawHash = crypto
      .createHash("sha256")
      .update(`${certificateNumber}-${candidate.id}-${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    const verificationCode = `${rawHash.slice(0, 4)}-${rawHash.slice(4, 8)}-${rawHash.slice(8, 12)}-${rawHash.slice(12, 16)}`;

    await prisma.$transaction(async (tx) => {
      await tx.certificate.create({
        data: {
          certificateNumber,
          candidateProfileId: candidate.id,
          finalScore: bestFinal.scorePercentage,
          issuedAt,
          approvedByAdminId: candidate.approvedByAdminId || "system",
          approvedByAdminName: "Administrator",
          status: "ISSUED",
          verificationCode,
          metadata: JSON.stringify({
            organization: "E2E Procurement Private Limited",
            cin: "U78300KA2025PTC204064",
            credentialTitle: "Certified Recruiter — Recruiter Ready",
            candidateName: candidate.fullName,
            candidateId: candidate.candidateId,
            finalScore: bestFinal.scorePercentage,
            passingBenchmark: 70,
            completionDate: candidate.academyCompletedAt?.toISOString() || issuedAt.toISOString(),
            approvedBy: "Administrator",
          }),
        },
      });

      await tx.candidateProfile.update({
        where: { id: candidate.id },
        data: {
          isCertified: true,
          certificateStatus: "ISSUED",
          approvedAt: candidate.approvedAt || issuedAt,
        },
      });
    });

    console.log(`✅ Issued certificate for ${candidate.fullName} (${candidate.candidateId})`);
    console.log(`   Certificate Number: ${certificateNumber}`);
    console.log(`   Verification Code:  ${verificationCode}`);
    console.log(`   Final Score:        ${bestFinal.scorePercentage}%`);
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

issueStuckCertificates().catch((e) => {
  console.error(e);
  process.exit(1);
});
