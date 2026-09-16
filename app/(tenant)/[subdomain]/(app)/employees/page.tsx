import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EmployeeListClient, { type EmployeeProfile } from "./EmployeeListClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employees",
};

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch logged in user profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch employees for the current tenant company
  const { data: employees } = await supabase
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
    .eq("company_id", userProfile.company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const employeeList = (employees as unknown as EmployeeProfile[]) || [];

  return (
    <EmployeeListClient
      initialEmployees={employeeList}
      subdomain={subdomain}
      currentUserRole={userProfile.role}
    />
  );
}
