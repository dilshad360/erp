import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkOutSchema = z.object({
  logId: z.string().uuid("Invalid log ID"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = checkOutSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { logId, lat, lng } = parseResult.data;

  // ── Validate: log belongs to current user and is still open ──────────────
  const { data: existingLog, error: logError } = await supabase
    .from("attendance_logs")
    .select("id, user_id, check_out_at, company_id")
    .eq("id", logId)
    .single();

  if (logError || !existingLog) {
    return NextResponse.json({ data: null, error: "Attendance log not found" }, { status: 404 });
  }

  if (existingLog.user_id !== user.id) {
    return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  if (existingLog.check_out_at !== null) {
    return NextResponse.json(
      { data: null, error: "Already checked out for this session." },
      { status: 409 }
    );
  }

  // ── Compute check-out range server-side via SQL ───────────────────────────
  let checkOutRange: boolean | null = null;

  if (lat != null && lng != null) {
    // Fetch company geofence
    const { data: company } = await supabase
      .from("companies")
      .select("office_lat, office_lng, geofence_radius_m")
      .eq("id", existingLog.company_id)
      .single();

    if (company?.office_lat != null && company?.office_lng != null) {
      // Call haversine via RPC to avoid duplicating logic
      const { data: distance } = await supabase.rpc("haversine_distance", {
        lat1: lat,
        lng1: lng,
        lat2: company.office_lat,
        lng2: company.office_lng,
      });

      if (typeof distance === "number") {
        checkOutRange = distance <= (company.geofence_radius_m ?? 200);
      }
    } else {
      // No geofence configured — treat as in-range
      checkOutRange = true;
    }
  }

  // ── Update log with checkout data ─────────────────────────────────────────
  const { data: updatedLog, error: updateError } = await supabase
    .from("attendance_logs")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: lat ?? null,
      check_out_lng: lng ?? null,
      check_out_range: checkOutRange,
    })
    .eq("id", logId)
    .select("*")
    .single();

  if (updateError || !updatedLog) {
    return NextResponse.json(
      { data: null, error: updateError?.message ?? "Failed to record checkout" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: updatedLog, error: null });
}
