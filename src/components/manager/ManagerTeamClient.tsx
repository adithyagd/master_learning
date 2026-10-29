"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Briefcase,
  FileText,
  Mail,
  User,
} from "lucide-react";

interface TeamMember {
  id: string;
  fullName: string;
  candidateId: string;
  email: string;
  status: string;
  lastLoginAt: Date | string | null;
  isCertified: boolean;
  joiningDate: Date | string;
  totalCandidates: number;
  totalReports: number;
  latestReport: {
    status: string;
    reportDate: Date | string;
    submittedAt: Date | string | null;
  } | null;
}

interface ManagerTeamClientProps {
  team: TeamMember[];
}

export function ManagerTeamClient({ team }: ManagerTeamClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeam = team.filter((member) => {
    const q = searchQuery.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(q) ||
      member.candidateId.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
              <Users className="w-5 h-5 text-indigo-700" />
            </span>
            <h1 className="text-2xl font-bold text-navy-950">Assigned Team Roster</h1>
          </div>
          <p className="text-sm text-navy-600 mt-1">
            Recruiters assigned directly under your management. Strictly isolated to your leadership purview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold">
            {team.length} Assigned Recruiter{team.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-navy-100 shadow-sm flex items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-navy-50/50 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Team Roster Grid */}
      {filteredTeam.length === 0 ? (
        <Card className="border-navy-100 shadow-sm">
          <EmptyState
            icon={<Users className="w-8 h-8 text-navy-400" />}
            title={searchQuery ? "No team members found" : "No recruiters assigned to your team"}
            description={
              searchQuery
                ? `No recruiters match '${searchQuery}'.`
                : "Your administrator has not assigned recruiters to your team yet."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeam.map((member) => (
            <Card key={member.id} className="border-navy-100 shadow-sm hover:border-navy-300 transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-navy-950 text-base">{member.fullName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {member.candidateId}
                      </Badge>
                      <Badge variant={member.isCertified ? "success" : "default"} className="text-[10px]">
                        {member.isCertified ? "Certified Recruiter" : "Academy Candidate"}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" title="Active" />
                </div>

                <div className="space-y-1.5 text-xs text-navy-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-navy-400" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-navy-400" />
                    <span>Joined {new Date(member.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-navy-50/50 rounded-lg">
                    <span className="text-navy-500 text-[11px]">Pipeline Size</span>
                    <div className="font-bold text-navy-950 text-sm mt-0.5">
                      {member.totalCandidates} candidates
                    </div>
                  </div>

                  <div className="p-2 bg-navy-50/50 rounded-lg">
                    <span className="text-navy-500 text-[11px]">Reports Submitted</span>
                    <div className="font-bold text-navy-950 text-sm mt-0.5">
                      {member.totalReports} reports
                    </div>
                  </div>
                </div>

                {member.latestReport && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500">Latest Report:</span>
                    <Badge
                      variant={
                        member.latestReport.status === "APPROVED"
                          ? "success"
                          : member.latestReport.status === "SUBMITTED"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px]"
                    >
                      {member.latestReport.status}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
