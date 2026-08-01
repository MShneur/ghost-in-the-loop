// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');

/**
 * Playwright config for Ghost in the Loop e2e.
 *
 * Two engines plus an explicit mobile-emulation project, on purpose. The
 * Gemini "panel never appears" saga (v8.1.0–8.1.5) happened because every test
 * ran in Chromium while the field failure was Firefox Android — so a whole
 * class of engine-specific behaviour went unexercised.
 *
 * Firefox note: both Firefox projects use Playwright's desktop Gecko build, not
 * GeckoView/Android. The mobile project adds touch input, a phone viewport and
 * a Firefox-for-Android-style UA, but it remains browser emulation. Treat its
 * passes as desktop-Gecko coverage of the mobile DOM class, never as Android
 * certification; real-device confirmation still belongs to the reporter.
 */

// Managed env pre-installs Chromium at a fixed path; prefer it over a
// version-pinned download. Firefox is resolved by Playwright from
// PLAYWRIGHT_BROWSERS_PATH automatically, so it needs no explicit path.
const chromiumPath = fs.existsSync('/opt/pw-browsers/chromium/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium/chrome-linux/chrome'
  : (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

// Only advertise the Firefox project if a Firefox build is actually present,
// so the suite still runs on Chromium-only machines without hard-failing.
// Checks every location a Firefox build can live: the managed-env path
// (/opt/pw-browsers), an explicit PLAYWRIGHT_BROWSERS_PATH, and Playwright's
// default cache (~/.cache/ms-playwright — where CI's `playwright install
// firefox` lands). Without this, CI would install Firefox but never run it.
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
    },
  });
  projects.push({
    name: 'mobile-firefox',
    use: {
      ...devices['Desktop Firefox'],
      viewport: { width: 412, height: 915 },
      userAgent: 'Mozilla/5.0 (Android 16; Mobile; rv:153.0) Gecko/153.0 Firefox/153.0',
      hasTouch: true,
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
  use: {
    headless: true,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects,
});
