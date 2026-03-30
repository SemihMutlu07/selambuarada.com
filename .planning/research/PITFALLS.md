# Domain Pitfalls

**Domain:** Astro 5 personal site / creative portfolio
**Researched:** 2026-03-31
**Confidence note:** WebSearch and WebFetch were unavailable during this research session. All findings are from training data (cutoff August 2025). Astro 5 launched December 2024 and Tailwind v4 launched January 2025 — both are within training window but at its edge. Treat all items as MEDIUM confidence unless noted otherwise. Verify against official docs before implementing.

---

## Critical Pitfalls

Mistakes that cause rewrites or hours of debugging.

---

### Pitfall 1: Astro 5 Content Layer API — Breaking Change from v4

**What goes wrong:** Astro 5 replaced the old `defineCollection` + `z.object()` schema pattern with a new Content Layer API. Code from tutorials, blog posts, or AI suggestions written against Astro 3/4 will silently fail or produce type errors. The old `src/content/config.ts` approach still works in legacy compatibility mode, but the new pattern is `src/content.config.ts` (root-level, different path) using `defineCollection` with `loader:` field.

**Why it happens:** The majority of Astro tutorials online were written for v3/v4. Stack Overflow, Reddit, and most blog posts predate v5. AI coding assistants default to v4 patterns. The migration is subtle — filenames differ by one character.

**Consequences:**
- Type errors that look like TypeScript misconfiguration
- `getCollection()` returns empty array when collections exist (wrong loader)
- `render()` is now a standalone import, not a method on entries — `entry.render()` no longer works
- Schema validation silently passes with wrong types if using old `z.` Zod patterns

**Prevention:**
- Start from the official Astro 5 docs, not tutorials — https://docs.astro.build/en/guides/content-collections/
- Use `src/content.config.ts` (root level) not `src/content/config.ts`
- Use the glob loader: `loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" })`
- Import `render` from `astro:content` not from the entry: `import { render } from 'astro:content'`
- In page templates: `const { Content } = await render(entry)` not `await entry.render()`

**Detection:**
- `getCollection('blog')` returns `[]` despite files existing → wrong loader or wrong config path
- TypeScript error on `entry.render()` → using v4 pattern
- Build succeeds but pages 404 → slug generation broken by wrong loader base path

**Phase:** Foundational — address in Phase 1 (project setup) before writing any collection schemas.

---

### Pitfall 2: Tailwind v4 — No `tailwind.config.js`, Config Lives in CSS

**What goes wrong:** Tailwind CSS v4 eliminates `tailwind.config.js` entirely. Configuration now lives inside your CSS file using `@theme`, `@layer`, and CSS custom properties. Developers familiar with v3 will create a `tailwind.config.js`, find it silently ignored, and wonder why their custom tokens aren't working. The `@astrojs/tailwind` integration also changed — v4 uses `@tailwindcss/vite` instead.

**Why it happens:** Every Tailwind tutorial before 2025 uses `tailwind.config.js`. The mental model shift (config-as-CSS) is significant. Astro's own starter templates may lag behind.

**Consequences:**
- Custom colors, fonts, breakpoints defined in `tailwind.config.js` are ignored
- Dark mode class strategy must be configured differently (`@variant dark`)
- The `darkMode: 'class'` key in config does nothing — it no longer exists
- Font size, spacing scales from v3 are gone — v4 uses a different default scale

**Prevention:**
- Install `@tailwindcss/vite` not `@astrojs/tailwind` for v4 integration
- Define all theme tokens in your main CSS file: `@theme { --color-brand: #... }`
- Configure dark mode in CSS: `@variant dark (&:where(.dark, .dark *));` or use `@custom-variant`
- Read the Tailwind v4 upgrade guide before writing a single line of CSS

**Detection:**
- Custom colors not applying → check if you have a `tailwind.config.js` being ignored
- `dark:` variant not working → dark mode variant not configured in CSS
- Unexpected spacing/font sizes → v4 changed defaults, not a bug

**Phase:** Phase 1 (project setup). Lock this down before any component work.

---

### Pitfall 3: Dark Mode — Class Strategy Breaks Without Explicit Persistence

**What goes wrong:** The brutalist site requires dark mode via class strategy (`class="dark"` on `<html>`). A toggle that only sets the class in JavaScript will lose state on page navigation (Astro's MPA model means full page reloads). Users who toggle dark mode will see it reset on every navigation. Additionally, without a `prefers-color-scheme` fallback on first load, users get a flash of the wrong theme (FOUT for themes).

**Why it happens:** Developers implement the toggle correctly for SPAs where the DOM persists. Astro's default output is MPA — each page is a fresh HTML document. The class applied to `<html>` via JS is wiped on navigation.

**Consequences:**
- Dark mode resets to light on every page click
- Flash of unstyled/wrong-theme content on first load (flicker)
- If using `is:inline` scripts, they may execute after Astro's hydration causing flash

**Prevention:**
- Persist dark mode preference in `localStorage`
- In the base layout, add an inline script (no `defer`, no `type="module"`) in `<head>` that reads localStorage and applies the class before paint:
  ```html
  <script is:inline>
    const theme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  </script>
  ```
- This script must be in `<head>`, before any CSS, to prevent flash
- The toggle button reads/writes localStorage and updates the class

**Detection:**
- Dark mode works on one page but resets when navigating → missing localStorage persistence
- Brief flash of light mode on dark-mode-preferred system → script running too late or deferred

**Phase:** Phase 2 (base layout). The flash fix must be in the layout before any page components are built.

---

### Pitfall 4: Image Optimization — `public/` Directory Bypasses All Optimization

**What goes wrong:** Placing images in `public/` makes them available at the root URL but bypasses Astro's entire image optimization pipeline. The `<Image>` component cannot optimize images from `public/` — it passes them through as-is. For a photography portfolio, this is catastrophic: full-resolution RAW exports served to every visitor.

**Why it happens:** `public/` feels like the obvious place for images (it maps to `/`). Developers new to Astro assume the `<Image>` component will optimize anything it can reference by URL.

**Consequences:**
- Photo gallery serving 20MB+ JPEG files
- No WebP/AVIF conversion
- No responsive srcset generation
- No lazy loading with proper dimensions (layout shift)
- LCP scores destroyed

**Prevention:**
- All optimizable images go in `src/assets/` or within the content collection directory
- Use `import` for local images (enables full type safety + optimization)
- For images referenced in MDX frontmatter, define them as `image()` type in the collection schema — this enables optimization
- `public/` is only for: favicons, OG images (static), fonts you self-host, files that must not be transformed

**Detection:**
- Network tab shows massive image files → images in `public/`
- `<Image>` component on a `public/` path logs warning about skipping optimization
- No WebP URLs in generated HTML → optimization not running

**Phase:** Phase 1 (project structure). Establish the directory convention before any images are added. Very costly to reorganize later.

---

### Pitfall 5: MDX — Component Imports Must Be Explicit, Not Auto-Imported

**What goes wrong:** MDX in Astro does not auto-import components. Every component used in an MDX file must be either imported in the frontmatter or passed via the `components` prop from the page that renders the collection entry. Developers assume MDX components work like React or Next.js MDX where global components are registered once.

**Why it happens:** Next.js MDX has `MDXProvider` for global component registration. Astro's MDX has no equivalent. This is a deliberate Astro design choice (explicit over implicit).

**Consequences:**
- `ReferenceError: ComponentName is not defined` at build time (or runtime with SSR)
- Custom components (e.g., `<Callout>`, `<VideoEmbed>`) silently render as nothing or error
- Blog posts that worked locally break in production builds

**Prevention:**
- Pass shared components from the page template via `<Content components={{ Callout, VideoEmbed }} />`
- Or import them directly in each MDX file's frontmatter (acceptable for one-off components)
- Create a `components.ts` barrel export of all MDX-used components and pass it every time
- Never expect components to be globally available in MDX

**Detection:**
- Component renders fine in `.astro` pages but errors in `.mdx` content → missing explicit import/pass
- Build error `X is not defined` in MDX file → component not in scope

**Phase:** Phase 2 (blog setup). Define the component passing pattern once and document it before writing any blog posts.

---

## Moderate Pitfalls

---

### Pitfall 6: GSAP + Astro — Island Architecture Conflicts

**What goes wrong:** GSAP targets DOM elements by selector. In Astro, component scripts run after the DOM is painted, but `document.querySelector()` in a `<script>` tag can select elements from other components or pages. When page transitions are added later (View Transitions API), GSAP animations can fire on stale elements or fail to re-initialize after navigation.

**Why it happens:** GSAP was designed for SPAs and jQuery-era MPA sites. Astro's architecture (component scripts are module scripts, View Transitions replaces DOM in place) creates timing issues that don't surface until page transitions are implemented.

**Consequences:**
- Animations don't re-run after View Transitions navigation
- `gsap.to(element)` targeting elements that no longer exist
- Memory leaks from ScrollTrigger not being cleaned up between navigations

**Prevention:**
- Scope all GSAP selectors to a container ref, not global `document.querySelector`
- If View Transitions are added later, listen to `astro:page-load` event to re-initialize GSAP
- Call `ScrollTrigger.refresh()` and kill instances in `astro:before-preparation` if using ScrollTrigger
- Since GSAP is installed but not configured in v1, document this contract in code comments now

**Detection:**
- Animations run once on first load but not on subsequent navigation → missing `astro:page-load` listener
- Console errors about elements not found → GSAP running before component mounts

**Phase:** Deferred (GSAP is out of scope for v1). Flag in future animation phase setup docs.

---

### Pitfall 7: Photo Gallery — Layout Shift from Images Without Declared Dimensions

**What goes wrong:** A photo gallery with expandable sections, if images don't have explicit `width` and `height` attributes (or an `aspect-ratio`), will cause massive Cumulative Layout Shift (CLS) as images load. The expandable section feature makes this worse: toggling sections open collapses and re-expands layout, shifting content if dimensions are unknown.

**Why it happens:** CSS grid/flexbox galleries that rely on image intrinsic dimensions will shift during load. Developers focus on the visual design and skip dimension handling.

**Consequences:**
- CLS score tanks Core Web Vitals
- User sees content jumping as photos load
- Expandable section height animates incorrectly before images load

**Prevention:**
- Always use the `<Image>` component for gallery images (it injects `width`/`height` from metadata)
- For dynamically loaded images in MDX, use Astro's `image()` schema type which resolves dimensions at build time
- Use CSS `aspect-ratio` on image containers as a fallback
- Set `loading="eager"` only for above-fold hero images; `loading="lazy"` for gallery

**Detection:**
- Visible page jump as gallery images load → missing dimensions
- Lighthouse CLS score > 0.1 → layout shift present

**Phase:** Phase 3 (photo gallery). Establish image dimension discipline before building gallery components.

---

### Pitfall 8: Films Section — Embedded Video and CSP Headers

**What goes wrong:** Embedding YouTube, Vimeo, or other external video iframes on a static site requires allowing those domains in Content-Security-Policy headers. If the deployment platform (Netlify, Vercel, Cloudflare Pages) has default CSP that blocks external frames, embeds will be blocked silently or show as blank.

**Why it happens:** Static sites rarely deal with CSP until video embeds break in production. Local dev has no CSP enforcement, so the issue only surfaces after deploy.

**Consequences:**
- Video iframes render as blank rectangles in production
- Console CSP errors that are confusing to debug

**Prevention:**
- If deploying to Netlify: add `netlify.toml` with `[[headers]]` allowing `frame-src` for embed domains
- If deploying to Cloudflare Pages: configure headers in `_headers` file
- Use `loading="lazy"` on iframes and `title` attribute for accessibility
- Consider a facade pattern (click-to-load) that avoids embedding until user interaction — eliminates CSP and improves page weight

**Detection:**
- Blank iframe rectangle in production but not local → CSP blocking
- Browser console `Refused to frame` error → CSP header issue

**Phase:** Phase 4 (films section). Check deployment headers configuration before building film components.

---

### Pitfall 9: Tailwind v4 Dark Mode — `dark:` Variant Requires Explicit Configuration

**What goes wrong:** In Tailwind v4, the `dark:` variant does not automatically use the `class` strategy. You must explicitly configure the variant in your CSS to use class-based dark mode rather than `prefers-color-scheme`. Without this, `dark:bg-black` will respond to OS preference, not your manual toggle.

**Why it happens:** v3's `darkMode: 'class'` in config is gone. v4 requires CSS-level variant configuration. The default behavior changed.

**Consequences:**
- Toggle button has no effect — dark mode only changes with OS preference
- `dark:` utility classes apply/remove based on media query, not class toggle

**Prevention:**
- In your main CSS file, add: `@variant dark (&:where(.dark, .dark *));`
- This tells Tailwind's v4 `dark:` variant to match when any ancestor has `.dark` class
- Must be declared before any `dark:` utilities are used

**Detection:**
- Toggle button changes `<html class="dark">` but styles don't change → variant not configured in CSS
- Dark mode changes when switching OS theme but not when clicking toggle → media query strategy active instead of class

**Phase:** Phase 1 (project setup). Must be in the base CSS file from the start.

---

### Pitfall 10: Geist Font via Fontsource — FOUT Without font-display

**What goes wrong:** Self-hosting Geist via `@fontsource/geist` is correct for avoiding external requests. However, without `font-display: swap` in the font face declaration, font loading is render-blocking. The browser waits for Geist to load before painting text, causing Flash of Invisible Text (FOIT) on slow connections.

**Why it happens:** Fontsource injects font-face declarations but the default `font-display` value is `auto` (browser-specific). The developer doesn't realize font loading behavior needs to be explicitly declared.

**Consequences:**
- Text is invisible during font load on slow connections
- Perceived performance is worse than using `font-display: swap`
- Core Web Vitals FCP score impacted

**Prevention:**
- Import the `display=swap` variant from fontsource if available: `@fontsource/geist/400.css` with display option, or override in your CSS with `font-display: swap`
- Fontsource packages support `@fontsource/geist/400-italic.css` style imports with display baked in
- Alternatively, manually add `font-display: swap` to any auto-generated font-face rules

**Detection:**
- Text invisible during page load on throttled connection → FOIT from missing font-display
- Lighthouse "Ensure text remains visible during webfont load" warning

**Phase:** Phase 1 (base layout). Set font loading strategy before any typography work.

---

## Minor Pitfalls

---

### Pitfall 11: Content Collections With Empty Collections Throw at Build

**What goes wrong:** Astro 5's `getCollection()` does not throw on empty collections — it returns an empty array. However, if your schema marks frontmatter fields as required and you have zero entries, the collection is valid. The problem is developers sometimes create `getStaticPaths` that returns an empty array, causing Astro to warn or fail depending on config. Ships fine with placeholder content but breaks when content is removed.

**Prevention:**
- Always guard `getStaticPaths` results: if no entries, handle gracefully
- The project requirement is "ship empty collections" — verify at build time that empty collections don't 404 the listing page

**Detection:**
- Build succeeds but `/blog` 404s → `getStaticPaths` returning nothing with no fallback route

**Phase:** Phase 2 (blog setup).

---

### Pitfall 12: Sitemap Integration — Only Generates for Pages That Exist at Build Time

**What goes wrong:** `@astrojs/sitemap` only generates sitemap entries for pages that are statically generated. If a route is dynamic and returns no entries (empty collection), that route won't appear in the sitemap. This is correct behavior, but developers expect all routes to appear.

**Prevention:**
- Accept this behavior — the sitemap reflects what exists, which is correct
- Add `changefreq` and `priority` customization in `astro.config.mjs` if needed
- Don't add fake/placeholder pages just to populate the sitemap

**Detection:**
- Route missing from sitemap → either collection is empty or route uses SSR (not applicable for this static site)

**Phase:** Phase 1 (project setup). Configure once and leave it.

---

### Pitfall 13: TypeScript Strict Mode and Astro Component Props

**What goes wrong:** Astro components with `interface Props` work best with TypeScript strict mode enabled. Without it, optional props with undefined values can cause runtime errors that TypeScript would have caught. Brutalist layouts often have complex conditional rendering — strict mode catches these early.

**Prevention:**
- Enable `strict: true` in `tsconfig.json` from day one
- Astro's default `tsconfig.json` extends `astro/tsconfigs/strict` — don't weaken it
- Never use `// @ts-ignore` as a fix — find the actual type issue

**Detection:**
- Runtime errors on undefined prop access → would have been a TS error with strict mode

**Phase:** Phase 1 (project setup). Non-negotiable from project initialization.

---

### Pitfall 14: MDX Frontmatter `tags` Array — Schema Must Match Exactly

**What goes wrong:** Blog posts with `tags: ["one", "two"]` in frontmatter work fine. But if any post has `tags: "one"` (string instead of array), schema validation throws a cryptic error at build time. The error message points to the schema, not the offending post.

**Prevention:**
- Define `tags: z.array(z.string()).default([])` in schema — enforces array, provides empty default
- Validate content before building: `astro check` catches schema mismatches at dev time

**Detection:**
- Build error mentioning collection schema → check each post's frontmatter manually
- `astro check` output shows which file has the invalid frontmatter

**Phase:** Phase 2 (blog setup). Enforce at schema definition time.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Project setup | Tailwind v4 config — no `tailwind.config.js` | Use `@tailwindcss/vite`, configure in CSS |
| Project setup | Dark mode variant not class-based | Add `@variant dark` to CSS before writing dark: utilities |
| Project setup | Font FOIT | Import fontsource with display=swap variant |
| Project setup | TypeScript not strict | Use Astro's built-in strict tsconfig |
| Base layout | Dark mode flash on page load | Inline `<script>` in `<head>` reading localStorage |
| Blog setup | v4 content layer pattern | Use `src/content.config.ts` + glob loader |
| Blog setup | MDX component passing | Establish component pass pattern via `components` prop |
| Blog setup | Empty collection 404 | Guard `getStaticPaths` for zero entries |
| Photo gallery | Image layout shift | Always use `<Image>` component with src/assets images |
| Photo gallery | Images in public/ | All gallery images go in `src/assets/` |
| Films section | Video embed CSP | Configure deployment headers before testing embeds |
| Future animation | GSAP + View Transitions | Document re-init on `astro:page-load` contract now |

---

## Sources

**Confidence level: MEDIUM (training data, August 2025 cutoff)**

- Astro 5 Content Layer: https://docs.astro.build/en/guides/content-collections/ — verify current API
- Astro Image Guide: https://docs.astro.build/en/guides/images/ — verify public/ behavior
- Tailwind v4 Upgrade Guide: https://tailwindcss.com/docs/upgrade-guide — verify dark mode config syntax
- Fontsource Geist: https://fontsource.org/fonts/geist — verify display import pattern
- GSAP + Astro: https://gsap.com/resources/frameworks/ — verify View Transitions integration pattern

**All claims in this document should be validated against official docs before implementation. The Astro 5 + Tailwind v4 combination is relatively new and community patterns are still maturing.**
