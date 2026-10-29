"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { requestPasswordReset } from "@/actions/auth";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);
    setResetToken(null);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier")?.toString() || "";

    const result = await requestPasswordReset(identifier);
    setIsLoading(false);

    if (result.success) {
      setSuccessInfo(result.message || "Reset link generated.");
      if (result.data?.resetToken) {
        setResetToken(result.data.resetToken);
      }
    } else {
      setErrorMessage(result.message || "Failed to process request.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo variant="full" size="lg" />
          </Link>
          <h1 className="text-xl font-bold text-navy-900 mt-4">Reset Your Password</h1>
          <p className="text-xs text-navy-500 mt-1">
            Enter your registered email address or candidate ID to receive a secure reset link.
          </p>
        </div>

        <Card className="border-navy-200/90 shadow-md">
          <CardHeader>
            <CardTitle>Account Recovery</CardTitle>
            <CardDescription>
              We will generate a time-limited (2 hour) secure credential recovery token.
            </CardDescription>
          </CardHeader>

          {successInfo ? (
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-success-50 border border-success-200 text-success-800 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-success-600 mt-0.5" />
                <div>
                  <p className="font-semibold">{successInfo}</p>
                  <p className="text-success-700 mt-1">
                    In this deployment environment, you can directly access the generated password reset link below:
                  </p>
                </div>
              </div>

              {resetToken && (
                <div className="p-3 bg-navy-50 rounded-lg border border-navy-200">
                  <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider block mb-1">
                    Generated Reset Link:
                  </span>
                  <Link
                    href={`/reset-password?token=${resetToken}`}
                    className="text-xs text-brand-600 font-mono break-all hover:underline"
                  >
                    /reset-password?token={resetToken}
                  </Link>
                </div>
              )}

              <Link href="/login" className="block w-full">
                <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          ) : (
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

                <Input
                  label="Registered Email or Candidate ID"
                  name="identifier"
                  id="identifier"
                  required
                  placeholder="e.g. candidate@e2epvtltd.com or E2E-REC-001"
                  leftAddon={<Mail className="w-4 h-4" />}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Generate Reset Token
                </Button>

                <div className="flex justify-between w-full text-xs text-navy-500 pt-2 border-t border-navy-100">
                  <Link href="/login" className="hover:text-navy-900 inline-flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Candidate Login
                  </Link>
                  <Link href="/admin/login" className="hover:text-navy-900">
                    Admin Login
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
