# [BUG-XXX]: [Short Descriptive Summary of the Defect]

> **Status:** 🔴 New / 🔄 In Triage / 🛠️ In Fix / 🧪 In Testing / ✅ Resolved / 🚫 Cannot Reproduce  
> **Severity:** [P0 - Blocker (Outage/Data Leak) / P1 - High (Core Broken) / P2 - Medium (Feature Impaired) / P3 - Low (UI Glitch)]  
> **Module Affected:** [Foundation / Employees / Attendance / Clients / Projects / Tasks / PWA / Middleware]  
> **Target Branch:** `fix/[module]-[bug-id]` (e.g., `fix/attendance-bug-003`)  
> **Reported Date:** YYYY-MM-DD  
> **Resolved Date:** YYYY-MM-DD  
> **Assignee / Agent:** [Agent Name or Developer]  

---

## 1. Defect Description & Symptoms

- **Summary**: [Concise 1-2 sentence description of the observed defect]
- **Observed Behavior**: [What actually happened, including error messages, status codes, or visual glitches]
- **Expected Behavior**: [What should have happened according to business rules and specs]

---

## 2. Environment & Context

- **Subdomain / Tenant**: `[subdomain].yourapp.com` (e.g. `acme.localhost:3000`)
- **User Role**: `[admin | manager | employee | unauthenticated]`
- **Device / Viewport**: `[Mobile (375px) | Tablet | Desktop (1440px)]`
- **Browser / OS**: `[Chrome / Safari / Firefox / iOS / Android / Windows]`
- **Relevant URL**: `http://[subdomain].localhost:3000/[path]`

---

## 3. Steps to Reproduce

1. Log in as a user with role `[role]` under tenant `[tenant_name]`.
2. Navigate to `[URL or page]`.
3. Perform the following action: `[Click button X / Fill input Y / Submit form Z]`.
4. Observe the defect: `[Error toast / 500 status / Blank screen / Broken layout]`.

---

## 4. Multi-Tenancy & Security Impact Assessment

- [ ] **Cross-Tenant Data Leak Risk**: Did this bug expose one company's data to another?
  - *If YES, treat immediately as P0 Blocker, pause all work, and patch RLS.*
- [ ] **Auth Bypass Risk**: Did this bug allow unauthenticated or unauthorized role access?
- [ ] **Data Corruption Risk**: Did this bug write invalid, missing, or corrupted records?

---

## 5. Root Cause Analysis (RCA)

- **Suspected Subsystem**: `[Database / RLS Policy / API Handler / Next.js Middleware / Client State / Styling]`
- **Root Cause Explanation**:
  > [Explain why the bug occurred at a technical level. For example: "The RLS policy on attendance_logs referenced company_id directly without joining profiles, causing a recursive query timeout when fetching logs."]
- **Affected Files**:
  - `[path/to/file1.ts]`
  - `[path/to/file2.tsx]`

---

## 6. Fix Implementation Plan

- [ ] **Step 1**: Write regression reproduction test case or verify exact failure state.
- [ ] **Step 2**: Implement code patch in `[affected file(s)]`.
- [ ] **Step 3**: If database policy or schema was flawed, create migration `supabase/migrations/YYYYMMDDHHMMSS_fix_[bug_id].sql`.
- [ ] **Step 4**: Verify fix locally and ensure no side-effects on neighboring modules.

---

## 7. Verification & Regression Checklist

Run before marking bug resolved:

- [ ] Repro steps followed again: Defect NO LONGER occurs.
- [ ] `npm run build` — Passes with zero errors.
- [ ] `npm run lint` — Passes with zero warnings/errors.
- [ ] `npm run typecheck` — Passes with zero type errors.
- [ ] Multi-tenant check: Verified tenant isolation remains 100% intact.
- [ ] Mobile check (375px): Verified no layout breakage on mobile.
- [ ] Update status in `TRACKER.md` to ✅ Resolved.

---

## 8. Post-Mortem & Preventative Action

- **Lessons Learned**: [What design assumption or check was missed?]
- **Preventative Measure**: [What rule, test, or lint rule was added to ensure this never happens again?]
- **Logged in TRACKER.md Decisions Log**: [Yes / No]
