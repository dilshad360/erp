// Marketing landing page stub
// The full landing page is built in Phase 7 (polish).
// This just gives visitors something to see at dilshadcodes.com
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ERP SaaS — erp.dilshadcodes.com",
  description:
    "Attendance, clients, projects, and tasks — all in one place for small Indian startups.",
  robots: { index: true, follow: true },
};

export default function MarketingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-4 max-w-xl">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
          ERP for small teams
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
          Attendance tracking, client management, projects, and tasks — built
          for small Indian startups. Mobile-first.
        </p>
        <Link
          href="/signup"
          className="inline-block mt-4 px-6 py-3 rounded-lg bg-[var(--color-brand)] text-white font-medium hover:bg-[var(--color-brand-hover)] transition-colors duration-150"
        >
          Get started free →
        </Link>
      </div>
    </main>
  );
}
