import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal("")),
});

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
      creator:created_by (id, full_name)
    `)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (error || !task) {
    return NextResponse.json({ data: null, error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ data: task, error: null });
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

  // Fetch task to check ownership
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("id, company_id, assignee_id, created_by")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!existingTask) {
    return NextResponse.json({ data: null, error: "Task not found" }, { status: 404 });
  }

  // Employees can only update their own assigned tasks or tasks they created
  const isAdminOrManager = profile.role === "admin" || profile.role === "manager";
  const isAssignee = existingTask.assignee_id === user.id;
  const isCreator = existingTask.created_by === user.id;

  if (!isAdminOrManager && !isAssignee && !isCreator) {
    return NextResponse.json(
      { data: null, error: "Forbidden: You can only update tasks assigned to you" },
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

  const { title, description, statusId, priority, assigneeId, dueDate } = parseResult.data;

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description ?? null;
  if (statusId !== undefined) updatePayload.status_id = statusId ?? null;
  if (priority !== undefined) updatePayload.priority = priority;
  if (assigneeId !== undefined) updatePayload.assignee_id = assigneeId ?? null;
  if (dueDate !== undefined) updatePayload.due_date = dueDate && dueDate !== "" ? dueDate : null;

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
      assignee:assignee_id (id, full_name, avatar_url),
      creator:created_by (id, full_name)
    `)
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedTask, error: null });
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

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins and managers can delete tasks" },
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
