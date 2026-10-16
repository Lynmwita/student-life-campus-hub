"use client";

import * as React from "react";
import Image from "next/image";
import { Download, X, Share, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [installedSuccess, setInstalledSuccess] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if already running standalone (already installed)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check dismissal cooldown (7 days)
    const dismissedTime = localStorage.getItem("campus_hub_install_dismissed");
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Gentle delayed appearance for iOS
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. Listen for Chrome/Android/Desktop beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("PWA installation prompt failed:", err);
    }
  }

  function handleDismiss() {
    setIsVisible(false);
    localStorage.setItem("campus_hub_install_dismissed", Date.now().toString());
  }

  if (isStandalone || (!isVisible && !installedSuccess)) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="App Installation Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans"
    >
      <div className="bg-white border border-[#C59B27]/40 shadow-xl rounded-2xl p-4 flex items-start gap-3.5 text-[#0B1D33]">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#0B1D33] border border-[#C59B27]/50 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
          <Image
            src="/icons/icon-192x192.png"
            alt="Campus Hub App Icon"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          {installedSuccess ? (
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold py-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Campus Hub installed successfully!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-serif font-bold text-sm text-[#0B1D33] leading-tight">
                  Install Campus Hub
                </h4>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-[#0B1D33] p-1 rounded-md transition-colors"
                  aria-label="Dismiss install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-snug">
                {isIos
                  ? "Install on your home screen for quick offline access to timetables and student alerts."
                  : "Install on your device for instant offline access and real-time campus notifications."}
              </p>

              {/* Action */}
              <div className="mt-3 flex items-center gap-2">
                {isIos ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span>Tap</span>
                    <Share className="w-3.5 h-3.5 text-[#0B1D33]" />
                    <span>then &apos;Add to Home Screen&apos;</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleInstallClick}
                    className="text-xs h-8 px-3 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FCD34D]" /> Install App
                  </Button>
                )}

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                >
                  Not now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
