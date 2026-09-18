"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTenant } from "./TenantProvider";
import ThemeToggle from "./ThemeToggle";

export default function MobileHeader(): React.JSX.Element {
  const { companyName, logoUrl, brandColor, userName, userAvatarUrl } = useTenant();
  const [logoError, setLogoError] = useState(false);

  const initial = companyName ? companyName.charAt(0).toUpperCase() : "C";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <header className="md:hidden sticky top-0 z-40 h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 flex items-center justify-between safe-area-pt select-none transition-colors duration-200">
      {/* Company Branding */}
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 max-w-[65%]">
        {logoUrl && !logoError ? (
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-hover)]">
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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border border-[var(--color-border)]"
            style={{
              backgroundColor: `${brandColor || "#6366f1"}18`,
              color: brandColor || "#6366f1",
              borderColor: `${brandColor || "#6366f1"}40`,
            }}
          >
            {initial}
          </div>
        )}
        <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">
          {companyName}
        </span>
      </Link>

      {/* Right Controls: Theme Toggle & User Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />

        <Link
          href="/settings"
          className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center cursor-pointer hover:border-[var(--color-brand)] transition-colors"
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
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {userInitial}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
