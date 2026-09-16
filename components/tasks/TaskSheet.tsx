"use client";

import React from "react";
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
  title?: string;
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
  title,
}: TaskSheetProps): React.JSX.Element | null {
  if (!open) return null;

  const mergedDefaults: Partial<TaskFormData> = {
    ...defaultValues,
    statusId: defaultValues?.statusId ?? defaultStatusId ?? null,
  };

  const sheetTitle = title ?? (mode === "edit" ? "Edit Task" : "New Task");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sheetTitle}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {sheetTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <TaskForm
            projectId={projectId}
            statuses={statuses}
            mode={mode}
            taskId={taskId}
            defaultValues={mergedDefaults}
            onSuccess={(task) => {
              onSuccess(task);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  );
}
