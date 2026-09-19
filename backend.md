# Backend — Database, API & Supabase Configuration

Everything server-side: schema, RLS, API routes, auth config, and infrastructure decisions.

---

## Stack

| Tool | Role |
|---|---|
| Supabase | Postgres DB, Auth, Storage, Realtime |
| Next.js Route Handlers | Custom API endpoints (`app/api/...`) |
| Zod | Request body validation |
| `@supabase/ssr` | Server-side auth helpers for Next.js |

---

## Supabase Project Setup

### Clients to Use

| Context | Client |
|---|---|
| Server Components / Route Handlers | `createServerClient` from `@supabase/ssr` — uses cookies |
| Client Components | `createBrowserClient` from `@supabase/ssr` |
| Service-level operations (migration scripts, admin tasks) | `createClient` with `service_role` key — **server only, never in browser** |

### Cookie Configuration

The Supabase SSR cookie must be scoped to the root domain so sessions work across all tenant subdomains:

```ts
// In middleware.ts and server utilities
cookieOptions: {
  domain: `.${process.env.NEXT_PUBLIC_APP_DOMAIN}`, // .yourapp.com
  path: '/',
  sameSite: 'lax',
  secure: true,
}
```

---

## Database Schema

### `companies` (tenants)

```sql
create table companies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text unique not null,           -- subdomain
  gst_number         text,
  office_lat         double precision,
  office_lng         double precision,
  geofence_radius_m  int default 200,
  brand_color        text default '#6366f1',
  logo_url           text,
  custom_domain      text unique,                    -- for future custom domain support
  created_at         timestamptz default now()
);
```

### `profiles` (extends auth.users)

```sql
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  company_id            uuid references companies(id) not null,
  full_name             text,
  role                  text not null default 'employee',  -- 'admin' | 'manager' | 'employee'
  phone                 text,
  employee_id           text,
  department            text,
  designation           text,
  date_of_joining       date,
  reporting_manager_id  uuid references profiles(id),
  avatar_url            text,
  is_active             boolean default true,
  created_at            timestamptz default now()
);
```

### `roles` (fine-grained, per company)

```sql
create table roles (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) not null,
  role_name    text not null,
  permissions  jsonb not null default '{}'::jsonb,
  created_at   timestamptz default now(),
  unique (company_id, role_name)
);
```

Permissions JSONB shape:
```json
{
  "attendance": { "view_all": true, "export": false },
  "employees":  { "create": true, "edit": true, "delete": false },
  "clients":    { "create": true, "edit": true, "delete": false },
  "projects":   { "create": true, "edit": true, "delete": false },
  "tasks":      { "create": true, "edit": true, "delete": true },
  "settings":   { "view": false, "edit": false }
}
```

### `attendance_logs`

```sql
create table attendance_logs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid references companies(id) not null,
  user_id         uuid references profiles(id) not null,
  check_in_at     timestamptz,
  check_in_lat    double precision,
  check_in_lng    double precision,
  check_in_range  boolean,                           -- true if within geofence
  check_out_at    timestamptz,
  check_out_lat   double precision,
  check_out_lng   double precision,
  check_out_range boolean,
  status          text default 'present',            -- 'present' | 'absent' | 'half_day'
  notes           text,
  created_at      timestamptz default now()
);
```

### `clients`

```sql
create table clients (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid references companies(id) not null,
  name            text not null,
  contact_person  text,
  email           text,
  phone           text,
  address         text,
  gst_number      text,
  notes           text,
  status          text default 'active',             -- 'active' | 'inactive'
  created_at      timestamptz default now()
);
```

### `projects`

```sql
create table projects (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) not null,
  client_id    uuid references clients(id) not null,
  name         text not null,
  description  text,
  status       text default 'active',               -- 'active' | 'on_hold' | 'completed' | 'cancelled'
  start_date   date,
  end_date     date,
  budget       numeric,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now()
);
```

### `task_statuses` (Kanban columns, per company)

```sql
create table task_statuses (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) not null,
  name         text not null,
  color        text,                                -- optional column color for Kanban
  sort_order   int not null,
  created_at   timestamptz default now()
);

-- Default statuses seeded on company creation:
-- To Do (sort_order: 1), In Progress (sort_order: 2), In Review (sort_order: 3), Done (sort_order: 4)
```

### `tasks`

```sql
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) not null,
  project_id   uuid references projects(id) not null,
  title        text not null,
  description  text,
  status_id    uuid references task_statuses(id),
  priority     text default 'medium',               -- 'low' | 'medium' | 'high' | 'urgent'
  assignee_id  uuid references profiles(id),
  due_date     date,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Keep updated_at current:
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();
```

---

## Row Level Security Policies

Apply to **every** tenant table. Non-negotiable.

### Standard tenant isolation policy

```sql
-- Template — replace <table> with actual table name
alter table <table> enable row level security;

create policy tenant_isolation on <table>
  for all
  using (
    company_id = (
      select company_id from profiles where id = auth.uid()
    )
  );
```

### Attendance — employee can only see their own rows (non-admin)

```sql
create policy attendance_self on attendance_logs
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.company_id = attendance_logs.company_id
        and p.role in ('admin', 'manager')
    )
  );
```

### Profiles — employees can read all profiles in their company (for selects), but only edit their own

```sql
create policy profiles_read on profiles
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy profiles_update_self on profiles
  for update
  using (id = auth.uid());

create policy profiles_admin_all on profiles
  for all
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
```

---

## Database Functions

### Haversine distance (for geofence check)

```sql
create or replace function haversine_distance(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision as $$
declare
  r double precision := 6371000; -- Earth radius in meters
  phi1 double precision := radians(lat1);
  phi2 double precision := radians(lat2);
  dphi double precision := radians(lat2 - lat1);
  dlam double precision := radians(lng2 - lng1);
  a double precision;
begin
  a := sin(dphi/2)^2 + cos(phi1) * cos(phi2) * sin(dlam/2)^2;
  return r * 2 * atan2(sqrt(a), sqrt(1-a));
end;
$$ language plpgsql immutable;
```

### Check-in RPC (handles geofence check atomically)

```sql
create or replace function record_check_in(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision
) returns uuid as $$
declare
  v_company record;
  v_distance double precision;
  v_in_range boolean;
  v_log_id uuid;
begin
  select * into v_company from companies
  where id = (select company_id from profiles where id = p_user_id);

  if v_company.office_lat is not null then
    v_distance := haversine_distance(
      p_lat, p_lng,
      v_company.office_lat, v_company.office_lng
    );
    v_in_range := v_distance <= v_company.geofence_radius_m;
  else
    v_in_range := true; -- no geofence configured
  end if;

  insert into attendance_logs (company_id, user_id, check_in_at, check_in_lat, check_in_lng, check_in_range)
  values (v_company.id, p_user_id, now(), p_lat, p_lng, v_in_range)
  returning id into v_log_id;

  return v_log_id;
end;
$$ language plpgsql security definer;
```

---

## API Routes

All route handlers live in `app/api/`. They use the server Supabase client (cookies), validate with Zod, and return `{ data, error }`.

### Onboarding

```
POST /api/onboarding
Body: { companyName, slug, adminEmail, adminPassword, adminName }
1. Check slug uniqueness
2. Create Supabase auth user
3. Insert companies row
4. Insert profiles row (role: 'admin')
5. Seed default task_statuses for the company
6. Return { companySlug }
```

### Attendance

```
POST /api/attendance/checkin
Body: { lat, lng }    (lat/lng can be null if location denied)
→ Calls record_check_in() RPC or inserts with check_in_range: null

POST /api/attendance/checkout
Body: { logId, lat, lng }
→ Updates existing attendance_logs row with checkout data
```

### Employees

```
GET    /api/employees               → list employees for current company (?active=true supported)
GET    /api/employees/:id           → employee detail
PUT    /api/employees/:id           → update profile
DELETE /api/employees/:id           → deactivate (action=deactivate) or delete permanently
PATCH  /api/employees/:id/activate  → approve & activate self-registered employee
DELETE /api/employees/:id/reject    → reject & delete self-registered applicant
POST   /api/employees/upload-avatar → upload profile avatar to storage
```

### Clients

```
GET    /api/clients               → list
POST   /api/clients               → create
GET    /api/clients/:id           → detail
PUT    /api/clients/:id           → update
DELETE /api/clients/:id           → soft delete (status = 'inactive')
```

### Projects

```
GET    /api/projects              → list (optionally filtered by client_id)
POST   /api/projects              → create
GET    /api/projects/:id          → detail with linked client
PUT    /api/projects/:id          → update
DELETE /api/projects/:id          → soft delete
```

### Tasks

```
GET    /api/tasks                 → list (filters: project_id, assignee_id, status_id, priority)
POST   /api/tasks                 → create
GET    /api/tasks/:id             → detail
PUT    /api/tasks/:id             → update (including status change for Kanban drag)
DELETE /api/tasks/:id             → delete
```

### Task Statuses (Kanban columns)

```
GET    /api/task-statuses         → list for company (ordered by sort_order)
POST   /api/task-statuses         → create new status/column
PUT    /api/task-statuses/:id     → rename or reorder
DELETE /api/task-statuses/:id     → delete (block if tasks exist in this status)
```

---

## Storage (Supabase Storage)

### Buckets

| Bucket | Public? | Usage |
|---|---|---|
| `avatars` | Yes | Employee profile photos |
| `logos` | Yes | Company logos |

### File naming convention

```
avatars/{company_id}/{user_id}.{ext}
logos/{company_id}/logo.{ext}
```

Storage RLS: users can only upload to paths prefixed with their own `company_id`.

---

## Environment Variables (Server-side)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server only — never expose to client

# App
NEXT_PUBLIC_APP_DOMAIN=yourapp.com
```

---

## Migration File Structure

```
supabase/
├── migrations/
│   ├── 20260901000000_init_companies_profiles.sql
│   ├── 20260901000001_rls_companies_profiles.sql
│   ├── 20260902000000_attendance_logs.sql
│   ├── 20260902000001_rls_attendance.sql
│   ├── 20260903000000_clients_projects.sql
│   ├── 20260903000001_rls_clients_projects.sql
│   ├── 20260904000000_tasks_statuses.sql
│   ├── 20260904000001_rls_tasks.sql
│   └── 20260904000002_functions_haversine_checkin.sql
└── seed.sql                     # Optional: seed test data for local dev
```

Run migrations: `supabase db push` (remote) or `supabase db reset` (local reset + apply all).

---

## Infrastructure Checklist (Pre-Launch)

- [ ] Move off Vercel Hobby — upgrade to Pro or switch hosting (Hobby ToS prohibits commercial use)
- [ ] Wildcard DNS `*.yourapp.com` → Vercel/host IP
- [ ] Wildcard SSL cert issued and verified
- [ ] Supabase project on a paid plan with PITR (Point-in-Time Recovery) enabled
- [ ] DB backups: confirm Supabase daily backup schedule
- [ ] Load test RLS with 3+ separate tenant sessions — verify zero cross-tenant data leakage
- [ ] Set up Supabase alerts for DB size and connection count
- [ ] Enable Supabase audit logs for auth events
