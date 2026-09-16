import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import KanbanColumnManager from "@/components/tasks/KanbanColumnManager";
import type { Metadata } from "next";
import type { TaskStatusRow } from "@/components/tasks/KanbanColumnManager";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${subdomain}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch task statuses
  const { data: statusesData } = await supabase
    .from("task_statuses")
    .select("id, name, color, sort_order")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: true });

  const statuses: TaskStatusRow[] = (statusesData ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color ?? null,
    sort_order: s.sort_order,
  }));

  const isAdmin = profile.role === "admin" || profile.role === "manager";

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        description="Manage your workspace configuration."
      />

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:px-8 space-y-8">

        {/* Kanban Columns */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="pb-2 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Kanban Columns
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Customise the task status columns shown on the Kanban board.
              Drag to reorder. Changes apply immediately.
            </p>
          </div>

          {isAdmin ? (
            <KanbanColumnManager initialStatuses={statuses} />
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Only admins and managers can manage Kanban columns.
            </p>
          )}
        </section>

        {/* Placeholder sections for Phase 7 */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-2 shadow-xs opacity-50">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Company Branding</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Logo, brand colour, and geofence settings — coming in Phase 7.</p>
        </section>

      </div>
    </div>
  );
}
