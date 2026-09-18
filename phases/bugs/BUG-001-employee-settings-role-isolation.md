# [BUG-001]: Employee Users Exposed to Company-Level Workspace Settings and Missing Role-Specific Settings

> **Status:** ✅ Resolved  
> **Severity:** P2 - Medium (Role/UX Isolation Defect: non-admin users shown forbidden workspace admin controls & danger zone instead of personal account/preference settings)  
> **Module Affected:** Settings / Employee UX / Role Access  
> **Target Branch:** `fix/settings-bug-001`  
> **Reported Date:** 2026-09-18  
> **Resolved Date:** 2026-09-18  
> **Assignee / Agent:** Antigravity AI Agent  

---

## 1. Defect Description & Symptoms

- **Summary**: When an employee (non-admin) navigated to `/settings`, they were shown the full administrative workspace controls (Company Name, GST, Office Location Coordinates, Geofence Radius, Brand Color, Logo Upload, Kanban Column Manager, and Danger Zone) which they were unauthorized to modify and which returned 403 Forbidden upon submission. They lacked dedicated personal employee settings (Profile details, Avatar upload, Password/Security, Display/Preferences, and read-only Workplace Info).
- **Observed Behavior**: The `/settings` page rendered `CompanySettingsClient` unconditionally without filtering or adapting UI for non-admin roles, exposing all company settings and danger zone to employees.
- **Expected Behavior**: 
  - **Employees (`role !== 'admin'`)**: Should see **Employee Settings** (Personal Profile & Avatar, Phone, Read-only work details, Password & Security, Personal Display/Theme preferences, and read-only Workplace Location/Geofence reference).
  - **Admins (`role === 'admin'`)**: Should see full **Company / Workspace Settings** (Company details, Geofence GPS, Appearance, Kanban Columns, Danger Zone) along with access to personal profile settings.

---

## 2. Environment & Context

- **Subdomain / Tenant**: Any tenant subdomain (e.g. `acme.localhost:3000/settings`)
- **User Role**: `employee` / `manager`
- **Device / Viewport**: Mobile (375px) & Desktop (1440px)
- **Browser / OS**: All supported browsers
- **Relevant URL**: `http://[subdomain].localhost:3000/settings`

---

## 3. Steps to Reproduce

1. Log in as an employee user (e.g., `role = 'employee'`).
2. Click on "Settings" in the sidebar or bottom navigation (`/[subdomain]/settings`).
3. Notice that the page displays tabs for:
   - General (Edit Company Name, GST, GPS Lat/Lng, Geofence Radius)
   - Appearance (Upload Company Logo, Change Company Brand Color)
   - Kanban Columns (Add/Delete/Reorder Company Task Statuses)
   - Danger Zone (Delete/Reset Workspace data)
4. If the employee attempts to save changes on company details, the server returns `403 Forbidden: Only company admins can change workspace settings`.

---

## 4. Multi-Tenancy & Security Impact Assessment

- [x] **Cross-Tenant Data Leak Risk**: No data leaked across different companies. Data fetched was correctly isolated to the user's `company_id`.
- [x] **Auth Bypass Risk**: Backend APIs (`PATCH /api/company`, `POST /api/task-statuses`) already rejected unauthorized employee mutations with `403 Forbidden`. The defect was in the frontend UI presentation layer exposing administrative and destructive controls to employee users.
- [x] **Data Corruption Risk**: None, because backend role gating successfully blocked mutations.

---

## 5. Root Cause Analysis (RCA)

- **Suspected Subsystem**: Frontend Settings Page (`app/(tenant)/[subdomain]/(app)/settings/page.tsx`) & Client Component (`components/settings/CompanySettingsClient.tsx`).
- **Root Cause Explanation**:
  `app/(tenant)/[subdomain]/(app)/settings/page.tsx` computed `const isAdmin = profile.role === "admin"` and passed it as a prop to `<CompanySettingsClient company={company} statuses={statuses} isAdmin={isAdmin} />`. However, `CompanySettingsClient` did not utilize the `isAdmin` prop to branch UI logic, unconditionally rendering all company-level administrative tabs and danger zone controls. Furthermore, there was no dedicated `EmployeeSettingsClient` component for employee-level personal profile, password security, display preferences, and read-only attendance boundaries.
- **Affected Files**:
  - `app/(tenant)/[subdomain]/(app)/settings/page.tsx`
  - `components/settings/CompanySettingsClient.tsx`
  - `components/settings/EmployeeSettingsClient.tsx` (New)

---

## 6. Fix Implementation Plan

- [x] **Step 1**: Created `components/settings/EmployeeSettingsClient.tsx` specifically designed for employee users:
  - **My Profile Tab**: Avatar upload & preview, Full Name, Phone (editable), Email (read-only), Employee ID, Department, Designation, Date of Joining, Role badge.
  - **Security Tab**: Password change with validation and Supabase auth update.
  - **Preferences Tab**: Theme display, motion preferences, compact density toggles.
  - **Workplace Info Tab**: Company name, Office location status, Geofence radius info (read-only reference so employees understand where punches are valid).
- [x] **Step 2**: Enhanced `components/settings/CompanySettingsClient.tsx` for admin users:
  - Enforce `isAdmin` guard and isolate destructive/workspace forms.
- [x] **Step 3**: Updated `app/(tenant)/[subdomain]/(app)/settings/page.tsx` to pass full employee profile and user email, conditionally rendering `CompanySettingsClient` (for admins) or `EmployeeSettingsClient` (for employees/managers).
- [x] **Step 4**: Verified password update / profile update endpoints work seamlessly.
- [x] **Step 5**: Tested on mobile (375px) and desktop viewports, ensuring zero TypeScript or ESLint errors.

---

## 7. Verification & Regression Checklist

Run and verified:

- [x] Repro steps followed: Employee user on `/settings` sees tailored Employee Settings, with zero company details / danger zone / kanban columns exposed.
- [x] Admin user on `/settings` continues to have full workspace management capabilities.
- [x] `npm run typecheck` — Passed with zero type errors.
- [x] `npm run lint` — Zero ESLint warnings or errors.
- [x] `npm run build` — Next.js build passed cleanly.
- [x] Mobile check (375px): Verified clean responsiveness for both Admin and Employee settings.
- [x] Updated status in `TRACKER.md` to ✅ Resolved.

---

## 8. Post-Mortem & Preventative Action

- **Lessons Learned**: UI components must always reflect the principle of least privilege in addition to backend API gating. Passing an authorization prop like `isAdmin` is not enough; views must be explicitly bifurcated or scoped according to user roles.
- **Preventative Measure**: Added role-based UI gating standards to `AGENTS.md` and `AI_WORKFLOW.md`. Logged in `TRACKER.md`.
