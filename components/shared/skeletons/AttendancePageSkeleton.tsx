"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import { Clock, Calendar } from "lucide-react";

export default function AttendancePageSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <PageHeaderSkeleton hasAction={true} actionCount={1} />

      <div className="flex-1 px-4 py-4 md:py-6 md:px-8 space-y-4 md:space-y-6 max-w-lg mx-auto w-full">
        {/* Tab Toggle (Today / This Month) */}
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] select-none"
          role="tablist"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-[var(--color-brand)] text-white shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-[var(--color-text-muted)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Month</span>
          </div>
        </div>

        {/* Attendance Check-In Panel Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs space-y-5">
          {/* Header Info: Date & Live Time */}
          <div className="text-center space-y-2 py-2">
            <div className="h-4 w-40 rounded bg-[var(--color-border)] mx-auto animate-shimmer" />
            <div className="h-8 w-32 rounded-lg bg-[var(--color-border)] mx-auto animate-shimmer" />
            {/* Geofence / location status badge */}
            <div className="h-5 w-44 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] mx-auto animate-shimmer" />
          </div>

          {/* Large Punch In / Out Button Skeleton */}
          <div className="h-14 w-full rounded-xl bg-[var(--color-border)] animate-shimmer shadow-xs" />

          {/* Today's Log Card Skeleton */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-[var(--color-border)] animate-shimmer" />
              <div className="h-4 w-16 rounded-full bg-[var(--color-border)] animate-shimmer" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="space-y-1">
                <div className="h-2.5 w-14 rounded bg-[var(--color-border-subtle)]" />
                <div className="h-4 w-20 rounded bg-[var(--color-border)] animate-shimmer" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-14 rounded bg-[var(--color-border-subtle)]" />
                <div className="h-4 w-20 rounded bg-[var(--color-border)] animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
