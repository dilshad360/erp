"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import CompanyLogo from "@/components/shared/CompanyLogo";
import LoadingButton from "@/components/shared/LoadingButton";

export default function SetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Tenant branding state
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchCompanyBranding(userId?: string): Promise<void> {
      try {
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        }

        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", userId)
            .maybeSingle();

          if (profile?.company_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("name, slug, brand_color, logo_url")
              .eq("id", profile.company_id)
              .maybeSingle();

            if (company) {
              setCompanyName(company.name);
              setBrandColor(company.brand_color || "#6366f1");
              setLogoUrl(company.logo_url || null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load branding info:", err);
      }
    }

    async function initSession(): Promise<void> {
      // 1. Check existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setHasSession(true);
        setSessionChecking(false);
        fetchCompanyBranding(session.user.id);
        return;
      }

      // 2. Check for PKCE ?code=... in query parameters
      if (typeof window !== "undefined" && window.location.search) {
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Failed to exchange code for session:", exchangeError);
            setError(
              "Security link expired or invalid. Please request a new password reset link."
            );
          } else if (data.session) {
            setHasSession(true);
            fetchCompanyBranding(data.session.user.id);
          }
          setSessionChecking(false);
          return;
        }
      }

      // 3. Parse access_token / refresh_token from URL hash (#access_token=...&refresh_token=...)
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error("Failed to set session from URL hash:", setSessionError);
            setError(
              "Security link expired or invalid. Please request a new password reset or login link."
            );
          } else if (data.session) {
            setHasSession(true);
            fetchCompanyBranding(data.session.user.id);
          }
          setSessionChecking(false);
          return;
        }
      }

      setSessionChecking(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasSession(true);
        fetchCompanyBranding(session.user.id);
      }
    });

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Verify active session exists before updating password
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();

    if (!activeSession) {
      setError(
        "Auth session missing! Please click the link in your email again or log in."
      );
      setLoading(false);
      return;
    }

    const formatErrorMessage = (msg: string | null): string => {
      if (!msg) return "An unexpected error occurred.";
      if (msg.toLowerCase().includes("user from sub claim") || msg.toLowerCase().includes("jwt")) {
        return "This link is expired or invalid. Please request a new password reset link from the login page.";
      }
      return msg;
    };

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(formatErrorMessage(updateError.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Fetch tenant company to redirect to correct subdomain dashboard
    setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user.id)
            .single();

          if (profile?.company_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("slug")
              .eq("id", profile.company_id)
              .single();

            if (company?.slug) {
              const appDomain =
                process.env.NEXT_PUBLIC_APP_DOMAIN ?? "erp.dilshadcodes.com";
              const isLocalhost = window.location.hostname.includes("localhost");
              const port = window.location.port ? `:${window.location.port}` : "";
              const tenantHost = isLocalhost
                ? `${company.slug}.localhost${port}`
                : `${company.slug}.${appDomain}${port}`;
              window.location.href = `${window.location.protocol}//${tenantHost}/dashboard`;
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error determining tenant redirect:", err);
      }
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (sessionChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Validating security link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--color-bg)] text-[var(--color-text-primary)] relative overflow-hidden transition-colors duration-200">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: brandColor }}
      />

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <CompanyLogo
            logoUrl={logoUrl}
            companyName={companyName}
            brandColor={brandColor}
            size="xl"
            shape="rounded"
            priority={true}
            className="w-16 h-16 rounded-2xl shadow-lg p-2"
          />
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {companyName ? `Set Password — ${companyName}` : "Set your password"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Create a secure password to activate and access your account
            </p>
          </div>
        </div>

        {/* Missing Session Banner */}
        {!hasSession && !success && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 flex items-start gap-3 text-left shadow-lg">
            <AlertCircle size={20} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                No active session found
              </p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                If you opened this page directly, please click the link sent in your email invitation or password recovery email.
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="bg-[var(--color-surface)] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 text-center space-y-4 shadow-xl backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Password updated successfully!
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Redirecting you to your workspace dashboard…
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-sm"
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

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
              >
                <Lock size={13} className="text-[var(--color-text-muted)]" />
                <span>New Password</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  placeholder="At least 8 characters"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
              >
                <Lock size={13} className="text-[var(--color-text-muted)]" />
                <span>Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={loading}
                loadingText="Updating password…"
                className="w-full h-11 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                Save Password & Continue
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
