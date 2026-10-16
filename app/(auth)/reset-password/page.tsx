"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { updatePasswordAction } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const res = await updatePasswordAction(formData);
      if (res && !res.success && res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch {
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
            Choose a new secure password
          </p>
        </div>

        <Card className="border border-[#C59B27]/30 bg-white shadow-xs">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Ensure your new password contains uppercase, lowercase, numbers, and symbols.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Password updated successfully!
                </div>
                <p className="text-xs leading-relaxed text-emerald-700">
                  Your credentials have been securely updated. Redirecting to your student dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                />

                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={loading}
                >
                  Update Password <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-center border-t border-slate-100 pt-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
