import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import CompanySettingsClient, { type CompanyData } from "@/components/settings/CompanySettingsClient";
import type { Metadata } from "next";
import type { TaskStatusRow } from "@/components/tasks/KanbanColumnManager";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch company details
  const { data: companyData } = await supabase
    .from("companies")
    .select("id, name, slug, gst_number, office_lat, office_lng, geofence_radius_m, brand_color, logo_url")
    .eq("id", profile.company_id)
    .single();

  if (!companyData) {
    redirect(`/${subdomain}/login`);
  }

  // Fetch task statuses
  const { data: statusesData } = await supabase
    .from("task_statuses")
    .select("id, name, color, sort_order")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: true });

  const statuses: TaskStatusRow[] = (statusesData ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color ?? null,
    sort_order: s.sort_order,
  }));

  const company: CompanyData = {
    id: companyData.id,
    name: companyData.name,
    slug: companyData.slug,
    gst_number: companyData.gst_number,
    office_lat: companyData.office_lat,
    office_lng: companyData.office_lng,
    geofence_radius_m: companyData.geofence_radius_m ?? 200,
    brand_color: companyData.brand_color ?? "#6366f1",
    logo_url: companyData.logo_url,
  };

  const isAdmin = profile.role === "admin";

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        description="Manage your workspace details, branding, geofence, and Kanban configuration."
      />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 md:px-8">
        <CompanySettingsClient
          company={company}
          statuses={statuses}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
