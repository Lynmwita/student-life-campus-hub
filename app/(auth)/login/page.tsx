"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function fillDemo(e: string, p: string) {
    setEmail(e);
    setPassword(p);
    setError(null);
  }

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-[#0B1D33] border border-[#C59B27]/40 flex items-center justify-center text-[#FCD34D] mb-3 shadow-xs">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#0B1D33]">
            Student Life & Campus Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            The university follows the student.
          </p>
        </div>

        <Card className="border border-[#C59B27]/30 bg-white shadow-xs">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your student email or portal credentials.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs leading-relaxed">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@summit.ac.ke"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <p className="text-xs text-slate-500 font-sans">
              Accounts are provisioned by university administration. Contact your registrar office if you require credentials.
            </p>
          </CardFooter>
        </Card>

        {/* Pilot Inspection Demo Credentials - Strictly OFF in production builds */}
        {process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true" && (
          <div className="mt-6 p-4 rounded-xl border border-[#C59B27]/30 bg-white/70 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C59B27]">
                Pilot Demo Access
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SMU Pilot Node</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("admin@summit.ac.ke", "AdminPassword123!")}
                className="text-left p-2.5 rounded-lg border border-[#C59B27]/20 hover:border-[#C59B27] bg-[#F8FAFC] transition-colors"
              >
                <div className="font-semibold text-[#0B1D33]">Admin Demo</div>
                <div className="text-[10px] text-slate-500 truncate">admin@summit.ac.ke</div>
                <div className="text-[9px] text-[#C59B27] mt-0.5 font-mono">Super Admin • /admin</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("registrar@summit.ac.ke", "StaffPassword123!")}
                className="text-left p-2.5 rounded-lg border border-[#C59B27]/20 hover:border-[#C59B27] bg-[#F8FAFC] transition-colors"
              >
                <div className="font-semibold text-[#0B1D33]">Registrar Demo</div>
                <div className="text-[10px] text-slate-500 truncate">registrar@summit.ac.ke</div>
                <div className="text-[9px] text-[#C59B27] mt-0.5 font-mono">Academic Affairs • Notice Ops</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("alex.mutua@summit.ac.ke", "StudentPassword123!")}
                className="text-left p-2.5 rounded-lg border border-[#C59B27]/20 hover:border-[#C59B27] bg-[#F8FAFC] transition-colors"
              >
                <div className="font-semibold text-[#0B1D33]">Student Demo</div>
                <div className="text-[10px] text-slate-500 truncate">alex.mutua@summit.ac.ke</div>
                <div className="text-[9px] text-[#C59B27] mt-0.5 font-mono">Active Student • /dashboard</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("student@summit.ac.ke", "StudentPassword123!")}
                className="text-left p-2.5 rounded-lg border border-[#C59B27]/20 hover:border-[#C59B27] bg-[#F8FAFC] transition-colors"
              >
                <div className="font-semibold text-[#0B1D33]">Onboarding Flow</div>
                <div className="text-[10px] text-slate-500 truncate">student@summit.ac.ke</div>
                <div className="text-[9px] text-[#C59B27] mt-0.5 font-mono">New Student • 3-Step Flow</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
