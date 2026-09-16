# ERP SaaS — Master Task Tracker

> Update this file as work progresses. Check off tasks here AND in the individual phase files.
> 
> **Status key:** ⬜ Not started · 🔄 In progress · ✅ Done · 🚫 Blocked · ⏭️ Skipped/deferred

---

## Project Health

| Item | Status |
|---|---|
| Current active phase | Phase 2 — Employee Management (Completed) |
| Active branch | `feat/employees` |
| Last updated | 2026-09-15 |
| Next milestone | Phase 3 — Attendance |
| Blockers | — |

---

## Phase Overview

| Phase | Name | Status | Branch | Notes |
|---|---|---|---|---|
| 1 | Foundation | ✅ Done | `feat/foundation` | Schema, auth, subdomain routing |
| 2 | Employee Management | ✅ Done | `feat/employees` | Depends on Phase 1 |
| 3 | Attendance | ⬜ Not started | `feat/attendance` | Depends on Phases 1, 2 |
| 4 | Client Management | ⬜ Not started | `feat/clients` | Depends on Phases 1, 2 |
| 5 | Project Management | ⬜ Not started | `feat/projects` | Depends on Phases 1, 2, 4 |
| 6 | Task Management | ⬜ Not started | `feat/tasks` | Depends on Phases 1, 2, 5 |
| 7 | Polish & PWA | ⬜ Not started | `feat/pwa` | Depends on Phases 1–6 |

---

## Phase 1 — Foundation

> Detailed tasks: [`phases/phase-1-foundation.md`](phases/phase-1-foundation.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Project initialization (Next.js, shadcn, Supabase deps) | ✅ | Next.js 15, Tailwind v4, shadcn initialized |
| 1.2 | Supabase schema: companies + profiles tables | ✅ | Migrations applied to `fvvyuprujtgvmutnfdam` (ap-south-1) |
| 1.3 | Auth helpers + middleware (subdomain routing) | ✅ | lib/supabase/* + middleware.ts written |
| 1.4 | Company onboarding flow (signup form + API) | ✅ | /signup page + /api/onboarding route |
| 1.5 | Tenant shell + login page | ✅ | Tenant layout, login, AppShell, Sidebar, BottomNav |
| 1.6 | Dashboard placeholder | ✅ | 4 stat cards, PageHeader, StatCard component |
| 1.7 | Phase 1 verification (build, lint, type, RLS, E2E test) | ✅ | Build passes, strict tsc passes, RLS active |

**Phase 1 done when:** Signup → subdomain → login → dashboard flow works end-to-end. RLS tested with two tenants.

---

## Phase 2 — Employee Management

> Detailed tasks: [`phases/phase-2-employees.md`](phases/phase-2-employees.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | DataTable shared component (TanStack Table) | ✅ | Reused by all list pages (`components/shared/DataTable.tsx`) |
| 2.2 | Employee list page | ✅ | `app/(tenant)/[subdomain]/(app)/employees/page.tsx` |
| 2.3 | Invite employee flow (auth invite + profile insert) | ✅ | `app/api/employees/route.ts` & `/employees/new` & `/set-password` |
| 2.4 | Employee profile page | ✅ | `app/(tenant)/[subdomain]/(app)/employees/[id]/page.tsx` |
| 2.5 | Avatar upload (Supabase Storage) | ✅ | `app/api/employees/upload-avatar/route.ts` & Storage policy |
| 2.6 | Role management (admin/manager/employee) | ✅ | Simple string role gating (`admin`/`manager`/`employee`) |
| 2.7 | Phase 2 verification | ✅ | Build passes, strict tsc passes, components verified |

**Phase 2 done when:** Admin can invite an employee who can log in and see their profile. DataTable works with real data.

---

## Phase 3 — Attendance

> Detailed tasks: [`phases/phase-3-attendance.md`](phases/phase-3-attendance.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Attendance schema + RLS + haversine function | ⬜ | |
| 3.2 | Check-in / check-out API routes | ⬜ | |
| 3.3 | Check-in page (employee, mobile-first) | ⬜ | Priority screen — polish this |
| 3.4 | Employee monthly calendar view | ⬜ | |
| 3.5 | Admin attendance table + CSV export | ⬜ | |
| 3.6 | Dashboard: live attendance stat | ⬜ | |
| 3.7 | Phase 3 verification | ⬜ | |

**Phase 3 done when:** Employee checks in on phone, geolocation captured, admin sees it, CSV exports correctly.

---

## Phase 4 — Client Management

> Detailed tasks: [`phases/phase-4-clients.md`](phases/phase-4-clients.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Clients schema + RLS | ⬜ | |
| 4.2 | Shared components: FormField, ConfirmDialog, EmptyState | ⬜ | Reused everywhere |
| 4.3 | Client API routes (CRUD) | ⬜ | |
| 4.4 | Client list page | ⬜ | |
| 4.5 | Add / edit client form | ⬜ | |
| 4.6 | Client detail page | ⬜ | |
| 4.7 | Phase 4 verification | ⬜ | |

**Phase 4 done when:** Full client CRUD working. Shared form components ready for reuse.

---

## Phase 5 — Project Management

> Detailed tasks: [`phases/phase-5-projects.md`](phases/phase-5-projects.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Projects schema + RLS | ⬜ | |
| 5.2 | Project API routes (CRUD) | ⬜ | |
| 5.3 | Project list page (card + table view) | ⬜ | |
| 5.4 | New project form (with ClientSelect) | ⬜ | |
| 5.5 | Project detail page (timeline, budget, tasks summary) | ⬜ | |
| 5.6 | ClientSelect shared component | ⬜ | |
| 5.7 | Dashboard: live project stats | ⬜ | |
| 5.8 | Phase 5 verification | ⬜ | |

**Phase 5 done when:** Projects can be created and linked to clients. Detail page shows all data. Budget formatted as INR.

---

## Phase 6 — Task Management

> Detailed tasks: [`phases/phase-6-tasks.md`](phases/phase-6-tasks.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Tasks schema + RLS + updated_at trigger | ⬜ | |
| 6.2 | Task + task-status API routes | ⬜ | |
| 6.3 | Task list view (within project) | ⬜ | |
| 6.4 | Task creation / edit form (sheet) | ⬜ | |
| 6.5 | Kanban board (@dnd-kit) | ⬜ | Most complex component |
| 6.6 | My Tasks page (cross-project) | ⬜ | |
| 6.7 | Kanban column management (settings) | ⬜ | |
| 6.8 | Dashboard: task stats + my tasks quick list | ⬜ | |
| 6.9 | Phase 6 verification | ⬜ | |

**Phase 6 done when:** Tasks created in list view appear in Kanban. Drag-and-drop persists to DB. My Tasks works.

---

## Phase 7 — Polish & PWA

> Detailed tasks: [`phases/phase-7-polish-pwa.md`](phases/phase-7-polish-pwa.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | PWA setup (service worker, manifest.ts, icons) | ⬜ | |
| 7.2 | Offline attendance queue (IndexedDB + sync) | ⬜ | |
| 7.3 | Company settings (logo, brand color, geofence) | ⬜ | |
| 7.4 | Mobile UX pass (all pages at 375px) | ⬜ | |
| 7.5 | Lighthouse audit (≥85 mobile performance) | ⬜ | |
| 7.6 | Accessibility pass | ⬜ | |
| 7.7 | PWA install prompt | ⬜ | |
| 7.8 | Pre-launch checklist (hosting, SSL, RLS, security) | ⬜ | Don't skip |
| 7.9 | Phase 7 verification | ⬜ | |

**Phase 7 done when:** App installs as PWA, offline check-in works, Lighthouse ≥ 85, pre-launch checklist complete.

---

## Shared Components — Build Status

These components are built during specific phases but used across the whole app. Track them here.

| Component | Built in Phase | Status | File |
|---|---|---|---|
| `AppShell` | Phase 1 | ✅ | `components/shared/AppShell.tsx` |
| `BottomNav` | Phase 1 | ✅ | `components/shared/BottomNav.tsx` |
| `Sidebar` | Phase 1 | ✅ | `components/shared/Sidebar.tsx` |
| `TenantProvider` | Phase 1 | ✅ | `components/shared/TenantProvider.tsx` |
| `StatCard` | Phase 1 | ✅ | `components/shared/StatCard.tsx` |
| `PageHeader` | Phase 1 | ✅ | `components/shared/PageHeader.tsx` |
| `DataTable` | Phase 2 | ✅ | `components/shared/DataTable.tsx` |
| `SkeletonTable` | Phase 2 | ✅ | `components/shared/SkeletonTable.tsx` |
| `Avatar` | Phase 2 | ✅ | `components/shared/Avatar.tsx` |
| `FormField` | Phase 4 | ⬜ | `components/shared/FormField.tsx` |
| `ConfirmDialog` | Phase 4 | ⬜ | `components/shared/ConfirmDialog.tsx` |
| `EmptyState` | Phase 4 | ⬜ | `components/shared/EmptyState.tsx` |
| `LoadingButton` | Phase 4 | ⬜ | `components/shared/LoadingButton.tsx` |
| `ClientSelect` | Phase 5 | ⬜ | `components/shared/ClientSelect.tsx` |
| `UserSelect` | Phase 6 | ⬜ | `components/shared/UserSelect.tsx` |
| `DatePicker` | Phase 6 | ⬜ | `components/shared/DatePicker.tsx` |
| `ColorPicker` | Phase 7 | ⬜ | `components/shared/ColorPicker.tsx` |

---

## Database Migration Status

| Migration File | Status | Applied To |
|---|---|---|
| `20260901000000_init_companies_profiles.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260901000001_rls_companies_profiles.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260902000000_storage_avatars.sql` | ✅ | Storage bucket & RLS policies |
| `20260902000000_attendance_logs.sql` | ⬜ | — |
| `20260902000001_rls_attendance.sql` | ⬜ | — |
| `20260903000000_clients.sql` | ⬜ | — |
| `20260903000001_rls_clients.sql` | ⬜ | — |
| `20260903000002_projects.sql` | ⬜ | — |
| `20260903000003_rls_projects.sql` | ⬜ | — |
| `20260904000000_tasks_statuses.sql` | ⬜ | — |
| `20260904000001_rls_tasks.sql` | ⬜ | — |
| `20260904000002_functions_haversine_checkin.sql` | ⬜ | — |

---

## Pre-Launch Checklist

These items block going live. Track them separately.

| Item | Status | Notes |
|---|---|---|
| Move off Vercel Hobby | ⬜ | Must do before first paying customer |
| Wildcard DNS configured | ⬜ | `*.yourapp.com` → host |
| Wildcard SSL verified | ⬜ | Auto-renewing |
| Supabase on paid plan + PITR | ⬜ | |
| DB backup schedule confirmed | ⬜ | |
| RLS cross-tenant isolation test (3 tenants) | ⬜ | |
| Service role key NOT in client bundle | ⬜ | |
| Error tracking (Sentry) set up | ⬜ | |
| Uptime monitoring | ⬜ | |
| Privacy policy page live | ⬜ | GPS data disclosure required |
| Terms of service page live | ⬜ | |
| Rate limiting on onboarding endpoint | ⬜ | |

---

## Decisions & Notes Log

Use this section to track important decisions made during development so future agents have context.

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-15 | No client login portal in MVP | Scope control — revisit after launch |
| 2026-09-15 | No payroll, leave, or GST invoicing in MVP | Complex compliance scope — post-launch |
| 2026-09-15 | Absence is derived, not stored | No "absent" rows in DB — calculated from missing logs |
| 2026-09-15 | No global state lib (no Redux/Zustand) | App is server-rendered; local state + context is sufficient |
| 2026-09-15 | App is dark mode only | Simplicity for MVP — light mode can be added later |
| 2026-09-15 | Project team is derived from task assignees | No `project_members` table — avoid extra complexity |
| 2026-09-15 | Budget always INR | Currency column deferred — only one market for now |
