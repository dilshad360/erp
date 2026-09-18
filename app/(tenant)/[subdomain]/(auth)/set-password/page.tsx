"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let subscription: { unsubscribe: () => void } | null = null;

    async function initSession(): Promise<void> {
      // 1. Check existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setHasSession(true);
        setSessionChecking(false);
        return;
      }

      // 2. Parse access_token / refresh_token from URL hash (#access_token=...&refresh_token=...)
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
              "Invitation link expired or invalid. Please ask your administrator to resend the invite."
            );
          } else if (data.session) {
            setHasSession(true);
          }
          setSessionChecking(false);
          return;
        }
      }

      // 3. Listen for auth state change
      const { data: subData } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setHasSession(true);
        }
        setSessionChecking(false);
      });
      subscription = subData.subscription;

      // Fallback timeout if no token is found in URL
      setTimeout(() => {
        setSessionChecking(false);
      }, 1500);
    }

    initSession();

    return () => {
      subscription?.unsubscribe();
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
        "Auth session missing! Please click the invitation link in your email again."
      );
      setLoading(false);
      return;
    }

    const formatErrorMessage = (msg: string | null): string => {
      if (!msg) return "An unexpected error occurred.";
      if (msg.toLowerCase().includes("user from sub claim") || msg.toLowerCase().includes("jwt")) {
        return "This invitation link is invalid because the account was reset or re-invited. Please use the newest invite link from your email, or ask your admin to click 'Resend Invite'.";
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
            Validating invitation link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center mb-2">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Set your password
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Create a secure password to activate your account
          </p>
        </div>

        {/* Missing Session Banner */}
        {!hasSession && !success && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-start gap-3 text-left">
            <AlertCircle size={20} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              No active session found. If you opened this page directly, please click the link sent in your email invitation.
            </p>
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-center space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-[var(--color-success)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Password set successfully!
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Redirecting you to your workspace dashboard...
            </p>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-[var(--shadow-level-1)]"
            noValidate
          >
            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--color-text-primary)]"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-shadow"
                placeholder="At least 8 characters"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-[var(--color-text-primary)]"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-shadow"
                placeholder="Re-enter password"
              />
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-xs text-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-3 py-2 rounded-md font-medium"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                "Save & Continue"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
