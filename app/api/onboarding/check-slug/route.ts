import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/onboarding/check-slug?slug=acme
 * Returns { available: boolean }
 * Used by the signup form for real-time slug availability check.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug || slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  return NextResponse.json({ available: !data });
}
