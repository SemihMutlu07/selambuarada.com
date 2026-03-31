# Phase 3: Pages and SEO - Research

**Researched:** 2026-03-31
**Domain:** Astro static pages, @astrojs/sitemap, OG meta tags, brutalist UI layout
**Confidence:** HIGH

## Summary

Phase 3 has very low implementation risk. The BaseLayout already handles title, description, og:title, og:description, og:image, and twitter:card meta tags — so SEO-02 (meta tags on every page) is structurally complete once every page passes a non-empty description. The two remaining gaps are mechanical: add `@astrojs/sitemap` as an integration and set the `site` URL in astro.config.mjs (SEO-01, SEO-03), then flesh out the stubs at `src/pages/index.astro` and `src/pages/about.astro` (PAGE-01, PAGE-02).

The home page stub has a name and tagline but no hero structure or description prop. The about page stub has only a heading and a placeholder tagline with no description prop passed to BaseLayout. Neither page passes `description` to BaseLayout, which means `<meta name="description">` and `og:description` are not rendered for either — a concrete gap under SEO-02.

The sitemap integration requires one install, one import, one line in `integrations: []`, and the `site` property set to the production URL — four mechanical changes, no architectural decisions. All routes in the project are static and will be auto-discovered.

**Primary recommendation:** This phase is a single plan. Add sitemap + site config, pass description to index and about, then build out the hero and bio sections matching the brutalist design system already established.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | Home page at `/` with hero section and short intro | Stub exists — needs hero markup, description prop, brutalist layout matching existing pages |
| PAGE-02 | About page at `/about` with bio and personal info | Stub exists — needs bio content markup, description prop |
| SEO-01 | `@astrojs/sitemap` integration generating sitemap.xml | One install + config change; requires site property (SEO-03) to be set first |
| SEO-02 | Meta tags (title, description, OG image) on every page | BaseLayout already implements all tags; gap is missing description props on index and about pages |
| SEO-03 | `site` property configured in `astro.config.mjs` | Single `site:` key addition to defineConfig; prerequisite for SEO-01 sitemap generation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @astrojs/sitemap | 3.7.2 | Generates sitemap-index.xml + sitemap-0.xml at build time | Official Astro integration; single config line; auto-discovers all static routes |
| astro | ^6.1.2 (already installed) | Static site generator | Already in project |

### Supporting
No additional libraries are needed. Everything required is already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @astrojs/sitemap | Hand-rolled sitemap endpoint | Sitemap edge cases (lastmod, priority, changefreq, URL encoding) make hand-rolling error-prone — use the integration |

**Installation:**
```bash
npm install @astrojs/sitemap
```

## Architecture Patterns

### Recommended Project Structure
No new directories needed. All changes are in existing files:
```
astro.config.mjs          # add site + sitemap integration
src/pages/index.astro     # flesh out hero + description
src/pages/about.astro     # flesh out bio + description
```

### Pattern 1: Sitemap Integration Setup
**What:** Add `site` property to defineConfig and import + register the sitemap integration.
**When to use:** Required — `@astrojs/sitemap` will throw a build warning and produce no output without `site`.

```javascript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://parkermutsuz.com',  // production URL — planner must confirm actual URL
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

The integration auto-discovers all static routes. No additional configuration is needed for this site — all routes are statically generated.

### Pattern 2: SEO-02 — Passing description to BaseLayout
**What:** Every page must pass a non-empty `description` prop to BaseLayout. The layout only emits `<meta name="description">` and `og:description` conditionally when description is provided.
**When to use:** All pages. Currently missing on `index.astro` and `about.astro`.

```astro
// Source: src/layouts/BaseLayout.astro (existing)
<BaseLayout title="Parker Mutsuz" description="Developer, filmmaker, and photographer.">
```

The `description` prop is `description?: string` in BaseLayout — optional in TypeScript but functionally required for SEO compliance.

### Pattern 3: Brutalist Hero (index.astro)
**What:** Home page hero following established brutalist design system. No placeholder content — requirements explicitly state it must not depend on placeholder content.
**When to use:** PAGE-01.

Reference patterns from existing pages:
- `text-5xl md:text-7xl font-bold tracking-tight` — heading size (used on every page)
- `mt-4 text-lg text-neutral-600 dark:text-neutral-400` — subtitle/lead text
- `text-sm font-bold uppercase tracking-wider` — label/tag style
- `border-2 border-neutral-900 dark:border-neutral-100 p-6` — card/section border
- No `border-radius` (global.css forces `border-radius: 0 !important`)

The home page should link to the four content sections (blog, projects, films, photos) as a navigation grid or list — this fulfills "presents a hero and intro" without needing real content data loaded.

### Pattern 4: About Page
**What:** Static bio page. No content collection — pure Astro markup with bio and personal information.
**When to use:** PAGE-02.

The about page should be a static `.astro` file (not MDX) since it's personal copy, not authoring-time content. All other static index pages in this project follow the same pattern.

### Anti-Patterns to Avoid
- **Calling `getCollection()` on about page:** About page is static personal copy, not collection-driven. Don't introduce a content collection just for the about page bio.
- **Skipping `description` on any page:** The `{description && ...}` guard in BaseLayout is correct defensive coding — but it means forgetting the prop silently omits the description meta tags with no build error.
- **Using `npx astro add sitemap`:** This command attempts to auto-edit `astro.config.mjs` with a code transform. Given this project's clean config file, it's simpler and safer to do the manual install + config edit.
- **Setting `site` without trailing slash:** Astro docs state the site property should NOT have a trailing slash (e.g., `'https://example.com'` not `'https://example.com/'`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| sitemap.xml | Custom `/sitemap.xml.ts` endpoint | @astrojs/sitemap | Handles sitemap index pagination, lastmod, URL encoding, i18n — all edge cases |
| OG meta tags | Duplicate tags across pages | BaseLayout (already exists) | Already implemented in BaseLayout; just pass props |

**Key insight:** The meta tag infrastructure (SEO-02) is already fully implemented in BaseLayout. The only task is auditing that every page passes title and description, then fixing the two stubs that don't.

## Common Pitfalls

### Pitfall 1: site property missing — sitemap generates nothing
**What goes wrong:** `@astrojs/sitemap` requires `site` in `astro.config.mjs`. Without it, the build emits a warning and no sitemap files are written to `dist/`.
**Why it happens:** The integration reads `Astro.site` at build time; if undefined, it has no base URL to construct absolute URLs.
**How to avoid:** Set `site` in `defineConfig` before adding the integration. This is SEO-03, which must be implemented first.
**Warning signs:** Build completes but `dist/sitemap-index.xml` does not exist.

### Pitfall 2: description omitted silently
**What goes wrong:** `<meta name="description">` and `og:description` are missing from the rendered page — but no TypeScript error fires because the prop is optional.
**Why it happens:** BaseLayout uses `{description && ...}` which silently suppresses the tag when prop is absent.
**How to avoid:** Every page call to BaseLayout must include a non-empty description string. Verify in browser DevTools or `npm run build` output.
**Warning signs:** View-source of page HTML lacks `<meta name="description">` tag.

### Pitfall 3: Trailing slash on site URL breaks sitemap
**What goes wrong:** Sitemap URL entries get double-slash (e.g., `https://example.com//blog`).
**Why it happens:** Astro concatenates `site` + route path. If `site` ends in `/`, paths that start with `/` produce `//`.
**How to avoid:** Set `site: 'https://example.com'` without trailing slash (verified in Astro docs).

### Pitfall 4: Home page depends on collection data that may be empty
**What goes wrong:** If home page links to content and tries to call `getCollection()` to show previews, it renders nothing (or errors) when collections are empty.
**Why it happens:** Requirements explicitly forbid placeholder content. Collections may be empty at launch.
**How to avoid:** PAGE-01 requirements state "presents a hero and intro without depending on placeholder content." The home page should be fully static — navigation links to sections, not a preview of collection data.

## Code Examples

### sitemap-index.xml output structure
```
dist/
├── sitemap-index.xml   — root entry point (links to sitemap-0.xml)
└── sitemap-0.xml       — actual URL list for all routes
```

All routes discovered automatically from static pages in `src/pages/`:
- `/` (index)
- `/about`
- `/blog`
- `/blog/[slug]` (one entry per post)
- `/blog/tags`
- `/blog/tags/[tag]` (one entry per tag)
- `/projects`
- `/films`
- `/films/[id]` (one entry per film)
- `/photos`

### Complete astro.config.mjs after Phase 3
```javascript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://parkermutsuz.com',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Verifying sitemap output
```bash
npm run build && ls dist/sitemap*.xml
# Expected: dist/sitemap-index.xml  dist/sitemap-0.xml
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/tailwind` | `@tailwindcss/vite` plugin | Tailwind v4 | Already handled in Phase 1 |
| `entry.slug` | `entry.id` (Content Layer API) | Astro 5 | Already handled in Phase 2 |
| `sitemap()` requires no args | `sitemap()` requires `site` in config | Always true | Must set site property (SEO-03) |

**Deprecated/outdated:**
- `astro add sitemap` auto-edit: Works but adds complexity for a simple 2-line change; manual edit is cleaner.

## Open Questions

1. **Production URL for `site` property**
   - What we know: Must be set to the final deployed URL, format `https://domain.com` without trailing slash
   - What's unclear: The actual domain (`parkermutsuz.com` is assumed from the git user name "Semih Mutlu" — but the actual domain is unknown)
   - Recommendation: Planner should note that the `site` value is a placeholder to be replaced with the real domain. Use `https://parkermutsuz.com` as a reasonable default placeholder.

2. **Home page content depth**
   - What we know: Requirements say "hero section and short intro without depending on placeholder content"
   - What's unclear: Whether the hero should include navigation cards linking to sections or just copy
   - Recommendation: Static navigation grid (links to blog, projects, films, photos with label text) is safe — it works with empty collections and matches the brutalist aesthetic.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files, no test directories, no test scripts in package.json |
| Config file | None — see Wave 0 |
| Quick run command | `npm run build` (build-time validation is the primary correctness signal for Astro static sites) |
| Full suite command | `npm run build && ls dist/sitemap-index.xml dist/sitemap-0.xml` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | `/` renders hero section without placeholder content | smoke | `npm run build` — inspect `dist/index.html` | ❌ Wave 0 |
| PAGE-02 | `/about` renders bio and personal info | smoke | `npm run build` — inspect `dist/about/index.html` | ❌ Wave 0 |
| SEO-01 | `sitemap-index.xml` generated with all routes | smoke | `npm run build && ls dist/sitemap-index.xml` | ❌ Wave 0 |
| SEO-02 | Every page HTML contains `<meta name="description">` | smoke | `npm run build` — grep dist HTML files | ❌ Wave 0 |
| SEO-03 | `astro.config.mjs` has `site` property | manual | inspect source file | ❌ Wave 0 |

Note: Astro static sites have no runtime — correctness is validated at build time. All requirements are verifiable by inspecting `dist/` output after `npm run build`.

### Sampling Rate
- **Per task commit:** `npm run build` (full build is fast for this site; no partial build available)
- **Per wave merge:** `npm run build && ls dist/sitemap-index.xml dist/sitemap-0.xml`
- **Phase gate:** Build green + sitemap files present + meta tags confirmed in dist HTML

### Wave 0 Gaps
- [ ] No test framework in this project — all validation is manual inspection of `dist/` output or `npm run build` success
- [ ] Smoke test script: `build:verify` npm script could be added: `"build:verify": "astro build && ls dist/sitemap-index.xml dist/sitemap-0.xml"` — optional convenience

*(No automated test framework to install — build-time verification is the correct approach for this Astro static site project.)*

## Sources

### Primary (HIGH confidence)
- https://docs.astro.build/en/guides/integrations-guide/sitemap/ — @astrojs/sitemap install, config, site property requirement, output format
- https://docs.astro.build/en/reference/configuration-reference/#site — site property format and purpose
- npm info @astrojs/sitemap — confirmed version 3.7.2
- src/layouts/BaseLayout.astro (read directly) — confirmed existing meta tag implementation
- src/pages/index.astro, src/pages/about.astro (read directly) — confirmed stubs lack description prop

### Secondary (MEDIUM confidence)
- src/pages/blog/index.astro, films/index.astro, projects/index.astro (read directly) — confirmed brutalist design patterns for planner to reference

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @astrojs/sitemap 3.7.2 verified via npm and official docs
- Architecture: HIGH — all existing files read directly; no guesswork
- Pitfalls: HIGH — sourced from official docs and direct code inspection

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable ecosystem — Astro sitemap API is mature)
