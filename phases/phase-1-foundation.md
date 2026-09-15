# Phase 1 — Foundation

**Goal:** A working Next.js app where a company can sign up, get a subdomain, log in, and land on their dashboard. Nothing more. This is the skeleton everything else hangs off.

**Branch:** `feat/foundation`
**Review level:** Pause and get human sign-off at every major step.

---

## What You're Building

By the end of this phase:
- Next.js 14 project is initialized and deployable
- Supabase project is set up with the base schema
- Subdomain routing works (`acme.yourapp.com` resolves to the right tenant)
- A company can sign up and create the first admin account
- The admin can log in and see an (empty) dashboard at their subdomain
- All new-table RLS policies are tested

---

## Tasks

### 1.1 — Project Initialization

- [ ] Run `npx create-next-app@latest ./ --typescript --tailwind --app --no-src-dir` in the project root
- [ ] Add shadcn/ui: `npx shadcn@latest init` (choose dark theme, CSS variables)
- [ ] Install core dependencies:
  ```bash
  npm install @supabase/ssr @supabase/supabase-js
  npm install react-hook-form @hookform/resolvers zod
  npm install lucide-react date-fns
  ```
- [ ] Set up `.env.local` with Supabase URL + anon key (template in `.env.example`)
- [ ] Configure `tailwind.config.ts` with custom color tokens from `design.md`
- [ ] Add Google Fonts (Inter) via `next/font/google` in root layout
- [ ] Confirm `npm run dev` starts without errors
- [ ] Confirm `npm run build` passes

**Deliverable:** Green build, blank Next.js app running locally.

---

### 1.2 — Supabase Schema: Companies & Profiles

- [ ] Create Supabase project (or use existing local supabase via `supabase start`)
- [ ] Create migration: `supabase/migrations/20260901000000_init_companies_profiles.sql`
  - `companies` table (full schema from `backend.md`)
  - `profiles` table (full schema from `backend.md`)
- [ ] Create migration: `supabase/migrations/20260901000001_rls_companies_profiles.sql`
  - Enable RLS on `companies` (admin only, via role check)
  - Enable RLS on `profiles` (read all in company, update own, admin can do all)
  - Use exact policies from `backend.md`
- [ ] Run `supabase db push` and confirm tables exist in dashboard
- [ ] Manually test: insert a company row + profile row and verify RLS blocks cross-company access

**Deliverable:** Tables exist, RLS tested with two test users in different companies.

---

### 1.3 — Auth Helpers & Supabase SSR Setup

- [ ] Create `lib/supabase/server.ts` — exports `createServerClient()` helper (uses cookies)
- [ ] Create `lib/supabase/client.ts` — exports `createBrowserClient()` helper
- [ ] Create `lib/supabase/middleware.ts` — exports `updateSession()` helper for middleware
- [ ] Write `middleware.ts` at project root:
  - Calls `updateSession()` to refresh auth tokens on every request
  - Reads `Host` header, extracts subdomain
  - Queries `companies` table for slug match
  - Rewrites matched requests to `/(tenant)/[subdomain]/...`
  - Unmatched → `/(marketing)/`
  - Unauthenticated tenant requests → `/(tenant)/[subdomain]/login`
- [ ] Set cookie domain to `.yourapp.com` in the SSR client config
- [ ] Test locally by adding entries to `/etc/hosts` (or Windows `hosts` file):
  ```
  127.0.0.1 test.localhost
  ```

**Deliverable:** Subdomain rewriting works. `test.localhost:3000` resolves to tenant shell. Unauthenticated access redirects to login.

---

### 1.4 — Company Onboarding Flow

- [ ] Create `app/(marketing)/signup/page.tsx` — multi-step form:
  - Step 1: Company name, desired slug (validate uniqueness via API), GST (optional)
  - Step 2: Admin name, email, password
  - Step 3: Confirmation / loading state → redirect
- [ ] Create `app/api/onboarding/route.ts`:
  - Validate body with Zod
  - Check slug uniqueness (return 409 if taken)
  - Create Supabase auth user (service role client)
  - Insert `companies` row
  - Insert `profiles` row (role: 'admin')
  - Seed default `task_statuses` for the new company (To Do, In Progress, In Review, Done)
  - Return `{ companySlug }`
- [ ] After successful signup, redirect to `https://{slug}.yourapp.com/dashboard` (or `http://{slug}.localhost:3000/dashboard` in dev)
- [ ] Validate: slug must be 3–40 chars, lowercase, alphanumeric + hyphens only

**Deliverable:** Signup flow completes end-to-end. Company + admin created in DB. Redirect to subdomain works.

---

### 1.5 — Tenant Shell & Login

- [ ] Create `app/(tenant)/[subdomain]/login/page.tsx`:
  - Supabase Auth UI or custom email/password form
  - On success: redirect to `/:subdomain/dashboard`
- [ ] Create `app/(tenant)/[subdomain]/layout.tsx`:
  - Server Component: fetch company data from DB (name, logo, brand color)
  - Verify authenticated user's `company_id` matches this subdomain's company
  - If mismatch → redirect to correct subdomain or show error
  - Wrap children with `<TenantProvider>` (client component context)
  - Render `<AppShell>` (nav + content area)
- [ ] Create `components/shared/TenantProvider.tsx` — provides tenant context to client tree
- [ ] Create `components/shared/AppShell.tsx` — `<Sidebar>` (desktop) + `<BottomNav>` (mobile) + `<main>`
- [ ] Create `components/shared/Sidebar.tsx` — links to all main routes, active state styling
- [ ] Create `components/shared/BottomNav.tsx` — 5-item mobile tab bar

**Deliverable:** Admin can log in and see a nav shell at their subdomain. Layout renders correctly on mobile and desktop.

---

### 1.6 — Dashboard Placeholder

- [ ] Create `app/(tenant)/[subdomain]/dashboard/page.tsx`:
  - Static placeholder with 4 stat cards (hardcoded 0s for now)
  - Cards: "Employees checked in today", "Open tasks", "Active projects", "Clients"
  - These will be replaced with live data in later phases
- [ ] Wire up the `<StatCard>` component (`components/shared/StatCard.tsx`)

**Deliverable:** Dashboard page renders at `/:subdomain/dashboard` without errors.

---

### 1.7 — Phase 1 Verification

Before marking this phase done, confirm all of the following:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Sign up → new company created → redirect to subdomain → login → dashboard: full flow works
- [ ] Two test companies (Tenant A, Tenant B) created — confirm Tenant A users cannot see Tenant B data via RLS
- [ ] Dashboard renders correctly on iPhone SE (375px) and desktop (1280px)
- [ ] Unauthenticated visit to `/:subdomain/dashboard` redirects to login

---

## Notes

- Don't add any more features in this phase. Resist the urge.
- The middleware is the most fragile piece. Test it thoroughly before moving on.
- Keep the signup flow simple — no email verification in MVP. Add it later.
