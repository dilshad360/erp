import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import CompanySettingsClient, { type CompanyData } from "@/components/settings/CompanySettingsClient";
import EmployeeSettingsClient, {
  type EmployeeProfileData,
  type CompanySummaryData,
} from "@/components/settings/EmployeeSettingsClient";
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
      avatar_url
    `)
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

  const isAdmin = profile.role === "admin";

  if (isAdmin) {
    // Fetch task statuses for Kanban column management
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

    return (
      <div className="flex flex-col min-h-full">
        <PageHeader
          title="Workspace Settings"
          description="Manage company details, branding, geofence, and Kanban configuration."
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

  // Non-admin / Employee View
  const employeeProfile: EmployeeProfileData = {
    id: profile.id,
    fullName: profile.full_name,
    email: user.email || null,
    phone: profile.phone,
    role: profile.role,
    employeeId: profile.employee_id,
    department: profile.department,
    designation: profile.designation,
    dateOfJoining: profile.date_of_joining,
    avatarUrl: profile.avatar_url,
    companyId: profile.company_id,
  };

  const companySummary: CompanySummaryData = {
    name: companyData.name,
    geofenceRadiusM: companyData.geofence_radius_m ?? 200,
    officeLat: companyData.office_lat,
    officeLng: companyData.office_lng,
    brandColor: companyData.brand_color ?? "#6366f1",
    logoUrl: companyData.logo_url,
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Account & Preferences"
        description="Manage your profile, security password, preferences, and view workplace policies."
      />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 md:px-8">
        <EmployeeSettingsClient
          profile={employeeProfile}
          company={companySummary}
        />
      </div>
    </div>
  );
}
