// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * NETWORK-INTERCEPTOR BOOT SAFETY E2E (v8.1.3)
 *
 * Field report: Ghost "doesn't seem to load" on gemini.google.com. A
 * SingleFile capture of the live page proved #gitl never mounted at all —
 * not a selector-matching problem, a full boot failure with zero visible
 * symptom (no error, no panel, nothing — SingleFile captures Grammarly's
 * live DOM injections in the same page, so the absence of ANY GITL trace
 * ruled out "it ran but couldn't find selectors").
 *
 * Root cause: GITL_NET.install() runs at module top-level, OUTSIDE
 * safeBoot()'s try/catch, and did THREE unguarded strict-mode property
 * writes (window.fetch, XHR.prototype.open, XHR.prototype.send). If a page
 * has hardened any of those (Object.defineProperty writable:false — a real
 * pattern on security-conscious sites), the assignment throws and — because
 * nothing catches it — kills the ENTIRE script before a single line of
 * panel code runs.
 *
 * These tests freeze window.fetch (and separately XHR.prototype.send)
 * BEFORE the script loads and assert the panel still mounts.
 */

const SCRIPT = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const MOCK = 'file://' + path.join(__dirname, 'mock-chat.html');

const FREEZE_FETCH = `
  Object.defineProperty(window, 'fetch', {
    value: window.fetch.bind(window),
    writable: false,
    configurable: false
  });
`;

const FREEZE_XHR_SEND = `
  Object.defineProperty(XMLHttpRequest.prototype, 'send', {
    value: XMLHttpRequest.prototype.send,
    writable: false,
    configurable: false
  });
`;

test.describe('Boot survives a hardened page (the Gemini reproduction)', () => {

  test('window.fetch frozen non-writable — panel still mounts', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.addInitScript(GM);
    await page.addInitScript(FREEZE_FETCH);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
    // The frozen property must not have produced an UNCAUGHT page error —
    // it's allowed to be caught-and-logged internally (console.warn), but
    // it must never escape to a real uncaught exception.
    expect(errors.filter(e => /fetch/i.test(e))).toEqual([]);
  });

  test('XMLHttpRequest.prototype.send frozen non-writable — panel still mounts', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.addInitScript(GM);
    await page.addInitScript(FREEZE_XHR_SEND);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
    expect(errors.length).toBe(0);
  });

  test('both frozen at once (worst case) — panel still mounts', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.addInitScript(GM);
    await page.addInitScript(FREEZE_FETCH);
    await page.addInitScript(FREEZE_XHR_SEND);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
    expect(errors.length).toBe(0);
  });

  test('normal (unfrozen) page still installs the interceptor as before', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(800);

    const mounted = await page.evaluate(() => !!document.getElementById('gitl'));
    expect(mounted).toBe(true);
  });
});
