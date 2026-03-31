---
phase: 3
slug: pages-and-seo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — build-time verification (Astro static site) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && ls dist/sitemap-index.xml dist/sitemap-0.xml` |
| **Estimated runtime** | ~4 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && ls dist/sitemap-index.xml dist/sitemap-0.xml`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SEO-03 | smoke | `grep 'site:' astro.config.mjs` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SEO-01 | smoke | `npm run build && ls dist/sitemap-index.xml` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | PAGE-01 | smoke | `npm run build && grep 'meta name="description"' dist/index.html` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | PAGE-02 | smoke | `npm run build && grep 'meta name="description"' dist/about/index.html` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | SEO-02 | smoke | `npm run build && find dist -name '*.html' -exec grep -L 'meta name="description"' {} +` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Build-time verification via `npm run build` + dist output inspection is the correct approach for this Astro static site.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Home page hero visual | PAGE-01 | Visual layout verification | Preview at localhost, confirm hero section renders with brutalist styling |
| About page bio layout | PAGE-02 | Visual layout verification | Preview at localhost, confirm bio content renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
