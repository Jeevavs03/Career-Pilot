import { test, expect } from '@playwright/test';

test.describe('CareerPilot E2E', () => {
  test('health check returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:5000/health');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('login page loads', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await expect(page.locator('text=CareerPilot AI')).toBeVisible();
  });

  test('registration flow', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('text=Sign up');
    await page.fill('input[placeholder="Full Name"]', 'Test User');
    await page.fill('input[placeholder="Email"]', `test${Date.now()}@test.com`);
    await page.fill('input[placeholder="Password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});
