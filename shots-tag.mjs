// dev-only: verify the billion-tag contrast in the trillion scene
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR', String(e)))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => {
  const y = (document.body.scrollHeight - innerHeight) * 0.42
  window.__lenis.scrollTo(y, { immediate: true, force: true })
})
await page.waitForTimeout(2200)
await page.screenshot({ path: 'shots/check-tag.png' })
await browser.close()
console.log('done')
