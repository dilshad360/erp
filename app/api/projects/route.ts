import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(150),
    clientId: z.string().uuid("Please select a valid client"),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(["active", "on_hold", "completed", "cancelled"]).default("active"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)")
      .optional()
      .nullable()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
      .optional()
      .nullable()
      .or(z.literal("")),
    budget: z.coerce
      .number()
      .min(0, "Budget cannot be negative")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.startDate !== "" && data.endDate !== "") {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    }
  );

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Get current user's company_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("projects")
    .select(`
      id,
      company_id,
      client_id,
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      created_by,
      created_at,
      client:client_id (
        id,
        name,
        contact_person
      ),
      creator:created_by (
        id,
        full_name
      )
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: projects, error: projectsError } = await query;

  if (projectsError) {
    return NextResponse.json({ data: null, error: projectsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: projects, error: null });
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

  // Verify user is admin or manager
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
      { data: null, error: "Forbidden: Only admins and managers can create projects" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createProjectSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { name, clientId, description, status, startDate, endDate, budget } =
    parseResult.data;

  // Validate that the chosen client belongs to the user's company
  const { data: client, error: clientCheckError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("company_id", profile.company_id)
    .single();

  if (clientCheckError || !client) {
    return NextResponse.json(
      { data: null, error: "Selected client does not exist or belong to your organization" },
      { status: 400 }
    );
  }

  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      company_id: profile.company_id,
      client_id: clientId,
      name,
      description: description || null,
      status: status ?? "active",
      start_date: startDate && startDate !== "" ? startDate : null,
      end_date: endDate && endDate !== "" ? endDate : null,
      budget: budget !== undefined && budget !== null && !isNaN(budget) ? budget : null,
      created_by: user.id,
    })
    .select(`
      id,
      company_id,
      client_id,
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      created_by,
      created_at,
      client:client_id (
        id,
        name
      )
    `)
    .single();

  if (insertError) {
    return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newProject, error: null }, { status: 201 });
}
