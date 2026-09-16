import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { z } from "zod";

const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  dateOfJoining: z.string().optional(), // YYYY-MM-DD
  reportingManagerId: z.string().uuid().nullable().optional(),
  role: z.enum(["admin", "manager", "employee"]).default("employee"),
});

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current user's profile to get company_id
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  // Fetch all active employees for this company
  const { data: employees, error: employeesError } = await supabase
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
    .eq("company_id", currentProfile.company_id)
    .order("created_at", { ascending: false });

  if (employeesError) {
    return NextResponse.json({ data: null, error: employeesError.message }, { status: 500 });
  }

  return NextResponse.json({ data: employees, error: null });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is an admin
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
      { data: null, error: "Forbidden: Only admins can invite employees" },
      { status: 403 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = inviteEmployeeSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const {
    email,
    fullName,
    employeeId,
    department,
    designation,
    dateOfJoining,
    reportingManagerId,
    role,
  } = parseResult.data;

  // Initialize service role admin client to send invite email and bypass user signups
  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Construct invite redirect URL using request origin
  const origin = request.nextUrl.origin;
  const redirectTo = `${origin}/set-password`;

  let newUserId: string;

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

  if (inviteError) {
    if (inviteError.message.toLowerCase().includes("already been registered")) {
      // Find existing user in Supabase Auth
      const { data: userData } = await adminClient.auth.admin.listUsers();
      const existingUser = userData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        // Check if profile exists
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id, is_active")
          .eq("id", existingUser.id)
          .single();

        if (existingProfile) {
          if (existingProfile.is_active) {
            return NextResponse.json(
              { data: null, error: "An active employee with this email address is already registered." },
              { status: 400 }
            );
          }

          // Deactivated employee being re-invited — reactivate profile & update details
          const { data: reactivatedProfile, error: updateError } = await adminClient
            .from("profiles")
            .update({
              company_id: currentProfile.company_id,
              full_name: fullName,
              employee_id: employeeId || null,
              department: department || null,
              designation: designation || null,
              date_of_joining: dateOfJoining || null,
              reporting_manager_id: reportingManagerId || null,
              role: role || "employee",
              is_active: true,
            })
            .eq("id", existingUser.id)
            .select()
            .single();

          if (updateError) {
            return NextResponse.json(
              { data: null, error: updateError.message },
              { status: 500 }
            );
          }

          // Resend invite link
          await adminClient.auth.admin.generateLink({
            type: "invite",
            email,
            options: { redirectTo },
          });

          return NextResponse.json({ data: reactivatedProfile, error: null });
        }

        // Auth user exists but profile was deleted — re-use auth user ID and resend link
        newUserId = existingUser.id;
        await adminClient.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo },
        });
      } else {
        return NextResponse.json(
          { data: null, error: inviteError.message },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { data: null, error: inviteError.message },
        { status: 500 }
      );
    }
  } else if (!inviteData.user) {
    return NextResponse.json(
      { data: null, error: "Failed to send invitation" },
      { status: 500 }
    );
  } else {
    newUserId = inviteData.user.id;
  }

  // Insert profile row for newly invited employee
  const { data: newProfile, error: insertError } = await adminClient
    .from("profiles")
    .insert({
      id: newUserId,
      company_id: currentProfile.company_id,
      full_name: fullName,
      employee_id: employeeId || null,
      department: department || null,
      designation: designation || null,
      date_of_joining: dateOfJoining || null,
      reporting_manager_id: reportingManagerId || null,
      role: role || "employee",
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up auth user if profile insertion failed
    await adminClient.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { data: null, error: insertError.message || "Failed to create profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: newProfile, error: null });
}
