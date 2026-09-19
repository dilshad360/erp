"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import TaskForm, { type TaskFormData, type TaskStatus } from "./TaskForm";

interface TaskSheetProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  statuses: TaskStatus[];
  mode?: "create" | "edit";
  taskId?: string;
  defaultValues?: Partial<TaskFormData>;
  defaultStatusId?: string | null;
  onSuccess: (task: TaskFormData) => void;
  onDelete?: (taskId: string) => Promise<void> | void;
  title?: string;
  canDelete?: boolean;
}

export default function TaskSheet({
  open,
  onClose,
  projectId,
  statuses,
  mode = "create",
  taskId,
  defaultValues,
  defaultStatusId,
  onSuccess,
  onDelete,
  title,
  canDelete = true,
}: TaskSheetProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const mergedDefaults: Partial<TaskFormData> = {
    ...defaultValues,
    statusId: defaultValues?.statusId ?? defaultStatusId ?? null,
  };

  const sheetTitle = title ?? (mode === "edit" ? "Edit Task" : "Create New Task");

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel: Bottom sheet on mobile (max-h-[92vh]), side sheet on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sheetTitle}
        className="relative z-[80] bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl flex flex-col transition-transform w-full
          inset-x-0 bottom-0 self-end rounded-t-2xl border-t max-h-[92vh]
          md:self-stretch md:max-w-md md:rounded-none md:border-l md:max-h-full
          animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mt-2.5 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {sheetTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 overscroll-y-contain">
          <TaskForm
            projectId={projectId}
            statuses={statuses}
            mode={mode}
            taskId={taskId}
            canDelete={canDelete}
            defaultValues={mergedDefaults}
            onSuccess={(task) => {
              onSuccess(task);
              onClose();
            }}
            onDelete={async (id) => {
              if (onDelete) {
                await onDelete(id);
              }
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
