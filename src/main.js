import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { createEngine } from './gl/engine.js'
import { setupScenes } from './scenes.js'
import { setupGuess } from './guess.js'

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

function webglOK() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const staticMode = reduceMotion || !webglOK()

if (!staticMode) {
  // one shared loop: GSAP's ticker drives Lenis, ScrollTrigger and the GL render
  const lenis = new Lenis({ autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  window.__lenis = lenis
}

// headless-test hook: /?scroll=0.5 jumps to 50% of the page
const scrollParam = new URLSearchParams(location.search).get('scroll')
if (scrollParam) {
  const badge = document.createElement('div')
  badge.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99;color:#0f0;font:12px monospace;background:#000;padding:2px 6px'
  document.body.appendChild(badge)
  window.addEventListener('error', (e) => { badge.textContent += ` ERR:${e.message}` })
  setTimeout(() => {
    const y = (document.body.scrollHeight - innerHeight) * parseFloat(scrollParam)
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
    else scrollTo(0, y)
    setInterval(() => {
      badge.textContent = `y=${Math.round(scrollY)}/${document.body.scrollHeight} target=${Math.round(y)}`
    }, 400)
  }, 1200)
}

let engine = null
if (!staticMode) {
  try {
    engine = createEngine(document.getElementById('gl'))
    window.__gl = engine
  } catch (err) {
    console.error('WebGL init failed, falling back to static mode', err)
  }
}

setupGuess()
setupScenes(engine, { staticMode: staticMode || !engine })

document.getElementById('shareBtn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget
  try {
    await navigator.clipboard.writeText(location.href)
    btn.textContent = 'copied ✓'
    setTimeout(() => (btn.textContent = 'Copy link'), 1600)
  } catch {
    btn.textContent = location.host
  }
})
