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
    <div className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors mb-0.5 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>{backLabel ?? "Back"}</span>
            </Link>
          )}

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] truncate">
            {title}
          </h1>

          {description && (
            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
