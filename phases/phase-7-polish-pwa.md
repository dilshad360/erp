# Phase 7 — Polish, PWA & Pre-Launch

**Goal:** Turn the working app into something that feels finished. Mobile experience is smooth, the PWA installs cleanly, and everything is solid enough to hand to a paying customer.

**Branch:** `feat/pwa` (or done on `main` directly if no parallel work)
**Review level:** Full autonomy. Use judgment.

**Depends on:** Phases 1–6 complete.

---

## What You're Building

By the end of this phase:
- The app installs as a PWA on Android and iOS
- Dynamic PWA manifest per tenant (name, icon, theme color)
- Offline fallback page and offline attendance check-in queue
- Mobile UX pass across all modules — every screen works at 375px
- Company settings: logo upload, brand color, geofence radius
- Performance audit: Lighthouse score ≥ 85 on mobile
- Pre-launch infrastructure checklist completed
- Production hosting sorted (off Vercel Hobby)

---

## Tasks

### 7.1 — PWA Setup

- [ ] Install next-pwa or configure manual service worker:
  ```bash
  npm install next-pwa
  ```
  Or write a custom `public/service-worker.js` if next-pwa doesn't suit App Router.

- [ ] Configure caching strategy:
  - Cache-first for static assets (JS, CSS, fonts)
  - Network-first with cache fallback for API routes
  - Attendance page: fully cached for offline use

- [ ] Create `app/manifest.ts` (dynamic route):
  ```ts
  // Reads subdomain from request, fetches company name + brand color + logo
  // Returns Web App Manifest JSON
  export async function GET(request: Request) { ... }
  ```
  Fields: `name`, `short_name`, `display: 'standalone'`, `start_url`, `theme_color`, `background_color`, `icons`

- [ ] Add meta tags to tenant layout:
  ```html
  <meta name="theme-color" content={brandColor} />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="manifest" href="/manifest.json" />
  ```

- [ ] Apple touch icon: add `apple-touch-icon` links (180×180 PNG). Use company logo or default icon.

- [ ] Test PWA install: Chrome on Android → "Add to Home Screen" prompt appears and works.

**Deliverable:** App installs as PWA. Opens fullscreen. Correct name and icon per tenant.

---

### 7.2 — Offline Attendance Queue

The check-in screen must work offline. This is the most-used feature.

- [ ] Detect offline state: `window.addEventListener('online'/'offline')` in `CheckInPanel`
- [ ] If offline when checking in: store the action in IndexedDB (use `idb` package: `npm install idb`)
  - Store: `{ type: 'checkin'|'checkout', lat, lng, timestamp, userId }`
  - Show toast: "You're offline. Your check-in has been saved and will sync when you're back online."
- [ ] On coming back online: service worker or foreground code reads the queue and POSTs each item to the API
- [ ] Offline page: create `public/offline.html` — simple page shown when any non-cached route is visited offline
  - Shows last sync timestamp from a localStorage key you update on each successful API call

**Deliverable:** Check-in works offline. Syncs on reconnect.

---

### 7.3 — Company Settings

- [ ] Expand `app/(tenant)/[subdomain]/settings/page.tsx`:
  - **General tab**:
    - Company name (editable)
    - GST number
    - Office location (lat/lng): show a static map or coordinate input + geofence radius slider (50m – 1000m)
  - **Appearance tab**:
    - Logo upload: drag-drop or click-to-upload, preview before saving
    - Upload to Supabase Storage: `logos/{company_id}/logo.{ext}`
    - Brand color picker: `<ColorPicker>` with preset swatches + hex input
    - Live preview panel: shows how nav/buttons look with chosen color
  - **Danger Zone tab** (admin only):
    - Not implementing account deletion in MVP — show "Contact support to delete your account"

- [ ] Settings save flow: each tab has its own "Save Changes" button (not a single form save for the whole page)
- [ ] On brand color change: update the CSS variable on the page immediately (live preview), save to DB on submit

**Deliverable:** Company can change logo and brand color, settings persist.

---

### 7.4 — Mobile UX Pass

Walk through every page at 375px and fix anything broken.

- [ ] Dashboard: stat cards stack 2×2 grid on mobile (not 4-in-a-row)
- [ ] DataTable: confirm card-per-row view works on all list pages (employees, clients, projects)
- [ ] Attendance: check-in button is full-width, tap target ≥ 44px
- [ ] Kanban: horizontal scroll is smooth, cards are draggable by touch
- [ ] All forms: inputs are full-width, labels are readable, no overflow
- [ ] All modals: use bottom `<Sheet>` on mobile, not centered dialog
- [ ] Nav: bottom tab bar is correctly positioned at the bottom of the viewport (no layout shift)
- [ ] Touch scroll: no jarring scroll lock on any page

Use Chrome DevTools mobile emulation + test on at least one real Android device.

**Deliverable:** All screens functional and polished at 375px.

---

### 7.5 — Performance Audit

- [ ] Run Lighthouse in Chrome DevTools (mobile preset) on:
  - Dashboard page
  - Attendance check-in page
  - Task Kanban page
- [ ] Target: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Common fixes:
  - Add `loading="lazy"` to all off-screen images
  - Confirm `next/image` is used for all company logos and avatars
  - Check for unused JS bundles — run `npm run build` and check bundle analyzer output
  - Add `Suspense` boundaries on slow data fetches so the page isn't fully blocked

**Deliverable:** Lighthouse scores meet targets. Document results.

---

### 7.6 — Accessibility Pass

- [ ] All interactive elements have visible focus rings (not just `:hover` styles)
- [ ] Check-in button has `aria-label` that reflects current state ("Check in" / "Check out")
- [ ] DataTable has proper `<th scope="col">` headers
- [ ] All form inputs have associated `<label>` elements (not just placeholder)
- [ ] Color is not the only indicator of status — status badges also have text
- [ ] Test with keyboard-only navigation through the main flows
- [ ] Test with a screen reader (VoiceOver on iOS or TalkBack on Android) for the check-in flow

**Deliverable:** No critical accessibility violations. Keyboard navigation works on all main flows.

---

### 7.7 — Install Prompt & Onboarding Hint

- [ ] Create `components/pwa/InstallPrompt.tsx` (Client Component):
  - Listen for the `beforeinstallprompt` event
  - After the user has visited 3 times (track in localStorage), show a dismissible banner at the bottom
  - Banner: "[App name] works better when installed. Add to Home Screen →"
  - On click: call `prompt()` on the deferred event
  - Dismiss stores a flag in localStorage — don't show again if dismissed

- [ ] iOS note: the `beforeinstallprompt` event doesn't fire on iOS. Show a separate banner with "Tap Share → Add to Home Screen" instruction only on iOS Safari (detect via UA).

**Deliverable:** Install prompt appears after 3rd visit on Android. iOS shows manual instructions.

---

### 7.8 — Pre-Launch Checklist

Do not skip any of these before onboarding a paying customer.

**Hosting**
- [ ] Move off Vercel Hobby (ToS prohibits commercial use) — upgrade to Pro or move to Railway/Fly.io/VPS
- [ ] Confirm wildcard DNS `*.yourapp.com` points to the new host
- [ ] Wildcard SSL cert issued and auto-renewing

**Database**
- [ ] Supabase on a paid plan with PITR (Point-in-Time Recovery)
- [ ] Confirm daily backups are running
- [ ] Run RLS isolation test with 3 separate tenant sessions — verify no cross-tenant data appears
- [ ] Review all policies for any `security definer` functions — confirm none expose unintended data

**Security**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not in any `NEXT_PUBLIC_` variable — verify in deployed environment
- [ ] No sensitive data in client-side JS bundle (audit with bundle analyzer)
- [ ] CORS headers on API routes are locked to your domain
- [ ] Rate-limit the onboarding endpoint (1 company per IP per 10 minutes minimum)

**Monitoring**
- [ ] Set up error tracking (Sentry or similar) — frontend + backend
- [ ] Supabase alerts for DB connection count and storage usage
- [ ] Uptime monitoring (UptimeRobot free tier is enough to start)

**Legal / Compliance**
- [ ] Privacy policy page at `yourapp.com/privacy` — you collect GPS coordinates, make sure this is disclosed
- [ ] Terms of service at `yourapp.com/terms`
- [ ] Cookie/session disclosure (minimal — you use httpOnly session cookies, not tracking)

**Deliverable:** All pre-launch items checked. Ready for first paying customer.

---

### 7.9 — Phase 7 Verification

- [ ] PWA installs on Android — icon, name, splash screen correct
- [ ] Offline check-in: airplane mode → check in → reconnect → log appears in DB
- [ ] Brand color change → updates throughout the app (buttons, nav active state, focus rings)
- [ ] Logo upload → appears in nav and PWA icon
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90
- [ ] Keyboard-only navigation works on: login, check-in, add task, client list
- [ ] No console errors on any page in production build

---

## Post-MVP Backlog (don't build now)

These items were deliberately excluded from MVP. Document them here so they're not forgotten.

| Feature | Notes |
|---|---|
| Leave management | Needs policy config (leave types, accrual) — significant scope |
| Payroll | Requires statutory compliance (PF, ESI, TDS) — not a side feature |
| GST invoicing | Needs IRN/e-invoice integration — complex |
| Client portal | Clients log in to view their projects — needs separate auth flow |
| Custom email domain | For Supabase invite emails |
| White-label (custom domains) | `custom_domain` column is already in schema, just wire up middleware |
| Task comments & activity log | High value, straightforward to add post-MVP |
| Push notifications | For task assignments, check-in reminders |
| Reporting & analytics | Export beyond CSV — charts, scheduled reports |
| Mobile apps (native) | React Native / Expo reusing the same Supabase backend |
