import * as React from "react";
import { StickyBottomBar } from "@/components/shared/sticky-bottom-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <div className="flex-1 pb-20 sm:pb-24">{children}</div>
      <StickyBottomBar />
    </div>
  );
}
