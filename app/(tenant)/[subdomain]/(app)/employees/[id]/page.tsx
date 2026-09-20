import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProfileDetailClient from "./ProfileDetailClient";
import type { EmployeeProfile } from "../EmployeeListClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Profile",
};

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ subdomain: string; id: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${subdomain}/login`);
  }

  // Get current user profile
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!currentUserProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch target employee profile
  const { data: rawEmployee } = await supabase
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
    .eq("company_id", currentUserProfile.company_id)
    .single();

  if (!rawEmployee) {
    notFound();
  }

  const rm = Array.isArray(rawEmployee.reporting_manager)
    ? rawEmployee.reporting_manager[0] || null
    : rawEmployee.reporting_manager || null;

  // Retrieve auth email for target employee
  let employeeEmail: string | null = null;
  if (user.id === id) {
    employeeEmail = user.email || null;
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createAdminSupabase } = await import("@supabase/supabase-js");
      const adminClient = createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: authUserData } = await adminClient.auth.admin.getUserById(id);
      employeeEmail = authUserData?.user?.email || null;
    } catch {
      // Graceful fallback if admin client fails
    }
  }

  const employee: EmployeeProfile = {
    ...rawEmployee,
    email: employeeEmail,
    reporting_manager: rm,
  };

  // Fetch all active profiles in company for manager dropdown selection
  const { data: managers } = await supabase
    .from("profiles")
    .select("id, full_name, designation")
    .eq("company_id", currentUserProfile.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <ProfileDetailClient
      employee={employee}
      managers={managers || []}
      currentUserId={user.id}
      currentUserRole={currentUserProfile.role}
      subdomain={subdomain}
    />
  );
}
