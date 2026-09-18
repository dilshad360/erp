"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPrompt(): React.JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if previously dismissed
    const dismissed = localStorage.getItem("erp_pwa_dismissed");
    if (dismissed === "true") return;

    // Increment visit count
    const count = parseInt(localStorage.getItem("erp_pwa_visits") || "0", 10) + 1;
    localStorage.setItem("erp_pwa_visits", count.toString());

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      // Show on 2nd or later visit
      if (count >= 2) {
        setShowPrompt(true);
      }
    }

    // Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt if user has visited at least twice
      if (count >= 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("erp_pwa_dismissed", "true");
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem("erp_pwa_dismissed", "true");
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md p-4 shadow-xl shadow-black/20 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <Image
                src="/logo.png"
                alt="ERP Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Install ERP App
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">
                {isIOS
                  ? "Tap the Share button below, then 'Add to Home Screen' for instant mobile access."
                  : "Install on your home screen for instant offline attendance and faster access."}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Maybe later
            </button>
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
            >
              <Download size={14} />
              <span>Add to Home Screen</span>
            </button>
          </div>
        )}

        {isIOS && (
          <div className="flex items-center justify-end pt-1 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-brand)] font-semibold hover:underline"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
