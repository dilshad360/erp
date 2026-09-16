"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/shared/PageHeader";
import Link from "next/link";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

const inviteSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string().optional(),
  reportingManagerId: z.string().nullable().optional(),
  role: z.enum(["admin", "manager", "employee"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

type ManagerOption = {
  id: string;
  full_name: string | null;
  designation: string | null;
};

type InviteFormClientProps = {
  managers: ManagerOption[];
  subdomain: string;
};

export default function InviteFormClient({
  managers,
  subdomain: _subdomain,
}: InviteFormClientProps): React.JSX.Element {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      fullName: "",
      email: "",
      employeeId: "",
      department: "",
      designation: "",
      dateOfJoining: new Date().toISOString().split("T")[0],
      reportingManagerId: null,
      role: "employee",
    },
  });

  const onSubmit = async (values: InviteFormValues): Promise<void> => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setErrorMsg(result.error || "Failed to invite employee");
        setIsSubmitting(false);
        return;
      }

      // Success -> navigate to employee list
      router.push(`/employees`);
      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Invite Employee"
        description="Send an email invitation to a new team member."
        backHref="/employees"
        backLabel="Back to employees"
      />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-6 shadow-xs"
        >
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-[var(--color-danger-subtle)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Full Name <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                {...register("fullName")}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              />
              {errors.fullName && (
                <p className="text-[10px] text-[var(--color-danger)] font-medium">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Email Address <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="rahul@company.com"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              />
              {errors.email && (
                <p className="text-[10px] text-[var(--color-danger)] font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Employee ID
              </label>
              <input
                type="text"
                {...register("employeeId")}
                placeholder="EMP-001"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Role <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                {...register("role")}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Department
              </label>
              <input
                type="text"
                {...register("department")}
                placeholder="e.g. Engineering, Sales"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Designation
              </label>
              <input
                type="text"
                {...register("designation")}
                placeholder="e.g. Software Engineer"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            {/* Date of Joining */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Date of Joining
              </label>
              <input
                type="date"
                {...register("dateOfJoining")}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            {/* Reporting Manager */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Reporting Manager
              </label>
              <select
                {...register("reportingManagerId")}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand)]"
              >
                <option value="">None (No manager)</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.full_name || "Unnamed"} {mgr.designation ? `(${mgr.designation})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
            <Link
              href="/employees"
              className="px-4 py-2 rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending invite...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
