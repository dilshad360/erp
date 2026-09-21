"use client";

import React from "react";

type SkeletonTableProps = {
  rows?: number;
  cols?: number;
  className?: string;
};

export default function SkeletonTable({
  rows = 5,
  cols = 5,
  className = "",
}: SkeletonTableProps): React.JSX.Element {
  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Desktop Table View Skeleton */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        {/* Table Header Row */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3.5">
          <div className="grid grid-cols-12 gap-4 items-center">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={i}
                className={`h-4 rounded bg-[var(--color-border)] animate-shimmer ${
                  i === 0 ? "col-span-4" : i === cols - 1 ? "col-span-2" : "col-span-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center">
              {/* First column: avatar + text */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--color-border)] shrink-0 animate-shimmer" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3.5 w-3/4 rounded bg-[var(--color-border)] animate-shimmer" />
                  <div className="h-2.5 w-1/2 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
                </div>
              </div>

              {/* Remaining columns: badges / text */}
              {Array.from({ length: Math.max(1, cols - 2) }).map((_, cIdx) => (
                <div key={cIdx} className="col-span-2">
                  <div
                    className={`h-3 rounded bg-[var(--color-border)] animate-shimmer ${
                      cIdx % 2 === 0 ? "w-20" : "w-16"
                    }`}
                  />
                </div>
              ))}

              {/* Action column */}
              <div className="col-span-2 flex justify-end">
                <div className="h-7 w-14 rounded-md bg-[var(--color-border-subtle)] animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card View Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[var(--color-border)] shrink-0 animate-shimmer" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-3.5 w-32 rounded bg-[var(--color-border)] animate-shimmer" />
                <div className="h-2.5 w-20 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="h-3 w-24 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
              <div className="h-3 w-16 rounded bg-[var(--color-border-subtle)] animate-shimmer ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
