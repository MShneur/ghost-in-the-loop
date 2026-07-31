// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');

const chromiumPath = fs.existsSync('/opt/pw-browsers/chromium/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium/chrome-linux/chrome'
  : (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

const firefoxAvailable = (() => {
  const os = require('os');
  const dirs = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/pw-browsers',
    require('path').join(os.homedir(), '.cache', 'ms-playwright'),
  ].filter(Boolean);
  for (const d of dirs) {
    try { if (fs.existsSync(d) && fs.readdirSync(d).some(x => /^firefox-/.test(x))) return true; } catch (_) {}
  }
  return false;
})();

const projects = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
    },
  },
];

if (firefoxAvailable) {
  projects.push({
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      viewport: { width: 412, height: 915 },
      userAgent: 'Mozilla/5.0 (Android 16; Mobile; rv:153.0) Gecko/153.0 Firefox/153.0',
    },
  });
}

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'e2e-results.json' }]] : 'list',
  outputDir: './test-results/results',
  use: {
    headless: true,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects,
});
