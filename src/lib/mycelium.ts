import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { ProjectGraph, ProjectNode } from './github'

// ── Types ──────────────────────────────────────────────

interface GraphNode extends SimulationNodeDatum {
  index: number
  node: ProjectNode
  radius: number
  opacity: number
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  weight: number
}

export interface MyceliumSettings {
  colorMode: 'language' | 'mono'
  showLabels: boolean
}

// ── Constants ──────────────────────────────────────────

const MATURITY = {
  thriving: { radius: 24, opacity: 1.0, glowRadius: 42, pulseAmp: 3 },
  healthy:  { radius: 17, opacity: 0.9, glowRadius: 30, pulseAmp: 2 },
  dormant:  { radius: 12, opacity: 0.7, glowRadius: 20, pulseAmp: 0 },
  seedling: { radius: 8,  opacity: 0.5, glowRadius: 12, pulseAmp: 0 },
} as const

// ── Helpers ────────────────────────────────────────────

function loadSettings(): MyceliumSettings {
  try {
    const raw = localStorage.getItem('mycelium-settings')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { colorMode: 'language', showLabels: false }
}

function saveSettings(s: MyceliumSettings) {
  localStorage.setItem('mycelium-settings', JSON.stringify(s))
}

function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

function monoColor(): string {
  return isDark() ? '#ffffff' : '#1a1a1a'
}

function bgColor(): string {
  return isDark() ? '#0a0a0a' : '#ffffff'
}

// ── Main ───────────────────────────────────────────────

export function initMycelium(
  container: HTMLElement,
  tooltip: HTMLElement,
  data: ProjectGraph,
): { dispose: () => void; updateSettings: (s: MyceliumSettings) => void } {
  let settings = loadSettings()
  let dpr = Math.min(window.devicePixelRatio, 2)
  let width = container.clientWidth
  let height = container.clientHeight
  let hoveredIndex: number | null = null
  let animId: number

  // ── Canvas setup ───────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.cursor = 'grab'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  function resizeCanvas() {
    width = container.clientWidth
    height = container.clientHeight
    dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resizeCanvas()

  // ── Build graph data ───────────────────────────────
  const nodes: GraphNode[] = data.nodes.map((n, i) => {
    const cfg = MATURITY[n.maturity]
    return {
      index: i,
      node: n,
      radius: cfg.radius,
      opacity: cfg.opacity,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
    }
  })

  const links: GraphLink[] = data.edges.map((e) => ({
    source: nodes[e.source],
    target: nodes[e.target],
    weight: e.weight,
  }))

  // ── Adjacency for hover ────────────────────────────
  const adjacency = new Map<number, Set<number>>()
  for (const e of data.edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set())
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set())
    adjacency.get(e.source)!.add(e.target)
    adjacency.get(e.target)!.add(e.source)
  }

  // ── D3 force simulation ────────────────────────────
  const simulation = forceSimulation(nodes)
    .force('link', forceLink<GraphNode, GraphLink>(links)
      .distance(180)
      .strength((d) => 0.3 * d.weight))
    .force('charge', forceManyBody().strength(-600))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide<GraphNode>().radius((d) => d.radius + 14))
    .alphaDecay(0.02)
    .on('tick', () => {}) // we draw in our own loop

  // Let simulation settle
  for (let i = 0; i < 200; i++) simulation.tick()
  simulation.stop()

  // ── Color helpers ──────────────────────────────────
  function nodeColor(i: number, alpha = 1): string {
    if (settings.colorMode === 'language') {
      const hex = nodes[i].node.color
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }
    const c = monoColor()
    if (alpha === 1) return c
    const r = parseInt(c.slice(1, 3), 16)
    const g = parseInt(c.slice(3, 5), 16)
    const b = parseInt(c.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  // ── Draw ───────────────────────────────────────────
  const startTime = performance.now()

  function draw() {
    const elapsed = (performance.now() - startTime) / 1000
    ctx.clearRect(0, 0, width, height)

    const connected = hoveredIndex !== null
      ? (adjacency.get(hoveredIndex) ?? new Set())
      : null

    // Draw links
    for (const link of links) {
      const s = link.source as GraphNode
      const t = link.target as GraphNode

      const isHighlighted = hoveredIndex !== null &&
        (s.index === hoveredIndex || t.index === hoveredIndex)
      const isDimmed = hoveredIndex !== null && !isHighlighted

      if (settings.colorMode === 'language') {
        // Gradient colored connection
        const grad = ctx.createLinearGradient(s.x!, s.y!, t.x!, t.y!)
        const alphaBase = isDimmed ? 0.04 : isHighlighted ? 0.6 : 0.2
        const alpha = alphaBase + link.weight * 0.05
        grad.addColorStop(0, nodeColor(s.index, alpha))
        grad.addColorStop(1, nodeColor(t.index, alpha))
        ctx.strokeStyle = grad
      } else {
        const alpha = isDimmed ? 0.04 : isHighlighted ? 0.5 : 0.15
        ctx.strokeStyle = nodeColor(s.index, alpha + link.weight * 0.05)
      }

      ctx.lineWidth = isHighlighted ? 1.5 + link.weight * 0.5 : 0.8 + link.weight * 0.3
      ctx.beginPath()
      ctx.moveTo(s.x!, s.y!)

      // Slight curve for organic feel
      const mx = (s.x! + t.x!) / 2 + (s.index - t.index) * 2
      const my = (s.y! + t.y!) / 2 + (t.index - s.index) * 2
      ctx.quadraticCurveTo(mx, my, t.x!, t.y!)
      ctx.stroke()
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      const cfg = MATURITY[n.node.maturity]
      const isHovered = hoveredIndex === i
      const isConnected = connected?.has(i) ?? false
      const isDimmed = hoveredIndex !== null && !isHovered && !isConnected

      let alpha = isDimmed ? 0.12 : n.opacity
      let radius = n.radius

      // Pulse for thriving/healthy
      if (cfg.pulseAmp > 0 && !isDimmed) {
        radius += Math.sin(elapsed * 1.5 + i * 0.7) * cfg.pulseAmp
      }

      if (isHovered) {
        radius *= 1.15
        alpha = 1
      }

      // Glow
      if (!isDimmed) {
        const glowGrad = ctx.createRadialGradient(n.x!, n.y!, radius * 0.5, n.x!, n.y!, cfg.glowRadius)
        glowGrad.addColorStop(0, nodeColor(i, alpha * 0.35))
        glowGrad.addColorStop(1, nodeColor(i, 0))
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(n.x!, n.y!, cfg.glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Node circle
      ctx.fillStyle = nodeColor(i, alpha)
      ctx.beginPath()
      ctx.arc(n.x!, n.y!, radius, 0, Math.PI * 2)
      ctx.fill()

      // Inner highlight
      if (!isDimmed) {
        const innerGrad = ctx.createRadialGradient(
          n.x! - radius * 0.3, n.y! - radius * 0.3, 0,
          n.x!, n.y!, radius,
        )
        innerGrad.addColorStop(0, `rgba(255,255,255,${alpha * 0.3})`)
        innerGrad.addColorStop(1, `rgba(255,255,255,0)`)
        ctx.fillStyle = innerGrad
        ctx.beginPath()
        ctx.arc(n.x!, n.y!, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Label
      if (settings.showLabels && !isDimmed) {
        ctx.font = `bold ${isHovered ? 13 : 11}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Text shadow for readability
        const textY = n.y! + radius + 6
        ctx.fillStyle = bgColor()
        ctx.fillText(n.node.name, n.x! + 1, textY + 1)
        ctx.fillStyle = nodeColor(i, isDimmed ? 0.3 : 0.9)
        ctx.fillText(n.node.name, n.x!, textY)
      }
    }

    animId = requestAnimationFrame(draw)
  }

  draw()

  // ── Interaction ────────────────────────────────────
  function getNodeAtPoint(cx: number, cy: number): number | null {
    // Check in reverse (topmost first)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      const dx = cx - n.x!
      const dy = cy - n.y!
      if (dx * dx + dy * dy <= n.radius * n.radius) return i
    }
    return null
  }

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const cx = event.clientX - rect.left
    const cy = event.clientY - rect.top
    const idx = getNodeAtPoint(cx, cy)

    hoveredIndex = idx

    if (idx !== null) {
      canvas.style.cursor = 'pointer'
      const node = nodes[idx].node

      tooltip.textContent = ''
      const nameEl = document.createElement('strong')
      nameEl.textContent = node.name
      tooltip.appendChild(nameEl)
      if (node.language) {
        tooltip.appendChild(document.createElement('br'))
        const langEl = document.createElement('span')
        langEl.style.opacity = '0.7'
        langEl.textContent = node.language
        tooltip.appendChild(langEl)
      }
      if (node.description) {
        tooltip.appendChild(document.createElement('br'))
        const descEl = document.createElement('em')
        descEl.style.opacity = '0.6'
        descEl.textContent = node.description.length > 80
          ? node.description.slice(0, 77) + '...'
          : node.description
        tooltip.appendChild(descEl)
      }
      tooltip.appendChild(document.createElement('br'))
      const matEl = document.createElement('span')
      matEl.style.opacity = '0.4'
      matEl.style.textTransform = 'capitalize'
      matEl.style.fontSize = '0.8em'
      matEl.textContent = node.maturity
      tooltip.appendChild(matEl)

      tooltip.style.left = `${cx + 16}px`
      tooltip.style.top = `${cy - 10}px`
      tooltip.style.display = 'block'
    } else {
      canvas.style.cursor = 'grab'
      tooltip.style.display = 'none'
    }
  }

  function onClick() {
    if (hoveredIndex !== null) {
      window.open(nodes[hoveredIndex].node.url, '_blank')
    }
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('click', onClick)

  // ── Drag ───────────────────────────────────────────
  let dragNode: GraphNode | null = null

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect()
    const idx = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top)
    if (idx !== null) {
      dragNode = nodes[idx]
      dragNode.fx = dragNode.x
      dragNode.fy = dragNode.y
      simulation.alphaTarget(0.3).restart()
      canvas.style.cursor = 'grabbing'
    }
  })

  canvas.addEventListener('pointermove', (e) => {
    if (dragNode) {
      const rect = canvas.getBoundingClientRect()
      dragNode.fx = e.clientX - rect.left
      dragNode.fy = e.clientY - rect.top
    }
  })

  function onPointerUp() {
    if (dragNode) {
      dragNode.fx = null
      dragNode.fy = null
      dragNode = null
      simulation.alphaTarget(0)
      canvas.style.cursor = 'grab'
    }
  }

  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  // ── Dark mode observer ─────────────────────────────
  const observer = new MutationObserver(() => {
    // Colors recompute on next draw() frame automatically
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  // ── Resize ─────────────────────────────────────────
  function onResize() {
    const oldW = width
    const oldH = height
    resizeCanvas()
    // Re-center simulation
    simulation.force('center', forceCenter(width / 2, height / 2))
    // Shift all nodes proportionally
    for (const n of nodes) {
      n.x = (n.x! / oldW) * width
      n.y = (n.y! / oldH) * height
    }
    simulation.alpha(0.3).restart()
    setTimeout(() => simulation.stop(), 1000)
  }
  window.addEventListener('resize', onResize)

  // ── Settings ───────────────────────────────────────
  function updateSettings(newSettings: MyceliumSettings) {
    settings = newSettings
    saveSettings(settings)
  }

  // ── Dispose ────────────────────────────────────────
  function dispose() {
    cancelAnimationFrame(animId)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerUp)
    window.removeEventListener('resize', onResize)
    observer.disconnect()
    simulation.stop()
    canvas.remove()
  }

  return { dispose, updateSettings }
}
