import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createStatusSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #6366f1)")
    .optional()
    .nullable(),
});

export async function GET(_request: NextRequest): Promise<NextResponse> {
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

  const { data: statuses, error } = await supabase
    .from("task_statuses")
    .select("id, name, color, sort_order, created_at")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: statuses, error: null });
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
      { data: null, error: "Forbidden: Only admins and managers can create task statuses" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  // Get next sort_order
  const { data: lastStatus } = await supabase
    .from("task_statuses")
    .select("sort_order")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = lastStatus ? lastStatus.sort_order + 1 : 1;

  const { data: newStatus, error: insertError } = await supabase
    .from("task_statuses")
    .insert({
      company_id: profile.company_id,
      name: parseResult.data.name,
      color: parseResult.data.color ?? null,
      sort_order: nextOrder,
    })
    .select("id, name, color, sort_order, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newStatus, error: null }, { status: 201 });
}
