# Mycelium Network — Projects Visualization

Replace the static `/projects` card grid with an interactive Three.js 3D visualization. Projects appear as glowing nodes in an organic mycelium network, connected by tendrils based on shared technologies. Node size, brightness, and tendril thickness reflect project maturity derived from GitHub API data at build time.

## Data Source

**GitHub API at build time** via Astro's static data fetching. No client-side API calls.

- Fetch all non-fork repos from `SemihMutlu07` using `gh api` or `fetch` against `api.github.com`
- For each repo, fetch `/repos/{owner}/{repo}/languages` for tech breakdown
- Store as typed JSON consumed by the Astro page

**Schema per project node:**

```ts
interface ProjectNode {
  name: string
  description: string | null
  url: string              // html_url from GitHub
  language: string | null  // primary language
  languages: Record<string, number>  // all languages with byte counts
  stars: number
  updatedAt: string        // ISO date
  archived: boolean
  maturity: 'thriving' | 'healthy' | 'dormant' | 'seedling'
}
```

**Maturity classification (computed at build time):**

| Tier | Criteria |
|------|----------|
| Thriving | Total bytes > 100k AND updated within 30 days |
| Healthy | Total bytes > 10k AND updated within 90 days |
| Dormant | Updated > 90 days ago OR total bytes < 10k but has commits |
| Seedling | No language data OR total bytes < 1k |

**Connection edges:**

Two projects share an edge if they have at least one language in common. Edge weight = count of shared languages. This determines tendril thickness.

## Three.js Scene

**Technology:** Three.js imported as a dependency. Rendered in a `<canvas>` element inside an Astro client-side island (`client:only="react"` or vanilla JS with `client:load`).

**Preferred approach:** Vanilla Three.js in a `<script>` tag or standalone `.ts` module — no React wrapper needed. Use Astro's `client:load` directive on a custom element or mount directly.

**Scene composition:**

- **Background:** Transparent (inherits page background — white in light mode, near-black in dark mode)
- **Camera:** Perspective camera, slow auto-orbit via simple sine/cosine on camera position. User can drag to rotate (OrbitControls).
- **Nodes:** `SphereGeometry` or `Points` with custom shader material for glow effect. Size mapped to maturity tier (thriving=large, seedling=tiny).
- **Tendrils:** `Line2` or `TubeGeometry` following quadratic bezier curves between connected nodes. Thickness = shared language count.
- **Particles:** Small points that drift along tendril paths using shader animation or position updates. Speed correlates with commit recency.
- **Lighting:** Minimal — nodes are self-illuminated (emissive material). Subtle ambient light for depth.

**Layout algorithm:** Force-directed graph in 3D space, computed once at load time. Projects with more shared tech cluster together naturally. Use a simple spring simulation (no external physics library needed for ~20 nodes):

- Repulsion between all nodes (inverse square)
- Attraction along edges (spring force, stronger for higher shared tech count)
- Run ~200 iterations at load, then freeze positions

## Node Visual Properties by Maturity

| Property | Thriving | Healthy | Dormant | Seedling |
|----------|----------|---------|---------|----------|
| Radius | 1.0 | 0.7 | 0.4 | 0.2 |
| Opacity | 0.95 | 0.75 | 0.45 | 0.25 |
| Emissive intensity | 1.0 | 0.6 | 0.3 | 0.1 |
| Pulse animation | Yes, slow | Yes, subtle | No | No |
| Particle flow | Fast | Medium | Slow | None |

## Interaction

**Hover (raycaster):**
- Hovered node scales up 1.3x, brightness increases
- Connected tendrils glow brighter
- Non-connected nodes dim to 30% opacity
- HTML tooltip appears near cursor (CSS-positioned div overlay, not in-scene text):
  - Project name (bold, monospace)
  - Primary language
  - Description (truncated to ~80 chars)
  - Maturity tier label

**Click:**
- Camera lerps toward clicked node over ~500ms
- Brief pause at close-up (~300ms)
- `window.open(project.url, '_blank')` — opens GitHub repo
- Camera eases back to orbit position over ~800ms

**Idle:**
- Camera orbits slowly (configurable speed, ~0.001 rad/frame)
- Particles drift along tendrils
- Nodes pulse gently (thriving/healthy only)

**Mobile:** Touch support via OrbitControls. Tap = hover + click combined (show tooltip, second tap navigates). Scene renders at reduced resolution on mobile for performance.

## Dark/Light Mode

- Nodes: White in dark mode, dark gray (#1a1a1a) in light mode
- Tendrils: White with opacity in dark mode, dark gray with opacity in light mode
- Read the `dark` class on `<html>` at mount time and on `MutationObserver` for toggle
- Background: Transparent canvas — page background shows through

## Page Structure

Replace current `/projects/index.astro` content:

```
BaseLayout
├── <h1> "Projects"
├── <p> subtitle
├── <div id="mycelium-canvas"> (full-width, ~70vh height)
│   └── Three.js canvas (fills container)
├── <div id="project-tooltip"> (absolutely positioned, hidden by default)
└── <noscript> fallback: simple project list (current card grid)
```

The `<noscript>` fallback ensures the page works without JS — shows the existing card grid as a static fallback.

## Build Pipeline

1. At `npm run build`, an Astro data-fetching script calls GitHub API
2. Fetches repos + languages, computes maturity, computes edges
3. Outputs typed JSON inlined into the page as a `<script type="application/json">` block
4. Client-side Three.js reads this JSON to build the scene

**GitHub API auth:** Use `GITHUB_TOKEN` env var if available (for higher rate limits), fall back to unauthenticated (60 req/hr — fine for ~20 repos at build time).

**Rebuild trigger:** GitHub Action that rebuilds the site on push to any repo (via repository_dispatch or a cron schedule).

## New Dependency

- `three` (Three.js) — required, no way around it for 3D
- No other deps needed. OrbitControls ships with Three.js (`three/addons/controls/OrbitControls.js`)

## Performance Budget

- Three.js bundle: ~150kb gzipped (tree-shaken)
- Scene with 20 nodes: <2MB GPU memory
- Target: 60fps on desktop, 30fps on mobile
- Canvas lazy-loads below fold if needed (IntersectionObserver)

## Out of Scope

- Real-time GitHub API calls in browser
- Per-project detail pages on this site (click goes to GitHub)
- Filtering/search within the visualization
- Sound/audio
- VR/AR support
