# Bug Reports & Fixes Directory (`phases/bugs/`)

This directory stores all defect tickets, Root Cause Analyses (RCA), and fix documentation for the Multi-Tenant ERP SaaS.

## File Naming Convention
`BUG-<3-digit-id>-<short-kebab-name>.md`  
Example: `BUG-001-attendance-geofence-timeout.md`

## Workflow
1. Copy [`../../templates/bug-template.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/templates/bug-template.md).
2. Fill out all sections (Reproduction steps, Multi-tenancy impact, Root Cause Analysis, Fix plan).
3. Register the bug in [`../../TRACKER.md`](file:///c:/Users/dilsh/OneDrive/Desktop/ERP/TRACKER.md) under Bug Registry.
4. Implement patch on branch `fix/<module>-bug-<id>`.
5. Verify reproduction is fixed, run verification gates (`npm run typecheck`, `npm run lint`, `npm run build`), and mark completed.
