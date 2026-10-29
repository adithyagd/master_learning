// "use server";

// import { prisma } from "@/lib/prisma";
// import { getCurrentUser, hashPassword, generateSecureToken } from "@/lib/auth";
// import { recordAuditLog } from "@/lib/audit";
// import { revalidatePath } from "next/cache";

// function safeRevalidate(path: string) {
//   try {
//     revalidatePath(path);
//   } catch {
//     // Graceful fallback for test runners where Next static store is absent
//   }
// }

// interface ActionResponse<T = unknown> {
//   success: boolean;
//   message?: string;
//   data?: T;
// }

// /**
//  * Verify that the caller is an authenticated Admin
//  */
// async function requireAdmin() {
//   const user = await getCurrentUser();
//   if (!user || user.role !== "ADMIN") {
//     throw new Error("Unauthorized. Administrator privileges required.");
//   }
//   return user;
// }

// /**
//  * Create a new candidate account (Admin-only)
//  */
// export async function createCandidate(
//   formData: FormData,
//   actingAdmin?: { id: string; role: string }
// ): Promise<ActionResponse<{ candidateId: string; invitationToken: string; passwordSet: boolean }>> {
//   try {
//     const admin = actingAdmin || (await requireAdmin());
//     if (admin.role !== "ADMIN") {
//       throw new Error("Unauthorized. Administrator privileges required.");
//     }

//     const fullName = formData.get("fullName")?.toString().trim();
//     const candidateId = formData.get("candidateId")?.toString().trim().toUpperCase();
//     const email = formData.get("email")?.toString().trim().toLowerCase();
//     const phone = formData.get("phone")?.toString().trim() || null;
//     const location = formData.get("location")?.toString().trim() || null;
//     const joiningDateStr = formData.get("joiningDate")?.toString();
//     const status = (formData.get("status")?.toString() || "ACTIVE") as "ACTIVE" | "INACTIVE";
//     const manualPassword = formData.get("password")?.toString() || "";
//     const confirmPassword = formData.get("confirmPassword")?.toString() || "";

//     // Validation
//     if (!fullName || !candidateId || !email || !joiningDateStr) {
//       return {
//         success: false,
//         message: "Full Name, Candidate ID, Email, and Joining Date are required.",
//       };
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return { success: false, message: "Please provide a valid email address." };
//     }

//     const joiningDate = new Date(joiningDateStr);
//     if (isNaN(joiningDate.getTime())) {
//       return { success: false, message: "Invalid Joining Date format." };
//     }

//     // Validate manual password if provided
//     const isManualPassword = manualPassword.length > 0;
//     if (isManualPassword) {
//       if (manualPassword.length < 8) {
//         return { success: false, message: "Password must be at least 8 characters long." };
//       }
//       if (manualPassword !== confirmPassword) {
//         return { success: false, message: "Passwords do not match. Please re-enter and confirm." };
//       }
//     }

//     // Check duplicate email
//     const existingEmail = await prisma.user.findUnique({
//       where: { email },
//     });
//     if (existingEmail) {
//       return {
//         success: false,
//         message: `An account with email '${email}' already exists in the system.`,
//       };
//     }

//     // Check duplicate Candidate ID
//     const existingCandidateId = await prisma.candidateProfile.findUnique({
//       where: { candidateId },
//     });
//     if (existingCandidateId) {
//       return {
//         success: false,
//         message: `Candidate ID '${candidateId}' is already registered. Please assign a unique ID.`,
//       };
//     }

//     // Hash password: use admin-provided password if set, otherwise generate a secure random one
//     const passwordHash = isManualPassword
//       ? await hashPassword(manualPassword)
//       : await hashPassword(generateSecureToken());

//     // Always create an invitation token (mark as used immediately if password was manually set)
//     const invitationToken = generateSecureToken();
//     const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

//     const result = await prisma.$transaction(async (tx) => {
//       const newUser = await tx.user.create({
//         data: {
//           email,
//           passwordHash,
//           role: "CANDIDATE",
//           status,
//         },
//       });

//       const profile = await tx.candidateProfile.create({
//         data: {
//           userId: newUser.id,
//           candidateId,
//           fullName,
//           phone,
//           location,
//           joiningDate,
//           isCertified: false,
//           certificateStatus: "NOT_ELIGIBLE",
//           currentModuleNumber: 1,
//         },
//       });

//       await tx.authToken.create({
//         data: {
//           userId: newUser.id,
//           token: invitationToken,
//           type: "INVITATION",
//           expiresAt,
//           // If admin set a password, mark token as already used so it can't be reused
//           ...(isManualPassword ? { usedAt: new Date() } : {}),
//         },
//       });

//       return { user: newUser, profile };
//     });

//     // Audit Log
//     await recordAuditLog({
//       userId: admin.id,
//       action: "CANDIDATE_CREATED",
//       targetType: "CANDIDATE",
//       targetId: result.profile.id,
//       details: {
//         candidateId,
//         email,
//         fullName,
//         joiningDate: joiningDateStr,
//         status,
//         passwordSetByAdmin: isManualPassword,
//       },
//     });

//     safeRevalidate("/admin/candidates");

//     return {
//       success: true,
//       message: isManualPassword
//         ? `Candidate ${fullName} (${candidateId}) created with admin-set password. They can log in immediately.`
//         : `Candidate ${fullName} (${candidateId}) created successfully.`,
//       data: {
//         candidateId,
//         invitationToken,
//         passwordSet: isManualPassword,
//       },
//     };
//   } catch (error: any) {
//     console.error("Create candidate error:", error);
//     return {
//       success: false,
//       message: error?.message || "Failed to create candidate account.",
//     };
//   }
// }

// /**
//  * Toggle Candidate Account Status (Activate / Deactivate)
//  */
// export async function toggleCandidateStatus(
//   userId: string,
//   newStatus: "ACTIVE" | "INACTIVE",
//   actingAdmin?: { id: string; role: string }
// ): Promise<ActionResponse> {
//   try {
//     const admin = actingAdmin || (await requireAdmin());
//     if (admin.role !== "ADMIN") {
//       throw new Error("Unauthorized. Administrator privileges required.");
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { candidateProfile: true },
//     });

//     if (!user) {
//       return { success: false, message: "Candidate user account not found." };
//     }

//     await prisma.user.update({
//       where: { id: userId },
//       data: { status: newStatus },
//     });

//     await recordAuditLog({
//       userId: admin.id,
//       action: "STATUS_CHANGED",
//       targetType: "CANDIDATE",
//       targetId: user.candidateProfile?.id || userId,
//       details: {
//         candidateId: user.candidateProfile?.candidateId,
//         previousStatus: user.status,
//         newStatus,
//       },
//     });

//     safeRevalidate("/admin/candidates");
//     safeRevalidate(`/admin/candidates/${user.candidateProfile?.id}`);

//     return {
//       success: true,
//       message: `Account status updated to ${newStatus}.`,
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: error?.message || "Failed to update account status.",
//     };
//   }
// }

// /**
//  * Admin triggers credential reset for a candidate
//  */
// export async function adminResetCandidatePassword(
//   userId: string,
//   actingAdmin?: { id: string; role: string }
// ): Promise<ActionResponse<{ resetToken: string }>> {
//   try {
//     const admin = actingAdmin || (await requireAdmin());
//     if (admin.role !== "ADMIN") {
//       throw new Error("Unauthorized. Administrator privileges required.");
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: { candidateProfile: true },
//     });

//     if (!user) {
//       return { success: false, message: "User not found." };
//     }

//     const resetToken = generateSecureToken();
//     const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

//     await prisma.authToken.create({
//       data: {
//         userId: user.id,
//         token: resetToken,
//         type: "PASSWORD_RESET",
//         expiresAt,
//       },
//     });

//     await recordAuditLog({
//       userId: admin.id,
//       action: "CREDENTIAL_RESET_REQUESTED",
//       targetType: "CANDIDATE",
//       targetId: user.candidateProfile?.id || user.id,
//       details: {
//         candidateId: user.candidateProfile?.candidateId,
//         initiatedBy: "ADMIN",
//       },
//     });

//     return {
//       success: true,
//       message: "Password reset link generated successfully.",
//       data: { resetToken },
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: error?.message || "Failed to issue password reset.",
//     };
//   }
// }

// /**
//  * Update candidate profile information
//  */
// export async function updateCandidateProfile(
//   candidateProfileId: string,
//   formData: FormData
// ): Promise<ActionResponse> {
//   try {
//     const admin = await requireAdmin();

//     const fullName = formData.get("fullName")?.toString().trim();
//     const phone = formData.get("phone")?.toString().trim() || null;
//     const location = formData.get("location")?.toString().trim() || null;
//     const joiningDateStr = formData.get("joiningDate")?.toString();

//     if (!fullName || !joiningDateStr) {
//       return { success: false, message: "Full Name and Joining Date are required." };
//     }

//     const joiningDate = new Date(joiningDateStr);
//     if (isNaN(joiningDate.getTime())) {
//       return { success: false, message: "Invalid Joining Date format." };
//     }

//     const updated = await prisma.candidateProfile.update({
//       where: { id: candidateProfileId },
//       data: {
//         fullName,
//         phone,
//         location,
//         joiningDate,
//       },
//     });

//     await recordAuditLog({
//       userId: admin.id,
//       action: "CANDIDATE_UPDATED",
//       targetType: "CANDIDATE",
//       targetId: candidateProfileId,
//       details: {
//         fullName,
//         phone,
//         location,
//         joiningDate: joiningDateStr,
//       },
//     });

//     safeRevalidate("/admin/candidates");
//     safeRevalidate(`/admin/candidates/${candidateProfileId}`);

//     return {
//       success: true,
//       message: "Candidate profile updated successfully.",
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: error?.message || "Failed to update candidate profile.",
//     };
//   }
// }




"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, generateSecureToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback for test runners where Next static store is absent
  }
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Verify that the caller is an authenticated Admin
 */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized. Administrator privileges required.");
  }
  return user;
}

/**
 * Create a new candidate account (Admin-only)
 */
export async function createCandidate(
  formData: FormData,
  actingAdmin?: { id: string; role: string }
): Promise<
  ActionResponse<{
    candidateId: string;
    invitationToken: string;
    passwordSet: boolean;
  }>
> {
  try {
    const admin = actingAdmin || (await requireAdmin());
    if (admin.role !== "ADMIN") {
      throw new Error("Unauthorized. Administrator privileges required.");
    }

    const fullName = formData.get("fullName")?.toString().trim();
    const candidateId = formData.get("candidateId")?.toString().trim().toUpperCase();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const phone = formData.get("phone")?.toString().trim() || null;
    const location = formData.get("location")?.toString().trim() || null;
    const joiningDateStr = formData.get("joiningDate")?.toString();
    const status = (formData.get("status")?.toString() || "ACTIVE") as "ACTIVE" | "INACTIVE";
    const manualPassword = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    // Validation
    if (!fullName || !candidateId || !email || !joiningDateStr) {
      return {
        success: false,
        message: "Full Name, Candidate ID, Email, and Joining Date are required.",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Please provide a valid email address." };
    }

    const joiningDate = new Date(joiningDateStr);
    if (isNaN(joiningDate.getTime())) {
      return { success: false, message: "Invalid Joining Date format." };
    }

    // Validate manual password if provided
    const isManualPassword = manualPassword.length > 0;
    if (isManualPassword) {
      if (manualPassword.length < 8) {
        return { success: false, message: "Password must be at least 8 characters long." };
      }
      if (manualPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match. Please re-enter and confirm." };
      }
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return {
        success: false,
        message: `An account with email '${email}' already exists in the system.`,
      };
    }

    // Check duplicate Candidate ID
    const existingCandidateId = await prisma.candidateProfile.findUnique({
      where: { candidateId },
    });
    if (existingCandidateId) {
      return {
        success: false,
        message: `Candidate ID '${candidateId}' is already registered. Please assign a unique ID.`,
      };
    }

    // Hash password: use admin-provided password if set, otherwise generate a secure random one
    const passwordHash = isManualPassword
      ? await hashPassword(manualPassword)
      : await hashPassword(generateSecureToken());

    // Always create an invitation token (mark as used immediately if password was manually set)
    const invitationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "CANDIDATE",
          status,
        },
      });

      const profile = await tx.candidateProfile.create({
        data: {
          userId: newUser.id,
          candidateId,
          fullName,
          phone,
          location,
          joiningDate,
          isCertified: false,
          certificateStatus: "NOT_ELIGIBLE",
          currentModuleNumber: 1,
        },
      });

      await tx.authToken.create({
        data: {
          userId: newUser.id,
          token: invitationToken,
          type: "INVITATION",
          expiresAt,
          // If admin set a password, mark token as already used so it can't be reused
          ...(isManualPassword ? { usedAt: new Date() } : {}),
        },
      });

      return { user: newUser, profile };
    });

    // Audit Log
    await recordAuditLog({
      userId: admin.id,
      action: "CANDIDATE_CREATED",
      targetType: "CANDIDATE",
      targetId: result.profile.id,
      details: {
        candidateId,
        email,
        fullName,
        joiningDate: joiningDateStr,
        status,
        passwordSetByAdmin: isManualPassword,
      },
    });

    safeRevalidate("/admin/candidates");

    return {
      success: true,
      message: isManualPassword
        ? `Candidate ${fullName} (${candidateId}) created with admin-set password. They can log in immediately.`
        : `Candidate ${fullName} (${candidateId}) created successfully.`,
      data: {
        candidateId,
        invitationToken,
        passwordSet: isManualPassword,
      },
    };
  } catch (error: any) {
    console.error("Create candidate error:", error);
    return {
      success: false,
      message: error?.message || "Failed to create candidate account.",
    };
  }
}

/**
 * Toggle Candidate Account Status (Activate / Deactivate)
 */
export async function toggleCandidateStatus(
  userId: string,
  newStatus: "ACTIVE" | "INACTIVE",
  actingAdmin?: { id: string; role: string }
): Promise<ActionResponse> {
  try {
    const admin = actingAdmin || (await requireAdmin());
    if (admin.role !== "ADMIN") {
      throw new Error("Unauthorized. Administrator privileges required.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });

    if (!user) {
      return { success: false, message: "Candidate user account not found." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "STATUS_CHANGED",
      targetType: "CANDIDATE",
      targetId: user.candidateProfile?.id || userId,
      details: {
        candidateId: user.candidateProfile?.candidateId,
        previousStatus: user.status,
        newStatus,
      },
    });

    safeRevalidate("/admin/candidates");
    safeRevalidate(`/admin/candidates/${user.candidateProfile?.id}`);

    return {
      success: true,
      message: `Account status updated to ${newStatus}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to update account status.",
    };
  }
}

/**
 * Admin triggers credential reset for a candidate
 */
export async function adminResetCandidatePassword(
  userId: string,
  actingAdmin?: { id: string; role: string }
): Promise<ActionResponse<{ resetToken: string }>> {
  try {
    const admin = actingAdmin || (await requireAdmin());
    if (admin.role !== "ADMIN") {
      throw new Error("Unauthorized. Administrator privileges required.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "CREDENTIAL_RESET_REQUESTED",
      targetType: "CANDIDATE",
      targetId: user.candidateProfile?.id || user.id,
      details: {
        candidateId: user.candidateProfile?.candidateId,
        initiatedBy: "ADMIN",
      },
    });

    return {
      success: true,
      message: "Password reset link generated successfully.",
      data: { resetToken },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to issue password reset.",
    };
  }
}

/**
 * Update candidate profile information
 */
export async function updateCandidateProfile(
  candidateProfileId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin();

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim() || null;
    const location = formData.get("location")?.toString().trim() || null;
    const joiningDateStr = formData.get("joiningDate")?.toString();

    if (!fullName || !joiningDateStr) {
      return { success: false, message: "Full Name and Joining Date are required." };
    }

    const joiningDate = new Date(joiningDateStr);
    if (isNaN(joiningDate.getTime())) {
      return { success: false, message: "Invalid Joining Date format." };
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        fullName,
        phone,
        location,
        joiningDate,
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "CANDIDATE_UPDATED",
      targetType: "CANDIDATE",
      targetId: candidateProfileId,
      details: {
        fullName,
        phone,
        location,
        joiningDate: joiningDateStr,
      },
    });

    safeRevalidate("/admin/candidates");
    safeRevalidate(`/admin/candidates/${candidateProfileId}`);

    return {
      success: true,
      message: "Candidate profile updated successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to update candidate profile.",
    };
  }
}
