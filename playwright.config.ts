import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Tests live in src/__tests__/e2e (not tests/e2e)
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // exactOptionalPropertyTypes: workers must be string|number, not undefined
  // Use 1 in CI, omit the key entirely in dev by spreading conditionally
  ...(process.env['CI'] ? { workers: 1 } : {}),
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    process.env['CI'] ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'desktop-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});