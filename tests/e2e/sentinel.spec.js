// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * PANEL SENTINEL E2E (v8.2.0) — bounded, visibility-aware liveness.
 *
 * Replaces the v8.1.4 watchdog (absence-only, unbounded). Verifies:
 *   1. a host that moves #gitl into a display:none container is rescued
 *      (visibility awareness, not just absence);
 *   2. a relentless remover trips the CIRCUIT BREAKER — remounts are capped
 *      and a visible note appears, instead of an infinite append/remove storm.
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

test.describe('Panel sentinel', () => {

  test('rescues a panel hidden inside a display:none container (visibility-aware)', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => !!document.getElementById('gitl'))).toBe(true);

    // Host moves #gitl into a hidden subtree (connected, but not visible) —
    // the old absence-only watchdog would NOT have caught this.
    await page.evaluate(() => {
      const hidden = document.createElement('div');
      hidden.style.display = 'none';
      document.body.appendChild(hidden);
      hidden.appendChild(document.getElementById('gitl'));
    });
    await page.waitForTimeout(700);

    const visible = await page.evaluate(() => {
      const n = document.getElementById('gitl');
      if (!n) return false;
      const st = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      return st.display !== 'none' && st.visibility !== 'hidden' && (r.width > 2 || r.height > 2);
    });
    expect(visible).toBe(true);   // sentinel re-appended it to body → visible again
  });

  test('a relentless remover trips the bounded circuit breaker (no infinite storm)', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    // Remove #gitl on every DOM mutation — a hostile re-render loop.
    await page.evaluate(() => {
      const killer = new MutationObserver(() => {
        const n = document.getElementById('gitl');
        if (n) n.remove();
      });
      killer.observe(document.documentElement, { childList: true, subtree: true });
      // Kick it off.
      const n = document.getElementById('gitl');
      if (n) n.remove();
    });
    // Give the sentinel time to hit its cap and open the breaker.
    await page.waitForTimeout(2500);

    const beacon = await page.evaluate(() => document.documentElement.getAttribute('data-gitl-boot'));
    const breakerShown = await page.evaluate(() => !!document.getElementById('gitl-sentinel'));
    const remountCount = await page.evaluate(() => {
      try {
        const tl = JSON.parse(window.GM_getValue('gitlTimeline', '[]'));
        return tl.filter(e => e.type === 'panel_remount').length;
      } catch (_) { return 0; }
    });
    const opened = await page.evaluate(() => {
      try {
        const tl = JSON.parse(window.GM_getValue('gitlTimeline', '[]'));
        return tl.some(e => e.type === 'panel_circuit_open');
      } catch (_) { return false; }
    });

    expect(opened).toBe(true);            // breaker opened
    expect(breakerShown).toBe(true);      // visible note shown
    expect(beacon).toBe('sentinel-open');
    // Remounts are capped (MAX=5), NOT unbounded — the whole point.
    expect(remountCount).toBeLessThanOrEqual(5);
  });
});
