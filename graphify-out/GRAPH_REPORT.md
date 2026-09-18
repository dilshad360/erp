# Graph Report - C:\Users\dilsh\OneDrive\Desktop\ERP  (2026-09-18)

## Corpus Check
- 152 files · ~78,035 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 489 nodes · 766 edges · 48 communities (31 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_ProjectDetailClient.tsx|ProjectDetailClient.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_TaskForm.tsx|TaskForm.tsx]]
- [[_COMMUNITY_EmployeeListClient.tsx|EmployeeListClient.tsx]]
- [[_COMMUNITY_AttendanceCheckInPanel.tsx|AttendanceCheckInPanel.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_ProjectListClient.tsx|ProjectListClient.tsx]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_createClient|createClient]]
- [[_COMMUNITY_AdminAttendanceTable.tsx|AdminAttendanceTable.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_server.ts|server.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_InviteFormClient.tsx|InviteFormClient.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_middleware.ts|middleware.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_not-found.tsx|not-found.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_global.d.ts|global.d.ts]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_sw.js|sw.js]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 85 edges
2. `compilerOptions` - 16 edges
3. `cn()` - 13 edges
4. `LoadingButton()` - 10 edges
5. `TaskStatus` - 10 edges
6. `Task` - 8 edges
7. `syncOfflineAttendance()` - 8 edges
8. `AttendanceCheckInPanel()` - 7 edges
9. `useTenant()` - 7 edges
10. `formatINR()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminAttendancePage()` --calls--> `createClient()`  [EXTRACTED]
  app/(tenant)/[subdomain]/(app)/attendance/admin/page.tsx → lib/supabase/server.ts
- `AttendancePage()` --calls--> `createClient()`  [EXTRACTED]
  app/(tenant)/[subdomain]/(app)/attendance/page.tsx → lib/supabase/server.ts
- `generateMetadata()` --calls--> `createClient()`  [EXTRACTED]
  app/(tenant)/[subdomain]/(app)/clients/[id]/page.tsx → lib/supabase/server.ts
- `ClientDetailPage()` --calls--> `createClient()`  [EXTRACTED]
  app/(tenant)/[subdomain]/(app)/clients/[id]/page.tsx → lib/supabase/server.ts
- `NewClientPage()` --calls--> `createClient()`  [EXTRACTED]
  app/(tenant)/[subdomain]/(app)/clients/new/page.tsx → lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (48 total, 17 thin omitted)

### Community 0 - "ProjectDetailClient.tsx"
Cohesion: 0.06
Nodes (34): ClientDetailProps, EditClientFormData, editClientSchema, ClientFormData, clientFormSchema, EditProjectFormData, editProjectSchema, ProjectDetailProps (+26 more)

### Community 1 - "page.tsx"
Cohesion: 0.07
Nodes (29): AppLayout(), AppLayoutProps, metadata, SettingsPage(), SetPasswordPage(), LoginClientProps, BeforeInstallPromptEvent, CompanyData (+21 more)

### Community 2 - "TaskForm.tsx"
Cohesion: 0.15
Nodes (21): KanbanBoardProps, isOverdue(), KanbanCard(), KanbanCardOverlay(), KanbanCardProps, PRIORITY_DOT, KanbanColumn(), KanbanColumnProps (+13 more)

### Community 3 - "EmployeeListClient.tsx"
Cohesion: 0.09
Nodes (17): ClientListClientProps, ClientRecord, ClientsPage(), metadata, EmployeeListClientProps, EmployeeProfile, EmployeeProfilePage(), metadata (+9 more)

### Community 4 - "AttendanceCheckInPanel.tsx"
Cohesion: 0.12
Nodes (22): inter, metadata, viewport, AttendanceCheckInPanel(), AttendanceCheckInPanelProps, AttendanceLog, formatDuration(), formatDurationHMS() (+14 more)

### Community 5 - "dependencies"
Cohesion: 0.08
Nodes (24): ConfirmDialog(), dependencies, @base-ui/react, class-variance-authority, clsx, cn, date-fns, @dnd-kit/core (+16 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "ProjectListClient.tsx"
Cohesion: 0.15
Nodes (15): DashboardPage(), metadata, MyTask, RecentProject, ProjectDetailClient(), metadata, ProjectsPage(), ClientOption (+7 more)

### Community 8 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+11 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "createClient"
Cohesion: 0.17
Nodes (12): checkOutSchema, POST(), GET(), createProjectSchema, GET(), POST(), createTaskSchema, GET() (+4 more)

### Community 11 - "AdminAttendanceTable.tsx"
Cohesion: 0.20
Nodes (13): AdminAttendancePage(), AdminAttendancePageProps, metadata, AdminAttendanceTable(), AdminAttendanceTableProps, AttendanceLog, calculateTotalDuration(), downloadCSV() (+5 more)

### Community 12 - "page.tsx"
Cohesion: 0.18
Nodes (12): AttendanceLog, AttendancePage(), AttendancePageProps, metadata, AttendanceLog, AttendanceMonthCalendar(), AttendanceMonthCalendarProps, DayStatus (+4 more)

### Community 13 - "server.ts"
Cohesion: 0.15
Nodes (4): checkInSchema, POST(), PUT(), reorderSchema

### Community 14 - "page.tsx"
Cohesion: 0.32
Nodes (7): FilterKey, isDueToday(), isOverdue(), metadata, MyTask, MyTasksPage(), PRIORITY_BADGE

### Community 15 - "page.tsx"
Cohesion: 0.29
Nodes (5): FieldError, Step1Data, step1Schema, Step2Data, step2Schema

### Community 16 - "route.ts"
Cohesion: 0.33
Nodes (5): DELETE(), GET(), PUT(), RouteProps, updateClientSchema

### Community 17 - "route.ts"
Cohesion: 0.33
Nodes (5): DELETE(), GET(), PUT(), RouteProps, updateProjectSchema

### Community 18 - "InviteFormClient.tsx"
Cohesion: 0.33
Nodes (4): InviteFormClientProps, InviteFormValues, inviteSchema, ManagerOption

### Community 20 - "route.ts"
Cohesion: 0.40
Nodes (4): DELETE(), GET(), PUT(), updateTaskSchema

### Community 21 - "page.tsx"
Cohesion: 0.40
Nodes (4): generateMetadata(), LoginPage(), LoginPageProps, TenantLoginBranding

### Community 22 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, middleware()

### Community 23 - "route.ts"
Cohesion: 0.50
Nodes (3): clientSchema, GET(), POST()

### Community 24 - "route.ts"
Cohesion: 0.50
Nodes (3): GET(), PATCH(), updateCompanySchema

### Community 27 - "route.ts"
Cohesion: 0.50
Nodes (3): DELETE(), PUT(), updateStatusSchema

### Community 28 - "route.ts"
Cohesion: 0.50
Nodes (3): createStatusSchema, GET(), POST()

### Community 29 - "page.tsx"
Cohesion: 0.50
Nodes (3): LinkedProject, ClientDetailPage(), generateMetadata()

### Community 30 - "page.tsx"
Cohesion: 0.50
Nodes (3): generateMetadata(), ProjectDetailPage(), ProjectDetailData

### Community 31 - "layout.tsx"
Cohesion: 0.50
Nodes (3): generateMetadata(), SubdomainRootLayout(), TenantLayoutProps

## Knowledge Gaps
- **201 isolated node(s):** `metadata`, `metadata`, `metadata`, `step1Schema`, `step2Schema` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.