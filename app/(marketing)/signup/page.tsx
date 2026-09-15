"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// ── Validation schemas ─────────────────────────────────────────────────────

const step1Schema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(40, "Subdomain must be 40 characters or less")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  gstNumber: z.string().optional(),
});

const step2Schema = z.object({
  adminName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type FieldError = Partial<Record<string, string>>;

// ── Component ─────────────────────────────────────────────────────────────

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    companyName: "",
    slug: "",
    gstNumber: "",
  });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    adminName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Slug check ──────────────────────────────────────────────────────────
  async function checkSlug(slug: string): Promise<void> {
    if (slug.length < 3) { setSlugAvailable(null); return; }
    const res = await fetch(`/api/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
    const json = (await res.json()) as { available: boolean };
    setSlugAvailable(json.available);
  }

  // ── Auto-generate slug from company name ────────────────────────────────
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
  }

  // ── Step 1 submit ───────────────────────────────────────────────────────
  function handleStep1(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const result = step1Schema.safeParse(step1Data);
    if (!result.success) {
      const fieldErrors: FieldError = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (slugAvailable === false) {
      setErrors({ slug: "This subdomain is already taken" });
      return;
    }
    setErrors({});
    setStep(2);
  }

  // ── Step 2 submit → call onboarding API ─────────────────────────────────
  async function handleStep2(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const result = step2Schema.safeParse(step2Data);
    if (!result.success) {
      const fieldErrors: FieldError = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    setApiError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...step1Data, ...step2Data }),
    });

    const json = (await res.json()) as { data?: { companySlug: string }; error?: string };

    if (!res.ok || json.error) {
      setApiError(json.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Success → show step 3 then redirect
    setStep(3);
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dilshadcodes.com";
    const slug = json.data?.companySlug ?? step1Data.slug;
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const isLocal = window.location.hostname.includes("localhost");
        if (isLocal) {
          const port = window.location.port ? `:${window.location.port}` : ":3000";
          window.location.href = `http://${slug}.localhost${port}/dashboard`;
        } else {
          window.location.href = `https://${slug}.${appDomain}/dashboard`;
        }
      }
    }, 2000);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            You&apos;re all set!
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Redirecting you to your workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        {/* Progress */}
        <div className="text-center space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Step {step} of 2</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {step === 1 ? "Create your workspace" : "Your admin account"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {step === 1
              ? "Your company gets its own subdomain"
              : "You'll use this to sign in"}
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-[var(--shadow-level-1)]">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="flex flex-col gap-4" noValidate>
              {/* Company name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="companyName" className="block text-sm font-medium text-[var(--color-text-primary)]">
                  Company name <span className="text-[var(--color-brand)]">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={step1Data.companyName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = generateSlug(name);
                    setStep1Data((p) => ({ ...p, companyName: name, slug }));
                    void checkSlug(slug);
                  }}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent block"
                  placeholder="Acme Corp"
                />
                {errors.companyName && <p className="text-xs text-[var(--color-danger)]">{errors.companyName}</p>}
              </div>

              {/* Slug / subdomain */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-primary)]">
                  Subdomain <span className="text-[var(--color-brand)]">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="slug"
                    type="text"
                    required
                    value={step1Data.slug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setStep1Data((p) => ({ ...p, slug }));
                      void checkSlug(slug);
                    }}
                    className="flex-1 min-w-0 h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent font-mono block"
                    placeholder="acme"
                  />
                  <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap shrink-0">.dilshadcodes.com</span>
                </div>
                {slugAvailable === true && (
                  <p className="text-xs text-[var(--color-success)]">✓ Available</p>
                )}
                {slugAvailable === false && (
                  <p className="text-xs text-[var(--color-danger)]">✗ Already taken</p>
                )}
                {errors.slug && <p className="text-xs text-[var(--color-danger)]">{errors.slug}</p>}
              </div>

              {/* GST (optional) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="gstNumber" className="block text-sm font-medium text-[var(--color-text-primary)]">
                  GST number <span className="text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  id="gstNumber"
                  type="text"
                  value={step1Data.gstNumber ?? ""}
                  onChange={(e) => setStep1Data((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent font-mono block"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 mt-2 rounded-md bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors duration-150 flex items-center justify-center cursor-pointer"
              >
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4" noValidate>
              {/* Admin name */}
              <div className="space-y-1.5">
                <label htmlFor="adminName" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Your name <span aria-hidden>*</span>
                </label>
                <input
                  id="adminName"
                  type="text"
                  required
                  value={step2Data.adminName}
                  onChange={(e) => setStep2Data((p) => ({ ...p, adminName: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  placeholder="Dilshad Khan"
                />
                {errors.adminName && <p className="text-xs text-[var(--color-danger)]">{errors.adminName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Email <span aria-hidden>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={step2Data.email}
                  onChange={(e) => setStep2Data((p) => ({ ...p, email: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  placeholder="you@company.com"
                />
                {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Password <span aria-hidden>*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={step2Data.password}
                  onChange={(e) => setStep2Data((p) => ({ ...p, password: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
                {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password}</p>}
              </div>

              {apiError && (
                <p role="alert" className="text-xs text-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-3 py-2 rounded-md">
                  {apiError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 rounded-md border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 rounded-md bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {loading ? "Creating…" : "Create workspace"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
