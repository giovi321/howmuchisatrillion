// dev-only: verify the euro conversion + the why-page button
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

// why page: scroll to bottom where the button lives
await page.goto('http://localhost:4173/why.html', { waitUntil: 'networkidle' })
await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/check-why-foot.png' })

// pennies scene with new milestones
await page.goto('http://localhost:4173/?scroll=0.72', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => {
  const y = (document.body.scrollHeight - innerHeight) * 0.74
  window.__lenis.scrollTo(y, { immediate: true, force: true })
})
await page.waitForTimeout(1800)
await page.screenshot({ path: 'shots/check-pennies.png' })

// guess scene euro labels
await page.evaluate(() => {
  const y = (document.body.scrollHeight - innerHeight) * 0.08
  window.__lenis.scrollTo(y, { immediate: true, force: true })
})
await page.waitForTimeout(1800)
await page.screenshot({ path: 'shots/check-guess.png' })

console.log('errors:', errors.length ? errors : 'none')
await browser.close()
