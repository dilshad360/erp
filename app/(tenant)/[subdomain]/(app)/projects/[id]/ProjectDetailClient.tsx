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
  CheckSquare,
  Users,
  AlertCircle,
  Plus,
  ArrowRight,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ClientSelect, { type ClientOption } from "@/components/shared/ClientSelect";
import Avatar from "@/components/shared/Avatar";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichTextViewer from "@/components/shared/RichTextViewer";
import { Button } from "@/components/ui/button";
import { formatINR, calculateTimelineProgress } from "@/lib/format";

const editProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(150),
    clientId: z.string().min(1, "Please select a client"),
    description: z.string().trim().max(10000).optional(),
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

export interface TaskStatusCount {
  id: string;
  name: string;
  color: string | null;
  count: number;
}

export interface ProjectTeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  task_count: number;
}

export interface ProjectDetailProps {
  initialProject: ProjectDetailData;
  clients: ClientOption[];
  currentUserRole: string;
  taskCounts?: {
    total: number;
    statuses: TaskStatusCount[];
    unstatused: number;
  };
  teamMembers?: ProjectTeamMember[];
}

export default function ProjectDetailClient({
  initialProject,
  clients,
  currentUserRole,
  taskCounts = { total: 0, statuses: [], unstatused: 0 },
  teamMembers = [],
}: ProjectDetailProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<ProjectDetailData>(initialProject);

  // Sync state if initialProject prop updates
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  async function handleDelete(): Promise<void> {
    setIsDeleteLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}?hard=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete project" }));
        alert(err.error || "Failed to delete project");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while deleting project.");
    } finally {
      setIsDeleteLoading(false);
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
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] text-xs px-2.5 sm:px-3 h-8"
              >
                <Edit2 size={13} className="mr-1 sm:mr-1.5" />
                <span>Edit</span>
                <span className="hidden sm:inline ml-1">Project</span>
              </Button>
              {project.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsArchiveOpen(true)}
                  className="border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] text-xs px-2.5 sm:px-3 h-8"
                >
                  <Archive size={13} className="mr-1 sm:mr-1.5" />
                  <span>Archive</span>
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs px-2.5 sm:px-3 h-8 cursor-pointer"
              >
                <Trash2 size={13} className="mr-1 sm:mr-1.5 sm:hidden" />
                <span className="hidden sm:inline">Delete Project</span>
                <span className="sm:hidden">Delete</span>
              </Button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center font-bold text-sm shrink-0">
              <FolderKanban size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{project.name}</span>
                {getStatusBadge(project.status)}
              </div>
              {project.client && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                  Client: <Link href={`/clients/${project.client.id}`} className="text-[var(--color-brand)] hover:underline font-medium">{project.client.name}</Link>
                </p>
              )}
            </div>
          </div>

          {/* Tasks button */}
          <Link
            href={`/projects/${project.id}/tasks`}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-brand)]/40 text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors shrink-0 self-start sm:self-auto"
          >
            <CheckCircle2 size={14} />
            <span>Tasks</span>
          </Link>
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
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        error={errors.description?.message}
                        placeholder="Project scope, deliverables, and milestones..."
                        minHeight="140px"
                      />
                    )}
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
            <RichTextViewer
              content={project.description}
              placeholder="No description provided for this project."
            />
          </div>

          {/* Tasks Overview Section */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Tasks Overview
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium">
                  {taskCounts?.total ?? 0} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.id}/tasks?view=list`}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  List View
                </Link>
                <Link
                  href={`/projects/${project.id}/tasks?view=kanban`}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] transition-colors"
                >
                  Kanban Board →
                </Link>
              </div>
            </div>

            {/* Dynamic Status Breakdown Cards */}
            {taskCounts && taskCounts.statuses.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {taskCounts.statuses.map((status) => (
                  <div
                    key={status.id}
                    className="p-3.5 rounded-xl bg-[var(--color-surface-raised)]/60 border border-[var(--color-border-subtle)] space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: status.color || "var(--color-text-muted)" }}
                      />
                      <span className="truncate font-medium">{status.name}</span>
                    </div>
                    <div
                      className="text-xl font-bold tracking-tight"
                      style={{ color: status.color || "var(--color-text-primary)" }}
                    >
                      {status.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-raised)]/30 rounded-lg">
                No task statuses configured.
              </div>
            )}
          </div>

          {/* Project Team Section */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Project Team
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium">
                  {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}
                </span>
              </div>
              <Link
                href={`/projects/${project.id}/tasks`}
                className="text-xs text-[var(--color-brand)] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Assign tasks</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {teamMembers.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">
                  No team members assigned to tasks in this project yet.
                </p>
                <Link
                  href={`/projects/${project.id}/tasks`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white transition-colors"
                >
                  <Plus size={13} />
                  <span>Create task & assign members</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)]/60 border border-[var(--color-border-subtle)]"
                  >
                    <Avatar
                      src={member.avatar_url}
                      name={member.full_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {member.full_name || "Unnamed Employee"}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                        {member.employee_id ? `#${member.employee_id}` : "Team Member"}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] font-medium shrink-0">
                      {member.task_count} {member.task_count === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Hard Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleteLoading}
        title={`Permanently Delete ${project.name}?`}
        description={`Permanently deleting "${project.name}" will delete the project and all attached tasks and team assignments across the organization. This action cannot be undone.`}
        confirmLabel="Permanently Delete"
        variant="destructive"
      />
      </div>
    </div>
  );
}
