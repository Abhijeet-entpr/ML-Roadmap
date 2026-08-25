import { test, expect } from '@playwright/test'

test('landing and onboarding entry work', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const cta = page.getByRole('link', { name: /start|onboard|begin/i }).first()
  if (await cta.count()) {
    await cta.click()
    await expect(page).toHaveURL(/onboarding/)
  }
})
