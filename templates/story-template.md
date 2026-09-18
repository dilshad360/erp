# [STORY-XXX]: [Short Descriptive Title]

> **Status:** ⬜ Backlog / 🔄 In Progress / 🔍 In Review / ✅ Done / 🚫 Blocked  
> **Module / Epic:** [e.g. Employee Management / Attendance / Clients / Projects / Tasks / PWA / Billing]  
> **Target Branch:** `feat/[module]-[story-id]` (e.g., `feat/attendance-story-007`)  
> **Priority:** [P0 - Critical / P1 - High / P2 - Medium / P3 - Low]  
> **Created Date:** YYYY-MM-DD  
> **Updated Date:** YYYY-MM-DD  
> **Agent / Assignee:** [Agent Name or Developer]  

---

## 1. User Story Statement

**As a** `[tenant admin | manager | employee | public visitor]`,  
**I want to** `[perform an action or access a capability]`,  
**So that** `[achieve a specific business outcome or solve a problem]`.

---

## 2. Business Value & Context

- **Why are we building this?**: [Explain the motivation, customer pain point, or strategic goal]
- **Target Persona**: [Who interacts with this feature: Admin, HR Manager, Field Worker, etc.]
- **Expected Impact**: [Time saved, compliance fulfilled, workflow automated, etc.]

---

## 3. Multi-Tenancy & Security Verification

Every feature touching data must adhere to multi-tenant isolation rules:

- [ ] **Data Isolation**: All new or modified business tables include `company_id uuid` referencing `companies(id)`.
- [ ] **Row Level Security (RLS)**: Policies enforce `company_id = (select company_id from profiles where id = auth.uid())`.
- [ ] **Server-Side Auth Context**: `company_id` is NEVER accepted from client request bodies or query params. It is strictly derived via Supabase `auth.uid()`.
- [ ] **Role-Based Access Control (RBAC)**: Explicitly checks user role (`admin`, `manager`, `employee`) where actions are privileged.
- [ ] **Subdomain Scoping**: Tenant-specific routes reside under `app/(tenant)/[subdomain]/...` and pass through tenant middleware validation.

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **Tables affected / created**: `[table_name]`
- **Migration file name**: `supabase/migrations/YYYYMMDDHHMMSS_[description].sql`
- **RLS policies**:
  ```sql
  alter table [table_name] enable row level security;
  create policy tenant_isolation on [table_name]
    using (company_id = (select company_id from profiles where id = auth.uid()));
  ```

### B. API Route Handlers / Server Actions
- **Endpoint**: `app/api/[module]/route.ts`
- **Method**: `[GET | POST | PATCH | DELETE]`
- **Request Validation**: Zod schema in `lib/validations/[module].ts`
- **Response Shape**: `{ data: T | null, error: string | null }`

### C. Frontend / UI Components
- **Page Route**: `app/(tenant)/[subdomain]/(app)/[path]/page.tsx` (Server Component by default)
- **Interactive Components**: `components/[module]/[ComponentName].tsx` (`'use client'` only if state/events needed)
- **Shared Components Used**: [e.g. `DataTable`, `FormField`, `ConfirmDialog`, `EmptyState`, `LoadingButton`]
- **Form Handling**: React Hook Form + Zod resolver

### D. Mobile & PWA UX (375px viewport)
- Mobile-first layout verified (responsive cards / lists instead of wide horizontal-only tables)
- Touch targets >= 44x44px for primary actions
- Bottom navigation / sheet drawers responsive on small screens

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: [Primary Happy Path]
- **Given** [a logged-in employee of tenant "Acme"],
- **When** [they navigate to the feature and perform the action],
- **Then** [the system records the data and displays a success feedback].

### Scenario 2: [Role Authorization / Gating]
- **Given** [a logged-in user with role "employee"],
- **When** [they attempt to access an admin-only feature or endpoint],
- **Then** [the system returns 403 Forbidden or redirects with an access denied message].

### Scenario 3: [Multi-Tenant Data Isolation]
- **Given** [Tenant A and Tenant B have separate data],
- **When** [User from Tenant A accesses this feature],
- **Then** [they see ONLY Tenant A data and zero leakage from Tenant B].

### Scenario 4: [Form Validation & Error Handling]
- **Given** [invalid or incomplete form data],
- **When** [the user submits the form],
- **Then** [field-level inline errors are shown with clear guidance].

---

## 6. Edge Cases & Boundary Conditions

- [ ] **Empty States**: How does the UI look when there is zero data?
- [ ] **Network / Offline**: How does the system handle temporary network failure?
- [ ] **Concurrency**: What if two users perform the action simultaneously?
- [ ] **Format / Localization**: Indian formatting applied where relevant (e.g., INR ₹, GSTIN 15-char regex, DD/MM/YYYY).

---

## 7. Implementation Subtasks Breakdown

- [ ] **Task 1**: Write & apply database migration + RLS policy (`supabase/migrations/...`)
- [ ] **Task 2**: Create Zod validation schema (`lib/validations/...`)
- [ ] **Task 3**: Implement backend API route handlers (`app/api/...`)
- [ ] **Task 4**: Build UI components & forms (`components/...`)
- [ ] **Task 5**: Assemble server component page & connect data (`app/(tenant)/...`)
- [ ] **Task 6**: Mobile viewport check (375px) & polish

---

## 8. Quality & Verification Gates

Run and verify before completing story:

- [ ] `npm run build` — Passes with zero errors
- [ ] `npm run lint` — Zero ESLint warnings or errors
- [ ] `npm run typecheck` — Strict TypeScript passes (`tsc --noEmit`)
- [ ] Mobile viewport tested at 375px width
- [ ] RLS verified across two different tenant accounts
- [ ] Logged-out access blocked (Auth redirect verified)
- [ ] Updated `TRACKER.md` status to ✅ Done

---

## 9. Tracking & Sign-Off

- **Completed Date**: YYYY-MM-DD
- **Migrations Applied**: `[migration_filename.sql]`
- **Decisions Logged in TRACKER.md**: [Any architecture decisions made]
- **Signed Off By**: [Agent / Developer]
