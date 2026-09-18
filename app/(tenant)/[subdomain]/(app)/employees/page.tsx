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

  // Fetch all profiles for the current tenant company (both active & pending)
  const { data: allProfiles } = await supabase
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
    .order("created_at", { ascending: false });

  const rawList = (allProfiles as unknown as EmployeeProfile[]) || [];
  const activeEmployees = rawList.filter((e) => e.is_active);
  const pendingEmployees = rawList.filter((e) => !e.is_active);

  const managerOptions = activeEmployees
    .filter((e) => e.role === "admin" || e.role === "manager")
    .map((e) => ({
      id: e.id,
      full_name: e.full_name,
      designation: e.designation,
    }));

  return (
    <EmployeeListClient
      initialEmployees={activeEmployees}
      initialPendingEmployees={pendingEmployees}
      managerOptions={managerOptions}
      subdomain={subdomain}
      currentUserRole={userProfile.role}
    />
  );
}
