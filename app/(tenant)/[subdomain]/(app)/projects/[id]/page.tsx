import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProjectDetailClient, { type ProjectDetailData } from "./ProjectDetailClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: project?.name ? `${project.name} — Projects` : "Project Details",
  };
}

export default async function ProjectDetailPage({
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

  // Fetch user profile to get company_id & role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch project details
  const { data: project, error: projectError } = await supabase
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
        contact_person,
        email,
        phone
      ),
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("id", id)
    .eq("company_id", userProfile.company_id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch active clients for edit form ClientSelect
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("company_id", userProfile.company_id)
    .eq("status", "active")
    .order("name", { ascending: true });

  return (
    <ProjectDetailClient
      initialProject={project as unknown as ProjectDetailData}
      clients={clients || []}
      currentUserRole={userProfile.role}
    />
  );
}
