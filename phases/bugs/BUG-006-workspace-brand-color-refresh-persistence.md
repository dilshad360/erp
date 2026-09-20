# BUG-006: Workspace Brand Color Reset on Page Refresh & Universal Persistence

## Defect Summary
- **Bug ID**: `BUG-006`
- **Module**: Foundation / Theme & Tenant Appearance
- **Severity**: P2
- **Assigned Branch**: `fix/theme-brand-color-persistence-bug-006`
- **Reported Date**: 2026-09-20
- **Status**: Resolved

---

## Symptoms & User Experience Impact
When an administrator configured a custom workspace brand color in Company Settings (Appearance tab), the brand color updated temporarily in the local browser session. However:
1. Upon refreshing the page (F5/hard reload), the theme color reset back to the default indigo (`#6366f1`).
2. Other logged-in users (employees, managers) in the workspace were not seeing the updated brand accent consistently across server render cycles.
3. Secondary brand tints (such as `--color-brand-hover` and `--color-brand-subtle`) remained fixed to indigo shades, causing visual discordance on buttons, badges, and active navigation indicators.

---

## Root Cause Analysis (RCA)
1. **CSS Selector Specificity Conflict**: `globals.css` declared `--color-brand`, `--color-brand-hover`, and `--color-brand-subtle` within `:root, html.dark`. In CSS specificity rules, `html.dark` carries a specificity weight of `(0, 1, 1)`. The tenant layout in `app/(tenant)/[subdomain]/layout.tsx` previously injected `:root { --color-brand: ... }` with a lower specificity of `(0, 1, 0)`. Because dark mode (default) adds the `dark` class to `<html>`, the stylesheet's `html.dark` selector overrode the tenant's custom brand color on initial page load and every refresh.
2. **Missing Brand Derivatives Computation**: No dynamic derivation existed for hover states or dark/light subtle tint backgrounds.
3. **Missing Router Refresh & Cache Revalidation**: On appearance settings save, `router.refresh()` and `revalidatePath` were not invoked, leaving client navigation caches with stale server layout metadata.

---

## Tenant Isolation & Multi-Tenancy Audit
- [x] **Row Level Security (RLS)**: Reads on `companies.brand_color` utilize the existing public select policy `companies: public slug lookup` (`20260901000003_companies_public_select.sql`), allowing all tenant members and visitors to view tenant branding.
- [x] **Mutations**: Updates to `companies.brand_color` remain strictly guarded by `PATCH /api/company` and the RLS policy `companies: admin can update own company`, preventing unauthorized changes.

---

## Changes Implemented
1. **`lib/branding.ts`**:
   - Added `normalizeHex` to sanitize 6-character hex values.
   - Added `getBrandColorVariants` to compute `brandHover`, `brandSubtleDark`, and `brandSubtleLight`.
   - Added `generateBrandCss` with high-specificity CSS rules (`:root, html, html.dark, html.light, body`) with `!important` to prevent theme overrides.
   - Added `applyBrandToDocument` for instant client-side DOM synchronization.
2. **`app/globals.css`**:
   - Cleaned up default brand variables on `:root` to allow tenant style overrides to cascade seamlessly.
3. **`app/(tenant)/[subdomain]/layout.tsx`**:
   - Injected `generateBrandCss(company.brand_color)` in the root tenant layout style tag.
4. **`components/shared/TenantProvider.tsx`**:
   - Added a `useEffect` hook to synchronize `document.documentElement` with `tenant.brandColor` on mount and transitions.
5. **`components/settings/CompanySettingsClient.tsx`**:
   - Integrated `applyBrandToDocument` and `router.refresh()` on color change and form save.
6. **`app/api/company/route.ts` & `app/api/company/upload-logo/route.ts`**:
   - Added `revalidatePath` to ensure instant Server Component cache eviction.

---

## Verification & Quality Gates
- `npm run typecheck`: Passed (0 errors)
- `npm run lint`: Passed (0 errors)
- `npm run build`: Passed (0 errors)
- Validated brand styling persistence across page reloads and theme toggling (dark/light).
