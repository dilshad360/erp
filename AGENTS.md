# AGENTS.md — ERP SaaS Agent Rules

This file is mandatory reading before touching any part of the codebase. Every agent, every session.

---

## Who You Are Working With

This is a **multi-tenant ERP SaaS** for small Indian startups. It runs on Next.js 14 (App Router) + Supabase. Each customer company gets a subdomain like `acme.yourapp.com`. All tenant data lives in a shared Postgres database isolated by Row Level Security.

The app is mobile-first and ships as a PWA. Most end users are employees checking in from their phones.

---

## Non-Negotiables

These are the rules that cannot be bent regardless of the task.

### Multi-tenancy is sacred
- **Every table you create or modify that holds business data must have a `company_id uuid` column.**
- **Every such table must have an RLS policy that filters by `company_id`.**
- Do not leave a table without RLS. Do not create a SELECT query that doesn't implicitly benefit from RLS. This is the #1 thing that can go wrong and it's a data-leak issue.
- RLS pattern (copy this exactly):
  ```sql
  alter table <table> enable row level security;

  create policy tenant_isolation on <table>
    using (company_id = (select company_id from profiles where id = auth.uid()));
  ```
- If you add a new table and skip this, your PR will be rejected.

### Auth context is always from Supabase
- Never trust a `company_id` coming from the client request body or query params. Always derive it server-side from `auth.uid()` via the profiles table.
- Never bypass Supabase Auth for any protected route.

### Schema changes go through migrations
- All database changes go in `supabase/migrations/`. Never modify the schema through the Supabase dashboard directly during development.
- Name migration files: `YYYYMMDDHHMMSS_short_description.sql`

---

## Coding Conventions

### TypeScript
- `strict: true` is mandatory. No `any`. No `ts-ignore` without a comment explaining why.
- Prefer explicit return types on all exported functions and components.
- Use `type` over `interface` for plain data shapes. Use `interface` when extending is expected.

### File & Folder Naming
- Components: `PascalCase.tsx` (e.g. `AttendanceCard.tsx`)
- Pages/routes: `kebab-case` folders as Next.js App Router convention
- Utilities: `camelCase.ts`
- Keep components colocated with the page they belong to unless reused in 3+ places — then move to `/components/shared/`

### Component Patterns
- Server Components by default. Add `'use client'` only when you actually need browser APIs or React state.
- Data fetching happens in Server Components or Route Handlers, not in client components via `useEffect`.
- Use shadcn/ui primitives as the base. Don't roll custom UI for things shadcn already covers.
- Form handling: React Hook Form + Zod for all forms. Never raw `useState` for form fields.

### Styling
- Tailwind only. No inline `style={}` unless dealing with dynamic values that Tailwind can't handle (e.g., a pixel value computed at runtime).
- Stick to the design tokens defined in `design.md`. Don't invent new colors or spacing values.

### API / Route Handlers
- All mutations go through `app/api/` route handlers or Supabase client calls with RLS doing the heavy lifting.
- Return consistent JSON: `{ data, error }` shape.
- Always validate request bodies with Zod before touching the database.

---

## Files & Directories That Need Human Review

Don't modify these without flagging it for review first:

| Path | Reason |
|---|---|
| `middleware.ts` | Tenant routing logic — a bug here breaks every tenant |
| `supabase/migrations/` | Schema changes are permanent and affect all tenants |
| Any file touching `auth.` Supabase namespace | Auth bugs = security issue |
| `app/(marketing)/` | Public-facing, SEO-sensitive |
| Billing/payment code (when added later) | Money |

---

## Before You Call a Task Done

Run these checks before marking anything complete:

1. `npm run build` — must pass with zero errors
2. `npm run lint` — zero warnings on new code you wrote
3. `npm run typecheck` — zero type errors
4. Manual test on mobile viewport (375px width) — the app is mobile-first
5. If you touched the DB: confirm RLS is in place and tested with two different tenant sessions
6. If you added a new page: confirm it's inaccessible without auth (try loading it logged out)

---

## Parallel Agent Rules

If multiple agents are running at the same time, they must each own a separate module. Ownership:

| Module | Assigned Branch |
|---|---|
| Foundation / middleware / auth | `feat/foundation` |
| Employee management | `feat/employees` |
| Attendance | `feat/attendance` |
| Client management | `feat/clients` |
| Project management | `feat/projects` |
| Task management | `feat/tasks` |
| PWA / polish | `feat/pwa` |

Do not touch files that belong to another agent's module. If you need something from another module (e.g., a shared component), ask or create a stub and leave a `// TODO:` comment.

---

## Review Policy by Phase

| Phase | Autonomy Level |
|---|---|
| Phase 1 (Foundation, schema, auth) | **Pause at each step** — get human sign-off before proceeding |
| Phase 2 (Employee management) | Pause before merging schema changes; auto-proceed on UI |
| Phases 3–6 (Feature modules) | Auto-proceed; flag blockers in PR description |
| Phase 7 (Polish, PWA) | Full autonomy |

---

## Project Reference Files

| File | Purpose |
|---|---|
| `erp-saas-development-plan.md` | Full project spec and architecture overview |
| `design.md` | Design system, color tokens, component patterns |
| `frontend.md` | Frontend architecture, page map, component inventory |
| `backend.md` | Database schema, RLS policies, API routes, Supabase config |
| `TRACKER.md` | Master task tracker — update this as tasks complete |
| `phases/phase-*.md` | Per-phase detailed task breakdowns |
