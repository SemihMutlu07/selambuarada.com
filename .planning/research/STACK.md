# Technology Stack

**Project:** Personal Site / Creative Portfolio
**Researched:** 2026-03-31
**Confidence note:** WebSearch, WebFetch, and Bash tools were unavailable during this research session. All findings derive from training data (knowledge cutoff ~August 2025). Versions and APIs should be verified against official docs before implementation.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Astro | 5.x (current stable ~5.7) | Static site generator, routing, content collections | Purpose-built for content-heavy static sites. Ships zero JS by default. Content Collections API with type-safe schemas, native MDX support, fast build times. Superior to Next.js for a site that needs no server-side logic. |
| TypeScript | 5.x (bundled with Astro) | Type safety across `.astro`, `.ts`, `.tsx` files | Astro includes TS out of the box. Content collection schemas use Zod for runtime + compile-time validation. No separate install needed. |

**Confidence:** MEDIUM — Astro 5 stable and Content Collections v2 API are well-established as of mid-2025. Exact patch version (5.7 estimate) unverified.

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | v4.x | Utility-first styling, dark mode, responsive design | v4 is a ground-up rewrite. CSS-native configuration (no `tailwind.config.js` — config lives in your CSS file via `@theme`). Dramatically faster build times via Lightning CSS engine. Required for the project per PROJECT.md constraints. |
| `@astrojs/tailwind` | — | **Do NOT use this** | The v3-era Astro integration (`@astrojs/tailwind`) does not support Tailwind v4. See installation note below. |

**Tailwind v4 + Astro installation (correct approach):**
```bash
# Tailwind v4 uses a Vite plugin, not the Astro integration
npm install tailwindcss @tailwindcss/vite
```

In `astro.config.mjs`:
```js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
})
```

In your global CSS entry (`src/styles/global.css`):
```css
@import "tailwindcss";

@theme {
  /* custom tokens here */
}
```

**Confidence:** MEDIUM — Tailwind v4 Vite plugin approach is confirmed in Tailwind v4 docs as of early 2025. The `@astrojs/tailwind` incompatibility with v4 is a known community-reported issue. Verify at https://tailwindcss.com/docs/installation/vite before implementing.

---

### Content Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Astro Content Collections | Built-in (v5) | Blog posts (MDX), portfolio entries (JSON/MDX), film case studies (MDX), photo sets (JSON) | Type-safe, schema-validated, no external CMS needed. Astro 5 introduced the Content Layer API which adds `loader` support for external data sources — not needed here since all content is file-based, but the API is stable and the standard approach. |
| `@astrojs/mdx` | Latest (^4.x) | MDX processing for blog + film case studies | MDX = Markdown with JSX component embeds. Required for blog posts that embed components (code blocks, callouts, video embeds). Must be registered as an Astro integration. |

**Content schema approach:**
```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  })
})

const films = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    year: z.number(),
    role: z.string(),
    vimeoId: z.string().optional(),
    youtubeId: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  })
})

const photos = defineCollection({
  type: 'data', // JSON schema, not MDX
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    coverImage: z.string(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    })),
  })
})

export const collections = { blog, films, photos }
```

**Confidence:** HIGH — Content Collections API with `defineCollection` + Zod schemas is the canonical Astro pattern, stable since v2, unchanged in v5.

---

### Typography & Fonts

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@fontsource/geist` | Latest (~5.x) | Self-hosted Geist font (sans + mono) | Self-hosted = no Google Fonts or Vercel CDN requests. Geist is specified in PROJECT.md. @fontsource packages fonts as npm modules for zero-network-request self-hosting. Import in your CSS entry point. |
| `@fontsource/geist-mono` | Latest | Monospace variant for code blocks | Optional companion. Covers `<code>` and syntax-highlighted blocks. |

**Installation:**
```bash
npm install @fontsource/geist @fontsource/geist-mono
```

**Usage in global.css:**
```css
@import "@fontsource/geist/400.css";
@import "@fontsource/geist/500.css";
@import "@fontsource/geist/700.css";
@import "@fontsource/geist-mono/400.css";
```

**Confidence:** HIGH — @fontsource is the standard self-hosted font approach for Astro projects. Geist package is maintained by Vercel-adjacent contributors and widely used.

---

### SEO & Metadata

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@astrojs/sitemap` | Latest (~3.x) | Auto-generated `sitemap.xml` | Zero-config after adding to integrations. Crawls all static routes. Pre-approved in PROJECT.md. |

**Configuration in `astro.config.mjs`:**
```js
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://yoursite.com', // required for sitemap
  integrations: [sitemap(), mdx()]
})
```

SEO meta tags should be handled via a reusable `<Head>` component in your base layout — Astro has no built-in meta tag helper, and a custom component is the correct pattern rather than installing a library.

**Confidence:** HIGH — `@astrojs/sitemap` is an official Astro integration, stable, well-documented.

---

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GSAP (GreenSock) | 3.x | Scroll reveals, hover effects, page transitions | Pre-approved in PROJECT.md. Industry-standard animation library with the best performance characteristics for DOM animation. Installed as a dependency in v1 but animation implementation deferred to future work. |

**Installation:**
```bash
npm install gsap
```

**Important:** Do NOT install `@gsap/react` or other framework adapters — Astro uses vanilla DOM access. GSAP works directly with selectors or element refs inside `<script>` tags in `.astro` files.

**GSAP + Astro pattern (for future use):**
```astro
<script>
  import { gsap } from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  gsap.registerPlugin(ScrollTrigger)
  // animations here
</script>
```

**Confidence:** HIGH — GSAP 3.x + Astro `<script>` integration is a proven pattern. No framework adapter needed.

---

### Images

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Astro's built-in Image component | Built-in | Optimized images for photo gallery, project thumbnails | Astro 5 ships `<Image>` and `<Picture>` components that auto-generate WebP/AVIF variants, apply lazy loading, and prevent layout shift. Use for photo gallery. No external library needed. |
| Sharp | ^0.33 | Image processing backend (auto-installed by Astro) | Astro uses Sharp internally for local image optimization. Listed here for awareness — do not install separately. |

**Confidence:** HIGH — Astro's built-in image optimization is the recommended approach and has been stable since v3.

---

### Syntax Highlighting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Shiki | Built-in (via Astro) | Code block syntax highlighting in MDX posts | Astro ships Shiki as the default highlighter. Zero configuration for standard usage. Supports 100+ languages and themes. Do not install Prism or highlight.js — Shiki is better in every dimension for this use case. |

**Confidence:** HIGH — Shiki is Astro's built-in and default highlighter, no install required.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Astro 5 | Next.js 15 | Next.js is React-first, requires server runtime for RSC, and carries significant JS overhead for a static content site. Overkill for no-DB, no-auth use case. |
| Framework | Astro 5 | Eleventy (11ty) | Less ergonomic TypeScript story, no built-in image optimization, smaller ecosystem. Astro is the better choice for 2025. |
| Framework | Astro 5 | SvelteKit | SvelteKit is excellent but optimized for apps, not content sites. Astro's content collections and MDX integration are purpose-built for this project. |
| Styling | Tailwind v4 | Tailwind v3 | v3 is now in maintenance mode. v4 has better performance, CSS-native config, and is the future-forward choice. Stack constraint from PROJECT.md. |
| Styling | Tailwind v4 | UnoCSS | UnoCSS is faster but the ecosystem/community is smaller, and Tailwind v4's speed improvements close the gap significantly. |
| Fonts | @fontsource/geist | next/font or Google Fonts | Both require network requests or Next.js-specific APIs. @fontsource is framework-agnostic and self-hosted. |
| Animation | GSAP | Framer Motion | Framer Motion is React-only. This is an Astro project — GSAP is the correct choice for vanilla DOM animation. |
| Animation | GSAP | CSS-only transitions | Acceptable for simple cases, but GSAP is pre-approved and gives far more control for scroll reveals and page transitions. |
| Images | Astro built-in | Cloudinary / imgix | External CDN services add complexity, cost, and configuration overhead. Astro's built-in optimizer is sufficient for a personal site with a reasonable image count. |
| Syntax highlighting | Shiki (built-in) | Prism.js | Prism requires additional setup, is slower to build, and has worse theme support than Shiki. Shiki is already included. |
| MDX | @astrojs/mdx | remark only | Plain Markdown (remark) cannot embed components. MDX is required for video embeds, custom callouts, and rich film case study pages. |

---

## Complete Dependency List

### Production Dependencies

```bash
npm install gsap @fontsource/geist @fontsource/geist-mono
```

### Dev / Peer Dependencies (Tailwind v4 + Vite plugin)

```bash
npm install -D tailwindcss @tailwindcss/vite
```

### Astro Integrations (via `astro add` or manual)

```bash
npx astro add mdx sitemap
# This installs @astrojs/mdx and @astrojs/sitemap and updates astro.config.mjs
```

### Already Bundled (do not install separately)

- TypeScript — bundled with Astro
- Zod — bundled with Astro (used in content collection schemas)
- Shiki — bundled with Astro (syntax highlighting)
- Sharp — auto-installed by Astro as a peer dep for image optimization
- Vite — Astro's build tool

---

## What NOT to Use

| Library | Reason to Avoid |
|---------|----------------|
| `@astrojs/tailwind` | Tailwind v3-era integration. Not compatible with Tailwind v4. Use `@tailwindcss/vite` instead. |
| `@gsap/react` | React adapter for GSAP. Not needed in an Astro project. |
| Framer Motion | React-only animation library. |
| `next/image` | Next.js-specific. Irrelevant here. |
| `react-photo-gallery` | React-specific. Astro handles photo display natively with `<Image>` + layout components. |
| Any headless CMS SDK (Contentful, Sanity, etc.) | All content is file-based per PROJECT.md constraints. |
| `@astrojs/react` | React integration for Astro. Not required — no interactive React components are planned. Only add if a specific component demands it later. |
| Prism.js / highlight.js | Shiki is built-in and superior. |

---

## Expected `astro.config.mjs`

```js
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://yoursite.com',
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
})
```

---

## Sources

**Confidence levels:**

| Claim | Confidence | Basis |
|-------|------------|-------|
| Astro 5 stable, Content Collections API | MEDIUM | Training data (mid-2025). Could not verify current patch version. |
| Tailwind v4 uses `@tailwindcss/vite`, not `@astrojs/tailwind` | MEDIUM | Training data. Tailwind v4 was released Jan 2025 with Vite plugin approach. Verify at tailwindcss.com/docs. |
| `@astrojs/mdx` and `@astrojs/sitemap` as official integrations | HIGH | Long-stable official integrations, unchanged between v3-v5. |
| GSAP 3.x works via Astro `<script>` tags without React adapter | HIGH | Well-documented pattern, GSAP is framework-agnostic. |
| `@fontsource/geist` package name and import pattern | MEDIUM | Training data. Verify package name on npmjs.com before installing. |
| Shiki built-in to Astro | HIGH | Stable since Astro v2, unchanged in v5. |
| Astro `<Image>` component built-in | HIGH | Stable since Astro v3, standard pattern. |
| Zod bundled with Astro for content schemas | HIGH | Core part of Astro's content collection API since v2. |

**Verification URLs (check before implementing):**
- Astro 5 docs: https://docs.astro.build/en/getting-started/
- Tailwind v4 Vite install: https://tailwindcss.com/docs/installation/vite
- @astrojs/mdx: https://docs.astro.build/en/guides/integrations-guide/mdx/
- @astrojs/sitemap: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- @fontsource/geist: https://fontsource.org/fonts/geist
- GSAP: https://gsap.com/docs/v3/
