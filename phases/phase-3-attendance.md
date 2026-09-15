# Phase 3 — Attendance

**Goal:** Employees can check in and out from their phone. The system records their GPS location and flags out-of-range check-ins for admins. Admins can see the full attendance log.

**Branch:** `feat/attendance`
**Review level:** Auto-proceed. Flag blockers in PR description.

**Depends on:** Phase 1 (auth, tenant shell), Phase 2 (profiles — attendance references user_id)

---

## What You're Building

By the end of this phase:
- Employees can check in and check out with a single tap
- Geolocation is captured at both events
- The server checks distance from the office and flags out-of-range entries
- Employees can view their own attendance history (daily, monthly)
- Admins and managers can view the full company attendance log
- Admins can export attendance data to CSV

---

## Tasks

### 3.1 — Attendance Schema & Migration

- [ ] Create migration: `supabase/migrations/20260902000000_attendance_logs.sql`
  - `attendance_logs` table (full schema from `backend.md`)
- [ ] Create migration: `supabase/migrations/20260902000001_rls_attendance.sql`
  - Standard tenant isolation policy
  - Plus the role-aware SELECT policy: employees see only their rows, admin/manager sees all
- [ ] Create migration for the haversine function + `record_check_in` RPC (from `backend.md`)
- [ ] Run `supabase db push` and confirm
- [ ] Test: employee A cannot read employee B's attendance rows via direct query

**Deliverable:** Schema deployed, RLS verified.

---

### 3.2 — Check-In / Check-Out API

- [ ] Create `app/api/attendance/checkin/route.ts` (POST):
  - Auth: require valid session (use server Supabase client)
  - Validate: check no open log exists for today (prevent double check-in)
  - Call `record_check_in(user_id, lat, lng)` RPC
  - If lat/lng are null (location denied): insert log with `check_in_lat/lng = null`, `check_in_range = null`
  - Return the new log row

- [ ] Create `app/api/attendance/checkout/route.ts` (POST):
  - Body: `{ logId, lat, lng }` — `lat/lng` can be null
  - Validate: the log belongs to the authenticated user and `check_out_at` is null
  - Compute `check_out_range` server-side using haversine (or set null if no coords)
  - Update the log row with checkout data
  - Return the updated log row

**Deliverable:** Both endpoints work. Double check-in returns 409.

---

### 3.3 — Check-In Page (Employee View)

This is the screen employees use the most. Polish it well.

- [ ] Create `app/(tenant)/[subdomain]/attendance/page.tsx`:
  - Server Component: fetch today's attendance log for the current user (if any)
  - Passes `checkedIn: boolean` and `todayLog` to client component
  - Renders `<AttendanceCheckInPanel>` (client component)

- [ ] Create `components/attendance/AttendanceCheckInPanel.tsx` (Client Component):
  - On mount: call `navigator.geolocation.getCurrentPosition()` to acquire location
    - Success → enable the check-in button
    - Denied → show warning, enable button anyway (location will be stored as null)
    - Timeout (5s) → same as denied
  - `<LocationStatus>` indicator (green / yellow / red dot) shows geolocation state
  - Big check-in button (full-width, `h-16`):
    - If `checkedIn === false`: green, label "Check In", calls `/api/attendance/checkin`
    - If `checkedIn === true`: red, label "Check Out", calls `/api/attendance/checkout`
  - After action: optimistic UI update (swap button color immediately), then re-fetch log
  - Show timestamp of last action below the button: "Checked in at 9:12 AM"
  - If out-of-range: show yellow warning banner — "You appear to be outside the office area. Your check-in has been recorded."

- [ ] Create `components/attendance/LocationStatus.tsx`:
  - Dot indicator: green (acquired), yellow (requesting), red (denied/unavailable)
  - Small label: "Location acquired" / "Requesting location…" / "Location unavailable"

**Deliverable:** Check-in flow works end-to-end on mobile. Out-of-range warning shows correctly.

---

### 3.4 — Employee Monthly View

- [ ] Add tab/toggle to attendance page: "Today" | "This Month"
- [ ] Create `components/attendance/AttendanceMonthCalendar.tsx`:
  - Calendar grid showing the current month
  - Each day colored by attendance status:
    - Green: present
    - Red: absent (i.e., no log + past date)
    - Yellow: out of range
    - Gray: future / weekend
    - Blue: half day (if status = 'half_day')
  - Click a day → small popover showing exact check-in/check-out times
- [ ] Fetch monthly attendance logs for the current user (filter by `user_id`, date range)

**Deliverable:** Employee can review their own monthly attendance at a glance.

---

### 3.5 — Admin Attendance View

- [ ] Create `app/(tenant)/[subdomain]/attendance/admin/page.tsx`:
  - Route guard: only admin/manager role
  - Default view: today's attendance — table of all employees with status
    - Columns: Employee, Department, Status, Check-in Time, Check-out Time, Location
    - Status column: color-coded badge (present/absent/out-of-range/location unavailable)
  - Date picker to view any past date
  - Filter by department
  - "Export CSV" button

- [ ] CSV export:
  - Client-side CSV generation using plain JS (`Blob` + `URL.createObjectURL`)
  - Columns: Date, Employee Name, Employee ID, Department, Check-in, Check-out, Status, In Range
  - Filename: `attendance-{YYYY-MM-DD}.csv`

**Deliverable:** Admin can see full attendance for any day, export to CSV.

---

### 3.6 — Dashboard Integration

- [ ] Update `app/(tenant)/[subdomain]/dashboard/page.tsx`:
  - Replace the hardcoded "Employees checked in today" stat with a real count
  - Query: count distinct `user_id` in `attendance_logs` where `check_in_at::date = today` and `company_id = ...`

**Deliverable:** Dashboard stat card shows live attendance count.

---

### 3.7 — Phase 3 Verification

- [ ] `npm run build` + `npm run lint` + `npm run typecheck` pass
- [ ] Full check-in flow on mobile (375px): tap button → geolocation → check-in → confirmation
- [ ] Check-in with location denied: still works, log shows `null` coords, no crash
- [ ] Out-of-range check-in: warning banner shows, log records `check_in_range = false`
- [ ] Double check-in: second tap shows error, doesn't create duplicate log
- [ ] Admin view: table shows all employees for a given date
- [ ] CSV export: downloads file with correct headers and data
- [ ] RLS: employee cannot read another employee's attendance via browser devtools / direct fetch

---

## Notes

- The geolocation call can be slow on older phones. Don't block the UI — show the location status while acquiring and only enable the button once ready (or after denied/timeout).
- The `record_check_in` RPC runs inside a transaction. Don't replicate its logic in the API route — call the RPC.
- Absent marking is derived, not stored — if there's no log for an employee on a past working day, they're absent. Don't create explicit "absent" rows; calculate on read.
- Weekends are not marked absent. The calendar should skip them. For MVP, assume Mon–Fri; no custom work week config.
