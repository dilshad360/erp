"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export type TenantPreloaderProps = {
  companyName?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  showAppLogoFallback?: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
};

export default function TenantPreloader({
  companyName = null,
  brandColor = "#6366f1",
  logoUrl = null,
  showAppLogoFallback = true,
  message = "Loading…",
  fullScreen = true,
  className = "",
}: TenantPreloaderProps): React.JSX.Element {
  const [logoError, setLogoError] = useState(false);
  const activeBrandColor = brandColor || "#6366f1";

  // Determine logo source: custom tenant logo if available, or app logo fallback
  const resolvedLogoUrl = logoUrl && !logoError ? logoUrl : (showAppLogoFallback ? "/logo.png" : null);

  const content = (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: activeBrandColor }}
      />

      {/* If Logo is available, display it with brand halo */}
      {resolvedLogoUrl ? (
        <div className="relative mb-5">
          {/* Soft pulsing halo */}
          <div
            className="absolute -inset-2 rounded-2xl opacity-35 blur-md animate-pulse"
            style={{ backgroundColor: activeBrandColor }}
          />
          <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2.5 shadow-2xl flex items-center justify-center overflow-hidden">
            <Image
              src={resolvedLogoUrl}
              alt={companyName || "ERP Logo"}
              fill
              className="object-contain p-2"
              onError={() => setLogoError(true)}
              priority
            />
          </div>
        </div>
      ) : (
        /* Sleek minimalist spinner ring for compact embed */
        <div className="relative mb-5 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center relative"
            style={{
              backgroundColor: `${activeBrandColor}12`,
            }}
          >
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: activeBrandColor }}
            />
          </div>
        </div>
      )}

      {/* Title & Status Message */}
      <div className="space-y-1.5 mb-5 max-w-xs">
        {companyName && (
          <h2 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
            {companyName}
          </h2>
        )}
        <p className="text-xs text-[var(--color-text-muted)] font-medium">
          {message}
        </p>
      </div>

      {/* Smooth Glowing Progress Bar */}
      <div className="w-44 h-1 bg-[var(--color-border)] rounded-full overflow-hidden relative shadow-inner">
        <div
          className="h-full w-full rounded-full animate-pulse"
          style={{
            backgroundColor: activeBrandColor,
            boxShadow: `0 0 10px ${activeBrandColor}`,
          }}
        />
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className={`flex items-center justify-center min-h-[260px] w-full ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)] transition-colors duration-200 ${className}`}
      role="status"
      aria-label={message}
    >
      {content}
    </div>
  );
}
