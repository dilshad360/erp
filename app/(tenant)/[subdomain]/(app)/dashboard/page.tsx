import {
  Users,
  CheckSquare,
  FolderKanban,
  Briefcase,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage(): React.JSX.Element {
  // These will be replaced with live DB queries in later phases.
  // For now they're placeholders to verify the layout renders.
  const stats = [
    {
      label: "Checked in today",
      value: 0,
      icon: Users,
    },
    {
      label: "Open tasks",
      value: 0,
      icon: CheckSquare,
    },
    {
      label: "Active projects",
      value: 0,
      icon: FolderKanban,
    },
    {
      label: "Clients",
      value: 0,
      icon: Briefcase,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
      />

      <div className="px-4 md:px-6">
        {/* Stat cards — 2 col on mobile, 4 col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Placeholder activity area */}
        <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Recent activity
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Activity feed will appear here once modules are set up.
          </p>
        </div>
      </div>
    </div>
  );
}
