"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingButton from "@/components/shared/LoadingButton";
import ThemeToggle from "@/components/shared/ThemeToggle";
import TenantPreloader from "@/components/shared/TenantPreloader";
import CompanyLogo from "@/components/shared/CompanyLogo";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  KeyRound,
  Send,
} from "lucide-react";

export type TenantLoginBranding = {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
};

type LoginClientProps = {
  company: TenantLoginBranding;
  initialMode?: "signin" | "signup" | "forgot";
};

export default function LoginClient({
  company,
  initialMode = "signin",
}: LoginClientProps): React.JSX.Element {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up state
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const brandColor = company.brandColor || "#6366f1";

  // ── Handle Sign In ──────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(
        authError?.message === "Invalid login credentials"
          ? "Incorrect email or password. Please verify your credentials."
          : authError?.message || "Failed to sign in."
      );
      setLoading(false);
      return;
    }

    // Check if user profile is active
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, company_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      setIsPendingApproval(true);
      setLoading(false);
      return;
    }

    // Seamless transition to dashboard — full navigation ensures fresh session cookies reach server middleware & layout
    setIsRedirecting(true);
    window.location.href = "/dashboard";
  }

  // ── Handle Sign Up ──────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          subdomain: company.slug,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to register account.");
        setLoading(false);
        return;
      }

      setSignupSuccess(true);
      setLoading(false);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  }

  // ── Handle Forgot Password ─────────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/set-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message || "Failed to send reset email. Please try again.");
        setLoading(false);
        return;
      }

      setForgotSuccess(true);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleSignOutAndReset(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsPendingApproval(false);
    setPassword("");
    setError(null);
  }

  // Render preloader only when actively transitioning to dashboard after submitting
  if (isRedirecting) {
    return (
      <TenantPreloader
        companyName={company.name}
        brandColor={brandColor}
        logoUrl={company.logoUrl}
        message="Authenticated. Entering workspace…"
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
          <CompanyLogo
            logoUrl={company.logoUrl}
            companyName={company.name}
            brandColor={brandColor}
            size="xl"
            shape="rounded"
            priority={true}
            className="w-16 h-16 rounded-2xl shadow-lg p-2"
          />

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {company.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              {mode === "signin"
                ? "Sign in to your workspace portal"
                : mode === "signup"
                ? "Create your team member account"
                : "Reset your workspace password"}
            </p>
          </div>
        </div>

        {/* ── Pending Approval State Screen ─────────────────────────────────── */}
        {isPendingApproval ? (
          <div className="bg-[var(--color-surface)] border border-amber-500/30 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl backdrop-blur-sm text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Clock size={24} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Account Pending Approval
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Your registration for <strong className="text-[var(--color-text-primary)]">{company.name}</strong> has been received and is waiting for administrator activation.
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Please contact your organization administrator to assign your role and activate your access.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPendingApproval(false);
                  setError(null);
                }}
                className="w-full h-10 rounded-xl text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <RotateCcw size={14} />
                <span>Check Status / Sign In Again</span>
              </button>

              <button
                type="button"
                onClick={handleSignOutAndReset}
                className="w-full h-10 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] text-xs font-medium transition-colors cursor-pointer"
              >
                Sign Out / Use Another Account
              </button>
            </div>
          </div>
        ) : signupSuccess ? (
          /* ── Signup Success Screen ────────────────────────────────────────── */
          <div className="bg-[var(--color-surface)] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl backdrop-blur-sm text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Registration Submitted!
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Your account for <strong className="text-[var(--color-text-primary)]">{company.name}</strong> was successfully created.
              </p>
              <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-left text-xs space-y-1">
                <div className="text-[11px] text-[var(--color-text-muted)] font-medium">Registered Email:</div>
                <div className="font-mono text-[var(--color-text-primary)] truncate">{signupEmail}</div>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                An administrator will review your registration and activate your role shortly. Once activated, you can sign in directly.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSignupSuccess(false);
                  setMode("signin");
                  setEmail(signupEmail);
                  setError(null);
                }}
                className="w-full h-10 rounded-xl text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        ) : mode === "forgot" ? (
          /* ── Forgot Password Screen ────────────────────────────────────────── */
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-sm transition-colors duration-200">
            {forgotSuccess ? (
              /* Password Reset Dispatched Screen */
              <div className="space-y-5 text-center animate-in fade-in duration-200">
                <div
                  className="w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center"
                  style={{
                    backgroundColor: `${brandColor}15`,
                    borderColor: `${brandColor}30`,
                    color: brandColor,
                  }}
                >
                  <Send size={22} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Password Reset Link Sent
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    If an account exists for <strong className="text-[var(--color-text-primary)] font-mono">{forgotEmail}</strong>, you will receive an email with instructions to reset your password shortly.
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Please check your inbox and spam folder. The link will remain valid for 1 hour.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSuccess(false);
                      setError(null);
                    }}
                    className="w-full h-10 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Try another email / Resend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotSuccess(false);
                      setMode("signin");
                      setError(null);
                    }}
                    className="w-full h-10 rounded-xl text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ backgroundColor: brandColor }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Forgot Password Request Form */
              <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                <div className="flex items-center gap-2 pb-1 text-xs text-[var(--color-text-muted)]">
                  <KeyRound size={14} className="text-[var(--color-brand)] shrink-0" />
                  <span>Enter your work email and we&apos;ll send you a recovery link.</span>
                </div>

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

                {/* Work Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgotEmail"
                    className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
                  >
                    <Mail size={13} className="text-[var(--color-text-muted)]" />
                    <span>Work Email</span>
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  />
                </div>

                {/* Submit Reset Link Button */}
                <div className="pt-2 flex flex-col gap-2">
                  <LoadingButton
                    type="submit"
                    isLoading={loading}
                    loadingText="Sending link…"
                    className="w-full h-11 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    Send Password Reset Link
                  </LoadingButton>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="w-full h-10 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ── Auth Card (Sign In / Sign Up Tabs) ─────────────────────────────── */
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-sm transition-colors duration-200">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] select-none">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                Sign Up
              </button>
            </div>

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

            {mode === "signin" ? (
              /* ── Sign In Form ────────────────────────────────────────────── */
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
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

                {/* Password Field + Forgot password trigger */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
                    >
                      <Lock size={13} className="text-[var(--color-text-muted)]" />
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-xs text-[var(--color-brand)] hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
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
            ) : (
              /* ── Sign Up Form ────────────────────────────────────────────── */
              <form onSubmit={handleSignUp} className="space-y-3.5" noValidate>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
                  >
                    <User size={13} className="text-[var(--color-text-muted)]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signupEmail"
                    className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
                  >
                    <Mail size={13} className="text-[var(--color-text-muted)]" />
                    <span>Work Email</span>
                  </label>
                  <input
                    id="signupEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="rahul@company.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signupPassword"
                    className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5"
                  >
                    <Lock size={13} className="text-[var(--color-text-muted)]" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signupPassword"
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full h-10 px-3.5 pr-10 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 cursor-pointer"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
                  />
                </div>

                {/* Sign Up Notice */}
                <div className="p-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  New accounts require administrator approval before accessing the workspace.
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <LoadingButton
                    type="submit"
                    isLoading={loading}
                    loadingText="Registering account…"
                    className="w-full h-11 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-150 cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    Create Employee Account
                  </LoadingButton>
                </div>
              </form>
            )}
          </div>
        )}

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
