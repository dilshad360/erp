"use client";

import React from "react";

type SkeletonTableProps = {
  rows?: number;
  cols?: number;
};

export default function SkeletonTable({
  rows = 5,
  cols = 5,
}: SkeletonTableProps): React.JSX.Element {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {/* Desktop Table View Skeleton */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
          <div className="grid grid-cols-12 gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={i}
                className={`h-4 rounded bg-[var(--color-border)] ${
                  i === 0 ? "col-span-3" : "col-span-2"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div key={rIdx} className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <div
                  key={cIdx}
                  className={`h-4 rounded bg-[var(--color-border)] ${
                    cIdx === 0 ? "col-span-3" : "col-span-2"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card View Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--color-border)] shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
                <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
