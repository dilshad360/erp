# STORY-008: Global Preloader & Navigation Progress Suite

## Overview
- **Story ID**: `STORY-008`
- **Module**: Foundation / Shared UX & Navigation
- **Priority**: P1
- **Status**: ✅ Done
- **Branch**: `feat/foundation-story-008`

---

## User Story
**As an** ERP user (admin, manager, or employee),  
**I want** instant visual feedback during page navigations, streaming data loads, and global async operations,  
**So that** the application feels snappy, responsive, and seamless without blank screens or uncertainty during transitions.

---

## Acceptance Criteria
1. **Top Route Progress Bar**:
   - An elegant top progress bar triggers on every internal link click and route transition.
   - Smooth trickle animation and brand glow (`var(--color-brand)`).
   - Automatically completes (100%) and fades out when the new page renders.
2. **Global Loading Context & Provider**:
   - `GlobalLoadingProvider` and `useGlobalLoading()` hook available across the app.
   - Supports programmatic `startLoading(message)` / `stopLoading()` and `withLoading(promise, message)`.
3. **High-Fidelity Tenant & Global Preloaders**:
   - `TenantPreloader` seamlessly falls back to ERP branding or tenant-specific branding (company logo, name, brand color).
   - Animated radial glow, glowing pulse badge, spinner, and indeterminate progress bar.
   - Fully dark and light mode compatible.
4. **App Router Streaming Boundaries**:
   - Dedicated `loading.tsx` files across root, marketing, tenant, app, and login segments to eliminate white screens.

---

## Subtasks
- [x] Create `phases/stories/STORY-008-global-preloader-suite.md`
- [x] Implement `components/shared/RouteProgressBar.tsx`
- [x] Implement `components/shared/GlobalLoadingProvider.tsx`
- [x] Implement `components/shared/GlobalPreloader.tsx`
- [x] Enhance `components/shared/TenantPreloader.tsx`
- [x] Add `app/loading.tsx`, `app/(marketing)/loading.tsx`, `app/(tenant)/[subdomain]/loading.tsx`
- [x] Update `app/layout.tsx` with providers and route progress bar
- [x] Verify with `npm run typecheck`, `npm run lint`, and `npm run build`
