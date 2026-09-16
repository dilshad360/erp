import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewProjectFormClient from "./NewProjectFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Project",
};

export default async function NewProjectPage({
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

  // Fetch user profile to check role & company_id
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Only admins and managers can create projects
  if (userProfile.role !== "admin" && userProfile.role !== "manager") {
    redirect(`/projects`);
  }

  // Fetch active clients for the selector
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_person")
    .eq("company_id", userProfile.company_id)
    .eq("status", "active")
    .order("name", { ascending: true });

  return <NewProjectFormClient clients={clients || []} />;
}
