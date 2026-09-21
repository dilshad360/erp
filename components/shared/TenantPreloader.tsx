"use client";

import React from "react";
import { useOptionalTenant } from "./TenantProvider";
import CompanyLogo from "./CompanyLogo";

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
  companyName,
  brandColor,
  logoUrl,
  showAppLogoFallback = false,
  message = "Loading…",
  fullScreen = true,
  className = "",
}: TenantPreloaderProps): React.JSX.Element {
  const tenant = useOptionalTenant();

  // Resolve values from explicit props or fallback to tenant context
  const resolvedCompanyName =
    companyName !== undefined ? companyName : tenant?.companyName ?? null;
  const resolvedBrandColor = brandColor || tenant?.brandColor || "#6366f1";
  const resolvedLogo = logoUrl !== undefined ? logoUrl : tenant?.logoUrl ?? null;

  const content = (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: resolvedBrandColor }}
      />

      {/* Company Brand Logo / Monogram with Pulsing Halo */}
      <div className="relative mb-5">
        <div
          className="absolute -inset-2 rounded-2xl opacity-35 blur-md animate-pulse pointer-events-none"
          style={{ backgroundColor: resolvedBrandColor }}
        />
        <div className="relative">
          <CompanyLogo
            logoUrl={resolvedLogo}
            companyName={resolvedCompanyName}
            brandColor={resolvedBrandColor}
            size="xl"
            shape="rounded"
            showAppLogoFallback={showAppLogoFallback}
            priority={true}
            className="w-16 h-16 rounded-2xl shadow-2xl p-2 bg-[var(--color-surface)] border border-[var(--color-border)]"
            monogramClassName="text-xl"
          />
        </div>
      </div>

      {/* Title & Status Message */}
      <div className="space-y-1.5 mb-5 max-w-xs">
        {resolvedCompanyName && (
          <h2 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
            {resolvedCompanyName}
          </h2>
        )}
        <p className="text-xs text-[var(--color-text-muted)] font-medium tracking-wide">
          {message}
        </p>
      </div>

      {/* Smooth Glowing Indeterminate Progress Bar */}
      <div className="w-44 h-1 bg-[var(--color-border)] rounded-full overflow-hidden relative shadow-inner">
        <div
          className="h-full absolute rounded-full animate-indeterminate"
          style={{
            backgroundColor: resolvedBrandColor,
            boxShadow: `0 0 10px ${resolvedBrandColor}`,
          }}
        />
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div
        className={`flex items-center justify-center min-h-[220px] w-full ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)] transition-colors duration-200 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      {content}
    </div>
  );
}
