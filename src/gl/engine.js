import * as THREE from 'three'
import gsap from 'gsap'
import vert from './particles.vert.glsl?raw'
import frag from './particles.frag.glsl?raw'

export const FORM = { DUST: 0, ORB: 1, GALAXY: 2, TUNNEL: 3, COLUMN: 4, LINE: 5 }

const lerp = (a, b, t) => a + (b - a) * t

export function createEngine(canvas) {
  const isMobile = matchMedia('(max-width: 768px)').matches
  const COUNT = isMobile ? 400_000 : 1_000_000

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 700)
  camera.position.set(0, 0, 30)

  // geometry: one seed + one index per particle, formations live in the shader
  const seeds = new Float32Array(COUNT * 3)
  const indices = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    seeds[i * 3 + 0] = Math.random()
    seeds[i * 3 + 1] = Math.random()
    seeds[i * 3 + 2] = Math.random()
    indices[i] = COUNT === 1 ? 0 : i / (COUNT - 1)
  }
  const geo = new THREE.BufferGeometry()
  // three still requires a position attribute for draw range/bounds
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))
  geo.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1))
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 500)

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uSize: { value: 0.85 },
    uCount: { value: 0.04 },
    uSpread: { value: 1 },
    uFormA: { value: FORM.DUST },
    uFormB: { value: FORM.DUST },
    uMorph: { value: 0 },
    uSwirl: { value: 1 },
    uAlpha: { value: 0.3 },
    uBillionLock: { value: 0 },
    uBillionFrac: { value: 1000 / COUNT },
    uBillionPos: { value: new THREE.Vector3(11, 1.5, 0) },
    uDrift: { value: 0.35 },
  }

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  scene.add(points)

  // Scroll timelines tween `target`; the ticker lerps `live` toward it so the
  // GL world always trails the scroll with a touch of inertia (never raw).
  const target = {
    camX: 0, camY: 0, camZ: 30, lookX: 0, lookY: 0, lookZ: 0,
    count: 0.04, spread: 1, alpha: 0.3, size: 0.85, morph: 0,
    swirl: 1, billionLock: 0, drift: 0.35,
  }
  const live = { ...target }
  const look = new THREE.Vector3()

  let clock = 0
  function frame(time, dt) {
    clock += Math.min(dt, 50) / 1000
    const k = 1 - Math.exp(-(Math.min(dt, 50) / 1000) * 7) // framerate-independent lerp
    for (const key in target) live[key] = lerp(live[key], target[key], k)

    uniforms.uTime.value = clock
    uniforms.uCount.value = live.count
    uniforms.uSpread.value = live.spread
    uniforms.uAlpha.value = live.alpha
    uniforms.uSize.value = live.size
    uniforms.uMorph.value = live.morph
    uniforms.uSwirl.value = live.swirl
    uniforms.uBillionLock.value = live.billionLock
    uniforms.uDrift.value = live.drift

    camera.position.set(live.camX, live.camY, live.camZ)
    look.set(live.lookX, live.lookY, live.lookZ)
    camera.lookAt(look)
    renderer.render(scene, camera)
  }
  gsap.ticker.add(frame) // single loop shared with Lenis + ScrollTrigger

  let resizeT
  addEventListener('resize', () => {
    clearTimeout(resizeT)
    resizeT = setTimeout(() => {
      renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))
      renderer.setSize(innerWidth, innerHeight)
      uniforms.uPixelRatio.value = renderer.getPixelRatio()
      camera.aspect = innerWidth / innerHeight
      camera.updateProjectionMatrix()
    }, 100)
  })

  // project a world point to screen coords (for the "billion you just saw" tag)
  const proj = new THREE.Vector3()
  function toScreen(x, y, z) {
    proj.set(x, y, z).project(camera)
    return {
      x: (proj.x * 0.5 + 0.5) * innerWidth,
      y: (-proj.y * 0.5 + 0.5) * innerHeight,
      behind: proj.z > 1,
    }
  }

  return { renderer, scene, camera, uniforms, target, live, COUNT, isMobile, toScreen }
}
