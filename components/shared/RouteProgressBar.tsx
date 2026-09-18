"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTenant } from "./TenantProvider";

export default function RouteProgressBar(): React.JSX.Element | null {
  const pathname = usePathname();
  const { brandColor } = useTenant();
  const [isNavigating, setIsNavigating] = useState(false);
  const activeColor = brandColor || "#6366f1";

  // When pathname finishes updating, end navigation state
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    // Listen to click on internal links to trigger the progress bar immediately
    function handleLinkClick(e: MouseEvent): void {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
        return;
      }

      // Check if it's a different route
      if (href !== window.location.pathname) {
        setIsNavigating(true);
      }
    }

    document.addEventListener("click", handleLinkClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] bg-transparent pointer-events-none overflow-hidden"
      role="progressbar"
      aria-label="Loading page…"
    >
      <div
        className="h-full w-full animate-indeterminate rounded-r-full"
        style={{
          backgroundColor: activeColor,
          boxShadow: `0 0 8px ${activeColor}, 0 0 16px ${activeColor}`,
        }}
      />
    </div>
  );
}
