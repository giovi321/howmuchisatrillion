// dev-only: dump GL state at the pennies scroll stop
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR', String(e)))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => {
  const y = (document.body.scrollHeight - innerHeight) * 0.68
  window.__lenis.scrollTo(y, { immediate: true, force: true })
})
await page.waitForTimeout(2500)
const state = await page.evaluate(() => {
  const e = window.__gl
  const r = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, Math.round(v * 1000) / 1000]))
  return {
    live: r(e.live),
    target: r(e.target),
    formA: e.uniforms.uFormA.value,
    formB: e.uniforms.uFormB.value,
    uCount: e.uniforms.uCount.value,
    uAlpha: e.uniforms.uAlpha.value,
    uMorph: e.uniforms.uMorph.value,
    uSpread: e.uniforms.uSpread.value,
    cam: e.camera.position.toArray().map((n) => Math.round(n)),
    scrollY: window.scrollY,
    scrollH: document.body.scrollHeight,
  }
})
console.log(JSON.stringify(state, null, 1))
await browser.close()
