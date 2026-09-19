import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateTaskSchema } from "@/lib/validations/task";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const { data: task, error } = await supabase
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
      project:project_id (id, name, status),
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
      creator:created_by (id, full_name)
    `)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (error || !task) {
    return NextResponse.json({ data: null, error: "Task not found" }, { status: 404 });
  }

  interface RawAssignee {
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      employee_id: string | null;
    } | null;
  }

  const rawAssignees = (task.task_assignees as unknown as RawAssignee[] | null) || [];
  const assignees = rawAssignees
    .map((ta) => ta.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const primaryAssignee = task.assignee as unknown as {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    employee_id: string | null;
  } | null;

  if (assignees.length === 0 && primaryAssignee) {
    assignees.push(primaryAssignee);
  }

  return NextResponse.json({
    data: {
      ...task,
      assignees,
    },
    error: null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  // Fetch task to check ownership & assignees
  const { data: existingTask } = await supabase
    .from("tasks")
    .select(`
      id,
      company_id,
      assignee_id,
      created_by,
      task_assignees (profile_id)
    `)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!existingTask) {
    return NextResponse.json({ data: null, error: "Task not found" }, { status: 404 });
  }

  const assignedProfileIds = (existingTask.task_assignees as { profile_id: string }[] | null)?.map(
    (ta) => ta.profile_id
  ) || [];

  const isAdminOrManager = profile.role === "admin" || profile.role === "manager";
  const isAssignee = existingTask.assignee_id === user.id || assignedProfileIds.includes(user.id);
  const isCreator = existingTask.created_by === user.id;

  if (!isAdminOrManager && !isAssignee && !isCreator) {
    return NextResponse.json(
      { data: null, error: "Forbidden: You can only update tasks assigned to you or created by you" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateTaskSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { title, description, statusId, priority, assigneeId, assigneeIds, dueDate, projectId } =
    parseResult.data;

  const updatePayload: Record<string, unknown> = {};
  if (projectId !== undefined) updatePayload.project_id = projectId;
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description ?? null;
  if (statusId !== undefined) updatePayload.status_id = statusId ?? null;
  if (priority !== undefined) updatePayload.priority = priority;
  if (dueDate !== undefined) updatePayload.due_date = dueDate && dueDate !== "" ? dueDate : null;

  // Handle multi-assignee sync
  let syncAssignees = false;
  let newAssigneeIds: string[] = [];

  if (assigneeIds !== undefined) {
    syncAssignees = true;
    newAssigneeIds = Array.isArray(assigneeIds) ? assigneeIds : [];
  } else if (assigneeId !== undefined) {
    syncAssignees = true;
    newAssigneeIds = assigneeId ? [assigneeId] : [];
  }

  if (syncAssignees) {
    newAssigneeIds = Array.from(new Set(newAssigneeIds));
    // Validate all assignees belong to tenant
    if (newAssigneeIds.length > 0) {
      const { data: validProfiles, error: validErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", profile.company_id)
        .in("id", newAssigneeIds);

      if (validErr || !validProfiles || validProfiles.length !== newAssigneeIds.length) {
        return NextResponse.json(
          { data: null, error: "One or more assigned team members are invalid" },
          { status: 400 }
        );
      }
    }
    updatePayload.assignee_id = newAssigneeIds[0] || null;
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select(`
      id, company_id, project_id, title, description, status_id, priority,
      assignee_id, due_date, created_by, created_at, updated_at,
      project:project_id (id, name),
      status:status_id (id, name, color),
      assignee:assignee_id (id, full_name, avatar_url, employee_id),
      creator:created_by (id, full_name)
    `)
    .single();

  if (updateError || !updatedTask) {
    return NextResponse.json({ data: null, error: updateError?.message ?? "Failed to update task" }, { status: 500 });
  }

  // If assignees were changed, sync junction table
  if (syncAssignees) {
    // Delete existing junction entries
    await supabase.from("task_assignees").delete().eq("task_id", id);

    if (newAssigneeIds.length > 0) {
      const rows = newAssigneeIds.map((pId) => ({
        task_id: id,
        profile_id: pId,
        company_id: profile.company_id,
      }));
      await supabase.from("task_assignees").insert(rows);
    }
  }

  // Fetch updated assignees
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
    .eq("task_id", id);

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

  return NextResponse.json({
    data: {
      ...updatedTask,
      assignees: assignees.length > 0 ? assignees : (updatedTask.assignee ? [updatedTask.assignee] : []),
    },
    error: null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  // Check task exists and check if caller is admin/manager or task creator
  const { data: task } = await supabase
    .from("tasks")
    .select("id, created_by")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!task) {
    return NextResponse.json({ data: null, error: "Task not found" }, { status: 404 });
  }

  const isAdminOrManager = profile.role === "admin" || profile.role === "manager";
  const isCreator = task.created_by === user.id;

  if (!isAdminOrManager && !isCreator) {
    return NextResponse.json(
      { data: null, error: "Forbidden: You can only delete tasks you created or if you are an admin/manager" },
      { status: 403 }
    );
  }

  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (deleteError) {
    return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id }, error: null });
}
