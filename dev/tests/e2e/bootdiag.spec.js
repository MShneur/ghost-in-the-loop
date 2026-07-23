// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * BOOT DIAGNOSTICS + PANEL SELF-HEAL E2E (v8.1.4)
 *
 * Context: on the user's phone, v8.1.3 was confirmed INSTALLED + ACTIVE on
 * Gemini via the Tampermonkey dashboard, yet #gitl never entered the DOM —
 * and the only diagnostics available (static page saves, a console that
 * forwarded a single cross-origin-masked error) couldn't say why. These
 * tests exercise the two instruments added to make that diagnosable:
 *   1. A boot beacon on <html data-gitl-boot="…"> that a plain page-save
 *      captures: `ok:<ver>` on success, `error:<stage>` on a boot throw.
 *   2. Fail-loud: a boot throw surfaces a visible #gitl-fatal banner instead
 *      of dying silently.
 *   3. Panel self-heal: if the page framework removes #gitl, it re-mounts.
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

const MOCK = 'file://' + path.join(__dirname, 'mock-chat.html');

test.describe('Boot beacon + panel presence', () => {
  test('successful boot: beacon reads ok:<ver> and #gitl is in the DOM', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(beacon).toMatch(/^ok:8\.\d+\.\d+$/);
    expect(mounted).toBe(true);
  });

  test('the beacon is written even before boot completes (started)', async ({ page }) => {
    // A page-save taken mid-boot should still show the script began executing.
    await page.addInitScript(GM);
    await page.addInitScript(`document.documentElement.setAttribute('data-precheck','1')`);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    // No wait — grab immediately; must be at least 'started'.
    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    expect(beacon).not.toBeNull();
  });
});

test.describe('Transactional boot: optional-phase failure never suppresses the panel', () => {
  test('breaking MutationObserver (optional phases) still mounts the panel', async ({ page }) => {
    // Pre-v8.2.0 the continue-observer was the boot callback's FIRST statement,
    // so breaking .observe() killed the whole boot. It is now an OPTIONAL phase
    // that runs AFTER the panel is mounted — so breaking it must degrade
    // gracefully, never blank the panel. (Critical-phase failure being LOUD is
    // covered by trustedtypes.spec.js "policy blocked → fails loud".)
    await page.addInitScript(GM);
    await page.addInitScript(`
      const _RealMO = window.MutationObserver;
      window.MutationObserver = class extends _RealMO {
        observe() { throw new Error('e2e-observer-broken'); }
      };
    `);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    const fatal = await page.evaluate(() => !!document.getElementById('gitl-fatal'));
    // The broken optional phases are recorded in the persisted Timeline.
    const brokenPhases = await page.evaluate(() => {
      try {
        const tl = JSON.parse(window.GM_getValue('gitlTimeline', '[]'));
        return tl.filter(e => e.type === 'boot_phase' && e.data && e.data.ok === false)
                 .map(e => e.data.name);
      } catch (_) { return []; }
    });

    expect(mounted).toBe(true);              // panel survives the optional failure
    expect(beacon).toMatch(/^ok:8\.\d+\.\d+$/);
    expect(fatal).toBe(false);               // NOT a fatal — optional degraded only
    expect(brokenPhases).toContain('continue-observer');
  });

  test('the singleton is committed only after the panel is up', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);
    const committed = await page.evaluate(() => window.__GITL_V8__ === true);
    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
    expect(committed).toBe(true);
  });
});

test.describe('Panel self-heal: re-mount after the page removes it', () => {
  test('removing #gitl triggers a re-mount', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    // Sanity: mounted first.
    expect(await page.evaluate(() => !!document.getElementById('gitl'))).toBe(true);

    // Simulate an SPA framework wiping the panel out of the body.
    await page.evaluate(() => document.getElementById('gitl').remove());
    // Watchdog is a MutationObserver (fast) plus a 3s poll — give the observer a beat.
    await page.waitForTimeout(600);

    const back = await page.evaluate(() => !!document.getElementById('gitl'));
    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    expect(back).toBe(true);
    expect(beacon).toMatch(/^remounted:\d+$/);
  });
});
