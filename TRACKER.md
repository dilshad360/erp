# ERP SaaS — Master Task Tracker

> Update this file as work progresses. Check off tasks here AND in the individual phase files.
> 
> **Status key:** ⬜ Not started · 🔄 In progress · ✅ Done · 🚫 Blocked · ⏭️ Skipped/deferred

---

## Project Health

| Item | Status |
|---|---|
| Current active phase | Phase 6 — Task Management (Completed) |
| Active branch | `feat/tasks` |
| Last updated | 2026-09-16 |
| Next milestone | Phase 7 — Polish & PWA |
| Blockers | — |

---

## Phase Overview

| Phase | Name | Status | Branch | Notes |
|---|---|---|---|---|
| 1 | Foundation | ✅ Done | `feat/foundation` | Schema, auth, subdomain routing |
| 2 | Employee Management | ✅ Done | `feat/employees` | Depends on Phase 1 |
| 3 | Attendance | ✅ Done | `feat/attendance` | Depends on Phases 1, 2 |
| 4 | Client Management | ✅ Done | `feat/clients` | Depends on Phases 1, 2 |
| 5 | Project Management | ✅ Done | `feat/projects` | Depends on Phases 1, 2, 4 |
| 6 | Task Management | ✅ Done | `feat/tasks` | Depends on Phases 1, 2, 5 |
| 7 | Polish & PWA | ⬜ Not started | `feat/pwa` | Depends on Phases 1–6 |

---

## AI-Assisted Story & Bug Tracking

> Refer to [`AI_WORKFLOW.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/AI_WORKFLOW.md) for full execution protocol.  
> Story Template: [`templates/story-template.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/templates/story-template.md) · Bug Template: [`templates/bug-template.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/templates/bug-template.md)

### Active Stories & Features (`STORY-xxx` / `FEAT-xxx`)

| Story ID | Title | Module | Priority | Status | Branch | Story File |
|---|---|---|---|---|---|---|
| `STORY-001` | Offline Check-In & Sync Queue | Attendance / PWA | P1 | ⬜ Backlog | `feat/attendance-story-001` | [`phases/stories/STORY-001.md`](phases/stories/) |
| `STORY-002` | Project Member Allocation & Capacity | Projects | P2 | ⬜ Backlog | `feat/projects-story-002` | [`phases/stories/STORY-002.md`](phases/stories/) |
| `STORY-003` | Dark Mode & Company Logo on Login Screen | Foundation / Auth | P2 | ✅ Done | `feat/foundation-story-003` | [`phases/stories/STORY-003-login-dark-mode-company-branding.md`](phases/stories/STORY-003-login-dark-mode-company-branding.md) |
| `STORY-004` | Session Auto-Login & Tenant Branded Preloader | Foundation / Auth & UX | P1 | ✅ Done | `feat/foundation-story-004` | [`phases/stories/STORY-004-autologin-preloader.md`](phases/stories/STORY-004-autologin-preloader.md) |
| `STORY-005` | Tenant Employee Self-Signup & Admin Activation Workflow | Foundation / Auth & Employees | P1 | ✅ Done | `feat/auth-story-005` | [`phases/stories/STORY-005-tenant-employee-self-signup-and-admin-activation.md`](phases/stories/STORY-005-tenant-employee-self-signup-and-admin-activation.md) |
| `STORY-006` | Entity Deletion Lifecycle, Tenant Task Visibility & Multi-Assignee Collaboration | Clients / Projects / Tasks | P1 | ✅ Done | `feat/tasks-clients-story-006` | [`phases/stories/STORY-006-crud-deletion-task-collaboration-multi-assignee.md`](phases/stories/STORY-006-crud-deletion-task-collaboration-multi-assignee.md) |
| `STORY-007` | Rich Text Editor Integration for Tasks, Projects & Client Notes | Shared / Tasks / Projects / Clients | P2 | ✅ Done | `feat/rich-text-story-007` | [`phases/stories/STORY-007-rich-text-editor-tasks-projects-clients.md`](phases/stories/STORY-007-rich-text-editor-tasks-projects-clients.md) |
| `STORY-008` | Global Preloader & Navigation Progress Suite | Foundation / Shared UX & Navigation | P1 | ✅ Done | `feat/foundation-story-008` | [`phases/stories/STORY-008-global-preloader-suite.md`](phases/stories/STORY-008-global-preloader-suite.md) |
| `STORY-010` | Tenant Company Branding Loaders & Granular Route/Table Skeletons | Shared / Foundation / UX & Navigation | P1 | ✅ Done | `feat/foundation-story-010` | [`phases/stories/STORY-010-tenant-company-branding-loader-and-granular-skeletons.md`](phases/stories/STORY-010-tenant-company-branding-loader-and-granular-skeletons.md) |
| `STORY-011` | Forgot Password & Self-Serve Account Recovery | Foundation / Auth & Security | P1 | ✅ Done | `feat/auth-story-011` | [`phases/stories/STORY-011-forgot-password-recovery-flow.md`](phases/stories/STORY-011-forgot-password-recovery-flow.md) |
| `STORY-012` | Rebrand Application to Octyvo & Scrub ERP/SaaS Terminology | Foundation / Branding & Marketing | P1 | ✅ Done | `feat/branding-octyvo` | [`phases/stories/STORY-012-rebrand-octyvo.md`](phases/stories/STORY-012-rebrand-octyvo.md) |

### Bug & Defect Registry (`BUG-xxx`)

| Bug ID | Title | Module | Severity | Status | Branch | Bug File |
|---|---|---|---|---|---|---|
| `BUG-001` | Employee settings role isolation & dedicated employee view | Settings / Role Access | P2 | ✅ Resolved | `fix/settings-bug-001` | [`phases/bugs/BUG-001-employee-settings-role-isolation.md`](phases/bugs/BUG-001-employee-settings-role-isolation.md) |
| `BUG-002` | Mobile company logo header & BottomNav More drawer | Mobile AppShell / Navigation | P2 | ✅ Resolved | `fix/mobile-nav-bug-002` | [`phases/bugs/BUG-002-mobile-bottomnav-more-and-logo-missing.md`](phases/bugs/BUG-002-mobile-bottomnav-more-and-logo-missing.md) |
| `BUG-003` | Mobile BottomNav tactile press feedback & transition indicator | Mobile AppShell / Navigation | P2 | ✅ Resolved | `fix/mobile-nav-bug-003` | [`phases/bugs/BUG-003-mobile-bottom-nav-press-feedback.md`](phases/bugs/BUG-003-mobile-bottom-nav-press-feedback.md) |
| `BUG-004` | Mobile viewport bottom scroll clearance obscured by BottomNav | Mobile Layout / AppShell | P1 | ✅ Resolved | `fix/mobile-viewport-bug-004` | [`phases/bugs/BUG-004-mobile-viewport-scroll-clearance.md`](phases/bugs/BUG-004-mobile-viewport-scroll-clearance.md) |
| `BUG-005` | Remove Legacy "Invite Employee" Dashboard Page & Obsolete Invite Endpoints | Employees / Auth Lifecycle | P2 | ✅ Resolved | `fix/employees-bug-005` | [`phases/bugs/BUG-005-remove-legacy-invite-employee-page.md`](phases/bugs/BUG-005-remove-legacy-invite-employee-page.md) |
| `BUG-006` | Workspace Brand Color Reset on Page Refresh & Universal Persistence | Foundation / Theme & Tenant Appearance | P2 | ✅ Resolved | `fix/theme-brand-color-persistence-bug-006` | [`phases/bugs/BUG-006-workspace-brand-color-refresh-persistence.md`](phases/bugs/BUG-006-workspace-brand-color-refresh-persistence.md) |

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
| 3.1 | Attendance schema + RLS + haversine function | ✅ | 3 migrations applied to `fvvyuprujtgvmutnfdam` |
| 3.2 | Check-in / check-out API routes | ✅ | `/api/attendance/checkin` + `/api/attendance/checkout` |
| 3.3 | Check-in page (employee, mobile-first) | ✅ | `AttendanceCheckInPanel` + `LocationStatus` |
| 3.4 | Employee monthly calendar view | ✅ | `AttendanceMonthCalendar` with click popover |
| 3.5 | Admin attendance table + CSV export | ✅ | Role-gated `/attendance/admin` + `AdminAttendanceTable` |
| 3.6 | Dashboard: live attendance stat | ✅ | Real DB count replacing hardcoded 0 |
| 3.7 | Phase 3 verification | ✅ | build + lint + typecheck all pass |

**Phase 3 done when:** Employee checks in on phone, geolocation captured, admin sees it, CSV exports correctly.

---

## Phase 4 — Client Management

> Detailed tasks: [`phases/phase-4-clients.md`](phases/phase-4-clients.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Clients schema + RLS | ✅ | Migrations applied to `fvvyuprujtgvmutnfdam` |
| 4.2 | Shared components: FormField, ConfirmDialog, EmptyState, LoadingButton | ✅ | Reusable across modules |
| 4.3 | Client API routes (CRUD) | ✅ | `/api/clients` and `/api/clients/[id]` |
| 4.4 | Client list page | ✅ | DataTable + search + Active/All filters |
| 4.5 | Add / edit client form | ✅ | React Hook Form + Zod + GSTIN regex validation |
| 4.6 | Client detail page | ✅ | Contact info, notes, linked projects, inline edit, deactivate dialog |
| 4.7 | Phase 4 verification | ✅ | build + lint + typecheck all pass |

**Phase 4 done when:** Full client CRUD working. Shared form components ready for reuse.

---

## Phase 5 — Project Management

> Detailed tasks: [`phases/phase-5-projects.md`](phases/phase-5-projects.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Projects schema + RLS | ✅ | `20260903000002_projects.sql` + `20260903000003_rls_projects.sql` applied |
| 5.2 | Project API routes (CRUD) | ✅ | `/api/projects` + `/api/projects/[id]` (soft delete via status = 'cancelled') |
| 5.3 | Project list page (card + table view) | ✅ | Card/table toggle persisted in localStorage, status & client filters |
| 5.4 | New project form (with ClientSelect) | ✅ | React Hook Form + Zod, date validation, INR budget input |
| 5.5 | Project detail page (timeline, budget, tasks summary) | ✅ | Timeline progress bar, formatINR, tasks overview, inline edit, archive dialog |
| 5.6 | ClientSelect shared component | ✅ | Searchable combobox fetching active clients with add new link |
| 5.7 | Dashboard: live project stats | ✅ | Live active projects count + recent projects cards from DB |
| 5.8 | Phase 5 verification | ✅ | build + lint + typecheck all pass |

**Phase 5 done when:** Projects can be created and linked to clients. Detail page shows all data. Budget formatted as INR.

---

## Phase 6 — Task Management

> Detailed tasks: [`phases/phase-6-tasks.md`](phases/phase-6-tasks.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Tasks schema + RLS + updated_at trigger | ✅ | `20260904000000_tasks_statuses.sql` + `20260904000001_rls_tasks.sql` applied |
| 6.2 | Task + task-status API routes | ✅ | `/api/tasks`, `/api/tasks/[id]`, `/api/task-statuses`, `/api/task-statuses/[id]`, `/api/task-statuses/reorder` |
| 6.3 | Task list view (within project) | ✅ | `/projects/[projectId]/tasks?view=list` with filters |
| 6.4 | Task creation / edit form (sheet) | ✅ | `TaskForm.tsx` + `TaskSheet.tsx` + `UserSelect.tsx` + `DatePicker.tsx` |
| 6.5 | Kanban board (@dnd-kit) | ✅ | `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `KanbanCardOverlay` — optimistic DnD |
| 6.6 | My Tasks page (cross-project) | ✅ | `/tasks` — grouped by project, filter tabs |
| 6.7 | Kanban column management (settings) | ✅ | `/settings` — `KanbanColumnManager` with drag-to-reorder, inline edit, color picker |
| 6.8 | Dashboard: task stats + my tasks quick list | ✅ | Live open tasks count + 5-task quick list |
| 6.9 | Phase 6 verification | ✅ | `npm run build` exits 0 — 0 type errors, 0 lint errors |

**Phase 6 done when:** Tasks created in list view appear in Kanban. Drag-and-drop persists to DB. My Tasks works.

---

## Phase 7 — Polish & PWA

> Detailed tasks: [`phases/phase-7-polish-pwa.md`](phases/phase-7-polish-pwa.md)

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | PWA setup (service worker, manifest.ts, icons) | ✅ | `sw.js` + `manifest.ts` + `public/icons` + `ServiceWorkerRegister.tsx` |
| 7.2 | Offline attendance queue (IndexedDB + sync) | ✅ | `lib/offline-queue.ts` using `idb` + `public/offline.html` + auto sync |
| 7.3 | Company settings (logo, brand color, geofence) | ✅ | `/settings` — general, appearance, geofence, logo upload, brand color live preview |
| 7.4 | Mobile UX pass (all pages at 375px) | ✅ | 375px responsive grids, safe-area-pb insets on BottomNav, full-width inputs |
| 7.5 | Lighthouse audit (≥85 mobile performance) | ✅ | Optimized images, minimal bundle, Turbopack verified |
| 7.6 | Accessibility pass | ✅ | ARIA labels, focus rings, high-contrast statuses, scoped tables |
| 7.7 | PWA install prompt | ✅ | `components/pwa/InstallPrompt.tsx` with Android prompt + iOS instructions |
| 7.8 | Pre-launch checklist (hosting, SSL, RLS, security) | ✅ | Privacy policy & Terms pages live, RLS active, storage bucket configured |
| 7.9 | Phase 7 verification | ✅ | `npm run build` exits 0 — 0 type errors, 0 lint errors |

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
| `FormField` | Phase 4 | ✅ | `components/shared/FormField.tsx` |
| `ConfirmDialog` | Phase 4 | ✅ | `components/shared/ConfirmDialog.tsx` |
| `EmptyState` | Phase 4 | ✅ | `components/shared/EmptyState.tsx` |
| `LoadingButton` | Phase 4 | ✅ | `components/shared/LoadingButton.tsx` |
| `ClientSelect` | Phase 5 | ✅ | `components/shared/ClientSelect.tsx` |
| `UserSelect` | Phase 6 | ✅ | `components/shared/UserSelect.tsx` |
| `DatePicker` | Phase 6 | ✅ | `components/shared/DatePicker.tsx` |
| `ColorPicker` | Phase 7 | ✅ | `components/shared/ColorPicker.tsx` |
| `UserMultiSelect` | STORY-006 | ✅ | `components/shared/UserMultiSelect.tsx` |
| `AssigneeAvatarGroup` | STORY-006 | ✅ | `components/shared/AssigneeAvatarGroup.tsx` |
| `RichTextEditor` | STORY-007 | ⬜ | `components/shared/RichTextEditor.tsx` |
| `RichTextViewer` | STORY-007 | ⬜ | `components/shared/RichTextViewer.tsx` |

---

## Database Migration Status

| Migration File | Status | Applied To |
|---|---|---|
| `20260901000000_init_companies_profiles.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260901000001_rls_companies_profiles.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260901000003_companies_public_select.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260901000004_fix_rls_recursion.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260901000005_storage_avatars.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` (renamed from 20260902000000) |
| `20260902000000_attendance_logs.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260902000001_rls_attendance.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260902000002_functions_haversine_checkin.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260903000000_clients.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260903000001_rls_clients.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260903000002_projects.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260903000003_rls_projects.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260904000000_tasks_statuses.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260904000001_rls_tasks.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260905000000_storage_logos.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |
| `20260906000000_task_assignees_and_deletions.sql` | ✅ | Applied to `fvvyuprujtgvmutnfdam` |

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
| RLS cross-tenant isolation test (3 tenants) | ✅ | Verified with RLS policies across all tables |
| Service role key NOT in client bundle | ✅ | Verified — only NEXT_PUBLIC_ used in client |
| Error tracking (Sentry) set up | ⬜ | Post-MVP / Production deployment |
| Uptime monitoring | ⬜ | Post-MVP / Production deployment |
| Privacy policy page live | ✅ | `/privacy` — GPS location data disclosure included |
| Terms of service page live | ✅ | `/terms` — Terms of service live |
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
| 2026-09-16 | Multi-session punches supported | Allows employees to check out for lunch/breaks and check in again; total hours aggregated across sessions |
| 2026-09-16 | Client soft deletion & GSTIN format validation | Deactivating sets `status = 'inactive'` preserving audit trail; Indian 15-character GSTIN regex validated optionally |
| 2026-09-16 | Project soft delete sets status = 'cancelled' | Retains historical project data and references from tasks; prevents orphan tasks |
| 2026-09-16 | Indian Numbering System formatting (formatINR) | Explicit currency formatting with lakhs and crores (`₹15,00,000`) per Indian business standards |
| 2026-09-18 | Settings Role Isolation (`BUG-001`) | Bifurcated `/settings`: Employees get personal profile, avatar, security, preferences & read-only workplace info; Admins manage workspace details, branding, Kanban statuses & danger zone. |
| 2026-09-18 | Login Branding & Dark Mode (`STORY-003`) | Server-rendered login screen queries tenant branding by slug; displays uploaded company logo (or brand initial fallback), dynamic brand color accents, and full dark-mode surface polish. |
| 2026-09-18 | Mobile Header & BottomNav Sheet (`BUG-002`) | Added sticky `MobileHeader` with company logo, name, avatar, and theme toggle; enhanced `BottomNav` More tab to open a slide-up drawer for accessing Employees, Clients, Settings, Theme Switcher, and Sign Out. |
| 2026-09-18 | Session Auto-Login & Preloader (`STORY-004`) | Implemented instant server-side middleware auto-redirect to `/dashboard` for active sessions, client-side session verification in `LoginClient`, reusable `TenantPreloader` with animated glowing brand accent, and Next.js streaming `loading.tsx` boundaries. |
| 2026-09-18 | Mobile BottomNav Active Press & Transition Bar (`BUG-003`) | Added tactile active scale-down press states, immediate optimistic pending tab highlight with pulsing dot, and global top-screen `RouteProgressBar` for instant visual page loading feedback on mobile. |
| 2026-09-19 | Deletion Lifecycle, Multi-Assignees & Global Tasks (`STORY-006`) | Implemented hard deletion with cascade safeguards across Clients, Projects, and Tasks; created `task_assignees` junction table for multi-user assignment with `UserMultiSelect` and stacked `AssigneeAvatarGroup`; opened company-wide task visibility under `/tasks` with "My Tasks" vs "All Tasks" toggle and cross-project task creation. |
| 2026-09-19 | Decommission Legacy Invite Flow (`BUG-005`) | Deprecated and purged redundant `/employees/new` page, `POST /api/employees` invite handler, and `resend-invite` API endpoint post-self-signup transition (`STORY-005`); unified employee onboarding exclusively through workspace signup and admin Pending Approvals activation. |
| 2026-09-19 | Global Preloader & Navigation Progress Suite (`STORY-008`) | Implemented top `RouteProgressBar` with App Router navigation link click interception & trickle animation, `GlobalLoadingProvider` and `useGlobalLoading` programmatic loading context, enhanced `TenantPreloader` with ambient glow and indeterminate animation, and streaming `loading.tsx` coverage across all route tiers. |


