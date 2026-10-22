"use client";

import {clearPrivateOffline} from "@/lib/offline";
import * as React from "react";
import { signOutAction } from "@/lib/actions/auth";

export default function LogoutPage() {
  React.useEffect(() => {
    (clearPrivateOffline(), signOutAction()).then(() => {
      window.location.href = "/login";
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1D33] text-white">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-serif font-bold text-[#FCD34D]">Signing Out...</h2>
        <p className="text-xs text-slate-300">Ending your active session safely.</p>
      </div>
    </div>
  );
}
