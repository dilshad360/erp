import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema } from "@/lib/validations/task";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const assigneeId = searchParams.get("assignee_id");
  const statusId = searchParams.get("status_id");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");
  const view = searchParams.get("view"); // "my" | "all"

  // If view is "my", find all task IDs assigned to the current user in task_assignees or assignee_id
  let myTaskIds: string[] | null = null;
  if (view === "my") {
    const { data: assignments } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("profile_id", user.id)
      .eq("company_id", profile.company_id);

    const junctionTaskIds = (assignments ?? []).map((a) => a.task_id);

    const { data: legacyTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("assignee_id", user.id)
      .eq("company_id", profile.company_id);

    const legacyTaskIds = (legacyTasks ?? []).map((t) => t.id);

    myTaskIds = Array.from(new Set([...junctionTaskIds, ...legacyTaskIds]));
  }

  let query = supabase
    .from("tasks")
    .select(`
      id,
      company_id,
      project_id,
      title,
      description,
      status_id,
      priority,
      assignee_id,
      due_date,
      created_by,
      created_at,
      updated_at,
      project:project_id (
        id,
        name
      ),
      status:status_id (
        id,
        name,
        color
      ),
      assignee:assignee_id (
        id,
        full_name,
        avatar_url,
        employee_id
      ),
      task_assignees (
        profile:profile_id (
          id,
          full_name,
          avatar_url,
          employee_id
        )
      ),
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);
  if (statusId) query = query.eq("status_id", statusId);
  if (priority) query = query.eq("priority", priority);
  if (search) query = query.ilike("title", `%${search}%`);

  if (view === "my" && myTaskIds) {
    if (myTaskIds.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }
    query = query.in("id", myTaskIds);
  } else if (assigneeId) {
    // Check junction table for tasks with specific assignee
    const { data: assigneeRows } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("profile_id", assigneeId)
      .eq("company_id", profile.company_id);

    const targetIds = (assigneeRows ?? []).map((r) => r.task_id);
    if (targetIds.length > 0) {
      query = query.or(`assignee_id.eq.${assigneeId},id.in.(${targetIds.join(",")})`);
    } else {
      query = query.eq("assignee_id", assigneeId);
    }
  }

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    return NextResponse.json({ data: null, error: tasksError.message }, { status: 500 });
  }

  // Format assignees list cleanly
  interface RawTaskAssignee {
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      employee_id: string | null;
    } | null;
  }

  const formattedTasks = (tasks || []).map((t: Record<string, unknown>) => {
    const rawAssignees = (t.task_assignees as RawTaskAssignee[] | null) || [];
    const profiles = rawAssignees
      .map((ta) => ta.profile)
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // If junction is empty but legacy assignee exists, fallback to legacy
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
      ...t,
      assignees: profiles,
    };
  });

  return NextResponse.json({ data: formattedTasks, error: null });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createTaskSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { projectId, title, description, statusId, priority, assigneeId, assigneeIds, dueDate } =
    parseResult.data;

  // Combine assigneeIds with assigneeId fallback
  let allAssigneeIds = Array.isArray(assigneeIds) ? [...assigneeIds] : [];
  if (assigneeId && !allAssigneeIds.includes(assigneeId)) {
    allAssigneeIds.push(assigneeId);
  }
  allAssigneeIds = Array.from(new Set(allAssigneeIds));

  // Validate project belongs to company
  const { data: project, error: projectCheckError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("company_id", profile.company_id)
    .single();

  if (projectCheckError || !project) {
    return NextResponse.json(
      { data: null, error: "Project does not exist or does not belong to your organization" },
      { status: 400 }
    );
  }

  // Validate all assignees belong to company
  if (allAssigneeIds.length > 0) {
    const { data: validProfiles, error: validError } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", profile.company_id)
      .in("id", allAssigneeIds);

    if (validError || !validProfiles || validProfiles.length !== allAssigneeIds.length) {
      return NextResponse.json(
        { data: null, error: "One or more assigned employees are invalid or outside your company" },
        { status: 400 }
      );
    }
  }

  const primaryAssigneeId = allAssigneeIds[0] || assigneeId || null;

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      company_id: profile.company_id,
      project_id: projectId,
      title,
      description: description ?? null,
      status_id: statusId ?? null,
      priority: priority ?? "medium",
      assignee_id: primaryAssigneeId,
      due_date: dueDate && dueDate !== "" ? dueDate : null,
      created_by: user.id,
    })
    .select(`
      id,
      company_id,
      project_id,
      title,
      description,
      status_id,
      priority,
      assignee_id,
      due_date,
      created_by,
      created_at,
      updated_at,
      project:project_id (id, name),
      status:status_id (id, name, color),
      assignee:assignee_id (id, full_name, avatar_url, employee_id),
      creator:created_by (id, full_name)
    `)
    .single();

  if (insertError || !newTask) {
    return NextResponse.json(
      { data: null, error: insertError?.message ?? "Failed to create task" },
      { status: 500 }
    );
  }

  // Insert into task_assignees junction table
  if (allAssigneeIds.length > 0) {
    const junctionRows = allAssigneeIds.map((pId) => ({
      task_id: newTask.id,
      profile_id: pId,
      company_id: profile.company_id,
    }));

    const { error: junctionError } = await supabase
      .from("task_assignees")
      .insert(junctionRows);

    if (junctionError) {
      console.error("Failed to insert task assignees", junctionError);
    }
  }

  // Fetch created assignees for full return payload
  const { data: assigneeRows } = await supabase
    .from("task_assignees")
    .select(`
      profile:profile_id (
        id,
        full_name,
        avatar_url,
        employee_id
      )
    `)
    .eq("task_id", newTask.id);

  interface RawAssigneeRow {
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      employee_id: string | null;
    } | null;
  }

  const assignees = ((assigneeRows as RawAssigneeRow[] | null) ?? [])
    .map((r) => r.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return NextResponse.json(
    {
      data: {
        ...newTask,
        assignees: assignees.length > 0 ? assignees : (newTask.assignee ? [newTask.assignee] : []),
      },
      error: null,
    },
    { status: 201 }
  );
}
