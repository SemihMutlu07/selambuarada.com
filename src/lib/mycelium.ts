import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ProjectGraph, ProjectNode, ProjectEdge } from './github'

// --- Constants ---

const MATURITY_CONFIG = {
  thriving: { radius: 1.2, opacity: 1.0, pulse: true, pulseSpeed: 0.8, particleSpeed: 0.003 },
  healthy:  { radius: 0.85, opacity: 0.9, pulse: true, pulseSpeed: 0.4, particleSpeed: 0.002 },
  dormant:  { radius: 0.5, opacity: 0.65, pulse: false, pulseSpeed: 0, particleSpeed: 0.001 },
  seedling: { radius: 0.3, opacity: 0.45, pulse: false, pulseSpeed: 0, particleSpeed: 0 },
} as const

export interface MyceliumSettings {
  colorMode: 'language' | 'mono'
  showLabels: boolean
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function tendrilOpacity(weight: number): number {
  return Math.min(0.25 + weight * 0.12, 1)
}

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

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function getBaseColor(): THREE.Color {
  return isDarkMode() ? new THREE.Color(0xffffff) : new THREE.Color(0x1a1a1a)
}

// --- Force-directed layout ---

function computeLayout(nodes: ProjectNode[], edges: ProjectEdge[]): THREE.Vector3[] {
  const positions: THREE.Vector3[] = nodes.map(() =>
    new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ),
  )
  const velocities: THREE.Vector3[] = nodes.map(() => new THREE.Vector3())

  const repulsionStrength = 50
  const springLength = 8
  const springStrength = 0.05
  const damping = 0.9
  const iterations = 200

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion (inverse square)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const diff = new THREE.Vector3().subVectors(positions[i], positions[j])
        const distSq = Math.max(diff.lengthSq(), 0.01)
        const force = diff.normalize().multiplyScalar(repulsionStrength / distSq)
        velocities[i].add(force)
        velocities[j].sub(force)
      }
    }

    // Spring attraction along edges
    for (const edge of edges) {
      const diff = new THREE.Vector3().subVectors(positions[edge.target], positions[edge.source])
      const dist = diff.length()
      const displacement = dist - springLength
      const force = diff.normalize().multiplyScalar(displacement * springStrength * edge.weight)
      velocities[edge.source].add(force)
      velocities[edge.target].sub(force)
    }

    // Apply damping + update positions
    for (let i = 0; i < nodes.length; i++) {
      velocities[i].multiplyScalar(damping)
      positions[i].add(velocities[i])
    }
  }

  return positions
}

// --- Main ---

export function initMycelium(
  container: HTMLElement,
  tooltip: HTMLElement,
  data: ProjectGraph,
): { dispose: () => void; updateSettings: (s: MyceliumSettings) => void } {
  const { nodes, edges } = data
  const positions = computeLayout(nodes, edges)
  let settings = loadSettings()

  // Scene setup
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  )
  camera.position.set(0, 0, 35)

  const isMobile = window.innerWidth < 768
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3
  controls.enableDamping = true

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
  scene.add(ambientLight)

  // --- Build nodes ---

  const sphereGeo = new THREE.SphereGeometry(1, 24, 24)
  const nodeMeshes: THREE.Mesh[] = []
  const nodeMaterials: THREE.MeshBasicMaterial[] = []
  const glowSprites: THREE.Sprite[] = []
  const glowMaterials: THREE.SpriteMaterial[] = []
  const labelSprites: THREE.Sprite[] = []

  // Glow texture (radial gradient on canvas)
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = 64
  glowCanvas.height = 64
  const ctx = glowCanvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const glowTexture = new THREE.CanvasTexture(glowCanvas)

  function getNodeColor(i: number): THREE.Color {
    if (settings.colorMode === 'language') {
      return new THREE.Color(nodes[i].color)
    }
    return getBaseColor()
  }

  for (let i = 0; i < nodes.length; i++) {
    const cfg = MATURITY_CONFIG[nodes[i].maturity]
    const color = getNodeColor(i)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: cfg.opacity,
    })
    const mesh = new THREE.Mesh(sphereGeo, mat)
    mesh.position.copy(positions[i])
    mesh.scale.setScalar(cfg.radius)
    mesh.userData = { index: i }
    scene.add(mesh)
    nodeMeshes.push(mesh)
    nodeMaterials.push(mat)

    // Glow sprite behind node
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity: cfg.opacity * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glow = new THREE.Sprite(glowMat)
    glow.position.copy(positions[i])
    glow.scale.setScalar(cfg.radius * 4)
    scene.add(glow)
    glowSprites.push(glow)
    glowMaterials.push(glowMat)

    // Label sprite (hidden by default)
    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 256
    labelCanvas.height = 64
    const lctx = labelCanvas.getContext('2d')!
    lctx.font = 'bold 24px monospace'
    lctx.fillStyle = '#ffffff'
    lctx.textAlign = 'center'
    lctx.fillText(nodes[i].name, 128, 40)
    const labelTexture = new THREE.CanvasTexture(labelCanvas)
    const labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true, opacity: 0.8, depthWrite: false })
    const label = new THREE.Sprite(labelMat)
    label.position.copy(positions[i])
    label.position.y += cfg.radius * 1.8
    label.scale.set(5, 1.25, 1)
    label.visible = settings.showLabels
    scene.add(label)
    labelSprites.push(label)
  }

  // --- Build tendrils ---

  interface TendrilData {
    line: THREE.Line
    material: THREE.LineBasicMaterial
    curve: THREE.QuadraticBezierCurve3
    edge: ProjectEdge
  }

  const tendrils: TendrilData[] = []

  for (const edge of edges) {
    const start = positions[edge.source]
    const end = positions[edge.target]
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    mid.x += (Math.random() - 0.5) * 3
    mid.y += (Math.random() - 0.5) * 3
    mid.z += (Math.random() - 0.5) * 3

    const curve = new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone())
    const curvePoints = curve.getPoints(30)
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints)

    const baseColor = getBaseColor()
    const opacity = tendrilOpacity(edge.weight)
    const material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity,
    })

    const line = new THREE.Line(geometry, material)
    scene.add(line)
    tendrils.push({ line, material, curve, edge })
  }

  // --- Build particles ---

  interface ParticleSet {
    points: THREE.Points
    material: THREE.PointsMaterial
    progresses: number[]
    curve: THREE.QuadraticBezierCurve3
    speed: number
  }

  const particleSets: ParticleSet[] = []

  for (const tendril of tendrils) {
    const sourceSpeed = MATURITY_CONFIG[nodes[tendril.edge.source].maturity].particleSpeed
    const targetSpeed = MATURITY_CONFIG[nodes[tendril.edge.target].maturity].particleSpeed
    const speed = Math.max(sourceSpeed, targetSpeed)
    if (speed === 0) continue

    const count = 3
    const progresses = Array.from({ length: count }, () => Math.random())
    const particlePositions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const pt = tendril.curve.getPoint(progresses[i])
      particlePositions[i * 3] = pt.x
      particlePositions[i * 3 + 1] = pt.y
      particlePositions[i * 3 + 2] = pt.z
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    const particleColor = settings.colorMode === 'language'
      ? new THREE.Color(nodes[tendril.edge.source].color)
      : getBaseColor()
    const mat = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)
    particleSets.push({ points, material: mat, progresses, curve: tendril.curve, speed })
  }

  // --- Raycaster / Interaction ---

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let hoveredIndex: number | null = null
  let isAnimatingClick = false

  // Adjacency map for highlight
  const adjacency = new Map<number, Set<number>>()
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
    adjacency.get(edge.source)!.add(edge.target)
    adjacency.get(edge.target)!.add(edge.source)
  }

  function onPointerMove(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeMeshes)

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.index as number
      hoveredIndex = idx
      renderer.domElement.style.cursor = 'pointer'

      const node = nodes[idx]
      tooltip.textContent = ''
      const nameEl = document.createElement('strong')
      nameEl.textContent = node.name
      tooltip.appendChild(nameEl)
      if (node.language) {
        tooltip.appendChild(document.createElement('br'))
        const langEl = document.createElement('span')
        langEl.textContent = node.language
        tooltip.appendChild(langEl)
      }
      if (node.description) {
        tooltip.appendChild(document.createElement('br'))
        const descEl = document.createElement('em')
        descEl.textContent = node.description.length > 80 ? node.description.slice(0, 77) + '...' : node.description
        tooltip.appendChild(descEl)
      }
      tooltip.appendChild(document.createElement('br'))
      const matEl = document.createElement('span')
      matEl.style.textTransform = 'capitalize'
      matEl.textContent = node.maturity
      tooltip.appendChild(matEl)
      tooltip.style.left = `${event.clientX - rect.left + 12}px`
      tooltip.style.top = `${event.clientY - rect.top - 12}px`
      tooltip.style.display = 'block'
    } else {
      hoveredIndex = null
      renderer.domElement.style.cursor = 'grab'
      tooltip.style.display = 'none'
    }
  }

  function onClick(event: MouseEvent) {
    if (isAnimatingClick) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeMeshes)
    if (intersects.length === 0) return

    const idx = intersects[0].object.userData.index as number
    const node = nodes[idx]
    const targetPos = positions[idx].clone()

    // Lerp camera toward node
    isAnimatingClick = true
    const startPos = camera.position.clone()
    const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize()
    const endPos = targetPos.clone().sub(direction.multiplyScalar(5))
    const duration = 500
    const startTime = performance.now()

    function animateZoom() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const e = easeInOut(t)
      camera.position.lerpVectors(startPos, endPos, e)
      camera.lookAt(targetPos)

      if (t < 1) {
        requestAnimationFrame(animateZoom)
      } else {
        // Pause then open URL and ease back
        setTimeout(() => {
          window.open(node.url, '_blank')
          const returnStart = performance.now()
          function animateReturn() {
            const elapsed2 = performance.now() - returnStart
            const t2 = Math.min(elapsed2 / duration, 1)
            const e2 = easeInOut(t2)
            camera.position.lerpVectors(endPos, startPos, e2)
            camera.lookAt(new THREE.Vector3(0, 0, 0))
            if (t2 < 1) {
              requestAnimationFrame(animateReturn)
            } else {
              isAnimatingClick = false
            }
          }
          requestAnimationFrame(animateReturn)
        }, 300)
      }
    }
    requestAnimationFrame(animateZoom)
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('click', onClick)

  // --- Color management ---

  function applyColors() {
    for (let i = 0; i < nodes.length; i++) {
      const color = getNodeColor(i)
      nodeMaterials[i].color.copy(color)
      glowMaterials[i].color.copy(color)
    }
    const tendrilColor = getBaseColor()
    for (const tendril of tendrils) {
      tendril.material.color.copy(tendrilColor)
    }
    for (let pi = 0; pi < particleSets.length; pi++) {
      const ps = particleSets[pi]
      if (settings.colorMode === 'language') {
        // Find the source edge to get node color
        const edge = tendrils[pi]?.edge
        if (edge) ps.material.color.copy(new THREE.Color(nodes[edge.source].color))
      } else {
        ps.material.color.copy(getBaseColor())
      }
    }
    for (const label of labelSprites) {
      label.visible = settings.showLabels
    }
  }

  function updateSettings(newSettings: MyceliumSettings) {
    settings = newSettings
    saveSettings(settings)
    applyColors()
  }

  const observer = new MutationObserver(() => {
    applyColors()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  // --- Resize handler ---

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onResize)

  // --- Animation loop ---

  let animFrameId: number
  const startTime = performance.now()

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    const elapsed = (performance.now() - startTime) / 1000

    // Pulse nodes
    for (let i = 0; i < nodes.length; i++) {
      const cfg = MATURITY_CONFIG[nodes[i].maturity]
      const mesh = nodeMeshes[i]
      const isHovered = hoveredIndex === i

      if (cfg.pulse) {
        const pulseScale = cfg.radius * (1 + Math.sin(elapsed * cfg.pulseSpeed * Math.PI * 2) * 0.08)
        mesh.scale.setScalar(isHovered ? pulseScale * 1.3 : pulseScale)
      } else {
        mesh.scale.setScalar(isHovered ? cfg.radius * 1.3 : cfg.radius)
      }
    }

    // Hover dimming
    if (hoveredIndex !== null) {
      const connected = adjacency.get(hoveredIndex) ?? new Set()
      for (let i = 0; i < nodes.length; i++) {
        const cfg = MATURITY_CONFIG[nodes[i].maturity]
        if (i === hoveredIndex || connected.has(i)) {
          nodeMaterials[i].opacity = cfg.opacity
        } else {
          nodeMaterials[i].opacity = 0.08
        }
      }
      for (const tendril of tendrils) {
        const { source, target, weight } = tendril.edge
        if (source === hoveredIndex || target === hoveredIndex) {
          tendril.material.opacity = tendrilOpacity(weight)
        } else {
          tendril.material.opacity = 0.05
        }
      }
    } else {
      for (let i = 0; i < nodes.length; i++) {
        nodeMaterials[i].opacity = MATURITY_CONFIG[nodes[i].maturity].opacity
      }
      for (const tendril of tendrils) {
        tendril.material.opacity = tendrilOpacity(tendril.edge.weight)
      }
    }

    // Animate particles
    for (const ps of particleSets) {
      const posAttr = ps.points.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < ps.progresses.length; i++) {
        ps.progresses[i] = (ps.progresses[i] + ps.speed) % 1
        const pt = ps.curve.getPoint(ps.progresses[i])
        posAttr.setXYZ(i, pt.x, pt.y, pt.z)
      }
      posAttr.needsUpdate = true
    }

    controls.update()
    renderer.render(scene, camera)
  }

  animate()

  // --- Dispose ---

  function dispose() {
    cancelAnimationFrame(animFrameId)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
    observer.disconnect()
    controls.dispose()
    renderer.dispose()

    // Clean up geometries and materials
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })

    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }

  return { dispose, updateSettings }
}
