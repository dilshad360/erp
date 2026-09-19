import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientListClient, { type ClientRecord } from "./ClientListClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage({
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

  // Fetch clients for the current tenant company with project counts
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      projects (
        id
      )
    `)
    .eq("company_id", userProfile.company_id)
    .order("name", { ascending: true });

  const clientList = ((clients as unknown as Array<Record<string, unknown>>) || []).map((c) => {
    const rawProjects = (c.projects as Array<{ id: string }> | null) || [];
    return {
      ...c,
      project_count: rawProjects.length,
    } as unknown as ClientRecord;
  });

  return (
    <ClientListClient
      initialClients={clientList}
      subdomain={subdomain}
      currentUserRole={userProfile.role}
    />
  );
}
