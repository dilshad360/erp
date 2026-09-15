import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Updates the Supabase session on every request.
 * Called by middleware.ts — this must run on every route so tokens stay fresh.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on both the request (for downstream) and response (for client)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Scope to root domain so all tenant subdomains share the session
              domain: process.env.NEXT_PUBLIC_APP_DOMAIN
                ? `.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
                : undefined,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not remove this.
  // It silently refreshes expired tokens. Without it, users get logged out mid-session.
  await supabase.auth.getUser();

  return supabaseResponse;
}
