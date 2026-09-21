# User Story — STORY-010: Tenant Company Branding Loaders & Granular Route/Table Skeletons

**Story ID:** `STORY-010`  
**Module:** Shared / Foundation / UX & Navigation  
**Priority:** P1  
**Status:** ✅ Done  
**Assigned Branch:** `feat/foundation-story-010`  
**Completed:** 2026-09-21  

---

## 1. Description & Business Value

**As an** ERP user navigating workspaces and tables,  
**I want** page transitions to render immediate page scaffolds with granular skeletons and table loaders, and all tenant screens/loaders to prominently feature the company's logo/monogram rather than the generic app icon,  
**So that** the app feels blazingly fast, seamless, and deeply customized to my organization's brand identity.

---

## 2. Acceptance Criteria

- [x] **AC-1 (Company Logo & Monogram Priority):** Whenever within tenant context (subdomain routes, tenant preloader, login, sidebar, mobile header), display the company's uploaded logo or a stylish branded monogram badge (initials + tenant brand color). Generic app logo (`/logo.png`) is ONLY used on platform-level/marketing pages.
- [x] **AC-2 (Granular Skeletons over Blocking Preloaders):** Replace full-page blocking `TenantPreloader` in `(app)/loading.tsx` with instant, layout-preserving page and table skeletons (`TablePageSkeleton`, `DashboardSkeleton`, `KanbanSkeleton`, etc.).
- [x] **AC-3 (Route-Specific Loading Scaffolds):** Provide customized skeleton layouts for `/dashboard`, `/employees`, `/clients`, `/projects`, `/tasks`, `/attendance`, `/settings`, and detail pages.
- [x] **AC-4 (Refined Table & Data Loaders):** `DataTable` and `SkeletonTable` provide smooth shimmer animations and inline non-blocking indicators during data filtering and async data fetching.
- [x] **AC-5 (TypeScript & Mobile Responsiveness):** All components pass strict TypeScript checks, zero lint errors, and render cleanly on mobile viewports (375px).

---

## 3. Implementation Subtasks

- [x] Subtask 1: Implement `components/shared/CompanyLogo.tsx` for unified company logo and monogram badge rendering.
- [x] Subtask 2: Refactor `TenantPreloader.tsx` to prioritize company logo / monogram over `/logo.png`.
- [x] Subtask 3: Update `Sidebar.tsx`, `MobileHeader.tsx`, and `LoginClient.tsx` to use `CompanyLogo`.
- [x] Subtask 4: Build skeleton components in `components/shared/skeletons/` (`PageHeaderSkeleton`, `DashboardSkeleton`, `TablePageSkeleton`, `KanbanSkeleton`, `DetailPageSkeleton`, `AttendanceSkeleton`).
- [x] Subtask 5: Update `(app)/loading.tsx` and create route-specific `loading.tsx` files.
- [x] Subtask 6: Enhance `SkeletonTable.tsx` and `DataTable.tsx`.
- [x] Subtask 7: Verify with `npm run typecheck`, `npm run lint`, `npm run build`.
