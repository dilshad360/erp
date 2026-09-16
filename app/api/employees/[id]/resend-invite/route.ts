import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

export async function POST(
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

  // Check admin role & company_id
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
      { data: null, error: "Forbidden: Only admins can resend invitations" },
      { status: 403 }
    );
  }

  // Verify target employee exists in same company
  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", id)
    .eq("company_id", currentProfile.company_id)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json(
      { data: null, error: "Employee profile not found" },
      { status: 404 }
    );
  }

  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get user email from Supabase Auth
  const { data: authUserData, error: authUserError } =
    await adminClient.auth.admin.getUserById(id);

  if (authUserError || !authUserData.user?.email) {
    return NextResponse.json(
      { data: null, error: "Could not find registered email for employee" },
      { status: 404 }
    );
  }

  const origin = request.nextUrl.origin;
  const redirectTo = `${origin}/set-password`;

  // Try resending invite email via admin client
  let { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    authUserData.user.email,
    { redirectTo }
  );

  // If user is already registered in Auth, generate a recovery/reset password link instead
  if (
    inviteError &&
    (inviteError.message.toLowerCase().includes("already been registered") ||
      inviteError.message.toLowerCase().includes("email_exists"))
  ) {
    const { error: recoveryError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: authUserData.user.email,
      options: { redirectTo },
    });
    inviteError = recoveryError;
  }

  if (inviteError) {
    return NextResponse.json(
      { data: null, error: inviteError.message || "Failed to resend invitation email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { success: true, email: authUserData.user.email },
    error: null,
  });
}
