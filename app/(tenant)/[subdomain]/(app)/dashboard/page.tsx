import Link from "next/link";
import {
  Users,
  CheckSquare,
  FolderKanban,
  Briefcase,
  ArrowRight,
  Building2,
  Calendar,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatINR, calculateTimelineProgress } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface RecentProject {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  client: {
    id: string;
    name: string;
  } | null;
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const supabase = await createClient();

  // ── Get authenticated user + profile ─────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let checkedInCount = 0;
  let activeProjectsCount = 0;
  let activeClientsCount = 0;
  let recentProjects: RecentProject[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      // 1. Attendance today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { count: attendanceCount } = await supabase
        .from("attendance_logs")
        .select("user_id", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .gte("check_in_at", todayStart.toISOString())
        .lte("check_in_at", todayEnd.toISOString());

      checkedInCount = attendanceCount ?? 0;

      // 2. Active projects count
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("status", "active");

      activeProjectsCount = projectsCount ?? 0;

      // 3. Active clients count
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("status", "active");

      activeClientsCount = clientsCount ?? 0;

      // 4. Recent projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          status,
          start_date,
          end_date,
          budget,
          client:client_id (
            id,
            name
          )
        `)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(3);

      recentProjects = (projectsData as unknown as RecentProject[]) || [];
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
      value: activeProjectsCount,
      icon: FolderKanban,
    },
    {
      label: "Clients",
      value: activeClientsCount,
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

        {/* Recent Projects Section */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <FolderKanban size={18} className="text-[var(--color-brand)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Recent Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-xs text-[var(--color-brand)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
              No projects created yet. Head over to{" "}
              <Link href="/projects/new" className="text-[var(--color-brand)] hover:underline">
                New Project
              </Link>{" "}
              to create one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project) => {
                const timeline = calculateTimelineProgress(project.start_date, project.end_date);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand)]/50 transition-colors block space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {project.name}
                        </h3>
                        {project.client && (
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5 truncate">
                            <Building2 size={12} className="text-[var(--color-text-muted)] shrink-0" />
                            <span className="truncate">{project.client.name}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)] shrink-0 capitalize">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    {(project.start_date || project.end_date) && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {timeline.label}
                          </span>
                          <span>{timeline.percentage}%</span>
                        </div>
                        <div className="w-full bg-[var(--color-surface)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border)]">
                          <div
                            className={`h-full rounded-full ${
                              timeline.isOverdue
                                ? "bg-[var(--color-danger)]"
                                : "bg-[var(--color-brand)]"
                            }`}
                            style={{ width: `${timeline.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-semibold text-[var(--color-text-primary)] pt-1 border-t border-[var(--color-border-subtle)]/50">
                      {formatINR(project.budget)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed placeholder */}
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

