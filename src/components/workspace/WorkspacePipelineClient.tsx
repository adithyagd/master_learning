"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  createJobCandidate,
  updateCandidateStage,
  addRecruiterNote,
  scheduleInterview,
  checkDuplicateCandidate,
} from "@/actions/workspace";
import { PIPELINE_STAGES, PIPELINE_OUTCOMES } from "@/lib/design-system";
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  User,
  FileText,
  MessageSquare,
  Sparkles,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface JobCandidateItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  location?: string | null;
  currentCompany?: string | null;
  currentDesignation?: string | null;
  totalExperienceYears?: number | null;
  relevantExperienceYears?: number | null;
  qualification?: string | null;
  keySkills?: string | null;
  currentCtcLakhs?: number | null;
  expectedCtcLakhs?: number | null;
  noticePeriodDays?: number | null;
  source: string;
  resumeUrl?: string | null;
  documentNotes?: string | null;
  pipelineStage: string;
  rejectionReason?: string | null;
  clientName?: string | null;
  jobTitle?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  notes: Array<{
    id: string;
    noteType: string;
    content: string;
    followUpDate?: Date | string | null;
    createdAt: Date | string;
  }>;
  stageHistory: Array<{
    id: string;
    fromStage?: string | null;
    toStage: string;
    reason?: string | null;
    createdAt: Date | string;
  }>;
  interviews: Array<{
    id: string;
    clientName: string;
    jobRole: string;
    roundName: string;
    scheduledAt: Date | string;
    meetingType: string;
    status: string;
  }>;
}

interface WorkspacePipelineClientProps {
  initialCandidates: JobCandidateItem[];
  recruiterName: string;
  candidateId: string;
}

export function WorkspacePipelineClient({
  initialCandidates,
  recruiterName,
  candidateId,
}: WorkspacePipelineClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeStageFilter, setActiveStageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidateItem | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formTotalExp, setFormTotalExp] = useState("");
  const [formQualification, setFormQualification] = useState("");
  const [formSkills, setFormSkills] = useState("");
  const [formCurrentCtc, setFormCurrentCtc] = useState("");
  const [formExpectedCtc, setFormExpectedCtc] = useState("");
  const [formNoticePeriod, setFormNoticePeriod] = useState("");
  const [formSource, setFormSource] = useState("Naukri");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  // Stage change form
  const [targetStage, setTargetStage] = useState("");
  const [stageReason, setStageReason] = useState("");

  // Note form
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("CALL_LOG");
  const [noteFollowUp, setNoteFollowUp] = useState("");

  // Interview form
  const [itvClient, setItvClient] = useState("");
  const [itvRole, setItvRole] = useState("");
  const [itvRound, setItvRound] = useState("Technical Round 1");
  const [itvDateTime, setItvDateTime] = useState("");
  const [itvType, setItvType] = useState("ONLINE");
  const [itvVenue, setItvVenue] = useState("");
  const [itvInterviewer, setItvInterviewer] = useState("");

  // Live duplicate checking
  const handleCheckDuplicate = async () => {
    if (!formEmail.trim() && !formPhone.trim()) return;
    const res = await checkDuplicateCandidate({ email: formEmail, phone: formPhone });
    if (res.isDuplicate) {
      setDupWarning(res.message || "Duplicate candidate detected!");
    } else {
      setDupWarning(null);
    }
  };

  // Add recruiter
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError("Full Name, Email, and Phone number are required.");
      return;
    }

    startTransition(async () => {
      const res = await createJobCandidate({
        fullName: formName,
        email: formEmail,
        phone: formPhone,
        location: formLocation || undefined,
        currentCompany: formCompany || undefined,
        currentDesignation: formDesignation || undefined,
        totalExperienceYears: formTotalExp ? parseFloat(formTotalExp) : undefined,
        qualification: formQualification || undefined,
        keySkills: formSkills || undefined,
        currentCtcLakhs: formCurrentCtc ? parseFloat(formCurrentCtc) : undefined,
        expectedCtcLakhs: formExpectedCtc ? parseFloat(formExpectedCtc) : undefined,
        noticePeriodDays: formNoticePeriod ? parseInt(formNoticePeriod, 10) : undefined,
        source: formSource,
        jobTitle: formJobTitle || undefined,
        clientName: formClient || undefined,
        initialNote: formNote || undefined,
      });

      if (res.success) {
        setAddModalOpen(false);
        // Reset form
        setFormName("");
        setFormEmail("");
        setFormPhone("");
        setFormLocation("");
        setFormCompany("");
        setFormDesignation("");
        setFormTotalExp("");
        setFormQualification("");
        setFormSkills("");
        setFormCurrentCtc("");
        setFormExpectedCtc("");
        setFormNoticePeriod("");
        setFormJobTitle("");
        setFormClient("");
        setFormNote("");
        setDupWarning(null);
        router.refresh();
      } else {
        setFormError(res.message || "Failed to create candidate.");
      }
    });
  };

  // Stage change
  const handleStageChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !targetStage) return;

    startTransition(async () => {
      const res = await updateCandidateStage(selectedCandidate.id, targetStage, stageReason);
      if (res.success) {
        setStageModalOpen(false);
        setStageReason("");
        router.refresh();
        if (selectedCandidate) {
          setSelectedCandidate({
            ...selectedCandidate,
            pipelineStage: targetStage,
          });
        }
      }
    });
  };

  // Note submission
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !noteContent.trim()) return;

    startTransition(async () => {
      const res = await addRecruiterNote(selectedCandidate.id, {
        noteType,
        content: noteContent,
        followUpDate: noteFollowUp ? new Date(noteFollowUp) : null,
      });

      if (res.success) {
        setNoteModalOpen(false);
        setNoteContent("");
        setNoteFollowUp("");
        router.refresh();
      }
    });
  };

  // Schedule interview submission
  const handleInterviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !itvClient.trim() || !itvRole.trim() || !itvDateTime) return;

    startTransition(async () => {
      const res = await scheduleInterview(selectedCandidate.id, {
        clientName: itvClient,
        jobRole: itvRole,
        roundName: itvRound,
        scheduledAt: itvDateTime,
        meetingType: itvType,
        meetingLinkOrVenue: itvVenue || undefined,
        interviewerName: itvInterviewer || undefined,
      });

      if (res.success) {
        setInterviewModalOpen(false);
        setItvClient("");
        setItvRole("");
        setItvDateTime("");
        setItvVenue("");
        setItvInterviewer("");
        router.refresh();
        if (selectedCandidate) {
          setSelectedCandidate({
            ...selectedCandidate,
            pipelineStage: "INTERVIEW_SCHEDULED",
          });
        }
      }
    });
  };

  // Filter candidates
  const filteredCandidates = initialCandidates.filter((cand) => {
    if (activeStageFilter !== "ALL" && cand.pipelineStage !== activeStageFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cand.fullName.toLowerCase().includes(q);
      const matchEmail = cand.email.toLowerCase().includes(q);
      const matchPhone = cand.phone.includes(q);
      const matchSkills = cand.keySkills?.toLowerCase().includes(q) || false;
      const matchRole = cand.jobTitle?.toLowerCase().includes(q) || false;
      const matchClient = cand.clientName?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchPhone || matchSkills || matchRole || matchClient;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h1>
            <Badge variant="primary" size="sm">
              {initialCandidates.length} Sourced Profiles
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage candidates across the 11 recruitment pipeline stages, track interview coordination, and follow up with client panels.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setFormError(null);
            setDupWarning(null);
            setAddModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add recruiter
        </Button>
      </div>

      {/* Pipeline Stage Bar (11 Stages + Outcomes) */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 min-w-max border-b border-gray-200 pb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveStageFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeStageFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({initialCandidates.length})
          </button>

          {PIPELINE_STAGES.map((s) => {
            const count = initialCandidates.filter((c) => c.pipelineStage === s.id).length;
            const isActive = activeStageFilter === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStageFilter(s.id)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                  {s.step}
                </span>
                <span>{s.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/30 text-white" : "bg-gray-200 text-gray-800"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="h-5 w-px bg-gray-300 mx-1" />

          {/* Outcomes / Dropouts */}
          {PIPELINE_OUTCOMES.map((o) => {
            const count = initialCandidates.filter((c) => c.pipelineStage === o.id).length;
            const isActive = activeStageFilter === o.id;

            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setActiveStageFilter(o.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-rose-700 text-white font-semibold"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/50"
                }`}
              >
                {o.label} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, email, phone, skills, client..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="font-bold text-gray-900">{filteredCandidates.length}</span> of{" "}
          {initialCandidates.length} candidates
        </div>
      </div>

      {/* Candidate List Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Candidates in this Pipeline Stage</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? "No candidates matched your search criteria. Try modifying your filter or clear the search term."
                : `There are currently no candidates at "${activeStageFilter}". Add recruiters or advance profiles through the pipeline.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormError(null);
                setDupWarning(null);
                setAddModalOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Recruiter
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Recruiter Profile</th>
                  <th className="py-3 px-4">Experience &amp; Skills</th>
                  <th className="py-3 px-4">Client &amp; Mandate</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Latest Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((cand) => {
                  const stageObj = PIPELINE_STAGES.find((s) => s.id === cand.pipelineStage);
                  const outcomeObj = PIPELINE_OUTCOMES.find((o) => o.id === cand.pipelineStage);
                  const latestNote = cand.notes[0];

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{cand.fullName}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {cand.email}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {cand.phone}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        <div>
                          {cand.totalExperienceYears !== null
                            ? `${cand.totalExperienceYears} yrs exp`
                            : "Exp not specified"}
                          {cand.location ? ` &bull; ${cand.location}` : ""}
                        </div>
                        {cand.keySkills && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                            {cand.keySkills}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">
                          {cand.jobTitle || <span className="text-gray-400 italic">General Sourcing</span>}
                        </div>
                        <div className="text-[11px] text-gray-500">{cand.clientName || "E2E Pool"}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {stageObj ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${stageObj.color}`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-white/40 flex items-center justify-center text-[9px] font-bold">
                              {stageObj.step}
                            </span>
                            {stageObj.label}
                          </span>
                        ) : outcomeObj ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${outcomeObj.color}`}
                          >
                            {outcomeObj.label}
                          </span>
                        ) : (
                          <Badge variant="default" size="sm">
                            {cand.pipelineStage}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-[11px] max-w-xs">
                        {latestNote ? (
                          <div>
                            <span className="font-semibold text-gray-700 block truncate">
                              {latestNote.content}
                            </span>
                            <span className="text-gray-400 text-[10px]">
                              {new Date(latestNote.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-gray-400">No notes recorded yet</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setTargetStage(cand.pipelineStage);
                              setStageModalOpen(true);
                            }}
                            className="text-xs"
                          >
                            Change Stage
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCandidate(cand)}
                            className="text-xs"
                          >
                            Profile
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Candidate Detail Modal / Drawer */}
      {selectedCandidate && (
        <Modal
          isOpen={Boolean(selectedCandidate) && !stageModalOpen && !noteModalOpen && !interviewModalOpen}
          onClose={() => setSelectedCandidate(null)}
          title={selectedCandidate.fullName}
          description={`Managed by Recruiter ${recruiterName} (${candidateId}) &bull; Sourced via ${selectedCandidate.source}`}
          size="lg"
        >
          <div className="space-y-6 pt-2">
            {/* Action Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Current Pipeline Stage
                </span>
                <div className="mt-0.5">
                  <Badge variant="primary" size="md">
                    {selectedCandidate.pipelineStage.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetStage(selectedCandidate.pipelineStage);
                    setStageModalOpen(true);
                  }}
                  className="text-xs gap-1"
                >
                  Update Stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNoteContent("");
                    setNoteModalOpen(true);
                  }}
                  className="text-xs gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Add Note
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setItvClient(selectedCandidate.clientName || "");
                    setItvRole(selectedCandidate.jobTitle || "");
                    setInterviewModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Interview
                </Button>
              </div>
            </div>

            {/* Candidate Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-xl border border-gray-100 bg-white">
                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                  Contact &amp; Location
                </h4>
                <div>
                  <span className="text-gray-400">Email:</span>{" "}
                  <span className="font-medium text-gray-800">{selectedCandidate.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Phone:</span>{" "}
                  <span className="font-medium text-gray-800">{selectedCandidate.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Location:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.location || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Qualification:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.qualification || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-gray-100 bg-white">
                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                  Compensation &amp; Career
                </h4>
                <div>
                  <span className="text-gray-400">Current Company:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.currentCompany || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Current CTC:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.currentCtcLakhs
                      ? `₹${selectedCandidate.currentCtcLakhs} LPA`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Expected CTC:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.expectedCtcLakhs
                      ? `₹${selectedCandidate.expectedCtcLakhs} LPA`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Notice Period:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedCandidate.noticePeriodDays
                      ? `${selectedCandidate.noticePeriodDays} days`
                      : "Immediate / Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Skills */}
            {selectedCandidate.keySkills && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-gray-800">Key Skills:</span>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-gray-200 text-gray-700">
                  {selectedCandidate.keySkills}
                </div>
              </div>
            )}

            {/* Recruiter Notes Log */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Recruiter Notes &amp; Call History ({selectedCandidate.notes.length})
                </h4>
              </div>

              {selectedCandidate.notes.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 text-center text-gray-500 text-xs">
                  No interaction notes logged yet for this candidate.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCandidate.notes.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg border border-gray-200 bg-white space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {n.noteType}
                        </span>
                        <span>{new Date(n.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-gray-800">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stage History */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                Pipeline Audit Trail ({selectedCandidate.stageHistory.length})
              </h4>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedCandidate.stageHistory.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-slate-50 border border-gray-200 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-gray-800">{h.toStage}</span>
                      {h.fromStage && <span className="text-gray-400"> (from {h.fromStage})</span>}
                      {h.reason && <p className="text-gray-600 text-[10px] mt-0.5">{h.reason}</p>}
                    </div>
                    <span className="text-gray-400 font-mono text-[10px]">
                      {new Date(h.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(null)}>
                Close Drawer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Stage Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={stageModalOpen}
          onClose={() => setStageModalOpen(false)}
          title="Update Pipeline Stage"
          description={`Transitioning ${selectedCandidate.fullName} from ${selectedCandidate.pipelineStage}`}
        >
          <form onSubmit={handleStageChangeSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Select New Stage *</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <optgroup label="Pipeline Stages">
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      Step {s.step}: {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Outcomes & Holds">
                  {PIPELINE_OUTCOMES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Reason / Update Notes</label>
              <textarea
                value={stageReason}
                onChange={(e) => setStageReason(e.target.value)}
                placeholder="e.g. Cleared technical screening; scheduled for client interview."
                rows={3}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setStageModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPending || !targetStage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isPending ? "Transitioning..." : "Update Pipeline Stage"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Recruiter Note Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title="Add Recruiter Note / Call Log"
          description={`Record interaction history for ${selectedCandidate.fullName}`}
        >
          <form onSubmit={handleNoteSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Note Type</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CALL_LOG">Call Log / Telephonic Screening</option>
                <option value="SCREENING_NOTE">Detailed Screening Note</option>
                <option value="FOLLOW_UP">Follow-up Action</option>
                <option value="CLIENT_FEEDBACK">Client Panel Feedback</option>
                <option value="OFFER_DISCUSSION">Offer &amp; Joining Discussion</option>
                <option value="GENERAL">General Recruiter Remark</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Note Content *</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Detailed summary of phone interaction, candidate interest, salary discussion, or questions asked..."
                rows={4}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Next Follow-up Date (Optional)</label>
              <Input
                type="datetime-local"
                value={noteFollowUp}
                onChange={(e) => setNoteFollowUp(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPending || !noteContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isPending ? "Logging..." : "Log Note"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Interview Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={interviewModalOpen}
          onClose={() => setInterviewModalOpen(false)}
          title="Schedule Client Interview"
          description={`Coordinate interview round for ${selectedCandidate.fullName}`}
        >
          <form onSubmit={handleInterviewSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Client Organization *</label>
                <Input
                  value={itvClient}
                  onChange={(e) => setItvClient(e.target.value)}
                  placeholder="e.g. Tata Motors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Job Role / Mandate *</label>
                <Input
                  value={itvRole}
                  onChange={(e) => setItvRole(e.target.value)}
                  placeholder="e.g. Quality Inspector"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Interview Round</label>
                <Input
                  value={itvRound}
                  onChange={(e) => setItvRound(e.target.value)}
                  placeholder="e.g. Technical Round 1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Interview Mode</label>
                <select
                  value={itvType}
                  onChange={(e) => setItvType(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ONLINE">Online (Google Meet / Zoom)</option>
                  <option value="IN_PERSON">In-Person (Client Facility)</option>
                  <option value="TELEPHONIC">Telephonic Panel Round</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Scheduled Date &amp; Time *</label>
              <Input
                type="datetime-local"
                value={itvDateTime}
                onChange={(e) => setItvDateTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Meeting Link or Facility Address</label>
              <Input
                value={itvVenue}
                onChange={(e) => setItvVenue(e.target.value)}
                placeholder="e.g. https://meet.google.com/xyz or Plant 2, Whitefield, Bangalore"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Interviewer Name / Designation</label>
              <Input
                value={itvInterviewer}
                onChange={(e) => setItvInterviewer(e.target.value)}
                placeholder="e.g. Rajesh Sharma (Head of Quality)"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setInterviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPending || !itvClient.trim() || !itvRole.trim() || !itvDateTime}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isPending ? "Scheduling..." : "Schedule Interview"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add recruiter Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Recruiter to Pipeline"
        description="Provision recruiter profile with automatic duplicate check and ownership binding."
        size="lg"
      >
        <form onSubmit={handleAddCandidate} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {dupWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{dupWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Full Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email Address *</label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  setDupWarning(null);
                }}
                onBlur={handleCheckDuplicate}
                placeholder="ramesh.kumar@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Phone Number *</label>
              <Input
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(e.target.value);
                  setDupWarning(null);
                }}
                onBlur={handleCheckDuplicate}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Location</label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Bangalore, Karnataka"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Current Company</label>
              <Input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="e.g. ABC Manufacturing"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Current Designation</label>
              <Input
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                placeholder="e.g. Quality Associate"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Total Experience (Years)</label>
              <Input
                type="number"
                step="0.5"
                value={formTotalExp}
                onChange={(e) => setFormTotalExp(e.target.value)}
                placeholder="e.g. 3.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Qualification</label>
              <Input
                value={formQualification}
                onChange={(e) => setFormQualification(e.target.value)}
                placeholder="e.g. Diploma in Mechanical Engineering"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Current CTC (Lakhs LPA)</label>
              <Input
                type="number"
                step="0.1"
                value={formCurrentCtc}
                onChange={(e) => setFormCurrentCtc(e.target.value)}
                placeholder="e.g. 3.2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Expected CTC (Lakhs LPA)</label>
              <Input
                type="number"
                step="0.1"
                value={formExpectedCtc}
                onChange={(e) => setFormExpectedCtc(e.target.value)}
                placeholder="e.g. 4.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Notice Period (Days)</label>
              <Input
                type="number"
                value={formNoticePeriod}
                onChange={(e) => setFormNoticePeriod(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Sourcing Source</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Naukri">Naukri.com</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Job Fair">Job Fair</option>
                <option value="Campus">Campus / Polytechnic</option>
                <option value="Referral">Employee Referral</option>
                <option value="Cold Call">Cold Outreach</option>
                <option value="Other">Other Channel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Client Organization</label>
              <Input
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="e.g. Tata Motors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Job Role / Mandate</label>
              <Input
                value={formJobTitle}
                onChange={(e) => setFormJobTitle(e.target.value)}
                placeholder="e.g. Quality Inspector"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Key Skills</label>
            <Input
              value={formSkills}
              onChange={(e) => setFormSkills(e.target.value)}
              placeholder="e.g. Vernier Calipers, Micrometer, CMM, GD&T, 5S"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Initial Screening Note</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Summary of initial outreach or candidate qualification..."
              rows={3}
              className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isPending ? "Creating Record..." : "Add to Pipeline"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
