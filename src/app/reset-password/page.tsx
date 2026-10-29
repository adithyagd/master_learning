"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { completePasswordReset } from "@/actions/auth";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    const result = await completePasswordReset(token, newPassword);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(result.message || "Password successfully reset!");
      setTimeout(() => {
        router.push(result.redirectTo || "/login");
      }, 2000);
    } else {
      setErrorMessage(result.message || "Failed to reset password.");
    }
  }

  if (!token) {
    return (
      <Card className="border-navy-200/90 shadow-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-danger-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-navy-900">Missing Reset Token</h2>
          <p className="text-xs text-navy-500 mt-1 mb-6">
            A valid security token is required to reset your account password.
          </p>
          <Link href="/forgot-password">
            <Button variant="primary" size="md">
              Request New Reset Link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-navy-200/90 shadow-md">
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>
          Enter a secure password for your E2E Procurement account (min. 8 characters)
        </CardDescription>
      </CardHeader>

      {successMessage ? (
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-success-50 border border-success-200 text-success-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-success-600" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              <p className="text-success-700 mt-0.5">Redirecting to login portal...</p>
            </div>
          </div>
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
              label="New Password"
              name="newPassword"
              id="newPassword"
              type="password"
              required
              placeholder="At least 8 characters"
              leftAddon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              id="confirmPassword"
              type="password"
              required
              placeholder="Re-enter password"
              leftAddon={<Lock className="w-4 h-4" />}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo variant="full" size="lg" />
          </Link>
          <h1 className="text-xl font-bold text-navy-900 mt-4">Create New Password</h1>
        </div>

        <Suspense fallback={<div className="text-center text-xs text-navy-500">Loading reset session...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
