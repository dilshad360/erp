import { createClient } from "@/lib/supabase/server";
import LoginClient, { type TenantLoginBranding } from "@/components/auth/LoginClient";
import type { Metadata } from "next";

type LoginPageProps = {
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("slug", subdomain)
    .single();

  const companyName = company?.name || subdomain;

  return {
    title: `Sign In — ${companyName}`,
    description: `Sign in to your ${companyName} multi-tenant ERP workspace.`,
  };
}

export default async function LoginPage({
  params,
}: LoginPageProps): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: companyData } = await supabase
    .from("companies")
    .select("name, slug, brand_color, logo_url")
    .eq("slug", subdomain)
    .single();

  const company: TenantLoginBranding = {
    name: companyData?.name || subdomain,
    slug: companyData?.slug || subdomain,
    brandColor: companyData?.brand_color ?? "#6366f1",
    logoUrl: companyData?.logo_url ?? null,
  };

  return <LoginClient company={company} />;
}
