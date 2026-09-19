"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Use only in Client Components ('use client').
 * Reads/writes auth session from cookies automatically.
 */
export function createClient() {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const isProd = process.env.NODE_ENV === "production";

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions:
        isProd && appDomain
          ? {
              domain: `.${appDomain}`,
              sameSite: "lax",
              secure: true,
            }
          : undefined,
    }
  );
}
