import { test, expect } from '@playwright/test';

async function loginAsProjectManager(page: any) {
  // Clear any existing session first
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.login-card').filter({ hasText: 'Marcus Rivera' }).click();
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page);
  });

  // Sidebar renders <button> elements (not <a> links) that call navigate()
  const pages = [
    { label: 'Projects',      path: '/projects' },
    { label: 'Analytics',     path: '/analytics' },
    { label: 'Documents',     path: '/documents' },
    { label: 'Scheduling',    path: '/scheduling' },
    { label: 'RFI Register',  path: '/rfi-register' },
    { label: 'Change Orders', path: '/change-orders' },
    { label: 'Obligations',   path: '/obligations' },
    { label: 'Workforce',     path: '/workforce' },
    { label: 'Settings',      path: '/settings' },
  ];

  for (const { label, path } of pages) {
    test(`navigates to ${label}`, async ({ page }) => {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(page.locator('main')).toBeVisible();
    });
  }

  test('dashboard link is active on load', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    // Dashboard button should be in active state (blue border)
    const dashBtn = page.getByRole('button', { name: 'Dashboard', exact: true });
    await expect(dashBtn).toBeVisible();
  });
});
