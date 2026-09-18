# Stories Directory (`phases/stories/`)

This directory stores all formal User Stories created for features in the Multi-Tenant ERP SaaS.

## File Naming Convention
`STORY-<3-digit-id>-<short-kebab-name>.md`  
Example: `STORY-001-offline-attendance-sync.md`

## Workflow
1. Copy [`../../templates/story-template.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/templates/story-template.md).
2. Fill out all sections (Acceptance criteria, RLS review, subtasks).
3. Register the story in [`../../TRACKER.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/TRACKER.md).
4. Implement, test on mobile (375px), run verification gates (`npm run typecheck`, `npm run lint`, `npm run build`), and mark completed.
