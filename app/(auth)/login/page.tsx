"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const res = await loginAction(formData);
      if (res && !res.success && res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      // Next.js redirect throws a NEXT_REDIRECT error which is normal behavior
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#06101E] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-[#0B1D33] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D] mb-3 shadow-xs">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#0B1D33] dark:text-white">
            Student Life & Campus Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            The university follows the student.
          </p>
        </div>

        <Card className="border border-[#C59B27]/30 bg-white dark:bg-[#06101E] shadow-xs">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your student email or portal credentials.
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
              <div className="relative">
                <Input
                  label="Student / Staff Email"
                  name="email"
                  type="email"
                  required
                  placeholder="student@summit.ac.ke"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-serif font-medium text-[#C59B27] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={loading}
              >
                Sign In <ArrowRight className="w-4 h-4 ml-1.5 text-[#FCD34D]" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-[#C59B27]/15 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Accounts are provisioned by university administration. Contact your registrar office if you require credentials.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
