import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  statusId: z.string().uuid("Invalid status ID").optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

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
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);
  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (statusId) query = query.eq("status_id", statusId);
  if (priority) query = query.eq("priority", priority);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    return NextResponse.json({ data: null, error: tasksError.message }, { status: 500 });
  }

  return NextResponse.json({ data: tasks, error: null });
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

  const { projectId, title, description, statusId, priority, assigneeId, dueDate } =
    parseResult.data;

  // Validate project belongs to company
  const { data: project, error: projectCheckError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("company_id", profile.company_id)
    .single();

  if (projectCheckError || !project) {
    return NextResponse.json(
      { data: null, error: "Project does not exist or does not belong to your organisation" },
      { status: 400 }
    );
  }

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      company_id: profile.company_id,
      project_id: projectId,
      title,
      description: description ?? null,
      status_id: statusId ?? null,
      priority: priority ?? "medium",
      assignee_id: assigneeId ?? null,
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
      assignee:assignee_id (id, full_name, avatar_url),
      creator:created_by (id, full_name)
    `)
    .single();

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newTask, error: null }, { status: 201 });
}
