import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 8000 });
}

test.describe('Admin — Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('dashboard shows 6 KPI cards', async ({ page }) => {
    await loginAsAdmin(page);
    const kpiCards = page.getByTestId('kpi-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
    const count = await kpiCards.count();
    expect(count).toBe(6);
  });

  test('dashboard shows revenue chart', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 8000 });
  });

  test('courses page loads DataTable on desktop', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('columnheader').first()).toBeVisible();
  });

  test('create course: modal opens on button click', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');
    await page.getByRole('button', { name: /create|new|yangi kurs/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
  });

  test('create course: form validates required fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');
    await page.getByRole('button', { name: /create|new|yangi kurs/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /save|create|saqlash/i }).click();

    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 3000 });
  });

  test('create course: form submits with valid data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');
    await page.getByRole('button', { name: /create|new|yangi kurs/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/course name|kurs nomi/i).fill('Advanced English B2');
    await dialog.getByLabel(/description|tavsif/i).fill('Advanced English language course.');

    // Select a teacher if field exists
    const teacherSelect = dialog.getByLabel(/teacher|o'qituvchi/i);
    if (await teacherSelect.isVisible()) {
      await teacherSelect.selectOption({ index: 0 });
    }

    await dialog.getByRole('button', { name: /save|create|saqlash/i }).click();

    await expect(
      page.getByText(/created|saved|muvaffaqiyatli/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('students page shows student list with search', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/students');

    await expect(page.getByRole('table')).toBeVisible({ timeout: 6000 });

    // Search functionality
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('Ali');

    // Wait for debounced search results
    await page.waitForTimeout(400);
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 5000 });
  });

  test('payments page shows invoice list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payments');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 6000 });
  });

  test('payments page has status filter tabs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payments');

    await expect(page.getByRole('tab', { name: /all|barchasi/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /pending|kutilmoqda/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /paid|to'langan/i })).toBeVisible();
  });

  test('payments status filter works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payments');

    await page.getByRole('tab', { name: /pending|kutilmoqda/i }).click();

    // Wait for filtered results
    await page.waitForResponse((r) => r.url().includes('/payments'));
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
  });

  test('reports page: generate report triggers download', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/reports');

    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: /generate|export|download|yuklab/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/i);
  });
});

test.describe('Admin — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login as admin and see dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('kpi-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('courses page shows card list on mobile (not table)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('table')).not.toBeVisible();
  });

  test('bottom nav is visible', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });

  test('sidebar is not visible on mobile admin', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('sidebar-nav')).not.toBeVisible();
  });
});
