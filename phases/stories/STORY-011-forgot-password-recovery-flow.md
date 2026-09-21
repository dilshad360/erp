# User Story — STORY-011: Forgot Password & Self-Serve Account Recovery

**Story ID:** `STORY-011`  
**Module:** Foundation / Auth & Security  
**Priority:** P1  
**Status:** ✅ Done  
**Assigned Branch:** `feat/auth-story-011`  
**Completed:** 2026-09-21  

---

## 1. Description & Business Value

**As a** registered tenant employee who has forgotten their password,  
**I want** to request a secure password reset link directly from the workspace login screen using my work email,  
**So that** I can recover access to my account quickly without relying on manual database or admin intervention.

---

## 2. Acceptance Criteria

- [x] **AC-1 (Forgot Password Entry Point):** The tenant login screen contains a prominent "Forgot password?" link next to the password input field.
- [x] **AC-2 (Self-Serve Request Screen):** Clicking "Forgot password?" seamlessly switches to a dedicated, company-branded password reset view.
- [x] **AC-3 (Secure Recovery Dispatch):** Submitting a work email invokes `supabase.auth.resetPasswordForEmail` with the proper tenant `redirectTo` URL (`${origin}/set-password`).
- [x] **AC-4 (Success & Resend UX):** Displays a clear confirmation screen indicating the email has been dispatched with instructions, spam folder tips, and a direct "Return to Sign In" action.
- [x] **AC-5 (Set Password Page Polish):** Enhanced `set-password` page with `CompanyLogo`, PKCE/hash token extraction, password visibility toggles, strength validation, and automated dashboard redirection.
- [x] **AC-6 (Quality Gates):** 100% strict TypeScript types, 0 lint errors, and clean build.

---

## 3. Implementation Subtasks

- [x] Subtask 1: Update `LoginClient.tsx` to add `"forgot"` mode, "Forgot password?" trigger, email dispatch handler, and success confirmation view.
- [x] Subtask 2: Create `app/(tenant)/[subdomain]/(auth)/forgot-password/page.tsx` for direct URL access.
- [x] Subtask 3: Upgrade `app/(tenant)/[subdomain]/(auth)/set-password/page.tsx` with `CompanyLogo`, PKCE token support, and show/hide password toggles.
- [x] Subtask 4: Verify with `npm run typecheck`, `npm run lint`, `npm run build`.
