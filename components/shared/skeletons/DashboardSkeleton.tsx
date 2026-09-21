"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";

export default function DashboardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header Skeleton */}
      <PageHeaderSkeleton hasAction={false} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Stat Cards Grid Skeleton — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3 shadow-xs animate-shimmer"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 sm:w-24 rounded bg-[var(--color-border)]" />
                <div className="h-7 w-7 rounded-lg bg-[var(--color-border-subtle)]" />
              </div>
              <div className="h-7 w-16 sm:w-20 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>

        {/* Recent Projects Skeleton Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--color-border)] animate-shimmer" />
              <div className="h-4 w-32 rounded bg-[var(--color-border)] animate-shimmer" />
            </div>
            <div className="h-3 w-14 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] space-y-3 animate-shimmer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
                    <div className="h-3 w-1/2 rounded bg-[var(--color-border-subtle)]" />
                  </div>
                  <div className="h-4 w-12 rounded-full bg-[var(--color-border)] shrink-0" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-full rounded bg-[var(--color-border)]" />
                </div>
                <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks Skeleton Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--color-border)] animate-shimmer" />
              <div className="h-4 w-28 rounded bg-[var(--color-border)] animate-shimmer" />
            </div>
            <div className="h-3 w-14 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
          </div>

          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent bg-[var(--color-surface-raised)]/40 animate-shimmer"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border)] shrink-0" />
                <div className="h-3.5 flex-1 rounded bg-[var(--color-border)]" />
                <div className="h-3 w-16 hidden sm:block rounded bg-[var(--color-border-subtle)]" />
                <div className="h-3 w-12 rounded bg-[var(--color-border-subtle)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
