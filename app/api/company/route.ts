import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100).optional(),
  gst_number: z.string().max(20).nullable().optional(),
  office_lat: z.number().min(-90).max(90).nullable().optional(),
  office_lng: z.number().min(-180).max(180).nullable().optional(),
  geofence_radius_m: z.number().min(50).max(5000).optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-character hex color (e.g. #6366f1)")
    .optional(),
  logo_url: z.string().url().nullable().optional(),
});

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug, gst_number, office_lat, office_lng, geofence_radius_m, brand_color, logo_url")
    .eq("id", profile.company_id)
    .single();

  if (companyError || !company) {
    return NextResponse.json({ data: null, error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ data: company, error: null });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only company admins can change workspace settings" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateCompanySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const updateFields = parseResult.data;

  const { data: updatedCompany, error: updateError } = await supabase
    .from("companies")
    .update(updateFields)
    .eq("id", profile.company_id)
    .select("id, name, slug, gst_number, office_lat, office_lng, geofence_radius_m, brand_color, logo_url")
    .single();

  if (updateError || !updatedCompany) {
    return NextResponse.json(
      { data: null, error: updateError?.message || "Failed to update company settings" },
      { status: 500 }
    );
  }

  // Invalidate server layout caches so brand styling and tenant metadata update immediately
  try {
    revalidatePath("/[subdomain]", "layout");
  } catch {
    // Non-fatal if called in isolated context
  }

  return NextResponse.json({ data: updatedCompany, error: null });
}
