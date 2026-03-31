# Phase 2: Content Sections - Research

**Researched:** 2026-03-31
**Domain:** Astro 5 Content Collections, MDX rendering, dynamic routes, image optimization, video embeds
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | Blog index page at `/blog` listing all posts sorted by date | `getCollection('blog')` + `.sort()` on `data.date` |
| BLOG-02 | Individual blog post pages at `/blog/[slug]` rendering MDX content | `getStaticPaths` with `post.id`, `render(post)` from `astro:content`, `<Content />` component |
| BLOG-03 | Blog post frontmatter: title, date, description, tags, slug | Schema already defined in `content.config.ts`; no `slug` field in schema (use `post.id`) |
| BLOG-04 | Tag index page listing all tags with post counts | `/blog/tags/index.astro` — `getCollection` → flatten+dedupe tags → count per tag with Map |
| BLOG-05 | Tag filter page showing posts for a specific tag | `/blog/tags/[tag].astro` — `getStaticPaths` extracts unique tags, filters posts per tag |
| BLOG-06 | Static OG image per blog post via meta tags | `og:image` meta tag in BaseLayout or BlogLayout pointing to `/og/[slug].png`; simplest approach is a static default image in `public/` per post or a shared fallback |
| PROJ-01 | Projects index page at `/projects` displaying project cards | `getCollection('projects')` — JSON file loader, already defined |
| PROJ-02 | Project cards show title, tech stack, brief description, external links | Data fields (`title`, `description`, `tech`, `url`, `github`) all in existing schema |
| PROJ-03 | Projects content collection with typed schema | Already exists in `content.config.ts` — no new schema work needed |
| FILM-01 | Films index page at `/films` listing all film entries | `getCollection('films')` — JSON file loader, already defined |
| FILM-02 | Individual film case study pages with embedded video (YouTube/Vimeo) | `/films/[id].astro` with `getStaticPaths`; iframe embed from `data.embedUrl`; no CSP needed for static HTML |
| FILM-03 | Film case study includes written description/writeup | `data.description` from schema — display as prose |
| FILM-04 | Film case study includes credits section (structured data from frontmatter) | `data.credits` array of `{ role, name }` already in schema |
| FILM-05 | Film case study includes behind-the-scenes section | `bts` field needs adding to films schema OR MDX-based films approach; JSON is simpler, add `bts` string field |
| FILM-06 | Films content collection with typed schema (title, year, role, embed URL, credits array, description) | Exists in `content.config.ts`; add `bts` field for FILM-05 |
| PHOT-01 | Single photo gallery page at `/photos` with all curated sets | `getCollection('photosets')` on single page |
| PHOT-02 | Each photo set is an expandable section with title and description | Native `<details>/<summary>` HTML — no JS, no library needed |
| PHOT-03 | Images optimized via Astro `<Image>` component (src/assets, not public) | `import.meta.glob` pattern required for JSON-referenced images; images stored in `src/assets/photos/` |
| PHOT-04 | Photo sets content collection (JSON) with typed schema | Schema exists; image `src` paths in JSON must match `import.meta.glob` pattern |
</phase_requirements>

---

## Summary

Phase 2 builds all four content sections on top of the Phase 1 foundation. The core technical machinery — content collection schemas, BaseLayout, Tailwind v4, dark mode — is already in place. The work is entirely in: (1) writing Astro pages that query and render each collection, (2) implementing dynamic routes for blog posts and film case studies, and (3) wiring up the photo gallery with optimized images.

The most important architectural decision in this phase is how images are handled for the photo sets collection. Because the collection uses the `file()` loader with a JSON array, image paths are plain strings — not imported modules. Astro's `<Image>` component requires `ImageMetadata` objects (from ESM imports), not path strings. The standard solution is `import.meta.glob('/src/assets/photos/**/*')` with an async lookup per image. This is documented in Astro's official recipes and works cleanly.

The second important decision is video embeds for film case study pages. Static HTML iframes for YouTube (`https://www.youtube.com/embed/VIDEO_ID`) and Vimeo (`https://player.vimeo.com/video/VIDEO_ID`) work without any CSP headers on a plain static site — CSP headers only become relevant if an HTTP header-level policy is added at the deployment layer. For this phase, a plain `<iframe>` is correct and sufficient.

**Primary recommendation:** Build each section as a focused Astro page with `getCollection()`, use `post.id` (not `post.slug`) for all dynamic routes, use `import.meta.glob` for photo images, use native `<details>/<summary>` for expandable sets, and add a shared `og:image` fallback to BaseLayout for BLOG-06.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.2 (installed) | Static pages, dynamic routes, getStaticPaths | Project requirement |
| @astrojs/mdx | 5.0.3 (installed) | Render MDX blog posts via `render()` | Project requirement |
| astro:content | built-in | `getCollection`, `getEntry`, `render` | Official Astro API |
| astro:assets | built-in | `<Image>` component for optimized images | Official Astro API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.2.2 (installed) | Page styling, responsive layouts, typography | All pages |
| import.meta.glob | Vite built-in | Dynamic image resolution from string paths | Photo gallery images from JSON collection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<details>/<summary>` | JS-powered accordion component | Native HTML has zero JS, zero dependencies, full accessibility built in; JS accordion only needed for animation |
| Plain `<img>` for photos | `<Image>` from astro:assets | `<Image>` provides automatic WebP conversion, lazy loading, and correct dimensions; `<img>` skips optimization |
| `import.meta.glob` for photos | `image()` helper in schema | `image()` helper works when image paths are in frontmatter of MDX files; JSON collections with `file()` loader don't support the `image()` helper — glob is the correct approach |

No new dependencies are needed for this phase. All required libraries are already installed.

---

## Architecture Patterns

### Recommended Page Structure
```
src/pages/
├── blog/
│   ├── index.astro          # BLOG-01: list all posts sorted by date
│   ├── [slug].astro         # BLOG-02: individual post page
│   └── tags/
│       ├── index.astro      # BLOG-04: tag index with counts
│       └── [tag].astro      # BLOG-05: filtered posts by tag
├── projects/
│   └── index.astro          # PROJ-01, PROJ-02: project cards
├── films/
│   ├── index.astro          # FILM-01: film listing
│   └── [id].astro           # FILM-02 to FILM-05: case study page
└── photos/
    └── index.astro          # PHOT-01 to PHOT-04: single gallery page
```

### Pattern 1: Blog Index with Date Sort
**What:** Fetch all blog posts, sort newest first, render a list.
**When to use:** `/blog/index.astro`
**Example:**
```astro
---
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = await getCollection('blog');
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout title="Blog">
  <ul>
    {sorted.map(post => (
      <li>
        <a href={`/blog/${post.id}`}>{post.data.title}</a>
        <time>{post.data.date.toLocaleDateString()}</time>
      </li>
    ))}
  </ul>
</BaseLayout>
```

### Pattern 2: Individual Blog Post with MDX Render
**What:** Dynamic route using `post.id`, renders MDX via `render()`.
**When to use:** `/blog/[slug].astro` — BLOG-02.
**Example:**
```astro
---
// Source: https://docs.astro.build/en/guides/content-collections/
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },  // entry.id NOT entry.slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);  // render() from astro:content, NOT post.render()
---
<BaseLayout title={post.data.title} description={post.data.description}>
  <Content />
</BaseLayout>
```

### Pattern 3: Tag Index (All Tags with Counts)
**What:** Single static page listing every tag used across all posts with counts.
**When to use:** `/blog/tags/index.astro` — BLOG-04.
**Example:**
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';

const posts = await getCollection('blog');
const tagCounts = new Map<string, number>();
posts.forEach(post => {
  post.data.tags.forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  });
});
const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
---
<BaseLayout title="Tags">
  <ul>
    {tags.map(([tag, count]) => (
      <li>
        <a href={`/blog/tags/${tag}`}>{tag} ({count})</a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

### Pattern 4: Tag Filter Page (Posts by Tag)
**What:** Dynamic route generating one page per unique tag.
**When to use:** `/blog/tags/[tag].astro` — BLOG-05.
**Example:**
```astro
---
// Source: https://docs.astro.build/en/tutorial/5-astro-api/2/
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const uniqueTags = [...new Set(posts.flatMap(post => post.data.tags))];

  return uniqueTags.map(tag => ({
    params: { tag },
    props: { posts: posts.filter(p => p.data.tags.includes(tag)) },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---
<BaseLayout title={`Posts tagged: ${tag}`}>
  <h1>{tag}</h1>
  <ul>
    {posts.map(post => (
      <li><a href={`/blog/${post.id}`}>{post.data.title}</a></li>
    ))}
  </ul>
</BaseLayout>
```

### Pattern 5: Photo Gallery with import.meta.glob
**What:** Resolve image string paths from JSON collection to `ImageMetadata` for `<Image>` component.
**When to use:** `/photos/index.astro` — PHOT-03, PHOT-04.
**Example:**
```astro
---
// Source: https://docs.astro.build/en/recipes/dynamically-importing-images/
import { Image } from 'astro:assets';
import { getCollection } from 'astro:content';

const photosets = await getCollection('photosets');

// Eagerly import all photo assets — Vite resolves them at build time
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/**/*.{jpg,jpeg,png,webp}',
  { eager: true }
);
---
<BaseLayout title="Photos">
  {photosets.map(set => (
    <details>
      <summary>{set.data.title}</summary>
      <p>{set.data.description}</p>
      <div>
        {set.data.images.map(img => {
          const mod = imageModules[img.src];
          return mod
            ? <Image src={mod.default} alt={img.alt} />
            : null;
        })}
      </div>
    </details>
  ))}
</BaseLayout>
```

JSON photosets entry format:
```json
{
  "id": "tokyo-2024",
  "title": "Tokyo 2024",
  "description": "Three weeks in Japan.",
  "images": [
    { "src": "/src/assets/photos/tokyo-2024/001.jpg", "alt": "Shinjuku at night" }
  ]
}
```

### Pattern 6: Film Case Study Page
**What:** Dynamic route for each film with embedded video, description, credits, BTS.
**When to use:** `/films/[id].astro` — FILM-02 to FILM-05.
**Example:**
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const films = await getCollection('films');
  return films.map(film => ({
    params: { id: film.id },
    props: { film },
  }));
}

const { film } = Astro.props;
const { title, year, role, embedUrl, description, credits, bts } = film.data;
---
<BaseLayout title={title}>
  <iframe src={embedUrl} width="100%" height="400" allowfullscreen></iframe>
  <p>{description}</p>
  <section>
    <h2>Credits</h2>
    <dl>
      {credits.map(c => (
        <>
          <dt>{c.role}</dt>
          <dd>{c.name}</dd>
        </>
      ))}
    </dl>
  </section>
  {bts && (
    <section>
      <h2>Behind the Scenes</h2>
      <p>{bts}</p>
    </section>
  )}
</BaseLayout>
```

### Pattern 7: Static OG Image Meta Tag (BLOG-06)
**What:** Add OG image meta tag to BaseLayout or a BlogPostLayout, pointing to a static image.
**When to use:** Blog post pages — BLOG-06. Simplest approach: one shared default OG image in `public/og-image.png`.
**Example:**
```astro
<!-- In BaseLayout.astro, accept optional ogImage prop -->
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}
const { title, description, ogImage = '/og-image.png' } = Astro.props;

// In <head>:
<meta property="og:title" content={title} />
<meta property="og:description" content={description ?? ''} />
<meta property="og:image" content={ogImage} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content={ogImage} />
```

Blog post pages pass: `<BaseLayout title={post.data.title} ogImage={`/og/${post.id}.png`} />`
Individual images placed in `public/og/[post-id].png` for per-post OGs. A shared fallback covers posts with no dedicated image.

### Anti-Patterns to Avoid
- **`post.slug` in `getStaticPaths`:** Removed in Astro 5 — use `post.id`. TypeScript will error.
- **`post.render()` method:** Removed in Astro 5 — use `import { render } from 'astro:content'`.
- **`public/` for optimized photos:** `<Image>` component cannot optimize images from `public/` — they must be in `src/` to go through Vite's transform pipeline.
- **`image()` helper in JSON collection schema:** The `image()` schema helper from Astro works for MDX/Markdown frontmatter only. JSON collections loaded with `file()` need `import.meta.glob` to resolve image metadata.
- **Bare `<img>` tags for photo sets:** Will skip WebP conversion, lazy loading, and intrinsic size hints — use `<Image>` from `astro:assets`.
- **JS-only accordions for photo sets:** `<details>/<summary>` is the correct primitive; no library needed, no hydration cost.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom sharp pipeline | `<Image>` from `astro:assets` | Handles WebP conversion, lazy loading, intrinsic sizes, responsive `srcset` |
| Dynamic image path → metadata | Custom import resolver | `import.meta.glob` pattern | Vite native; handles all image formats; integrates with `<Image>` component |
| Tag deduplication | Custom data structure | `new Set(posts.flatMap(p => p.data.tags))` | One line; no library needed |
| Expandable sections | JS-powered accordion | Native `<details>/<summary>` | Zero JS, zero dependencies, keyboard accessible, screen-reader friendly |
| MDX rendering pipeline | Custom markdown parser | `render()` from `astro:content` | Handles remark/rehype plugins; returns typed `<Content />` component |

**Key insight:** Astro's built-in primitives handle every non-trivial problem in this phase. The implementation is mostly page composition and data wiring — not infrastructure.

---

## Common Pitfalls

### Pitfall 1: `post.id` includes directory prefix for nested files
**What goes wrong:** Blog post at `src/content/blog/2024/my-post.mdx` gets `id` of `2024/my-post`, making the URL `/blog/2024/my-post` instead of `/blog/my-post`.
**Why it happens:** `id` is the slugified file path relative to the collection root, including subdirectories.
**How to avoid:** Store all blog MDX files flat in `src/content/blog/*.mdx`. No subdirectories.
**Warning signs:** URLs with extra path segments; 404s on post navigation.

### Pitfall 2: `import.meta.glob` path must match exactly
**What goes wrong:** `imageModules[img.src]` returns `undefined` even though the file exists.
**Why it happens:** The key in the glob map is the full path string as written in the glob pattern. If the JSON has `/src/assets/photos/set/img.jpg` but the glob pattern is `/src/assets/photos/**/*.jpg`, the key must exactly match what the JSON entry provides.
**How to avoid:** Use the full path format `/src/assets/photos/...` consistently in both the JSON data and the glob pattern. Add error handling that logs the missing path.
**Warning signs:** Images silently render as nothing; no build error.

### Pitfall 3: Film `bts` field missing from schema
**What goes wrong:** TypeScript error when accessing `film.data.bts` — property doesn't exist.
**Why it happens:** The existing films schema in `content.config.ts` doesn't include a `bts` field.
**How to avoid:** Add `bts: z.string().optional()` to the films Zod schema before writing the film case study template.
**Warning signs:** Build-time TypeScript error on `film.data.bts`.

### Pitfall 4: Empty JSON collections cause no routes but no errors
**What goes wrong:** `getCollection('films')` returns `[]` on empty `films.json`. `getStaticPaths` returns no paths. No film pages are generated, but no build error occurs either.
**Why it happens:** Empty collections are valid. Astro builds zero dynamic pages without warning.
**How to avoid:** Seed each JSON content file with at least one sample entry during Phase 2 implementation so routes can be tested. Remove sample content before shipping.
**Warning signs:** Visiting `/films/anything` returns 404; `/films` shows an empty list.

### Pitfall 5: OG image path without `site` configured
**What goes wrong:** `og:image` meta tag contains a relative path (`/og-image.png`) rather than an absolute URL (`https://example.com/og-image.png`). Social crawlers may not resolve relative OG image URLs.
**Why it happens:** `Astro.site` is `undefined` until `site` is set in `astro.config.mjs`. BaseLayout cannot construct absolute URLs without it.
**How to avoid:** Either (a) configure `site` in `astro.config.mjs` and use `new URL('/og-image.png', Astro.site).href`, or (b) defer absolute URL construction to Phase 3 (SEO-03) and use relative paths in Phase 2. BLOG-06 only requires meta tags to be present — absolute URL is a Phase 3 concern.
**Warning signs:** Social media preview tools show broken OG image.

### Pitfall 6: YouTube embed URL format
**What goes wrong:** Pasting a YouTube watch URL (`https://www.youtube.com/watch?v=VIDEO_ID`) directly into `embedUrl` breaks the iframe.
**Why it happens:** YouTube iframes require the embed URL format, not the watch URL format.
**How to avoid:** Validate `embedUrl` values use the correct format: `https://www.youtube.com/embed/VIDEO_ID` for YouTube and `https://player.vimeo.com/video/VIDEO_ID` for Vimeo. Document this in the JSON schema comment.
**Warning signs:** Blank iframe on film case study pages; browser console shows `refused to display in a frame`.

### Pitfall 7: `tags` field must be an array — never a string
**What goes wrong:** Blog post with `tags: "code"` (string) causes build error or runtime failure in tag deduplication.
**Why it happens:** Zod schema uses `z.array(z.string())` which rejects plain strings. Even with `.default([])`, a string value fails validation.
**How to avoid:** Always write frontmatter tags as YAML arrays: `tags: ["code"]` or `tags:\n  - code`. Document this in any example MDX files.
**Warning signs:** Build error: "Expected array, received string" in Zod validation output.

---

## Code Examples

Verified patterns from official sources:

### `getCollection` with sort
```astro
---
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
```

### Dynamic route — `getStaticPaths` with `entry.id`
```astro
---
// Source: https://docs.astro.build/en/guides/content-collections/
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },  // id, not slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);  // module-level render(), not post.render()
---
<Content />
```

### Tag extraction — unique tags from all posts
```astro
---
// Source: https://docs.astro.build/en/tutorial/5-astro-api/2/
const posts = await getCollection('blog');
const uniqueTags = [...new Set(posts.flatMap(post => post.data.tags))];
---
```

### Photo images via `import.meta.glob`
```astro
---
// Source: https://docs.astro.build/en/recipes/dynamically-importing-images/
import { Image } from 'astro:assets';

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/**/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

// Resolve: imageModules['/src/assets/photos/set-name/img.jpg'].default
---
```

### Native expandable section (no JS)
```html
<!-- No library needed — uses built-in browser behavior -->
<details>
  <summary>Tokyo 2024</summary>
  <p>Three weeks in Japan.</p>
  <!-- images here -->
</details>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `entry.slug` | `entry.id` | Astro 5.0 | All dynamic blog/film routes must use `post.id` |
| `entry.render()` method | `render(entry)` from `astro:content` | Astro 5.0 | Method removed from entry object |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | Already correct in this project |
| `<img>` tags | `<Image>` from `astro:assets` | Astro 3.0+ | Automatic WebP, lazy loading, responsive sizes |
| Manual tag pages with `import.meta.glob` | `getCollection` + Set deduplication | Astro 2+ | Cleaner, type-safe approach with content collections |

**Deprecated/outdated:**
- `entry.slug`: Removed in Astro 5. Use `entry.id`.
- `entry.render()`: Removed in Astro 5. Use module-level `render()` from `astro:content`.

---

## Open Questions

1. **Behind-the-scenes field format for films (FILM-05)**
   - What we know: The existing films schema has no `bts` field. The requirement says "behind-the-scenes section" but doesn't specify if it's a plain text description, a list of items, or another embed URL.
   - What's unclear: Whether BTS is a single paragraph (string), multiple paragraphs (array of strings), or a structured object.
   - Recommendation: Add `bts: z.string().optional()` to the films schema as a plain text/markdown field. The planner should note this as a content format decision. If richer structure is needed later, the schema can be extended.

2. **OG image per post: static files vs generated**
   - What we know: BLOG-06 requires "static OG image per blog post via meta tags." Dynamic generation (Satori) is a v2 requirement (BLOG-07). For v1, a static file placed in `public/og/[slug].png` per post is the simplest approach — but this requires creating image files manually for each post.
   - What's unclear: Whether the intent is a per-post custom image or a shared fallback image. "Ship with empty collections" (from project scope) suggests no actual blog posts ship yet.
   - Recommendation: Implement the meta tags infrastructure in BaseLayout (og:title, og:description, og:image pointing to `/og-image.png`) and fall back to a single shared OG image in `public/`. Per-post OG images become real when posts are authored. This satisfies BLOG-06 (meta tags present) without blocking on post content.

3. **Photo collection: `id` field requirement for JSON arrays**
   - What we know: Astro's `file()` loader with a JSON array requires each entry to have an `id` field for the collection to work correctly. The current `photosets` schema doesn't explicitly define `id`.
   - What's unclear: Whether Astro auto-generates `id` for JSON array entries or requires it in the data.
   - Recommendation: The planner should verify — if `id` is not auto-generated for `file()` loader arrays, add an `id` field to each photoset JSON entry (e.g., `"id": "tokyo-2024"`).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No automated test runner — Astro build is the test harness |
| Config file | None |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run preview` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BLOG-01 | `/blog` renders post list | build smoke | `npm run build` | ❌ Wave 0 |
| BLOG-02 | `/blog/[slug]` renders MDX post | build smoke | `npm run build` | ❌ Wave 0 |
| BLOG-03 | Frontmatter Zod validation passes | build smoke | `npm run build` | ❌ Wave 0 |
| BLOG-04 | `/blog/tags` lists all tags with counts | build smoke | `npm run build` | ❌ Wave 0 |
| BLOG-05 | `/blog/tags/[tag]` shows filtered posts | build smoke | `npm run build` | ❌ Wave 0 |
| BLOG-06 | OG meta tags present in post page source | manual | inspect `dist/blog/[slug]/index.html` | ❌ Wave 0 |
| PROJ-01 | `/projects` renders project cards | build smoke | `npm run build` | ❌ Wave 0 |
| PROJ-02 | Cards show title, tech, description, links | manual | browser visual check | ❌ Wave 0 |
| PROJ-03 | Zod schema validates projects.json | build smoke | `npm run build` | ❌ Wave 0 |
| FILM-01 | `/films` renders film listing | build smoke | `npm run build` | ❌ Wave 0 |
| FILM-02 | `/films/[id]` renders with iframe | build smoke + manual | `npm run build`, browser check | ❌ Wave 0 |
| FILM-03 | Film page shows description text | manual | browser visual check | ❌ Wave 0 |
| FILM-04 | Film page shows credits section | manual | browser visual check | ❌ Wave 0 |
| FILM-05 | Film page shows BTS section when present | manual | browser visual check | ❌ Wave 0 |
| FILM-06 | Zod schema validates films.json | build smoke | `npm run build` | ❌ Wave 0 |
| PHOT-01 | `/photos` renders all photo sets | build smoke | `npm run build` | ❌ Wave 0 |
| PHOT-02 | Each set is expandable via details/summary | manual | browser interaction check | ❌ Wave 0 |
| PHOT-03 | Photos served as optimized WebP | manual | inspect network tab in browser | ❌ Wave 0 |
| PHOT-04 | Zod schema validates photosets.json | build smoke | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` — catches TypeScript errors, broken schemas, broken routes, missing dynamic pages
- **Per wave merge:** `npm run build` passes clean
- **Phase gate:** Build passes AND manual browser check of each section before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Seed `src/content/films.json` with 1 sample entry (with `bts` field added to schema) — needed so film routes generate and can be tested
- [ ] Seed `src/content/projects.json` with 1 sample entry — needed so project cards render
- [ ] Seed `src/content/photosets.json` with 1 sample entry + 1 image in `src/assets/photos/` — needed to test glob pattern and `<Image>` rendering
- [ ] Create `src/content/blog/sample-post.mdx` with 1 sample post — needed so blog routes generate; frontmatter must include `title`, `date`, `description`, `tags`
- [ ] Add `public/og-image.png` (1200x630) as shared OG fallback — needed for BLOG-06 meta tag to resolve
- [ ] Add `bts: z.string().optional()` to films schema in `content.config.ts` before writing film case study page

---

## Sources

### Primary (HIGH confidence)
- `https://docs.astro.build/en/guides/content-collections/` — getStaticPaths pattern, entry.id, render() usage
- `https://docs.astro.build/en/reference/modules/astro-content/` — getCollection, getEntry, render() API signatures
- `https://docs.astro.build/en/tutorial/5-astro-api/2/` — tag pages with getStaticPaths, unique tag extraction
- `https://docs.astro.build/en/guides/images/` — Image component, src/assets pattern, image() in schema
- `https://docs.astro.build/en/reference/modules/astro-assets/` — Image component required props, ImageMetadata type
- `https://docs.astro.build/en/recipes/dynamically-importing-images/` — import.meta.glob for dynamic image paths

### Secondary (MEDIUM confidence)
- `https://arne.me/blog/static-og-images-in-astro/` — Static OG image approach, required meta tags (verified against official Astro docs OG pattern)
- GitHub issue `withastro/astro#12772` — Confirmed that JSON file() loader collections cannot use image() helper; import.meta.glob is the documented workaround

### Tertiary (LOW confidence)
- Community sources on brutalist CSS patterns for blog/portfolio layouts — consistent across multiple sources, subjective design decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs verified against official docs; no new dependencies needed
- Architecture: HIGH — dynamic route patterns, render() usage, tag system all verified from official Astro docs
- Photo image handling: HIGH — import.meta.glob pattern verified from official Astro recipe docs; confirmed via GitHub issue that this is the correct approach for JSON collections
- Pitfalls: HIGH — entry.id/entry.slug change verified from official migration guide; glob path matching and empty collection behavior from official docs

**Research date:** 2026-03-31
**Valid until:** 2026-06-30 (Astro 6.x active; re-verify if Astro 7 releases)
