# Frontend — Architecture, Pages & Components

This document covers everything on the browser/client side. Read `design.md` for visual specs and `AGENTS.md` for coding rules before writing any component.

---

## Stack

| Tool | Version | Role |
|---|---|---|
| Next.js | 14 (App Router) | Framework, routing, SSR/SSG |
| React | 18 | UI |
| TypeScript | 5.x strict | Language |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | Component primitives |
| React Hook Form | 7.x | Forms |
| Zod | 3.x | Schema validation (forms + API) |
| @dnd-kit | 6.x | Kanban drag-and-drop |
| next-pwa / service worker | — | PWA manifest, offline caching |
| lucide-react | latest | Icons |
| date-fns | 3.x | Date formatting |

---

## Route Structure

```
app/
├── (marketing)/                    # Public: yourapp.com
│   ├── page.tsx                    # Landing page
│   ├── pricing/page.tsx
│   └── signup/page.tsx             # Company signup / onboarding start
│
├── (tenant)/[subdomain]/           # Private: acme.yourapp.com
│   ├── layout.tsx                  # Tenant shell (nav, auth guard, tenant context)
│   ├── dashboard/page.tsx
│   ├── attendance/
│   │   ├── page.tsx                # Check-in/out + today's log (employee view)
│   │   └── admin/page.tsx          # Admin attendance table
│   ├── employees/
│   │   ├── page.tsx                # Employee list
│   │   ├── [employeeId]/page.tsx   # Employee profile
│   │   └── new/page.tsx            # Add employee form
│   ├── clients/
│   │   ├── page.tsx                # Client list
│   │   ├── [clientId]/page.tsx     # Client detail
│   │   └── new/page.tsx
│   ├── projects/
│   │   ├── page.tsx                # Project list
│   │   ├── [projectId]/
│   │   │   ├── page.tsx            # Project overview
│   │   │   ├── tasks/page.tsx      # Tasks within this project (list + Kanban toggle)
│   │   │   └── settings/page.tsx
│   │   └── new/page.tsx
│   ├── tasks/
│   │   └── page.tsx                # Cross-project task view (my tasks)
│   └── settings/
│       ├── page.tsx                # Company settings
│       ├── roles/page.tsx          # Role & permissions management
│       └── appearance/page.tsx     # Logo, brand color
│
├── api/
│   ├── onboarding/route.ts         # POST: create company + first admin profile
│   ├── attendance/
│   │   ├── checkin/route.ts
│   │   └── checkout/route.ts
│   ├── employees/route.ts
│   ├── clients/route.ts
│   ├── projects/route.ts
│   └── tasks/route.ts
│
├── manifest.ts                     # Dynamic PWA manifest per tenant
└── middleware.ts                   # Subdomain → tenant resolution
```

---

## Middleware (Critical Path)

`middleware.ts` runs on every request. Its job:

1. Read `Host` header → extract subdomain (e.g., `acme` from `acme.yourapp.com`)
2. If subdomain matches a known tenant slug in the database → rewrite to `/(tenant)/[subdomain]/...`
3. If no subdomain (bare domain) → serve `(marketing)` routes
4. If the resolved page is under `(tenant)` and there's no valid Supabase session → redirect to `/(tenant)/[subdomain]/login`

Never expose a tenant's data if the subdomain doesn't match the authenticated user's `company_id`.

---

## Tenant Context

The tenant shell (`(tenant)/[subdomain]/layout.tsx`) establishes a React context with:

```ts
type TenantContext = {
  companyId: string;
  companySlug: string;
  companyName: string;
  brandColor: string;      // hex, for CSS var override
  logoUrl: string | null;
  userRole: string;
  userId: string;
  userName: string;
}
```

This is fetched once server-side in the layout and passed to a Client Component context provider. Components read from this context — they don't re-fetch company info themselves.

---

## Page Inventory

### Marketing Pages

| Page | Path | Notes |
|---|---|---|
| Landing | `/` | Hero, feature list, pricing preview, CTA |
| Pricing | `/pricing` | Simple 3-tier: Starter, Growth, Enterprise |
| Signup | `/signup` | Multi-step: company info → admin account → done → redirect to subdomain |

### Dashboard

| Page | Path | Notes |
|---|---|---|
| Dashboard | `/:subdomain/dashboard` | Stats cards + recent activity feed |

Dashboard cards for MVP:
- Today's attendance (% of employees checked in)
- Open tasks count (across all projects)
- Active projects
- Recent client activity

### Attendance

| Page | Path | Who sees it |
|---|---|---|
| Check-in/out | `/:subdomain/attendance` | All employees |
| Monthly view (self) | `/:subdomain/attendance?view=month` | All employees |
| Admin log | `/:subdomain/attendance/admin` | Admin, Manager |

### Employees

| Page | Path | Notes |
|---|---|---|
| List | `/:subdomain/employees` | Table with search + filter by department |
| Profile | `/:subdomain/employees/:id` | Full profile, attendance history, assigned tasks |
| New employee | `/:subdomain/employees/new` | Form → creates Supabase auth invite + profile |

### Clients

| Page | Path | Notes |
|---|---|---|
| List | `/:subdomain/clients` | Table with search, status filter |
| Detail | `/:subdomain/clients/:id` | Client info + linked projects list |
| New | `/:subdomain/clients/new` | Form |

### Projects

| Page | Path | Notes |
|---|---|---|
| List | `/:subdomain/projects` | Cards or table; grouped by client |
| Detail | `/:subdomain/projects/:id` | Overview: description, dates, budget, team, linked tasks |
| Tasks | `/:subdomain/projects/:id/tasks` | Toggle between list and Kanban views |
| New | `/:subdomain/projects/new` | Form (client selector required) |

### Tasks

| Page | Path | Notes |
|---|---|---|
| My Tasks | `/:subdomain/tasks` | Tasks assigned to current user, cross-project |

### Settings

| Page | Path | Notes |
|---|---|---|
| General | `/:subdomain/settings` | Company name, GST, geofence config |
| Roles | `/:subdomain/settings/roles` | Create/edit roles + permission toggles |
| Appearance | `/:subdomain/settings/appearance` | Logo upload, brand color |

---

## Shared Component Inventory

These live in `/components/shared/` and are available across all pages.

### Layout Components

| Component | File | Purpose |
|---|---|---|
| `AppShell` | `AppShell.tsx` | Wraps all tenant pages — nav + content area |
| `BottomNav` | `BottomNav.tsx` | Mobile bottom tab bar |
| `Sidebar` | `Sidebar.tsx` | Desktop left sidebar |
| `PageHeader` | `PageHeader.tsx` | Title + breadcrumb + action buttons |
| `TenantProvider` | `TenantProvider.tsx` | React context for tenant data |

### Data Display

| Component | File | Purpose |
|---|---|---|
| `DataTable` | `DataTable.tsx` | Reusable sortable/filterable table (wraps TanStack Table) |
| `StatusBadge` | `StatusBadge.tsx` | Colored pill for statuses |
| `Avatar` | `Avatar.tsx` | User avatar with initials fallback |
| `EmptyState` | `EmptyState.tsx` | Icon + message + CTA for empty lists |
| `SkeletonCard` | `SkeletonCard.tsx` | Generic skeleton loader |
| `SkeletonTable` | `SkeletonTable.tsx` | Table skeleton |
| `StatCard` | `StatCard.tsx` | Dashboard metric card |

### Forms & Inputs

| Component | File | Purpose |
|---|---|---|
| `FormField` | `FormField.tsx` | Label + input + error wrapper |
| `UserSelect` | `UserSelect.tsx` | Searchable dropdown of company employees |
| `ClientSelect` | `ClientSelect.tsx` | Searchable client picker |
| `DatePicker` | `DatePicker.tsx` | Wraps shadcn Calendar |
| `ColorPicker` | `ColorPicker.tsx` | Hex input + preset swatches for brand color |

### Feedback

| Component | File | Purpose |
|---|---|---|
| `Toast` | via shadcn | Success / error notifications |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Reusable "are you sure?" dialog for destructive actions |
| `LoadingButton` | `LoadingButton.tsx` | Button with built-in loading spinner state |

---

## Module-Specific Components

### Attendance

| Component | Purpose |
|---|---|
| `CheckInButton` | The big check-in/check-out button with geolocation logic |
| `LocationStatus` | Shows geolocation permission state (dot indicator) |
| `AttendanceTable` | Admin table of attendance logs |
| `AttendanceMonthCalendar` | Employee's personal monthly attendance view |

### Kanban

| Component | Purpose |
|---|---|
| `KanbanBoard` | Root board with @dnd-kit `DndContext` |
| `KanbanColumn` | Single column — accepts `useDroppable` |
| `KanbanCard` | Draggable task card — uses `useDraggable` |
| `KanbanAddCard` | Inline "add task" form at column bottom |
| `KanbanDragOverlay` | The card clone shown while dragging |

Drag state lives in the `KanbanBoard` component — no global store needed. Optimistic updates on drop.

---

## State Management

No global state library (no Redux, no Zustand). Reason: the app is mostly server-rendered data + form mutations. Local state is managed with:

- `useState` / `useReducer` for UI-only state (modals open, active tab)
- React context for tenant data (read-only, set once at layout level)
- Server Components + `revalidatePath` / `revalidateTag` for data refreshing after mutations
- React Query **only if** a feature genuinely needs client-side polling (e.g., live attendance updates on admin view)

---

## PWA Setup

- `manifest.ts` is a dynamic route that reads the tenant's slug, name, brand color, and logo from the DB and returns a valid Web App Manifest JSON.
- Service worker via `next-pwa` (or manual `service-worker.ts`) caches:
  - App shell (layout, nav, core CSS/JS)
  - Attendance page (offline check-in queue)
- Offline check-in: store check-in locally (IndexedDB), sync when back online.
- Meta tags in `(tenant)/[subdomain]/layout.tsx`:
  ```html
  <meta name="theme-color" content="{brandColor}" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="manifest" href="/manifest.json" />
  ```

---

## Performance Notes

- Images: use `next/image`. All tenant logos go through it.
- Fonts: preload Inter via `next/font/google`. No Flash of Unstyled Text.
- Don't block render on non-critical data. Use `Suspense` boundaries with skeleton fallbacks.
- The attendance check-in page should load and be interactive within 2 seconds on a mid-range Android on 4G. Profile if it doesn't.
- Avoid `export const dynamic = 'force-dynamic'` on every page — only use it where data truly changes per-request.

---

## Auth Flow (Frontend Side)

1. Unauthenticated → middleware redirects to `/:subdomain/login`
2. Login page: Supabase Auth UI (email + password). No OAuth for MVP.
3. On success: Supabase sets session cookie (domain: `.yourapp.com`) → middleware revalidates → redirect to `/:subdomain/dashboard`
4. Token refresh: handled by `@supabase/ssr` middleware helper automatically.
5. Logout: call `supabase.auth.signOut()` → clear cookie → redirect to login.

---

## Environment Variables (Frontend-visible)

Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_DOMAIN=yourapp.com
```

Do not put service role keys or secrets in `NEXT_PUBLIC_` variables. Ever.
