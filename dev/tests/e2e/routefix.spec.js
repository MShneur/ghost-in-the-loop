// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * ROUTE-CHANGE E2E (v8.1.2) — the Grok "paused 1s after a good send" bug.
 *
 * Field report: send_ok, then "Route changed — paused" one second later.
 * Grok (like most chat platforms) assigns a "/c/<uuid>" URL to a brand-new
 * conversation right after the first message — that's a same-conversation
 * continuation, not real navigation, and must not pause a running loop.
 * A genuine navigation to a different host still should.
 */

const SCRIPT = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '')
  .replace(/(\}\)\(\)\s*;?\s*)$/, 'window.__GITL_GHOST = GHOST;\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const MOCK = 'file://' + path.join(__dirname, 'mock-chat.html');

test.describe('Route change — post-send conversation-id URL does not pause', () => {

  test('same-host pushState right after a send keeps the loop RUNNING', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const G = window.__GITL_GHOST;
      G.loop.state = 'RUNNING';
      G.loop.lastActivity = Date.now();     // "just sent" within the 15s window
      history.pushState({}, '', location.pathname + '#c/00000000-fake-uuid');
    });
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window.__GITL_GHOST.loop.state);
    expect(state).toBe('RUNNING');
  });

  test('a route change with NO recent send still pauses (real navigation)', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const G = window.__GITL_GHOST;
      G.loop.state = 'RUNNING';
      G.loop.lastActivity = Date.now() - 60000;   // nothing sent recently
      G.loop.sendPending = false;
      history.pushState({}, '', location.pathname + '#settings');
    });
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window.__GITL_GHOST.loop.state);
    expect(state).toBe('PAUSED');
  });
});
