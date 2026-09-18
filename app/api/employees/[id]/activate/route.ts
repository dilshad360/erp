import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { activateEmployeeSchema } from "@/lib/validations/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Verify current user is admin in this tenant
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (currentProfile.role !== "admin") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins can activate employee accounts" },
      { status: 403 }
    );
  }

  // Parse body
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is acceptable if using defaults
  }

  const parseResult = activateEmployeeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { role, employeeId, department, designation, dateOfJoining, reportingManagerId } =
    parseResult.data;

  // Initialize service role admin client
  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check target employee exists in same tenant
  const { data: targetProfile, error: targetError } = await adminClient
    .from("profiles")
    .select("id, company_id, full_name")
    .eq("id", id)
    .eq("company_id", currentProfile.company_id)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json(
      { data: null, error: "Target employee profile not found in your workspace" },
      { status: 404 }
    );
  }

  // Update profile to active and assign role & metadata
  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({
      is_active: true,
      role: role || "employee",
      employee_id: employeeId || null,
      department: department || null,
      designation: designation || null,
      date_of_joining: dateOfJoining || new Date().toISOString().split("T")[0],
      reporting_manager_id: reportingManagerId || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedProfile, error: null });
}
