"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AssigneeInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  employee_id?: string | null;
}

interface AssigneeAvatarGroupProps {
  assignees?: AssigneeInfo[] | null;
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
  showNameIfSingle?: boolean;
}

const SIZE_MAP = {
  xs: {
    avatar: "w-5 h-5 text-[9px]",
    badge: "w-5 h-5 text-[9px]",
    spacing: "-space-x-1.5",
  },
  sm: {
    avatar: "w-6 h-6 text-[10px]",
    badge: "w-6 h-6 text-[10px]",
    spacing: "-space-x-2",
  },
  md: {
    avatar: "w-7 h-7 text-xs",
    badge: "w-7 h-7 text-xs",
    spacing: "-space-x-2.5",
  },
};

export default function AssigneeAvatarGroup({
  assignees = [],
  max = 3,
  size = "xs",
  className,
  showNameIfSingle = true,
}: AssigneeAvatarGroupProps): React.JSX.Element {
  const safeAssignees = (assignees ?? []).filter(Boolean);

  if (safeAssignees.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
        <div
          className={cn(
            "rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] shrink-0",
            SIZE_MAP[size].avatar
          )}
        />
        {showNameIfSingle && (
          <span className="text-[11px] text-[var(--color-text-muted)] truncate">
            Unassigned
          </span>
        )}
      </div>
    );
  }

  const visible = safeAssignees.slice(0, max);
  const remainingCount = safeAssignees.length - max;
  const isSingle = safeAssignees.length === 1;

  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
      <div className={cn("flex items-center shrink-0", SIZE_MAP[size].spacing)}>
        {visible.map((assignee, idx) => (
          <div
            key={assignee.id || idx}
            title={assignee.full_name ?? "Assignee"}
            className={cn(
              "relative rounded-full ring-2 ring-[var(--color-surface)] overflow-hidden shrink-0",
              SIZE_MAP[size].avatar
            )}
            style={{ zIndex: visible.length - idx }}
          >
            {assignee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assignee.avatar_url}
                alt={assignee.full_name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center font-bold">
                {assignee.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            title={`${remainingCount} more assignees`}
            className={cn(
              "relative rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold flex items-center justify-center ring-2 ring-[var(--color-surface)] shrink-0",
              SIZE_MAP[size].badge
            )}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {showNameIfSingle && isSingle && (
        <span className="text-[11px] text-[var(--color-text-secondary)] truncate max-w-[120px]">
          {safeAssignees[0]?.full_name ?? "Unnamed"}
        </span>
      )}
      {showNameIfSingle && !isSingle && (
        <span className="text-[11px] text-[var(--color-text-muted)] truncate">
          {safeAssignees.length} assigned
        </span>
      )}
    </div>
  );
}
