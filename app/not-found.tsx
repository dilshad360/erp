import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-5xl">🔍</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Workspace not found
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
          This subdomain doesn&apos;t belong to any workspace. Double-check the URL or
          create a new workspace.
        </p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors"
      >
        Go to homepage
      </Link>
    </div>
  );
}
