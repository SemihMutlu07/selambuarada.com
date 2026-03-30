# Phase 1: Foundation and Layout - Research

**Researched:** 2026-03-31
**Domain:** Astro 5, Tailwind CSS v4, MDX, Content Collections, Dark Mode, Brutalist Design
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Site scaffolded with Astro 5, TypeScript strict mode, Tailwind CSS v4 via `@tailwindcss/vite` | Verified: exact install and config commands confirmed via official Tailwind docs |
| FOUND-02 | MDX support via `@astrojs/mdx` integration | Verified: `npx astro add mdx` confirmed via official Astro docs |
| FOUND-03 | GSAP installed as dependency (not configured) | Verified: `npm install gsap` — pure install, no Astro-specific setup needed |
| FOUND-04 | Geist font loaded via @fontsource, self-hosted | Verified: `@fontsource-variable/geist` is the recommended variable-font package |
| FOUND-05 | Content collections defined in `src/content.config.ts` with typed Zod schemas for blog, projects, films, and photosets | Verified: Astro 5 Content Layer API uses `src/content.config.ts` at root with `glob()` from `astro/loaders` |
| LAYO-01 | Base layout with persistent header navigation linking all top-level pages | Pattern confirmed: `BaseLayout.astro` with `<slot />` and a `Header.astro` component |
| LAYO-02 | Minimal footer with email link | Standard pattern — Astro component, no library needed |
| LAYO-03 | Dark mode toggle in header using class strategy, persisted to localStorage | Verified: Tailwind v4 `@custom-variant dark` + `localStorage` + `classList.toggle` on `<html>` |
| LAYO-04 | Inline script in `<head>` prevents dark mode flash on page load | Verified: `<script is:inline>` pattern with `classList.toggle` before styles render |
| LAYO-05 | Responsive layout — all pages usable on mobile viewports (375px) | Standard Tailwind responsive utilities — no special library needed |
| LAYO-06 | Brutalist visual aesthetic — raw, expressive typography, unconventional layouts | Research captured: oversized type, high contrast, limited palette, thick borders/dividers |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire technical foundation the rest of the site builds on. The two highest-risk areas are (1) Astro 5's Content Layer API, which is a breaking change from Astro 4 and requires `src/content.config.ts` at project root (not inside `src/content/`), `glob()` from `astro/loaders`, and `render()` from `astro:content` — not `entry.render()`; and (2) Tailwind v4's CSS-first approach, which eliminates `tailwind.config.js` entirely and requires all theme tokens and the dark mode variant to be declared in a CSS file using `@theme {}` and `@custom-variant dark`.

The dark mode FOUC problem is well-understood in the Astro community and has a one-liner fix: a `<script is:inline>` in `<head>` that applies or removes the `dark` class on `<html>` before the page paints. Without the `is:inline` directive, Astro will bundle and defer the script, causing the flash. The Tailwind v4 dark mode variant must also be declared explicitly — it does not work with just `class="dark"` on the html element by default.

Content collections in Astro 5 use entry IDs derived from the file path slug, not a `slug` field. Any `getStaticPaths()` calls must use `post.id`, not `post.slug`. All four collections (blog, projects, films, photosets) should be defined upfront in `src/content.config.ts` so the build-time type generation is complete before Phase 2 work begins.

**Primary recommendation:** Scaffold with `npm create astro@latest` using the minimal template and strict TypeScript, then add integrations via `npx astro add mdx`, then manually add `@tailwindcss/vite`, configure dark mode in CSS, and wire up content schemas — in that order.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.x | Static site framework | Required by project spec |
| @tailwindcss/vite | 4.x | Tailwind CSS v4 via Vite plugin | Required by project spec — replaces `@astrojs/tailwind` |
| tailwindcss | 4.x | Utility-first CSS | Required by project spec |
| @astrojs/mdx | latest | MDX integration for Astro | Required by project spec |
| typescript | bundled | Type safety | Required: strict mode |
| gsap | 3.x | Animation library | Install-only in this phase |
| @fontsource-variable/geist | latest | Self-hosted Geist variable font | Required by project spec |
| zod | bundled via `astro/zod` | Schema validation for collections | Built into Astro — do NOT install separately |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro/loaders | built-in | `glob()` and `file()` loaders for content | Always — for content.config.ts |
| astro:content | built-in | `getCollection`, `render`, `defineCollection` | Always — for querying and rendering collections |
| astro:zod | built-in | Zod re-export from Astro | Always — import `z` from `astro/zod`, not bare `zod` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource-variable/geist` | `@fontsource/geist` | Static-weight version requires separate imports per weight; variable version covers 100-900 with one import |
| `@tailwindcss/vite` | `@astrojs/tailwind` | `@astrojs/tailwind` is the old v3 Astro integration; v4 requires the Vite plugin approach |

**Installation:**
```bash
# 1. Scaffold
npm create astro@latest -- --template minimal --typescript strict

# 2. Add MDX
npx astro add mdx

# 3. Tailwind v4
npm install tailwindcss @tailwindcss/vite

# 4. Font + GSAP
npm install @fontsource-variable/geist gsap
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── content.config.ts        # Content Layer API config (ROOT of src, not inside src/content/)
├── content/
│   ├── blog/                # .mdx files
│   ├── projects/            # .json files
│   ├── films/               # .json or .mdx files
│   └── photosets/           # .json files
├── layouts/
│   └── BaseLayout.astro     # Full page shell (html, head, body, slot)
├── components/
│   ├── Header.astro         # Nav links + dark mode toggle
│   └── Footer.astro         # Minimal footer with email
├── styles/
│   └── global.css           # @import "tailwindcss" + @theme + @custom-variant dark
└── pages/
    ├── index.astro
    ├── blog/
    ├── projects/
    ├── films/
    ├── photos/
    └── about.astro
```

### Pattern 1: Astro 5 Content Layer Config
**What:** All four content schemas defined in a single `src/content.config.ts` file using `defineCollection`, `glob()` loader, and Zod schemas.
**When to use:** Always — this replaces the old `src/content/config.ts` location.
**Example:**
```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: file('./src/content/projects.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

const films = defineCollection({
  loader: file('./src/content/films.json'),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    role: z.string(),
    embedUrl: z.string().url(),
    description: z.string(),
    credits: z.array(z.object({
      role: z.string(),
      name: z.string(),
    })),
  }),
});

const photosets = defineCollection({
  loader: file('./src/content/photosets.json'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })),
  }),
});

export const collections = { blog, projects, films, photosets };
```

### Pattern 2: Tailwind v4 CSS Config with Dark Mode
**What:** All Tailwind configuration lives in `global.css`. No `tailwind.config.js`.
**When to use:** Always with Tailwind v4.
**Example:**
```css
/* src/styles/global.css */
/* Source: https://tailwindcss.com/docs/dark-mode */
@import "tailwindcss";

/* Override dark variant to use class strategy instead of prefers-color-scheme */
@custom-variant dark (&:where(.dark, .dark *));

/* Theme tokens — replaces tailwind.config.js theme.extend */
@theme inline {
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}
```

### Pattern 3: Dark Mode Flash Prevention (FOUC)
**What:** Inline script in `<head>` sets or removes `dark` class on `<html>` before the browser paints.
**When to use:** Always when using class-based dark mode with localStorage persistence.
**Example:**
```astro
<!-- src/layouts/BaseLayout.astro -->
<!-- Source: https://www.danielnewton.dev/blog/dark-mode-astro-tailwind-fouc/ -->
<head>
  <script is:inline>
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  </script>
</head>
```

### Pattern 4: BaseLayout with Props
**What:** Layout component accepts `title` and `description` props for per-page head metadata.
**When to use:** All pages.
**Example:**
```astro
---
// src/layouts/BaseLayout.astro
// Source: https://docs.astro.build/en/basics/layouts/
interface Props {
  title: string;
  description?: string;
}
const { title, description = '' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <script is:inline>
      document.documentElement.classList.toggle(
        "dark",
        localStorage.theme === "dark" ||
          (!("theme" in localStorage) &&
            window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    </script>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

### Pattern 5: Dark Mode Toggle Button
**What:** Client-side `<script>` in Header that toggles `dark` class and persists to localStorage.
**When to use:** The dark mode toggle button in the header.
**Example:**
```astro
<!-- In Header.astro -->
<button id="theme-toggle" aria-label="Toggle dark mode">
  <!-- sun/moon icon -->
</button>

<script>
  const toggle = document.getElementById('theme-toggle');
  toggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
  });
</script>
```

### Pattern 6: Geist Variable Font Loading
**What:** Import font CSS in the layout's head; declare `font-family` in Tailwind `@theme`.
**When to use:** In the main CSS file or layout component.
**Example:**
```astro
---
// BaseLayout.astro
import '@fontsource-variable/geist/wght.css';
---
```
Then in `global.css`:
```css
@theme inline {
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}
```

### Anti-Patterns to Avoid
- **Old config file location:** Do NOT put content config in `src/content/config.ts`. In Astro 5 it must be `src/content.config.ts` (at `src/` root).
- **entry.render():** Do NOT call `await entry.render()`. In Astro 5, import `render` from `astro:content` and call `await render(entry)`.
- **entry.slug:** Do NOT use `entry.slug` for URL params. In Astro 5, use `entry.id` (which is already slugified from the filename).
- **tailwind.config.js:** Do NOT create a `tailwind.config.js` for Tailwind v4. All configuration belongs in the CSS file.
- **@astrojs/tailwind:** Do NOT install the old `@astrojs/tailwind` integration. Use `@tailwindcss/vite` directly as a Vite plugin.
- **Unbundled dark mode script:** Do NOT use a regular `<script>` without `is:inline` for the FOUC prevention script. Astro defers bundled scripts, causing the flash.
- **import z from 'zod':** Do NOT install or import from bare `zod`. Use `import { z } from 'astro/zod'`.
- **@variant dark instead of @custom-variant:** The directive is `@custom-variant dark`, not `@variant dark`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content schema validation | Custom frontmatter validators | `z` from `astro/zod` + Zod schemas in `content.config.ts` | Build-time type checking, IntelliSense, runtime error messages |
| Font loading | Manual `@font-face` declarations | `@fontsource-variable/geist` | Handles all weights, subsetting, and `font-display` correctly |
| MDX rendering | Custom markdown parser | `@astrojs/mdx` integration | Handles remark/rehype pipeline, component injection |
| Dark mode persistence | Custom cookie/storage logic | `localStorage` + `classList.toggle` | Two-line standard pattern, well-tested in Astro community |
| FOUC prevention | Complex theme detection | `<script is:inline>` one-liner | The exact pattern the Astro community converged on |

**Key insight:** Astro 5 + Tailwind v4 have already made the hard decisions. Resist the urge to add abstraction layers on top of what are already minimal, well-designed primitives.

---

## Common Pitfalls

### Pitfall 1: Wrong Content Config File Location
**What goes wrong:** Build fails with "cannot find content config" or content collections show 0 entries.
**Why it happens:** Astro 5 moved the config from `src/content/config.ts` to `src/content.config.ts`.
**How to avoid:** Always create the file at `src/content.config.ts` — one level up from the old location.
**Warning signs:** Empty collection results at build time, no TypeScript types generated for entries.

### Pitfall 2: entry.slug in getStaticPaths
**What goes wrong:** Runtime error or 404 pages when navigating to dynamic routes.
**Why it happens:** `entry.slug` was removed in Astro 5. The `id` property is the slugified file path.
**How to avoid:** Use `params: { slug: post.id }` in `getStaticPaths()`.
**Warning signs:** TypeScript error "Property 'slug' does not exist on type CollectionEntry".

### Pitfall 3: entry.render() method call
**What goes wrong:** TypeError at build time — render is not a function.
**Why it happens:** Astro 5 entries are plain objects. The `render()` method was removed.
**How to avoid:** `import { render } from 'astro:content'` then `const { Content } = await render(entry)`.
**Warning signs:** TypeScript error "Property 'render' does not exist on type CollectionEntry".

### Pitfall 4: Dark mode flash (FOUC)
**What goes wrong:** Page loads in light mode briefly before switching to dark, visible on every navigation.
**Why it happens:** The `<script>` without `is:inline` is bundled and deferred — it runs after the DOM paints.
**How to avoid:** Use `<script is:inline>` in `<head>` for the theme application script.
**Warning signs:** Visible white flash on dark mode pages, especially on hard reload.

### Pitfall 5: `dark:` utilities not working
**What goes wrong:** `dark:bg-black` has no effect even when `.dark` is on `<html>`.
**Why it happens:** Tailwind v4 defaults to `prefers-color-scheme`. Class strategy must be explicitly declared.
**How to avoid:** Add `@custom-variant dark (&:where(.dark, .dark *));` to `global.css`.
**Warning signs:** All `dark:` variants are silently ignored; no errors thrown.

### Pitfall 6: astro/loaders import path confusion
**What goes wrong:** `Module not found` or TypeScript error on `glob` import.
**Why it happens:** The virtual module is `astro/loaders` (package subpath), not `astro:loaders`.
**How to avoid:** `import { glob, file } from 'astro/loaders'` — no colon.
**Warning signs:** Build-time module resolution error.

### Pitfall 7: Tailwind v4 and missing `@theme inline` for fontsource variable fonts
**What goes wrong:** `font-sans` utility doesn't apply the Geist font.
**Why it happens:** When `--font-sans` references a CSS variable (like one set by fontsource), Tailwind needs the `inline` flag to resolve the value correctly.
**How to avoid:** Use `@theme inline { --font-sans: 'Geist Variable', ...; }` when the value is a literal font name.
**Warning signs:** Body text renders in system default sans-serif despite the Tailwind class being applied.

### Pitfall 8: MDX requires explicit charset in layout
**What goes wrong:** Character encoding issues or lint warnings for MDX-rendered pages.
**Why it happens:** Astro no longer auto-injects `<meta charset="utf-8">` for MDX pages.
**How to avoid:** Explicitly include `<meta charset="utf-8" />` in the `<head>` of `BaseLayout.astro`.
**Warning signs:** Missing charset meta in page source for MDX-based routes.

---

## Code Examples

Verified patterns from official sources:

### astro.config.mjs with Tailwind v4 and MDX
```javascript
// Source: https://tailwindcss.com/docs/installation/framework-guides/astro
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### global.css
```css
/* Source: https://tailwindcss.com/docs/dark-mode */
@import "tailwindcss";

/* Class-based dark mode — required for localStorage toggle */
@custom-variant dark (&:where(.dark, .dark *));

/* Font token — use @theme inline when value is a literal (not a CSS var reference) */
@theme inline {
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
}
```

### Geist font import (in BaseLayout.astro or global.css)
```astro
---
// Source: https://fontsource.org/fonts/geist/install
import '@fontsource-variable/geist/wght.css';
---
```

### getCollection usage in Astro 5
```astro
---
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection, render } from 'astro:content';

const posts = await getCollection('blog');
// Sort by date descending
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
```

### Dynamic route with Astro 5 Content Layer
```astro
---
// src/pages/blog/[slug].astro
// Source: https://docs.astro.build/en/guides/upgrade-to/v5/
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },  // NOT post.slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);  // NOT post.render()
---
<Content />
```

### tsconfig.json for strict mode
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | File location change — old path silently does nothing |
| `entry.render()` | `import { render } from 'astro:content'` | Astro 5.0 | Method removed — must use module-level function |
| `entry.slug` | `entry.id` | Astro 5.0 | Slug field gone — id is already URL-safe |
| `tailwind.config.js` | `@theme {}` in CSS | Tailwind v4 | No JS config file at all |
| `darkMode: 'class'` in config | `@custom-variant dark` in CSS | Tailwind v4 | Must declare explicitly in CSS |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` Vite plugin | Tailwind v4 era | Different integration mechanism |
| `import { z } from 'zod'` (own install) | `import { z } from 'astro/zod'` | Astro 2+ | Zod bundled with Astro |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Tailwind v3 Astro integration. Do not use with Tailwind v4.
- `entry.render()`: Removed in Astro 5. Use module-level `render()`.
- `entry.slug`: Removed in Astro 5 Content Layer. Use `entry.id`.
- `type: 'content'` / `type: 'data'` in `defineCollection`: Removed in Astro 5 — replaced by `loader` property.

---

## Open Questions

1. **`entry.id` format for nested directories**
   - What we know: `id` is the slugified file path. For `src/content/blog/my-post.mdx`, id is `my-post`.
   - What's unclear: For nested paths like `src/content/blog/2024/my-post.mdx`, the id would be `2024/my-post` — does this create URL issues?
   - Recommendation: Keep blog posts flat in `src/content/blog/*.mdx` to avoid nested path IDs causing routing issues. Verify on first `getStaticPaths` run.

2. **Fontsource import location: layout frontmatter vs CSS file**
   - What we know: Both `import '@fontsource-variable/geist/wght.css'` in a layout and `@import '@fontsource-variable/geist/wght.css'` from a CSS file work.
   - What's unclear: Which approach works more reliably with Tailwind v4's `@theme` block?
   - Recommendation: Import in the layout's `<script>` frontmatter — keeps font loading collocated with layout.

3. **GSAP version compatibility with Astro 5**
   - What we know: GSAP is framework-agnostic; install only is needed in Phase 1.
   - What's unclear: GSAP 3.x vs GSAP Business License nuances do not affect the install step.
   - Recommendation: `npm install gsap` — no further action needed in Phase 1.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Astro 5 static builds are validated by build output |
| Config file | None — Wave 0 must decide on framework if unit tests are needed |
| Quick run command | `npm run build` (validates TypeScript, Zod schemas, all routes) |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Build completes, TypeScript no errors | build smoke | `npm run build` | ❌ Wave 0 |
| FOUND-02 | MDX files render without errors | build smoke | `npm run build` | ❌ Wave 0 |
| FOUND-03 | GSAP in node_modules | manual | `ls node_modules/gsap` | ❌ Wave 0 |
| FOUND-04 | Geist font loads in browser | manual/visual | dev server inspection | ❌ Wave 0 |
| FOUND-05 | Zod schema errors caught at build | build smoke | `npm run build` | ❌ Wave 0 |
| LAYO-01 | Header nav renders on all pages | build smoke | `npm run build` | ❌ Wave 0 |
| LAYO-02 | Footer renders on all pages | build smoke | `npm run build` | ❌ Wave 0 |
| LAYO-03 | Dark mode toggle works, localStorage updated | manual | browser devtools | ❌ Wave 0 |
| LAYO-04 | No flash on hard reload in dark mode | manual/visual | browser hard reload | ❌ Wave 0 |
| LAYO-05 | Layout usable at 375px viewport | manual/visual | browser devtools resize | ❌ Wave 0 |
| LAYO-06 | Brutalist aesthetic visible | manual/visual | browser visual check | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` — catches TypeScript errors, broken schemas, missing routes
- **Per wave merge:** `npm run build` passes clean
- **Phase gate:** Full build passes AND manual visual check of dark mode + mobile layout before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `package.json` scripts: verify `build`, `dev`, `preview` commands exist after scaffold
- [ ] Framework install: no automated test runner needed — Astro's own type checking and build serve as the test harness for this phase
- [ ] Confirm `astro check` is available: `npx astro check` provides TypeScript type checking beyond `tsc`

---

## Sources

### Primary (HIGH confidence)
- `https://docs.astro.build/en/guides/content-collections/` — Content Layer API, glob loader, file location
- `https://docs.astro.build/en/reference/modules/astro-content/` — entry.id vs entry.slug, render() signature
- `https://docs.astro.build/en/guides/upgrade-to/v5/` — Breaking changes from Astro 4 to 5
- `https://tailwindcss.com/docs/installation/framework-guides/astro` — Tailwind v4 + Astro exact setup
- `https://tailwindcss.com/docs/dark-mode` — @custom-variant dark class strategy
- `https://tailwindcss.com/docs/theme` — @theme block syntax, @theme inline, namespace overrides
- `https://fontsource.org/fonts/geist/install` — @fontsource-variable/geist install and import

### Secondary (MEDIUM confidence)
- `https://www.danielnewton.dev/blog/dark-mode-astro-tailwind-fouc/` — FOUC prevention script, is:inline pattern (verified against official Astro docs behavior)
- `https://docs.astro.build/en/basics/layouts/` — Layout slots, prop passing pattern

### Tertiary (LOW confidence)
- Community WebSearch results on brutalist design conventions — patterns consistent across multiple sources but no single authoritative spec

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions and install commands verified via official docs
- Architecture: HIGH — content.config.ts structure, render() usage, dark mode pattern all verified from official sources
- Pitfalls: HIGH — pitfalls 1-7 confirmed directly from official migration guide and official docs; pitfall 8 from official layout docs
- Brutalist aesthetic guidance: MEDIUM — consistent across multiple sources but inherently subjective

**Research date:** 2026-03-31
**Valid until:** 2026-06-30 (Astro and Tailwind both have active release cycles; re-verify if either releases a major version)
