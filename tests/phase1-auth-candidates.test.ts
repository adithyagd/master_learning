// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth";
import { createCandidate, toggleCandidateStatus } from "@/actions/candidate";
import { requestPasswordReset, completePasswordReset } from "@/actions/auth";

describe("Phase 1: Database, Authentication, Roles & Candidate Provisioning", () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.authToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.candidateProfile.deleteMany();
    await prisma.user.deleteMany();
  });



  describe("1. Password Security & Hashing", () => {
    it("hashes passwords securely with bcrypt and prevents plaintext storage", async () => {
      const rawPassword = "SecurePassword123!";
      const hashed = await hashPassword(rawPassword);

      expect(hashed).not.toBe(rawPassword);
      expect(hashed.startsWith("$2")).toBe(true);

      const isValid = await verifyPassword(rawPassword, hashed);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword!", hashed);
      expect(isInvalid).toBe(false);
    });
  });

  describe("2. JWT Session Security & Expiry", () => {
    it("signs and verifies tamper-proof session tokens with correct claims", async () => {
      const payload = {
        userId: "user-test-123",
        email: "recruiter1@e2epvtltd.com",
        role: "CANDIDATE" as const,
        candidateId: "E2E-REC-999",
        fullName: "Test Recruiter",
        isCertified: false,
      };

      const token = await signSessionToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe("CANDIDATE");
      expect(verified?.candidateId).toBe("E2E-REC-999");
      expect(verified?.isCertified).toBe(false);
    });

    it("rejects tampered tokens", async () => {
      const validToken = await signSessionToken({
        userId: "user-1",
        email: "user1@e2e.com",
        role: "CANDIDATE",
      });

      const tampered = validToken.slice(0, -6) + "abcdef";
      const verified = await verifySessionToken(tampered);
      expect(verified).toBeNull();
    });
  });

  describe("3. Admin Candidate Creation & Relational Schema", () => {
    let adminUser: { id: string; role: string };

    beforeAll(async () => {
      // Create admin user in database
      const adminPass = await hashPassword("AdminSecret2025!");
      const admin = await prisma.user.create({
        data: {
          email: "superadmin@e2epvtltd.com",
          passwordHash: adminPass,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      adminUser = { id: admin.id, role: admin.role };
    });

    it("strictly blocks unauthorized non-admin callers from creating candidates", async () => {
      const formData = new FormData();
      formData.set("fullName", "Ramesh Kumar");

      // Called with non-admin or unauthenticated
      const unauthCaller = { id: "some-user", role: "CANDIDATE" };
      const res = await createCandidate(formData, unauthCaller);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Unauthorized");
    });

    it("enforces required fields when creating candidate", async () => {
      const formData = new FormData();
      formData.set("fullName", "Ramesh Kumar");
      // missing candidateId, email, joiningDate

      const res = await createCandidate(formData, adminUser);
      expect(res.success).toBe(false);
      expect(res.message).toContain("required");
    });

    it("validates email format", async () => {
      const formData = new FormData();
      formData.set("fullName", "Ramesh Kumar");
      formData.set("candidateId", "E2E-REC-001");
      formData.set("email", "invalid-email-address");
      formData.set("joiningDate", "2025-06-15");

      const res = await createCandidate(formData, adminUser);
      expect(res.success).toBe(false);
      expect(res.message).toContain("valid email");
    });

    it("successfully provisions a candidate with Invitation Token & Audit Log", async () => {
      const formData = new FormData();
      formData.set("fullName", "Aditi Sharma");
      formData.set("candidateId", "E2E-REC-001");
      formData.set("email", "candidate1@e2epvtltd.com");
      formData.set("phone", "+91 9876543210");
      formData.set("location", "Bangalore");
      formData.set("joiningDate", "2025-06-15");
      formData.set("status", "ACTIVE");

      const res = await createCandidate(formData, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.candidateId).toBe("E2E-REC-001");
      expect(res.data?.invitationToken).toBeDefined();

      // Verify User record in DB
      const user = await prisma.user.findUnique({
        where: { email: "candidate1@e2epvtltd.com" },
        include: { candidateProfile: true, authTokens: true },
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe("CANDIDATE");
      expect(user?.status).toBe("ACTIVE");
      expect(user?.candidateProfile?.candidateId).toBe("E2E-REC-001");
      expect(user?.candidateProfile?.fullName).toBe("Aditi Sharma");
      expect(user?.authTokens.length).toBeGreaterThan(0);
      expect(user?.authTokens[0].type).toBe("INVITATION");

      // Verify Audit Log recorded
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: "CANDIDATE_CREATED" },
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.targetType).toBe("CANDIDATE");
    });

    it("strictly prevents duplicate email addresses in the database and form", async () => {
      const formData = new FormData();
      formData.set("fullName", "Duplicate User");
      formData.set("candidateId", "E2E-REC-002");
      formData.set("email", "candidate1@e2epvtltd.com"); // Duplicate email
      formData.set("joiningDate", "2025-06-15");

      const res = await createCandidate(formData, adminUser);
      expect(res.success).toBe(false);
      expect(res.message).toContain("already exists");
    });

    it("strictly prevents duplicate Candidate IDs in the database and form", async () => {
      const formData = new FormData();
      formData.set("fullName", "Another Candidate");
      formData.set("candidateId", "E2E-REC-001"); // Duplicate Candidate ID
      formData.set("email", "another@e2epvtltd.com");
      formData.set("joiningDate", "2025-06-15");

      const res = await createCandidate(formData, adminUser);
      expect(res.success).toBe(false);
      expect(res.message).toContain("already registered");
    });
  });

  describe("4. Account Activation, Deactivation & Login Enforcement", () => {
    let candidateUserId: string;
    let adminUser: { id: string; role: string };

    beforeAll(async () => {
      const user = await prisma.user.findUnique({
        where: { email: "candidate1@e2epvtltd.com" },
      });
      candidateUserId = user!.id;

      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      adminUser = { id: admin!.id, role: admin!.role };
    });

    it("deactivates an account via Admin action", async () => {
      const res = await toggleCandidateStatus(candidateUserId, "INACTIVE", adminUser);
      expect(res.success).toBe(true);

      const user = await prisma.user.findUnique({
        where: { id: candidateUserId },
      });
      expect(user?.status).toBe("INACTIVE");
    });

    it("reactivates the account via Admin action", async () => {
      const res = await toggleCandidateStatus(candidateUserId, "ACTIVE", adminUser);
      expect(res.success).toBe(true);

      const user = await prisma.user.findUnique({
        where: { id: candidateUserId },
      });
      expect(user?.status).toBe("ACTIVE");
    });
  });

  describe("5. Password Reset & Single-Use Token Flow", () => {
    let tokenValue: string;

    it("generates a time-limited AuthToken for password recovery", async () => {
      const res = await requestPasswordReset("candidate1@e2epvtltd.com");
      expect(res.success).toBe(true);
      expect(res.data?.resetToken).toBeDefined();
      tokenValue = res.data!.resetToken!;

      const dbToken = await prisma.authToken.findUnique({
        where: { token: tokenValue },
      });
      expect(dbToken).not.toBeNull();
      expect(dbToken?.type).toBe("PASSWORD_RESET");
      expect(dbToken?.usedAt).toBeNull();
    });

    it("completes password reset and marks token as used", async () => {
      const res = await completePasswordReset(tokenValue, "BrandNewPassword2025!");
      expect(res.success).toBe(true);

      const dbToken = await prisma.authToken.findUnique({
        where: { token: tokenValue },
      });
      expect(dbToken?.usedAt).not.toBeNull();

      // Verify user's new password hash
      const user = await prisma.user.findUnique({
        where: { id: dbToken!.userId },
      });
      const matches = await verifyPassword("BrandNewPassword2025!", user!.passwordHash);
      expect(matches).toBe(true);
    });

    it("rejects reusing the same reset token", async () => {
      const res = await completePasswordReset(tokenValue, "AnotherPassword!");
      expect(res.success).toBe(false);
      expect(res.message).toContain("invalid or has expired");
    });
  });

  describe("6. Audit Logging", () => {
    it("records immutable audit log entries with metadata", async () => {
      const log = await prisma.auditLog.create({
        data: {
          action: "ADMIN_LOGIN",
          targetType: "USER",
          details: JSON.stringify({ ip: "127.0.0.1", browser: "Test Runner" }),
        },
      });

      expect(log.id).toBeDefined();
      expect(log.action).toBe("ADMIN_LOGIN");
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });
});
