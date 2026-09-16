import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current user profile
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json({ data: null, error: "Profile not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const targetEmployeeId = (formData.get("employeeId") as string | null) || user.id;

  if (!file) {
    return NextResponse.json({ data: null, error: "No image file provided" }, { status: 400 });
  }

  // Authorization check
  const isAdmin = currentProfile.role === "admin";
  const isSelf = user.id === targetEmployeeId;

  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { data: null, error: "Forbidden: You cannot upload an avatar for another user" },
      { status: 403 }
    );
  }

  // Validate file size and type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { data: null, error: "Invalid file type. Only JPG, PNG, and WebP images are allowed." },
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

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${currentProfile.company_id}/${targetEmployeeId}.${ext}`;

  const adminClient = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Convert File to ArrayBuffer for upload
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { data: null, error: uploadError.message || "Failed to upload image" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: publicUrlData } = adminClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  // Update profile avatar_url
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", targetEmployeeId)
    .eq("company_id", currentProfile.company_id);

  if (updateError) {
    return NextResponse.json(
      { data: null, error: updateError.message || "Failed to update profile avatar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { avatarUrl },
    error: null,
  });
}
