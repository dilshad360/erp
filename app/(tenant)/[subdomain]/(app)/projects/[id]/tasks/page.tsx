import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import TaskListView from "@/components/tasks/TaskListView";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import Link from "next/link";
import { List, Kanban } from "lucide-react";
import type { Metadata } from "next";
import type { Task } from "@/components/tasks/TaskListView";
import type { TaskStatus } from "@/components/tasks/TaskForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: project?.name ? `${project.name} — Tasks` : "Project Tasks",
  };
}

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; id: string }>;
  searchParams: Promise<{ view?: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain, id: projectId } = await params;
  const { view } = await searchParams;
  const currentView = view === "kanban" ? "kanban" : "list";

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

  // Fetch project (validates ownership)
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("id", projectId)
    .eq("company_id", profile.company_id)
    .single();

  if (!project) {
    notFound();
  }

  // Fetch task statuses
  const { data: statusesData } = await supabase
    .from("task_statuses")
    .select("id, name, color, sort_order")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: true });

  const statuses: TaskStatus[] = (statusesData ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color ?? null,
  }));

  // Fetch tasks for this project
  const { data: tasksData } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      priority,
      due_date,
      created_at,
      status:status_id (id, name, color),
      assignee:assignee_id (id, full_name, avatar_url),
      project:project_id (id, name)
    `)
    .eq("project_id", projectId)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  const tasks = (tasksData ?? []) as unknown as Task[];

  const basePath = `/projects/${projectId}/tasks`;

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={`${project.name} — Tasks`}
        description="Manage tasks for this project."
        backHref={`/projects/${projectId}`}
        backLabel="Back to project"
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 md:px-8 space-y-4">
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg w-fit">
          <Link
            href={`${basePath}?view=list`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentView === "list"
                ? "bg-[var(--color-brand)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <List size={14} />
            List
          </Link>
          <Link
            href={`${basePath}?view=kanban`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentView === "kanban"
                ? "bg-[var(--color-brand)] text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Kanban size={14} />
            Kanban
          </Link>
        </div>

        {/* View */}
        {currentView === "list" ? (
          <TaskListView
            initialTasks={tasks}
            statuses={statuses}
            projectId={projectId}
          />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8">
            <KanbanBoard
              initialTasks={tasks}
              statuses={statuses}
              projectId={projectId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
