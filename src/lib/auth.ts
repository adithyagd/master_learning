import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "e2e-procurement-default-fallback-jwt-secret-key-32";
const JWT_SECRET = new Uint8Array(Buffer.from(JWT_SECRET_STRING, "utf-8"));
export const AUTH_COOKIE_NAME = "e2e_auth_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CANDIDATE" | "MANAGER";
  candidateId?: string;
  fullName?: string;
  isCertified?: boolean;
}

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Sign JWT session token
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate secure random token for invitation / password reset
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Retrieve authenticated user from current session cookie
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { candidateProfile: true },
    });

    if (!user || user.status !== "ACTIVE") return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      candidateProfile: user.candidateProfile,
    };
  } catch (error) {
    return null;
  }
}
