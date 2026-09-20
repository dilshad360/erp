import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).optional(),
  employeeId: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  dateOfJoining: z.string().nullable().optional(),
  reportingManagerId: z.string().uuid().nullable().optional(),
  role: z.enum(["admin", "manager", "employee"]).optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
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

  // Get current user profile for tenant scoping
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  // Fetch target employee profile
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select(`
      id,
      company_id,
      full_name,
      role,
      phone,
      employee_id,
      department,
      designation,
      date_of_joining,
      reporting_manager_id,
      avatar_url,
      is_active,
      created_at,
      reporting_manager:reporting_manager_id (
        id,
        full_name
      )
    `)
    .eq("id", id)
    .eq("company_id", currentProfile.company_id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json(
      { data: null, error: "Employee profile not found" },
      { status: 404 }
    );
  }

  let employeeEmail: string | null = null;
  if (user.id === id) {
    employeeEmail = user.email || null;
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: authUserData } = await adminClient.auth.admin.getUserById(id);
      employeeEmail = authUserData?.user?.email || null;
    } catch {
      // Graceful fallback
    }
  }

  return NextResponse.json({ data: { ...profile, email: employeeEmail }, error: null });
}

export async function PUT(
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

  // Fetch current user's role and company_id
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const isAdmin = currentProfile.role === "admin";
  const isSelf = user.id === id;

  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { data: null, error: "Forbidden: You cannot edit another employee's profile" },
      { status: 403 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateEmployeeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  const data = parseResult.data;

  if (isAdmin) {
    // Admin can update all fields (including reactivating by setting isActive: true)
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.employeeId !== undefined) updates.employee_id = data.employeeId;
    if (data.department !== undefined) updates.department = data.department;
    if (data.designation !== undefined) updates.designation = data.designation;
    if (data.dateOfJoining !== undefined) updates.date_of_joining = data.dateOfJoining;
    if (data.reportingManagerId !== undefined) updates.reporting_manager_id = data.reportingManagerId;
    if (data.role !== undefined) updates.role = data.role;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
  } else {
    // Non-admin employee editing self can only update phone and avatarUrl
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: null, error: "No fields provided to update" }, { status: 400 });
  }

  // Admin client for updates to bypass strict self-only update RLS if admin updates another user
  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .eq("company_id", currentProfile.company_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedProfile, error: null });
}

export async function DELETE(
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

  // Check admin role
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (currentProfile.role !== "admin") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins can deactivate or delete employees" },
      { status: 403 }
    );
  }

  if (id === user.id) {
    return NextResponse.json(
      { data: null, error: "You cannot deactivate or delete your own admin account" },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "delete";

  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (action === "deactivate") {
    // Soft delete: set is_active = false
    const { data: deactivatedProfile, error: deactivateError } = await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id)
      .eq("company_id", currentProfile.company_id)
      .select()
      .single();

    if (deactivateError) {
      return NextResponse.json({ data: null, error: deactivateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: deactivatedProfile, error: null });
  }

  // Hard delete: delete profile row + delete auth user
  const { error: profileDeleteError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("company_id", currentProfile.company_id);

  if (profileDeleteError) {
    return NextResponse.json(
      { data: null, error: profileDeleteError.message || "Failed to delete profile" },
      { status: 500 }
    );
  }

  // Delete auth user from Supabase Auth
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(id);

  if (authDeleteError) {
    // Non-fatal if profile was already deleted
    console.warn("Auth user delete warning:", authDeleteError.message);
  }

  return NextResponse.json({ data: { success: true, deletedId: id }, error: null });
}
