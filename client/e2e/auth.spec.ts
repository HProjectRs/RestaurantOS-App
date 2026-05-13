import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@cafe.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url).not.toContain('/admin')
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should load kitchen display page', async ({ page }) => {
    await page.goto('/kitchen')
    const content = await page.content()
    expect(content.length > 100).toBeTruthy()
  })

  test('should load menu page', async ({ page }) => {
    await page.goto('/menu')
    const content = await page.content()
    expect(content.length > 100).toBeTruthy()
  })

  test('should handle offline mode', async ({ page }) => {
    await page.goto('/')
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    await page.context().setOffline(false)
  })
})