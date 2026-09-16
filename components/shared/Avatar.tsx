"use client";

import React, { useState } from "react";
import Image from "next/image";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg font-semibold",
};

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps): React.JSX.Element {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName?: string | null): string => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-border)] select-none ${sizeClasses[size]} ${className}`}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={name || "Avatar"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <span className="font-medium uppercase">{initials}</span>
      )}
    </div>
  );
}
