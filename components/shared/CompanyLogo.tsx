"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";

export type CompanyLogoProps = {
  logoUrl?: string | null;
  companyName?: string | null;
  brandColor?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "rounded" | "circle" | "square";
  showAppLogoFallback?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  monogramClassName?: string;
};

const sizeMap = {
  xs: { container: "w-6 h-6 text-[10px]", icon: 12, px: 24 },
  sm: { container: "w-7 h-7 text-xs", icon: 14, px: 28 },
  md: { container: "w-9 h-9 text-sm font-semibold", icon: 18, px: 36 },
  lg: { container: "w-12 h-12 text-base font-bold", icon: 22, px: 48 },
  xl: { container: "w-16 h-16 text-xl font-bold", icon: 30, px: 64 },
};

const shapeMap = {
  rounded: "rounded-xl",
  circle: "rounded-full",
  square: "rounded-md",
};

export default function CompanyLogo({
  logoUrl,
  companyName,
  brandColor = "#6366f1",
  size = "md",
  shape = "rounded",
  showAppLogoFallback = false,
  priority = false,
  className = "",
  imageClassName = "",
  monogramClassName = "",
}: CompanyLogoProps): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  const activeSize = sizeMap[size] || sizeMap.md;
  const activeShape = shapeMap[shape] || shapeMap.rounded;
  const effectiveBrandColor = brandColor || "#6366f1";

  // Monogram calculation: 1 or 2 characters from company name
  const getMonogram = (name?: string | null): string => {
    if (!name || name.trim().length === 0) return "";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, Math.min(2, words[0].length)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const monogram = getMonogram(companyName);

  // 1. Valid custom company logo image
  if (logoUrl && !hasError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-center select-none ${activeSize.container} ${activeShape} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={companyName || "Company Logo"}
          fill
          sizes={`${activeSize.px}px`}
          className={`object-contain p-1 ${imageClassName}`}
          onError={() => setHasError(true)}
          priority={priority}
          unoptimized
        />
      </div>
    );
  }

  // 2. Company monogram / brand emblem (primary fallback for tenants)
  if (monogram) {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center border border-[var(--color-border)] shadow-xs select-none uppercase tracking-wider font-bold transition-all ${activeSize.container} ${activeShape} ${className} ${monogramClassName}`}
        style={{
          backgroundColor: `${effectiveBrandColor}1a`, // 10% opacity brand tint
          color: effectiveBrandColor,
          borderColor: `${effectiveBrandColor}33`, // 20% opacity brand border
        }}
        title={companyName || undefined}
        aria-label={companyName || "Company Icon"}
      >
        <span>{monogram}</span>
      </div>
    );
  }

  // 3. Optional fallback to ERP app logo if explicitly requested
  if (showAppLogoFallback) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-center select-none ${activeSize.container} ${activeShape} ${className}`}
      >
        <Image
          src="/logo.png"
          alt="ERP App Logo"
          fill
          sizes={`${activeSize.px}px`}
          className={`object-contain p-1 ${imageClassName}`}
          priority={priority}
        />
      </div>
    );
  }

  // 4. Default brand icon placeholder
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center border border-[var(--color-border)] shadow-xs select-none transition-all ${activeSize.container} ${activeShape} ${className}`}
      style={{
        backgroundColor: `${effectiveBrandColor}1a`,
        color: effectiveBrandColor,
        borderColor: `${effectiveBrandColor}33`,
      }}
    >
      <Building2 size={activeSize.icon} />
    </div>
  );
}
