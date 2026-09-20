"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 md:px-8 space-y-2.5 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Back Link & Title Container */}
        <div className="min-w-0 flex-1">
          {backHref && (
            <div className="mb-1">
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
                <span>{backLabel ?? "Back"}</span>
              </Link>
            </div>
          )}

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] truncate leading-snug">
            {title}
          </h1>

          {description && (
            <p className="hidden md:block text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Header Action Buttons */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2 pt-0.5 md:pt-0 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
