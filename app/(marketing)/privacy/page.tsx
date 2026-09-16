import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy and location data handling for ERP SaaS.",
};

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] px-4 py-12 md:py-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-2 border-b border-[var(--color-border)] pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
            <ShieldCheck size={14} />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Last updated: September 16, 2026
          </p>
        </div>

        <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              1. Overview
            </h2>
            <p>
              This Privacy Policy explains how our ERP SaaS platform collects, uses, and protects your information when you use our multi-tenant employee management, project tracking, and attendance services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              2. Location Data & Geofencing (GPS Coordinates)
            </h2>
            <p>
              When employees perform an attendance check-in or check-out, the app requests temporary access to device geolocation (latitude and longitude).
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-[var(--color-text-muted)]">
              <li>
                <strong>Purpose:</strong> GPS coordinates are collected strictly to verify whether the employee is within the employer&apos;s designated office radius (geofence).
              </li>
              <li>
                <strong>No Continuous Tracking:</strong> Location is requested only at the exact moment of check-in or check-out. We do NOT track your location in the background or continuously throughout the day.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              3. Multi-Tenant Data Isolation
            </h2>
            <p>
              All tenant data (employees, attendance logs, clients, projects, tasks) is strictly isolated using Postgres Row Level Security (RLS). No customer or organization can view or access data belonging to another workspace.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              4. Offline Storage (IndexedDB & Cache)
            </h2>
            <p>
              For offline resilience, attendance check-ins made while disconnected are queued locally in your browser&apos;s IndexedDB and synchronized securely over HTTPS once internet connectivity is restored.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              5. Contact Us
            </h2>
            <p>
              If you have any questions or data deletion requests, contact us at{" "}
              <a
                href="mailto:privacy@dilshadcodes.com"
                className="text-[var(--color-brand)] hover:underline"
              >
                privacy@dilshadcodes.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
