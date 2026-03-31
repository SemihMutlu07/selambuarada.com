# Requirements: Personal Site

**Defined:** 2026-03-31
**Core Value:** A single cohesive home that presents all facets of the creator's work — code, films, photos, writing — without privileging one over another.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: Site scaffolded with Astro 5, TypeScript strict mode, Tailwind CSS v4 via `@tailwindcss/vite`
- [x] **FOUND-02**: MDX support via `@astrojs/mdx` integration
- [x] **FOUND-03**: GSAP installed as dependency (not configured)
- [x] **FOUND-04**: Geist font loaded via @fontsource, self-hosted
- [x] **FOUND-05**: Content collections defined in `src/content.config.ts` with typed Zod schemas for blog, projects, films, and photosets

### Layout

- [x] **LAYO-01**: Base layout with persistent header navigation linking all top-level pages (Home, Blog, Projects, Films, Photos, About)
- [x] **LAYO-02**: Minimal footer with email link
- [x] **LAYO-03**: Dark mode toggle in header using class strategy, persisted to localStorage
- [x] **LAYO-04**: Inline script in `<head>` prevents dark mode flash on page load
- [x] **LAYO-05**: Responsive layout — all pages usable on mobile viewports
- [x] **LAYO-06**: Brutalist visual aesthetic — raw, expressive typography and unconventional layouts

### Blog

- [ ] **BLOG-01**: Blog index page at `/blog` listing all posts sorted by date
- [ ] **BLOG-02**: Individual blog post pages at `/blog/[slug]` rendering MDX content
- [ ] **BLOG-03**: Blog post frontmatter: title, date, description, tags, slug
- [ ] **BLOG-04**: Tag index page listing all tags with post counts
- [ ] **BLOG-05**: Tag filter page showing posts for a specific tag
- [ ] **BLOG-06**: Static OG image per blog post via meta tags

### Projects

- [ ] **PROJ-01**: Projects index page at `/projects` displaying project cards
- [ ] **PROJ-02**: Project cards show title, tech stack, brief description, and external links
- [ ] **PROJ-03**: Projects content collection with typed schema

### Films

- [x] **FILM-01**: Films index page at `/films` listing all film entries
- [x] **FILM-02**: Individual film case study pages with embedded video (YouTube/Vimeo)
- [x] **FILM-03**: Film case study includes written description/writeup
- [x] **FILM-04**: Film case study includes credits section (structured data from frontmatter)
- [x] **FILM-05**: Film case study includes behind-the-scenes section
- [x] **FILM-06**: Films content collection with typed schema (title, year, role, embed URL, credits array, description)

### Photos

- [ ] **PHOT-01**: Single photo gallery page at `/photos` with all curated sets
- [ ] **PHOT-02**: Each photo set is an expandable section with title and description
- [ ] **PHOT-03**: Images optimized via Astro `<Image>` component (src/assets, not public)
- [ ] **PHOT-04**: Photo sets content collection (JSON) with typed schema

### Pages

- [ ] **PAGE-01**: Home page at `/` with hero section and short intro
- [ ] **PAGE-02**: About page at `/about` with bio and personal info

### SEO

- [ ] **SEO-01**: `@astrojs/sitemap` integration generating sitemap.xml
- [ ] **SEO-02**: Meta tags (title, description, OG image) on every page
- [ ] **SEO-03**: `site` property configured in `astro.config.mjs`

## v2 Requirements

### Animations

- **ANIM-01**: GSAP scroll reveal animations on page sections
- **ANIM-02**: Page transition animations between routes
- **ANIM-03**: Hover effects on interactive elements

### Photos

- **PHOT-05**: Lightbox for individual photo viewing
- **PHOT-06**: Lazy loading with blur-up placeholders for photo sets

### Blog

- **BLOG-07**: Dynamic OG image generation via Satori
- **BLOG-08**: Reading time estimation on posts
- **BLOG-09**: Table of contents for long posts

### Projects

- **PROJ-04**: Individual project detail pages with full writeup

## Out of Scope

| Feature | Reason |
|---------|--------|
| CMS or database | Content lives in files — MDX and JSON collections |
| Contact form | Spam magnet, adds backend complexity — use mailto link |
| Comments on blog | Moderation burden, zero community at launch |
| Search functionality | Low ROI at personal-site scale; tags handle discovery |
| Analytics / tracking | Out of scope per project vision |
| Skill bars / ratings | Universally mocked; list tech in actual projects instead |
| Loading screens | Adds friction; content-first approach |
| Sample/placeholder content | Ship with empty collections |
| Mobile app / PWA | Static web site only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete (01-01) |
| FOUND-02 | Phase 1 | Complete (01-01) |
| FOUND-03 | Phase 1 | Complete (01-01) |
| FOUND-04 | Phase 1 | Complete (01-01) |
| FOUND-05 | Phase 1 | Complete (01-01) |
| LAYO-01 | Phase 1 | Complete (01-02) |
| LAYO-02 | Phase 1 | Complete (01-02) |
| LAYO-03 | Phase 1 | Complete (01-02) |
| LAYO-04 | Phase 1 | Complete (01-02) |
| LAYO-05 | Phase 1 | Complete (01-02) |
| LAYO-06 | Phase 1 | Complete (01-02) |
| BLOG-01 | Phase 2 | Pending |
| BLOG-02 | Phase 2 | Pending |
| BLOG-03 | Phase 2 | Pending |
| BLOG-04 | Phase 2 | Pending |
| BLOG-05 | Phase 2 | Pending |
| BLOG-06 | Phase 2 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| FILM-01 | Phase 2 | Complete |
| FILM-02 | Phase 2 | Complete |
| FILM-03 | Phase 2 | Complete |
| FILM-04 | Phase 2 | Complete |
| FILM-05 | Phase 2 | Complete |
| FILM-06 | Phase 2 | Complete |
| PHOT-01 | Phase 2 | Pending |
| PHOT-02 | Phase 2 | Pending |
| PHOT-03 | Phase 2 | Pending |
| PHOT-04 | Phase 2 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| SEO-01 | Phase 3 | Pending |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after plan 01-02 completion*
