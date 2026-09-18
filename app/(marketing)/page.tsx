import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ERP SaaS — erp.dilshadcodes.com",
  description:
    "Attendance, clients, projects, and tasks — all in one place for small Indian startups.",
  robots: { index: true, follow: true },
};

export default function MarketingPage(): React.JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-[var(--color-bg)]">
      <div className="text-center space-y-5 max-w-xl flex flex-col items-center">
        {/* App Logo */}
        <div className="relative w-20 h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 shadow-2xl overflow-hidden flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="ERP Logo"
            fill
            className="object-contain p-2"
            priority
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            ERP for modern teams
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Attendance tracking, client management, projects, and tasks — built
            for small Indian startups. Mobile-first and PWA ready.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold text-sm hover:bg-[var(--color-brand-hover)] transition-all duration-150 shadow-md shadow-[var(--color-brand)]/25"
          >
            Create your workspace →
          </Link>
        </div>
      </div>
    </main>
  );
}
