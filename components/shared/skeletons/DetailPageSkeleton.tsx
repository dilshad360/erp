"use client";

import React from "react";

export default function DetailPageSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header / Back Button skeleton */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-border)] animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-5 w-40 sm:w-56 rounded bg-[var(--color-border)] animate-shimmer" />
              <div className="h-3 w-28 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-lg bg-[var(--color-border)] animate-shimmer" />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Info Overview Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-6 shadow-xs animate-shimmer">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-border)] shrink-0" />
              <div className="space-y-2">
                <div className="h-5 w-48 rounded bg-[var(--color-border)]" />
                <div className="h-3.5 w-32 rounded bg-[var(--color-border-subtle)]" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-[var(--color-border)]" />
          </div>

          {/* Key-Value Fields Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-[var(--color-border-subtle)]" />
                <div className="h-4 w-28 rounded bg-[var(--color-border)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Section / Tabs Skeleton */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs animate-shimmer">
          <div className="h-5 w-36 rounded bg-[var(--color-border)]" />
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full rounded bg-[var(--color-border-subtle)]" />
            <div className="h-4 w-5/6 rounded bg-[var(--color-border-subtle)]" />
            <div className="h-4 w-4/6 rounded bg-[var(--color-border-subtle)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
