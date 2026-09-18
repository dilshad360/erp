# [STORY-003]: Dark Mode Theme & Company Logo Display on Tenant Login Screen

> **Status:** ✅ Done  
> **Module / Epic:** Foundation / Tenant Auth & Branding  
> **Target Branch:** `feat/foundation-story-003`  
> **Priority:** P2 - Medium  
> **Created Date:** 2026-09-18  
> **Updated Date:** 2026-09-18  
> **Agent / Assignee:** Antigravity AI Agent  

---

## 1. User Story Statement

**As a** `tenant employee or administrator`,  
**I want to** `see my company's custom logo and experience a sleek, high-contrast dark mode interface on the login page`,  
**So that** `I have instant visual confirmation that I am logging into the correct tenant workspace and enjoy a seamless, comfortable visual experience`.

---

## 2. Business Value & Context

- **Why are we building this?**: When users navigate to `https://[subdomain].yourapp.com/login`, they need immediate brand recognition and reassurance that they are accessing their company's dedicated portal. Currently, the login page displays generic placeholder text without the tenant's uploaded logo or enhanced dark-mode surface polish.
- **Target Persona**: All tenant employees, managers, and administrators logging in from desktop and mobile browsers/PWA.
- **Expected Impact**: Higher brand confidence for tenant companies, professional visual identity, and consistency with the SaaS dark-mode design system.

---

## 3. Multi-Tenancy & Security Verification

Every feature touching tenant data must adhere to multi-tenant isolation rules:

- [x] **Data Isolation**: Logo and brand styling are retrieved strictly by matching the current tenant `slug` (`subdomain`).
- [x] **Row Level Security (RLS)**: Reads use the existing public select policy on `companies` (`20260901000003_companies_public_select.sql`), which allows reading `name`, `slug`, `logo_url`, and `brand_color` for tenant identification prior to authentication.
- [x] **Server-Side Auth Context**: Authentication occurs via Supabase Auth `signInWithPassword`, redirecting to authenticated tenant routes upon success.
- [x] **Role-Based Access Control (RBAC)**: Login screen is public to all workspace members.
- [x] **Subdomain Scoping**: If an invalid `subdomain` is supplied in the URL, the route throws a 404 or redirects to `workspace-not-found`.

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **Tables affected**: None (`companies` table already contains `name`, `slug`, `logo_url`, and `brand_color`).
- **Migration required**: No new database migration needed.

### B. API Route Handlers / Server Actions
- **Endpoint**: Handled natively via Supabase client auth (`supabase.auth.signInWithPassword`).

### C. Frontend / UI Components
- **Target Page**: `app/(tenant)/[subdomain]/(auth)/login/page.tsx`
- **Component Architecture**:
  - `LoginPage` is a Server Component fetching tenant branding (`name`, `logo_url`, `brand_color`) based on `params.subdomain`.
  - Client component [`LoginClient.tsx`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/components/auth/LoginClient.tsx) renders the login form.
  - Renders company logo using `next/image` with fallback to a stylized, brand-colored initial badge if `logo_url` is null.
  - Full dark mode styling using design tokens:
    - Background: `var(--color-bg)` (`#09090b`) with ambient brand glow.
    - Card Surface: `var(--color-surface)` (`#18181b`) with border `var(--color-border)` (`#27272a`).
    - Dynamic focus rings, icons, password show/hide toggle, and brand-colored submit button.

### D. Mobile & PWA UX (375px viewport)
- Center-aligned card layout optimized for mobile screens (375px width).
- Primary input fields and submit button meet touch target standards (height ≥ 44px).
- Autocomplete attributes (`email`, `current-password`) enabled for password managers.

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Tenant with Custom Logo Uploaded
- **Given** a tenant "Acme Corp" with an active `logo_url` in the database,
- **When** an employee navigates to `https://acme.yourapp.com/login`,
- **Then** the Acme Corp custom logo is rendered prominently above the login form, along with the company name and workspace title.

### Scenario 2: Tenant Without Logo (Brand Initial Fallback)
- **Given** a tenant "Starlight Tech" with `logo_url = null` and brand color `#8b5cf6`,
- **When** a user navigates to `https://starlight.yourapp.com/login`,
- **Then** a styled fallback avatar with letter "S" is rendered using the tenant's brand color accent.

### Scenario 3: Dark Mode Visual Polish & Brand Accent
- **Given** any tenant login screen,
- **When** the page loads,
- **Then** the UI displays in rich dark mode with high contrast text, refined border outlines, and dynamic tenant brand color on buttons and input focus rings.

### Scenario 4: Error Handling in Dark Mode
- **Given** invalid credentials entered by a user,
- **When** the login form is submitted,
- **Then** a dark-mode styled error banner (red accent with clear readable text) appears without breaking the layout.

---

## 6. Edge Cases & Boundary Conditions

- [x] **Missing / Broken Logo URL**: Gracefully falls back to the company initial badge if the image fails to load.
- [x] **Unknown Subdomain**: Triggers fallback or handles subdomain routing.
- [x] **High-Density Displays**: SVG / WebP / PNG logo formats supported with crisp scaling.
- [x] **Auto-fill Contrast**: Browser autofill styles styled cleanly against dark backgrounds.

---

## 7. Implementation Subtasks Breakdown

- [x] **Task 1**: Update `app/(tenant)/[subdomain]/(auth)/login/page.tsx` to query company `name`, `logo_url`, and `brand_color` by `slug`.
- [x] **Task 2**: Build `components/auth/LoginClient.tsx` with automatic image error fallback to letter badge and password toggle.
- [x] **Task 3**: Refine dark-mode styling tokens across login card, inputs, submit button, and error alerts.
- [x] **Task 4**: Verify 375px mobile viewport and desktop layouts.
- [x] **Task 5**: Run quality gates (`npm run typecheck`, `npm run lint`, `npm run build`).
- [x] **Task 6**: Update status in `TRACKER.md`.

---

## 8. Quality & Verification Gates

Run and verified:

- [x] `npm run build` — Passed with zero errors
- [x] `npm run lint` — Zero ESLint warnings or errors
- [x] `npm run typecheck` — Strict TypeScript passed (`tsc --noEmit`)
- [x] Mobile viewport tested at 375px width
- [x] Tested with logo present and with logo missing (fallback badge)
- [x] Updated `TRACKER.md` status to ✅ Done

---

## 9. Tracking & Sign-Off

- **Completed Date**: 2026-09-18
- **Migrations Applied**: None (Schema already supports logo_url & brand_color)
- **Decisions Logged in TRACKER.md**: Dynamic tenant logo & dark mode styling for login screen
- **Signed Off By**: Antigravity AI Agent
