# Project Research Summary

**Project:** Personal Site / Creative Portfolio
**Domain:** Static personal brand site — multidisciplinary creator (developer, filmmaker, photographer)
**Researched:** 2026-03-31
**Confidence:** MEDIUM

## Executive Summary

This is a pure static content site for a multidisciplinary creator who needs equal first-class treatment of three disciplines: software development (projects), filmmaking (case studies), and photography (curated gallery). The canonical approach in 2025 is Astro 5 with file-based content collections — it ships zero JS by default, has purpose-built MDX and image optimization pipelines, and requires no database or server runtime. The site's brutalist aesthetic is a strong differentiator but the highest-complexity design decision: every layout must be a deliberate conviction, not neglect. Nothing off-the-shelf will match it.

The recommended stack is Astro 5 + Tailwind v4 + MDX + self-hosted Geist font. The two biggest traps are Tailwind v4's ground-up configuration change (no `tailwind.config.js` — config lives in CSS) and Astro 5's Content Layer API change (new file location, new `render()` import, new `glob()` loader pattern). Both traps are foundational: hit them in Phase 1 and everything downstream works; miss them and the project accumulates compounding errors. The research is unambiguous that both must be locked down before any component or content work begins.

The key risk beyond the technology traps is feature creep from the multi-discipline scope. Research identifies a clear MVP boundary: base layout, about page, blog (MDX + tags), projects (cards), films (case study pages with embed + credits), photos (expandable sets), and SEO. Everything else — GSAP animations, image lightboxes, per-film BTS photo galleries, individual project detail pages — is explicitly deferred. The site can be a compelling professional artifact without any of those additions.

## Key Findings

### Recommended Stack

Astro 5 is the clear choice: it is purpose-built for content-heavy static sites, ships zero JS by default, has native MDX support and Zod-typed content collections, and built-in image optimization via Sharp. Next.js would add server runtime overhead and React JS weight with no benefit for a no-database, no-auth use case. Tailwind v4 is pre-approved and correct — it is now a CSS-native configuration system (no config file), faster than v3, and the forward-looking choice. GSAP is pre-approved for future animation work and should be installed in Phase 1 but not implemented until a dedicated animation phase.

**Core technologies:**
- Astro 5: SSG framework with Content Collections — purpose-built for content sites, zero JS default
- Tailwind v4 via `@tailwindcss/vite`: utility styling — CSS-native config, no `tailwind.config.js`
- `@astrojs/mdx`: MDX processing — required for blog posts and film case studies that embed components
- `@astrojs/sitemap`: auto-generated sitemap — zero-config, official integration
- `@fontsource/geist` + `@fontsource/geist-mono`: self-hosted fonts — no external network requests
- GSAP 3.x: animation library (install only in v1) — pre-approved, framework-agnostic
- Astro `<Image>` component (built-in): image optimization — WebP/AVIF, lazy loading, no extra install
- Shiki (built-in): syntax highlighting — zero config, 100+ languages, better than Prism

### Expected Features

Research confirms the PROJECT.md scope is well-calibrated. The only additions from feature research: explicit static OG images per page (medium complexity, high value for social sharing), and a tag index page for blog navigation (low complexity).

**Must have (table stakes):**
- About page — first thing any visitor needs
- Navigation header with dark mode toggle
- Blog with MDX posts, index, individual pages, and tag filtering
- Projects index with cards linking to external repos/live sites
- Responsive layout (brutalist does not excuse broken on mobile)
- Fast load / good Core Web Vitals (Astro delivers this by default if images are handled correctly)
- Meta tags and static OG images per page
- Sitemap

**Should have (differentiators):**
- Film case studies — full pages with video embed, written case study, credits, BTS content
- Curated photo gallery with expandable sets (photography as first-class work, not decoration)
- Brutalist aesthetic executed with conviction throughout
- Tag-based blog navigation (tag index page, not just filtering)
- Equal navigation weight across all disciplines

**Defer (v2+):**
- GSAP animation implementation (install in v1, implement later)
- Individual project detail pages (cards with external links are sufficient)
- Image lightbox on photo sets
- Dynamic OG image generation (Satori) — static templates are sufficient

**Confirmed anti-features (do not build):**
- Contact form, blog comments, search, CMS UI, analytics, pagination on photos, skill bars, splash screens

### Architecture Approach

The architecture is three layers: a Content Layer (MDX/JSON in `src/content/` with Zod-typed schemas in `src/content.config.ts`), a Page Layer (`.astro` files in `src/pages/` that query collections and render), and a Component Layer (reusable `.astro` components in `src/components/`). The non-negotiable rule is that pages query collections and pass typed props to components — components never call `getCollection()` directly. All four content collections (blog, films, projects, photosets) must be defined in `src/content.config.ts` with Zod schemas before any content files are created.

**Major components:**
1. `BaseLayout.astro` — HTML shell, head, nav, footer; renders dark mode anti-flash inline script
2. `BlogPostLayout.astro` / `FilmLayout.astro` — section-specific layouts extending BaseLayout via slots
3. `ThemeToggle.astro` — dark mode class toggle with localStorage persistence (client:load island)
4. `VideoEmbed.astro` / `Credits.astro` / `BehindTheScenes.astro` — film case study components
5. `PhotoSet.astro` / `PhotoGrid.astro` — expandable gallery sections using `<details>/<summary>`
6. `PostCard.astro`, `FilmCard.astro`, `ProjectCard.astro` — listing page card components

### Critical Pitfalls

1. **Astro 5 Content Layer API break from v4** — Use `src/content.config.ts` (root level), use `glob()` loader, import `render` from `astro:content` (not `entry.render()`). Most tutorials online use v4 patterns. Address in Phase 1 before any content schema work.

2. **Tailwind v4 configuration is CSS-native** — No `tailwind.config.js`. All theme tokens go in CSS via `@theme {}`. Dark mode class strategy requires `@variant dark (&:where(.dark, .dark *));` explicitly in CSS — without this, `dark:` utilities respond to OS preference only, not the toggle. Address in Phase 1.

3. **Dark mode flash on page load** — Astro's MPA model means every navigation is a fresh page load. The `.dark` class on `<html>` must be applied by an inline blocking `<script is:inline>` in `<head>` that reads localStorage before CSS renders. Deferring or module-typing this script causes visible flash. Address in base layout (Phase 2).

4. **Images in `public/` bypass all optimization** — For a photography portfolio this is catastrophic: full-resolution files served to every visitor, no WebP, no srcset, layout shift. Gallery images must go in `src/assets/` and use the `<Image>` component. Establish this directory convention in Phase 1 before any images are added.

5. **MDX components are not auto-imported** — Unlike Next.js MDX, Astro requires explicit component passing: `<Content components={{ Callout, VideoEmbed }} />` from the page template. Missing this causes build errors or silent non-rendering. Define the component-passing pattern once in Phase 3 (blog) before writing any posts.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Every other phase depends on the HTML shell, Tailwind configuration, and content collection schemas existing first. The two highest-risk pitfalls (Tailwind v4 config, Astro 5 Content Layer API) must be resolved here before any page or component work begins. Getting this wrong creates compounding debt.
**Delivers:** Working Astro 5 + Tailwind v4 + MDX setup; `src/content.config.ts` with all four collection schemas (blog, films, projects, photosets); TypeScript strict mode configured; font loading with `font-display: swap`; GSAP installed (no implementation); dark mode CSS variant configured.
**Addresses:** Navigation header (stub), BaseLayout shell, global styles
**Avoids:** Pitfalls 1 (Content Layer API), 2 (Tailwind v4 config), 4 (image directory convention), 9 (dark mode variant), 10 (font FOIT), 13 (TypeScript strict)

### Phase 2: Base Layout and Dark Mode
**Rationale:** BaseLayout must be solid before any page renders against it. Dark mode is cross-cutting — it affects every component's color decisions. Getting the anti-flash pattern right here prevents rework across every subsequent phase.
**Delivers:** `BaseLayout.astro` with complete head/nav/footer; `ThemeToggle.astro` with localStorage persistence; inline anti-flash script in `<head>`; responsive navigation with equal discipline links.
**Addresses:** Dark mode toggle, navigation header, footer, responsive layout
**Avoids:** Pitfall 3 (dark mode flash), Anti-Pattern 4 (monolithic layout)

### Phase 3: Blog
**Rationale:** Blog is the most complex dynamic route (MDX, tag system, dynamic slugs). Tackle it while the codebase is smallest so any architectural mistakes surface early and cheaply. Establishes the MDX component-passing pattern used by the films section.
**Delivers:** `blog/index.astro`, `blog/[slug].astro`, `BlogPostLayout.astro`, tag index page, `PostCard.astro`, `TagList.astro`; at least one real post to validate the full pipeline.
**Addresses:** Blog index, individual post pages, tag navigation, readable typography
**Avoids:** Pitfall 5 (MDX component passing), Pitfall 11 (empty collection 404), Pitfall 14 (tags schema)

### Phase 4: Films
**Rationale:** Films are the highest-complexity content type (structured frontmatter with credits array, BTS images, video embed, full MDX case study). Building this after Blog means the MDX pattern is established and the Astro collection query pattern is familiar.
**Delivers:** `films/index.astro`, `films/[slug].astro`, `FilmLayout.astro`, `VideoEmbed.astro`, `Credits.astro`, `BehindTheScenes.astro`, `FilmCard.astro`; deployment header configuration for video embed CSP.
**Addresses:** Film case studies, video embeds, credits sections, BTS content
**Avoids:** Pitfall 8 (video embed CSP headers)

### Phase 5: Projects
**Rationale:** Projects is the simplest content section — JSON/MDX entries with cards linking to external URLs. No dynamic MDX rendering complexity, no external embeds. Build after the harder sections to decompress.
**Delivers:** `projects/index.astro`, `ProjectCard.astro`, JSON content collection entries
**Addresses:** Projects listing with tech stack and external links
**Avoids:** Skill bars, "hire me" framing (confirmed anti-features)

### Phase 6: Photos
**Rationale:** Photo gallery has its own image optimization complexity separate from the text content sections. Dedicated phase ensures proper `src/assets/` setup and `<Image>` component usage discipline.
**Delivers:** `photos/index.astro`, `PhotoSet.astro`, `PhotoGrid.astro`; JSON photoset collection; `<details>/<summary>` expand/collapse behavior.
**Addresses:** Curated photo gallery with expandable sets, photography as first-class discipline
**Avoids:** Pitfall 4 (images in public/), Pitfall 7 (layout shift without dimensions)

### Phase 7: About + Home
**Rationale:** Home page (`index.astro`) typically aggregates featured content from other sections — easier to build once those sections and their data structures are finalized. About page is low complexity but benefits from all design decisions being settled.
**Delivers:** `about.astro` with bio, photo, disciplines overview; `index.astro` landing page
**Addresses:** About page, landing/home page

### Phase 8: SEO and Polish
**Rationale:** Sitemap requires all routes stable. OG images require page titles and descriptions finalized. This is the correct final step — adding SEO infrastructure to a complete site.
**Delivers:** `@astrojs/sitemap` configured with production URL; static OG images per section; meta tag audit across all pages; `<Head>` component in BaseLayout finalized.
**Addresses:** Sitemap, OG images, social sharing unfurls
**Avoids:** Pitfall 12 (sitemap only generates for existing pages — acceptable behavior)

### Phase Ordering Rationale

- Foundation first because Tailwind v4 and Astro 5 Content Layer API are foundational decisions that cannot be patched in later without touching every file
- All four content collection schemas defined in Phase 1 even though content sections are built in Phases 3-6 — schema validation runs at build time and must be present for collections to function
- Blog before Films because the MDX component-passing pattern established in Blog is reused in Films; Films before Projects because Films is harder and should be tackled while Blog patterns are fresh
- Photos isolated in its own phase because image pipeline decisions are orthogonal to MDX content
- About and Home deferred until content sections are final because Home aggregates from them
- SEO last because it requires a complete, stable route tree

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Astro 5 Content Layer API exact syntax — `entry.id` vs `entry.slug`, exact `astro/loaders` import path, `image()` schema helper availability. Verify at `docs.astro.build` before implementing schemas.
- **Phase 2:** Tailwind v4 dark mode `@variant` syntax — exact CSS declaration needed. Verify at `tailwindcss.com/docs/upgrade-guide`.
- **Phase 4:** Deployment platform CSP headers for video embeds — depends on chosen host (Netlify vs Vercel vs Cloudflare Pages). Needs platform-specific research.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Blog with MDX + tags is a well-documented Astro pattern with multiple complete examples
- **Phase 5:** Projects cards page is the simplest possible content collection pattern
- **Phase 7:** About page is static HTML with no collection dependency
- **Phase 8:** `@astrojs/sitemap` is an official integration with complete documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Astro 5 and Tailwind v4 are both at the edge of training data (Dec 2024 and Jan 2025 releases). Core patterns are correct; exact API syntax requires doc verification before implementing. |
| Features | MEDIUM | Feature categorizations are solid domain knowledge. Astro 5 / Tailwind v4 implementation specifics for dark mode and MDX flagged as needing verification. |
| Architecture | MEDIUM | Three-layer architecture and component boundary rules are canonical Astro patterns. Astro 5-specific: `entry.id` vs `entry.slug` in Content Layer API is LOW confidence — actively verify. |
| Pitfalls | MEDIUM | The five critical pitfalls are well-grounded in training knowledge of Astro 4->5 migration and Tailwind v3->v4 migration. Community patterns are still maturing for this combination. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **`entry.id` vs `entry.slug` in Content Layer API dynamic routes:** This is a known breaking change from Astro 4 to 5 but the exact behavior with the `glob()` loader was not confirmed. Verify which field to use for URL slugs before writing `getStaticPaths()` in Phase 3.
- **`astro/loaders` import path:** Could be `astro:loaders` (virtual module) or `astro/loaders` (package subpath). Verify at `docs.astro.build` before Phase 1 schema work.
- **Tailwind v4 `@variant dark` exact syntax:** Community examples vary slightly. Read official v4 upgrade guide before Phase 2.
- **Fontsource display=swap import path:** Whether the specific `400.css` file from `@fontsource/geist` includes `font-display: swap` by default varies by package version. Check at `fontsource.org/fonts/geist` before Phase 1 font setup.
- **Photo image storage tradeoff:** `src/assets/` (optimized, slower builds) vs `public/` (unoptimized, faster builds). For a large photo collection, build time with optimization may become a concern. Benchmark during Phase 6.

## Sources

### Primary (HIGH confidence)
- Astro Content Collections API — official Astro docs pattern, stable since v2 — https://docs.astro.build/en/guides/content-collections/
- `@astrojs/mdx` and `@astrojs/sitemap` — official Astro integrations, long-stable — https://docs.astro.build/en/guides/integrations-guide/
- GSAP 3.x + vanilla DOM pattern — framework-agnostic, well-documented — https://gsap.com/docs/v3/
- `<details>/<summary>` for expand/collapse — HTML standard
- Shiki built into Astro — stable since Astro v2

### Secondary (MEDIUM confidence)
- Astro 5 Content Layer API with `glob()` loader — training data (August 2025 cutoff), Astro 5 released December 2024
- Tailwind v4 Vite plugin installation (`@tailwindcss/vite`) — confirmed in v4 docs, verify at https://tailwindcss.com/docs/installation/vite
- Tailwind v4 dark mode `@variant` configuration — community-reported pattern, verify at https://tailwindcss.com/docs/upgrade-guide
- `@fontsource/geist` package and import pattern — verify package name at https://fontsource.org/fonts/geist
- Dark mode `is:inline` anti-flash script — well-established Astro community pattern

### Tertiary (LOW confidence)
- `entry.id` vs `entry.slug` behavior in Astro 5 Content Layer API — flagged from community discussions at training time; verify before implementation
- `image()` schema helper availability and syntax in Astro 5 — needs doc verification
- Exact CSP configuration for video embeds per deployment platform — depends on chosen host

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
