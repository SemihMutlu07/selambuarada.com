# Personal Site

## What This Is

A multidisciplinary personal brand site showcasing development work, film projects, and photography. Built with Astro 5 as a static site with a brutalist aesthetic — raw, expressive layouts with bold typography and unconventional design choices. Equally weights technical and creative work.

## Core Value

A single cohesive home that presents all facets of the creator's work — code, films, photos, writing — without privileging one over another.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Static site with Astro 5, TypeScript, Tailwind CSS v4
- [ ] Blog with MDX content collection, tag support
- [ ] Projects portfolio page
- [ ] Films section with full case study pages (embedded video, writeup, behind-the-scenes, credits)
- [ ] Photo gallery — single page with curated sets in expandable sections
- [ ] About page
- [ ] Brutalist visual design with Geist font
- [ ] Dark mode support (class strategy)
- [ ] GSAP installed for subtle polish animations (scroll reveals, hover effects, page transitions)
- [ ] SEO via @astrojs/sitemap
- [ ] Base layout with header nav and minimal footer

### Out of Scope

- CMS or database — content lives in files
- Sample/placeholder content — ship empty collections
- GSAP configuration or animation implementation beyond install — future work
- Mobile app or PWA
- Analytics or tracking
- Comments system
- Search functionality

## Context

- Owner is multidisciplinary — developer, filmmaker, photographer
- Site identity is personal brand, not just dev portfolio
- Brutalist aesthetic chosen deliberately — raw, expressive, unconventional
- Photos organized as curated sets (by project/series/trip), all on single /photos page with expandable sections
- Films are full case studies, not just embeds — writeup, embedded video, behind-the-scenes, credits
- GSAP is a dependency for future animation work, installed but not configured in v1
- Geist font loaded via @fontsource

## Constraints

- **Stack**: Astro 5, TypeScript, Tailwind CSS v4, MDX — non-negotiable
- **No dependencies without approval**: GSAP, @astrojs/mdx, @astrojs/sitemap, @fontsource/geist pre-approved
- **No CMS**: All content via Astro content collections (MDX, JSON)
- **No filler**: Components must be clean and minimal, no placeholder content

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro 5 over Next.js | Static site, content-focused, no need for server-side rendering | — Pending |
| Brutalist aesthetic | Distinctive personal brand, stands out from typical dev portfolios | — Pending |
| Single-page photo gallery | All curated sets viewable without navigation, expandable sections | — Pending |
| Films as case studies | Full writeups give depth beyond just video embeds | — Pending |
| Geist via fontsource | Self-hosted font, no external requests | — Pending |
| Dark mode via class strategy | Manual toggle, Tailwind dark: variant | — Pending |

---
*Last updated: 2026-03-31 after initialization*
