import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "e2e-procurement-default-fallback-jwt-secret-key-32";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const AUTH_COOKIE_NAME = "e2e_auth_token";

interface TokenPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CANDIDATE" | "MANAGER";
  candidateId?: string;
  fullName?: string;
  isCertified?: boolean;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session: TokenPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as unknown as TokenPayload;
    } catch {
      session = null;
    }
  }

  // 1. Admin Login Route (/admin/login)
  if (pathname === "/admin/login") {
    if (session && session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/candidates", request.url));
    }
    return NextResponse.next();
  }

  // 2. Candidate Login Route (/login)
  // Always show the login form — do NOT auto-redirect even if a session exists.
  // The user must enter credentials explicitly every time they visit /login.
  if (pathname === "/login") {
    return NextResponse.next();
  }


  // 3. Admin Center Protection (/admin and /admin/*)
  if (pathname.startsWith("/admin")) {
    // Exclude forgot-password or public reset routes
    if (pathname === "/admin/forgot-password" || pathname === "/admin/reset-password") {
      return NextResponse.next();
    }

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "ADMIN") {
      // Cross-role block: Candidates cannot access Admin Center
      return NextResponse.redirect(new URL("/academy?error=unauthorized_admin_access", request.url));
    }

    // Redirect root /admin to /admin/candidates
    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/candidates", request.url));
    }

    return NextResponse.next();
  }

  // 4. Recruitment Operations Workspace Protection (/workspace/*)
  // MANDATORY CONSTRAINT: Candidates must NEVER access the Operations Workspace before certification is approved and issued.
  if (pathname.startsWith("/workspace")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role === "ADMIN") {
      // Admins should manage from Admin center, but if previewing or redirecting
      return NextResponse.next();
    }

    if (!session.isCertified) {
      // Strictly blocked: candidate is not certified yet
      return NextResponse.redirect(
        new URL("/academy?error=certification_required_for_workspace", request.url)
      );
    }

    return NextResponse.next();
  }

  // 5. Academy Trainee Portal Protection (/academy/*)
  if (pathname.startsWith("/academy")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 6. Manager Portal Protection (/manager and /manager/*)
  if (pathname.startsWith("/manager")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "MANAGER" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/academy?error=unauthorized_manager_access", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/manager",
    "/manager/:path*",
    "/workspace",
    "/workspace/:path*",
    "/academy",
    "/academy/:path*",
    "/login",
    "/admin/login",
  ],
};
