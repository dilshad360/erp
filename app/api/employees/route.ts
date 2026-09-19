import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase
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

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: employees, error: employeesError } = await query;

  if (employeesError) {
    return NextResponse.json({ data: null, error: employeesError.message }, { status: 500 });
  }

  return NextResponse.json({ data: employees, error: null });
}
