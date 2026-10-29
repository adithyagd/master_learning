import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { logoutUser } from "@/actions/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Admin access allowed for supervision
  if (user.role === "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar
          user={{
            name: "E2E Admin (Supervision Mode)",
            email: user.email,
            role: "ADMIN",
          }}
          onLogout={logoutUser}
          showSidebarToggle={true}
        />

        <div className="flex flex-1">
          <Sidebar type="workspace" className="hidden lg:flex" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Mandatory certification gate for candidates
  if (
    user.role !== "CANDIDATE" ||
    !user.candidateProfile ||
    !user.candidateProfile.isCertified ||
    user.candidateProfile.certificateStatus !== "ISSUED"
  ) {
    redirect("/academy?error=certification_required_for_workspace");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={{
          name: user.candidateProfile.fullName,
          email: user.email,
          role: "CANDIDATE",
          isCertified: true,
          candidateCode: user.candidateProfile.candidateId,
        }}
        onLogout={logoutUser}
        showSidebarToggle={true}
      />

      <div className="flex flex-1">
        <Sidebar type="workspace" className="hidden lg:flex" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
