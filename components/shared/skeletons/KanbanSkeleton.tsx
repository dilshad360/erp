"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";

export default function KanbanSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header Skeleton */}
      <PageHeaderSkeleton hasAction={true} actionCount={1} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Controls: Search, View Switcher, Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="h-10 w-full sm:max-w-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="h-9 w-28 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
            <div className="h-9 w-20 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          </div>
        </div>

        {/* Kanban Board Columns Skeleton — 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {["To Do", "In Progress", "In Review", "Done"].map((colTitle, cIdx) => (
            <div
              key={cIdx}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3.5 space-y-3 shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border)] animate-shimmer" />
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {colTitle}
                  </span>
                </div>
                <div className="h-4 w-6 rounded-full bg-[var(--color-border-subtle)] animate-shimmer" />
              </div>

              {/* Task Cards Skeleton */}
              <div className="space-y-2.5">
                {Array.from({ length: cIdx === 0 ? 3 : cIdx === 1 ? 2 : 1 }).map((_, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] space-y-2.5 shadow-xs animate-shimmer"
                  >
                    <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-3 w-16 rounded bg-[var(--color-border-subtle)]" />
                      <div className="w-5 h-5 rounded-full bg-[var(--color-border)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
