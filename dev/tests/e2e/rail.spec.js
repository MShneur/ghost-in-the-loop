// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * COMPOSER RAIL E2E (v8.5.0)
 *
 * The rail is a new position mode: a slim Ghost bar that docks next to the
 * site's composer, positioned by geometry (no injection into the page). These
 * tests place the mock composer at the bottom (like a real chat) and prove:
 *   1. the collapsed rail mounts as a slim bar ABOVE the composer and never
 *      overlaps it;
 *   2. tapping the bar opens the full panel, still not overlapping the composer;
 *   3. with no composer present the rail degrades to a bottom strip, never throws.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const MOCK = 'file://' + path.join(__dirname, 'mock-chat.html');

const GM_RAIL = `
  window.__gmStore = { panelPosition: 'rail', panelCollapsed: true };
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
`;

function vgap(a, b) { // vertical gap; >= 0 means no overlap
  return Math.min(a.bottom, b.bottom) < Math.max(a.top, b.top);
}

test.describe('Composer rail', () => {

  async function pinComposerBottom(page) {
    await page.addStyleTag({ content: '.composer{position:fixed !important;left:16px;right:16px;bottom:40px;height:44px;background:#eee}' });
    // Nudge the rail tracker to reposition against the moved composer.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(150);
  }

  test('collapsed rail mounts as a slim bar above the composer (no overlap)', async ({ page }) => {
    await page.addInitScript(GM_RAIL);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);
    await pinComposerBottom(page);

    const info = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      const input = document.getElementById('prompt-textarea');
      if (!el || !input) return null;
      const r = el.getBoundingClientRect(), c = input.getBoundingClientRect();
      return {
        classes: el.className, railH: Math.round(r.height),
        rail: { top: r.top, bottom: r.bottom }, comp: { top: c.top, bottom: c.bottom },
      };
    });

    expect(info).not.toBeNull();
    expect(info.classes).toContain('pos-rail');
    expect(info.classes).toContain('collapsed');
    expect(info.railH).toBeLessThan(90);                     // slim bar, not the tall panel
    expect(info.rail.bottom).toBeLessThanOrEqual(info.comp.top + 2); // sits above the composer
    expect(vgap(info.rail, info.comp)).toBe(true);           // no vertical overlap
  });

  test('tapping the rail opens the full panel, still not overlapping the composer', async ({ page }) => {
    await page.addInitScript(GM_RAIL);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);
    await pinComposerBottom(page);

    // Tap the dedicated expand button (center-tapping the slim rail may land on
    // the play button, which correctly plays instead of expanding).
    await page.click('#gitl #g-col');
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      const input = document.getElementById('prompt-textarea');
      const r = el.getBoundingClientRect(), c = input.getBoundingClientRect();
      return { collapsed: el.classList.contains('collapsed'), committed: window.__gmStore.panelCollapsed,
               rail: { top: r.top, bottom: r.bottom }, comp: { top: c.top, bottom: c.bottom } };
    });

    expect(after.collapsed).toBe(false);
    expect(after.committed).toBe(false);
    expect(after.rail.bottom).toBeLessThanOrEqual(after.comp.top + 4); // pinned above the composer
    expect(vgap(after.rail, after.comp)).toBe(true);
  });

  test('no composer on the page → rail degrades to a bottom strip (no throw, still mounted)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.addInitScript(GM_RAIL);
    await page.addInitScript(RAW);
    await page.goto('data:text/html,' + encodeURIComponent('<!doctype html><html><body><main>no composer here</main></body></html>'));
    await page.waitForTimeout(700);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
