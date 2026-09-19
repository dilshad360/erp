"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressContent(): React.JSX.Element | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUrlRef = useRef<string>("");

  const clearAllTimers = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const startProgress = (): void => {
    clearAllTimers();
    setVisible(true);
    setProgress(15);

    // Trickle progress up smoothly
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + 12;
        if (prev < 70) return prev + 6;
        if (prev < 88) return prev + 2;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
    }, 150);

    // Safety timeout: reset if navigation hangs longer than 8s
    resetTimerRef.current = setTimeout(() => {
      completeProgress();
    }, 8000);
  };

  const completeProgress = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(100);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  // Listen to Next.js route change completion
  useEffect(() => {
    const fullUrl = `${pathname}?${searchParams.toString()}`;
    if (currentUrlRef.current && currentUrlRef.current !== fullUrl) {
      completeProgress();
    }
    currentUrlRef.current = fullUrl;
  }, [pathname, searchParams]);

  // Global click interception for internal navigation links + custom event listeners
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // Only primary left click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // Ignore modifier keys

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external, hash only, mailto, tel, or download links
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Check same origin
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.origin !== currentUrl.origin) return;

        // If navigating to the exact same URL, don't trigger
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        startProgress();
      } catch {
        // Ignore invalid URLs
      }
    };

    const handleCustomStart = (): void => startProgress();
    const handleCustomComplete = (): void => completeProgress();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("route-change-start", handleCustomStart);
    window.addEventListener("route-change-complete", handleCustomComplete);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("route-change-start", handleCustomStart);
      window.removeEventListener("route-change-complete", handleCustomComplete);
      clearAllTimers();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page navigation progress"
    >
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--color-brand, #6366f1)",
          boxShadow: "0 0 10px var(--color-brand, #6366f1), 0 0 5px var(--color-brand, #6366f1)",
          transitionDuration: progress === 100 ? "180ms" : "200ms",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export default function RouteProgressBar(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
