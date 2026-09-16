import {
  Users,
  CheckSquare,
  FolderKanban,
  Briefcase,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const supabase = await createClient();

  // ── Get authenticated user + profile ─────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let checkedInCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Count distinct users who have checked in today (no check_out required)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { count } = await supabase
        .from("attendance_logs")
        .select("user_id", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .gte("check_in_at", todayStart.toISOString())
        .lte("check_in_at", todayEnd.toISOString());

      checkedInCount = count ?? 0;
    }
  }

  const stats = [
    {
      label: "Checked in today",
      value: checkedInCount,
      icon: Users,
    },
    {
      label: "Open tasks",
      value: 0, // Phase 6
      icon: CheckSquare,
    },
    {
      label: "Active projects",
      value: 0, // Phase 5
      icon: FolderKanban,
    },
    {
      label: "Clients",
      value: 0, // Phase 4
      icon: Briefcase,
    },
  ] as const;

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Recent activity
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Activity feed will appear here as team members complete tasks and log updates.
          </p>
        </div>
      </div>
    </div>
  );
}
