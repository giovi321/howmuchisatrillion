// dev-only: screenshot every scene through real scrolling, dump console errors
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const stops = [
  ['hero', 0],
  ['guess', 0.08],
  ['million', 0.16],
  ['billion', 0.25],
  ['trillion', 0.36],
  ['seconds', 0.52],
  ['pennies', 0.68],
  ['spend', 0.81],
  ['finale', 0.93],
]

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader'] })

for (const [device, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  for (const [name, frac] of stops) {
    await page.evaluate((f) => {
      const y = (document.body.scrollHeight - innerHeight) * f
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
      else scrollTo(0, y)
    }, frac)
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `shots/${device}-${name}.png` })
    if (device === 'mobile' && frac > 0.4) break
  }
  console.log(`${device} console errors:`, errors.length ? errors : 'none')
  await page.close()
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE + '/why.html', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'shots/why-top.png' })
await browser.close()
console.log('done')
