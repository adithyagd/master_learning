import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { recordAuditLog } from "./audit";

export async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@e2epvtltd.com";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@E2E2025!Secure";

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "USER",
      targetId: admin.id,
      details: { message: "Initial Admin account seeded successfully", email: adminEmail },
    });

    console.log(`[Seed] Default Admin created: ${adminEmail}`);
    return admin;
  }

  return existingAdmin;
}
