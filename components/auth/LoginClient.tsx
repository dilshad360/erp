"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoadingButton from "@/components/shared/LoadingButton";
import ThemeToggle from "@/components/shared/ThemeToggle";
import TenantPreloader from "@/components/shared/TenantPreloader";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";

export type TenantLoginBranding = {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
};

type LoginClientProps = {
  company: TenantLoginBranding;
};

export default function LoginClient({ company }: LoginClientProps): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Opening workspace…");

  const brandColor = company.brandColor || "#6366f1";

  // Silent background check for existing active session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession(): Promise<void> {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        // If refresh token is expired / invalid, clear it
        if (sessionError) {
          console.warn("[LoginClient] Session check error, clearing stale auth:", sessionError.message);
          return;
        }

        if (session?.user && isMounted) {
          // Check if the authenticated user belongs to THIS company slug
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", session.user.id)
            .single();

          if (profile?.company_id) {
            const { data: userCompany } = await supabase
              .from("companies")
              .select("slug")
              .eq("id", profile.company_id)
              .single();

            if (userCompany?.slug === company.slug && isMounted) {
              setRedirectMessage("Session active. Opening workspace…");
              setIsRedirecting(true);
              window.location.href = "/dashboard";
            }
          }
        }
      } catch (err) {
        console.warn("[LoginClient] Silent session verification error:", err);
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [company.slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please verify your credentials."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Seamless transition to dashboard upon successful authentication
    setIsRedirecting(true);
    setRedirectMessage("Authenticated. Entering workspace…");
    router.push("/dashboard");
    router.refresh();
  }

  // Render preloader only when actively transitioning to dashboard
  if (isRedirecting) {
    return (
      <TenantPreloader
        companyName={company.name}
        brandColor={brandColor}
        logoUrl={company.logoUrl}
        message={redirectMessage}
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[var(--color-bg)] text-[var(--color-text-primary)] relative overflow-hidden transition-colors duration-200">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: brandColor }}
      />

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Company Branding & Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          {company.logoUrl && !logoError ? (
            <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 shadow-lg flex items-center justify-center overflow-hidden">
              <Image
                src={company.logoUrl}
                alt={company.name}
                fill
                className="object-contain p-2"
                onError={() => setLogoError(true)}
                unoptimized
              />
            </div>
          ) : (
            <div className="relative w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 shadow-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="ERP Logo"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {company.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Sign in to your workspace portal
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-sm transition-colors duration-200"
          noValidate
        >
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-500 animate-in fade-in duration-200"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
            >
              <Mail size={13} className="text-[var(--color-text-muted)]" />
              <span>Work Email</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full h-11 px-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
            >
              <Lock size={13} className="text-[var(--color-text-muted)]" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Signing in…"
              className="w-full h-11 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              Sign In to Workspace
            </LoadingButton>
          </div>
        </form>

        {/* Security / Multi-Tenancy Footer */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Encrypted Multi-Tenant Workspace Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
