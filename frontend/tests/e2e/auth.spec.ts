import { test, expect } from '@playwright/test';

// Clear localStorage so tests always start from login page
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('Login & Role Selection', () => {
  test('shows login page with role cards', async ({ page }) => {
    // 'PRISM' appears in both logo and paragraph — use first() to avoid strict-mode violation
    await expect(page.getByText('PRISM').first()).toBeVisible();
    await expect(page.getByText('Select your role')).toBeVisible();
    await expect(page.getByText('Marcus Rivera')).toBeVisible();
    await expect(page.getByText('Sarah Kim')).toBeVisible();
    await expect(page.getByText('Ahmed Hassan')).toBeVisible();
    await expect(page.getByText('Priya Nair')).toBeVisible();
  });

  test('login as Project Manager navigates to dashboard', async ({ page }) => {
    await page.locator('.login-card').filter({ hasText: 'Marcus Rivera' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('login as Site Engineer navigates to dashboard', async ({ page }) => {
    await page.locator('.login-card').filter({ hasText: 'Sarah Kim' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('login as Quantity Surveyor navigates to dashboard', async ({ page }) => {
    await page.locator('.login-card').filter({ hasText: 'Ahmed Hassan' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('login as Safety Officer navigates to dashboard', async ({ page }) => {
    await page.locator('.login-card').filter({ hasText: 'Priya Nair' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('stores user in localStorage after login', async ({ page }) => {
    await page.locator('.login-card').filter({ hasText: 'Marcus Rivera' }).click();
    await expect(page).toHaveURL('/dashboard');
    const stored = await page.evaluate(() => localStorage.getItem('prism_dummy_user'));
    expect(stored).not.toBeNull();
    const user = JSON.parse(stored!);
    expect(user.name).toBe('Marcus Rivera');
    expect(user.role).toBe('Project Manager');
  });
});
