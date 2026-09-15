# Multi-Tenant ERP SaaS — Development Plan

> Built for AI-agent-assisted development (Antigravity). This doc is meant to be dropped into the project root alongside an `AGENTS.md` so agents have full context before writing code.

## 1. Project Overview

A multi-tenant ERP SaaS targeting small Indian startups/companies, sold as a subscription product — each customer company gets its own subdomain (`company-slug.yourapp.com`). Mobile-first, installable as a PWA, since most end users (employees) will use it on their phones.

**Core modules (MVP):**
- Attendance (geolocation check-in/check-out)
- Client management
- Project management
- Task management (list + Kanban)
- Employee management

**Explicitly out of scope for MVP:** payroll, leave management, invoicing/GST automation (revisit later), client portal/login.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Backend / DB | Supabase (Postgres, shared DB, Row Level Security) |
| Auth | Supabase Auth |
| Styling / UI | Tailwind CSS + shadcn/ui |
| PWA | next-pwa or manual service worker + dynamic manifest |
| Hosting | Vercel (free/Hobby during development — **must move to Pro or another host before onboarding a paying company**, see §8) |
| Drag-and-drop (Kanban) | @dnd-kit |

## 3. Architecture

### 3.1 Multi-tenancy
- **Model:** Shared database, isolated by `company_id`, enforced via Postgres Row Level Security (RLS).
- **URL scheme:** Subdomain per company — `acme.yourapp.com`. Wildcard DNS (`*.yourapp.com`) points at Vercel; Next.js `middleware.ts` reads the `Host` header, resolves `subdomain → company_id`, and rewrites internally to a `/_tenant/[subdomain]/...` route tree.
- **Auth cookies:** Set the Supabase SSR cookie domain to `.yourapp.com` (leading dot) so sessions persist across the marketing domain and tenant subdomains.
- **Custom domains:** Not in MVP, but design the middleware's tenant-lookup to match by slug OR a `custom_domain` column from day one, so it's a config change later, not a rearchitecture.

### 3.2 Route structure (indicative)
```
app/
  (marketing)/            # yourapp.com — landing, pricing, signup
  (tenant)/[subdomain]/
    dashboard/
    attendance/
    clients/
    projects/[projectId]/
    tasks/
    employees/
    settings/
  api/
    onboarding/route.ts
  manifest.ts             # dynamic PWA manifest per tenant
middleware.ts
```

## 4. Database Schema (core tables)

```sql
-- Companies (tenants)
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  gst_number text,
  office_lat double precision,
  office_lng double precision,
  geofence_radius_m int default 200,
  created_at timestamptz default now()
);

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  company_id uuid references companies(id) not null,
  full_name text,
  role text not null default 'employee',
  phone text,
  employee_id text,
  department text,
  designation text,
  date_of_joining date,
  reporting_manager_id uuid references profiles(id),
  avatar_url text
);

-- Roles / permissions (fine-grained, per company)
create table roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  role_name text not null,
  permissions jsonb not null default '{}'::jsonb
);

-- Attendance
create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  user_id uuid references profiles(id) not null,
  check_in_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_at timestamptz,
  check_out_lat double precision,
  check_out_lng double precision,
  status text default 'present'
);

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  gst_number text,
  notes text,
  status text default 'active'
);

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  client_id uuid references clients(id) not null,
  name text not null,
  description text,
  status text default 'active',
  start_date date,
  end_date date,
  budget numeric
);

-- Task statuses (customizable per company, for Kanban columns)
create table task_statuses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  name text not null,
  sort_order int not null
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  project_id uuid references projects(id) not null,
  title text not null,
  description text,
  status_id uuid references task_statuses(id),
  priority text default 'medium',
  assignee_id uuid references profiles(id),
  due_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

**RLS pattern (apply to every tenant table):**
```sql
alter table <table> enable row level security;

create policy tenant_isolation on <table>
  using (company_id = (select company_id from profiles where id = auth.uid()));
```

## 5. Module Breakdown

### 5.1 Attendance
- Check-in/check-out button, captures geolocation (`navigator.geolocation`) at both events.
- Server computes distance from `companies.office_lat/lng` (haversine function) and flags out-of-range check-ins for admin visibility — does not block the check-in.
- Admin view: daily/monthly attendance table per employee, exportable.
- Handle geolocation permission denial gracefully (fallback: allow check-in, mark "location unavailable").

### 5.2 Client Management
- CRUD for clients. Simple list + detail view.
- No client login/portal in MVP.

### 5.3 Project Management
- Projects always belong to a client (`client_id` required, strict hierarchy).
- Project detail page shows linked tasks, timeline, budget.

### 5.4 Task Management
- Tasks always belong to a project.
- Two views: **list** (table, filterable by status/assignee/priority) and **Kanban board** (drag-and-drop via @dnd-kit).
- `task_statuses` are per-company configurable columns (not a hardcoded enum), so each company can define their own pipeline.

### 5.5 Employee Management
- Extends `profiles`: department, designation, date of joining, reporting manager.
- Role assignment tied to the `roles`/`permissions` table for fine-grained access control (beyond simple admin/manager/employee).

## 6. Build Phases

1. **Foundation** — Supabase project, `companies`/`profiles` schema, RLS policies, subdomain middleware, company onboarding flow (signup → slug check → auth user → company/profile rows → redirect to subdomain).
2. **Employee management** — needed before attendance/tasks since they reference `profiles`.
3. **Attendance** — check-in/out with geolocation; get this working early, it's used daily.
4. **Client management** — simplest CRUD, establishes shadcn table/form patterns to reuse elsewhere.
5. **Project management** — depends on clients.
6. **Task management** — depends on projects; build list view first, then Kanban.
7. **Polish** — PWA manifest per tenant, push notifications, mobile-first pass across all modules.

## 7. Agent Workflow Setup (Antigravity)

Create these alongside this plan, in the project root:

- **`AGENTS.md`** — standing rules every agent reads before starting work. Should define:
  - Coding conventions (TypeScript strict mode, file/folder naming, component patterns)
  - Which files/directories are off-limits or need human review (RLS policies, auth flows, payment/billing code when added)
  - Test command(s) to run before considering a task done
  - Multi-tenancy rule: **every new table must have `company_id` + an RLS policy**, no exceptions — this is worth stating explicitly since it's the single easiest thing for an agent to forget
- **Domain isolation for parallel agents** — if running multiple agents concurrently, assign one module each (e.g. one on attendance, one on client management) rather than letting them touch overlapping files, to avoid merge conflicts.
- **Review policy** — start with "Request Review" (pause at each step) for early foundation work (schema, RLS, auth), since mistakes there are expensive. Looser autonomy is fine for later, well-isolated CRUD modules.
- **Verification loop** — set up a test suite (even minimal) before delegating feature work, so agents can self-verify instead of you manually checking every change.

## 8. Before Going Live (do not skip)

- [ ] Move off Vercel Hobby (ToS prohibits commercial use) — upgrade to Pro or move hosting.
- [ ] Confirm wildcard SSL is issued correctly for the production domain.
- [ ] Load-test RLS policies with multiple tenants to confirm isolation (no cross-tenant data leaks).
- [ ] Decide on backup/retention policy for Supabase.
