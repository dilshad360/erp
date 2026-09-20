import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user profile and verify admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { data: null, error: "Forbidden: Only admins can upload company logos" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ data: null, error: "No logo file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { data: null, error: "Invalid file type. Only JPG, PNG, WebP, and SVG images are allowed." },
      { status: 400 }
    );
  }

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { data: null, error: "File size exceeds 2MB limit." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "png";
  const filePath = `${profile.company_id}/logo-${Date.now()}.${ext}`;

  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await adminClient.storage
    .from("logos")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { data: null, error: uploadError.message || "Failed to upload logo" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: publicUrlData } = adminClient.storage
    .from("logos")
    .getPublicUrl(filePath);

  const logoUrl = publicUrlData.publicUrl;

  // Update company record
  const { error: updateError } = await adminClient
    .from("companies")
    .update({ logo_url: logoUrl })
    .eq("id", profile.company_id);

  if (updateError) {
    return NextResponse.json(
      { data: null, error: updateError.message || "Failed to save company logo URL" },
      { status: 500 }
    );
  }

  try {
    revalidatePath("/[subdomain]", "layout");
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    data: { logoUrl },
    error: null,
  });
}
