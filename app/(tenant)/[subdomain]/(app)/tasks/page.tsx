import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GlobalTasksClient, { type GlobalTask, type ProjectOption } from "./GlobalTasksClient";
import type { TaskStatus } from "@/components/tasks/TaskForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function TasksPage({
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

  // 1. Fetch all company tasks (RLS isolated by company_id) with multi-assignee junction
  const { data: tasksData } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      priority,
      due_date,
      created_by,
      created_at,
      status:status_id (id, name, color),
      assignee:assignee_id (id, full_name, avatar_url, employee_id),
      task_assignees (
        profile:profile_id (
          id,
          full_name,
          avatar_url,
          employee_id
        )
      ),
      project:project_id (id, name)
    `)
    .eq("company_id", profile.company_id)
    .order("due_date", { ascending: true, nullsFirst: false });

  // 2. Fetch company task statuses
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

  // 3. Fetch active projects for task creation
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", profile.company_id)
    .neq("status", "cancelled")
    .order("name", { ascending: true });

  const projects: ProjectOption[] = (projectsData ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  interface RawAssignee {
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      employee_id: string | null;
    } | null;
  }

  // Format assignees cleanly
  const formattedTasks: GlobalTask[] = (tasksData ?? []).map((t: Record<string, unknown>) => {
    const rawAssignees = (t.task_assignees as RawAssignee[] | null) || [];
    const profiles = rawAssignees
      .map((ta) => ta.profile)
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const primaryAssignee = t.assignee as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      employee_id: string | null;
    } | null;

    if (profiles.length === 0 && primaryAssignee) {
      profiles.push(primaryAssignee);
    }

    return {
      id: t.id as string,
      title: t.title as string,
      description: (t.description as string | null) ?? null,
      priority: (t.priority as string) ?? "medium",
      due_date: (t.due_date as string | null) ?? null,
      created_by: (t.created_by as string | null) ?? null,
      created_at: t.created_at as string,
      status: t.status as GlobalTask["status"],
      assignee: primaryAssignee,
      assignees: profiles,
      project: t.project as GlobalTask["project"],
    };
  });

  return (
    <GlobalTasksClient
      initialTasks={formattedTasks}
      statuses={statuses}
      projects={projects}
      currentUserId={user.id}
      currentUserRole={profile.role}
    />
  );
}
