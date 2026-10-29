"use server";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  generateSecureToken,
  AUTH_COOKIE_NAME,
  getCurrentUser,
} from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  redirectTo?: string;
}

/**
 * Recruiter / Candidate Login
 * Supports Email OR Candidate ID
 */
export async function loginCandidate(
  formData: FormData
): Promise<ActionResponse<{ candidateId?: string }>> {
  try {
    const identifier = formData.get("identifier")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!identifier || !password) {
      return { success: false, message: "Please provide both an identifier and password." };
    }

    // Determine IP and User Agent for audit log
    let ipAddress = "127.0.0.1";
    let userAgent = "unknown";
    try {
      const reqHeaders = await headers();
      ipAddress = reqHeaders.get("x-forwarded-for") || "127.0.0.1";
      userAgent = reqHeaders.get("user-agent") || "unknown";
    } catch {
      // Test environment fallback
    }

    // Lookup user by email OR by candidateId
    let user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase() },
      include: { candidateProfile: true },
    });

    if (!user) {
      const profile = await prisma.candidateProfile.findUnique({
        where: { candidateId: identifier.toUpperCase() },
        include: { user: { include: { candidateProfile: true } } },
      });
      if (profile?.user) {
        user = profile.user;
      }
    }

    if (!user) {
      await recordAuditLog({
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "User not found", identifier },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Invalid credentials. Please verify your Email/Candidate ID." };
    }

    // Cross-role enforcement: Administrators must use /admin/login
    if (user.role === "ADMIN") {
      await recordAuditLog({
        userId: user.id,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        targetType: "AUTH",
        details: { reason: "Admin attempted candidate/manager portal login", role: user.role },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Access restricted. Administrators must log in at /admin/login." };
    }

    // Status check: Account must be ACTIVE
    if (user.status !== "ACTIVE") {
      await recordAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "Account inactive/suspended", status: user.status },
        ipAddress,
        userAgent,
      });
      return {
        success: false,
        message: "Your account is currently inactive. Please contact your E2E administrator.",
      };
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await recordAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "Incorrect password" },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Invalid credentials. Incorrect password." };
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const isManager = user.role === "MANAGER";
    const isCertified = Boolean(user.candidateProfile?.isCertified);

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: isManager ? "MANAGER" : "CANDIDATE",
      candidateId: user.candidateProfile?.candidateId,
      fullName: user.candidateProfile?.fullName || user.name || user.email.split("@")[0],
      isCertified: isManager ? true : isCertified,
    });

    // Set HTTP-only secure session cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    } catch {
      // Test environment fallback
    }

    // Record Audit Log
    await recordAuditLog({
      userId: user.id,
      action: isManager ? "MANAGER_LOGIN" : "CANDIDATE_LOGIN",
      targetType: "USER",
      targetId: user.id,
      details: {
        role: user.role,
        candidateId: user.candidateProfile?.candidateId,
        isCertified: isManager ? true : isCertified,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: "Login successful.",
      redirectTo: isManager ? "/manager" : "/academy",
      data: { candidateId: user.candidateProfile?.candidateId },
    };
  } catch (error) {
    console.error("Candidate login error:", error);
    return { success: false, message: "An unexpected error occurred during login. Please try again." };
  }
}

/**
 * Admin Login
 * Uses Admin Email and Password
 */
export async function loginAdmin(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { success: false, message: "Please provide both an email and password." };
    }

    let ipAddress = "127.0.0.1";
    let userAgent = "unknown";
    try {
      const reqHeaders = await headers();
      ipAddress = reqHeaders.get("x-forwarded-for") || "127.0.0.1";
      userAgent = reqHeaders.get("user-agent") || "unknown";
    } catch {
      // Test environment fallback
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await recordAuditLog({
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "Admin user not found", email },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Invalid administrator credentials." };
    }

    // Cross-role enforcement: Only ADMIN role allowed
    if (user.role !== "ADMIN") {
      await recordAuditLog({
        userId: user.id,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        targetType: "AUTH",
        details: { reason: "Non-admin attempted admin portal login", role: user.role },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Access restricted. This portal is for Administrators only." };
    }

    // Status check
    if (user.status !== "ACTIVE") {
      await recordAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "Admin account deactivated", status: user.status },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Administrator account is inactive. Contact system support." };
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await recordAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        targetType: "AUTH",
        details: { reason: "Incorrect admin password" },
        ipAddress,
        userAgent,
      });
      return { success: false, message: "Invalid administrator credentials." };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: "ADMIN",
    });

    // Set cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    } catch {
      // Test environment fallback
    }

    // Record Audit Log
    await recordAuditLog({
      userId: user.id,
      action: "ADMIN_LOGIN",
      targetType: "USER",
      targetId: user.id,
      details: { email: user.email },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: "Administrator authenticated.",
      redirectTo: "/admin/dashboard",
    };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, message: "An unexpected error occurred during admin authentication." };
  }
}

/**
 * Secure Logout
 */
export async function logoutUser(): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    const reqHeaders = await headers();
    const ipAddress = reqHeaders.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    if (user) {
      await recordAuditLog({
        userId: user.id,
        action: "LOGOUT",
        targetType: "USER",
        targetId: user.id,
        details: { email: user.email, role: user.role },
        ipAddress,
        userAgent,
      });
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return {
      success: true,
      message: "Successfully logged out.",
      redirectTo: user?.role === "ADMIN" ? "/admin/login" : "/login",
    };
  } catch (error) {
    return { success: false, message: "Error processing logout." };
  }
}

/**
 * Request Password Reset / Forgot Password
 */
export async function requestPasswordReset(
  identifier: string
): Promise<ActionResponse<{ resetToken?: string }>> {
  try {
    if (!identifier) {
      return { success: false, message: "Please provide an email or candidate ID." };
    }

    const trimmed = identifier.trim();
    let user = await prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
    });

    if (!user) {
      const profile = await prisma.candidateProfile.findUnique({
        where: { candidateId: trimmed.toUpperCase() },
        include: { user: true },
      });
      if (profile?.user) {
        user = profile.user;
      }
    }

    // If user does not exist, return generic message for security
    if (!user) {
      return {
        success: true,
        message: "If an account matching the provided identifier exists, a password reset token has been issued.",
      };
    }

    // Generate secure token valid for 2 hours
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "CREDENTIAL_RESET_REQUESTED",
      targetType: "USER",
      targetId: user.id,
      details: { identifier },
    });

    return {
      success: true,
      message: "Password reset link generated successfully.",
      data: { resetToken: token },
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, message: "Error processing password reset request." };
  }
}

/**
 * Reset Password using Token
 */
export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    if (!token || !newPassword) {
      return { success: false, message: "Token and new password are required." };
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long." };
    }

    const authToken = await prisma.authToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
      return { success: false, message: "This password reset link is invalid or has expired." };
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await recordAuditLog({
      userId: authToken.userId,
      action: "CREDENTIAL_RESET_COMPLETED",
      targetType: "USER",
      targetId: authToken.userId,
      details: { type: authToken.type },
    });

    return {
      success: true,
      message: "Password has been successfully reset. You may now log in with your new credentials.",
      redirectTo: authToken.user.role === "ADMIN" ? "/admin/login" : "/login",
    };
  } catch (error) {
    console.error("Complete password reset error:", error);
    return { success: false, message: "Error finalizing password reset." };
  }
}
