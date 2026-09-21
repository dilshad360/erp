"use client";

import React from "react";
import PageHeaderSkeleton from "./PageHeaderSkeleton";
import { CheckSquare2, Clock, AlertTriangle, Minus, UserCheck, Users, FolderKanban } from "lucide-react";

export default function TaskPageSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top Header Skeleton */}
      <PageHeaderSkeleton hasAction={true} actionCount={1} />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 md:px-8 space-y-5">
        {/* Top Control Bar: View Mode Switcher + Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Mode Toggle (My Tasks vs All Tasks) */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 text-xs font-medium w-fit">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-semibold">
              <UserCheck size={14} />
              <span>My Tasks</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[var(--color-text-muted)]">
              <Users size={14} />
              <span>All Tasks</span>
            </div>
          </div>

          {/* Search bar skeleton */}
          <div className="h-9 w-full md:max-w-md rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
        </div>

        {/* Secondary Filters Bar (Date filters + Dropdowns) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg w-fit flex-wrap">
            {[
              { label: "All", icon: <CheckSquare2 size={13} /> },
              { label: "Due Today", icon: <Clock size={13} /> },
              { label: "Overdue", icon: <AlertTriangle size={13} /> },
              { label: "No Due Date", icon: <Minus size={13} /> },
            ].map((tab, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
                  idx === 0
                    ? "bg-[var(--color-brand)] text-white"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-8 w-28 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
            <div className="h-8 w-24 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
            <div className="h-8 w-24 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-shimmer" />
          </div>
        </div>

        {/* Grouped Projects & Tasks Skeleton */}
        <div className="space-y-6 pt-2">
          {Array.from({ length: 2 }).map((_, pIdx) => (
            <div
              key={pIdx}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs"
            >
              {/* Project Section Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center">
                    <FolderKanban size={14} />
                  </div>
                  <div className="h-4 w-36 rounded bg-[var(--color-border)] animate-shimmer" />
                  <div className="h-4 w-12 rounded-full bg-[var(--color-border-subtle)] animate-shimmer" />
                </div>
                <div className="h-3 w-16 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
              </div>

              {/* Task Rows List */}
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {Array.from({ length: pIdx === 0 ? 3 : 2 }).map((_, tIdx) => (
                  <div
                    key={tIdx}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-surface-raised)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox circle placeholder */}
                      <div className="w-4 h-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] shrink-0" />
                      {/* Priority dot placeholder */}
                      <div className="w-2 h-2 rounded-full bg-[var(--color-border)] shrink-0" />
                      {/* Task title */}
                      <div
                        className={`h-3.5 rounded bg-[var(--color-border)] animate-shimmer ${
                          tIdx === 0 ? "w-48 sm:w-64" : "w-36 sm:w-52"
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Assignee Avatar Group placeholder */}
                      <div className="flex -space-x-1.5 items-center">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-border)] border border-[var(--color-surface)] animate-shimmer" />
                        <div className="w-6 h-6 rounded-full bg-[var(--color-border-subtle)] border border-[var(--color-surface)] animate-shimmer" />
                      </div>
                      {/* Due date badge */}
                      <div className="h-5 w-16 rounded bg-[var(--color-border-subtle)] animate-shimmer hidden sm:block" />
                      {/* Status badge */}
                      <div className="h-5 w-20 rounded-full bg-[var(--color-border)] animate-shimmer" />
                      {/* Action menu icon */}
                      <div className="w-6 h-6 rounded bg-[var(--color-border-subtle)] animate-shimmer" />
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
