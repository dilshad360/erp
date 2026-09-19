import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(150).optional(),
    clientId: z.string().uuid("Please select a valid client").optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(["active", "on_hold", "completed", "cancelled"]).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)")
      .optional()
      .nullable()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
      .optional()
      .nullable()
      .or(z.literal("")),
    budget: z.coerce
      .number()
      .min(0, "Budget cannot be negative")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.startDate !== "" && data.endDate !== "") {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    }
  );

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
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
    .eq("company_id", profile.company_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ data: null, error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ data: project, error: null });
}

export async function PUT(
  request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Verify role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins and managers can update projects" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateProjectSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const payload = parseResult.data;
  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description || null;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.startDate !== undefined) {
    updateData.start_date = payload.startDate && payload.startDate !== "" ? payload.startDate : null;
  }
  if (payload.endDate !== undefined) {
    updateData.end_date = payload.endDate && payload.endDate !== "" ? payload.endDate : null;
  }
  if (payload.budget !== undefined) {
    updateData.budget = payload.budget !== null && !isNaN(payload.budget) ? payload.budget : null;
  }

  // If client_id is updated, verify it belongs to this company
  if (payload.clientId !== undefined) {
    const { data: client, error: clientCheckError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", payload.clientId)
      .eq("company_id", profile.company_id)
      .single();

    if (clientCheckError || !client) {
      return NextResponse.json(
        { data: null, error: "Selected client does not exist or belong to your organization" },
        { status: 400 }
      );
    }
    updateData.client_id = payload.clientId;
  }

  const { data: updatedProject, error: updateError } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("company_id", profile.company_id)
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
        name
      )
    `)
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedProject, error: null });
}

export async function DELETE(
  request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Verify role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins and managers can delete or archive projects" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const isHardDelete = searchParams.get("hard") === "true";

  if (isHardDelete) {
    // Hard delete project — DB cascade will remove linked tasks and task assignees
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (deleteError) {
      return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id, deleted: true }, error: null });
  }

  // Soft delete / archive — set status to 'cancelled'
  const { data: cancelledProject, error: archiveError } = await supabase
    .from("projects")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (archiveError) {
    return NextResponse.json({ data: null, error: archiveError.message }, { status: 500 });
  }

  return NextResponse.json({ data: cancelledProject, error: null });
}
