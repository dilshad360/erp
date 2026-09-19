# Graph Report - ERP  (2026-09-18)

## Corpus Check
- 161 files · ~101,454 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 910 nodes · 1185 edges · 77 communities (57 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7cf60cab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_ClientDetailClient.tsx|ClientDetailClient.tsx]]
- [[_COMMUNITY_EmployeeSettingsClient.tsx|EmployeeSettingsClient.tsx]]
- [[_COMMUNITY_TaskForm.tsx|TaskForm.tsx]]
- [[_COMMUNITY_EmployeeListClient.tsx|EmployeeListClient.tsx]]
- [[_COMMUNITY_AttendanceCheckInPanel.tsx|AttendanceCheckInPanel.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_ProjectDetailClient.tsx|ProjectDetailClient.tsx]]
- [[_COMMUNITY_Backend — Database, API & Supabase Configuration|Backend — Database, API & Supabase Configuration]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_createClient|createClient]]
- [[_COMMUNITY_AdminAttendanceTable.tsx|AdminAttendanceTable.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_server.ts|server.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_PageHeader.tsx|PageHeader.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_Design System — ERP SaaS|Design System — ERP SaaS]]
- [[_COMMUNITY_Frontend — Architecture, Pages & Components|Frontend — Architecture, Pages & Components]]
- [[_COMMUNITY_middleware.ts|middleware.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_3. Workflow 1 AI-Assisted Feature Development|3. Workflow 1: AI-Assisted Feature Development]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_not-found.tsx|not-found.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_STORY-004 Session Auto-Login & Tenant Branded Preloader|[STORY-004]: Session Auto-Login & Tenant Branded Preloader]]
- [[_COMMUNITY_AGENTS.md — ERP SaaS Agent Rules|AGENTS.md — ERP SaaS Agent Rules]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_global.d.ts|global.d.ts]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_sw.js|sw.js]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_STORY-003 Dark Mode Theme & Company Logo Display on Tenant Login Screen|[STORY-003]: Dark Mode Theme & Company Logo Display on Tenant Login Screen]]
- [[_COMMUNITY_STORY-XXX Short Descriptive Title|[STORY-XXX]: [Short Descriptive Title]]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Multi-Tenant ERP SaaS — Development Plan|Multi-Tenant ERP SaaS — Development Plan]]
- [[_COMMUNITY_ERP SaaS — Master Task Tracker|ERP SaaS — Master Task Tracker]]
- [[_COMMUNITY_cn|cn]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_BUG-XXX Short Descriptive Summary of the Defect|[BUG-XXX]: [Short Descriptive Summary of the Defect]]]
- [[_COMMUNITY_NewProjectFormClient.tsx|NewProjectFormClient.tsx]]
- [[_COMMUNITY_BUG-001 Employee Users Exposed to Company-Level Workspace Settings and Missing Role-Specific Settings|[BUG-001]: Employee Users Exposed to Company-Level Workspace Settings and Missing Role-Specific Settings]]
- [[_COMMUNITY_BUG-003 Mobile BottomNav Lack of Active Press Feedback & Loading Perception Delay|[BUG-003]: Mobile BottomNav Lack of Active Press Feedback & Loading Perception Delay]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_TRACKER|TRACKER.md]]
- [[_COMMUNITY_Tasks|Tasks]]
- [[_COMMUNITY_ProjectListClient.tsx|ProjectListClient.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Bug Reports & Fixes Directory (`phasesbugs`)|Bug Reports & Fixes Directory (`phases/bugs/`)]]
- [[_COMMUNITY_Stories Directory (`phasesstories`)|Stories Directory (`phases/stories/`)]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_StatCard.tsx|StatCard.tsx]]
- [[_COMMUNITY_graphify|graphify.md]]
- [[_COMMUNITY_graphify|graphify.md]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 90 edges
2. `compilerOptions` - 16 edges
3. `ERP SaaS — Master Task Tracker` - 15 edges
4. `cn()` - 13 edges
5. `Design System — ERP SaaS` - 13 edges
6. `Frontend — Architecture, Pages & Components` - 13 edges
7. `Backend — Database, API & Supabase Configuration` - 11 edges
8. `LoadingButton()` - 10 edges
9. `TaskStatus` - 10 edges
10. `AGENTS.md — ERP SaaS Agent Rules` - 10 edges

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

## Communities (77 total, 20 thin omitted)

### Community 0 - "ClientDetailClient.tsx"
Cohesion: 0.18
Nodes (10): ClientDetailProps, EditClientFormData, editClientSchema, ClientFormData, clientFormSchema, ConfirmDialogProps, LoadingButton(), LoadingButtonProps (+2 more)

### Community 1 - "EmployeeSettingsClient.tsx"
Cohesion: 0.07
Nodes (25): AppLayout(), AppLayoutProps, SetPasswordPage(), LoginClientProps, BeforeInstallPromptEvent, EmployeeProfileData, EmployeeSettingsClientProps, TabType (+17 more)

### Community 2 - "TaskForm.tsx"
Cohesion: 0.13
Nodes (23): generateMetadata(), ProjectTasksPage(), KanbanBoardProps, isOverdue(), KanbanCard(), KanbanCardOverlay(), KanbanCardProps, PRIORITY_DOT (+15 more)

### Community 3 - "EmployeeListClient.tsx"
Cohesion: 0.09
Nodes (18): ClientListClientProps, ClientRecord, ClientsPage(), metadata, EmployeeListClientProps, EmployeeProfile, ManagerOption, EmployeeProfilePage() (+10 more)

### Community 4 - "AttendanceCheckInPanel.tsx"
Cohesion: 0.12
Nodes (22): inter, metadata, viewport, AttendanceCheckInPanel(), AttendanceCheckInPanelProps, AttendanceLog, formatDuration(), formatDurationHMS() (+14 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (43): ConfirmDialog(), dependencies, @base-ui/react, class-variance-authority, clsx, cn, date-fns, @dnd-kit/core (+35 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "ProjectDetailClient.tsx"
Cohesion: 0.22
Nodes (12): DashboardPage(), metadata, MyTask, RecentProject, EditProjectFormData, editProjectSchema, ProjectDetailClient(), ProjectDetailProps (+4 more)

### Community 8 - "Backend — Database, API & Supabase Configuration"
Cohesion: 0.06
Nodes (35): API Routes, Attendance, Attendance — employee can only see their own rows (non-admin), `attendance_logs`, Backend — Database, API & Supabase Configuration, Buckets, Check-in RPC (handles geofence check atomically), `clients` (+27 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "createClient"
Cohesion: 0.17
Nodes (14): DELETE(), GET(), PUT(), RouteProps, updateClientSchema, clientSchema, GET(), POST() (+6 more)

### Community 11 - "AdminAttendanceTable.tsx"
Cohesion: 0.31
Nodes (10): AdminAttendanceTable(), AdminAttendanceTableProps, AttendanceLog, calculateTotalDuration(), downloadCSV(), Employee, formatTime(), getRowStatus() (+2 more)

### Community 12 - "page.tsx"
Cohesion: 0.18
Nodes (12): AttendanceLog, AttendancePage(), AttendancePageProps, metadata, AttendanceLog, AttendanceMonthCalendar(), AttendanceMonthCalendarProps, DayStatus (+4 more)

### Community 13 - "server.ts"
Cohesion: 0.11
Nodes (6): checkInSchema, POST(), checkOutSchema, POST(), metadata, NewClientPage()

### Community 14 - "page.tsx"
Cohesion: 0.32
Nodes (7): FilterKey, isDueToday(), isOverdue(), metadata, MyTask, MyTasksPage(), PRIORITY_BADGE

### Community 15 - "page.tsx"
Cohesion: 0.29
Nodes (5): FieldError, Step1Data, step1Schema, Step2Data, step2Schema

### Community 16 - "route.ts"
Cohesion: 0.10
Nodes (20): 1. User Story Statement, 2. Business Value & Context, 3. Multi-Tenancy & Security Verification, 4. Technical Scope & Architecture, 5. Acceptance Criteria (Given-When-Then), 6. Edge Cases & Boundary Conditions, 7. Implementation Subtasks Breakdown, 8. Quality & Verification Gates (+12 more)

### Community 17 - "route.ts"
Cohesion: 0.33
Nodes (5): DELETE(), GET(), PUT(), RouteProps, updateProjectSchema

### Community 18 - "PageHeader.tsx"
Cohesion: 0.22
Nodes (5): InviteFormClientProps, InviteFormValues, inviteSchema, ManagerOption, PageHeaderProps

### Community 20 - "Design System — ERP SaaS"
Cohesion: 0.07
Nodes (27): Attendance Check-in UI (Special Case), Attendance-specific, Base Palette, Border Radius, Brand (default — overridable per tenant), Buttons, Cards, Color Tokens (+19 more)

### Community 21 - "Frontend — Architecture, Pages & Components"
Cohesion: 0.07
Nodes (27): Attendance, Attendance, Auth Flow (Frontend Side), Clients, Dashboard, Data Display, Employees, Environment Variables (Frontend-visible) (+19 more)

### Community 22 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, middleware()

### Community 23 - "route.ts"
Cohesion: 0.28
Nodes (4): ActivateEmployeeInput, activateEmployeeSchema, TenantSignupInput, tenantSignupSchema

### Community 24 - "route.ts"
Cohesion: 0.50
Nodes (3): GET(), PATCH(), updateCompanySchema

### Community 27 - "route.ts"
Cohesion: 0.50
Nodes (3): DELETE(), PUT(), updateStatusSchema

### Community 28 - "route.ts"
Cohesion: 0.50
Nodes (3): createStatusSchema, GET(), POST()

### Community 29 - "3. Workflow 1: AI-Assisted Feature Development"
Cohesion: 0.09
Nodes (22): 1. Core Operating Principles, 2. Taxonomy & Identifiers, 3. Workflow 1: AI-Assisted Feature Development, 4. Workflow 2: AI-Assisted Bug Fixing & Incident Handling, 5. AI Agent Prompt Recipes, 6. Pre-Commit Quality Checklist, AI-Assisted Development Workflow Guide, Recipe A: Generating a Story from User Request (+14 more)

### Community 30 - "page.tsx"
Cohesion: 0.50
Nodes (3): generateMetadata(), ProjectDetailPage(), ProjectDetailData

### Community 31 - "layout.tsx"
Cohesion: 0.50
Nodes (3): generateMetadata(), SubdomainRootLayout(), TenantLayoutProps

### Community 37 - "page.tsx"
Cohesion: 0.22
Nodes (7): generateMetadata(), LoginPage(), LoginPageProps, generateMetadata(), SignupPage(), SignupPageProps, TenantLoginBranding

### Community 38 - "[STORY-004]: Session Auto-Login & Tenant Branded Preloader"
Cohesion: 0.10
Nodes (19): 1. User Story Statement, 2. Business Value & Context, 3. Multi-Tenancy & Security Verification, 4. Technical Scope & Architecture, 5. Acceptance Criteria (Given-When-Then), 6. Edge Cases & Boundary Conditions, 7. Implementation Subtasks Breakdown, 8. Quality & Verification Gates (+11 more)

### Community 39 - "AGENTS.md — ERP SaaS Agent Rules"
Cohesion: 0.11
Nodes (18): AGENTS.md — ERP SaaS Agent Rules, AI-Assisted Development Workflow, API / Route Handlers, Auth context is always from Supabase, Before You Call a Task Done, Coding Conventions, Component Patterns, File & Folder Naming (+10 more)

### Community 48 - "[STORY-003]: Dark Mode Theme & Company Logo Display on Tenant Login Screen"
Cohesion: 0.11
Nodes (18): 1. User Story Statement, 2. Business Value & Context, 3. Multi-Tenancy & Security Verification, 4. Technical Scope & Architecture, 5. Acceptance Criteria (Given-When-Then), 6. Edge Cases & Boundary Conditions, 7. Implementation Subtasks Breakdown, 8. Quality & Verification Gates (+10 more)

### Community 49 - "[STORY-XXX]: [Short Descriptive Title]"
Cohesion: 0.11
Nodes (18): 1. User Story Statement, 2. Business Value & Context, 3. Multi-Tenancy & Security Verification, 4. Technical Scope & Architecture, 5. Acceptance Criteria (Given-When-Then), 6. Edge Cases & Boundary Conditions, 7. Implementation Subtasks Breakdown, 8. Quality & Verification Gates (+10 more)

### Community 50 - "page.tsx"
Cohesion: 0.14
Nodes (10): metadata, SettingsPage(), CompanyData, CompanySettingsClientProps, TabType, CompanySummaryData, ColorPickerProps, PRESET_COLORS (+2 more)

### Community 51 - "Multi-Tenant ERP SaaS — Development Plan"
Cohesion: 0.12
Nodes (16): 1. Project Overview, 2. Tech Stack, 3.1 Multi-tenancy, 3.2 Route structure (indicative), 3. Architecture, 4. Database Schema (core tables), 5.1 Attendance, 5.2 Client Management (+8 more)

### Community 52 - "ERP SaaS — Master Task Tracker"
Cohesion: 0.12
Nodes (17): Active Stories & Features (`STORY-xxx` / `FEAT-xxx`), AI-Assisted Story & Bug Tracking, Bug & Defect Registry (`BUG-xxx`), Database Migration Status, Decisions & Notes Log, ERP SaaS — Master Task Tracker, Phase 1 — Foundation, Phase 2 — Employee Management (+9 more)

### Community 53 - "cn"
Cohesion: 0.21
Nodes (10): DatePicker(), DatePickerProps, EmptyState(), EmptyStateProps, FormField(), FormFieldProps, UserOption, UserSelect() (+2 more)

### Community 54 - "Tasks"
Cohesion: 0.14
Nodes (13): 6.1 — Task Schema & Migration, 6.2 — Task API Routes, 6.3 — Task List View, 6.4 — Task Creation & Edit Form, 6.5 — Kanban Board, 6.6 — My Tasks Page, 6.7 — Kanban Column Management (Settings), 6.8 — Dashboard Integration (+5 more)

### Community 55 - "Tasks"
Cohesion: 0.14
Nodes (13): 7.1 — PWA Setup, 7.2 — Offline Attendance Queue, 7.3 — Company Settings, 7.4 — Mobile UX Pass, 7.5 — Performance Audit, 7.6 — Accessibility Pass, 7.7 — Install Prompt & Onboarding Hint, 7.8 — Pre-Launch Checklist (+5 more)

### Community 56 - "Tasks"
Cohesion: 0.04
Nodes (42): 1. Defect Description & Symptoms, 2. Environment & Context, 3. Steps to Reproduce, 4. Multi-Tenancy & Security Impact Assessment, 5. Root Cause Analysis (RCA), 6. Fix Implementation Plan, 7. Verification & Regression Checklist, 8. Post-Mortem & Preventative Action (+34 more)

### Community 57 - "Tasks"
Cohesion: 0.17
Nodes (11): 2.1 — DataTable Shared Component, 2.2 — Employee List Page, 2.3 — Invite Employee Flow, 2.4 — Employee Profile Page, 2.5 — Avatar Upload, 2.6 — Role Management (Basic), 2.7 — Phase 2 Verification, Notes (+3 more)

### Community 58 - "Tasks"
Cohesion: 0.17
Nodes (11): 4.1 — Clients Schema & Migration, 4.2 — Shared Components: Forms & Dialogs, 4.3 — Client API Routes, 4.4 — Client List Page, 4.5 — Add / Edit Client Form, 4.6 — Client Detail Page, 4.7 — Phase 4 Verification, Notes (+3 more)

### Community 59 - "[BUG-XXX]: [Short Descriptive Summary of the Defect]"
Cohesion: 0.20
Nodes (9): 1. Defect Description & Symptoms, 2. Environment & Context, 3. Steps to Reproduce, 4. Multi-Tenancy & Security Impact Assessment, 5. Root Cause Analysis (RCA), 6. Fix Implementation Plan, 7. Verification & Regression Checklist, 8. Post-Mortem & Preventative Action (+1 more)

### Community 60 - "NewProjectFormClient.tsx"
Cohesion: 0.28
Nodes (6): NewProjectFormClientProps, ProjectFormData, projectFormSchema, ClientOption, ClientSelect(), ClientSelectProps

### Community 61 - "[BUG-001]: Employee Users Exposed to Company-Level Workspace Settings and Missing Role-Specific Settings"
Cohesion: 0.50
Nodes (3): LinkedProject, ClientDetailPage(), generateMetadata()

### Community 63 - "Tasks"
Cohesion: 0.15
Nodes (12): 5.1 — Projects Schema & Migration, 5.2 — Project API Routes, 5.3 — Project List Page, 5.4 — New Project Form, 5.5 — Project Detail Page, 5.6 — ClientSelect Shared Component, 5.7 — Dashboard Integration, 5.8 — Phase 5 Verification (+4 more)

### Community 66 - "Tasks"
Cohesion: 0.17
Nodes (11): 3.1 — Attendance Schema & Migration, 3.2 — Check-In / Check-Out API, 3.3 — Check-In Page (Employee View), 3.4 — Employee Monthly View, 3.5 — Admin Attendance View, 3.6 — Dashboard Integration, 3.7 — Phase 3 Verification, Notes (+3 more)

### Community 67 - "ProjectListClient.tsx"
Cohesion: 0.38
Nodes (5): metadata, ProjectsPage(), ClientOption, ProjectListClientProps, ProjectRecord

### Community 68 - "route.ts"
Cohesion: 0.50
Nodes (3): createProjectSchema, GET(), POST()

### Community 69 - "route.ts"
Cohesion: 0.50
Nodes (3): createTaskSchema, GET(), POST()

### Community 70 - "page.tsx"
Cohesion: 0.50
Nodes (3): AdminAttendancePage(), AdminAttendancePageProps, metadata

### Community 71 - "Bug Reports & Fixes Directory (`phases/bugs/`)"
Cohesion: 0.50
Nodes (3): Bug Reports & Fixes Directory (`phases/bugs/`), File Naming Convention, Workflow

### Community 73 - "Stories Directory (`phases/stories/`)"
Cohesion: 0.50
Nodes (3): File Naming Convention, Stories Directory (`phases/stories/`), Workflow

## Knowledge Gaps
- **513 isolated node(s):** `metadata`, `metadata`, `metadata`, `step1Schema`, `step2Schema` (+508 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `createClient` to `EmployeeSettingsClient.tsx`, `TaskForm.tsx`, `EmployeeListClient.tsx`, `ProjectDetailClient.tsx`, `page.tsx`, `server.ts`, `page.tsx`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `page.tsx`, `layout.tsx`, `page.tsx`, `page.tsx`, `[BUG-001]: Employee Users Exposed to Company-Level Workspace Settings and Missing Role-Specific Settings`, `[BUG-003]: Mobile BottomNav Lack of Active Press Feedback & Loading Perception Delay`, `TRACKER.md`, `ProjectListClient.tsx`, `route.ts`, `route.ts`, `page.tsx`, `route.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `ConfirmDialog()` connect `dependencies` to `ClientDetailClient.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _513 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EmployeeSettingsClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06914893617021277 - nodes in this community are weakly interconnected._
- **Should `TaskForm.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13446969696969696 - nodes in this community are weakly interconnected._
- **Should `EmployeeListClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08602150537634409 - nodes in this community are weakly interconnected._
- **Should `AttendanceCheckInPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._