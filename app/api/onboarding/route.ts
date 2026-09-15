import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ── Validation ─────────────────────────────────────────────────────────────

const onboardingSchema = z.object({
  companyName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  gstNumber: z.string().optional(),
  adminName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

type OnboardingBody = z.infer<typeof onboardingSchema>;

// ── Default task statuses seeded for every new company ───────────────────

const DEFAULT_TASK_STATUSES = [
  { name: "To Do",       sort_order: 1, color: "#6366f1" },
  { name: "In Progress", sort_order: 2, color: "#f59e0b" },
  { name: "In Review",   sort_order: 3, color: "#38bdf8" },
  { name: "Done",        sort_order: 4, color: "#22c55e" },
];

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = onboardingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.errors[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { companyName, slug, gstNumber, adminName, email, password } = result.data;

  // Service role client — server-only, never expose to client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── 1. Check slug uniqueness ──────────────────────────────────────────
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { data: null, error: "This subdomain is already taken. Please choose another." },
      { status: 409 }
    );
  }

  // ── 2. Create Supabase auth user ──────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification for MVP
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { data: null, error: authError?.message ?? "Failed to create account" },
      { status: 500 }
    );
  }

  const userId = authData.user.id;

  // ── 3. Create company row ─────────────────────────────────────────────
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: companyName,
      slug,
      gst_number: gstNumber ?? null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    // Roll back auth user creation
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { data: null, error: "Failed to create company" },
      { status: 500 }
    );
  }

  // ── 4. Create admin profile ───────────────────────────────────────────
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    company_id: company.id,
    full_name: adminName,
    role: "admin",
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from("companies").delete().eq("id", company.id);
    return NextResponse.json(
      { data: null, error: "Failed to create admin profile" },
      { status: 500 }
    );
  }

  // ── 5. Seed default task statuses ────────────────────────────────────
  const statusRows = DEFAULT_TASK_STATUSES.map((s) => ({
    ...s,
    company_id: company.id,
  }));

  // Non-fatal — company is created even if status seeding fails
  await supabase.from("task_statuses").insert(statusRows);

  // ── Done ─────────────────────────────────────────────────────────────
  return NextResponse.json({
    data: { companySlug: slug },
    error: null,
  });
}
