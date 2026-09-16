import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewClientFormClient from "./NewClientFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Client",
};

export default async function NewClientPage({
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

  // Fetch user profile to check role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    redirect(`/${subdomain}/login`);
  }

  // Only admins and managers can create clients
  if (userProfile.role !== "admin" && userProfile.role !== "manager") {
    redirect(`/clients`);
  }

  return <NewClientFormClient />;
}
