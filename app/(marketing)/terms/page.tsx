import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Octyvo platform.",
};

export default function TermsOfServicePage(): React.JSX.Element {
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
            <FileText size={14} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Last updated: September 16, 2026
          </p>
        </div>

        <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using our Octyvo workspace platform, you agree to be bound by these Terms of Service. If you are registering on behalf of a company, you represent that you have authority to bind that entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              2. Workspace Subdomains & Security
            </h2>
            <p>
              Each registered company is assigned a unique tenant subdomain. Account administrators are responsible for maintaining the confidentiality of company credentials and managing employee access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              3. Attendance & Geolocation Accuracy
            </h2>
            <p>
              Employers configuring geofence boundaries are responsible for entering accurate office coordinates. Attendance logs recorded via device GPS or offline queues reflect the device state at the time of submission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              4. Service Availability & Maintenance
            </h2>
            <p>
              We strive for continuous availability and offer offline PWA capabilities for essential functions such as attendance check-ins. Occasional maintenance updates will be communicated in advance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              5. Termination & Contact
            </h2>
            <p>
              To request workspace cancellation or data export, contact our support team at{" "}
              <a
                href="mailto:support@dilshadcodes.com"
                className="text-[var(--color-brand)] hover:underline"
              >
                support@dilshadcodes.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
