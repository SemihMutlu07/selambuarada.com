# Feature Landscape

**Domain:** Personal brand site — multidisciplinary creator (developer, filmmaker, photographer)
**Researched:** 2026-03-31
**Confidence:** MEDIUM — no live web search available; analysis draws from training knowledge of portfolio sites, personal brand patterns, and Astro ecosystem as of mid-2025. Flag individual items marked LOW.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| About page | First question any visitor has is "who is this person?" | Low | 1-2 screens, bio, photo, brief resume of disciplines |
| Navigation header | Standard wayfinding — visitors need orientation within seconds | Low | Top nav or persistent sidebar; links to all major sections |
| Blog with posts | Credibility signal; writing establishes voice and expertise | Medium | MDX content collection; index + individual post pages |
| Projects list | Core portfolio function for dev work | Low-Medium | Cards or list with title, tech stack, brief description, links |
| Responsive layout | Mobile traffic is ~55-60% of web globally; brutalist ≠ broken on mobile | Medium | Brutalist can still be readable; grid collapse required |
| Readable typography | Content-heavy sections (blog, film writeups) demand legible body text | Low | Geist is pre-chosen; line-height, measure, spacing matter |
| Dark mode | Expected on developer/creative sites; many users have OS preference set | Low-Medium | Class strategy already decided; toggle in header |
| Meta tags + OG images | Sharing on social/Slack/Discord is a real use pattern; missing OG = ugly unfurl | Medium | Static OG images acceptable for v1; sitemap handles SEO structure |
| Working external links | Projects link to GitHub, films link to Vimeo/YouTube — must open correctly | Low | target="_blank" + rel="noopener noreferrer" |
| Fast load / good Core Web Vitals | Visitors bounce in 3s; Astro's static output makes this achievable by default | Low | No special effort needed if images are handled correctly |

---

## Differentiators

Features that set this specific site apart. Not universally expected, but high value for the intended identity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Film case studies (not just embeds) | Depth over surface; shows process, craft, collaboration — rare on dev portfolios | Medium | Full page per film: embed + writeup + BTS photos + credits section |
| Curated photo gallery with expandable sets | Photography as first-class work, not decoration; "sets" framing communicates editorial intent | Medium | Single /photos page, accordion/expandable per series; avoids infinite scroll trap |
| Brutalist aesthetic executed well | Stands out from Vercel-template monoculture; signals strong design opinions | High | High complexity because brutalism done poorly reads as broken; requires conviction at every layout decision |
| Equal weight across disciplines | Most dev portfolios treat code as primary and everything else as side interests; this site refuses that hierarchy | Low-Medium | Content architecture and nav weight are the mechanism; no "also I do photography" buried in footer |
| GSAP polish layer | Scroll reveals and page transitions that feel intentional rather than gratuitous | Medium-High | Pre-approved but deferred to future phase; signals ambition without blocking v1 |
| Tag-based blog navigation | Lets visitors follow a specific interest thread (e.g., only film posts, only code posts) | Low | Astro content collection filtering; tag index page |
| Film credits section | Credits are a film industry norm; including them signals that collaborators matter | Low | Structured data in frontmatter, rendered as a styled list |
| Behind-the-scenes content on films | Shows process transparency; builds trust with potential collaborators | Low-Medium | Embedded photos or short write-sections within the case study page |

---

## Anti-Features

Features to deliberately NOT build. These are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Contact form | Spam magnet; adds backend complexity or third-party dependency; creates false expectation of responsiveness | Link to email directly; or a simple "mailto:" link in the footer |
| Comments on blog | Moderation burden, zero community at launch, adds database or third-party JS | Omit; if discussion happens it will be on social/HN/etc |
| Search functionality | Low ROI at personal-site scale; adds JS weight and complexity | Good tag taxonomy does the job for a content library this size |
| CMS admin UI | Already explicitly out of scope; content-in-files is correct for a solo creator | MDX + content collections is the right call |
| Analytics / tracking | Out of scope per PROJECT.md; also philosophically aligned with brutalist "no cruft" ethos | Omit; add later if a specific need emerges |
| Pagination on photos | Defeats the purpose of the curated-sets model; "all in one place" is the design intent | Expandable sections handle scale without pagination |
| "Hire me" / services page | This is a personal brand site, not a freelance pitch; mixing both creates identity confusion | Let the work speak; add a separate services page only if the site explicitly pivots |
| Skill bars / rating graphics | Universally mocked by engineers; communicates nothing meaningful | List technologies used in actual projects instead |
| Loading screens / splash pages | Adds friction; brutalism doesn't need ceremony | Go straight to content |
| Excessive third-party embeds | Each third-party script is a performance and privacy cost | YouTube/Vimeo embeds are acceptable for film; avoid embedding social feeds |
| Light/dark mode auto-detect only | Pure OS-preference-only mode removes user control; users may want to override | Class strategy with explicit toggle is correct |

---

## Feature Dependencies

```
Blog index page → Individual blog post page → Tag index → Tag filter results
Projects list page → Individual project page (optional — v1 may be cards only)
Films index → Individual film case study page → Credits section, BTS section, embedded video
Photos page → Photo set (expandable section) → Individual image lightbox (optional)
Dark mode toggle → Tailwind class strategy → All layout/typography/color decisions
Navigation header → All top-level pages exist (About, Blog, Projects, Films, Photos)
GSAP animations → All layout and page transitions stable (correct to defer this)
OG images → Each page has defined title/description meta (prerequisite for image generation)
Sitemap → All routes stable and known at build time (Astro sitemap integration)
```

---

## MVP Recommendation

Prioritize for v1 (what must ship to be a real site):

1. Base layout — header nav, footer, dark mode toggle
2. About page — who is this person
3. Blog — MDX collection, index, individual post, tag support
4. Projects — index page with cards
5. Films — index + individual case study page (embed + writeup + credits + BTS)
6. Photos — single page with expandable curated sets
7. SEO — sitemap, meta tags, static OG images

Defer from v1:
- GSAP animation implementation (install only — already decided)
- Individual project detail pages (cards linking to external repos may be sufficient)
- Image lightbox on photo sets (expandable sections are enough)
- Per-film BTS photo galleries (prose BTS section is sufficient)

The MVP above matches the PROJECT.md active requirements almost exactly. The only additions from this research are: explicit OG image handling per page, and the recommendation to include a tag index page (not just tag filtering) for blog navigation — both are low complexity.

---

## Complexity Notes for Phase Planning

| Feature | Complexity Driver |
|---------|-------------------|
| Film case study page | Structured frontmatter schema (embed URL, credits array, BTS array) needs careful definition upfront; schema mistakes cascade |
| Photo gallery with expandable sets | Image optimization is the real complexity — Astro's built-in `<Image>` handles it, but set schema (glob vs. explicit list) needs a decision |
| Brutalist aesthetic | Every component is a design decision; no off-the-shelf component library will match; expect iteration |
| Dark mode | Tailwind v4 has changed how dark mode is configured vs v3; verify the class strategy approach against v4 docs before implementing |
| OG images | Static OG images are simplest (just design a template image); dynamic generation (Satori) is deferred complexity |

---

## Sources

- Analysis based on: PROJECT.md context, training knowledge of Astro portfolio patterns, personal brand site conventions as of mid-2025
- Confidence: MEDIUM — core feature categorizations are well-established domain knowledge; specific Astro 5 / Tailwind v4 implementation notes are flagged as needing doc verification
- LOW confidence items: Tailwind v4 dark mode configuration specifics (verify against official docs before implementing)
