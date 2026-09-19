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
    <div className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-2.5 md:py-4 md:px-8 flex items-center justify-between gap-3 min-h-[46px] md:min-h-[64px]">
        <div className="min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-[11px] md:text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors mb-0.5 group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>{backLabel ?? "Back"}</span>
            </Link>
          )}

          <h1 className="text-base sm:text-lg md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] truncate leading-snug">
            {title}
          </h1>

          {description && (
            <p className="hidden md:block text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
