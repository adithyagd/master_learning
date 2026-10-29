"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Award,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
} from "lucide-react";

interface CertificatePreviewProps {
  certificateNumber: string;
  verificationCode: string;
  candidateName: string;
  candidateId: string;
  finalScore: number;
  completionDate: string | Date;
  issuedAt: string | Date;
  approvedByAdminName: string;
  isDownloadable?: boolean;
}

export function CertificatePreview({
  certificateNumber,
  verificationCode,
  candidateName,
  candidateId,
  finalScore,
  completionDate,
  issuedAt,
  approvedByAdminName,
  isDownloadable = true,
}: CertificatePreviewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formattedIssueDate = new Date(issuedAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedCompletionDate = new Date(completionDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      {isDownloadable && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-sm font-bold text-gray-900">Official Authenticated Credential</span>
              <div className="text-xs text-gray-500">
                Verified Certificate ID: <span className="font-mono font-semibold text-gray-800">{certificateNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 text-gray-700 hover:bg-gray-50 border-gray-300"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </Button>
          </div>
        </div>
      )}

      {/* Formal Certificate Layout */}
      <div
        ref={certificateRef}
        id="printable-certificate"
        className="relative bg-white text-gray-900 p-8 sm:p-12 md:p-16 rounded-3xl shadow-xl border-8 border-slate-900 max-w-4xl mx-auto overflow-hidden print:p-8 print:border-4 print:shadow-none print:max-w-none print:w-full"
        style={{
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
        }}
      >
        {/* Subtle decorative inner border */}
        <div className="absolute inset-3 sm:inset-5 border-2 border-amber-500/40 rounded-2xl pointer-events-none" />
        <div className="absolute inset-5 sm:inset-7 border border-slate-200 rounded-xl pointer-events-none" />

        {/* Certificate Content */}
        <div className="relative text-center space-y-6 sm:space-y-8 z-10">
          {/* Header Brand */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-amber-400 text-xs font-bold tracking-widest uppercase">
              <Award className="w-4 h-4 text-amber-400" />
              Recruiter Academy &bull; Certified Professional
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-2">
              E2E PROCUREMENT PRIVATE LIMITED
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              CIN: U78300KA2025PTC204064 &bull; Bangalore, Karnataka, India
            </p>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1 pt-2">
            <div className="text-xs uppercase tracking-widest font-extrabold text-blue-700">
              Certificate of Professional Competency
            </div>
            <div className="text-xs text-slate-500 italic">
              This is to certify that
            </div>
          </div>

          {/* Recipient Name & Code */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight underline decoration-amber-400 decoration-2 underline-offset-8">
              {candidateName}
            </h1>
            <div className="text-sm font-mono font-bold text-blue-900 pt-1">
              Candidate ID: {candidateId}
            </div>
          </div>

          {/* Attestation Text */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-700 leading-relaxed">
            has rigorously fulfilled all curriculum requirements, demonstrated comprehensive proficiency across
            end-to-end talent acquisition competencies, and achieved a verified score of{" "}
            <span className="font-bold text-blue-900">{finalScore}%</span> on the Capstone Evaluation.
            Having met all quality standards, the recipient is officially recognized as:
          </p>

          {/* Designation Conferred */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white max-w-xl mx-auto shadow-md">
            <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
              Official Professional Credential
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-wide">
              CERTIFIED RECRUITER &bull; RECRUITER READY
            </div>
            <div className="text-xs text-blue-200 mt-1">
              Qualified for Enterprise Sourcing, Screening & Recruitment Operations
            </div>
          </div>

          {/* Meta & Signatures Grid */}
          <div className="pt-6 sm:pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end border-t border-slate-200 text-left">
            {/* Left: Issue Details */}
            <div className="space-y-1 text-xs text-slate-600">
              <div><span className="font-semibold text-slate-900">Completion Date:</span> {formattedCompletionDate}</div>
              <div><span className="font-semibold text-slate-900">Issue Date:</span> {formattedIssueDate}</div>
              <div className="pt-1">
                <span className="font-semibold text-slate-900">Verification Hash:</span>
                <div className="font-mono text-[10px] text-blue-900 font-bold break-all">
                  {verificationCode}
                </div>
              </div>
            </div>

            {/* Center: Gold Seal Emblem */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full border-4 border-amber-500/80 bg-amber-50 text-amber-800 flex flex-col items-center justify-center p-2 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-amber-600 mb-0.5" />
                <span className="text-[8px] font-black tracking-widest uppercase">E2E OFFICIAL</span>
                <span className="text-[7px] font-bold text-slate-600">SEAL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">{certificateNumber}</span>
            </div>

            {/* Right: Authorized Signature */}
            <div className="space-y-2 text-right">
              <div className="border-b-2 border-slate-800 pb-1 max-w-[180px] ml-auto">
                <div className="font-serif italic text-base font-bold text-slate-900">
                  Adithya Vardhan
                </div>
              </div>
              <div className="text-xs font-bold text-slate-900">Director of Operations</div>
              <div className="text-[11px] text-slate-500">
                E2E Procurement Private Limited
              </div>
              <div className="text-[10px] text-slate-400">
                Authorized by: {approvedByAdminName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
