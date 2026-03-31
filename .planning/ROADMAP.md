# Roadmap: Personal Site

## Overview

Three phases take the site from a bare scaffold to a fully deployed personal brand artifact. Phase 1 locks down the technology pitfalls (Tailwind v4 CSS config, Astro 5 Content Layer API, dark mode anti-flash) and the base layout before any page work begins. Phase 2 builds all four content sections — blog, projects, films, photos — as a single delivery of "the site has content." Phase 3 completes the site with the home page, about page, and SEO infrastructure once all routes are stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Layout** - Scaffold, tooling, content schemas, base layout, dark mode
- [ ] **Phase 2: Content Sections** - Blog, Projects, Films, and Photos — all content pages live
- [ ] **Phase 3: Pages and SEO** - Home page, About page, sitemap, and meta tag finalization

## Phase Details

### Phase 1: Foundation and Layout
**Goal**: The site scaffold exists, all technology pitfalls are resolved, and every page has a working base layout with dark mode
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, LAYO-01, LAYO-02, LAYO-03, LAYO-04, LAYO-05, LAYO-06
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes without errors on a freshly cloned repo
  2. Visiting any page shows the header nav with links to all sections and a working dark mode toggle
  3. Toggling dark mode persists across page navigation with no visible flash on load
  4. The site renders correctly and is usable on a 375px mobile viewport
  5. Brutalist typography and raw layout aesthetic is established as the visual baseline
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Astro 5 scaffold, Tailwind v4 + MDX tooling, content collection schemas
- [x] 01-02-PLAN.md — Base layout with header nav, dark mode toggle, footer, brutalist styling, route stubs

### Phase 2: Content Sections
**Goal**: All four disciplines are publicly accessible — blog posts, project cards, film case studies, and photo sets
**Depends on**: Phase 1
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, PROJ-01, PROJ-02, PROJ-03, FILM-01, FILM-02, FILM-03, FILM-04, FILM-05, FILM-06, PHOT-01, PHOT-02, PHOT-03, PHOT-04
**Success Criteria** (what must be TRUE):
  1. Visiting `/blog` shows a list of posts; clicking one renders the full MDX post
  2. Blog tags are navigable — `/blog/tags` lists all tags, clicking a tag shows filtered posts
  3. Visiting `/projects` shows project cards with tech stack, description, and external links
  4. Visiting `/films` lists all films; clicking one loads a full case study with embedded video, written description, credits section, and behind-the-scenes section
  5. Visiting `/photos` shows all curated photo sets as expandable sections with optimized images
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Blog index, post pages, tag system, OG meta infrastructure
- [ ] 02-02-PLAN.md — Projects cards page with seed data
- [ ] 02-03-PLAN.md — Films index, case study pages with video embed, credits, BTS
- [ ] 02-04-PLAN.md — Photos gallery with expandable sets and optimized images

### Phase 3: Pages and SEO
**Goal**: The site is complete and discoverable — home page, about page, sitemap, and meta tags on every page
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, SEO-01, SEO-02, SEO-03
**Success Criteria** (what must be TRUE):
  1. The home page at `/` presents a hero and intro without depending on placeholder content
  2. The about page at `/about` contains bio and personal information
  3. Every page has accurate title, description, and OG image meta tags
  4. `sitemap.xml` is generated at the production URL and includes all routes
**Plans**: TBD

Plans:
- [ ] 03-01: Home page, About page, and SEO finalization

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Layout | 2/2 | Complete | 2026-03-31 |
| 2. Content Sections | 3/4 | In Progress|  |
| 3. Pages and SEO | 0/1 | Not started | - |
