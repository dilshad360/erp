"use client";

import React from "react";

type PageHeaderSkeletonProps = {
  hasAction?: boolean;
  actionCount?: number;
  className?: string;
};

export default function PageHeaderSkeleton({
  hasAction = true,
  actionCount = 1,
  className = "",
}: PageHeaderSkeletonProps): React.JSX.Element {
  return (
    <div
      className={`border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-6 lg:px-8 select-none ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
        <div className="space-y-2">
          {/* Page Title skeleton */}
          <div className="h-6 w-36 sm:w-48 rounded-lg bg-[var(--color-border)] animate-shimmer" />
          {/* Page Subtitle / description skeleton */}
          <div className="h-3.5 w-56 sm:w-72 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
        </div>

        {/* Action Button(s) skeleton */}
        {hasAction && (
          <div className="flex items-center gap-2">
            {Array.from({ length: actionCount }).map((_, idx) => (
              <div
                key={idx}
                className="h-9 w-28 rounded-lg bg-[var(--color-border)] animate-shimmer"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
