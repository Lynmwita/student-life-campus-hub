import Link from "next/link";
import { Clock, CheckCircle2, AlertTriangle, XCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/lib/actions/auth";

export default function VerificationStatusPage() {
  // Demonstration default is 'pending'
  const status: "pending" | "verified" | "requires_review" | "rejected" = "pending";

  const statusConfig = {
    pending: {
      title: "Verification in Progress",
      badge: <Badge variant="warning">Pending Review</Badge>,
      icon: <Clock className="w-12 h-12 text-amber-500" />,
      description:
        "Your student registration has been received and is queued for verification by your university administration.",
      actionText: "Check Back Soon",
      bg: "bg-amber-50 border-amber-200",
    },
    verified: {
      title: "Registration Verified!",
      badge: <Badge variant="success">Verified Student</Badge>,
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      description:
        "Your student enrollment has been officially confirmed. You now have full access to your personalized campus hub.",
      actionText: "Enter Campus Hub",
      bg: "bg-emerald-50 border-emerald-200",
    },
    requires_review: {
      title: "Action Required",
      badge: <Badge variant="warning">Requires Review</Badge>,
      icon: <AlertTriangle className="w-12 h-12 text-amber-600" />,
      description:
        "Your university administrator requested clarification on your student credentials or admission letter.",
      actionText: "Update Information",
      bg: "bg-amber-50 border-amber-200",
    },
    rejected: {
      title: "Verification Unsuccessful",
      badge: <Badge variant="danger">Rejected</Badge>,
      icon: <XCircle className="w-12 h-12 text-rose-500" />,
      description:
        "The registration details could not be validated against official university records. Please visit your faculty office.",
      actionText: "Contact Support",
      bg: "bg-rose-50 border-rose-200",
    },
  };

  const current = statusConfig[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-lg">
        <Card className="border border-[#C59B27]/30 bg-white shadow-xs text-center">
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <div className="mb-4">{current.icon}</div>
            <div className="mb-2">{current.badge}</div>
            <CardTitle className="text-2xl font-serif text-[#0B1D33]">{current.title}</CardTitle>
            <CardDescription className="max-w-md mx-auto text-sm mt-2 font-sans">
              {current.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Timeline */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Verification Progress
              </h4>
              <ol className="relative border-l border-slate-200 ml-3 space-y-4 text-xs">
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-emerald-500" />
                  <p className="font-semibold text-slate-900">
                    Account Created
                  </p>
                  <p className="text-slate-500">Student account setup completed.</p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-blue-500" />
                  <p className="font-semibold text-slate-900">
                    Application Submitted
                  </p>
                  <p className="text-slate-500">Academic credentials linked to university tenant.</p>
                </li>
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-amber-400 animate-ping" />
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-amber-500" />
                  <p className="font-semibold text-slate-900">
                    Staff Verification Review
                  </p>
                  <p className="text-slate-500">University administration verifies registration.</p>
                </li>
              </ol>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2 pb-6">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-1.5" />
                Go to Public Preview Feed
              </Button>
            </Link>

            <form action={signOutAction} className="w-full">
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline"
              >
                Sign out of this account
              </button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
