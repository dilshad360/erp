import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

/**
 * ⚠️  CRITICAL FILE — requires human review before any changes.
 * A bug here breaks routing for every tenant.
 *
 * Responsibilities:
 * 1. Refresh Supabase auth tokens on every request.
 * 2. Detect the subdomain from the Host header.
 * 3. Look up the tenant company by slug.
 * 4. Rewrite the URL to the tenant route tree, or serve marketing routes.
 * 5. Redirect unauthenticated users on tenant routes to login.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") ?? "";

  // ── Step 1: Refresh session ──────────────────────────────────────────────
  const sessionResponse = await updateSession(request);

  // ── Step 2: Extract subdomain ────────────────────────────────────────────
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "erp.dilshadcodes.com";
  const hostWithoutPort = hostname.split(":")[0];

  // Matches: acme.erp.dilshadcodes.com:3000 → "acme"
  // Matches: acme.localhost:3000            → "acme" (native local browser subdomain)
  // Matches: erp.dilshadcodes.com          → null   (marketing)
  // Matches: localhost                     → null   (marketing, local dev)
  let subdomain: string | null = null;

  if (hostWithoutPort.endsWith(`.${appDomain}`)) {
    subdomain = hostWithoutPort.slice(0, -(appDomain.length + 1));
  } else if (hostWithoutPort.endsWith(".localhost")) {
    subdomain = hostWithoutPort.slice(0, -".localhost".length);
  }

  // ── Step 3: No subdomain → serve marketing routes ────────────────────────
  if (!subdomain) {
    // Already hits (marketing) route group naturally — no rewrite needed
    return sessionResponse;
  }

  // ── Step 4: Subdomain detected → look up tenant ──────────────────────────
  // We need a Supabase client here to verify the slug exists.
  // Using the anon key is fine — we're just reading the company slug (public).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Cookies are handled by updateSession above
        },
      },
    }
  );

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, slug")
    .eq("slug", subdomain)
    .single();

  if (companyError || !company) {
    console.error("[middleware] Subdomain lookup failed:", { subdomain, companyError, company });
    return NextResponse.rewrite(new URL("/workspace-not-found", request.url));
  }

  // ── Step 5: Check auth for tenant routes ──────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = url.pathname === "/login";
  const isSetPasswordPage = url.pathname === "/set-password";
  const isApiRoute = url.pathname.startsWith("/api");

  if (!user && !isLoginPage && !isSetPasswordPage && !isApiRoute) {
    // Not logged in — redirect to this tenant's login page
    const loginUrl = new URL(request.url);
    loginUrl.pathname = "/login";
    const response = NextResponse.redirect(loginUrl);
    // Copy session cookies from updateSession
    sessionResponse.cookies.getAll().forEach((cookie) => {
      const isProdDomain = hostWithoutPort.endsWith(appDomain);
      response.cookies.set(cookie.name, cookie.value, {
        ...(isProdDomain ? { domain: `.${appDomain}` } : {}),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    });
    return response;
  }

  // ── Step 6: Rewrite to tenant route tree ─────────────────────────────────
  // The browser URL stays as acme.dilshadcodes.com/dashboard
  // but Next.js internally serves (tenant)/[subdomain]/dashboard
  if (isApiRoute) {
    return sessionResponse;
  }

  if (!url.pathname.startsWith(`/${subdomain}`)) {
    url.pathname = `/${subdomain}${url.pathname}`;
    const rewriteResponse = NextResponse.rewrite(url);
    sessionResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie.name, cookie.value);
    });
    return rewriteResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - PWA assets: sw.js, offline.html, manifest.webmanifest, manifest.json, icons/
     * - Public files in /public (images)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|offline.html|manifest.webmanifest|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
