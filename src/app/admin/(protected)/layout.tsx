import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { logoutUser } from "@/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: "E2E Admin",
          email: user.email,
          role: "ADMIN",
        }}
        onLogout={logoutUser}
        showSidebarToggle={true}
      />

      <div className="flex flex-1">
        <Sidebar type="admin" className="hidden lg:flex" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
