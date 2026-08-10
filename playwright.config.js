// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');

/**
 * Playwright config for Ghost in the Loop e2e.
 *
 * Two engines, on purpose. The Gemini "panel never appears" saga (v8.1.0–v8.1.5)
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

const configuredChromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumPath = configuredChromiumPath && fs.existsSync(configuredChromiumPath)
  ? configuredChromiumPath
  : fs.existsSync('/opt/pw-browsers/chromium/chrome-linux/chrome')
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

const rootLifecycleMobilePerf = /[\\/]tests[\\/]e2e[\\/]lifecycle-mobile-perf\.spec\.js$/;
const chromiumOnlyLongChatA2 = /[\\/]tests[\\/]e2e[\\/]long-chat-perf-a2\.spec\.js$/;

const projects = [
  {
    name: 'chromium',
    testIgnore: [rootLifecycleMobilePerf],
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
    },
  },
  {
    name: 'chromium-mobile',
    testMatch: [
      '**/send-evidence.spec.js',
      '**/repair-resume-production.spec.js',
      '**/native-chatgpt-takeover.spec.js',
      '**/lifecycle-mobile-perf.spec.js',
    ],
    use: {
      ...devices['Pixel 7'],
      launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
    },
  },
];

if (firefoxAvailable) {
  projects.push({
    name: 'firefox',
    testIgnore: [rootLifecycleMobilePerf, chromiumOnlyLongChatA2],
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
  use: {
    headless: true,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects,
});
