import { test, expect, Page } from '@playwright/test';

async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'teacher@test.com');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
  await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 8000 });
}

test.describe('Teacher — Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('dashboard shows 4 KPI cards', async ({ page }) => {
    await loginAsTeacher(page);
    const kpiCards = page.getByTestId('kpi-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 5000 });
    const count = await kpiCards.count();
    expect(count).toBe(4);
  });

  test('sidebar shows teacher nav items', async ({ page }) => {
    await loginAsTeacher(page);
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    // Teacher-specific nav items
    await expect(sidebar.getByRole('link', { name: /groups|guruhlar/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /attendance|davomat/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /homework|vazifalar/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /students|talabalar/i })).toBeVisible();
  });

  test('groups page loads group cards', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/groups');
    await expect(page.getByTestId('group-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('attendance page: mark attendance for a student', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/attendance');

    // Select a group if needed
    const groupSelect = page.getByTestId('attendance-group-select');
    if (await groupSelect.isVisible()) {
      await groupSelect.selectOption({ index: 0 });
    }

    await expect(page.getByTestId('attendance-student-row').first()).toBeVisible({ timeout: 6000 });

    // Mark first student as present
    const presentCheckbox = page
      .getByTestId('attendance-student-row')
      .first()
      .getByRole('checkbox', { name: /present|keldi/i });
    await presentCheckbox.check();
    await expect(presentCheckbox).toBeChecked();
  });

  test('create homework: fill form and submit', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/homework');

    // Open create form
    await page.getByRole('button', { name: /create|new|yangi/i }).click();
    await expect(page.getByTestId('homework-form')).toBeVisible({ timeout: 3000 });

    // Fill in title
    await page.getByLabel(/title|sarlavha/i).fill('Chapter 5 Exercises');

    // Fill in description
    await page.getByLabel(/description|tavsif/i).fill('Complete all exercises from chapter 5.');

    // Set due date
    const dueDateInput = page.getByLabel(/due date|muddat/i);
    await dueDateInput.fill('2024-12-31');

    // Select group
    const groupSelect = page.getByLabel(/group|guruh/i);
    await groupSelect.selectOption({ index: 0 });

    // Submit
    await page.getByRole('button', { name: /save|create|saqlash/i }).click();

    await expect(
      page.getByText(/created|saved|muvaffaqiyatli/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('students page loads student list', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/students');
    await expect(page.getByTestId('student-row').first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Teacher — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login as teacher and land on dashboard', async ({ page }) => {
    await loginAsTeacher(page);
    await expect(page.getByTestId('kpi-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('bottom nav is visible', async ({ page }) => {
    await loginAsTeacher(page);
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });

  test('bottom nav shows teacher tabs', async ({ page }) => {
    await loginAsTeacher(page);
    const bottomNav = page.getByTestId('bottom-nav');

    await expect(bottomNav.getByTestId('nav-dashboard')).toBeVisible();
    await expect(bottomNav.getByTestId('nav-groups')).toBeVisible();
    await expect(bottomNav.getByTestId('nav-attendance')).toBeVisible();
    await expect(bottomNav.getByTestId('nav-students')).toBeVisible();
  });

  test('sidebar is NOT visible on mobile', async ({ page }) => {
    await loginAsTeacher(page);
    await expect(page.getByTestId('sidebar-nav')).not.toBeVisible();
  });

  test('navigate to groups via bottom nav', async ({ page }) => {
    await loginAsTeacher(page);
    await page.getByTestId('bottom-nav').getByTestId('nav-groups').click();
    await expect(page).toHaveURL(/\/teacher\/groups/, { timeout: 5000 });
  });

  test('groups page shows cards on mobile', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/groups');
    await expect(page.getByTestId('group-card').first()).toBeVisible({ timeout: 6000 });
  });

  test('dashboard KPI cards visible', async ({ page }) => {
    await loginAsTeacher(page);
    const count = await page.getByTestId('kpi-card').count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
