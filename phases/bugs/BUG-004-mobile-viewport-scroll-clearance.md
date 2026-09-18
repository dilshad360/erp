# BUG-004: Mobile Viewport Bottom Scroll Clearance Obscured by BottomNav

**Status:** ✅ Resolved  
**Severity:** P1 (High / UX Blocker)  
**Affected Module:** Mobile Layout / `AppShell` / `globals.css`  
**Reported Date:** 2026-09-18  
**Resolved Date:** 2026-09-18  

---

## 1. Description & Symptoms

On mobile viewports, the bottom-most card (such as "My Tasks" on the Dashboard, form action buttons, or table cards) was partially or completely obscured behind the fixed `BottomNav` bar and could not be scrolled into view.

---

## 2. Root Cause Analysis (RCA)

1. **CSS Specificity Override on `.safe-area-pb`**:
   In `globals.css`, `.safe-area-pb` defined `padding-bottom: max(0.5rem, env(safe-area-inset-bottom))`. When attached to `<main className="pb-28 sm:pb-32 safe-area-pb">`, the `.safe-area-pb` definition lower in the CSS sheet took precedence over the utility padding `pb-28` (7rem = 112px), crushing the bottom padding down to 8px (0.5rem).
2. **Scroll Container Flex Child Height Calculation**:
   When the scroll container `<main>` had padding, WebKit and Blink engines often exclude parent bottom padding from the scrollable overflow calculation when child elements use `min-h-full`.
3. **Viewport Height Mode**:
   `h-screen` (100vh) extends beneath mobile browser address bars. Using `h-[100dvh]` dynamically aligns with the active viewport.

---

## 3. Resolution

1. Added `.safe-bottom-clearance` to `globals.css`:
   ```css
   .safe-bottom-clearance {
     padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px));
   }
   @media (min-width: 768px) {
     .safe-bottom-clearance {
       padding-bottom: 2rem;
     }
   }
   ```
2. Refactored `AppShell.tsx`:
   - Updated outer container to `h-screen h-[100dvh]`.
   - Placed the bottom clearance inside the inner wrapper `<div className="min-h-full flex flex-col safe-bottom-clearance">` inside `<main id="main-content">`, ensuring the browser's scroll height calculation includes the full clearance space below the last card.

---

## 4. Verification

- `npm run typecheck`: Passed with 0 errors.
- `npm run lint`: Passed with 0 errors.
- Tested mobile viewport (375px): Bottom cards now comfortably scroll well above the `BottomNav` bar with plenty of clearance.
