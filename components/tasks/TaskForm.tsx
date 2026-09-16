"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import UserSelect from "@/components/shared/UserSelect";
import DatePicker from "@/components/shared/DatePicker";
import { AlertCircle } from "lucide-react";

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
  statusId: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  dueDate: string | null;
  projectId: string;
}

// ── Schema ────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional()
    .nullable(),
});

type TaskSchema = z.infer<typeof taskSchema>;

// ── Props ─────────────────────────────────────────────────────

interface TaskFormProps {
  projectId: string;
  statuses: TaskStatus[];
  defaultValues?: Partial<TaskFormData>;
  onSuccess: (task: TaskFormData) => void;
  onCancel: () => void;
  mode?: "create" | "edit";
  taskId?: string;
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
  mode = "create",
  taskId,
}: TaskFormProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      statusId: defaultValues?.statusId ?? (statuses[0]?.id ?? null),
      priority: defaultValues?.priority ?? "medium",
      assigneeId: defaultValues?.assigneeId ?? null,
      dueDate: defaultValues?.dueDate ?? null,
    },
  });

  // Reset form when defaultValues change (edit mode)
  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title ?? "",
        description: defaultValues.description ?? "",
        statusId: defaultValues.statusId ?? (statuses[0]?.id ?? null),
        priority: defaultValues.priority ?? "medium",
        assigneeId: defaultValues.assigneeId ?? null,
        dueDate: defaultValues.dueDate ?? null,
      });
    }
  }, [defaultValues, reset, statuses]);

  async function onSubmit(values: TaskSchema): Promise<void> {
    const url = mode === "edit" && taskId
      ? `/api/tasks/${taskId}`
      : "/api/tasks";
    const method = mode === "edit" ? "PUT" : "POST";

    const body = {
      projectId,
      title: values.title,
      description: values.description || null,
      statusId: values.statusId || null,
      priority: values.priority,
      assigneeId: values.assigneeId || null,
      dueDate: values.dueDate || null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json() as { data?: TaskFormData; error?: string };

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

  return (
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
                  <option key={s.id} value={s.id}>{s.name}</option>
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
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Assignee */}
      <FormField label="Assignee" error={errors.assigneeId?.message}>
        <Controller
          control={control}
          name="assigneeId"
          render={({ field }) => (
            <UserSelect
              value={field.value}
              onChange={field.onChange}
              placeholder="Unassigned"
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
          placeholder="Add a description..."
          className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
        />
      </FormField>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
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
    </form>
  );
}
