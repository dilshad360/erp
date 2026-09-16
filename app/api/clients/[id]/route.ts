import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const updateClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(120).optional(),
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
  status: z.enum(["active", "inactive"]).optional(),
});

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  // Fetch client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ data: null, error: "Client not found" }, { status: 404 });
  }

  // Attempt to fetch project count if projects table exists
  let projectCount = 0;
  try {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("company_id", profile.company_id);

    projectCount = count ?? 0;
  } catch {
    projectCount = 0;
  }

  return NextResponse.json({
    data: {
      ...client,
      projectCount,
    },
    error: null,
  });
}

export async function PUT(
  request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
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
      { data: null, error: "Forbidden: Only admins and managers can update clients" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateClientSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const payload = parseResult.data;
  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.contactPerson !== undefined) updateData.contact_person = payload.contactPerson || null;
  if (payload.email !== undefined) {
    updateData.email = payload.email && payload.email.length > 0 ? payload.email : null;
  }
  if (payload.phone !== undefined) updateData.phone = payload.phone || null;
  if (payload.address !== undefined) updateData.address = payload.address || null;
  if (payload.gstNumber !== undefined) {
    updateData.gst_number = payload.gstNumber && payload.gstNumber.length > 0 ? payload.gstNumber : null;
  }
  if (payload.notes !== undefined) updateData.notes = payload.notes || null;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data: updatedClient, error: updateError } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedClient, error: null });
}

export async function DELETE(
  _request: NextRequest,
  props: RouteProps
): Promise<NextResponse> {
  const { id } = await props.params;
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
      { data: null, error: "Forbidden: Only admins and managers can deactivate clients" },
      { status: 403 }
    );
  }

  // Soft delete — set status to 'inactive'
  const { data: deactivatedClient, error: deleteError } = await supabase
    .from("clients")
    .update({ status: "inactive" })
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (deleteError) {
    return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ data: deactivatedClient, error: null });
}
