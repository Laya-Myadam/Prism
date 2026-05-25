import { test, expect } from '@playwright/test';

async function loginAsProjectManager(page: any) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.login-card').filter({ hasText: 'Marcus Rivera' }).click();
  await expect(page).toHaveURL('/dashboard');
}

// The floating copilot button is a round fixed button (border-radius 50%) with a star SVG.
// It has no text — select by inline style containing "50%"
function getCopilotBtn(page: any) {
  return page.locator('button[style*="50%"]').last();
}

test.describe('AI Copilot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page);
  });

  test('floating copilot button is visible on dashboard', async ({ page }) => {
    await expect(getCopilotBtn(page)).toBeVisible();
  });

  test('copilot panel opens when button clicked', async ({ page }) => {
    await getCopilotBtn(page).click();
    await expect(page.getByText('PRISM AI Agent')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('textarea.copilot-input')).toBeVisible();
  });

  test('copilot panel closes on × click', async ({ page }) => {
    await getCopilotBtn(page).click();
    await expect(page.getByText('PRISM AI Agent')).toBeVisible();
    // Close button renders as the × character
    await page.locator('button').filter({ hasText: '×' }).click();
    await expect(page.getByText('PRISM AI Agent')).not.toBeVisible();
  });

  test('suggestion chips are visible on open', async ({ page }) => {
    await getCopilotBtn(page).click();
    await expect(page.getByText('What are the open RFIs?')).toBeVisible();
    await expect(page.getByText('What tasks are overdue?')).toBeVisible();
    await expect(page.getByText("What's the project completion status?")).toBeVisible();
    await expect(page.locator('textarea.copilot-input')).toBeVisible();
  });

  test('typing in textarea works', async ({ page }) => {
    await getCopilotBtn(page).click();
    const input = page.locator('textarea.copilot-input');
    await input.fill('Hello PRISM');
    await expect(input).toHaveValue('Hello PRISM');
  });

  // Backend-dependent: only passes when backend is running at localhost:8000
  test('sends message and shows user bubble', async ({ page }) => {
    await getCopilotBtn(page).click();
    const input = page.locator('textarea.copilot-input');
    await input.fill('What projects are on track?');
    await input.press('Enter');
    // User bubble appears immediately regardless of backend
    await expect(page.getByText('What projects are on track?')).toBeVisible({ timeout: 5000 });
  });
});
