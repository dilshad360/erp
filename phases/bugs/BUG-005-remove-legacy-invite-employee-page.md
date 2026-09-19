# [BUG-005]: Remove Legacy "Invite Employee" Dashboard Page & Obsolete Invite Endpoints Post-Self-Signup Transition

> **Status:** ✅ Resolved  
> **Severity:** P2 - Medium (UX Inconsistency & Dead Code Removal)  
> **Module Affected:** Employees / Foundation  
> **Target Branch:** `fix/employees-bug-005`  
> **Reported Date:** 2026-09-19  
> **Resolved Date:** 2026-09-19  
> **Assignee / Agent:** Antigravity AI Agent  

---

## 1. Defect Description & Symptoms

- **Summary**: Following the implementation of tenant employee self-signup and admin approval workflow (`STORY-005`), the legacy "Invite Employee" page (`/employees/new`), invite submission endpoint (`POST /api/employees`), resend invite route (`/api/employees/[id]/resend-invite`), and dashboard trigger buttons remained in the codebase, presenting redundant, conflicting onboarding paths.
- **Observed Behavior**:
  - The Employees list header and empty state rendered "Invite Employee" CTA buttons directing admins to `/employees/new`.
  - `/employees/new` rendered `InviteFormClient` which invoked `POST /api/employees` using Supabase Auth admin email invitation tokens (`inviteUserByEmail`), bypassing the modern self-signup + activation approval flow.
  - The employee detail page contained dead state and code for resending invite links (`/api/employees/[id]/resend-invite`).
- **Expected Behavior**:
  - Onboarding should strictly flow through workspace self-registration (`/:subdomain/signup`) followed by administrative review and activation under the "Pending Approvals" tab in `/employees`.
  - The redundant `/employees/new` page, legacy email invite endpoints, and stale "Invite Employee" action buttons should be completely decommissioned.

---

## 2. Environment & Context

- **Subdomain / Tenant**: Any tenant subdomain (e.g. `acme.localhost:3000`)
- **User Role**: `admin`
- **Device / Viewport**: Mobile (375px) & Desktop (1440px)
- **Browser / OS**: All supported browsers
- **Relevant URL**: `http://[subdomain].localhost:3000/employees`

---

## 3. Steps to Reproduce

1. Log in as an admin under any tenant workspace.
2. Navigate to `/[subdomain]/employees`.
3. Observe the top "Invite Employee" button in the page header and in the empty state.
4. Clicking "Invite Employee" opened `/[subdomain]/employees/new`, which sent legacy email invitations rather than using the active self-signup & activation approval lifecycle.

---

## 4. Multi-Tenancy & Security Impact Assessment

- [x] **Cross-Tenant Data Leak Risk**: None. Tenant isolation was preserved.
- [x] **Auth Bypass Risk**: Decommissioning the legacy `POST /api/employees` and `resend-invite` endpoints eliminates obsolete service-role token generation paths, simplifying auth security down to the unified self-signup + activation model.
- [x] **Data Corruption Risk**: None.

---

## 5. Root Cause Analysis (RCA)

- **Suspected Subsystem**: Frontend Employee Management & Legacy Invite API Endpoints.
- **Root Cause Explanation**:
  When `STORY-005` (Tenant Employee Self-Signup & Admin Activation Workflow) was implemented, the new `Pending Approvals` tab and `/api/employees/[id]/activate` workflow were added to `EmployeeListClient`. However, the original Phase 2 email-invite components (`/employees/new/page.tsx`, `InviteFormClient.tsx`, `POST /api/employees`, `resend-invite` route, and PageHeader action button) were not purged, resulting in duplicate onboarding paths and dead code.
- **Affected Files**:
  - `app/(tenant)/[subdomain]/(app)/employees/new/page.tsx` *(Deleted)*
  - `app/(tenant)/[subdomain]/(app)/employees/new/InviteFormClient.tsx` *(Deleted)*
  - `app/api/employees/[id]/resend-invite/route.ts` *(Deleted)*
  - `app/api/employees/route.ts` *(Cleaned up)*
  - `app/(tenant)/[subdomain]/(app)/employees/EmployeeListClient.tsx` *(Updated)*
  - `app/(tenant)/[subdomain]/(app)/employees/[id]/page.tsx` *(Cleaned up)*
  - `app/(tenant)/[subdomain]/(app)/employees/[id]/ProfileDetailClient.tsx` *(Cleaned up)*
  - `app/(tenant)/[subdomain]/(auth)/set-password/page.tsx` *(Copy updated)*

---

## 6. Fix Implementation Plan

- [x] **Step 1**: Remove legacy `/employees/new` page and `InviteFormClient` component.
- [x] **Step 2**: Remove obsolete `resend-invite` API endpoint.
- [x] **Step 3**: Remove legacy `POST` invite handler from `app/api/employees/route.ts`, keeping company-scoped `GET` (with `?active=true` filtering support).
- [x] **Step 4**: Remove "Invite Employee" buttons from `EmployeeListClient.tsx` and update empty-state messaging to direct admins to "Pending Approvals".
- [x] **Step 5**: Clean up unused `isConfirmed` auth queries and invite states from employee profile detail view.
- [x] **Step 6**: Update documentation in `frontend.md`, `backend.md`, and `TRACKER.md`.

---

## 7. Verification & Regression Checklist

- [x] Legacy `/employees/new` route removed: navigating to it returns 404.
- [x] `npm run build` — Passes with zero errors.
- [x] `npm run lint` — Passes with zero warnings/errors.
- [x] `npm run typecheck` — Passes with zero type errors.
- [x] Multi-tenant check: Verified tenant isolation remains 100% intact.
- [x] Mobile check (375px): Verified clean responsive layout on `/employees`.
- [x] Update status in `TRACKER.md` to ✅ Resolved.

---

## 8. Post-Mortem & Preventative Action

- **Lessons Learned**: When evolving core user flows (such as onboarding and authentication), ensure legacy routes, forms, and backend mutation handlers are explicitly audited and purged in the same release or follow-up maintenance task.
- **Preventative Measure**: Maintained strict route inventory in `frontend.md` and `backend.md`.
- **Logged in TRACKER.md Decisions Log**: Yes.
