import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkInSchema = z.object({
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
    body = {};
  }

  const parseResult = checkInSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { lat, lng } = parseResult.data;

  // ── Check for existing open log today ────────────────────────────────────
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: existingLog } = await supabase
    .from("attendance_logs")
    .select("id, check_out_at")
    .eq("user_id", user.id)
    .gte("check_in_at", `${today}T00:00:00.000Z`)
    .lte("check_in_at", `${today}T23:59:59.999Z`)
    .maybeSingle();

  if (existingLog) {
    return NextResponse.json(
      { data: null, error: "Already checked in today. Please check out first." },
      { status: 409 }
    );
  }

  // ── Record check-in ───────────────────────────────────────────────────────
  let logId: string;

  if (lat != null && lng != null) {
    // Use the RPC which handles geofence check atomically
    const { data: rpcData, error: rpcError } = await supabase.rpc("record_check_in", {
      p_user_id: user.id,
      p_lat: lat,
      p_lng: lng,
    });

    if (rpcError || !rpcData) {
      return NextResponse.json(
        { data: null, error: rpcError?.message ?? "Failed to record check-in" },
        { status: 500 }
      );
    }

    logId = rpcData as string;
  } else {
    // Location denied — insert directly with null coords and null range
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
    }

    const { data: insertData, error: insertError } = await supabase
      .from("attendance_logs")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        check_in_at: new Date().toISOString(),
        check_in_lat: null,
        check_in_lng: null,
        check_in_range: null,
      })
      .select("id")
      .single();

    if (insertError || !insertData) {
      return NextResponse.json(
        { data: null, error: insertError?.message ?? "Failed to record check-in" },
        { status: 500 }
      );
    }

    logId = insertData.id;
  }

  // ── Fetch and return the new log row ──────────────────────────────────────
  const { data: log, error: fetchError } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (fetchError || !log) {
    return NextResponse.json(
      { data: null, error: "Check-in recorded but failed to fetch log" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: log, error: null });
}
