// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for Ghost in the Loop boot-timing tests.
 *
 * These tests catch the class of bug unit tests CANNOT:
 * script behavior at document-start, when document.head/body are null.
 *
 * Run locally:  npm run test:e2e
 * Run in CI:    same, via .github/workflows/test.yml
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'e2e-results.json' }]] : 'list',
  use: {
    headless: true,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    // Managed environments pre-install chromium at a fixed path; use it if
    // present instead of downloading a version-pinned browser build.
    launchOptions: require('fs').existsSync('/opt/pw-browsers/chromium/chrome-linux/chrome')
      ? { executablePath: '/opt/pw-browsers/chromium/chrome-linux/chrome' }
      : (require('fs').existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        ? { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
