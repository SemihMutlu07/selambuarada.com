# Architecture Patterns

**Domain:** Astro 5 personal site — multidisciplinary creative portfolio
**Researched:** 2026-03-31
**Confidence:** MEDIUM (Astro 5 training data, August 2025 cutoff; web verification blocked in this session)

---

## Recommended Architecture

This site is a pure static site: no server, no database, no API. Content lives in files. Astro compiles everything to HTML at build time. The architecture is organized around three layers:

1. **Content Layer** — MDX/JSON files in `src/content/`, typed by Zod schemas in `src/content.config.ts`
2. **Page Layer** — `.astro` files in `src/pages/` that query collections and render HTML
3. **Component Layer** — Reusable `.astro` components in `src/components/`

```
src/
  content.config.ts          ← Collection schemas (Astro 5 Content Layer API)
  content/
    blog/                    ← MDX posts
    films/                   ← MDX case studies
    projects/                ← JSON or MDX project entries
  pages/
    index.astro              ← Landing / home
    about.astro
    blog/
      index.astro            ← Blog listing
      [slug].astro           ← Dynamic post route
    films/
      index.astro            ← Films listing
      [slug].astro           ← Film case study
    projects/
      index.astro            ← Projects grid
    photos/
      index.astro            ← Single-page gallery (all sets)
  layouts/
    BaseLayout.astro         ← HTML shell, head, nav, footer
    BlogPostLayout.astro     ← Blog-specific wrapper
    FilmLayout.astro         ← Film case study wrapper
  components/
    nav/
      Header.astro
      Footer.astro
      ThemeToggle.astro      ← Dark mode button
    ui/
      Tag.astro
      Card.astro
      Button.astro
    blog/
      PostCard.astro
      TagList.astro
    films/
      FilmCard.astro
      VideoEmbed.astro
      Credits.astro
      BehindTheScenes.astro
    photos/
      PhotoSet.astro         ← Expandable set section
      PhotoGrid.astro        ← Grid inside a set
      PhotoLightbox.astro    ← (if implemented) full-screen view
    projects/
      ProjectCard.astro
  styles/
    global.css               ← Tailwind v4 @import, CSS custom properties
  lib/
    utils.ts                 ← Shared helpers (date format, slug gen, etc.)
public/
  fonts/                     ← (empty — Geist via @fontsource, not public/)
  images/
    photos/                  ← Curated photo assets
    films/                   ← Film stills, behind-the-scenes
    og/                      ← OG images per page
```

---

## Component Boundaries

### What talks to what

| Component | Responsibility | Data Source | Communicates With |
|-----------|---------------|-------------|-------------------|
| `BaseLayout.astro` | HTML shell, `<head>`, nav, footer | Props: title, description, OG | Header, Footer, ThemeToggle |
| `BlogPostLayout.astro` | Wraps MDX blog posts | Collection entry frontmatter | BaseLayout |
| `FilmLayout.astro` | Wraps film case studies | Collection entry frontmatter | BaseLayout |
| `Header.astro` | Top nav, site title, theme toggle | Static (hardcoded nav links) | ThemeToggle |
| `ThemeToggle.astro` | Dark mode class on `<html>` | localStorage via inline script | None (self-contained) |
| `blog/index.astro` | Blog listing page | `getCollection('blog')` | PostCard, TagList |
| `blog/[slug].astro` | Individual post | `getCollection('blog')` → entry | BlogPostLayout, MDX slot |
| `films/index.astro` | Films listing | `getCollection('films')` | FilmCard |
| `films/[slug].astro` | Film case study | `getCollection('films')` → entry | FilmLayout, VideoEmbed, Credits, BehindTheScenes |
| `photos/index.astro` | Single-page gallery | JSON data or hardcoded sets | PhotoSet (repeated per set) |
| `PhotoSet.astro` | Expandable set section | Props: title, photos array | PhotoGrid |
| `PhotoGrid.astro` | Image grid inside set | Props: photos array | Native `<img>` or Astro Image |
| `projects/index.astro` | Projects grid | `getCollection('projects')` | ProjectCard |

**Key rule:** Pages query collections. Components receive data via props. No component queries a collection directly.

---

## Data Flow

### Content Collection Query Flow

```
src/content.config.ts
  defineCollection({ loader: glob(...), schema: z.object({...}) })
       |
       v
src/pages/[section]/index.astro
  getCollection('[name]')  →  Entry[]
  .sort() / .filter()
       |
       v
  <Card entry={entry} />   ← props, never direct collection access
       |
       v
  HTML at build time (zero JS unless island)
```

### Dark Mode Flow

```
ThemeToggle.astro (client:load island)
  onClick → toggle class 'dark' on document.html
           → persist to localStorage
       |
       v
  Tailwind dark: variants apply via CSS class selector
```

The initial theme read (to avoid flash) must happen in a blocking inline `<script>` in `BaseLayout.astro` `<head>` — before CSS renders. This is a critical sequencing detail.

### MDX Blog Post Flow

```
src/content/blog/my-post.mdx
  frontmatter: title, date, tags, description, draft
       |
       v
content.config.ts schema validates at build time
       |
       v
src/pages/blog/[slug].astro
  getStaticPaths() → all non-draft entries
  entry.render()   → { Content }
       |
       v
<BlogPostLayout>
  <Content />   ← MDX rendered as Astro component
</BlogPostLayout>
```

### Film Case Study Data Structure

```
src/content/films/my-film.mdx
  frontmatter:
    title, year, role, description
    videoUrl (YouTube/Vimeo embed URL)
    behindTheScenes: string[] (image paths)
    credits: { name, role }[]
    coverImage, tags
  body: full writeup in MDX
       |
       v
films/[slug].astro
  <VideoEmbed url={entry.data.videoUrl} />
  <Content />   ← MDX body
  <BehindTheScenes images={entry.data.behindTheScenes} />
  <Credits list={entry.data.credits} />
```

### Photo Gallery Data Flow

```
Option A (recommended): JSON content collection
  src/content/photosets/
    tokyo-2025.json → { title, coverImage, photos: [{src, alt, caption}] }
  getCollection('photosets') → PhotoSet[]
       |
       v
photos/index.astro
  render all sets, each inside <PhotoSet> with expand/collapse

Option B: hardcoded in page component
  Simpler for v1, harder to maintain as gallery grows
```

Recommendation: Use JSON content collection (Option A). Gives schema validation, type safety, and allows easy addition of new sets without touching page code.

---

## Astro 5 Specific Architecture Notes

### Content Layer API (Astro 5)

Astro 5 replaced the legacy `src/content/config.ts` with `src/content.config.ts` at the project root (or still works inside `src/`). The Content Layer API introduces explicit loaders:

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

const films = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/films' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    role: z.string(),
    description: z.string(),
    videoUrl: z.string().url(),
    coverImage: z.string(),
    behindTheScenes: z.array(z.string()).default([]),
    credits: z.array(z.object({ name: z.string(), role: z.string() })).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx,json}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const photosets = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/photosets' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    coverImage: z.string(),
    order: z.number().default(0),
    photos: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    })),
  }),
});

export const collections = { blog, films, projects, photosets };
```

**Confidence: MEDIUM** — The Content Layer API with `glob()` loader is confirmed Astro 5 (shipped Q4 2024). The exact import path `astro/loaders` was correct at training cutoff; verify against current docs before implementation.

### Static Paths Pattern

Every dynamic route requires `getStaticPaths()`:

```typescript
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.slug },  // Astro 5: may be post.id depending on loader
    props: { post },
  }));
}
```

**Note:** Astro 5 with the Content Layer API changed `entry.slug` to `entry.id` in some configurations. Verify which field to use for URL slugs — this is a known breaking change from Astro 4 to 5.

### Image Handling

Astro's built-in `<Image>` component from `astro:assets` handles optimization for images in `src/`. Images in `public/` are served as-is. For a photo gallery with potentially large sets, consider:

- Store photos in `public/images/photos/[set-name]/` for direct serving
- Or `src/assets/photos/` if you want Astro's image optimization pipeline

The tradeoff: `src/assets/` images are processed at build time (slower build, better output); `public/` images are copied verbatim (faster build, no optimization).

---

## Patterns to Follow

### Pattern 1: Layout Composition via Named Slots

Keep BaseLayout minimal. BlogPostLayout extends it rather than duplicating.

```astro
---
// BlogPostLayout.astro
import BaseLayout from './BaseLayout.astro';
const { title, date, tags } = Astro.props;
---
<BaseLayout title={title} description={...}>
  <article slot="main">
    <header>...</header>
    <slot />   <!-- MDX content renders here -->
  </article>
</BaseLayout>
```

### Pattern 2: Collection Query Filtering at the Page Level

Filter drafts, sort by date — always at the page level, not inside components.

```typescript
const posts = await getCollection('blog', ({ data }) => !data.draft);
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

### Pattern 3: Tag Aggregation Without a Database

For blog tag pages (`/blog/tags/[tag]`), derive all tags from collection at build time:

```typescript
const allPosts = await getCollection('blog', ({ data }) => !data.draft);
const tags = [...new Set(allPosts.flatMap(p => p.data.tags))];
```

### Pattern 4: Dark Mode Anti-Flash

Inline script in `<head>` before any CSS:

```html
<script is:inline>
  const theme = localStorage.getItem('theme') ?? 'dark';
  document.documentElement.classList.toggle('dark', theme === 'dark');
</script>
```

The `is:inline` directive prevents Astro from processing/deferring this script. Critical for dark mode correctness.

### Pattern 5: Photo Set Expand/Collapse Without Heavy JS

Use `<details>/<summary>` for zero-JS expand/collapse of photo sets. CSS can handle animation. Only reach for an Astro island if you need lightbox behavior.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Querying Collections Inside Components

**What:** Passing a collection name into a component and calling `getCollection()` inside it.
**Why bad:** Components receive props. Collection queries belong in pages. Mixing concerns makes data flow opaque and harder to type.
**Instead:** Query in `[slug].astro` or `index.astro`, pass typed data as props.

### Anti-Pattern 2: Putting Content Schema in Each Page File

**What:** Defining Zod schemas inline in page files instead of `content.config.ts`.
**Why bad:** Schemas lose their purpose — type safety and build-time validation only work if declared centrally.
**Instead:** All collection schemas live in `src/content.config.ts`.

### Anti-Pattern 3: Using `client:load` for Everything

**What:** Marking every interactive component `client:load`.
**Why bad:** Defeats Astro's zero-JS default. Ships unnecessary JS.
**Instead:** Dark mode toggle: `client:load`. GSAP scroll animations: `client:visible`. Static content: no directive.

### Anti-Pattern 4: One Giant Layout Component

**What:** `BaseLayout.astro` that contains blog-specific markup, film-specific markup, etc.
**Why bad:** Grows without bound. Conditional rendering of layout concerns couples unrelated sections.
**Instead:** Thin `BaseLayout` (head, nav, footer only), section-specific layouts extend it.

### Anti-Pattern 5: Images in `src/content/` as Relative Imports in Frontmatter

**What:** Using relative image paths in MDX frontmatter and expecting Astro to process them.
**Why bad:** Astro 5's image handling in content collection frontmatter requires `image()` schema helper, not plain strings. Plain strings work but skip optimization.
**Instead:** Use `z.string()` for `public/` image paths, or use Astro's `image()` schema helper for `src/` images with optimization.

---

## Suggested Build Order (Phase Dependencies)

```
Phase 1: Foundation
  BaseLayout.astro (HTML shell, head, nav, footer)
  global.css (Tailwind v4 setup, CSS custom properties, dark mode vars)
  ThemeToggle.astro (dark mode toggle, inline anti-flash script)
  content.config.ts (all 4 collection schemas)
  └─ Unblocks: everything else

Phase 2: Blog
  src/content/blog/ (MDX file structure, empty)
  BlogPostLayout.astro
  PostCard.astro, TagList.astro
  blog/index.astro, blog/[slug].astro
  └─ Requires: Phase 1
  └─ Unblocks: nothing (standalone section)

Phase 3: Films
  src/content/films/ (MDX file structure, empty)
  FilmLayout.astro
  VideoEmbed.astro, Credits.astro, BehindTheScenes.astro, FilmCard.astro
  films/index.astro, films/[slug].astro
  └─ Requires: Phase 1
  └─ Unblocks: nothing (standalone section)

Phase 4: Projects
  src/content/projects/ (JSON/MDX file structure, empty)
  ProjectCard.astro
  projects/index.astro
  └─ Requires: Phase 1
  └─ Unblocks: nothing (standalone section)

Phase 5: Photos
  src/content/photosets/ (JSON file structure, empty)
  PhotoSet.astro, PhotoGrid.astro
  photos/index.astro
  └─ Requires: Phase 1
  └─ Unblocks: nothing (standalone section)

Phase 6: About + Static Pages
  about.astro, index.astro (home/landing)
  └─ Requires: Phase 1
  └─ Often done last because home aggregates from other sections

Phase 7: Polish + SEO
  @astrojs/sitemap integration
  OG image strategy (static OG images in public/og/)
  GSAP install (no implementation)
  └─ Requires: all previous phases
```

**Rationale for this order:**
- BaseLayout must exist before any page renders
- `content.config.ts` schemas should be complete before any collection file is created (validation runs at build)
- Blog is typically the most complex dynamic route (MDX + tags + pagination potential) — tackle it early while the codebase is small
- Photos and Films can be built in any order after Foundation; they share no data
- Home page (`index.astro`) is deferred because it typically aggregates featured content from other sections — easier once those sections exist

---

## Scalability Considerations

This is a personal site — scale is not a concern for traffic. The relevant scalability question is **content scalability** (adding more posts/films/photos over time):

| Concern | Approach |
|---------|----------|
| Many blog posts | `getStaticPaths` scales to hundreds of posts; no pagination needed until 50+ posts |
| Many photo sets | JSON collections + `photos/index.astro` renders all sets; expand/collapse keeps page manageable |
| Build time | Pure static, Astro's build is fast; only concern is image optimization count — use `public/` for large photo sets to keep builds fast |
| Adding a new section | New collection in `content.config.ts` + new `pages/` directory; no changes to existing sections |

---

## Sources

- Astro 5 Content Layer API: training data (August 2025 cutoff) — MEDIUM confidence
- `glob()` loader, `src/content.config.ts` location: known Astro 5 patterns — MEDIUM confidence
- `entry.id` vs `entry.slug` breaking change: flagged from community discussions at training time — LOW confidence, verify before implementation
- Dark mode anti-flash `is:inline` pattern: well-established Astro pattern — HIGH confidence
- `<details>/<summary>` for expand/collapse: HTML standard, no verification needed — HIGH confidence
- `astro:assets` image optimization: Astro 4+ pattern, carried into Astro 5 — MEDIUM confidence

**Verification needed before implementation:**
- Exact import path for `glob` loader (`astro/loaders` vs `astro:loaders`)
- Whether `entry.slug` or `entry.id` is used in dynamic route params with Content Layer API
- `image()` helper availability in Astro 5 content schemas
- Tailwind v4 + Astro integration specifics (v4 uses `@import` not `@tailwind` directives)
