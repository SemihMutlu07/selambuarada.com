---
phase: 1
slug: foundation-and-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build (TypeScript + Zod schema validation) — no separate test runner needed |
| **Config file** | `astro.config.mjs` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npx astro check` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npx astro check`
- **Before `/gsd:verify-work`:** Full suite must be green + manual visual checks
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-02 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | FOUND-03 | manual | `ls node_modules/gsap` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | FOUND-04 | manual/visual | dev server inspection | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | FOUND-05 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | LAYO-01 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | LAYO-02 | build smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | LAYO-03 | manual | browser devtools | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | LAYO-04 | manual/visual | browser hard reload | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 2 | LAYO-05 | manual/visual | browser devtools resize | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 2 | LAYO-06 | manual/visual | browser visual check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` scripts: verify `build`, `dev`, `preview` commands exist after scaffold
- [ ] `npx astro check` available for TypeScript type checking beyond `tsc`
- [ ] No separate test framework needed — Astro's build + type checking serves as the test harness

*Existing infrastructure covers automated requirements once scaffold is built.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Geist font loads in browser | FOUND-04 | Font rendering requires visual confirmation | Open dev server, inspect computed font-family |
| Dark mode toggle works | LAYO-03 | Requires DOM interaction + localStorage check | Click toggle, verify class on `<html>`, check localStorage |
| No FOUC on dark mode | LAYO-04 | Timing-dependent visual behavior | Hard reload in dark mode, observe no white flash |
| Mobile layout at 375px | LAYO-05 | Responsive layout requires visual viewport check | Open devtools, resize to 375px, verify usability |
| Brutalist aesthetic | LAYO-06 | Subjective design assessment | Visual check against brutalist design principles |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
