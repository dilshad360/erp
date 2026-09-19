# STORY-006: Entity Deletion Lifecycle, Tenant Task Visibility & Multi-Assignee Collaboration

> **Status:** ⬜ Backlog  
> **Module / Epic:** Clients / Projects / Tasks & Team Collaboration  
> **Target Branch:** `feat/tasks-clients-story-006`  
> **Priority:** P1 - High  
> **Created Date:** 2026-09-19  
> **Updated Date:** 2026-09-19  
> **Agent / Assignee:** Antigravity  

---

## 1. User Story Statement

**As an** organization administrator or project manager,  
**I want to** permanently delete clients, projects, and tasks with clear confirmation dialogs and cascade-safety safeguards,  
**So that** I can maintain a clean, accurate workspace free of obsolete, test, or cancelled records.

**As an** employee in a tenant organization,  
**I want to** create tasks for any project and view all tasks across the company (with flexible filters for "My Tasks" vs "All Tasks"),  
**So that** our team collaborates transparently without siloed visibility barriers.

**As a** project lead or team member,  
**I want to** assign multiple colleagues to a single task,  
**So that** shared deliverables, cross-functional efforts, and pair assignments are accurately reflected and tracked.

---

## 2. Business Value & Context

- **Why are we building this?**: 
  1. **Complete Entity Lifecycle Management**: Users currently have soft-archival capabilities for clients and projects, but lack explicit hard-deletion capabilities in the UI when purging erroneous test data or discarded entities.
  2. **Open Team Collaboration**: Startup teams need open visibility into ongoing work. Gating task views to only direct assignees hinders cross-functional collaboration and awareness.
  3. **Real-World Task Distribution**: Tasks frequently require input from multiple contributors (e.g., designer + developer, or reviewer + author). A 1:1 `assignee_id` model limits productivity.
- **Target Persona**: All Employees, Team Leads, Project Managers, and Company Administrators.
- **Expected Impact**: Unrestricted cross-functional visibility, frictionless task delegation for multi-person deliverables, and full control over database record lifecycle.

---

## 3. Multi-Tenancy & Security Verification

Every feature touching data must adhere to multi-tenant isolation rules:

- [ ] **Data Isolation**: All new junction tables (e.g., `task_assignees`) include `company_id uuid references companies(id) on delete cascade not null`.
- [ ] **Row Level Security (RLS)**: Policies enforce `company_id = (select company_id from profiles where id = auth.uid())` across all SELECT, INSERT, UPDATE, and DELETE operations.
- [ ] **Server-Side Auth Context**: The `company_id` is NEVER accepted from client request bodies or query params. It is strictly derived via Supabase `auth.uid()` from the caller's active profile session.
- [ ] **Role-Based Access Control (RBAC)**:
  - **Deletion Privileges**: Deleting clients and projects is restricted to `admin` and `manager` roles. Deleting tasks is permitted for `admin`, `manager`, and the task creator.
  - **Task Creation & Visibility**: Any active tenant member (`employee`, `manager`, `admin`) can create tasks and view company-wide tasks.
- [ ] **Subdomain Scoping**: Tenant-specific routes reside under `app/(tenant)/[subdomain]/...` and pass through tenant middleware validation.

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **New Tables**:
  - `task_assignees`:
    ```sql
    create table if not exists task_assignees (
      task_id     uuid references tasks(id) on delete cascade not null,
      profile_id  uuid references profiles(id) on delete cascade not null,
      company_id  uuid references companies(id) on delete cascade not null,
      created_at  timestamptz default now(),
      primary key (task_id, profile_id)
    );

    create index idx_task_assignees_company on task_assignees(company_id);
    create index idx_task_assignees_profile on task_assignees(profile_id);
    create index idx_task_assignees_task on task_assignees(task_id);
    ```
- **RLS Policies**:
  ```sql
  alter table task_assignees enable row level security;

  create policy task_assignees_tenant_isolation on task_assignees
    using (company_id = (select company_id from profiles where id = auth.uid()))
    with check (company_id = (select company_id from profiles where id = auth.uid()));
  ```
- **Data Backfill**: Migration will backfill existing `tasks.assignee_id` values into `task_assignees`.
- **Foreign Key Constraints & Cascades**:
  - `projects.client_id`: `references clients(id) on delete cascade` or handled via explicit pre-delete checks.
  - `tasks.project_id`: `references projects(id) on delete cascade`.
  - `tasks.company_id`: `references companies(id) on delete cascade`.

### B. API Route Handlers / Server Actions
1. **Endpoint**: `DELETE /api/clients/[id]`
   - **Method**: `DELETE`
   - **Query / Body**: Optional `?cascade=true` or standard delete.
   - **Authorization**: Admin or Manager only.
   - **Action**: Deletes client and safely cascades or cleans linked projects and tasks.
   - **Response**: `{ data: { id: string }, error: null }`
2. **Endpoint**: `DELETE /api/projects/[id]`
   - **Method**: `DELETE`
   - **Authorization**: Admin or Manager only.
   - **Action**: Deletes project and cascades linked tasks and assignees.
   - **Response**: `{ data: { id: string }, error: null }`
3. **Endpoint**: `DELETE /api/tasks/[id]`
   - **Method**: `DELETE`
   - **Authorization**: Admin, Manager, or task creator (`created_by === user.id`).
   - **Action**: Deletes task and automatically cascades records in `task_assignees`.
   - **Response**: `{ data: { id: string }, error: null }`
4. **Endpoint**: `POST /api/tasks` & `PUT /api/tasks/[id]`
   - **Request Validation**:
     ```ts
     assigneeIds: z.array(z.string().uuid()).optional().default([])
     ```
   - **Action**: Validates assignees belong to caller's `company_id`, inserts/updates task, syncs `task_assignees` rows within the tenant.
   - **Response**: Returns task with nested `assignees: Array<{ id, full_name, avatar_url, employee_id }>` shape.
5. **Endpoint**: `GET /api/tasks`
   - **Query Params**: `?view=my | all`, `?projectId=...`, `?status=...`, `?assigneeId=...`
   - **Action**: Returns tasks with multi-assignee relations. All authenticated company employees can query all tasks.

### C. Frontend / UI Components
1. **Multi-Assignee Selection (`UserMultiSelect.tsx`)**:
   - Reusable combobox supporting selection/removal of multiple company employees.
   - Displays avatar badges with clear buttons.
2. **Avatar Stacks (`AssigneeAvatarGroup.tsx`)**:
   - Compact stacked avatar group on `KanbanCard.tsx`, `TaskListItem.tsx`, and `TaskSheet.tsx` with `+N` overflow indicator.
3. **Task Visibility & Filter Toggle**:
   - On `/tasks` page: Segmented control or tab filter between **"My Tasks"** (where user is one of the assignees) and **"All Tasks"** (all company tasks).
   - Any employee can open `TaskSheet` to create a task across projects.
4. **Deletion Actions & Confirmation Modals**:
   - **Clients**: "Delete Client" action in `ClientDetailClient.tsx` and client list action menu, triggering `ConfirmDialog` with impact warning (e.g. "This will also remove X associated projects and Y tasks.").
   - **Projects**: "Delete Project" action in `ProjectDetailClient.tsx` and project card menu, triggering `ConfirmDialog`.
   - **Tasks**: "Delete Task" button in `TaskSheet.tsx` and dropdown action in `KanbanCard.tsx` / `TaskListItem.tsx`.

### D. Mobile & PWA UX (375px viewport)
- Mobile-first responsive card views with visible delete triggers in swipe actions or action menus.
- Touch targets $\ge$ 44x44px for multi-select assignee pills and delete buttons.
- Bottom sheet drawer for `ConfirmDialog` and `TaskSheet` on mobile devices.

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Multiple Assignees on Task Creation & Editing
- **Given** a logged-in user creating or editing a task in tenant "Acme",
- **When** they select multiple team members (e.g., Alice and Bob) in the Assignees selector and save,
- **Then** the task persists with both assignees in `task_assignees`, and both Alice and Bob see the task in their "My Tasks" view, with stacked avatars displayed on the Kanban card.

### Scenario 2: Tenant-Wide Task Visibility for All Employees
- **Given** an employee (role: `employee`) logged in to tenant "Acme",
- **When** they navigate to `/tasks` or `/projects/[id]/tasks`,
- **Then** they can view all tasks created across the company, toggle between "My Tasks" and "All Tasks", and inspect task details.

### Scenario 3: Task Creation by Any Employee
- **Given** a standard employee in tenant "Acme",
- **When** they click "New Task" on `/tasks` or inside a project, fill in task details, and submit,
- **Then** the task is successfully created with `created_by` set to their profile ID and is immediately visible to the team.

### Scenario 4: Deleting a Client with Confirmation
- **Given** an admin or manager on the Client Detail page (`/clients/[id]`),
- **When** they click "Delete Client", review the confirmation modal warning, and confirm the action,
- **Then** the client record (and associated project dependencies) is permanently deleted, and the user is redirected to `/clients` with a success toast notification.

### Scenario 5: Deleting a Project
- **Given** an admin or manager on the Project Detail page (`/projects/[id]`),
- **When** they click "Delete Project" and confirm via the dialog,
- **Then** the project and its attached tasks are deleted, and the user is redirected to `/projects`.

### Scenario 6: Deleting a Task
- **Given** a task creator, manager, or admin viewing a task,
- **When** they click "Delete Task" in the task drawer or card menu and confirm,
- **Then** the task and its `task_assignees` entries are removed from the Kanban board and list view without page reload.

### Scenario 7: Multi-Tenant Data & Action Isolation
- **Given** two separate tenants "Tenant A" and "Tenant B",
- **When** an admin in Tenant A deletes a task, client, or project, or queries tasks,
- **Then** no records in Tenant B are ever affected or exposed, and API requests attempting cross-tenant IDs return 404/403.

---

## 6. Edge Cases & Boundary Conditions

- [ ] **Deleting Entity with Active References**: Display informative confirmation warnings indicating child count (e.g., number of active tasks inside a project being deleted).
- [ ] **Zero Assignees**: Tasks can exist with 0 assignees (unassigned pool), 1 assignee, or N assignees.
- [ ] **Inactive / Deactivated Employees**: Deactivated employees are filtered out of the multi-assignee picker dropdown.
- [ ] **Creator vs Non-Creator Employee Permissions**: Standard employees can update and delete tasks they created or are assigned to, but cannot delete other employees' tasks unless granted `admin` or `manager` role.
- [ ] **Concurrent Assignee Modifications**: Atomic sync of `task_assignees` prevents orphaned or duplicate junction records.

---

## 7. Implementation Subtasks Breakdown

- [ ] **Task 1**: Write database migration for `task_assignees` junction table, RLS policies, and backfill script (`supabase/migrations/YYYYMMDDHHMMSS_task_assignees_and_deletions.sql`).
- [ ] **Task 2**: Update Zod validation schemas (`lib/validations/task.ts`, `lib/validations/client.ts`, `lib/validations/project.ts`) to support `assigneeIds` and delete options.
- [ ] **Task 3**: Update API route handlers:
  - `app/api/tasks/route.ts` & `app/api/tasks/[id]/route.ts` (multi-assignee CRUD, creator/assignee permissions, delete).
  - `app/api/projects/[id]/route.ts` (hard deletion support & cascade).
  - `app/api/clients/[id]/route.ts` (hard deletion support & cascade).
- [ ] **Task 4**: Create `UserMultiSelect` and `AssigneeAvatarGroup` shared UI components.
- [ ] **Task 5**: Update `TaskForm`, `TaskSheet`, `KanbanCard`, `KanbanBoard`, and `TaskList` to support multiple assignees.
- [ ] **Task 6**: Update `/tasks` and `/projects/[id]/tasks` pages to allow all employees to create and view all company tasks with "My Tasks" / "All Tasks" toggle.
- [ ] **Task 7**: Add Delete actions with `ConfirmDialog` across Client, Project, and Task views.
- [ ] **Task 8**: Mobile viewport testing (375px) & end-to-end multi-tenant verification.

---

## 8. Quality & Verification Gates

Run and verify before completing story:

- [ ] `npm run build` — Passes with zero errors
- [ ] `npm run lint` — Zero ESLint warnings or errors
- [ ] `npm run typecheck` — Strict TypeScript passes (`tsc --noEmit`)
- [ ] Mobile viewport tested at 375px width
- [ ] RLS verified across two different tenant accounts
- [ ] Logged-out access blocked (Auth redirect verified)
- [ ] Updated `TRACKER.md` status to ✅ Done

---

## 9. Tracking & Sign-Off

- **Completed Date**: Pending Implementation
- **Migrations Applied**: `[Pending]`
- **Decisions Logged in TRACKER.md**: Transitioned from 1:1 `assignee_id` to multi-assignee `task_assignees` junction model; added hard deletion workflows with confirmation modals; opened task visibility and creation to all tenant employees.
- **Signed Off By**: Antigravity
