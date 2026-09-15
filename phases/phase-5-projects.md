# Phase 5 — Project Management

**Goal:** Admins and managers can create and manage projects. Every project belongs to a client. Project detail pages show linked tasks, team members, timeline, and budget.

**Branch:** `feat/projects`
**Review level:** Auto-proceed.

**Depends on:** Phase 1 (auth), Phase 2 (DataTable, profiles), Phase 4 (clients table exists — projects reference client_id)

---

## What You're Building

By the end of this phase:
- Admins and managers can create, view, edit, and archive projects
- Each project is linked to a client (required)
- Project detail page shows description, timeline, budget, team, and a placeholder for tasks (wired up in Phase 6)
- Project list can be filtered by client, status, and date range

---

## Tasks

### 5.1 — Projects Schema & Migration

- [ ] Create migration: `supabase/migrations/20260903000002_projects.sql`
  - `projects` table (full schema from `backend.md`)
- [ ] Create migration: `supabase/migrations/20260903000003_rls_projects.sql`
  - All employees can SELECT (they need to see projects to assign tasks)
  - Only admin/manager can INSERT, UPDATE, DELETE
- [ ] Run `supabase db push`, verify in dashboard
- [ ] Test RLS: employee cannot insert a project

**Deliverable:** `projects` table live with RLS.

---

### 5.2 — Project API Routes

- [ ] Create `app/api/projects/route.ts`:
  - GET: list projects for `company_id`. Support filters: `?client_id=`, `?status=`, `?search=`
  - POST: create project — validate with Zod (name, client_id required; client must belong to same company)

- [ ] Create `app/api/projects/[id]/route.ts`:
  - GET: project detail — join with `clients` (client name), join with `profiles` (created_by name)
  - PUT: update project
  - DELETE: soft delete — set `status = 'cancelled'` (don't hard delete, tasks reference this)

**Deliverable:** CRUD endpoints work. Foreign key validation (client belongs to company) enforced server-side.

---

### 5.3 — Project List Page

- [ ] Create `app/(tenant)/[subdomain]/projects/page.tsx`:
  - Server Component: fetch projects
  - Toggle between card view and table view (user preference stored in `localStorage`)
  - **Card view**: project name, client name, status badge, start/end date, task count
  - **Table view**: `<DataTable>` with same data in columns
  - Filters: Status (active / on_hold / completed / cancelled), Client (dropdown)
  - "New Project" button (admin/manager only)
  - Empty state: "No projects yet. Create your first project."

**Deliverable:** Project list renders, both views work.

---

### 5.4 — New Project Form

- [ ] Create `app/(tenant)/[subdomain]/projects/new/page.tsx`:
  - Form fields:
    - Client* (required) — `<ClientSelect>` component (searchable dropdown from `/api/clients`)
    - Project Name*
    - Description (textarea)
    - Status (default: active)
    - Start Date / End Date (`<DatePicker>`)
    - Budget (numeric, optional — labeled "Estimated Budget (₹)")
  - Validation: name required, client required, end_date must be after start_date if both provided
  - On submit → `POST /api/projects` → redirect to project detail

**Deliverable:** Project creation works, validation shows correct errors.

---

### 5.5 — Project Detail Page

- [ ] Create `app/(tenant)/[subdomain]/projects/[projectId]/page.tsx`:
  - **Header**: Project name, status badge, client link, action buttons (Edit, Archive)
  - **Overview section**:
    - Description
    - Timeline: start date → end date (with visual bar showing progress vs. total duration)
    - Budget: "₹X,XX,XXX" (format as Indian number system — lakhs and crores)
  - **Tasks summary**: tab/section showing task count by status. "Open Tasks: 4, In Progress: 2, Done: 8". Link to `/projects/:id/tasks`.
  - **Team**: list of distinct assignees from tasks (derived — no explicit team member table in MVP)
  - Edit button → inline edit mode (same as client detail)
  - Archive → `<ConfirmDialog>` → sets `status = 'cancelled'`

- [ ] Indian number formatting utility (`lib/format.ts`):
  ```ts
  // 1500000 → "₹15,00,000"
  export function formatINR(amount: number): string
  ```

**Deliverable:** Project detail page shows all data, edit works, archive works.

---

### 5.6 — ClientSelect Shared Component

- [ ] Create `components/shared/ClientSelect.tsx`:
  - Fetches clients from `/api/clients?status=active` on mount (client component)
  - Searchable combobox using shadcn `Combobox`
  - Shows client name in option + "Add new client" link at bottom
  - Used in: Project form, any other form that needs a client picker

**Deliverable:** `<ClientSelect>` works in the project form.

---

### 5.7 — Dashboard Integration

- [ ] Update `app/(tenant)/[subdomain]/dashboard/page.tsx`:
  - Replace hardcoded "Active Projects" stat with real count from `projects` table where `status = 'active'`
  - Add "Recent Projects" section: last 3 modified projects as cards

**Deliverable:** Dashboard shows live project stats.

---

### 5.8 — Phase 5 Verification

- [ ] `npm run build` + `npm run lint` + `npm run typecheck` pass
- [ ] Create project with valid client → appears in list
- [ ] Try to create project without client → validation error
- [ ] Try to set end_date before start_date → validation error
- [ ] Edit project → changes persist
- [ ] Archive project → status changes, project disappears from "active" filter
- [ ] Employee (non-admin) can view project list and detail but cannot create/edit (button hidden, API returns 403)
- [ ] Budget formatted correctly in Indian number system (test: 1500000 → "₹15,00,000")
- [ ] Timeline bar renders at correct percentage based on today's date

---

## Notes

- The project team members section is derived from task assignees — don't create a `project_members` join table in MVP. It adds complexity and the use case is already covered by the tasks module. Revisit if customers request it.
- Budget is stored as `numeric` (no currency column). For MVP, it's always INR. Currency support can come later.
- The `status = 'cancelled'` soft delete is deliberate — "cancelled" is a real project state, not just a deletion marker. If you need "archived" later, add an `is_archived` boolean instead.
