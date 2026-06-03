import { test, expect, devices } from '@playwright/test';

const CREDENTIALS = {
  student: { email: 'student@test.com', password: 'TestPass123!' },
  teacher: { email: 'teacher@test.com', password: 'TestPass123!' },
  admin: { email: 'admin@test.com', password: 'TestPass123!' },
  owner: { email: 'owner@test.com', password: 'TestPass123!' },
};

// Tests run for both desktop and mobile via playwright.config.ts projects

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('login page is visible at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error message with wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();

    await expect(
      page.getByText(/invalid credentials|wrong password|incorrect/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('student login redirects to /student/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.student.email);
    await page.fill('input[type="password"]', CREDENTIALS.student.password);
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();

    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
  });

  test('teacher login redirects to /teacher/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.teacher.email);
    await page.fill('input[type="password"]', CREDENTIALS.teacher.password);
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();

    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 8000 });
  });

  test('admin login redirects to /admin/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 8000 });
  });

  test('JWT stored in localStorage after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.student.email);
    await page.fill('input[type="password"]', CREDENTIALS.student.password);
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();

    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });

    const storage = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(storage).not.toBeNull();
    const parsed = JSON.parse(storage!);
    expect(parsed.state?.accessToken).toBeTruthy();
  });

  test('logout via avatar menu redirects to /login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.student.email);
    await page.fill('input[type="password"]', CREDENTIALS.student.password);
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });

    // Open avatar menu
    await page.getByTestId('avatar-menu-button').click();
    await page.getByRole('menuitem', { name: /log out|sign out|chiqish/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('protected route without auth redirects to /login', async ({ page }) => {
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('forgot password form accepts email and shows success', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/forgot password|parolni unutdingizmi/i).click();

    await expect(page).toHaveURL(/\/forgot-password|\/reset-password/, { timeout: 3000 });

    await page.fill('input[type="email"]', 'test@test.com');
    await page.getByRole('button', { name: /send|reset|yuborish/i }).click();

    await expect(
      page.getByText(/check your email|sent|muvaffaqiyatli/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    await page.goto('/login');

    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    // Find theme toggle button
    const themeToggle = page.getByTestId('theme-toggle');
    await themeToggle.click();

    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });
});
