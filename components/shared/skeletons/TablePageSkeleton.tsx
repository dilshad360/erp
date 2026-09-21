"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import SkeletonTable from "../SkeletonTable";

type TablePageSkeletonProps = {
  hasAction?: boolean;
  hasTabs?: boolean;
  tabCount?: number;
  rowCount?: number;
  colCount?: number;
  searchPlaceholder?: string;
  className?: string;
};

export default function TablePageSkeleton({
  hasAction = true,
  hasTabs = false,
  tabCount = 2,
  rowCount = 6,
  colCount = 5,
  className = "",
}: TablePageSkeletonProps): React.JSX.Element {
  return (
    <div className={`flex flex-col min-h-full ${className}`}>
      {/* Top Page Header Skeleton */}
      <PageHeaderSkeleton hasAction={hasAction} actionCount={1} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Optional Tabs Bar Skeleton (e.g. Employees Active / Pending) */}
        {hasTabs && (
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            {Array.from({ length: tabCount }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 sm:w-32 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] animate-shimmer"
              />
            ))}
          </div>
        )}

        {/* Search Bar & Filter Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="h-10 w-full sm:max-w-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="h-9 w-24 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          </div>
        </div>

        {/* Table & Mobile Cards Skeleton */}
        <SkeletonTable rows={rowCount} cols={colCount} />
      </div>
    </div>
  );
}
