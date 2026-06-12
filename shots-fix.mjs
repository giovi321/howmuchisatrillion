// dev-only: verify retimed captions, HUD scrims, finale bar
import { chromium } from 'playwright'

const stops = [
  ['billion-cap', 0.267],
  ['trillion-cap', 0.40],
  ['trillion-tag', 0.43],
  ['pennies-mid', 0.70],
  ['finale-line', 0.95],
]

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader'] })
for (const [device, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  for (const [name, frac] of stops) {
    await page.evaluate((f) => {
      const y = (document.body.scrollHeight - innerHeight) * f
      window.__lenis.scrollTo(y, { immediate: true, force: true })
    }, frac)
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `shots/fix-${device}-${name}.png` })
  }
  console.log(`${device} errors:`, errors.length ? errors : 'none')
  await page.close()
}
await browser.close()
