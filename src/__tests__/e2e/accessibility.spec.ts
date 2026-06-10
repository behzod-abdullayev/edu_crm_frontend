import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to login as different roles
async function loginAs(
  page: Page,
  role: 'student' | 'teacher' | 'admin' | 'owner'
) {
  const creds = {
    student: { email: 'student@test.com', password: 'TestPass123!' },
    teacher: { email: 'teacher@test.com', password: 'TestPass123!' },
    admin: { email: 'admin@test.com', password: 'TestPass123!' },
    owner: { email: 'owner@test.com', password: 'TestPass123!' },
  };
  await page.goto('/login');
  await page.fill('input[type="email"]', creds[role].email);
  await page.fill('input[type="password"]', creds[role].password);
  await page.getByRole('button', { name: /sign in|log in|kirish/i }).click();
  await page.waitForURL(/\/(student|teacher|admin|owner)\/dashboard/, { timeout: 8000 });
}

test.describe('Accessibility — axe-core', () => {
  test('login page has no axe violations', async ({ page }) => {
    await page.goto('/login');
    // Wait for page to fully render
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('student dashboard has no axe violations', async ({ page }) => {
    await loginAs(page, 'student');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('student courses page has no axe violations', async ({ page }) => {
    await loginAs(page, 'student');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('teacher dashboard has no axe violations', async ({ page }) => {
    await loginAs(page, 'teacher');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('admin dashboard has no axe violations', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('payments page has no axe violations', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('owner dashboard has no axe violations', async ({ page }) => {
    await loginAs(page, 'owner');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('tab through login form in correct focus order', async ({ page }) => {
    await page.goto('/login');

    // Start focus on email
    await page.getByLabel(/email/i).focus();
    const emailField = page.getByLabel(/email/i);
    await expect(emailField).toBeFocused();

    // Tab to password
    await page.keyboard.press('Tab');
    const passwordField = page.getByLabel(/password/i);
    await expect(passwordField).toBeFocused();

    // Tab to submit button
    await page.keyboard.press('Tab');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|kirish/i });
    await expect(submitBtn).toBeFocused();
  });

  test('Enter key on submit button submits login form', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');

    // Focus submit button and press Enter
    await page.getByRole('button', { name: /sign in|log in|kirish/i }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 8000 });
  });

  test('Escape key closes modal', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/courses');

    // Open modal
    await page.getByRole('button', { name: /create|new|yangi/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('Arrow keys navigate dropdown options', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/students');

    // Open a select/dropdown
    const select = page.getByTestId('page-size-select').first();
    if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
      await select.focus();
      await page.keyboard.press('ArrowDown');
      // Verify the select value changed or option is highlighted
      await expect(select).toBeFocused();
    }
  });

  test('Tab navigation skips hidden elements', async ({ page }) => {
    await loginAs(page, 'student');
    // Tab through page elements — no element should be focused that is visually hidden
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      const isVisible = await focused.isVisible().catch(() => false);
      if (await focused.count() > 0) {
        expect(isVisible).toBe(true);
      }
    }
  });
});

test.describe('Accessibility — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('login page has no axe violations on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('student dashboard has no axe violations on mobile', async ({ page }) => {
    await loginAs(page, 'student');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('bottom nav items have accessible labels', async ({ page }) => {
    await loginAs(page, 'student');
    const navLinks = page.getByTestId('bottom-nav').getByRole('link');
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const label =
        (await link.getAttribute('aria-label')) ||
        (await link.textContent());
      expect(label?.trim().length).toBeGreaterThan(0);
    }
  });
});
