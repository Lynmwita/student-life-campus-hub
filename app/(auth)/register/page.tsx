"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [emailValue, setEmailValue] = React.useState("");

  const isAcademic =
    emailValue.includes("@") &&
    (emailValue.toLowerCase().endsWith(".ac.ke") ||
      emailValue.toLowerCase().endsWith(".edu") ||
      emailValue.toLowerCase().endsWith(".edu.ke"));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await registerAction(formData);
      if (res && !res.success && res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred during registration. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Get Started
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create your account to connect with your university.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle>Register Account</CardTitle>
            <CardDescription>
              Step 1 of 2: Create login credentials before campus verification.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name (Official Identity)"
                name="fullName"
                type="text"
                required
                placeholder="e.g. Brian Otieno"
                autoComplete="name"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="brian@summit.ac.ke"
                autoComplete="email"
                helperText={
                  isAcademic
                    ? "Official academic email recognized (.ac.ke / .edu)"
                    : "Must be your official university email (@university.ac.ke or .edu)"
                }
              />

              <Input
                label="Create Password"
                name="password"
                type="password"
                required
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter password"
                autoComplete="new-password"
              />

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your student data is strictly isolated to your university tenant.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={loading}
              >
                Continue to Campus Setup <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 underline-offset-4 hover:underline"
              >
                Sign in instead
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
