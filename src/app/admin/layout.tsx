import React from "react";

/**
 * Root admin segment layout — acts as a passthrough.
 * Auth protection is handled by:
 * 1. middleware.ts (for all /admin/* routes except /admin/login)
 * 2. (protected)/layout.tsx (for the authenticated shell with Navbar + Sidebar)
 *
 * The (auth) route group (/admin/login etc.) bypasses the (protected) layout
 * and renders directly within this minimal wrapper, preventing the
 * infinite redirect loop that occurred when the auth guard tried to
 * redirect unauthenticated users to /admin/login while they were
 * already on /admin/login.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
