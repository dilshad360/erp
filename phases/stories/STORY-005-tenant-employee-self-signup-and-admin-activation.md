# STORY-005: Tenant Employee Self-Signup & Admin Activation Workflow

> **Status:** ✅ Done  
> **Module / Epic:** Foundation / Auth & Employee Management  
> **Target Branch:** `feat/auth-story-005`  
> **Priority:** P1 - High  
> **Created Date:** 2026-09-18  
> **Updated Date:** 2026-09-18  
> **Agent / Assignee:** Antigravity  

---

## 1. User Story Statement

**As an** employee joining a company on the ERP platform,  
**I want to** sign up directly from my company's tenant login/signup page (`{subdomain}.yourapp.com/signup` or toggle on `/login`) with my name, email, and password,  
**So that** I don't need to wait for a rate-limited email invitation link to create my account.

**As a** company administrator,  
**I want to** view a "Pending Approvals" list in Employee Management (`/employees`), assign the new user's role, designation, department, and employee ID, and activate their account with one click,  
**So that** our company maintains strict access control while removing email delivery friction.

---

## 2. Business Value & Context

- **Why are we building this?**: 
  1. **Bypassing Email Rate Limits & Delivery Failures**: Default SMTP / email services (such as Supabase's built-in provider) impose strict rate limits (3–4 emails/hour), which frequently block or delay employee onboarding.
  2. **Self-Service Convenience**: Employees can register directly under their organization's subdomain.
  3. **Zero Security Compromise**: Self-registered users are created in an inactive state (`is_active = false`), strictly isolated to the tenant's `company_id`, and cannot access any company data until an administrator reviews and approves their account.
- **Target Persona**: New Employees joining a tenant organization, and Company Administrators / HR Managers.
- **Expected Impact**: 100% elimination of email invitation blockers, faster onboarding, and streamlined employee role assignment.

---

## 3. Multi-Tenancy & Security Verification

Every feature touching data must adhere to multi-tenant isolation rules:

- [x] **Data Isolation**: All new user profiles are inserted with `company_id` linked strictly to the tenant company resolved from the active subdomain.
- [x] **Row Level Security (RLS)**: Policies enforce `company_id = (select company_id from profiles where id = auth.uid())`. Inactive users (`is_active = false`) are gated at middleware / layout level and cannot query tenant business records.
- [x] **Server-Side Auth Context**: The `company_id` is resolved server-side from the verified subdomain slug in `companies` table, NEVER trusted from client payloads.
- [x] **Role-Based Access Control (RBAC)**: Only users with role `admin` can view pending accounts, assign roles, approve/activate (`is_active = true`), or reject/delete pending users.
- [x] **Subdomain Scoping**: Signup routes reside strictly under `app/(tenant)/[subdomain]/(auth)/signup` (or client tab on login) with tenant branding (logo, company name, brand color).

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **Tables affected**: `profiles` (uses existing `is_active boolean default false` for self-signups, `company_id uuid references companies(id)`).
- **Migration**: Verify or create index on `profiles(company_id, is_active)` for fast pending queries.
- **RLS Policies**:
  Existing tenant isolation policy:
  ```sql
  alter table profiles enable row level security;
  create policy tenant_isolation on profiles
    using (company_id = (select company_id from profiles where id = auth.uid()));
  ```

### B. API Route Handlers / Server Actions
1. **Endpoint**: `POST /api/auth/signup`
   - **Request Body**: `{ fullName: string, email: string, password: string }`
   - **Action**: Resolves `company_id` from tenant subdomain, creates user in Supabase Auth, inserts `profiles` record with `is_active: false` and `role: 'employee'`.
   - **Response**: `{ data: { user: User, pendingApproval: true }, error: null }`
2. **Endpoint**: `PATCH /api/employees/[id]/activate`
   - **Request Body**: `{ role: 'admin' | 'manager' | 'employee', employeeId?: string, department?: string, designation?: string, dateOfJoining?: string, reportingManagerId?: string }`
   - **Authorization**: Admin only (`currentProfile.role === 'admin'`).
   - **Action**: Sets `is_active: true`, updates assigned employee fields.
3. **Endpoint**: `DELETE /api/employees/[id]/reject`
   - **Authorization**: Admin only (`currentProfile.role === 'admin'`).
   - **Action**: Removes profile and auth account for rejected pending signup.

### C. Frontend / UI Components
1. **Tenant Signup Form**:
   - Route: `app/(tenant)/[subdomain]/(auth)/signup/page.tsx` & Tab in `LoginClient.tsx`
   - Shows tenant branding (logo, company name, brand color).
   - Form fields: Full Name, Email, Password, Confirm Password.
   - On successful signup: Displays "Registration Successful! Your account is pending administrator approval."
2. **Pending Approval Login State**:
   - In `LoginClient.tsx`: If login succeeds but `profile.is_active === false`, displays an interactive "Pending Activation" state with contact admin notice and "Sign Out / Back to Login".
3. **Employee Management Approvals Tab**:
   - In `app/(tenant)/[subdomain]/(app)/employees/EmployeeListClient.tsx`:
   - Adds a "Pending Approvals" badge/tab when pending users exist (`is_active === false`).
   - Admin can view applicant details, configure role/department in an approval modal, and click **"Approve & Activate"** or **"Reject"**.

### D. Mobile & PWA UX (375px viewport)
- Mobile-first responsive card layout for pending approvals with quick-action buttons.
- Touch targets $\ge$ 44x44px.
- Full dark/light mode compatibility matching the tenant's brand color token.

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Tenant Employee Self-Signup (Happy Path)
- **Given** an unauthenticated visitor on tenant domain `https://acme.yourapp.com/login`,
- **When** they click "Sign Up" / "Create Account" and submit their full name, work email, and password,
- **Then** a new auth user and profile are created with `company_id` matching Acme, `is_active = false`, and they are shown a "Registration Submitted — Awaiting Admin Approval" confirmation.

### Scenario 2: Inactive User Login Attempt
- **Given** a self-registered user whose account is not yet activated (`is_active = false`),
- **When** they attempt to log in on `https://acme.yourapp.com/login`,
- **Then** the login flow detects `is_active = false` and presents a clear, branded notice: "Your account is currently pending administrator activation. Please contact your company administrator."

### Scenario 3: Admin Review & Role Activation
- **Given** a logged-in Administrator on `https://acme.yourapp.com/employees`,
- **When** they navigate to the "Pending Approvals" tab, select a pending user, set their role to "Manager", assign department "Sales", and click "Approve & Activate",
- **Then** the user profile is updated with `is_active = true` and the assigned metadata, moving them immediately to the Active Employees directory.

### Scenario 4: Activated Employee First Login
- **Given** a previously pending user who has been activated by their Admin,
- **When** they log in with their email and password,
- **Then** they are seamlessly authenticated and redirected to the tenant `/dashboard` with their assigned role and permissions.

### Scenario 5: Multi-Tenant Signup Isolation
- **Given** two separate tenants "Acme" (`acme.yourapp.com`) and "Beta" (`beta.yourapp.com`),
- **When** a user signs up on `acme.yourapp.com`,
- **Then** their profile is associated ONLY with Acme's `company_id`, and Beta's admin sees zero pending approval entries for that user.

### Scenario 6: Admin Rejects Pending Registration
- **Given** an unauthorized or spam self-registration under tenant Acme,
- **When** the Admin clicks "Reject & Delete",
- **Then** the system deletes the unactivated profile and auth account, and the user is prevented from logging in.

---

## 6. Edge Cases & Boundary Conditions

- [x] **Duplicate Email Registration**: Handled with clear, actionable feedback ("An account with this email already exists. Please sign in.").
- [x] **Wrong Tenant Login**: Cross-tenant email registration and login isolation verified.
- [x] **Zero Pending State**: Clean empty state banner displayed when 0 pending approval requests remain.
- [x] **Admin Self-Deactivation Prevention**: Rejection endpoint explicitly prevents admins from deleting their own active profile.

---

## 7. Implementation Subtasks Breakdown

- [x] **Task 1**: Create `POST /api/auth/signup` endpoint scoped to tenant subdomain with `is_active: false` profile creation.
- [x] **Task 2**: Build `SignupClient.tsx` / Signup tab on `LoginClient.tsx` with tenant branding and confirmation screen.
- [x] **Task 3**: Add pending activation detection and friendly waiting screen in `LoginClient.tsx`.
- [x] **Task 4**: Create `PATCH /api/employees/[id]/activate` and `DELETE /api/employees/[id]/reject` endpoints for admins.
- [x] **Task 5**: Add "Pending Approvals" tab and activation modal to `EmployeeListClient.tsx` in `/employees`.
- [x] **Task 6**: Mobile viewport testing (375px) & verify complete end-to-end self-signup to admin activation flow.

---

## 8. Quality & Verification Gates

Run and verify before completing story:

- [x] `npm run build` — Passes with zero errors
- [x] `npm run lint` — Zero ESLint warnings or errors
- [x] `npm run typecheck` — Strict TypeScript passes (`tsc --noEmit`)
- [x] Mobile viewport tested at 375px width
- [x] RLS verified across two different tenant accounts
- [x] Logged-out access blocked (Auth redirect verified)
- [x] Updated `TRACKER.md` status to ✅ Done

---

## 9. Tracking & Sign-Off

- **Completed Date**: 2026-09-18
- **Migrations Applied**: None required (uses existing `profiles` table schema with `is_active`)
- **Decisions Logged in TRACKER.md**: Replaced strict email-invite dependency with self-signup + admin role activation workflow.
- **Signed Off By**: Antigravity
