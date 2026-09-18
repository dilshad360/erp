import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

export async function DELETE(
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

  // Prevent admin from deleting themselves
  if (user.id === id) {
    return NextResponse.json(
      { data: null, error: "You cannot reject or delete your own account" },
      { status: 400 }
    );
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
      { data: null, error: "Forbidden: Only admins can reject pending accounts" },
      { status: 403 }
    );
  }

  // Initialize service role admin client
  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check target employee exists in same tenant
  const { data: targetProfile, error: targetError } = await adminClient
    .from("profiles")
    .select("id, company_id, full_name, is_active")
    .eq("id", id)
    .eq("company_id", currentProfile.company_id)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json(
      { data: null, error: "Target employee profile not found in your workspace" },
      { status: 404 }
    );
  }

  // Delete profile record first
  const { error: deleteProfileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", id);

  if (deleteProfileError) {
    return NextResponse.json(
      { data: null, error: deleteProfileError.message || "Failed to delete profile" },
      { status: 500 }
    );
  }

  // Delete auth user from Supabase Auth
  await adminClient.auth.admin.deleteUser(id);

  return NextResponse.json({ data: { success: true }, error: null });
}
