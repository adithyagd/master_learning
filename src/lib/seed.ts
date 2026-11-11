import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { recordAuditLog } from "./audit";

export async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || (
    process.env.NODE_ENV === "production"
      ? ""
      : "admin@e2epvtltd.com"
  );
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || (
    process.env.NODE_ENV === "production"
      ? ""
      : "Admin@E2E2025!Secure"
  );

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_DEFAULT_EMAIL and ADMIN_DEFAULT_PASSWORD must be configured before production seeding."
    );
  }
  if (process.env.NODE_ENV === "production" && adminPassword.length < 16) {
    throw new Error("ADMIN_DEFAULT_PASSWORD must be at least 16 characters in production.");
  }

  const normalizedAdminEmail = adminEmail.toLowerCase();

  const existingAdmin = await prisma.user.findUnique({
    where: { email: normalizedAdminEmail },
  });

  const passwordHash = await hashPassword(adminPassword);

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: normalizedAdminEmail,
        passwordHash,
        name: "System Administrator",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "USER",
      targetId: admin.id,
      details: { message: "Initial Admin account seeded successfully", email: normalizedAdminEmail },
    });

    console.log(`[Seed] Default Admin created: ${normalizedAdminEmail}`);
    return admin;
  } else {
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`[Seed] Default Admin verified/updated: ${normalizedAdminEmail}`);
    return updated;
  }
}

export async function ensureDefaultDemoUsers() {
  const candidatePassword = "Candidate@E2E2025!";
  const managerPassword = "Manager@E2E2025!";

  const candidateHash = await hashPassword(candidatePassword);
  const managerHash = await hashPassword(managerPassword);

  // 1. Manager User
  const managerEmail = "manager@e2epvtltd.com";
  let manager = await prisma.user.findUnique({ where: { email: managerEmail } });
  if (!manager) {
    manager = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash: managerHash,
        name: "Priya Patel",
        role: "MANAGER",
        status: "ACTIVE",
      },
    });
    console.log(`[Seed] Default Manager created: ${managerEmail}`);
  } else {
    manager = await prisma.user.update({
      where: { id: manager.id },
      data: { passwordHash: managerHash, role: "MANAGER", status: "ACTIVE" },
    });
  }

  // 2. Trainee Candidate User (E2E-REC-001)
  const candidateEmail = "candidate@e2epvtltd.com";
  const existingProfile1 = await prisma.candidateProfile.findUnique({
    where: { candidateId: "E2E-REC-001" },
    include: { user: true },
  });

  if (existingProfile1) {
    await prisma.user.update({
      where: { id: existingProfile1.userId },
      data: {
        email: candidateEmail,
        passwordHash: candidateHash,
        name: "Aditi Sharma",
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    console.log(`[Seed] Default Trainee Candidate verified: ${candidateEmail} (E2E-REC-001)`);
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: candidateEmail } });
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: candidateHash, role: "CANDIDATE", status: "ACTIVE" },
      });
    } else {
      await prisma.user.create({
        data: {
          email: candidateEmail,
          passwordHash: candidateHash,
          name: "Aditi Sharma",
          role: "CANDIDATE",
          status: "ACTIVE",
          candidateProfile: {
            create: {
              candidateId: "E2E-REC-001",
              fullName: "Aditi Sharma",
              phone: "+91 9876543210",
              location: "Bangalore",
              joiningDate: new Date(),
              isCertified: false,
              certificateStatus: "NOT_ELIGIBLE",
              academyStatus: "IN_PROGRESS",
              currentModuleNumber: 1,
              managerId: manager.id,
            },
          },
        },
      });
      console.log(`[Seed] Default Trainee Candidate created: ${candidateEmail} (E2E-REC-001)`);
    }
  }

  // 3. Certified Recruiter User (E2E-REC-002) - Unlocked for Workspace
  const certifiedEmail = "certified@e2epvtltd.com";
  const existingProfile2 = await prisma.candidateProfile.findUnique({
    where: { candidateId: "E2E-REC-002" },
    include: { user: true, certificate: true },
  });

  if (existingProfile2) {
    await prisma.user.update({
      where: { id: existingProfile2.userId },
      data: {
        email: certifiedEmail,
        passwordHash: candidateHash,
        name: "Rahul Verma",
        role: "CANDIDATE",
        status: "ACTIVE",
      },
    });
    console.log(`[Seed] Default Certified Candidate verified: ${certifiedEmail} (E2E-REC-002)`);
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: certifiedEmail } });
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash: candidateHash, role: "CANDIDATE", status: "ACTIVE" },
      });
    } else {
      const newUser = await prisma.user.create({
        data: {
          email: certifiedEmail,
          passwordHash: candidateHash,
          name: "Rahul Verma",
          role: "CANDIDATE",
          status: "ACTIVE",
          candidateProfile: {
            create: {
              candidateId: "E2E-REC-002",
              fullName: "Rahul Verma",
              phone: "+91 9876543211",
              location: "Mumbai",
              joiningDate: new Date(),
              isCertified: true,
              certificateStatus: "ISSUED",
              academyStatus: "COMPLETED",
              academyCompletedAt: new Date(),
              approvedAt: new Date(),
              currentModuleNumber: 5,
              managerId: manager.id,
            },
          },
        },
        include: { candidateProfile: true },
      });

      if (newUser.candidateProfile) {
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        await prisma.certificate.create({
          data: {
            certificateNumber: "E2E-CERT-2025-REC002-INIT",
            candidateProfileId: newUser.candidateProfile.id,
            finalScore: 88,
            approvedByAdminId: admin?.id || newUser.id,
            approvedByAdminName: admin?.email || "admin@e2epvtltd.com",
            status: "ISSUED",
            verificationCode: "CERT-REC2-2025-PASS",
            metadata: JSON.stringify({
              organization: "E2E Procurement Private Limited",
              credentialTitle: "Certified Recruiter — Recruiter Ready",
              candidateName: "Rahul Verma",
              candidateId: "E2E-REC-002",
              finalScore: 88,
            }),
          },
        });
      }
      console.log(`[Seed] Default Certified Candidate created: ${certifiedEmail} (E2E-REC-002)`);
    }
  }
}
