# Mycelium Network Projects Visualization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `/projects` card grid with an interactive Three.js 3D mycelium network where project nodes are connected by organic tendrils based on shared technologies, with visual maturity based on GitHub data.

**Architecture:** Build-time GitHub API fetch populates typed JSON inlined into the page. A vanilla Three.js module reads this JSON and renders an interactive 3D force-directed graph. Nodes represent repos, edges represent shared languages, and visual properties (size, brightness, tendril thickness) encode project maturity.

**Tech Stack:** Three.js (new dep), Astro build-time data fetching, vanilla TypeScript for client-side scene

---

## File Structure

```
src/
├── lib/
│   ├── github.ts              — Build-time: fetch repos + languages, compute maturity + edges
│   └── mycelium.ts            — Client-side: Three.js scene, layout, interaction, animation
├── pages/
│   └── projects/
│       └── index.astro        — Modified: data fetch in frontmatter, canvas mount, noscript fallback
```

**Why this structure:**
- `github.ts` runs only at build time (imported in .astro frontmatter). Pure data logic.
- `mycelium.ts` runs only in browser (imported via `<script>`). All Three.js code in one file — scene setup, force layout, rendering, interaction. One file because these are tightly coupled (scene references layout, interaction references scene objects). Splitting would create circular deps for ~300 lines of code.

---

### Task 1: Install Three.js and add .gitignore

**Files:**
- Modify: `package.json` (via npm)
- Create: `.gitignore`

- [ ] **Step 1: Install three.js**

```bash
npm install three
npm install -D @types/three
```

- [ ] **Step 2: Create .gitignore**

This project has no .gitignore. Create one with standard Astro ignores plus the brainstorm dir:

```gitignore
# Astro
dist/
.astro/

# Dependencies
node_modules/

# Environment
.env
.env.*

# Superpowers brainstorm sessions
.superpowers/

# OS
.DS_Store
```

- [ ] **Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds, same page count as before.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add three.js dependency and .gitignore"
```

---

### Task 2: GitHub data fetcher with maturity classification

**Files:**
- Create: `src/lib/github.ts`

This module runs at build time only. It fetches repos from GitHub API, computes maturity tiers, and builds connection edges.

- [ ] **Step 1: Create `src/lib/github.ts`**

```ts
export interface ProjectNode {
  name: string
  description: string | null
  url: string
  language: string | null
  languages: Record<string, number>
  stars: number
  updatedAt: string
  archived: boolean
  maturity: 'thriving' | 'healthy' | 'dormant' | 'seedling'
}

export interface ProjectEdge {
  source: number  // index into nodes array
  target: number
  weight: number  // count of shared languages
}

export interface ProjectGraph {
  nodes: ProjectNode[]
  edges: ProjectEdge[]
}

interface GithubRepo {
  name: string
  description: string | null
  html_url: string
  language: string | null
  fork: boolean
  archived: boolean
  stargazers_count: number
  updated_at: string
}

const GITHUB_USER = 'SemihMutlu07'

function computeMaturity(
  totalBytes: number,
  updatedAt: string,
): ProjectNode['maturity'] {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  )

  if (totalBytes > 100_000 && daysSinceUpdate <= 30) return 'thriving'
  if (totalBytes > 10_000 && daysSinceUpdate <= 90) return 'healthy'
  if (totalBytes < 1_000) return 'seedling'
  return 'dormant'
}

function computeEdges(nodes: ProjectNode[]): ProjectEdge[] {
  const edges: ProjectEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    const langsA = Object.keys(nodes[i].languages)
    for (let j = i + 1; j < nodes.length; j++) {
      const langsB = Object.keys(nodes[j].languages)
      const shared = langsA.filter((l) => langsB.includes(l))
      if (shared.length > 0) {
        edges.push({ source: i, target: j, weight: shared.length })
      }
    }
  }
  return edges
}

export async function fetchProjectGraph(): Promise<ProjectGraph> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (import.meta.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`
  }

  // Fetch repos
  const reposRes = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers },
  )
  const repos: GithubRepo[] = await reposRes.json()

  // Filter: non-fork only
  const filtered = repos.filter((r) => !r.fork)

  // Fetch languages for each repo
  const nodes: ProjectNode[] = await Promise.all(
    filtered.map(async (repo) => {
      const langRes = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/languages`,
        { headers },
      )
      const languages: Record<string, number> = await langRes.json()
      const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)

      return {
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        languages,
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
        archived: repo.archived,
        maturity: computeMaturity(totalBytes, repo.updated_at),
      }
    }),
  )

  return { nodes, edges: computeEdges(nodes) }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx astro check
```

Expected: No type errors in `github.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub data fetcher with maturity classification"
```

---

### Task 3: Three.js mycelium scene module

**Files:**
- Create: `src/lib/mycelium.ts`

This is the client-side module. It handles: force-directed layout, scene setup, node/tendril rendering, particle animation, hover/click interaction, dark mode reactivity.

- [ ] **Step 1: Create `src/lib/mycelium.ts`**

```ts
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// ── Types ──────────────────────────────────────────────

interface ProjectNode {
  name: string
  description: string | null
  url: string
  language: string | null
  maturity: 'thriving' | 'healthy' | 'dormant' | 'seedling'
}

interface ProjectEdge {
  source: number
  target: number
  weight: number
}

interface GraphData {
  nodes: ProjectNode[]
  edges: ProjectEdge[]
}

interface NodeMesh extends THREE.Mesh {
  userData: { index: number; node: ProjectNode }
}

// ── Maturity config ────────────────────────────────────

const MATURITY = {
  thriving: { radius: 1.0, opacity: 0.95, emissive: 1.0, pulse: true, particleSpeed: 0.003 },
  healthy:  { radius: 0.7, opacity: 0.75, emissive: 0.6, pulse: true, particleSpeed: 0.002 },
  dormant:  { radius: 0.4, opacity: 0.45, emissive: 0.3, pulse: false, particleSpeed: 0.001 },
  seedling: { radius: 0.2, opacity: 0.25, emissive: 0.1, pulse: false, particleSpeed: 0 },
} as const

// ── Force-directed layout ──────────────────────────────

function computeLayout(
  nodeCount: number,
  edges: ProjectEdge[],
  iterations = 200,
): THREE.Vector3[] {
  // Initialize random positions in a sphere
  const positions = Array.from({ length: nodeCount }, () =>
    new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ),
  )

  const repulsion = 50
  const springLength = 8
  const springStrength = 0.05
  const damping = 0.9

  const velocities = Array.from({ length: nodeCount }, () => new THREE.Vector3())
  const force = new THREE.Vector3()

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        force.copy(positions[i]).sub(positions[j])
        const dist = Math.max(force.length(), 0.1)
        force.normalize().multiplyScalar(repulsion / (dist * dist))
        velocities[i].add(force)
        velocities[j].sub(force)
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      force.copy(positions[edge.target]).sub(positions[edge.source])
      const dist = force.length()
      const displacement = dist - springLength
      force.normalize().multiplyScalar(displacement * springStrength * edge.weight)
      velocities[edge.source].add(force)
      velocities[edge.target].sub(force)
    }

    // Apply velocities with damping
    for (let i = 0; i < nodeCount; i++) {
      velocities[i].multiplyScalar(damping)
      positions[i].add(velocities[i])
    }
  }

  return positions
}

// ── Tendril curve generation ───────────────────────────

function createTendrilCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
): THREE.QuadraticBezierCurve3 {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  // Offset midpoint perpendicular for organic feel
  const offset = new THREE.Vector3(
    (Math.random() - 0.5) * 3,
    (Math.random() - 0.5) * 3,
    (Math.random() - 0.5) * 3,
  )
  mid.add(offset)
  return new THREE.QuadraticBezierCurve3(start, mid, end)
}

// ── Main init ──────────────────────────────────────────

export function initMycelium(
  container: HTMLElement,
  tooltip: HTMLElement,
  data: GraphData,
): { dispose: () => void } {
  const isDark = () => document.documentElement.classList.contains('dark')
  const getNodeColor = () => (isDark() ? 0xffffff : 0x1a1a1a)
  const getTendrilColor = () => (isDark() ? 0xffffff : 0x1a1a1a)

  // ── Scene setup ────────────────────────────────────
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  )
  camera.position.set(0, 0, 35)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3

  // Ambient light for depth
  scene.add(new THREE.AmbientLight(0xffffff, 0.1))

  // ── Build graph ────────────────────────────────────
  const positions = computeLayout(data.nodes.length, data.edges)
  const nodeMeshes: NodeMesh[] = []
  const tendrilLines: THREE.Line[] = []
  const particleSystems: { points: THREE.Points; curve: THREE.QuadraticBezierCurve3; speed: number; progress: Float32Array }[] = []

  // Create node meshes
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i]
    const config = MATURITY[node.maturity]
    const geometry = new THREE.SphereGeometry(config.radius, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: getNodeColor(),
      transparent: true,
      opacity: config.opacity,
    })
    const mesh = new THREE.Mesh(geometry, material) as NodeMesh
    mesh.position.copy(positions[i])
    mesh.userData = { index: i, node }
    scene.add(mesh)
    nodeMeshes.push(mesh)
  }

  // Create tendrils and particles
  for (const edge of data.edges) {
    const curve = createTendrilCurve(positions[edge.source], positions[edge.target])
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: getTendrilColor(),
      transparent: true,
      opacity: 0.15 + edge.weight * 0.08,
    })
    const line = new THREE.Line(geometry, material)
    scene.add(line)
    tendrilLines.push(line)

    // Particles along tendril
    const sourceMaturity = data.nodes[edge.source].maturity
    const speed = MATURITY[sourceMaturity].particleSpeed
    if (speed > 0) {
      const particleCount = 3
      const particleGeom = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(particleCount * 3)
      const progress = new Float32Array(particleCount)
      for (let p = 0; p < particleCount; p++) {
        progress[p] = Math.random()
        const pt = curve.getPoint(progress[p])
        particlePositions[p * 3] = pt.x
        particlePositions[p * 3 + 1] = pt.y
        particlePositions[p * 3 + 2] = pt.z
      }
      particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particleMat = new THREE.PointsMaterial({
        color: getNodeColor(),
        size: 0.15,
        transparent: true,
        opacity: 0.4,
      })
      const particlePoints = new THREE.Points(particleGeom, particleMat)
      scene.add(particlePoints)
      particleSystems.push({ points: particlePoints, curve, speed, progress })
    }
  }

  // ── Raycaster for interaction ──────────────────────
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let hoveredNode: NodeMesh | null = null
  let isAnimatingClick = false

  function onPointerMove(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeMeshes)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as NodeMesh
      if (hoveredNode !== mesh) {
        resetHover()
        hoveredNode = mesh
        applyHover(mesh)
      }
      // Position tooltip
      tooltip.style.left = `${event.clientX - renderer.domElement.getBoundingClientRect().left + 12}px`
      tooltip.style.top = `${event.clientY - renderer.domElement.getBoundingClientRect().top - 10}px`
    } else {
      if (hoveredNode) {
        resetHover()
        hoveredNode = null
      }
    }
  }

  function applyHover(mesh: NodeMesh) {
    const { node } = mesh.userData
    mesh.scale.setScalar(1.3)
    ;(mesh.material as THREE.MeshBasicMaterial).opacity = 1.0

    // Dim non-connected nodes
    for (const other of nodeMeshes) {
      if (other === mesh) continue
      const isConnected = data.edges.some(
        (e) =>
          (e.source === mesh.userData.index && e.target === other.userData.index) ||
          (e.target === mesh.userData.index && e.source === other.userData.index),
      )
      if (!isConnected) {
        ;(other.material as THREE.MeshBasicMaterial).opacity = 0.15
      }
    }

    // Show tooltip
    const desc = node.description
      ? node.description.length > 80
        ? node.description.slice(0, 77) + '...'
        : node.description
      : 'No description'
    tooltip.innerHTML = `
      <strong>${node.name}</strong><br/>
      <span style="opacity:0.7">${node.language || 'Unknown'}</span><br/>
      <span style="opacity:0.5;font-size:0.8em">${desc}</span><br/>
      <span style="opacity:0.4;font-size:0.75em;text-transform:uppercase">${node.maturity}</span>
    `
    tooltip.style.display = 'block'
  }

  function resetHover() {
    for (let i = 0; i < nodeMeshes.length; i++) {
      const mesh = nodeMeshes[i]
      const config = MATURITY[data.nodes[i].maturity]
      mesh.scale.setScalar(1.0)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = config.opacity
    }
    tooltip.style.display = 'none'
  }

  function onClick(event: PointerEvent) {
    if (isAnimatingClick || !hoveredNode) return
    const targetNode = hoveredNode.userData.node
    const targetPos = hoveredNode.position.clone()

    isAnimatingClick = true
    controls.autoRotate = false

    // Zoom toward node
    const startPos = camera.position.clone()
    const zoomTarget = targetPos.clone().add(
      camera.position.clone().sub(targetPos).normalize().multiplyScalar(5),
    )

    let t = 0
    function animateZoom() {
      t += 0.03
      if (t < 1) {
        camera.position.lerpVectors(startPos, zoomTarget, easeInOut(t))
        camera.lookAt(targetPos)
        requestAnimationFrame(animateZoom)
      } else {
        // Pause then navigate
        setTimeout(() => {
          window.open(targetNode.url, '_blank')
          // Ease back
          let tBack = 0
          function animateBack() {
            tBack += 0.02
            if (tBack < 1) {
              camera.position.lerpVectors(zoomTarget, startPos, easeInOut(tBack))
              camera.lookAt(scene.position)
              requestAnimationFrame(animateBack)
            } else {
              controls.autoRotate = true
              isAnimatingClick = false
            }
          }
          animateBack()
        }, 300)
      }
    }
    animateZoom()
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.style.cursor = 'grab'

  // ── Dark mode observer ─────────────────────────────
  const observer = new MutationObserver(() => {
    const color = getNodeColor()
    const tendrilColor = getTendrilColor()
    for (const mesh of nodeMeshes) {
      ;(mesh.material as THREE.MeshBasicMaterial).color.set(color)
    }
    for (const line of tendrilLines) {
      ;(line.material as THREE.LineBasicMaterial).color.set(tendrilColor)
    }
    for (const ps of particleSystems) {
      ;(ps.points.material as THREE.PointsMaterial).color.set(color)
    }
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  // ── Animation loop ─────────────────────────────────
  let time = 0
  let animId: number

  function animate() {
    animId = requestAnimationFrame(animate)
    time += 0.01

    // Pulse thriving/healthy nodes
    for (let i = 0; i < nodeMeshes.length; i++) {
      const config = MATURITY[data.nodes[i].maturity]
      if (config.pulse && hoveredNode !== nodeMeshes[i]) {
        const scale = 1 + Math.sin(time * 2 + i) * 0.05
        nodeMeshes[i].scale.setScalar(scale)
      }
    }

    // Animate particles along tendrils
    for (const ps of particleSystems) {
      const posAttr = ps.points.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let p = 0; p < ps.progress.length; p++) {
        ps.progress[p] = (ps.progress[p] + ps.speed) % 1
        const pt = ps.curve.getPoint(ps.progress[p])
        posAttr.setXYZ(p, pt.x, pt.y, pt.z)
      }
      posAttr.needsUpdate = true
    }

    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // ── Resize handler ─────────────────────────────────
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onResize)

  // ── Cleanup ────────────────────────────────────────
  return {
    dispose() {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onClick)
      observer.disconnect()
      renderer.dispose()
      controls.dispose()
    },
  }
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx astro check
```

Expected: No errors in `mycelium.ts`. There may be warnings about Three.js types — those are fine.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mycelium.ts
git commit -m "feat: add Three.js mycelium visualization module"
```

---

### Task 4: Wire up the projects page

**Files:**
- Modify: `src/pages/projects/index.astro`

Replace the static card grid with the Three.js canvas, data injection, and noscript fallback.

- [ ] **Step 1: Rewrite `src/pages/projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { fetchProjectGraph } from '../../lib/github';

const graph = await fetchProjectGraph();
const projects = await getCollection('projects');
---

<BaseLayout title="Projects" description="Software I've built and shipped.">
  <h1 class="text-5xl md:text-7xl font-bold tracking-tight">Projects</h1>
  <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">Software I've built and shipped.</p>

  <div id="mycelium-container" class="relative mt-12 w-full" style="height: 70vh;">
    <div
      id="project-tooltip"
      class="absolute z-10 hidden pointer-events-none px-3 py-2 border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm max-w-xs"
    ></div>
  </div>

  <noscript>
    {projects.length === 0 ? (
      <p class="mt-12 text-neutral-600 dark:text-neutral-400">No projects yet.</p>
    ) : (
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {projects.map((project) => (
          <div class="border-2 border-neutral-900 dark:border-neutral-100 p-6">
            <h2 class="text-2xl font-bold">{project.data.title}</h2>
            <p class="mt-2 text-neutral-600 dark:text-neutral-400">{project.data.description}</p>
            <div class="flex flex-wrap gap-2 mt-4">
              {project.data.tech.map((item) => (
                <span class="text-xs font-bold uppercase tracking-wider border border-neutral-400 dark:border-neutral-600 px-2 py-1">
                  {item}
                </span>
              ))}
            </div>
            <div class="flex gap-4 mt-4">
              {project.data.url && (
                <a href={project.data.url} target="_blank" rel="noopener" class="text-sm font-bold uppercase underline">Visit</a>
              )}
              {project.data.github && (
                <a href={project.data.github} target="_blank" rel="noopener" class="text-sm font-bold uppercase underline">GitHub</a>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </noscript>

  <script type="application/json" id="project-graph-data" set:html={JSON.stringify(graph)} />

  <script>
    import { initMycelium } from '../../lib/mycelium'

    const container = document.getElementById('mycelium-container')!
    const tooltip = document.getElementById('project-tooltip')!
    const dataEl = document.getElementById('project-graph-data')!
    const data = JSON.parse(dataEl.textContent!)

    const { dispose } = initMycelium(container, tooltip, data)

    // Cleanup on navigation (Astro view transitions)
    document.addEventListener('astro:before-swap', () => dispose(), { once: true })
  </script>
</BaseLayout>
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: Build succeeds. The GitHub API is called during build to fetch repos. Check output for the projects page being generated.

- [ ] **Step 3: Preview and visually verify**

```bash
npm run preview
```

Open `http://localhost:4321/projects` in a browser. Verify:
- 3D scene renders with nodes for each GitHub repo
- Nodes are connected by tendrils
- Hovering shows tooltip with project name/description
- Clicking zooms in and opens GitHub in new tab
- Dark/light mode toggle updates node colors
- Auto-orbit is working

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "feat: wire mycelium visualization into projects page"
```

---

### Task 5: Polish and mobile handling

**Files:**
- Modify: `src/lib/mycelium.ts`
- Modify: `src/pages/projects/index.astro`

- [ ] **Step 1: Add mobile touch handling and reduced resolution**

In `src/lib/mycelium.ts`, after `renderer.setPixelRatio(...)`, add mobile detection:

```ts
// After: renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
const isMobile = window.innerWidth < 768
if (isMobile) {
  renderer.setPixelRatio(1) // Reduce for performance
}
```

- [ ] **Step 2: Add cursor feedback**

In the `onPointerMove` handler, after checking intersects, update cursor:

```ts
renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab'
```

- [ ] **Step 3: Add a loading state in the container**

In `src/pages/projects/index.astro`, inside the `mycelium-container` div, before the tooltip div, add:

```html
<p id="mycelium-loading" class="absolute inset-0 flex items-center justify-center text-neutral-400 font-mono text-sm">
  Loading network...
</p>
```

Then in the `<script>` block, after `initMycelium(...)`, remove the loading indicator:

```ts
document.getElementById('mycelium-loading')?.remove()
```

- [ ] **Step 4: Build and verify**

```bash
npm run build && npm run preview
```

Test on mobile viewport (DevTools responsive mode). Verify scene renders at lower resolution and touch drag works.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mycelium.ts src/pages/projects/index.astro
git commit -m "feat: add mobile handling, cursor feedback, and loading state"
```

---

### Task 6: Final build verification and typecheck

**Files:** None (verification only)

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck && npm run lint
```

Fix any errors.

- [ ] **Step 2: Clean build**

```bash
rm -rf dist && npm run build
```

Expected: Clean build with no warnings. Projects page generated with inlined graph data.

- [ ] **Step 3: Preview full site**

```bash
npm run preview
```

Navigate through all pages to confirm no regressions:
- `/` — Home
- `/blog` — Blog index
- `/blog/sample-post` — Blog post
- `/projects` — Mycelium visualization (the new feature)
- `/films` — Films index
- `/photos` — Photos gallery
- `/about` — About page

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address typecheck and build issues"
```

Only commit if there were changes. Skip if clean.
