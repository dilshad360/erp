# Phase 6 — Task Management

**Goal:** Employees can create and manage tasks within projects. Tasks have a list view and a Kanban board view. Kanban columns are company-configurable. Drag-and-drop moves tasks between columns.

**Branch:** `feat/tasks`
**Review level:** Auto-proceed.

**Depends on:** Phase 1 (auth), Phase 2 (profiles), Phase 5 (projects — tasks reference project_id)

---

## What You're Building

By the end of this phase:
- Tasks can be created within a project
- List view: filterable, sortable table of tasks
- Kanban view: drag-and-drop board with company-defined columns
- "My Tasks" page: cross-project view of tasks assigned to the current user
- Task detail: assignee, due date, priority, description, status

---

## Tasks

### 6.1 — Task Schema & Migration

- [ ] Create migration: `supabase/migrations/20260904000000_tasks_statuses.sql`
  - `task_statuses` table (from `backend.md`)
  - `tasks` table (from `backend.md`)
  - The `updated_at` trigger on `tasks`
- [ ] Create migration: `supabase/migrations/20260904000001_rls_tasks.sql`
  - `task_statuses`: all employees can SELECT; admin/manager can INSERT/UPDATE/DELETE
  - `tasks`: all employees can SELECT and INSERT; employees can UPDATE tasks assigned to them; admin/manager can do all
- [ ] Run `supabase db push`, verify
- [ ] Seed default task statuses for existing test companies: To Do, In Progress, In Review, Done

**Deliverable:** Schema live, RLS verified.

---

### 6.2 — Task API Routes

- [ ] Create `app/api/tasks/route.ts`:
  - GET: list tasks. Filters: `?project_id=`, `?assignee_id=`, `?status_id=`, `?priority=`, `?search=`
  - POST: create task. Validate: title required, project_id required, project must belong to company.

- [ ] Create `app/api/tasks/[id]/route.ts`:
  - GET: task detail with joins (project name, assignee name, created_by name, status name)
  - PUT: update task (including `status_id` for Kanban drag)
  - DELETE: hard delete (tasks don't have "archived" status — if deleted it's gone)

- [ ] Create `app/api/task-statuses/route.ts`:
  - GET: list statuses for company, ordered by `sort_order`
  - POST: create new status (admin only)

- [ ] Create `app/api/task-statuses/[id]/route.ts`:
  - PUT: update name, color, sort_order
  - DELETE: block if tasks exist with this status (return 409 with count); else delete

**Deliverable:** All task and task-status endpoints work.

---

### 6.3 — Task List View

This lives at `/projects/:id/tasks?view=list`.

- [ ] Create `app/(tenant)/[subdomain]/projects/[projectId]/tasks/page.tsx`:
  - Server Component: fetch project + task statuses + tasks for this project
  - View toggle: "List" | "Kanban" (stored in URL param `?view=list` or `?view=kanban`)
  - Default view: list

- [ ] List view (`<TaskListView>` client component):
  - `<DataTable>` with columns: Title, Status (badge), Priority (badge), Assignee (avatar + name), Due Date, Created
  - Priority badge colors: urgent=danger, high=warning, medium=info, low=muted
  - Filters above table: Status, Priority, Assignee (dropdowns)
  - "New Task" button → opens a slide-over `<Sheet>` with the task creation form (not a separate page)
  - Click row → opens task detail in a `<Sheet>` (not a separate page)
  - Empty state: "No tasks yet. Add the first task to get this project moving."

**Deliverable:** List view renders, filters work, new task sheet opens.

---

### 6.4 — Task Creation & Edit Form

This form is used in both list view (sheet) and potentially inline in Kanban.

- [ ] Create `components/tasks/TaskForm.tsx` (Client Component):
  - Fields:
    - Title* (text input)
    - Description (textarea)
    - Status* (select from company task_statuses)
    - Priority (select: low / medium / high / urgent, default: medium)
    - Assignee (`<UserSelect>` — filtered to company employees)
    - Due Date (`<DatePicker>`)
  - Mode: "create" or "edit" (same component, different submit target)
  - On save → invalidate task list (via `router.refresh()` or React Query invalidation)

- [ ] Create `components/shared/UserSelect.tsx`:
  - Fetches `profiles` where `company_id` matches and `is_active = true`
  - Searchable combobox (name or employee ID)
  - Shows avatar + name in options

**Deliverable:** Task creation and editing work from the sheet.

---

### 6.5 — Kanban Board

- [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable`:
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  ```

- [ ] Create `components/tasks/KanbanBoard.tsx` (Client Component):
  - Receives `statuses` (columns) and initial `tasks` as props from the Server Component
  - Wraps everything in `<DndContext onDragEnd={handleDragEnd}>`
  - `handleDragEnd`: when a card is dropped on a new column, call `PUT /api/tasks/:id` with new `status_id`. Update local state optimistically — don't wait for the server response to update the UI.
  - Horizontal scroll on mobile (overflow-x: auto)

- [ ] Create `components/tasks/KanbanColumn.tsx`:
  - `useDroppable` from @dnd-kit
  - Shows column name, task count badge
  - Renders `<KanbanCard>` for each task in the column
  - "Add task" button at bottom → opens the `<TaskForm>` sheet with `status_id` pre-filled

- [ ] Create `components/tasks/KanbanCard.tsx`:
  - `useDraggable` from @dnd-kit
  - Shows: task title, priority badge, assignee avatar, due date (red if overdue)
  - Click (non-drag) → opens task detail sheet

- [ ] Create `components/tasks/KanbanDragOverlay.tsx`:
  - Renders a clone of `<KanbanCard>` with elevated shadow and slight scale (1.03) while dragging

**Deliverable:** Kanban board renders all columns and cards. Drag-and-drop moves cards and persists to DB.

---

### 6.6 — My Tasks Page

- [ ] Create `app/(tenant)/[subdomain]/tasks/page.tsx`:
  - Server Component: fetch tasks where `assignee_id = auth.uid()`
  - Group by project (accordion or section headers)
  - Filter: All / Due Today / Overdue / No Due Date
  - Each task row: title, project name (linked), status badge, priority, due date
  - Click → task detail sheet

**Deliverable:** "My Tasks" shows the current user's tasks across all projects.

---

### 6.7 — Kanban Column Management (Settings)

- [ ] Add "Manage Columns" section to `app/(tenant)/[subdomain]/settings/page.tsx` (or its own tab):
  - List of task statuses with drag-to-reorder (simple vertical list sortable with @dnd-kit/sortable)
  - Edit name inline (click to edit)
  - Color picker per column (shows in Kanban column header)
  - Add new column button
  - Delete column (blocked if tasks exist — show count in error message)

**Deliverable:** Admins can customize Kanban columns. New columns appear in the board.

---

### 6.8 — Dashboard Integration

- [ ] Update dashboard:
  - "Open Tasks" stat: count tasks where `assignee_id = auth.uid()` and status is not the last status (done)
  - Add "My Tasks" quick list: 5 most urgent/overdue tasks for current user

**Deliverable:** Dashboard shows personalized task data.

---

### 6.9 — Phase 6 Verification

- [ ] `npm run build` + `npm run lint` + `npm run typecheck` pass
- [ ] Create task in list view → appears in Kanban column matching the selected status
- [ ] Drag Kanban card to another column → `status_id` updated in DB
- [ ] Drag card and release → optimistic update shows immediately, then confirmed
- [ ] Kanban horizontal scroll works on mobile (375px)
- [ ] Filter by assignee in list view → only shows that person's tasks
- [ ] Overdue task (past due_date) shows in red in Kanban card
- [ ] Delete a task status that has tasks → 409 error with count shown
- [ ] My Tasks page shows only current user's tasks
- [ ] Employee cannot delete another employee's task (403 check)

---

## Notes

- Optimistic updates on Kanban drag are important for UX. Don't make users wait for the API round-trip to see the card move. Revert optimistically if the API call fails.
- The `task_statuses.sort_order` approach means you need to update multiple rows when reordering columns. Use a simple approach: when a drag ends, send the full new order as an array of IDs to a batch endpoint — `PUT /api/task-statuses/reorder`.
- `@dnd-kit` requires the parent to have a defined height on mobile for touch events to work correctly. Test on an actual device or mobile emulation, not just desktop.
- Don't implement task comments, attachments, or activity logs in this phase. These are post-MVP.
