"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import UserMultiSelect from "@/components/shared/UserMultiSelect";
import DatePicker from "@/components/shared/DatePicker";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────

export interface TaskStatus {
  id: string;
  name: string;
  color: string | null;
}

export interface TaskFormData {
  id?: string;
  title: string;
  description: string | null;
  statusId?: string | null;
  status_id?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId?: string | null;
  assignee_id?: string | null;
  assigneeIds?: string[];
  dueDate?: string | null;
  due_date?: string | null;
  projectId?: string;
  project_id?: string;
  created_at?: string;
  created_by?: string | null;
  status?: { id: string; name: string; color: string | null } | null;
  assignee?: { id: string; full_name: string | null; avatar_url: string | null; employee_id?: string | null } | null;
  assignees?: { id: string; full_name: string | null; avatar_url: string | null; employee_id?: string | null }[];
  project?: { id: string; name: string } | null;
}

// ── Schema ────────────────────────────────────────────────────

const taskFormSchema = z.object({
  projectId: z.string().uuid("Invalid project ID").optional(),
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeIds: z.array(z.string().uuid()),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional()
    .nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// ── Props ─────────────────────────────────────────────────────

interface TaskFormProps {
  projectId: string;
  statuses: TaskStatus[];
  defaultValues?: Partial<TaskFormData>;
  onSuccess: (task: TaskFormData) => void;
  onCancel: () => void;
  onDelete?: (taskId: string) => Promise<void> | void;
  mode?: "create" | "edit";
  taskId?: string;
  canDelete?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

// ── Component ─────────────────────────────────────────────────

export default function TaskForm({
  projectId,
  statuses,
  defaultValues,
  onSuccess,
  onCancel,
  onDelete,
  mode = "create",
  taskId,
  canDelete = true,
}: TaskFormProps): React.JSX.Element {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialAssignees =
    defaultValues?.assigneeIds && defaultValues.assigneeIds.length > 0
      ? defaultValues.assigneeIds
      : defaultValues?.assigneeId
      ? [defaultValues.assigneeId]
      : [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: defaultValues?.projectId ?? projectId,
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      statusId: defaultValues?.statusId ?? (statuses[0]?.id ?? null),
      priority: defaultValues?.priority ?? "medium",
      assigneeIds: initialAssignees,
      dueDate: defaultValues?.dueDate ?? null,
    },
  });

  // Reset form when defaultValues change (edit mode)
  useEffect(() => {
    if (defaultValues) {
      const assignees =
        defaultValues.assigneeIds && defaultValues.assigneeIds.length > 0
          ? defaultValues.assigneeIds
          : defaultValues.assigneeId
          ? [defaultValues.assigneeId]
          : [];

      reset({
        projectId: defaultValues.projectId ?? projectId,
        title: defaultValues.title ?? "",
        description: defaultValues.description ?? "",
        statusId: defaultValues.statusId ?? (statuses[0]?.id ?? null),
        priority: defaultValues.priority ?? "medium",
        assigneeIds: assignees,
        dueDate: defaultValues.dueDate ?? null,
      });
    }
  }, [defaultValues, reset, statuses, projectId]);

  async function onSubmit(values: TaskFormValues): Promise<void> {
    const url = mode === "edit" && taskId ? `/api/tasks/${taskId}` : "/api/tasks";
    const method = mode === "edit" ? "PUT" : "POST";

    const body = {
      projectId: values.projectId || projectId,
      title: values.title,
      description: values.description || null,
      statusId: values.statusId || null,
      priority: values.priority,
      assigneeIds: values.assigneeIds || [],
      assigneeId: values.assigneeIds?.[0] || null,
      dueDate: values.dueDate || null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { data?: TaskFormData; error?: string };

      if (!res.ok || json.error) {
        setError("root", { message: json.error ?? "Something went wrong" });
        return;
      }

      if (json.data) {
        onSuccess(json.data);
      }
    } catch {
      setError("root", { message: "Network error. Please try again." });
    }
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!taskId) return;
    setIsDeleting(true);

    try {
      if (onDelete) {
        await onDelete(taskId);
      } else {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          setError("root", { message: json.error ?? "Failed to delete task" });
          setIsDeleteOpen(false);
          return;
        }
      }
      setIsDeleteOpen(false);
      onCancel();
    } catch {
      setError("root", { message: "Network error during deletion." });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Root error */}
        {errors.root && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* Title */}
        <FormField label="Title" required error={errors.title?.message}>
          <input
            {...register("title")}
            type="text"
            placeholder="Task title..."
            className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </FormField>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status" error={errors.statusId?.message}>
            <Controller
              control={control}
              name="statusId"
              render={({ field }) => (
                <select
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                >
                  <option value="">No status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </FormField>

          <FormField label="Priority" error={errors.priority?.message}>
            <select
              {...register("priority")}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Multi-Assignees */}
        <FormField label="Assignees" error={errors.assigneeIds?.message}>
          <Controller
            control={control}
            name="assigneeIds"
            render={({ field }) => (
              <UserMultiSelect
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="Assign team members..."
              />
            )}
          />
        </FormField>

        {/* Due Date */}
        <FormField label="Due Date" error={errors.dueDate?.message}>
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Add a description or checklist..."
            className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
          />
        </FormField>

        {/* Actions & Danger Zone */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          {mode === "edit" && taskId && canDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs"
            >
              <Trash2 size={13} className="mr-1" />
              Delete Task
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
            <LoadingButton isLoading={isSubmitting} type="submit">
              {mode === "edit" ? "Save changes" : "Create task"}
            </LoadingButton>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Task?"
        description="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmLabel="Delete Task"
        variant="destructive"
      />
    </>
  );
}
