import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one ID required"),
});

export async function PUT(request: NextRequest): Promise<NextResponse> {
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

  const parseResult = reorderSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { ids } = parseResult.data;

  // Batch update sort_order for each status ID
  const updates = ids.map((id, index) =>
    supabase
      .from("task_statuses")
      .update({ sort_order: index + 1 })
      .eq("id", id)
      .eq("company_id", profile.company_id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) {
    return NextResponse.json({ data: null, error: firstError.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { reordered: ids.length }, error: null });
}
