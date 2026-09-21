"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import SkeletonTable from "../SkeletonTable";

export default function AttendanceSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header Skeleton */}
      <PageHeaderSkeleton hasAction={true} actionCount={1} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Punch In / Check In Hero Card Skeleton */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-shimmer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-border)] shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-36 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-48 rounded bg-[var(--color-border-subtle)]" />
            </div>
          </div>
          <div className="h-12 w-36 sm:w-44 rounded-xl bg-[var(--color-border)] shrink-0" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2 shadow-xs animate-shimmer"
            >
              <div className="h-3 w-16 rounded bg-[var(--color-border-subtle)]" />
              <div className="h-6 w-12 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>

        {/* Attendance Log Table Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-32 rounded bg-[var(--color-border)] animate-shimmer" />
          <SkeletonTable rows={5} cols={5} />
        </div>
      </div>
    </div>
  );
}
