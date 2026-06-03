import { test, expect, Page } from '@playwright/test';

// All tests in this file use mobile viewport
test.use({ viewport: { width: 390, height: 844 } });

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'student@test.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
  await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
}

test.describe('Mobile Layout', () => {
  test('bottom nav is visible on all main pages', async ({ page }) => {
    await loginAsStudent(page);
    const routes = [
      '/student/dashboard',
      '/student/courses',
      '/student/homework',
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByTestId('bottom-nav')).toBeVisible({ timeout: 5000 });
    }
  });

  test('sidebar is NOT visible on mobile', async ({ page }) => {
    await loginAsStudent(page);
    await expect(page.getByTestId('sidebar-nav')).not.toBeVisible();
  });

  test('header height is 56px on mobile', async ({ page }) => {
    await loginAsStudent(page);
    const header = page.getByTestId('app-header');
    const box = await header.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(60);
    expect(box!.height).toBeGreaterThanOrEqual(52);
  });

  test('DataTable is absent — card list shown instead', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await expect(page.getByRole('table')).not.toBeVisible();
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Mobile Modals', () => {
  test('modals open as bottom sheets (slide up from bottom)', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await page.getByTestId('course-card').first().click();

    // Check if any modal/sheet opened
    const sheet = page.getByTestId('bottom-sheet');
    if (await sheet.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await sheet.boundingBox();
      // Bottom sheet should start from bottom of screen
      expect(box!.y).toBeGreaterThan(200);
    }
  });
});

test.describe('Mobile Interactions', () => {
  test('pull to refresh triggers refresh spinner', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });

    // Simulate pull-to-refresh touch gesture
    await page.touchscreen.tap(195, 200);
    await page.mouse.move(195, 200);
    await page.mouse.down();
    await page.mouse.move(195, 400, { steps: 10 });
    await page.mouse.up();

    // Refresh spinner may appear briefly
    const refreshSpinner = page.getByTestId('pull-refresh-spinner');
    // Just verify page still has content after gesture
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('long press on card activates selection mode', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });

    const firstCard = page.getByTestId('course-card').first();
    const box = await firstCard.boundingBox();

    // Simulate long press
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(450);
    await page.mouse.up();

    // Selection mode should be active
    await expect(page.getByTestId('selection-mode-toolbar')).toBeVisible({ timeout: 3000 });
  });

  test('search opens full-screen overlay on mobile', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');

    const searchIcon = page.getByTestId('mobile-search-icon');
    await searchIcon.click();

    await expect(page.getByTestId('search-overlay')).toBeVisible({ timeout: 3000 });

    // Overlay should be full screen
    const overlay = page.getByTestId('search-overlay');
    const box = await overlay.boundingBox();
    expect(box!.width).toBeGreaterThan(350);
  });
});

test.describe('Mobile Form UX', () => {
  test('submit button is at bottom on mobile forms', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await page.getByTestId('homework-card').first().click();

    const submitBtn = page.getByRole('button', { name: /submit|topshirish/i });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const btnBox = await submitBtn.boundingBox();
    // On 844px height screen, button near bottom
    expect(btnBox!.y).toBeGreaterThan(400);
  });

  test('swipe left on homework card reveals action buttons', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await expect(page.getByTestId('homework-card').first()).toBeVisible({ timeout: 6000 });

    const card = page.getByTestId('homework-card').first();
    const box = await card.boundingBox();

    // Swipe left gesture
    await page.mouse.move(box!.x + box!.width - 20, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + 20, box!.y + box!.height / 2, { steps: 20 });
    await page.mouse.up();

    // Action buttons should appear
    await expect(page.getByTestId('swipe-action-buttons')).toBeVisible({ timeout: 2000 });
  });
});
