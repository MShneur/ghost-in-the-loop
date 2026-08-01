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

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
// Expose a closure local for assertions. v8.1.4 wrapped the IIFE body in
// try/catch, so inject INSIDE the try (before the outer catch) where GHOST is
// in scope; fall back to the old before-`})()` spot for pre-8.1.4 builds.
const EXPOSE = `
window.__GITL_GHOST = GHOST;
window.__GITL_captureSendContext = _captureSendContext;
window.__GITL_sendContextUnchanged = _sendContextUnchanged;
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, `\n${EXPOSE}\n} catch(__gitlBootErr)`)
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, `${EXPOSE}\n$1`);

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
      G.loop.sendPending = true;            // first dispatch is awaiting confirmation
      G.loop.conversationBound = false;     // new chat has not received its route id
      history.pushState({}, '', location.pathname + '#c/00000000-fake-uuid');
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => ({
      state: window.__GITL_GHOST.loop.state,
      bound: window.__GITL_GHOST.loop.conversationBound,
      review: window.__GITL_GHOST.loop.conversationReviewRequired
    }));
    expect(result).toEqual({ state: 'RUNNING', bound: true, review: false });
  });

  test('a route change with NO recent send still pauses (real navigation)', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const G = window.__GITL_GHOST;
      G.loop.state = 'RUNNING';
      G.loop.lastDispatchConfirmedAt = 0;         // nothing sent recently
      G.loop.sendPending = false;
      history.pushState({}, '', location.pathname + '#settings');
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => ({
      state: window.__GITL_GHOST.loop.state,
      review: window.__GITL_GHOST.loop.conversationReviewRequired
    }));
    expect(result).toEqual({ state: 'PAUSED', review: true });
  });

  test('a bound conversation cannot switch routes inside the post-send window', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const G = window.__GITL_GHOST;
      G.loop.state = 'RUNNING';
      G.loop.sendPending = false;
      G.loop.lastDispatchConfirmedAt = Date.now();
      G.loop.conversationBound = true;
      history.pushState({}, '', location.pathname + '#different-conversation');
    });
    await page.waitForTimeout(200);

    expect(await page.evaluate(() => ({
      state: window.__GITL_GHOST.loop.state,
      review: window.__GITL_GHOST.loop.conversationReviewRequired
    }))).toEqual({ state: 'PAUSED', review: true });
  });

  test('any navigation invalidates a command-bound pre-dispatch context', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOCK);
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const context = window.__GITL_captureSendContext();
      const before = window.__GITL_sendContextUnchanged(context);
      history.pushState({}, '', location.pathname + '#moved');
      const after = window.__GITL_sendContextUnchanged(context);
      return { before, after };
    });

    expect(result).toEqual({ before: true, after: false });
  });
});
