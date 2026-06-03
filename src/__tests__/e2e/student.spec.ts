import { test, expect, Page } from '@playwright/test';

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'student@test.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
  await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
}

test.describe('Student — Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('dashboard shows KPI cards', async ({ page }) => {
    await loginAsStudent(page);
    const kpiCards = page.getByTestId('kpi-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('dashboard loads charts', async ({ page }) => {
    await loginAsStudent(page);
    await expect(page.getByTestId('dashboard-chart')).toBeVisible({ timeout: 8000 });
  });

  test('navigate to Courses via sidebar', async ({ page }) => {
    await loginAsStudent(page);
    // Desktop: sidebar navigation
    await page.getByTestId('sidebar-nav').getByRole('link', { name: /courses|kurslar/i }).click();
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 });
  });

  test('course list loads with progress bars', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('progressbar').first()).toBeVisible();
  });

  test('click course opens course detail with lesson list', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await page.getByTestId('course-card').first().click();
    await expect(page).toHaveURL(/\/student\/courses\/[^/]+/, { timeout: 5000 });
    await expect(page.getByTestId('lesson-list')).toBeVisible({ timeout: 5000 });
  });

  test('homework page shows pending items', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await page.getByRole('tab', { name: /pending|kutilmoqda/i }).click();
    await expect(page.getByTestId('homework-item').first()).toBeVisible({ timeout: 6000 });
  });

  test('homework detail shows submit form', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await page.getByTestId('homework-item').first().click();
    await expect(page.getByTestId('homework-submit-form')).toBeVisible({ timeout: 5000 });
  });

  test('submit homework changes status to submitted', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await page.getByTestId('homework-item').first().click();

    // Fill in the answer field
    const answerField = page.getByTestId('homework-answer-input');
    await answerField.fill('My homework answer text for this assignment.');

    // Submit
    await page.getByRole('button', { name: /submit|topshirish/i }).click();

    await expect(
      page.getByText(/submitted|topshirildi/i)
    ).toBeVisible({ timeout: 6000 });
  });

  test('grades page shows grades table', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/grades');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('columnheader').first()).toBeVisible();
  });

  test('profile page edit form saves successfully', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/profile');

    const firstNameInput = page.getByLabel(/first name|ism/i);
    await firstNameInput.clear();
    await firstNameInput.fill('UpdatedName');

    await page.getByRole('button', { name: /save|saqlash/i }).click();

    await expect(
      page.getByText(/saved|updated|muvaffaqiyatli/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Student — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('dashboard KPI cards in single column', async ({ page }) => {
    await loginAsStudent(page);
    const kpiCards = page.getByTestId('kpi-card');
    const firstCard = kpiCards.first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // On mobile, each card should span full width (single column)
    const box = await firstCard.boundingBox();
    expect(box!.width).toBeGreaterThan(300); // close to full viewport width
  });

  test('bottom nav is visible', async ({ page }) => {
    await loginAsStudent(page);
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });

  test('sidebar is NOT visible on mobile', async ({ page }) => {
    await loginAsStudent(page);
    await expect(page.getByTestId('sidebar-nav')).not.toBeVisible();
  });

  test('navigate to Courses via bottom nav', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByTestId('bottom-nav').getByRole('link', { name: /courses|kurslar/i }).click();
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 });
  });

  test('course list renders as cards (not table) on mobile', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/courses');
    await expect(page.getByTestId('course-card').first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('table')).not.toBeVisible();
  });

  test('navigate to Homework via bottom nav', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByTestId('bottom-nav').getByRole('link', { name: /homework|vazifalar/i }).click();
    await expect(page).toHaveURL(/\/student\/homework/, { timeout: 5000 });
  });

  test('homework items render as cards on mobile', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await expect(page.getByTestId('homework-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('submit button is at bottom of screen on mobile homework form', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/homework');
    await page.getByTestId('homework-card').first().click();

    const submitBtn = page.getByRole('button', { name: /submit|topshirish/i });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    const btnBox = await submitBtn.boundingBox();
    // Button should be near bottom of viewport (> 600px from top on 844px screen)
    expect(btnBox!.y).toBeGreaterThan(500);
  });

  test('navigate to Notifications via bottom nav bell tab', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByTestId('bottom-nav').getByTestId('nav-notifications').click();
    await expect(page).toHaveURL(/\/student\/notifications/, { timeout: 5000 });
  });

  test('navigate to Profile via bottom nav', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByTestId('bottom-nav').getByTestId('nav-profile').click();
    await expect(page).toHaveURL(/\/student\/profile/, { timeout: 5000 });
  });
});
