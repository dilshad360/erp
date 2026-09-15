import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TenantProvider from "@/components/shared/TenantProvider";
import AppShell from "@/components/shared/AppShell";

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export default async function AppLayout({
  children,
  params,
}: AppLayoutProps): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const supabase = await createClient();

  // ── Verify user is authenticated ─────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect(`/login`);
  }

  // ── Fetch company ─────────────────────────────────────────────────────────
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, slug, brand_color, logo_url")
    .eq("slug", subdomain)
    .single();

  if (!company || company.id !== profile.company_id) {
    // User belongs to a different company — redirect to their correct subdomain
    const { data: correctCompany } = await supabase
      .from("companies")
      .select("slug")
      .eq("id", profile.company_id)
      .single();

    if (correctCompany) {
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dilshadcodes.com";
      redirect(`http://${correctCompany.slug}.${appDomain}/dashboard`);
    }

    redirect(`/login`);
  }

  // ── Build tenant context ──────────────────────────────────────────────────
  const tenantData = {
    companyId: company.id,
    companySlug: company.slug,
    companyName: company.name,
    brandColor: company.brand_color ?? "#6366f1",
    logoUrl: company.logo_url ?? null,
    userRole: profile.role,
    userId: profile.id,
    userName: profile.full_name ?? user.email ?? "User",
    userAvatarUrl: profile.avatar_url ?? null,
  };

  return (
    <TenantProvider tenant={tenantData}>
      <AppShell>{children}</AppShell>
    </TenantProvider>
  );
}
