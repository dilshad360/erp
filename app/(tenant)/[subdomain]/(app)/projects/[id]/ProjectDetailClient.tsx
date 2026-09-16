"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderKanban,
  Calendar,
  IndianRupee,
  Edit2,
  Archive,
  CheckCircle2,
  Clock,
  CheckSquare,
  Users,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ClientSelect, { type ClientOption } from "@/components/shared/ClientSelect";
import { Button } from "@/components/ui/button";
import { formatINR, calculateTimelineProgress } from "@/lib/format";

const editProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(150),
    clientId: z.string().min(1, "Please select a client"),
    description: z.string().trim().max(2000).optional(),
    status: z.enum(["active", "on_hold", "completed", "cancelled"]),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    budget: z.string().optional().or(z.literal("")),
  })

  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.startDate !== "" && data.endDate !== "") {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    }
  );

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export interface ProjectDetailData {
  id: string;
  company_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: "active" | "on_hold" | "completed" | "cancelled";
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_by?: string | null;
  created_at: string;
  client?: {
    id: string;
    name: string;
    contact_person?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  creator?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface ProjectDetailProps {
  initialProject: ProjectDetailData;
  clients: ClientOption[];
  currentUserRole: string;
}

export default function ProjectDetailClient({
  initialProject,
  clients,
  currentUserRole,
}: ProjectDetailProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<ProjectDetailData>(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const canManage = currentUserRole === "admin" || currentUserRole === "manager";

  // Check URL query param ?edit=true
  useEffect(() => {
    if (searchParams.get("edit") === "true" && canManage) {
      setIsEditing(true);
    }
  }, [searchParams, canManage]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      clientId: project.client_id,
      description: project.description || "",
      status: project.status,
      startDate: project.start_date || "",
      endDate: project.end_date || "",
      budget: project.budget !== null && project.budget !== undefined ? String(project.budget) : "",
    },
  });

  async function handleUpdate(data: EditProjectFormData): Promise<void> {
    setServerError(null);

    const payload = {
      name: data.name,
      clientId: data.clientId,
      description: data.description || null,
      status: data.status,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      budget: data.budget && !isNaN(Number(data.budget)) ? Number(data.budget) : null,
    };

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Failed to update project.");
        return;
      }

      // Update client name in local state if clientId changed
      const selectedClient = clients.find((c) => c.id === data.clientId);
      setProject({
        ...json.data,
        client: selectedClient ? { id: selectedClient.id, name: selectedClient.name } : project.client,
      });
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("An unexpected network error occurred.");
    }
  }

  async function handleArchive(): Promise<void> {
    setIsArchiveLoading(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to archive project" }));
        alert(err.error || "Failed to archive project");
        return;
      }

      setProject((prev) => ({ ...prev, status: "cancelled" }));
      setIsArchiveOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsArchiveLoading(false);
    }
  }

  function handleCancelEdit(): void {
    reset({
      name: project.name,
      clientId: project.client_id,
      description: project.description || "",
      status: project.status,
      startDate: project.start_date || "",
      endDate: project.end_date || "",
      budget: project.budget !== null && project.budget !== undefined ? String(project.budget) : "",
    });
    setServerError(null);
    setIsEditing(false);
  }

  const timeline = calculateTimelineProgress(project.start_date, project.end_date);

  function getStatusBadge(status: ProjectDetailData["status"]): React.JSX.Element {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/20">
            Active
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            On Hold
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
            Cancelled
          </span>
        );
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={project.name}
        description={project.client ? `Client: ${project.client.name}` : "Project overview, timeline, budget, and task deliverables."}
        backHref="/projects"
        backLabel="Back to projects"
        actions={
          canManage && !isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
              >
                <Edit2 size={14} className="mr-1.5" />
                Edit Project
              </Button>
              {project.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsArchiveOpen(true)}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                >
                  <Archive size={14} className="mr-1.5" />
                  Archive
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {serverError && (
          <div
            className="p-4 rounded-lg bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm flex items-start gap-3"
            role="alert"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Quick Status & Client Card */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center font-bold text-sm shrink-0">
              <FolderKanban size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">{project.name}</span>
                {getStatusBadge(project.status)}
              </div>
              {project.client && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Client: <Link href={`/clients/${project.client.id}`} className="text-[var(--color-brand)] hover:underline font-medium">{project.client.name}</Link>
                </p>
              )}
            </div>
          </div>
        </div>

      {/* Main View OR Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border-subtle)]">
              Edit Project Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FormField
                  label="Client"
                  required
                  error={errors.clientId?.message}
                >
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <ClientSelect
                        value={field.value}
                        onChange={field.onChange}
                        clients={clients}
                      />
                    )}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Project Name"
                  htmlFor="edit-name"
                  required
                  error={errors.name?.message}
                >
                  <input
                    id="edit-name"
                    type="text"
                    {...register("name")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="Status"
                  htmlFor="edit-status"
                  error={errors.status?.message}
                >
                  <select
                    id="edit-status"
                    {...register("status")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </FormField>
              </div>

              <div>
                <FormField
                  label="Estimated Budget (₹)"
                  htmlFor="edit-budget"
                  error={errors.budget?.message}
                >
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      id="edit-budget"
                      type="number"
                      min="0"
                      step="1000"
                      {...register("budget")}
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                    />
                  </div>
                </FormField>
              </div>

              <div>
                <FormField
                  label="Start Date"
                  htmlFor="edit-start"
                  error={errors.startDate?.message}
                >
                  <input
                    id="edit-start"
                    type="date"
                    {...register("startDate")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="End Date"
                  htmlFor="edit-end"
                  error={errors.endDate?.message}
                >
                  <input
                    id="edit-end"
                    type="date"
                    {...register("endDate")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Project Scope / Description"
                  htmlFor="edit-desc"
                  error={errors.description?.message}
                >
                  <textarea
                    id="edit-desc"
                    rows={4}
                    {...register("description")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Saving..."
                className="bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
              >
                Save Changes
              </LoadingButton>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Overview Section: Timeline & Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline Progress Card */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[var(--color-brand)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Timeline & Schedule
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {timeline.percentage}%
                </span>
              </div>

              <div className="space-y-3">
                <div className="w-full bg-[var(--color-surface-raised)] h-2.5 rounded-full overflow-hidden border border-[var(--color-border)]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      timeline.isOverdue
                        ? "bg-[var(--color-danger)]"
                        : "bg-[var(--color-brand)]"
                    }`}
                    style={{ width: `${timeline.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1">
                  <div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Start</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {project.start_date || "Not set"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Target End</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {project.end_date || "Not set"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[var(--color-text-muted)] pt-1">
                  Status: <span className="font-medium text-[var(--color-text-primary)]">{timeline.label}</span>
                </div>
              </div>
            </div>

            {/* Budget & Commercials Card */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                <IndianRupee size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Commercials & Budget
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-1">
                    Estimated Project Budget
                  </span>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                    {formatINR(project.budget)}
                  </div>
                </div>

                <div className="text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-subtle)]">
                  <span>Created: </span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {new Date(project.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {project.creator?.full_name && (
                    <span> by {project.creator.full_name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] pb-2 border-b border-[var(--color-border-subtle)]">
              Project Description & Scope
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          {/* Tasks Summary Placeholder (Wired up in Phase 6) */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Tasks Overview
                </h3>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                Phase 6 Integration
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <div className="text-lg font-bold text-[var(--color-text-primary)]">0</div>
                <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1 mt-1">
                  <Clock size={12} />
                  <span>To Do</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <div className="text-lg font-bold text-[var(--color-brand)]">0</div>
                <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1 mt-1">
                  <Clock size={12} />
                  <span>In Progress</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <div className="text-lg font-bold text-[var(--color-success)]">0</div>
                <div className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 size={12} />
                  <span>Completed</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] text-center pt-1">
              Task assignment, Kanban boards, and status tracking will be active upon completing Phase 6.
            </p>
          </div>

          {/* Team Members Placeholder (Derived from Tasks in Phase 6) */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Project Team
                </h3>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">Derived</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Team members are dynamically populated from team members assigned to active tasks within this project.
            </p>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        isLoading={isArchiveLoading}
        title={`Archive ${project.name}?`}
        description="Archiving this project will set its status to 'cancelled'. You can still view it under the 'All' projects list."
        confirmLabel="Archive Project"
        variant="destructive"
      />
      </div>
    </div>
  );
}
