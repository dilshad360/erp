"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import { LayoutGrid, List } from "lucide-react";

export default function ProjectPageSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <PageHeaderSkeleton hasAction={true} actionCount={1} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Top Control Bar: View Switcher, Status Tabs, Client Filter, Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Mode Switcher (Cards / Table) */}
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs font-medium w-fit">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-semibold">
                <LayoutGrid size={14} />
                <span>Cards</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[var(--color-text-muted)]">
                <List size={14} />
                <span>Table</span>
              </div>
            </div>

            {/* Client Filter & Search Bar */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="h-9 w-36 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer hidden md:block" />
              <div className="h-9 w-full sm:max-w-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["Active", "On Hold", "Completed", "Cancelled", "All"].map((tab, idx) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border ${
                  idx === 0
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border-[var(--color-brand)]/30"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        {/* Project Cards Grid Skeleton — 3 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-xs animate-shimmer"
            >
              {/* Project Card Header: Icon + Title + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-border)] shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
                    <div className="h-3 w-20 rounded bg-[var(--color-border-subtle)]" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-full bg-[var(--color-border)] shrink-0" />
              </div>

              {/* Timeline Progress Bar Skeleton */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="h-3 w-20 rounded bg-[var(--color-border-subtle)]" />
                  <div className="h-3 w-8 rounded bg-[var(--color-border-subtle)]" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border)]" />
              </div>

              {/* Card Footer: Budget + Action */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
                <div className="h-6 w-16 rounded-md bg-[var(--color-border-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
