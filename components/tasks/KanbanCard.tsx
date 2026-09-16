"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle } from "lucide-react";
import type { Task } from "./TaskListView";
import type { TaskFormData } from "./TaskForm";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-400",
  high:   "bg-amber-400",
  medium: "bg-sky-400",
  low:    "bg-[var(--color-text-muted)]",
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function KanbanCard({ task, onEdit }: KanbanCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
  };

  const overdue = isOverdue(task.due_date);

  function handleClick(e: React.MouseEvent): void {
    // Only trigger edit if not dragging
    if (!isDragging && !(e.target as HTMLElement).closest("[data-drag-handle]")) {
      onEdit(task);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 space-y-2.5 shadow-xs cursor-pointer hover:border-[var(--color-brand)]/50 hover:shadow-sm transition-all"
    >
      {/* Drag handle (transparent overlay for drag, click for edit) */}
      <div
        data-drag-handle
        {...attributes}
        {...listeners}
        className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
        aria-label="Drag task"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Priority dot + Title */}
      <div className="relative flex items-start gap-2 pointer-events-none">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.low}`} />
        <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {task.title}
        </p>
      </div>

      {/* Footer: assignee + due date */}
      <div className="relative flex items-center justify-between gap-2 pointer-events-none">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            task.assignee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name ?? ""}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center text-[9px] font-bold shrink-0">
                {task.assignee.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )
          ) : (
            <div className="w-5 h-5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] shrink-0" />
          )}
          <span className="text-[11px] text-[var(--color-text-muted)] truncate">
            {task.assignee?.full_name ?? "Unassigned"}
          </span>
        </div>

        {/* Due date */}
        {task.due_date && (
          <span
            className={`flex items-center gap-1 text-[11px] shrink-0 ${
              overdue ? "text-red-400 font-medium" : "text-[var(--color-text-muted)]"
            }`}
          >
            {overdue && <AlertCircle size={11} className="shrink-0" />}
            {new Date(task.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Drag Overlay clone ─────────────────────────────────────────

export function KanbanCardOverlay({ task }: { task: Task | null }): React.JSX.Element | null {
  if (!task) return null;

  const overdue = isOverdue(task.due_date);

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-brand)]/40 rounded-lg p-3 space-y-2.5 shadow-2xl w-[260px]"
      style={{ transform: "scale(1.03)", cursor: "grabbing" }}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.low}`} />
        <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {task.title}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.assignee?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.assignee.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/30" />
          )}
          <span className="text-[11px] text-[var(--color-text-muted)] truncate">
            {task.assignee?.full_name ?? "Unassigned"}
          </span>
        </div>
        {task.due_date && (
          <span className={`text-[11px] shrink-0 ${overdue ? "text-red-400" : "text-[var(--color-text-muted)]"}`}>
            {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

// Export TaskFormData for re-use
export type { TaskFormData };
