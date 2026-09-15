# Phase 2 — Employee Management

**Goal:** Admins can invite employees, manage their profiles, and assign roles. This phase is a prerequisite for attendance and tasks, which both reference `profiles`.

**Branch:** `feat/employees`
**Review level:** Pause before merging schema changes. Auto-proceed on UI work.

**Depends on:** Phase 1 complete (companies, profiles, auth, tenant shell)

---

## What You're Building

By the end of this phase:
- Admins can view a list of all employees in their company
- Admins can invite a new employee (creates a Supabase auth invite + profile row)
- Admins can edit employee details (department, designation, reporting manager, etc.)
- Admins can deactivate an employee (soft delete — sets `is_active = false`)
- Employees can view and edit their own profile
- Role assignment works (admin can set role to admin / manager / employee)
- Employee list page is the reference implementation for the `<DataTable>` component — build it right, it'll be reused

---

## Tasks

### 2.1 — DataTable Shared Component

Build this first. Clients, projects, and tasks will all use it.

- [ ] Install TanStack Table: `npm install @tanstack/react-table`
- [ ] Create `components/shared/DataTable.tsx`:
  - Generic `DataTable<T>` component accepting `columns` and `data` props
  - Column sorting (click header to sort asc/desc)
  - Global search filter (text input that filters across all columns)
  - Pagination (10/25/50 rows per page, previous/next buttons)
  - Empty state slot (`emptyState` prop — accepts a ReactNode)
  - Loading state: replace rows with `<SkeletonTable>` when `isLoading` is true
  - Mobile: collapses to card-per-row layout below `md` breakpoint using a separate render path
- [ ] Create `components/shared/SkeletonTable.tsx` — animated skeleton rows

**Deliverable:** `<DataTable>` renders correctly with mock data. Mobile card view works.

---

### 2.2 — Employee List Page

- [ ] Create `app/(tenant)/[subdomain]/employees/page.tsx`:
  - Server Component — fetch employees for `company_id` from `profiles` where `is_active = true`
  - Pass to `<DataTable>` with columns: Avatar, Name, Employee ID, Department, Designation, Role, Join Date, Actions
  - "Add Employee" button in page header → links to `/employees/new`
  - Filter by department (dropdown above table)
  - Search by name or employee ID

**Deliverable:** Employee list renders with real data from Supabase.

---

### 2.3 — Invite Employee Flow

Employees don't self-register — they're invited by an admin.

- [ ] Create `app/(tenant)/[subdomain]/employees/new/page.tsx`:
  - Form fields: Full Name, Email, Employee ID, Department, Designation, Date of Joining, Reporting Manager (select from existing employees), Role (admin/manager/employee)
  - Validation: all with Zod
  - On submit → `POST /api/employees`

- [ ] Create `app/api/employees/route.ts` (POST handler):
  - Validate body with Zod
  - Use service role client to call `supabase.auth.admin.inviteUserByEmail(email)`
  - This sends an invite email and creates an auth user
  - Insert `profiles` row with the returned user ID + all form data
  - Return the new employee object

- [ ] Invitation email: Supabase sends the default invite email. User clicks link → sets password → logged in.
  - The invite link must redirect to `/:subdomain/set-password` (custom redirect URL in the Supabase invite call)
  - Create `app/(tenant)/[subdomain]/set-password/page.tsx` — simple password set form using Supabase `updateUser`

**Deliverable:** Admin fills form → invite email sent → employee sets password → can log in.

---

### 2.4 — Employee Profile Page

- [ ] Create `app/(tenant)/[subdomain]/employees/[employeeId]/page.tsx`:
  - Section 1: Profile header — avatar, name, designation, department, role badge
  - Section 2: Contact info — phone, email (read-only, comes from auth.users)
  - Section 3: Employment details — employee ID, join date, reporting manager
  - Section 4 (admin-only): Danger zone — Deactivate Employee button
  - Edit button → opens inline edit mode (not a separate page) for admins

- [ ] Create `app/api/employees/[id]/route.ts` (GET, PUT, DELETE):
  - GET: fetch profile + join with `companies` for reporting manager name
  - PUT: validate + update `profiles` row (admin can update all fields; employee can update limited fields: phone, avatar)
  - DELETE (deactivate): set `is_active = false`, don't delete auth user or profile row

**Deliverable:** Employee profile page shows all data, editable by admin.

---

### 2.5 — Avatar Upload

- [ ] Add avatar upload to profile edit:
  - File input (accept: image/jpeg, image/png, image/webp, max 2MB)
  - Upload to Supabase Storage: `avatars/{company_id}/{user_id}.{ext}`
  - Update `profiles.avatar_url` with the public URL
  - Show crop/preview before upload (optional for MVP — acceptable to skip)
- [ ] Update `<Avatar>` component to show uploaded image or initials fallback

**Deliverable:** Employees can upload a profile photo.

---

### 2.6 — Role Management (Basic)

This is a simplified version — full RBAC is a post-MVP concern. For now:

- [ ] Role is a simple string on `profiles`: `'admin'` | `'manager'` | `'employee'`
- [ ] Admin can change any employee's role from the profile page
- [ ] Use a `Select` dropdown — changing role updates `profiles.role`
- [ ] Gate admin-only pages server-side: check `profiles.role` in Server Component; render 403 page if unauthorized

The `roles` table (fine-grained permissions) is created in the schema but only actively used in Phase 7 polish. For now, role-based gating uses the simple string.

**Deliverable:** Role changes work. Admin-only pages are protected.

---

### 2.7 — Phase 2 Verification

- [ ] `npm run build` + `npm run lint` + `npm run typecheck` pass
- [ ] Full invite flow: admin invites employee → email arrives → employee sets password → logs in → profile visible
- [ ] Admin can edit all employee fields; employee can only edit their own limited fields (test both)
- [ ] Deactivated employee cannot log in (Supabase handles this — confirm `is_active` check is in place)
- [ ] Employee list loads correctly with 20+ mock employees (performance check)
- [ ] DataTable mobile card view tested at 375px
- [ ] Avatar upload: file too large shows error, valid image shows preview + saves

---

## Notes

- The invite email uses Supabase's built-in email template for now. Customize it later when there's a custom email domain.
- `reporting_manager_id` creates a self-referential FK — make sure the `<UserSelect>` component excludes the current employee from the options (can't report to yourself).
- Don't build the fine-grained permissions UI yet — that's a post-MVP task. Just create the `roles` table rows with defaults.
