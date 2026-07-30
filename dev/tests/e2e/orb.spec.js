// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * ORB LAUNCHER E2E (v8.3.0)
 *
 * The orb is a new position mode: a tiny circle tucked ~12px past the screen
 * edge that opens the full panel on tap and can be dragged to either edge.
 * These tests run the REAL userscript in Chromium + Firefox and prove:
 *   1. selecting orb mounts a small (~52px) circle tucked past the right edge;
 *   2. the spin ring is present and turns the "running" colour when RUNNING;
 *   3. tapping the orb expands it to the full 268px panel;
 *   4. dragging across the viewport midline snaps it to the opposite edge and
 *      persists that choice.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const MOCK = 'file://' + path.join(__dirname, 'mock-chat.html');

// GM shim that pre-seeds the store so the panel boots straight into orb mode.
const GM_ORB = `
  window.__gmStore = { panelPosition: 'orb', panelCollapsed: true };
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
`;

test.describe('Orb launcher', () => {

  test('boots into a small circle tucked past the right edge', async ({ page }) => {
    await page.addInitScript(GM_ORB);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const info = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        classes: el.className,
        w: Math.round(r.width),
        h: Math.round(r.height),
        right: Math.round(r.right),
        vw: window.innerWidth,
        ringShown: !!el.querySelector('.g-orb-ring') &&
          getComputedStyle(el.querySelector('.g-orb-ring')).display !== 'none',
        // v8.5.1 spill regression guard: the platform badge + header buttons
        // must be display:none, or they leak outside the circle (Perplexity
        // mobile field report). getComputedStyle reports the element's own
        // value, so check the button-span PARENT that carries inline flex.
        platHidden: (() => { const p = el.querySelector('.g-plat'); return !p || getComputedStyle(p).display === 'none'; })(),
        btnSpanHidden: (() => {
          const b = el.querySelector('#g-col'); if (!b) return true;
          // walk to the direct child span of .g-hdr
          let n = b; while (n && n.parentElement && !n.parentElement.classList.contains('g-hdr')) n = n.parentElement;
          return n ? getComputedStyle(n).display === 'none' : true;
        })(),
      };
    });

    expect(info).not.toBeNull();
    expect(info.classes).toContain('pos-orb');
    expect(info.classes).toContain('collapsed');
    expect(info.w).toBeGreaterThanOrEqual(46);
    expect(info.w).toBeLessThanOrEqual(60);      // a circle, not the 268px panel
    expect(info.h).toBeGreaterThanOrEqual(46);
    expect(info.right).toBeGreaterThan(info.vw - 2); // tucked at/past the right edge
    expect(info.ringShown).toBe(true);
    expect(info.platHidden).toBe(true);          // no platform badge spilling out
    expect(info.btnSpanHidden).toBe(true);       // no header buttons spilling out
  });

  test('the ring turns the running colour when a loop is RUNNING', async ({ page }) => {
    await page.addInitScript(GM_ORB);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const colours = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      const ring = el.querySelector('.g-orb-ring');
      const idle = getComputedStyle(ring).borderTopColor;
      // Force the running visual the same way render() does, then re-read.
      el.dataset.run = '1';
      const running = getComputedStyle(ring).borderTopColor;
      return { idle, running };
    });

    // Idle ring is the neutral border colour; running ring is the "ok" green —
    // the two must differ, proving [data-run="1"] drives the visual.
    expect(colours.idle).not.toBe(colours.running);
  });

  test('tapping the orb expands it to the full panel', async ({ page }) => {
    await page.addInitScript(GM_ORB);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    await page.click('#gitl');
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      return { classes: el.className, w: Math.round(el.getBoundingClientRect().width),
               collapsed: window.__gmStore.panelCollapsed };
    });

    expect(after.classes).not.toContain('collapsed');
    expect(after.w).toBeGreaterThanOrEqual(200);   // expanded panel
    expect(after.collapsed).toBe(false);
  });

  test('dragging across the midline snaps to the opposite (left) edge and persists', async ({ page }) => {
    await page.addInitScript(GM_ORB);
    await page.addInitScript(RAW);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const start = await page.evaluate(() => {
      const r = document.getElementById('gitl').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });

    // Drag from the right-edge orb to the far left of the viewport.
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 40, start.y + 30, { steps: 3 });
    await page.mouse.move(30, start.y + 60, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const state = await page.evaluate(() => {
      const el = document.getElementById('gitl');
      return {
        classes: el.className,
        edge: window.__gmStore.orbEdge,
        stillCollapsed: el.classList.contains('collapsed'),
        left: Math.round(el.getBoundingClientRect().left),
      };
    });

    expect(state.classes).toContain('orb-left');
    expect(state.edge).toBe('left');
    expect(state.stillCollapsed).toBe(true);       // a drag must NOT open the panel
    expect(state.left).toBeLessThan(2);            // now tucked at/past the left edge
  });
});
