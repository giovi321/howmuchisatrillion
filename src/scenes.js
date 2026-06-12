import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FORM } from './gl/engine.js'

const $ = (s) => document.querySelector(s)
const fmt = (n) => Math.round(n).toLocaleString('en-US')

// coin math: a 1-euro-cent coin is 1.67 mm thick (ECB) → ~599 coins per meter
const CENTS_PER_M = 1000 / 1.67
const TOP_M = 1.67e9 // €1T in 1-cent coins ≈ 1.67 million km

const MILESTONES = [
  { m: 828, label: "the world's tallest skyscraper — 828 m" },
  { m: 1_670, label: '1 MILLION cents ≈ 1.7 km · into the clouds' },
  { m: 8_849, label: 'Mount Everest — 8,849 m' },
  { m: 100_000, label: 'the edge of space — 100 km' },
  { m: 400_000, label: 'International Space Station — 400 km' },
  { m: 1_670_000, label: '1 BILLION cents ≈ 1,670 km · four Space Stations higher' },
  { m: 384_400_000, label: 'the Moon — 384,400 km' },
  { m: TOP_M, label: '1 TRILLION cents ≈ 1.67 million km · the Moon and back. Twice.' },
]

const SECTIONS = ['hero', 'guess', 'million', 'billion', 'trillion', 'seconds', 'pennies', 'spend', 'finale']

export function setupScenes(engine, { staticMode }) {
  if (staticMode || !engine) {
    setupStatic()
    return
  }

  ScrollTrigger.config({ ignoreMobileResize: true })

  const T = engine.target
  const u = engine.uniforms
  const N = engine.COUNT
  const countFor = (n) => (n - 0.5) / (N - 1)
  const vh = innerHeight

  // measured pixel geometry — the CSS svh heights are the single source of
  // truth; hardcoded svh constants drifted from real pixels on mobile
  const PX = {}
  for (const name of SECTIONS) {
    const el = document.getElementById(name)
    PX[name] = { top: el.offsetTop, h: el.offsetHeight, span: el.offsetHeight - vh }
  }
  const SCROLL_END = PX.finale.top + PX.finale.span
  // a chapter runs while its section is pinned: [top hits viewport top,
  // bottom hits viewport bottom]
  function chapter(name) {
    const { top, span } = PX[name]
    return { at: (f) => top + f * span, dur: (f) => f * span }
  }

  // geometry is measured once — if the viewport changes shape, start over
  const w0 = innerWidth
  let resizeT
  addEventListener('resize', () => {
    clearTimeout(resizeT)
    resizeT = setTimeout(() => { if (Math.abs(innerWidth - w0) > 150) location.reload() }, 300)
  })

  // ---- boot (time-based, not scroll) ----
  gsap.timeline()
    .to('#loader', { autoAlpha: 0, duration: 0.5, delay: 0.2 })
    .from('.hero-line', { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, 0.3)
    .from('.kicker, .hero-sub, .scroll-cue', { opacity: 0, y: 18, duration: 0.9, stagger: 0.1, ease: 'power2.out' }, 0.9)

  // ---- pins: animation-free, one per scene ----
  for (const name of SECTIONS) {
    if (name === 'hero') continue
    ScrollTrigger.create({
      trigger: `#${name}`,
      start: 'top top',
      end: 'bottom bottom',
      pin: `#${name} .scene-inner`,
      pinSpacing: false,
      anticipatePin: 1,
      ...(name === 'guess' ? { onUpdate(self) { if (self.progress > 0.45) window.__revealTruth?.() } } : {}),
    })
  }

  // ---- ONE master timeline owns every GL property + caption ----
  const M = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#content',
      start: 'top top',
      endTrigger: '#finale',
      end: 'bottom bottom',
      scrub: 1,
    },
  })
  M.set({}, {}, SCROLL_END) // pad duration so timeline time == scroll px, exactly

  function cap(sel, inPos, outPos, dur = vh * 0.16) {
    M.fromTo(sel, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: dur, immediateRender: false }, inPos)
    if (outPos != null) M.to(sel, { autoAlpha: 0, y: -22, duration: dur * 0.8 }, outPos)
  }
  function hud(sel, inPos, outPos, dur = vh * 0.1) {
    M.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur, immediateRender: false }, inPos)
    M.to(sel, { autoAlpha: 0, duration: dur }, outPos)
  }

  // ---- hero ----
  M.to('#hero .scene-inner', { opacity: 0, yPercent: -12, duration: PX.hero.h * 0.73 }, 0)

  // ---- guess: dust thins while the test approaches ----
  M.to(T, { alpha: 0.16, count: 0.02, duration: vh }, PX.guess.top - vh)
  M.fromTo('.guess-wrap > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: vh * 0.07, duration: vh * 0.5, immediateRender: false }, PX.guess.top - vh * 0.85)

  // ---- million: dust collapses into a single dot ----
  {
    const c = chapter('million')
    M.set(u.uFormA, { value: FORM.DUST }, c.at(0))
    M.set(u.uFormB, { value: FORM.ORB }, c.at(0))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.3), immediateRender: false }, c.at(0))
    M.to(T, { count: countFor(1), spread: 0.012, alpha: 1, size: 1.8, camZ: 13, drift: 0.02, duration: c.dur(0.3) }, c.at(0))
    hud('#million .counter-hud', c.at(0.24), c.at(0.92))
    cap('#million [data-cap="m1"]', c.at(0.34), c.at(0.56))
    cap('#million [data-cap="m2"]', c.at(0.64), c.at(0.88))
  }

  // ---- billion: 1 → 1,000 dots, then let it breathe ----
  {
    const c = chapter('billion')
    const el = $('#countBillion')
    const o = { e: 0 }
    M.to(o, {
      e: 3, duration: c.dur(0.3),
      onUpdate() {
        const n = Math.round(10 ** o.e)
        el.textContent = fmt(n)
        T.count = countFor(n)
      },
    }, c.at(0))
    M.to(T, { spread: 1, camZ: 26, size: 1.4, duration: c.dur(0.3) }, c.at(0))
    hud('#billion .counter-hud', c.at(0.02), c.at(0.92))
    cap('#billion [data-cap="b1"]', c.at(0.36), c.at(0.6))
    cap('#billion [data-cap="b2"]', c.at(0.66), c.at(0.9))
  }

  // ---- trillion: orb explodes into a million-dot galaxy ----
  {
    const c = chapter('trillion')
    const el = $('#countTrillion')
    const o = { e: 3 }
    M.set(u.uFormA, { value: FORM.ORB }, c.at(0))
    M.set(u.uFormB, { value: FORM.GALAXY }, c.at(0))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.4), immediateRender: false }, c.at(0.05))
    M.to(T, { billionLock: 1, duration: c.dur(0.08) }, c.at(0))
    M.to(o, {
      e: 6, duration: c.dur(0.45),
      onUpdate() {
        const n = Math.round(10 ** o.e)
        el.textContent = fmt(n)
        T.count = countFor(Math.max(n, 1000))
      },
    }, c.at(0.05))
    M.to(T, { camZ: 92, camY: 26, alpha: 0.38, size: 1.0, swirl: 1.6, duration: c.dur(0.5) }, c.at(0.05))
    hud('#trillion .counter-hud', c.at(0.02), c.at(0.94))
    cap('#trillion [data-cap="t1"]', c.at(0.56), c.at(0.72))
    cap('#trillion [data-cap="t2"]', c.at(0.76), c.at(0.93))
    M.fromTo('#billionTag', { autoAlpha: 0 }, { autoAlpha: 1, duration: c.dur(0.05), immediateRender: false }, c.at(0.78))
    M.to('#billionTag', { autoAlpha: 0, duration: c.dur(0.04) }, c.at(0.92))

    const tag = $('#billionTag')
    gsap.ticker.add(() => {
      if (gsap.getProperty(tag, 'opacity') > 0.01) {
        const p = engine.toScreen(u.uBillionPos.value.x, u.uBillionPos.value.y, u.uBillionPos.value.z)
        if (!p.behind) tag.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    })
  }

  // ---- seconds: fly backwards through a tunnel of time ----
  {
    const c = chapter('seconds')
    const label = $('#secondsLabel')
    const dateEl = $('#timeDate')
    const note = $('#timeNote')
    const now = Date.now()
    const o = { p: 0 }
    M.set(u.uFormA, { value: FORM.GALAXY }, c.at(0))
    M.set(u.uFormB, { value: FORM.TUNNEL }, c.at(0))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.22), immediateRender: false }, c.at(0))
    M.to(T, { billionLock: 0, camY: 0, camZ: 150, lookZ: 60, alpha: 0.32, size: 0.95, count: 0.15, duration: c.dur(0.22) }, c.at(0))
    cap('#seconds [data-cap="s0"]', c.at(0.02), c.at(0.2))
    hud('.time-hud', c.at(0.24), c.at(0.92))
    M.to(T, { camZ: -170, lookZ: -260, duration: c.dur(0.64) }, c.at(0.26))
    M.to(o, {
      p: 1, duration: c.dur(0.64),
      onUpdate() {
        const secs = 10 ** (6 + 6 * o.p)
        label.textContent = `${fmt(secs)} seconds ago`
        const then = new Date(now - secs * 1000)
        const year = then.getFullYear()
        if (secs < 4e8) {
          dateEl.textContent = then.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        } else if (year >= 0) {
          dateEl.textContent = String(year)
        } else {
          dateEl.textContent = `${fmt(Math.abs(year))} BC`
        }
        if (o.p < 0.18) note.textContent = 'a million seconds — not even two weeks'
        else if (o.p < 0.46) note.textContent = 'still inside your own life'
        else if (o.p < 0.62) note.textContent = 'a billion seconds — dial-up internet, 1994'
        else if (o.p < 0.88) note.textContent = 'past every pyramid, past the invention of writing'
        else note.textContent = 'a trillion seconds — the last Ice Age'
      },
    }, c.at(0.26))
  }

  // ---- pennies: climb the trillion-cent column ----
  {
    const c = chapter('pennies')
    const alt = $('#altReadout')
    const pen = $('#altPennies')
    const mile = $('#milestone')
    let lastMs = -1
    const o = { p: 0 }
    M.set(u.uFormA, { value: FORM.TUNNEL }, c.at(0))
    M.set(u.uFormB, { value: FORM.COLUMN }, c.at(0))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.18), immediateRender: false }, c.at(0))
    M.to(T, { camX: 20, camY: -132, camZ: 34, lookY: -126, lookZ: 0, alpha: 0.4, size: 1.2, count: 0.22, drift: 0.05, duration: c.dur(0.18) }, c.at(0))
    cap('#pennies [data-cap="p0"]', c.at(0.04), c.at(0.18))
    hud('.alt-hud', c.at(0.2), c.at(0.97))
    hud('#milestone', c.at(0.2), c.at(0.97))
    M.to(T, { camY: 138, lookY: 144, duration: c.dur(0.68) }, c.at(0.22))
    M.to(o, {
      p: 1, duration: c.dur(0.68),
      onUpdate() {
        const m = 10 ** (o.p * Math.log10(TOP_M))
        alt.textContent = m < 1000 ? `${fmt(m)} m` : `${fmt(m / 1000)} km`
        pen.textContent = `${fmt(m * CENTS_PER_M)} coins · €${fmt(m * CENTS_PER_M / 100)}`
        let idx = 0
        for (let i = 0; i < MILESTONES.length; i++) if (m >= MILESTONES[i].m * 0.92) idx = i
        if (idx !== lastMs) {
          lastMs = idx
          mile.textContent = MILESTONES[idx].label
          gsap.fromTo(mile, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, overwrite: 'auto' })
        }
      },
    }, c.at(0.22))
  }

  // ---- spend: back to calm, cards do the talking ----
  {
    const c = chapter('spend')
    M.set(u.uFormA, { value: FORM.COLUMN }, c.at(0))
    M.set(u.uFormB, { value: FORM.DUST }, c.at(0))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.15), immediateRender: false }, c.at(0))
    M.to(T, { alpha: 0.18, count: 0.06, swirl: 2, duration: c.dur(0.08) }, c.at(0))
    M.to(T, { camX: 0, camY: 0, camZ: 40, lookY: 0, size: 1, drift: 0.35, duration: c.dur(0.2) }, c.at(0))
    M.fromTo('.spend-wrap .step-label, .spend-wrap .scene-title', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: c.dur(0.04), duration: c.dur(0.2), immediateRender: false }, c.at(0.06))
    M.fromTo('.spend-card', { autoAlpha: 0, y: 60, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, stagger: c.dur(0.1), duration: c.dur(0.22), immediateRender: false }, c.at(0.26))
  }

  // ---- finale: the particles BECOME the number line ----
  {
    const c = chapter('finale')
    M.set(u.uFormA, { value: FORM.DUST }, c.at(0))
    M.set(u.uFormB, { value: FORM.LINE }, c.at(0))
    M.to(T, { camX: 0, camZ: 38, camY: 3, lookY: 0, duration: c.dur(0.2) }, c.at(0))
    cap('#finale [data-cap="f1"]', c.at(0.04), c.at(0.26))
    M.fromTo(T, { morph: 0 }, { morph: 1, duration: c.dur(0.22), immediateRender: false }, c.at(0.3))
    M.to(T, { count: 0.3, spread: 0.8, alpha: 0.3, size: 0.9, duration: c.dur(0.22) }, c.at(0.3))
    M.fromTo('#finaleLine', { autoAlpha: 0 }, { autoAlpha: 1, duration: c.dur(0.08), immediateRender: false }, c.at(0.42))
    M.fromTo('.fl-m', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: c.dur(0.04), immediateRender: false }, c.at(0.48))
    M.fromTo('.fl-t', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: c.dur(0.04), immediateRender: false }, c.at(0.52))
    M.fromTo('.fl-b', { autoAlpha: 0, scale: 3 }, { autoAlpha: 1, scale: 1, duration: c.dur(0.06), immediateRender: false }, c.at(0.58))
    const gf = Number(sessionStorage.getItem('guessFrac'))
    if (gf > 0) {
      const you = $('#flYou')
      you.style.left = `${6 + gf * 88}%`
      M.fromTo(you, { autoAlpha: 0 }, { autoAlpha: 1, duration: c.dur(0.05), immediateRender: false }, c.at(0.64))
    }
    M.fromTo('.finale-cta', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: c.dur(0.08), immediateRender: false }, c.at(0.72))
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}

// no WebGL / prefers-reduced-motion: every caption visible, final values set
function setupStatic() {
  document.documentElement.classList.add('static-mode')
  $('#loader').style.display = 'none'
  $('#countMillion').textContent = '1'
  $('#countBillion').textContent = '1,000'
  $('#countTrillion').textContent = '1,000,000'
  $('#secondsLabel').textContent = '1,000,000,000,000 seconds ago'
  const then = new Date(Date.now() - 1e12 * 1000)
  $('#timeDate').textContent = `${fmt(Math.abs(then.getFullYear()))} BC`
  $('#timeNote').textContent = 'a trillion seconds — the last Ice Age'
  $('#altReadout').textContent = '1,670,000 km'
  $('#altPennies').textContent = 'one trillion cents · the Moon and back, twice'
  $('#milestone').textContent = MILESTONES[MILESTONES.length - 1].label
  window.__revealTruth?.()
}
