"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import SkeletonTable from "../SkeletonTable";

export default function AdminAttendanceSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header */}
      <PageHeaderSkeleton hasAction={false} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {/* Controls: Date Picker, Department Filter, Export Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-9 w-40 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
            <div className="h-9 w-36 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          </div>
          <div className="h-9 w-28 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer self-start sm:self-auto" />
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2 shadow-xs animate-shimmer"
            >
              <div className="h-3 w-20 rounded bg-[var(--color-border-subtle)]" />
              <div className="h-6 w-12 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>

        {/* Employee Attendance Table */}
        <SkeletonTable rows={6} cols={6} />
      </div>
    </div>
  );
}
