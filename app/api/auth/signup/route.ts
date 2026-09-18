import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { tenantSignupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = tenantSignupSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { fullName, email, password, subdomain } = parseResult.data;

  // Initialize service role admin client
  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Resolve company by subdomain slug
  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("id, name, slug")
    .eq("slug", subdomain.toLowerCase())
    .single();

  if (companyError || !company) {
    return NextResponse.json(
      { data: null, error: "Company workspace not found for this subdomain." },
      { status: 404 }
    );
  }

  // 2. Check if auth user already exists
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const existingUser = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    // Check if profile exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, company_id, is_active")
      .eq("id", existingUser.id)
      .single();

    if (existingProfile) {
      if (existingProfile.company_id === company.id) {
        if (existingProfile.is_active) {
          return NextResponse.json(
            { data: null, error: "An active account with this email already exists. Please sign in." },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            {
              data: { success: true, pendingApproval: true, email },
              error: null,
            },
            { status: 200 }
          );
        }
      } else {
        return NextResponse.json(
          {
            data: null,
            error: "This email is registered under another workspace. Please contact support.",
          },
          { status: 400 }
        );
      }
    }
  }

  // 3. Create user in Supabase Auth
  let userId: string;
  if (!existingUser) {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { data: null, error: authError?.message || "Failed to create account." },
        { status: 400 }
      );
    }
    userId = authData.user.id;
  } else {
    userId = existingUser.id;
    // Update password if existing orphaned auth user
    await adminClient.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: fullName },
    });
  }

  // 4. Create inactive profile record scoped to tenant company_id
  const { data: newProfile, error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: userId,
      company_id: company.id,
      full_name: fullName,
      role: "employee",
      is_active: false,
    })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json(
      { data: null, error: profileError.message || "Failed to create profile record." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        success: true,
        pendingApproval: true,
        companyName: company.name,
        profile: newProfile,
      },
      error: null,
    },
    { status: 201 }
  );
}
