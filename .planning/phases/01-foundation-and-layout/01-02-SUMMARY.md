---
phase: 01-foundation-and-layout
plan: 02
subsystem: ui
tags: [astro, tailwind, dark-mode, layout, responsive, brutalist]

# Dependency graph
requires:
  - phase: 01-foundation-and-layout/01-01
    provides: Tailwind v4 CSS config with @custom-variant dark, global.css base, Geist font package installed, content collection schemas
provides:
  - BaseLayout.astro shell with Geist font, FOUC prevention, header, footer, main slot
  - Header.astro with 6 nav links, dark mode toggle, hamburger menu on mobile
  - Footer.astro with email link
  - Six route stubs (/, /blog, /projects, /films, /photos, /about) using BaseLayout
  - Brutalist visual identity as baseline for all future page work
affects:
  - 02-blog-content
  - 02-projects-content
  - 02-films-content
  - 02-photos-content
  - 02-about-page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - BaseLayout wraps every page — title prop required, description optional
    - Dark mode via .dark class on <html>, persisted to localStorage.theme
    - FOUC prevention via is:inline script in <head> (applied before paint)
    - Brutalist aesthetic — text-5xl md:text-7xl font-bold tracking-tight headings, near-black/near-white contrast, no decorative elements

key-files:
  created:
    - src/layouts/BaseLayout.astro
    - src/components/Header.astro
    - src/components/Footer.astro
    - src/pages/index.astro
    - src/pages/blog/index.astro
    - src/pages/projects/index.astro
    - src/pages/films/index.astro
    - src/pages/photos/index.astro
    - src/pages/about.astro
  modified:
    - src/styles/global.css

key-decisions:
  - "Hamburger menu on mobile instead of wrapping nav links — cleaner UX at 375px with 6 nav items"
  - "Dark mode toggle script in Header.astro is bundled (not is:inline) — FOUC prevention handled separately in BaseLayout head"
  - "FOUC prevention uses is:inline in <head> — respects prefers-color-scheme as default when no localStorage value set"

patterns-established:
  - "BaseLayout: every page imports BaseLayout and passes title prop"
  - "Dark mode: toggle .dark on document.documentElement, persist to localStorage.theme as 'dark' or 'light'"
  - "Mobile nav: hamburger button reveals full-width nav drawer below md breakpoint"
  - "Brutalist stub: oversized heading (text-5xl md:text-7xl font-bold tracking-tight) + one-line subtitle"

requirements-completed: [LAYO-01, LAYO-02, LAYO-03, LAYO-04, LAYO-05, LAYO-06]

# Metrics
duration: ~30min
completed: 2026-03-31
---

# Phase 1 Plan 02: Base Layout and Route Stubs Summary

**Astro BaseLayout shell with FOUC-free dark mode, hamburger-menu header, and brutalist stub pages for all 6 routes**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-31
- **Completed:** 2026-03-31
- **Tasks:** 3 (including human-verify checkpoint)
- **Files modified:** 10

## Accomplishments
- BaseLayout.astro provides the complete page shell used by every route going forward
- Dark mode toggles cleanly with no FOUC on hard reload (is:inline script applies class before paint)
- Header navigation covers all 6 routes with current-page highlighting and a hamburger drawer on mobile
- Brutalist visual identity established — oversized headings, high-contrast palette, raw/minimal decoration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BaseLayout, Header with dark mode toggle, and Footer** - `77ac8fd` (feat)
2. **Task 2: Create stub pages for all routes with brutalist responsive styling** - `eba55dc` (feat)
3. **Task 3: Mobile hamburger menu fix (applied during human verification)** - `fd6d87d` (fix)

**Plan metadata:** committed with this SUMMARY

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Full page shell: Geist font import, FOUC script, Header, main slot, Footer
- `src/components/Header.astro` - Nav with 6 links, dark mode toggle, hamburger mobile menu
- `src/components/Footer.astro` - Minimal footer with mailto link
- `src/pages/index.astro` - Home stub with brutalist heading
- `src/pages/blog/index.astro` - Blog stub
- `src/pages/projects/index.astro` - Projects stub
- `src/pages/films/index.astro` - Films stub
- `src/pages/photos/index.astro` - Photos stub
- `src/pages/about.astro` - About stub
- `src/styles/global.css` - Minor brutalist base overrides appended

## Decisions Made
- Hamburger menu chosen over wrapping/scrolling nav links on mobile — the plan originally suggested flex-wrap but 6 links wrap awkwardly at 375px; a drawer is cleaner and the user confirmed this during verification.
- The dark mode toggle script stays bundled (not is:inline) because FOUC prevention is handled separately in the BaseLayout head — bundled toggle script only runs on click, no timing issue.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced wrapping mobile nav with hamburger menu**
- **Found during:** Task 3 (human verification)
- **Issue:** Plan specified flex-wrap for mobile nav; at 375px with 6 uppercase bold links, wrapping caused layout issues and the user requested a hamburger menu instead
- **Fix:** Added hamburger button (SVG open/close icons), hidden mobile nav drawer that toggles on click, JS toggle logic for both menu and icons
- **Files modified:** src/components/Header.astro
- **Verification:** User visually confirmed layout at 375px viewport; approved
- **Committed in:** fd6d87d

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug/UX fix during verification)
**Impact on plan:** Fix was necessary for correct mobile usability. No scope creep.

## Issues Encountered
None beyond the mobile nav fix described above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 routes exist and share a consistent shell — Phase 2 content work is purely additive
- Dark mode and responsive layout are verified and locked in
- Brutalist visual identity is established as the baseline
- No blockers for Phase 2

---
*Phase: 01-foundation-and-layout*
*Completed: 2026-03-31*
