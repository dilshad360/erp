import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateBrandCss } from "@/lib/branding";
import type { Metadata } from "next";

type TenantLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata({
  params,
}: TenantLayoutProps): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("slug", subdomain)
    .single();

  return {
    title: {
      default: company?.name ?? subdomain,
      template: `%s — ${company?.name ?? subdomain}`,
    },
    robots: { index: false, follow: false },
  };
}

export default async function SubdomainRootLayout({
  children,
  params,
}: TenantLayoutProps): Promise<React.JSX.Element> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, slug, brand_color")
    .eq("slug", subdomain)
    .single();

  if (!company) {
    notFound();
  }

  const brandCss = generateBrandCss(company.brand_color);

  return (
    <>
      <style id="tenant-brand-theme" dangerouslySetInnerHTML={{ __html: brandCss }} />
      {children}
    </>
  );
}
