"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderKanban,
  FileText,
  Calendar,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import ClientSelect, { type ClientOption } from "@/components/shared/ClientSelect";
import RichTextEditor from "@/components/shared/RichTextEditor";

const projectFormSchema = z
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

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface NewProjectFormClientProps {
  clients: ClientOption[];
}

export default function NewProjectFormClient({
  clients,
}: NewProjectFormClientProps): React.JSX.Element {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      clientId: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
      budget: "",
    },
  });

  async function onSubmit(data: ProjectFormData): Promise<void> {
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
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Failed to create project. Please try again.");
        return;
      }

      router.push(`/projects/${json.data.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("An unexpected network error occurred.");
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="New Project"
        description="Create a project, link it to a client, and establish timeline and budget estimates."
        backHref="/projects"
        backLabel="Back to projects"
      />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        {serverError && (
          <div
            className="p-4 rounded-lg bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm flex items-start gap-3"
            role="alert"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Core Project Details */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-subtle)]">
            <FolderKanban size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Project Identification
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FormField
                label="Client"
                required
                error={errors.clientId?.message}
                hint="Every project must be associated with an existing client."
              >
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <ClientSelect
                      value={field.value}
                      onChange={field.onChange}
                      clients={clients}
                      placeholder="Select a client for this project..."
                    />
                  )}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Project Name"
                htmlFor="name"
                required
                error={errors.name?.message}
                hint="Descriptive name for the project or client deliverable."
              >
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Website Redesign & Brand Refresh"
                  {...register("name")}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Initial Status"
                htmlFor="status"
                error={errors.status?.message}
              >
                <select
                  id="status"
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
                htmlFor="budget"
                error={errors.budget?.message}
                hint="Total estimated budget in Indian Rupees."
              >
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    id="budget"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 1500000"
                    {...register("budget")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>

        {/* Card 2: Timeline Dates */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-subtle)]">
            <Calendar size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Schedule & Timeline
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FormField
                label="Start Date"
                htmlFor="startDate"
                error={errors.startDate?.message}
              >
                <input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="End Date (Target Completion)"
                htmlFor="endDate"
                error={errors.endDate?.message}
              >
                <input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Card 3: Project Scope & Description */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-subtle)]">
            <FileText size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Project Description & Scope
            </h3>
          </div>

          <FormField
            label="Scope / Overview"
            htmlFor="description"
            error={errors.description?.message}
            hint="Summarize goals, key deliverables, and client constraints."
          >
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.description?.message}
                  placeholder="Outline project objectives, key milestones, and important scope items..."
                  minHeight="140px"
                />
              )}
            />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/projects"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </Link>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText="Creating Project..."
            className="bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
          >
            Create Project
          </LoadingButton>
        </div>
      </form>
      </div>
    </div>
  );
}
