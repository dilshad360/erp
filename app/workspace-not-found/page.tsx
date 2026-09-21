import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Not Found",
  robots: { index: false, follow: false },
};

export default function WorkspaceNotFoundPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-[var(--color-bg)]">
      <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-xl overflow-hidden p-2">
        <Image
          src="/logo.png"
          alt="Octyvo Logo"
          fill
          className="object-contain p-2"
          priority
        />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Workspace Not Found
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
          This subdomain doesn&apos;t belong to any registered workspace. Double-check the URL or create a new workspace.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="px-4 py-2 rounded-md bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors duration-150 shadow-sm"
        >
          Create Workspace
        </Link>
      </div>
    </div>
  );
}
