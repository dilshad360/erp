"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, MoreVertical, Trash2, Edit2 } from "lucide-react";
import AssigneeAvatarGroup, { type AssigneeInfo } from "@/components/shared/AssigneeAvatarGroup";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
  onDelete?: (taskId: string) => Promise<void> | void;
}

export default function KanbanCard({ task, onEdit, onDelete }: KanbanCardProps): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!isDragging && !(e.target as HTMLElement).closest("[data-no-drag]")) {
      onEdit(task);
    }
  }

  async function handleDeleteConfirm(): Promise<void> {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(task.id);
      } else {
        await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      }
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  const assigneesList: AssigneeInfo[] = task.assignees && task.assignees.length > 0
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : [];

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleClick}
        className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 space-y-2.5 shadow-xs cursor-pointer hover:border-[var(--color-brand)]/50 hover:shadow-sm transition-all"
      >
        {/* Drag handle (transparent background overlay) */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
          aria-label="Drag task"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Priority dot + Title + Quick Actions */}
        <div className="relative flex items-start justify-between gap-2 z-10">
          <div className="flex items-start gap-2 min-w-0 pointer-events-none">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.low
              }`}
            />
            <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
              {task.title}
            </p>
          </div>

          <div className="relative shrink-0" data-no-drag>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Task options"
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div
                  className="absolute right-0 top-6 z-30 w-32 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-xl py-1 text-xs divide-y divide-[var(--color-border-subtle)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(task);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] text-left"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] text-left"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer: Multi-Assignee Avatar Stack + Due Date */}
        <div className="relative flex items-center justify-between gap-2 pointer-events-none z-10 pt-0.5">
          {/* Stacked Avatars */}
          <AssigneeAvatarGroup assignees={assigneesList} size="xs" max={3} showNameIfSingle={true} />

          {/* Due date */}
          {task.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] shrink-0 font-medium ${
                overdue ? "text-red-400" : "text-[var(--color-text-muted)]"
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Task?"
        description={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete Task"
        variant="destructive"
      />
    </>
  );
}

// ── Drag Overlay clone ─────────────────────────────────────────

export function KanbanCardOverlay({ task }: { task: Task | null }): React.JSX.Element | null {
  if (!task) return null;

  const overdue = isOverdue(task.due_date);
  const assigneesList: AssigneeInfo[] = task.assignees && task.assignees.length > 0
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : [];

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-brand)]/40 rounded-lg p-3 space-y-2.5 shadow-2xl w-[260px]"
      style={{ transform: "scale(1.03)", cursor: "grabbing" }}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
            PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.low
          }`}
        />
        <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
          {task.title}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <AssigneeAvatarGroup assignees={assigneesList} size="xs" max={3} showNameIfSingle={true} />
        {task.due_date && (
          <span
            className={`text-[11px] shrink-0 ${
              overdue ? "text-red-400" : "text-[var(--color-text-muted)]"
            }`}
          >
            {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

// Export TaskFormData for re-use
export type { TaskFormData };
