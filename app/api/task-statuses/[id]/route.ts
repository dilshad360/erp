import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(1).optional(),
});

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

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { name, color, sortOrder } = parseResult.data;

  const updatePayload: Record<string, unknown> = {};
  if (name !== undefined) updatePayload.name = name;
  if (color !== undefined) updatePayload.color = color ?? null;
  if (sortOrder !== undefined) updatePayload.sort_order = sortOrder;

  const { data: updated, error: updateError } = await supabase
    .from("task_statuses")
    .update(updatePayload)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select("id, name, color, sort_order")
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updated, error: null });
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
    return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  // Block deletion if tasks exist in this status
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status_id", id)
    .eq("company_id", profile.company_id);

  if (count && count > 0) {
    return NextResponse.json(
      {
        data: null,
        error: `Cannot delete: ${count} task${count === 1 ? "" : "s"} are still using this status. Reassign them first.`,
      },
      { status: 409 }
    );
  }

  const { error: deleteError } = await supabase
    .from("task_statuses")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (deleteError) {
    return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id }, error: null });
}
