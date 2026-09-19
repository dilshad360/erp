import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProjectDetailClient, { type ProjectDetailData } from "./ProjectDetailClient";
import type { Metadata } from "next";

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
    title: project?.name ? `${project.name} — Projects` : "Project Details",
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; id: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch user profile to get company_id & role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      id,
      company_id,
      client_id,
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      created_by,
      created_at,
      client:client_id (
        id,
        name,
        contact_person,
        email,
        phone
      ),
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("id", id)
    .eq("company_id", userProfile.company_id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch active clients for edit form ClientSelect
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("company_id", userProfile.company_id)
    .eq("status", "active")
    .order("name", { ascending: true });

  // Fetch tasks for this project with statuses & assignees
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      priority,
      due_date,
      status_id,
      created_at,
      status:status_id (id, name, color),
      assignee:assignee_id (id, full_name, avatar_url, employee_id),
      task_assignees (
        profile:profile_id (id, full_name, avatar_url, employee_id)
      )
    `)
    .eq("project_id", id)
    .eq("company_id", userProfile.company_id);

  // Fetch tenant task statuses
  const { data: rawStatuses } = await supabase
    .from("task_statuses")
    .select("id, name, color, sort_order")
    .eq("company_id", userProfile.company_id)
    .order("sort_order", { ascending: true });

  const statuses = rawStatuses || [];
  const tasks = rawTasks || [];

  // Compute task status breakdown
  const statusCounts = statuses.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    count: tasks.filter((t) => t.status_id === s.id).length,
  }));

  const unstatusedCount = tasks.filter((t) => !t.status_id).length;

  // Compute unique team members assigned to project tasks
  interface TeamMember {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    employee_id: string | null;
    task_count: number;
  }

  const teamMembersMap = new Map<string, TeamMember>();

  tasks.forEach((task: Record<string, unknown>) => {
    const rawAssignees = (task.task_assignees as Array<{ profile: { id: string; full_name: string | null; avatar_url: string | null; employee_id: string | null } | null }> | null) || [];
    const profiles = rawAssignees.map((ta) => ta.profile).filter((p): p is NonNullable<typeof p> => p !== null);

    const primary = task.assignee as { id: string; full_name: string | null; avatar_url: string | null; employee_id: string | null } | null;
    if (profiles.length === 0 && primary) {
      profiles.push(primary);
    }

    profiles.forEach((p) => {
      if (!teamMembersMap.has(p.id)) {
        teamMembersMap.set(p.id, {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          employee_id: p.employee_id,
          task_count: 1,
        });
      } else {
        const existing = teamMembersMap.get(p.id)!;
        existing.task_count += 1;
      }
    });
  });

  const teamMembers = Array.from(teamMembersMap.values());

  return (
    <ProjectDetailClient
      initialProject={project as unknown as ProjectDetailData}
      clients={clients || []}
      currentUserRole={userProfile.role}
      taskCounts={{
        total: tasks.length,
        statuses: statusCounts,
        unstatused: unstatusedCount,
      }}
      teamMembers={teamMembers}
    />
  );
}
