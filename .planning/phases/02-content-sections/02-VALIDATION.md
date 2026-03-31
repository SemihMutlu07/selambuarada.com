---
phase: 2
slug: content-sections
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build as test harness (no separate test runner) |
| **Config file** | astro.config.mjs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BLOG-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BLOG-02 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | BLOG-03 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | BLOG-04 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | BLOG-05 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | BLOG-06 | manual | inspect `dist/blog/*/index.html` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | PROJ-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | PROJ-02 | manual | browser visual check | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | PROJ-03 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | FILM-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | FILM-02 | build smoke + manual | `npm run build`, browser check | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 1 | FILM-03 | manual | browser visual check | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 1 | FILM-04 | manual | browser visual check | ❌ W0 | ⬜ pending |
| 02-03-05 | 03 | 1 | FILM-05 | manual | browser visual check | ❌ W0 | ⬜ pending |
| 02-03-06 | 03 | 1 | FILM-06 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 1 | PHOT-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 1 | PHOT-02 | manual | browser interaction check | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 1 | PHOT-03 | manual | inspect network tab | ❌ W0 | ⬜ pending |
| 02-04-04 | 04 | 1 | PHOT-04 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Seed `src/content/blog/sample-post.mdx` with 1 sample post (title, date, description, tags)
- [ ] Seed `src/content/films.json` with 1 sample entry (including `bts` field)
- [ ] Seed `src/content/projects.json` with 1 sample entry
- [ ] Seed `src/content/photosets.json` with 1 sample entry + 1 image in `src/assets/photos/`
- [ ] Add `public/og-image.png` (1200x630) as shared OG fallback
- [ ] Add `bts: z.string().optional()` to films schema in `content.config.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OG meta tags present in HTML | BLOG-06 | Meta tag presence requires HTML inspection | `npm run build` then inspect `dist/blog/*/index.html` for og:image, og:title |
| Project cards show correct fields | PROJ-02 | Visual layout check | `npm run preview` then visit `/projects`, verify title/tech/description/links |
| Film iframe renders video | FILM-02 | Requires browser for iframe | `npm run preview` then visit `/films/[id]`, verify video plays |
| Film description visible | FILM-03 | Visual check | Visit film case study, verify description text |
| Film credits section visible | FILM-04 | Visual check | Visit film case study, verify credits list |
| Film BTS section visible | FILM-05 | Visual check | Visit film case study with bts field, verify section appears |
| Photo sets expandable | PHOT-02 | Requires browser interaction | Visit `/photos`, click summary elements |
| Photos served as WebP | PHOT-03 | Requires network tab inspection | Open DevTools, check image format in network requests |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
