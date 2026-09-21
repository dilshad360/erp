# STORY-012: Rebrand Application to Octyvo & Scrub ERP/SaaS Terminology

## Status
- **Status**: ✅ Done
- **Priority**: P1
- **Module**: Foundation / Branding & Marketing
- **Created**: 2026-09-21
- **Completed**: 2026-09-21

---

## 1. User Story
As a workspace member or prospective customer,  
I want the application to be branded consistently as **Octyvo** (workspaces for modern teams) without legacy "ERP" or "SaaS" wording,  
So that the brand identity is modern, unified, clean, and professional across web, mobile, metadata, and PWA.

---

## 2. Acceptance Criteria
- [x] Application metadata and document titles rebrand to `"Octyvo"` / `"Octyvo Workspace"`.
- [x] PWA manifest name and short_name updated to `"Octyvo Workspace"` and `"Octyvo"`.
- [x] Preloaders (`GlobalPreloader`, `TenantPreloader`, route loaders) display Octyvo branding and clean loading messaging (`"Loading Octyvo…"`).
- [x] Sidebar header and marketing hero copy updated to modern team workspace messaging without "ERP" or "SaaS" terms.
- [x] Auth and legal pages (login, signup, forgot password, privacy, terms) updated with Octyvo naming.
- [x] Zero regressions in multi-tenancy, authentication, RLS, or TypeScript build gates.

---

## 3. Implementation Details
- `app/layout.tsx`: Updated title default & template to `"Octyvo"`, description, and appleWebApp title.
- `app/manifest.ts`: Updated name to `"Octyvo Workspace"` and short_name to `"Octyvo"`.
- `components/shared/GlobalPreloader.tsx` & `app/loading.tsx`: Updated platform name to `"Octyvo"` and text to `"Loading Octyvo…"`.
- `components/shared/Sidebar.tsx`: Rebranded subtitle to `"Octyvo Workspace"`.
- `components/shared/CompanyLogo.tsx` & `TenantPreloader.tsx`: Alt text set to `"Octyvo Logo"`.
- `components/pwa/InstallPrompt.tsx`: Updated install prompt banner to `"Install Octyvo App"`.
- `app/(marketing)/page.tsx`: Updated hero headline to `"Workspaces built for modern teams"` and removed ERP/SaaS jargon.
- `app/(marketing)/privacy/page.tsx` & `terms/page.tsx`: Replaced legacy ERP SaaS terms with Octyvo.
- `app/(tenant)/[subdomain]/(auth)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`: Replaced ERP/SaaS descriptions with Octyvo workspace copy.

---

## 4. Verification & Quality Gates
- `npm run typecheck`: Passed (0 errors)
- `npm run lint`: Passed (0 warnings)
- `npm run build`: Passed (clean production build)
