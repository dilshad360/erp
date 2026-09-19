"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  FolderKanban,
  Edit2,
  Calendar,
  User,
  UserX,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RichTextEditor from "@/components/shared/RichTextEditor";
import RichTextViewer from "@/components/shared/RichTextViewer";
import { Button } from "@/components/ui/button";

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const editClientSchema = z.object({
  name: z.string().trim().min(1, "Client company name is required").max(120),
  contactPerson: z.string().trim().max(100).optional(),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (val) => !val || gstRegex.test(val),
      "Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)"
    )
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(10000).optional(),
});

type EditClientFormData = z.infer<typeof editClientSchema>;

export interface LinkedProject {
  id: string;
  name: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
}

export interface ClientDetailProps {
  initialClient: {
    id: string;
    company_id: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    gst_number: string | null;
    notes: string | null;
    status: "active" | "inactive";
    created_at: string;
  };
  initialProjects: LinkedProject[];
  currentUserRole: string;
}

export default function ClientDetailClient({
  initialClient,
  initialProjects,
  currentUserRole,
}: ClientDetailProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [client, setClient] = useState(initialClient);
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "activate">("deactivate");
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  const canManage = currentUserRole === "admin" || currentUserRole === "manager";

  // Check URL query param ?edit=true on initial load
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
  } = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      name: client.name,
      contactPerson: client.contact_person || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      gstNumber: client.gst_number || "",
      notes: client.notes || "",
    },
  });

  async function handleUpdate(data: EditClientFormData): Promise<void> {
    setServerError(null);

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Failed to update client details.");
        return;
      }

      setClient(json.data);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("An unexpected network error occurred.");
    }
  }

  async function handleToggleStatus(): Promise<void> {
    const newStatus = confirmAction === "deactivate" ? "inactive" : "active";
    setIsStatusChanging(true);

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: confirmAction === "deactivate" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: confirmAction === "activate" ? JSON.stringify({ status: "active" }) : undefined,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update client status" }));
        alert(errorData.error || "Failed to update client status");
        return;
      }

      setClient((prev) => ({ ...prev, status: newStatus }));
      setIsConfirmOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsStatusChanging(false);
    }
  }

  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  async function handleHardDelete(): Promise<void> {
    setIsHardDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}?hard=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to delete client" }));
        alert(errorData.error || "Failed to delete client");
        return;
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while deleting client.");
    } finally {
      setIsHardDeleting(false);
    }
  }

  function handleCancelEdit(): void {
    reset({
      name: client.name,
      contactPerson: client.contact_person || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      gstNumber: client.gst_number || "",
      notes: client.notes || "",
    });
    setServerError(null);
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={client.name}
        description={client.gst_number ? `GSTIN: ${client.gst_number}` : "Client details, contacts, and linked projects."}
        backHref="/clients"
        backLabel="Back to clients"
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
                Edit Client
              </Button>
              {client.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmAction("deactivate");
                    setIsConfirmOpen(true);
                  }}
                  className="border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                >
                  <UserX size={14} className="mr-1.5" />
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmAction("activate");
                    setIsConfirmOpen(true);
                  }}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <UserCheck size={14} className="mr-1.5" />
                  Reactivate
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsHardDeleteOpen(true)}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                Delete Client
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

        {/* Status & Quick Info Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                client.status === "active"
                  ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                  : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"
              }`}
            >
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">{client.name}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    client.status === "active"
                      ? "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/20"
                      : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                  }`}
                >
                  {client.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Added on {new Date(client.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content: Edit Form OR Details View */}
        {isEditing ? (
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] pb-3 border-b border-[var(--color-border-subtle)]">
              Edit Client Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FormField
                  label="Client / Company Name"
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
                  label="Contact Person"
                  htmlFor="edit-contact"
                  error={errors.contactPerson?.message}
                >
                  <input
                    id="edit-contact"
                    type="text"
                    {...register("contactPerson")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="GSTIN (Optional)"
                  htmlFor="edit-gst"
                  error={errors.gstNumber?.message}
                >
                  <input
                    id="edit-gst"
                    type="text"
                    {...register("gstNumber")}
                    className="w-full px-3.5 py-2 text-sm uppercase font-mono rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="Email Address"
                  htmlFor="edit-email"
                  error={errors.email?.message}
                >
                  <input
                    id="edit-email"
                    type="email"
                    {...register("email")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="Phone Number"
                  htmlFor="edit-phone"
                  error={errors.phone?.message}
                >
                  <input
                    id="edit-phone"
                    type="tel"
                    {...register("phone")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Office / Billing Address"
                  htmlFor="edit-address"
                  error={errors.address?.message}
                >
                  <textarea
                    id="edit-address"
                    rows={3}
                    {...register("address")}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Internal Notes"
                  htmlFor="edit-notes"
                  error={errors.notes?.message}
                >
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        error={errors.notes?.message}
                        placeholder="Internal notes, requirements, and communication logs..."
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
          {/* Section 2: Contact & Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                <User size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Contact Information
                </h3>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    Primary Contact
                  </span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {client.contact_person || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    Email Address
                  </span>
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="text-[var(--color-brand)] hover:underline flex items-center gap-1.5"
                    >
                      <Mail size={14} className="shrink-0" />
                      <span>{client.email}</span>
                    </a>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">Not specified</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    Phone Number
                  </span>
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="text-[var(--color-brand)] hover:underline flex items-center gap-1.5"
                    >
                      <Phone size={14} className="shrink-0" />
                      <span>{client.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">Not specified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                <MapPin size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Billing & Location
                </h3>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    GSTIN
                  </span>
                  <span className="font-mono text-[var(--color-text-primary)]">
                    {client.gst_number || "Not registered / None"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[var(--color-text-muted)] block mb-0.5">
                    Office / Billing Address
                  </span>
                  <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                    {client.address || "No address provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
              <FileText size={16} className="text-[var(--color-brand)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Internal Notes & Background
              </h3>
            </div>
            <RichTextViewer
              content={client.notes}
              placeholder="No internal notes recorded for this client."
            />
          </div>

          {/* Section 4: Linked Projects */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-[var(--color-brand)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Linked Projects ({initialProjects.length})
                </h3>
              </div>
            </div>

            {initialProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                heading="No projects yet"
                description="No projects have been assigned to this client yet. Create a project in Phase 5 to link them here."
              />
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {initialProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/projects/${proj.id}`}
                        className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        {proj.name}
                      </Link>
                      {(proj.start_date || proj.end_date) && (
                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                          <Calendar size={12} />
                          <span>
                            {proj.start_date ?? "—"} to {proj.end_date ?? "—"}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] font-medium capitalize">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivate / Reactivate */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        isLoading={isStatusChanging}
        title={
          confirmAction === "deactivate"
            ? `Deactivate ${client.name}?`
            : `Reactivate ${client.name}?`
        }
        description={
          confirmAction === "deactivate"
            ? "Deactivating this client will mark them as inactive across the workspace. Existing records and projects remain untouched."
            : "Reactivating this client will restore them to active status."
        }
        confirmLabel={confirmAction === "deactivate" ? "Deactivate Client" : "Reactivate Client"}
        variant={confirmAction === "deactivate" ? "destructive" : "default"}
      />

      {/* Hard Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isHardDeleteOpen}
        onClose={() => setIsHardDeleteOpen(false)}
        onConfirm={handleHardDelete}
        isLoading={isHardDeleting}
        title={`Permanently Delete ${client.name}?`}
        description={`This action will permanently delete "${client.name}" and all ${initialProjects.length} linked project(s) and their tasks across your organization. This action cannot be undone.`}
        confirmLabel="Permanently Delete"
        variant="destructive"
      />
      </div>
    </div>
  );
}
