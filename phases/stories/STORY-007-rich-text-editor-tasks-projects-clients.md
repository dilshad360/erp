# STORY-007: Rich Text Editor Integration for Tasks, Projects & Client Notes

> **Status:** ⬜ Backlog  
> **Module / Epic:** Shared Components / Tasks / Projects / Clients  
> **Target Branch:** `feat/rich-text-story-007`  
> **Priority:** P2 - Medium  
> **Created Date:** 2026-09-19  
> **Updated Date:** 2026-09-19  
> **Agent / Assignee:** Antigravity AI Agent  

---

## 1. User Story Statement

**As an** employee, project lead, or administrator creating or updating tasks,  
**I want to** format task descriptions with rich text capabilities (headings, bold, italics, bullet/numbered lists, task checklists, inline code, code blocks, blockquotes, and hyperlinks),  
**So that** technical instructions, acceptance criteria, bug reproduction steps, and task deliverables are structured, readable, and unambiguous.

**As a** project manager or team member defining a project scope,  
**I want to** write rich project briefs and specifications with organized formatting and milestone lists,  
**So that** all contributors share a crystal-clear understanding of project goals and deliverables.

**As an** account manager or admin managing client relationships,  
**I want to** format client notes, billing guidelines, and key interaction logs with rich styling,  
**So that** vital client context is clearly organized and highlighted.

---

## 2. Business Value & Context

- **Why are we building this?**:
  1. **Overcoming Plaintext Limitations**: Plain `<textarea>` inputs force users into unstructured text walls or makeshift ASCII formatting, degrading readability for complex task tickets, project briefs, and client notes.
  2. **Enhanced Team Alignment**: Software and operations teams rely heavily on formatted lists, code blocks, and structured acceptance criteria to execute tasks accurately.
  3. **Professional SaaS Experience**: Modern B2B ERP platforms offer rich WYSIWYG or markdown-rendered editing across all core operational entities.
- **Target Persona**: All active tenant users: Employees, Project Managers, Account Executives, and Company Admins.
- **Expected Impact**: Higher documentation clarity, reduced communication overhead, and faster task comprehension.

---

### 3. Multi-Tenancy & Security Verification

Every feature touching data must adhere to multi-tenant isolation rules:

- [x] **Data Isolation**: All underlying tables (`tasks`, `projects`, `clients`) contain `company_id uuid references companies(id) not null` and are isolated per tenant.
- [x] **Row Level Security (RLS)**: Existing RLS policies strictly enforce `company_id = (select company_id from profiles where id = auth.uid())` across all SELECT, INSERT, UPDATE, and DELETE operations.
- [x] **Server-Side Auth Context**: The `company_id` is never trusted from client payloads and is always derived server-side via Supabase `auth.uid()`.
- [x] **XSS & Injection Protection**: Rich text HTML/Markdown outputs must be sanitized before rendering (or rendered via safe AST/markdown parsers) to prevent Stored Cross-Site Scripting (XSS) vulnerabilities.
- [x] **Subdomain Scoping**: Tenant-specific routes reside under `app/(tenant)/[subdomain]/...` and undergo tenant middleware validation.

---

## 4. Technical Scope & Architecture

### A. Database / Supabase Schema Changes
- **Tables Affected**: `tasks` (`description text`), `projects` (`description text`), `clients` (`notes text`).
- **Schema Impact**: None — existing Postgres `text` columns natively support rich HTML / Markdown strings without requiring schema migrations.
- **Existing RLS**:
  - `tasks`: `tenant_isolation` using `company_id = (select company_id from profiles where id = auth.uid())`.
  - `projects`: `tenant_isolation` using `company_id = (select company_id from profiles where id = auth.uid())`.
  - `clients`: `tenant_isolation` using `company_id = (select company_id from profiles where id = auth.uid())`.

### B. Shared UI Components
- **`components/shared/RichTextEditor.tsx`**:
  - Intuitive formatting toolbar: Bold, Italic, Strikethrough, Heading 2/3, Bullet List, Numbered List, Checklist, Code block / Inline code, Blockquote, Link, Clear Formatting.
  - Dark-mode tokens matching `design.md` (`--color-surface`, `--color-border`, `--color-brand`, `--color-text-primary`).
  - Mobile-friendly horizontally scrollable toolbar with touch-friendly button targets (>= 40px).
  - Compatible with React Hook Form controlled inputs (`value`, `onChange`, `placeholder`, `error`, `disabled`).
- **`components/shared/RichTextViewer.tsx`**:
  - Safe, sanitized display component for rendering rich content across cards, sheets, and detail views.
  - Clean prose styling with typography tokens for headings, lists, code spans, and blockquotes.

### C. Frontend / UI Form Integrations
1. **Tasks**:
   - `components/tasks/TaskForm.tsx`: Replace `<textarea id="description">` with `<RichTextEditor>`.
   - `components/tasks/TaskSheet.tsx` & Task Detail Views: Render rich descriptions with `<RichTextViewer>`.
2. **Projects**:
   - `app/(tenant)/[subdomain]/(app)/projects/new/ProjectFormClient.tsx`: Replace description `<textarea>` with `<RichTextEditor>`.
   - `app/(tenant)/[subdomain]/(app)/projects/[id]/ProjectDetailClient.tsx`: Display rich project description and support rich text editing in the edit modal.
3. **Clients**:
   - `app/(tenant)/[subdomain]/(app)/clients/new/ClientFormClient.tsx`: Replace notes `<textarea>` with `<RichTextEditor>`.
   - `app/(tenant)/[subdomain]/(app)/clients/[id]/ClientDetailClient.tsx`: Display formatted notes with `<RichTextViewer>` and support rich text editing.

### D. Mobile & PWA UX (375px viewport)
- Sticky / scrollable formatting toolbar on mobile viewport.
- Keyboard avoidance with smooth scrolling within drawers (`TaskSheet`, edit dialogs).
- Compact toolbar button sizing with clear active states.

---

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Creating a Task with Rich Text Formatting
- **Given** a logged-in user creating a task in `TaskForm` (or `TaskSheet`),
- **When** they format their description using bold text, bullet points, a code block, and a link,
- **Then** the formatting renders in real-time in the editor, saves cleanly to the database upon submission, and displays properly formatted in the task view.

### Scenario 2: Project Scope & Brief Rich Formatting
- **Given** a project lead creating a new project in `/projects/new` or editing an existing project in `/projects/[id]`,
- **When** they input a multi-paragraph project description with headings and numbered milestones,
- **Then** the rich text is preserved and rendered accurately on the Project Details overview tab.

### Scenario 3: Client Notes Rich Formatting
- **Given** an admin or manager adding notes to a client record in `/clients/new` or `/clients/[id]`,
- **When** they paste or type formatted bullet lists and billing terms into the rich text editor,
- **Then** the notes save and render with structured typography in the Client Details overview.

### Scenario 4: Multi-Tenant Data Isolation
- **Given** Tenant A and Tenant B each save tasks with rich text descriptions,
- **When** a user from Tenant A queries tasks,
- **Then** only Tenant A's rich descriptions are returned and RLS prevents any cross-tenant data access.

### Scenario 5: Security & XSS Sanitization
- **Given** a malicious user attempts to insert script tags or `javascript:` URI handlers in rich text fields,
- **When** the content is parsed and rendered by `<RichTextViewer>`,
- **Then** unsafe tags and attributes are sanitized and stripped, preventing script execution.

### Scenario 6: Responsive Mobile UX (375px)
- **Given** a mobile user opening `TaskSheet` or editing a project description on a 375px screen,
- **When** they focus the editor and scroll the formatting toolbar,
- **Then** all toolbar actions remain accessible without layout breakage or viewport overflow.

---

## 6. Implementation Subtasks Breakdown

- [ ] **Task 1**: Implement `components/shared/RichTextEditor.tsx` and `components/shared/RichTextViewer.tsx` with dark mode tokens and XSS sanitization.
- [ ] **Task 2**: Integrate `RichTextEditor` and `RichTextViewer` into Task Management (`TaskForm.tsx`, `TaskSheet.tsx`, task views).
- [ ] **Task 3**: Integrate `RichTextEditor` and `RichTextViewer` into Project Management (`ProjectFormClient.tsx`, `ProjectDetailClient.tsx`).
- [ ] **Task 4**: Integrate `RichTextEditor` and `RichTextViewer` into Client Management (`ClientFormClient.tsx`, `ClientDetailClient.tsx`).
- [ ] **Task 5**: Verify mobile responsiveness (375px viewport), toolbar touch targets, and dark mode contrast.
- [ ] **Task 6**: Run quality gates (`npm run typecheck`, `npm run lint`, `npm run build`) and update tracker.

---

## 7. Quality & Verification Gates

Run and verify before completing story:

- [ ] `npm run build` — Passes with zero errors
- [ ] `npm run lint` — Zero ESLint warnings or errors
- [ ] `npm run typecheck` — Strict TypeScript passes (`tsc --noEmit`)
- [ ] Mobile viewport tested at 375px width
- [ ] RLS verified across multiple tenant accounts
- [ ] Logged-out access blocked
- [ ] Updated `TRACKER.md` status to ✅ Done

---

## 8. Tracking & Sign-Off

- **Completed Date**: Pending implementation
- **Migrations Applied**: None required (Postgres `text` columns reused)
- **Decisions Logged in TRACKER.md**: Replaced plain `<textarea>` descriptions with unified `RichTextEditor` across Tasks, Projects, and Clients.
- **Signed Off By**: Antigravity AI Agent
