/**
 * Local traveler smoke for Jimbot itinerary card + refusal.
 * Requires: Vite on :8443, supabase + jimbot function up.
 * Usage: node tests/jimbot-playwright-smoke.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BITINARY_URL || 'http://localhost:8443'
const EMAIL = 'traveler@bitinary.local'
const PASS = 'password123'
const OUT = 'tests/.playwright-out'
mkdirSync(OUT, { recursive: true })

const problems = []
const note = (msg) => console.log(`· ${msg}`)
const fail = (msg) => {
  problems.push(msg)
  console.log(`FAIL  ${msg}`)
}
const ok = (msg) => console.log(`ok   ${msg}`)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(45000)

try {
  // --- Login ---
  note('login')
  await page.goto(`${BASE}/auth/email?mode=login`, { waitUntil: 'networkidle' })
  await page.locator('#f-email, input[type="email"]').first().fill(EMAIL)
  await page.locator('#f-password, input[type="password"]').first().fill(PASS)
  await page.getByRole('button', { name: /Mag-sign in|Sign in/i }).click()
  await page.waitForTimeout(2500)

  // Skip personalize if present
  for (let i = 0; i < 3; i += 1) {
    if (!page.url().includes('personalize') && !page.url().includes('auth')) break
    const skip = page.getByRole('button', { name: /Laktawan|Tapos|Home|Pumunta/i }).first()
    if (await skip.isVisible().catch(() => false)) {
      await skip.click()
      await page.waitForTimeout(1200)
    } else break
  }

  // --- Jimbot ---
  note('open jimbot')
  await page.goto(`${BASE}/jimbot?embed=1`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  if (page.url().includes('personalize')) {
    const skip = page.getByRole('button', { name: /Laktawan|Tapos|Home/i }).first()
    if (await skip.isVisible().catch(() => false)) await skip.click()
    await page.goto(`${BASE}/jimbot?embed=1`, { waitUntil: 'networkidle' })
  }

  const input = page.getByRole('textbox', { name: /Mensahe kay Jimbot/i })
  if (!(await input.isVisible())) {
    fail('Jimbot composer not visible (auth/personalize gate?)')
    await page.screenshot({ path: `${OUT}/01-no-composer.png`, fullPage: true })
  } else {
    ok('composer visible')
  }

  // --- Plan ask ---
  note('send QC plan')
  await input.fill('Gumawa ng 1 araw na itinerary sa Quezon City, budget 2500 para sa 2 tao')
  await page.getByRole('button', { name: 'Ipadala' }).click()

  // Wait for either card or offline/error
  const cardOrFail = await Promise.race([
    page.getByRole('heading', { name: /Quezon City/i }).first().waitFor({ state: 'visible', timeout: 60000 }).then(() => 'card'),
    page.getByText(/Hindi ako makasagot ngayon/i).waitFor({ state: 'visible', timeout: 60000 }).then(() => 'offline'),
    page.getByText(/May konting aberya/i).waitFor({ state: 'visible', timeout: 60000 }).then(() => 'aberia'),
  ]).catch(() => 'timeout')

  await page.screenshot({ path: `${OUT}/02-after-plan.png`, fullPage: true })

  if (cardOrFail !== 'card') {
    fail(`plan reply was "${cardOrFail}" instead of itinerary card`)
  } else {
    ok('Quezon City hero appeared')

    // Duplicate places list should not appear above the unified card when draft exists
    const saveBtn = page.getByRole('button', { name: /Save plan|I-save/i }).first()
    if (!(await saveBtn.isVisible())) fail('Save plan button missing on card')
    else ok('Save plan button')

    const refine = page.getByRole('button', { name: /Refine/i }).first()
    if (!(await refine.isVisible())) fail('Refine button missing')
    else ok('Refine button')

    const share = page.getByRole('button', { name: /Share/i }).first()
    if (!(await share.isVisible())) fail('Share button missing')
    else ok('Share button')

    const overview = page.getByRole('button', { name: 'Overview' }).first()
    const mapTab = page.getByRole('button', { name: 'Map', exact: true }).first()
    if (!(await overview.isVisible()) || !(await mapTab.isVisible())) fail('Overview/Map segments missing')
    else ok('segments present')

    await mapTab.click()
    await page.waitForTimeout(400)
    const mapPreview = page.getByText(/Route order preview|Estimate positions/i).first()
    if (!(await mapPreview.isVisible())) fail('Map tab did not show route preview')
    else ok('Map tab route preview')

    await overview.click()
    // Open first timeline stop if present
    const stopRow = page.locator('article button').filter({ hasText: /₱|—/ }).first()
    if (await stopRow.isVisible().catch(() => false)) {
      await stopRow.click()
      await page.waitForTimeout(500)
      const openShop = page.getByRole('button', { name: /Open shop/i })
      if (!(await openShop.isVisible())) fail('Stop sheet missing Open shop')
      else ok('stop sheet opens')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    } else {
      fail('no timeline stop row to open')
    }

    // Refine sheet
    await refine.click()
    await page.waitForTimeout(400)
    const cheaper = page.getByRole('button', { name: /Cheaper/i })
    if (!(await cheaper.isVisible())) fail('Refine sheet options missing')
    else ok('Refine sheet')
    await page.keyboard.press('Escape')
  }

  // --- Refusal ---
  note('send medical ask')
  await input.fill('Masakit ulo ko, anong gamot?')
  await page.getByRole('button', { name: 'Ipadala' }).click()
  await page.waitForTimeout(8000)
  await page.screenshot({ path: `${OUT}/03-refusal.png`, fullPage: true })

  const help = page.getByRole('button', { name: /Kailangan ng tao/i }).last()
  const refused =
    (await page.getByText(/medical|doktor|gamot|Hindi ako pwede/i).last().isVisible().catch(() => false)) ||
    (await help.isVisible().catch(() => false))
  if (!refused) fail('medical refusal UI not found')
  else ok('medical refusal / help path visible')

  if (await help.isVisible().catch(() => false)) ok('Kailangan ng tao? present on refusal')
  else fail('Kailangan ng tao? missing on refusal')

  // Plan card should not appear for medical reply — look for Save plan near last messages carefully
  // Soft check: after refusal, newest Save plan count shouldn't increase from a medical draft
} catch (e) {
  fail(`uncaught: ${e instanceof Error ? e.message : String(e)}`)
  await page.screenshot({ path: `${OUT}/99-error.png`, fullPage: true }).catch(() => {})
} finally {
  await browser.close()
}

console.log(`\n${problems.length ? problems.length + ' problem(s)' : 'No problems found'}`)
if (problems.length) {
  for (const p of problems) console.log(` - ${p}`)
  process.exit(1)
}
