# Phase 4 — Client Management

**Goal:** Admins and managers can manage the company's client list. This is the simplest CRUD module, and it sets the pattern for forms and detail pages that projects and tasks will reuse.

**Branch:** `feat/clients`
**Review level:** Auto-proceed.

**Depends on:** Phase 1 (auth, tenant shell), Phase 2 (DataTable component)

---

## What You're Building

By the end of this phase:
- Any employee can view the client list and client details
- Admins and managers can add, edit, and deactivate clients
- The `<FormField>`, `<ConfirmDialog>`, and `<EmptyState>` shared components are built and ready to reuse

---

## Tasks

### 4.1 — Clients Schema & Migration

- [x] Create migration: `supabase/migrations/20260903000000_clients.sql`
  - `clients` table (full schema from `backend.md`)
- [x] Create migration: `supabase/migrations/20260903000001_rls_clients.sql`
  - Standard tenant isolation policy (all roles can SELECT; only admin/manager can INSERT/UPDATE)
- [x] Run `supabase db push`, verify in dashboard

**Deliverable:** `clients` table live with RLS.

---

### 4.2 — Shared Components: Forms & Dialogs

Build these now; they'll be used in every module from here on.

- [x] Create `components/shared/FormField.tsx`:
  - Wraps: label (with optional asterisk for required), input slot (accepts any shadcn input), error message
  - Used with React Hook Form's `Controller` or `register`

- [x] Create `components/shared/ConfirmDialog.tsx`:
  - shadcn `AlertDialog` wrapped with a standard layout
  - Props: `title`, `description`, `confirmLabel`, `onConfirm`, `variant` ('default' | 'destructive')
  - Used for all delete/deactivate actions — never inline a one-off confirmation

- [x] Create `components/shared/EmptyState.tsx`:
  - Props: `icon` (lucide icon), `heading`, `description`, `action` (optional ReactNode)
  - Centered layout, icon at 64px, muted colors

- [x] Create `components/shared/LoadingButton.tsx`:
  - Loading spinner indicator & disabled state during mutation submission

**Deliverable:** All shared components render correctly in isolation.

---

### 4.3 — Client API Routes

- [x] Create `app/api/clients/route.ts`:
  - GET: list all clients for `company_id`, ordered by name. Support `?status=active` filter.
  - POST: create client — validate with Zod (name required, email format if provided)

- [x] Create `app/api/clients/[id]/route.ts`:
  - GET: fetch single client + count of linked projects
  - PUT: update client fields — validate with Zod
  - DELETE: soft delete — set `status = 'inactive'`

**Deliverable:** All CRUD endpoints respond correctly. Unauthorized access returns 403.

---

### 4.4 — Client List Page

- [x] Create `app/(tenant)/[subdomain]/(app)/clients/page.tsx`:
  - Server Component: fetch active clients
  - `<DataTable>` with columns: Name, Contact Person, Phone, Email, Status, Project Count, Actions
  - "Add Client" button in page header (admin/manager only — conditionally render based on role from tenant context)
  - Filter toggle: "Active" | "All" (shows inactive clients too, grayed out)
  - Empty state: "No clients yet. Add your first client to start tracking projects."

**Deliverable:** Client list renders with real data.

---

### 4.5 — Add / Edit Client Form

- [x] Create `app/(tenant)/[subdomain]/(app)/clients/new/page.tsx`:
  - Form: Name*, Contact Person, Email, Phone, Address, GST Number, Notes
  - Validation: Name required, email format, GST format (optional)
  - On submit → `POST /api/clients` → redirect to client detail page

- [x] Client detail page (`/clients/[id]`) should also have an edit mode:
  - "Edit" button → switches to inline edit form (same fields, pre-filled)
  - On save → `PUT /api/clients/:id`
  - On cancel → revert to view mode

**Deliverable:** Add and edit flows work. Form validation errors display correctly.

---

### 4.6 — Client Detail Page

- [x] Create `app/(tenant)/[subdomain]/(app)/clients/[id]/page.tsx`:
  - Section 1: Client header — name, status badge, action buttons (Edit, Deactivate)
  - Section 2: Contact info — contact person, email, phone, address, GST number
  - Section 3: Notes — free text display
  - Section 4: Linked Projects — list of projects belonging to this client (name, status, dates)
    - Each project links to `/projects/:id`
    - Empty state: "No projects yet for this client."
  - Deactivate button → `<ConfirmDialog>` → `DELETE /api/clients/:id`

**Deliverable:** Client detail shows all info and linked projects.

---

### 4.7 — Phase 4 Verification

- [x] `npm run build` + `npm run lint` + `npm run typecheck` pass
- [x] Add client → appears in list
- [x] Edit client → changes reflected immediately
- [x] Deactivate client → removed from default "Active" list, visible in "All" view
- [x] Regular employee can view list and detail, but "Add Client" button is hidden
- [x] Regular employee cannot POST to `/api/clients` (403 check)
- [x] Empty state shows when no clients exist
- [x] Client detail shows correct linked project count


---

## Notes

- GST number format for Indian companies: 2-digit state code + 10-char PAN + 1 entity number + 1 check digit + 1 last digit = 15 characters total. Validate with regex: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- No client portal or client login in MVP.
- The "linked projects" list on the client detail page can be a simple Supabase query — no need for a separate API route, just fetch in the Server Component.
