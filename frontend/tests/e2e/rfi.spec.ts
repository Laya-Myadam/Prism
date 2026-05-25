import { test, expect } from '@playwright/test';

async function loginAsProjectManager(page: any) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.login-card').filter({ hasText: 'Marcus Rivera' }).click();
  await expect(page).toHaveURL('/dashboard');
}

test.describe('RFI Register', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page);
    // Sidebar has <button> elements, not <a> links
    await page.getByRole('button', { name: 'RFI Register', exact: true }).click();
    await expect(page).toHaveURL('/rfi-register');
  });

  test('RFI page loads without crashing', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/RFI/i).first()).toBeVisible();
  });

  test('New RFI button is visible', async ({ page }) => {
    // Button text varies — match common patterns
    const createBtn = page.getByRole('button', { name: /new rfi|create|add rfi/i });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking New RFI opens a form or modal', async ({ page }) => {
    await page.getByRole('button', { name: /new rfi|create|add rfi/i }).click();
    // Modal heading is "New Request for Information"
    await expect(page.getByText('New Request for Information')).toBeVisible({ timeout: 5000 });
  });
});
