import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InviteFormClient from "./InviteFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invite Employee",
};

export default async function InviteEmployeePage({
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

  // Check current profile and verify admin role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    redirect(`/${subdomain}/employees`);
  }

  // Fetch candidate managers for dropdown selector (all active employees in company)
  const { data: managerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, designation")
    .eq("company_id", userProfile.company_id)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <InviteFormClient
      managers={managerProfiles || []}
      subdomain={subdomain}
    />
  );
}
