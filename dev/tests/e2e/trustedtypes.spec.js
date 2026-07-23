// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * TRUSTED TYPES E2E (v8.1.5) — the real Gemini root cause, reproduced.
 *
 * Field evidence: on the reporter's phone, GITL v8.1.4's fail-loud banner read
 *   "Element.innerHTML setter: Sink type mismatch violation blocked by CSP"
 * on Gemini. Gemini enforces `require-trusted-types-for 'script'`; under it,
 * assigning a plain string to .innerHTML throws, which killed boot on the very
 * first render. No other supported platform enforces Trusted Types — which is
 * exactly why the panel appeared everywhere except Gemini.
 *
 * These tests load the REAL userscript on a page that enforces Trusted Types
 * (Chromium honours a meta `require-trusted-types-for` CSP), proving:
 *   1. the fixture genuinely enforces TT (a raw innerHTML throws);
 *   2. GITL v8.1.5 registers a policy and mounts #gitl anyway (the fix);
 *   3. if policy creation is BLOCKED (restrictive allow-list case), GITL fails
 *      LOUD — banner + error beacon + 'tt-policy-blocked' — never silently.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
`;

const TT_PAGE = 'file://' + path.join(__dirname, 'mock-chat-tt.html');

test.describe('Trusted Types (the Gemini reproduction)', () => {

  test('the fixture really enforces Trusted Types (raw innerHTML throws)', async ({ page }) => {
    await page.goto(TT_PAGE);
    const threw = await page.evaluate(() => {
      try { document.createElement('div').innerHTML = '<b>x</b>'; return false; }
      catch (e) { return String(e.message || e); }
    });
    // If this is not a truthy error string, the rest of the suite is meaningless.
    expect(threw).toBeTruthy();
    expect(String(threw)).toMatch(/trusted|sink|policy|require-trusted-types/i);
  });

  test('v8.1.5 mounts #gitl on a Trusted-Types-enforced page (the fix)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(TT_PAGE);
    await page.waitForTimeout(900);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    const fatal = await page.evaluate(() => !!document.getElementById('gitl-fatal'));

    expect(mounted).toBe(true);           // panel is in the DOM despite TT enforcement
    expect(beacon).toMatch(/^ok:8\.\d+\.\d+$/);
    expect(fatal).toBe(false);            // no fail-loud banner — boot completed
    // No uncaught Trusted-Types sink error escaped.
    expect(pageErrors.filter(e => /sink|trusted/i.test(e))).toEqual([]);
  });

  test('if policy creation is blocked, boot fails LOUD (never silent)', async ({ page }) => {
    await page.addInitScript(GM);
    // Simulate a restrictive `trusted-types` allow-list that forbids our
    // policy: make createPolicy throw. GITL must then degrade loudly.
    await page.addInitScript(`
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        const _cp = window.trustedTypes.createPolicy.bind(window.trustedTypes);
        window.trustedTypes.createPolicy = (name, rules) => {
          if (name === 'gitl-ui') throw new TypeError('e2e: policy "gitl-ui" disallowed by trusted-types directive');
          return _cp(name, rules);
        };
      }
    `);
    await page.addInitScript(RAW);
    await page.goto(TT_PAGE);
    await page.waitForTimeout(900);

    const banner = await page.evaluate(() => {
      const b = document.getElementById('gitl-fatal');
      return b ? b.textContent : null;
    });
    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));

    // The blocked-policy path marks the beacon, then the first innerHTML throws
    // and the whole thing fails loud instead of a blank page.
    expect(banner).toContain('couldn’t start');
    expect(beacon).toMatch(/^error:/);
  });
});
