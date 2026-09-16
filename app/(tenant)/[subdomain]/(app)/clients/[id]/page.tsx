import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ClientDetailClient, { type LinkedProject } from "./ClientDetailClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: client?.name ? `${client.name} — Clients` : "Client Details",
  };
}

export default async function ClientDetailPage({
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

  // Fetch client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", userProfile.company_id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Safely fetch linked projects
  let linkedProjects: LinkedProject[] = [];
  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status, start_date, end_date, budget")
      .eq("client_id", id)
      .eq("company_id", userProfile.company_id)
      .order("created_at", { ascending: false });

    if (projects) {
      linkedProjects = projects as LinkedProject[];
    }
  } catch {
    linkedProjects = [];
  }

  return (
    <ClientDetailClient
      initialClient={client}
      initialProjects={linkedProjects}
      currentUserRole={userProfile.role}
    />
  );
}
