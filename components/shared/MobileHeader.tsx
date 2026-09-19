"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "./TenantProvider";
import ThemeToggle from "./ThemeToggle";

export default function MobileHeader(): React.JSX.Element {
  const { companyName, logoUrl, userName, userAvatarUrl } = useTenant();
  const [logoError, setLogoError] = useState(false);

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <header className="md:hidden sticky top-0 z-40 h-12 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-3.5 flex items-center justify-between safe-area-pt select-none transition-colors duration-200">
      {/* Company Branding */}
      <Link href="/dashboard" className="flex items-center gap-2 min-w-0 max-w-[65%]">
        {logoUrl && !logoError ? (
          <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-hover)] shadow-xs">
            <Image
              src={logoUrl}
              alt={companyName}
              fill
              className="object-contain p-0.5"
              onError={() => setLogoError(true)}
              unoptimized
            />
          </div>
        ) : (
          <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-hover)] shadow-xs">
            <Image
              src="/logo.png"
              alt="ERP Logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
        )}
        <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {companyName}
        </span>
      </Link>

      {/* Right Controls: Theme Toggle & User Avatar */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeToggle />

        <Link
          href="/settings"
          className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center cursor-pointer hover:border-[var(--color-brand)] transition-colors shadow-xs"
          title="Account Settings"
          aria-label="Account Settings"
        >
          {userAvatarUrl ? (
            <Image
              src={userAvatarUrl}
              alt={userName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
              {userInitial}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
