import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// GST number format for Indian companies: 2-digit state code + 10-char PAN + 1 entity + 1 'Z' + 1 check digit
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(120),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstRegex, "Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().trim().max(1500).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current user's profile to get company_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("clients")
    .select(`
      *,
      projects (
        id
      )
    `)
    .eq("company_id", profile.company_id)
    .order("name", { ascending: true });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: clients, error: clientsError } = await query;

  if (clientsError) {
    return NextResponse.json({ data: null, error: clientsError.message }, { status: 500 });
  }

  const formattedClients = ((clients as unknown as Array<Record<string, unknown>>) || []).map((c) => {
    const rawProjects = (c.projects as Array<{ id: string }> | null) || [];
    return {
      ...c,
      project_count: rawProjects.length,
    };
  });

  return NextResponse.json({ data: formattedClients, error: null });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is an admin or manager
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins and managers can create clients" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = clientSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { name, contactPerson, email, phone, address, gstNumber, notes, status } =
    parseResult.data;

  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert({
      company_id: profile.company_id,
      name,
      contact_person: contactPerson || null,
      email: email && email.length > 0 ? email : null,
      phone: phone || null,
      address: address || null,
      gst_number: gstNumber && gstNumber.length > 0 ? gstNumber : null,
      notes: notes || null,
      status: status ?? "active",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newClient, error: null }, { status: 201 });
}
