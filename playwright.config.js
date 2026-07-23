// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');

/**
 * Playwright config for Ghost in the Loop e2e.
 *
 * Two engines, on purpose. The Gemini "panel never appears" saga (v8.1.0–8.1.5)
 * happened because every test ran in Chromium while the field failure was
 * Firefox Android — so a whole class of engine-specific behaviour (Trusted
 * Types enforcement, in the end) went unexercised. We now run the suite in
 * BOTH Chromium and Firefox.
 *
 * Firefox note: Playwright's Firefox is desktop Gecko, not GeckoView/Android.
 * It is NOT a perfect stand-in for Firefox Android, but it shares the Gecko
 * engine and the same Trusted Types / CSP implementation, which is exactly the
 * layer that bit us. Treat Firefox-project passes as "Gecko-validated," not
 * "Android-certified" — real-device confirmation still belongs to the reporter.
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
      // Approximate the reporter's environment (mobile viewport + Android UA)
      // while keeping the real Gecko engine that enforces Trusted Types.
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
  use: {
    headless: true,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects,
});
