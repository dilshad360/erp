import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectListClient, { type ProjectRecord, type ClientOption } from "./ProjectListClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage({
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

  // Fetch user profile to get company_id & role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch projects for tenant company
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      company_id,
      client_id,
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      created_by,
      created_at,
      client:client_id (
        id,
        name,
        contact_person
      ),
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("company_id", userProfile.company_id)
    .order("created_at", { ascending: false });

  // Fetch active clients for filter dropdown
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("company_id", userProfile.company_id)
    .order("name", { ascending: true });

  const projectList = (projects as unknown as ProjectRecord[]) || [];
  const clientList = (clients as unknown as ClientOption[]) || [];

  return (
    <ProjectListClient
      initialProjects={projectList}
      clients={clientList}
      currentUserRole={userProfile.role}
    />
  );
}
