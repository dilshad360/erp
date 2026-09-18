# [BUG-002]: Mobile View Missing Company Logo Top Header and BottomNav "More" Button Non-Functional

> **Status:** ✅ Resolved  
> **Severity:** P2 - Medium (Mobile UX / Navigation Defect: Missing mobile brand header and non-interactive More tab)  
> **Module Affected:** Mobile AppShell / Navigation / Branding  
> **Target Branch:** `fix/mobile-nav-bug-002`  
> **Reported Date:** 2026-09-18  
> **Resolved Date:** 2026-09-18  
> **Assignee / Agent:** Antigravity AI Agent  

---

## 1. Defect Description & Symptoms

- **Summary**: In mobile viewport (375px - 768px), the company logo was completely missing because the sidebar was hidden and no mobile header existed. Furthermore, the 5th tab on `BottomNav` labeled "More" was hardcoded to navigate directly to `/clients` without opening a "More" drawer/sheet to access Employees, Settings, Clients, Theme Switch, and Sign Out.
- **Observed Behavior**:
  1. No company logo was displayed on mobile screens.
  2. Tapping "More" in the bottom navigation bar simply navigated to `/clients` instead of displaying a menu of secondary items (Employees, Clients, Settings, Theme toggle, Sign out).
- **Expected Behavior**:
  1. Mobile screens should feature a sticky **MobileHeader** displaying the tenant's company logo (or brand initial avatar fallback), company name, current user status, and theme toggle.
  2. Tapping the "More" button in `BottomNav` should open a slide-up bottom sheet / drawer presenting navigation items (`/employees`, `/clients`, `/settings`), theme switcher, user profile details, and sign-out button.

---

## 2. Environment & Context

- **Subdomain / Tenant**: Any tenant subdomain (e.g. `[subdomain].yourapp.com`)
- **User Role**: All roles (`admin`, `manager`, `employee`)
- **Device / Viewport**: Mobile devices & viewports (< 768px width)
- **Browser / OS**: Mobile Safari, Chrome Mobile, PWA installed instances

---

## 3. Steps to Reproduce

1. Open the application on a mobile device or toggle browser DevTools to mobile viewport (375px width).
2. Log into a tenant workspace.
3. Observe that the top of the mobile screen had no company logo or workspace branding.
4. Tap the 5th icon labeled "More" in the bottom navigation bar.
5. Notice that it did not open a menu, but unexpectedly navigated to `/clients`, leaving no way to reach `/employees` or `/settings` from the bottom navigation.

---

## 4. Multi-Tenancy & Security Impact Assessment

- [x] **Cross-Tenant Data Leak Risk**: None. Tenant context (`companyName`, `logoUrl`, `brandColor`) is strictly isolated via `useTenant()` / `TenantProvider`.
- [x] **Auth Bypass Risk**: None.
- [x] **Data Corruption Risk**: None.

---

## 5. Root Cause Analysis (RCA)

- **Suspected Subsystem**: `components/shared/AppShell.tsx` & `components/shared/BottomNav.tsx`.
- **Root Cause Explanation**:
  1. `AppShell.tsx` hid the `Sidebar` on mobile (`hidden md:flex`) but did not include a dedicated mobile top bar component (`MobileHeader.tsx`), leaving mobile users with no company logo or tenant identification.
  2. `BottomNav.tsx` defined the 5th tab as `{ href: "/clients", label: "More", icon: MoreHorizontal }` and mapped all tabs directly to Next.js `<Link>` elements, rather than opening an interactive slide-up sheet drawer for the "More" action.
- **Affected Files**:
  - `components/shared/BottomNav.tsx`
  - `components/shared/AppShell.tsx`
  - `components/shared/MobileHeader.tsx` (New)

---

## 6. Fix Implementation Plan

- [x] **Step 1**: Created `components/shared/MobileHeader.tsx`:
  - Renders sticky top bar on mobile (`md:hidden`) with company logo (using `next/image` with fallback to brand initial badge), company name, user avatar, and ThemeToggle.
- [x] **Step 2**: Enhanced `components/shared/BottomNav.tsx`:
  - Separated static navigation tabs (`Dashboard`, `Attendance`, `Tasks`, `Projects`) from the "More" action.
  - Implemented a mobile bottom sheet / drawer overlay with smooth backdrop blur and slide-up animation.
  - In the "More" drawer, provided clear touchable navigation cards for:
    - **Employees** (`/employees`)
    - **Clients** (`/clients`)
    - **Settings** (`/settings`)
    - **Theme Switcher** (Dark / Light Mode)
    - **Sign Out** button (calling Supabase `signOut` and redirecting to `/login`)
- [x] **Step 3**: Integrated `MobileHeader` in `AppShell.tsx`.
- [x] **Step 4**: Verified 375px mobile viewport responsiveness, typecheck, lint, and build.

---

## 7. Verification & Regression Checklist

- [x] Mobile view renders company logo and name in sticky header.
- [x] Tapping "More" in `BottomNav` opens bottom sheet drawer smoothly.
- [x] Navigating to Employees, Clients, and Settings works as expected.
- [x] Theme toggling works from mobile header and more drawer.
- [x] `npm run typecheck` — 0 errors.
- [x] `npm run lint` — 0 warnings/errors.
- [x] `npm run build` — Successful build.
- [x] Updated `TRACKER.md` to ✅ Resolved.
