# Design System — ERP SaaS

This is the single source of truth for how the product looks and feels. Agents and developers check here before picking a color, spacing value, or deciding how a component behaves.

---

## Design Principles

**1. Mobile-first, always.**
The primary user is an employee on a phone. Every screen is designed for 375px first, then scaled up. Desktop layouts are the progressive enhancement, not the starting point.

**2. Clarity over cleverness.**
This is a work tool. People use it under time pressure — punching in at the office gate, checking a task deadline. Keep interactions obvious and fast. No loading spinners where skeletons will do. No modals where an inline form works.

**3. Tenant personality without chaos.**
Each company can have a logo and primary brand color. Everything else — spacing, typography, motion — is controlled by the system so the product stays coherent regardless of tenant customization.

**4. Accessible by default.**
Minimum contrast 4.5:1 for body text, 3:1 for large/UI text. Focus rings on all interactive elements. Touch targets minimum 44×44px (Apple HIG baseline).

---

## Color Tokens

These are defined in `tailwind.config.ts` and/or CSS custom properties. Use the token names, not raw hex values.

### Base Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0f1117` | App background (dark mode) |
| `--color-surface` | `#1a1d27` | Cards, sidebars, sheets |
| `--color-surface-raised` | `#222535` | Dropdowns, tooltips, popovers |
| `--color-border` | `#2e3147` | All borders, dividers |
| `--color-border-subtle` | `#1e2136` | Subtle separators inside cards |

### Text

| Token | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#e8eaf6` | Headings, primary labels |
| `--color-text-secondary` | `#9095b0` | Supporting text, placeholders |
| `--color-text-muted` | `#5a5f78` | Timestamps, metadata, disabled |

### Brand (default — overridable per tenant)

| Token | Value | Usage |
|---|---|---|
| `--color-brand` | `#6366f1` | Primary CTA buttons, active nav links, focus rings |
| `--color-brand-hover` | `#4f52d9` | Hover state of brand elements |
| `--color-brand-subtle` | `#1e1f4a` | Brand tinted backgrounds (badges, highlights) |

### Semantic

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#22c55e` | Checked-in status, task complete |
| `--color-success-subtle` | `#052e16` | Success backgrounds |
| `--color-warning` | `#f59e0b` | Out-of-range check-in, overdue tasks |
| `--color-warning-subtle` | `#2d1f03` | Warning backgrounds |
| `--color-danger` | `#ef4444` | Errors, destructive actions |
| `--color-danger-subtle` | `#2d0808` | Error backgrounds |
| `--color-info` | `#38bdf8` | Informational badges, neutral highlights |

### Attendance-specific

| Status | Color |
|---|---|
| Present | `--color-success` |
| Absent | `--color-danger` |
| Out of range | `--color-warning` |
| Location unavailable | `--color-text-muted` |
| Half day | `--color-info` |

---

## Typography

Font stack loaded from Google Fonts:

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

| Scale | Class | Size | Weight | Usage |
|---|---|---|---|---|
| Display | `text-display` | 32px / 2rem | 700 | Page heroes, onboarding |
| H1 | `text-h1` | 24px / 1.5rem | 600 | Page titles |
| H2 | `text-h2` | 20px / 1.25rem | 600 | Section headings |
| H3 | `text-h3` | 16px / 1rem | 600 | Card headings, panel titles |
| Body | `text-body` | 14px / 0.875rem | 400 | Default body copy |
| Small | `text-small` | 12px / 0.75rem | 400 | Meta, timestamps, secondary labels |
| Mono | `font-mono` | 13px / 0.8125rem | 400 | Employee IDs, slugs, code |

Line height: `1.5` for body, `1.2` for headings.

---

## Spacing Scale

Follow the 4px base grid. Use Tailwind's default scale (`space-1` = 4px, `space-2` = 8px, etc.). Don't introduce arbitrary values.

Common patterns:
- Card padding: `p-4` (16px) on mobile, `p-6` (24px) on desktop
- Section gaps: `gap-6` between major sections
- Inline element gaps: `gap-2` or `gap-3`
- Page horizontal padding: `px-4` on mobile, `px-6` on tablet, `px-8` on desktop

---

## Elevation / Shadow

```css
/* Level 1 — cards, panels */
box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);

/* Level 2 — dropdowns, popovers */
box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);

/* Level 3 — modals, sheets */
box-shadow: 0 20px 40px rgba(0,0,0,0.6);
```

Use `border` + `bg-surface` rather than heavy shadows for cards — this product's dark mode looks better with border definition.

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 4px | Badges, tags, small elements |
| `rounded-md` | 8px | Inputs, buttons, small cards |
| `rounded-lg` | 12px | Cards, panels, dialogs |
| `rounded-xl` | 16px | Bottom sheets, mobile drawers |
| `rounded-full` | 9999px | Avatars, pill badges |

---

## Motion

Keep animations functional — they communicate state, not just decorate.

| Use case | Duration | Easing |
|---|---|---|
| Hover color change | 150ms | `ease-out` |
| Dropdown open/close | 200ms | `ease-out` |
| Page transition | 300ms | `ease-in-out` |
| Toast/notification slide-in | 250ms | Spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`) |
| Skeleton pulse | 1.5s | `ease-in-out` infinite |
| Kanban drag | Live (no animation on drag) | Drop snap: 200ms `ease-out` |

Respect `prefers-reduced-motion`. Wrap animations in a check:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Component Patterns

### Navigation

**Mobile:** Bottom tab bar with 5 items max. Active item uses `--color-brand`. Icons from `lucide-react`. Labels always visible (no icon-only nav on mobile — accessibility).

**Desktop:** Left sidebar, collapsible. Width: 240px expanded, 64px collapsed. Tenant logo at top.

Tab order (mobile nav):
1. Dashboard
2. Attendance
3. Tasks
4. Clients / Projects
5. More (→ employees, settings)

### Cards

```
bg-surface + border border-border + rounded-lg + p-4
```

Don't nest cards. If you need visual grouping inside a card, use `border-t border-border-subtle` separators.

### Buttons

| Variant | Usage |
|---|---|
| `primary` | The one main action per screen |
| `secondary` | Secondary actions, cancel |
| `ghost` | Toolbar actions, icon buttons |
| `destructive` | Delete, remove — always requires confirmation |

Touch target: minimum `h-10` (40px) on mobile. For icon-only buttons, `h-10 w-10` with tooltip.

### Forms

- Labels above fields, always. No placeholder-as-label tricks.
- Error messages below the field, in `--color-danger`, with an icon.
- Required fields: asterisk `*` after the label.
- Disabled state: 40% opacity + `cursor-not-allowed`.

### Tables (data grids)

- Sticky header on scroll.
- Row hover: `bg-surface-raised` (subtle, not jarring).
- Pagination at bottom. Page size options: 10, 25, 50.
- Mobile: tables collapse to card-per-row layout below `md` breakpoint.
- Empty state: illustration + message + primary action (not just "No data").

### Status Badges

```tsx
// Usage: <StatusBadge status="present" />
// Variants map to semantic color tokens above
```

Small (`h-5`), rounded-full, no border — just a colored background with text. Font: `text-small font-medium`.

### Modals & Sheets

- Desktop: centered `Dialog` (shadcn). Max width 560px for forms, 720px for detail views.
- Mobile: bottom `Sheet` (shadcn) slides up from bottom. Use `rounded-t-xl`. Handle bar at top.
- Always trap focus. Close on `Escape`. Backdrop closes on click unless the form is dirty (warn first).

### Skeleton Loaders

Every list/table/card that fetches data must have a skeleton state. Match the shape of the real content exactly — don't use a generic spinner for page-level loading.

### Empty States

Anatomy: small icon (64px) + heading + 1-sentence description + primary action button.

Don't be generic. "No clients yet" → "Add your first client to start tracking projects."

---

## Attendance Check-in UI (Special Case)

This is the screen people use the most, often while moving. It deserves extra care.

- **Big check-in button**: Full-width, `h-16`, centered on screen, `rounded-xl`. Green when clocked out (click to check in), Red when clocked in (click to check out).
- **Status line below button**: Shows current status and time of last action.
- **Location indicator**: Small inline indicator — green dot if geolocation acquired, yellow if pending, red if denied.
- **No loading state on the button itself** — the geolocation request happens before the button is enabled. Disable button with spinner while acquiring location.

---

## Kanban Board

- Columns: horizontal scroll on mobile, wrap on desktop.
- Column width: `280px` fixed.
- Cards: `bg-surface-raised`, `rounded-md`, `p-3`, draggable (`cursor-grab`).
- Drag overlay: slight scale-up (1.03) + elevated shadow + 90% opacity on original card.
- Empty column: dashed border drop zone with "Drop here" label.
- Add card button at bottom of each column, ghost style.

---

## PWA / Mobile Shell

- Install prompt: bottom banner, dismissible, appears after 3rd visit.
- Splash screen: brand color background + logo centered.
- Dynamic manifest per tenant: name, short_name, theme_color from company settings.
- Offline page: simple "You're offline" page with last-sync timestamp. Don't show broken states — show a friendly offline screen.
- Status bar color (iOS meta tag): matches `--color-bg`.

---

## Tenant Customization Scope

What tenants can change:
- Logo (uploaded image)
- Primary brand color (updates `--color-brand`, `--color-brand-hover`, `--color-brand-subtle`)
- Company name (shown in nav, manifest, tab title)

What tenants cannot change:
- Typography
- Spacing / layout
- Dark mode (app is dark-only for now — revisit when there's demand)
- Motion settings (system respects `prefers-reduced-motion`)
