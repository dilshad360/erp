# [STORY-004]: Session Auto-Login & Tenant Branded Preloader

> **Status:** ✅ Done  
> **Module / Epic:** Foundation / Tenant Auth & UX  
> **Target Branch:** `feat/foundation-story-004`  
> **Priority:** P1 - High  
> **Created Date:** 2026-09-18  
> **Updated Date:** 2026-09-18  
> **Agent / Assignee:** Antigravity AI Agent  

---

## 1. User Story Statement

**As an** `authenticated tenant employee, manager, or administrator`,  
**I want** `the application to automatically verify my active session and display a sleek, branded preloader during app initialization and route transitions without flashing the login form`,  
**So that** `I experience instant, frictionless access to my workspace dashboard and enjoy a polished, native-app visual experience on both mobile PWA and desktop`.

---

## 2. Business Value & Context

- **Why are we building this?**: In a mobile-first ERP where employees check in multiple times daily, forcing users through unnecessary login prompts or showing jarring unauthenticated form flashes degrades user experience. Adding automatic session recovery (auto-login) and a tenant-branded preloader provides a smooth, native app launch experience, reinforces company identity, and eliminates visual layout shifts.
- **Target Persona**: All tenant members (employees checking attendance, managers reviewing tasks, admins configuring workspace) returning to the PWA or browser.
- **Expected Impact**: Zero friction on recurring app launches, instant dashboard transition for active sessions, removal of blank/white screen flashes, and elevated brand trust.

---

## 3. Multi-Tenancy & Security Verification

Every feature touching tenant data and auth state must adhere to multi-tenant isolation rules:

- [x] **Data Isolation**: Auto-login validates that the active `auth.uid()` has a corresponding profile where `profiles.company_id` matches the target `companies.id` for the requested subdomain.
- [x] **Row Level Security (RLS)**: Subsequent data loads use standard Supabase client queries subject to RLS (`company_id = (select company_id from profiles where id = auth.uid())`).
- [x] **Server-Side Auth Context**: Session validity is derived strictly from verified Supabase Auth session tokens in secure HTTP-only cookies (`sb-*-auth-token`) via `middleware.ts` and `updateSession()`. Client requests cannot forge `company_id`.
- [x] **Cross-Tenant Session Isolation**: If a user is authenticated with Tenant A and attempts to access Tenant B (`tenantb.yourapp.com`), the system prevents auto-login into Tenant B's private routes, maintaining strict tenant boundaries.
- [x] **Role-Based Access Control (RBAC)**: Once auto-logged in, users are routed to authorized role-gated pages (e.g. employee attendance vs. admin settings).
- [x] **Subdomain Scoping**: Tenant routing adheres to `app/(tenant)/[subdomain]/...` conventions managed by `middleware.ts`.

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **Tables affected**: None (`companies`, `profiles`, and Supabase `auth.users` already maintain necessary relationships).
- **Migration required**: No database migration required.

### B. API Route Handlers / Middleware
- **`middleware.ts` Enhancement**:
  - Detect if an authenticated user with a valid session visits `/login` or the tenant root on a valid subdomain.
  - Automatically redirect authenticated tenant users directly to `/dashboard` to eliminate client-side redirect delays.
- **Token Lifecycle**: Leverages existing `updateSession` helper in `@/lib/supabase/middleware` for seamless token refreshes.

### C. Frontend / UI Components
- **`components/shared/TenantPreloader.tsx`**:
  - Full-screen and card-level preloader component featuring:
    - Tenant logo with fallback to brand initial badge.
    - Subtle pulsating brand glow animation (`brandColor`).
    - Animated indeterminate glowing progress bar.
    - Custom status message ("Verifying session…", "Loading workspace…").
    - Smooth CSS opacity fade-out transition.
- **`components/auth/LoginClient.tsx`**:
  - Client-side auth state check on mount: If an active session is detected, shows the branded preloader while transitioning to `/dashboard`.
  - Only renders input fields when unauthenticated status is confirmed.
- **`app/(tenant)/[subdomain]/(app)/loading.tsx` & `app/(tenant)/[subdomain]/(auth)/login/loading.tsx`**:
  - Next.js Suspense loading boundaries rendering `TenantPreloader` to prevent white screens during server-side data streaming.

### D. Mobile & PWA UX (375px viewport)
- Optimized for mobile PWA standalone launch (`display: standalone`) to deliver a smooth splash-to-dashboard experience.
- Preloader centered with touch-safe boundaries and fluid animations matching 60fps mobile performance.
- High contrast dark mode theme tokens (`#09090b` background, `#18181b` surface).

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Active Session Auto-Login to Dashboard
- **Given** an employee of "Acme Corp" with an existing valid session in their browser/PWA,
- **When** they navigate to `https://acme.yourapp.com/login` or launch the PWA,
- **Then** the system displays the branded preloader and automatically transitions them to `https://acme.yourapp.com/dashboard` without flashing the login input fields.

### Scenario 2: Unauthenticated Visitor Flow
- **Given** a user with no active session navigating to `https://acme.yourapp.com/login`,
- **When** the preloader finishes the initial session validation check,
- **Then** the preloader smoothly fades out and reveals the tenant-branded login form.

### Scenario 3: Cross-Tenant Session Protection
- **Given** an authenticated user whose profile belongs to Tenant A ("Acme Corp"),
- **When** they navigate to `https://starlight.yourapp.com/login` (Tenant B),
- **Then** the system detects the tenant company mismatch, blocks auto-login into Tenant B's protected dashboard, and displays Tenant B's login form.

### Scenario 4: Route Navigation & Streaming Preloader
- **Given** an authenticated user navigating between tenant pages (e.g., Projects, Tasks, Attendance),
- **When** Next.js Server Components are streaming data,
- **Then** the tenant-styled preloader renders smoothly without unstyled layout shifts or white flashes.

### Scenario 5: Expired or Revoked Session Handling
- **Given** a user with an expired or revoked Supabase refresh token,
- **When** they open the application,
- **Then** the preloader gracefully terminates, clears invalid auth cookies, and presents the login form with appropriate feedback.

---

## 6. Edge Cases & Boundary Conditions

- [x] **Slow Network Connections**: Preloader displays an accessible pulsating state without freezing; includes a timeout safeguard if auth check hangs.
- [x] **Offline PWA Launch**: If network is disconnected, integrates with PWA offline cache and routes to offline-enabled features (e.g. offline attendance punch queue).
- [x] **Subdomain / Workspace Fallback**: If the tenant company data is still loading, preloader uses default SaaS brand styling before applying dynamic tenant colors.
- [x] **Fast Navigation (No Flicker)**: Session resolution transitions cleanly to avoid artificial delays while preventing UI flickering.

---

## 7. Implementation Subtasks Breakdown

- [x] **Task 1**: Update `middleware.ts` to redirect authenticated users from `/login` directly to `/dashboard`.
- [x] **Task 2**: Create reusable `components/shared/TenantPreloader.tsx` with logo, pulsating brand glow, and smooth fade transitions.
- [x] **Task 3**: Integrate session auto-detection and preloader in `components/auth/LoginClient.tsx`.
- [x] **Task 4**: Add Next.js streaming loading boundaries (`app/(tenant)/[subdomain]/(app)/loading.tsx` and `app/(tenant)/[subdomain]/(auth)/login/loading.tsx`).
- [x] **Task 5**: Verify cross-tenant isolation and session revocation edge cases.
- [x] **Task 6**: Test on 375px mobile viewport and PWA standalone mode.
- [x] **Task 7**: Execute quality gates (`npm run build`, `npm run lint`, `npm run typecheck`) and update `TRACKER.md`.

---

## 8. Quality & Verification Gates

Run and verify before completing story:

- [x] `npm run build` — Passes with zero errors
- [x] `npm run lint` — Zero ESLint warnings or errors
- [x] `npm run typecheck` — Strict TypeScript passes (`tsc --noEmit`)
- [x] Mobile viewport tested at 375px width & PWA standalone mode
- [x] RLS & multi-tenant isolation verified with two distinct tenant profiles
- [x] Logged-out vs logged-in state transitions verified
- [x] Updated `TRACKER.md` status to ✅ Done

---

## 9. Tracking & Sign-Off

- **Completed Date**: 2026-09-18
- **Migrations Applied**: None (Schema already supports multi-tenant user and company authentication)
- **Decisions Logged in TRACKER.md**: Server-side and client-side session auto-login with tenant-branded preloader and streaming loading boundaries.
- **Signed Off By**: Antigravity AI Agent
