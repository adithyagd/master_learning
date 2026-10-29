"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { createCandidate } from "@/actions/candidate";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Hash,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

export default function AddCandidatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{
    candidateId: string;
    invitationToken: string;
    passwordSet?: boolean;
    message?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCandidate(formData);
    setIsLoading(false);

    if (result.success && result.data) {
      setCreatedData({
        candidateId: result.data.candidateId,
        invitationToken: result.data.invitationToken,
        passwordSet: result.data.passwordSet,
        message: result.message,
      });
    } else {
      setErrorMessage(result.message || "Failed to create candidate.");
    }
  }

  function handleCopyInvite() {
    if (!createdData) return;
    const inviteUrl = `${window.location.origin}/reset-password?token=${createdData.invitationToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/candidates">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Candidates
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-navy-900">Provision Recruiter Candidate</h1>
        <p className="text-xs text-navy-500 mt-1">
          Create an authorized candidate account and generate a secure, single-use invitation credential.
        </p>
      </div>

      {createdData ? (
        <Card className="border-success-200 bg-success-50/20 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-success-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <CardTitle className="text-success-900">Candidate Created Successfully</CardTitle>
            </div>
            <CardDescription className="text-success-800">
              {createdData.message || "Account initialized in the database."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-success-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-700">Assigned Candidate ID:</span>
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {createdData.candidateId}
                </span>
              </div>

              {createdData.passwordSet ? (
                /* Password was manually set — no invitation link needed */
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    <strong>Password Set by Admin.</strong> The candidate can log in immediately using their email and the password you configured. No invitation link is required.
                  </span>
                </div>
              ) : (
                /* Invitation link flow */
                <>
                  <div>
                    <span className="text-xs font-semibold text-navy-700 block mb-1">
                      Secure Password Setup Link:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/reset-password?token=${createdData.invitationToken}`}
                        className="w-full text-xs font-mono bg-navy-50 border border-navy-200 rounded-lg px-3 py-2 text-navy-800 select-all"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyInvite}
                        leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      <strong>Security Compliance:</strong> Plaintext passwords are never generated, stored, or transmitted. The candidate sets their initial password via this secure invitation link (valid for 72 hours).
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreatedData(null);
                setErrorMessage(null);
              }}
            >
              Add Another Candidate
            </Button>
            <Link href="/admin/candidates">
              <Button variant="primary" size="sm">
                View Candidate Registry
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Candidate Details</CardTitle>
            <CardDescription>
              All fields marked with an asterisk (*) are required for official registration.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  id="fullName"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  leftAddon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Candidate ID"
                  name="candidateId"
                  id="candidateId"
                  required
                  placeholder="e.g. E2E-REC-001"
                  leftAddon={<Hash className="w-4 h-4" />}
                  helperText="Unique uppercase identifier (e.g. E2E-REC-xxx)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Corporate Email"
                  name="email"
                  id="email"
                  type="email"
                  required
                  placeholder="candidate@e2epvtltd.com"
                  leftAddon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  leftAddon={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Location / Office"
                  name="location"
                  id="location"
                  placeholder="Bangalore, Karnataka"
                  leftAddon={<MapPin className="w-4 h-4" />}
                />

                <Input
                  label="Joining Date"
                  name="joiningDate"
                  id="joiningDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  leftAddon={<Calendar className="w-4 h-4" />}
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="status" className="text-xs font-semibold text-navy-800 tracking-wide">
                  Account Status <span className="text-danger-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="ACTIVE"
                  className="w-full rounded-lg border border-navy-300 bg-white px-3.5 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to log in &amp; train)</option>
                  <option value="INACTIVE">INACTIVE (Deactivated / Pending Onboarding)</option>
                </select>
                <p className="text-[11px] text-navy-400">
                  Inactive accounts cannot authenticate until toggled to active.
                </p>
              </div>

              {/* ── Admin-Set Password ── */}
              <div className="pt-2 border-t border-navy-100">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-brand-600" />
                  <p className="text-xs font-bold text-navy-800 uppercase tracking-wide">
                    Set Account Password
                  </p>
                  <span className="text-[10px] text-navy-400 font-normal normal-case">
                    (optional — leave blank to use invitation link instead)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-navy-800 tracking-wide">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-navy-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-navy-300 bg-white pl-9 pr-10 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 text-navy-400 hover:text-navy-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-semibold text-navy-800 tracking-wide">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-navy-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-navy-300 bg-white pl-9 pr-10 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 text-navy-400 hover:text-navy-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-navy-400 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  If a password is set here, the candidate can log in immediately without needing the invitation link.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Link href="/admin/candidates">
                <Button variant="outline" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Provision Account
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
