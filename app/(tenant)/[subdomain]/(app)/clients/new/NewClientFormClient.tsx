"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, User, Mail, Phone, MapPin, FileText, AlertCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import LoadingButton from "@/components/shared/LoadingButton";


const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const clientFormSchema = z.object({
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
  notes: z.string().trim().max(1500).optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function NewClientFormClient(): React.JSX.Element {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      notes: "",
    },
  });

  async function onSubmit(data: ClientFormData): Promise<void> {
    setServerError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Failed to create client. Please try again.");
        return;
      }

      router.push(`/clients/${json.data.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("An unexpected network error occurred.");
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Add New Client"
        description="Enter client contact information, billing metadata, and background notes."
        backHref="/clients"
        backLabel="Back to clients"
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
        {/* Card 1: Core Client & Contact Information */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-subtle)]">
            <Building2 size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Client & Contact Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FormField
                label="Client / Company Name"
                htmlFor="name"
                required
                error={errors.name?.message}
                hint="The official business or organization name."
              >
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Acme Innovations Pvt Ltd"
                  {...register("name")}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Primary Contact Person"
                htmlFor="contactPerson"
                error={errors.contactPerson?.message}
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    id="contactPerson"
                    type="text"
                    placeholder="e.g. Rohan Sharma"
                    {...register("contactPerson")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </FormField>
            </div>

            <div>
              <FormField
                label="GSTIN (Optional)"
                htmlFor="gstNumber"
                error={errors.gstNumber?.message}
                hint="15-character GST identification number"
              >
                <input
                  id="gstNumber"
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  {...register("gstNumber")}
                  className="w-full px-3.5 py-2 text-sm uppercase font-mono rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                />
              </FormField>
            </div>

            <div>
              <FormField
                label="Email Address"
                htmlFor="email"
                error={errors.email?.message}
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    id="email"
                    type="email"
                    placeholder="contact@acme.com"
                    {...register("email")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </FormField>
            </div>

            <div>
              <FormField
                label="Phone Number"
                htmlFor="phone"
                error={errors.phone?.message}
              >
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("phone")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Office / Billing Address"
                htmlFor="address"
                error={errors.address?.message}
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                  <textarea
                    id="address"
                    rows={3}
                    placeholder="Suite 400, Tech Park, Indiranagar, Bengaluru, Karnataka 560038"
                    {...register("address")}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>

        {/* Card 2: Notes & Context */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--color-border-subtle)]">
            <FileText size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Additional Notes
            </h3>
          </div>

          <FormField
            label="Internal Notes"
            htmlFor="notes"
            error={errors.notes?.message}
            hint="Billing notes, preferred communications, or key requirements."
          >
            <textarea
              id="notes"
              rows={4}
              placeholder="Add any helpful internal notes or client preferences..."
              {...register("notes")}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors resize-none"
            />
          </FormField>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </Link>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText="Creating Client..."
            className="bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
          >
            Create Client
          </LoadingButton>
        </div>

      </form>
      </div>
    </div>
  );
}
