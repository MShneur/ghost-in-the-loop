// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * SEND SAFETY E2E (v8.1) — the DeepSeek "Copy" incident, reproduced.
 *
 * Field report: on chat.deepseek.com the heuristic send tier clicked the
 * reply's "Copy" button (svg icon + proximity beat the old 3.5 threshold)
 * and the user's prompt was copied instead of sent.
 *
 * These tests run the REAL script in a REAL browser against a page that has
 * no configured send button — only message-action traps near the composer —
 * and assert Ghost refuses every trap, then picks the true send button the
 * moment one exists.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
// Expose closure locals for assertions. v8.1.4 wrapped the IIFE body in
// try/catch, so inject INSIDE the try (before the outer catch) where Adapter
// is in scope; fall back to the old before-`})()` spot for pre-8.1.4 builds.
const EXPOSE = 'window.__GITL_Adapter = Adapter; window.__GITL_SelMem = SelectorMemory;';
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const TRAP_PAGE = `data:text/html,${encodeURIComponent(`<!doctype html>
<html><body>
  <main>
    <div class="message assistant"><div class="markdown">A reply.</div>
      <!-- message-action traps: icon buttons with svg, right next to the composer -->
      <button aria-label="Copy" id="trap-copy"><svg width="16" height="16"></svg></button>
      <button aria-label="Download" id="trap-dl"><svg width="16" height="16"></svg></button>
      <button aria-label="Regenerate" id="trap-regen"><svg width="16" height="16"></svg></button>
      <button id="trap-anon"><svg width="16" height="16"></svg></button>
    </div>
    <footer>
      <textarea id="chat-box" placeholder="Message the model"></textarea>
    </footer>
  </main>
</body></html>`)}`;

test.describe('Send safety — no trap button is ever chosen', () => {

  test('with only traps present, getSendBtn returns nothing', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(TRAP_PAGE);
    await page.waitForTimeout(600);

    const picked = await page.evaluate(() => {
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? (b.getAttribute('aria-label') || b.id || b.tagName) : null;
    });
    expect(picked).toBe(null);
  });

  test('a real Send button wins once it exists — and traps still lose', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(TRAP_PAGE);
    await page.waitForTimeout(600);

    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'true-send';
      b.setAttribute('aria-label', 'Send message');
      b.innerHTML = '<svg width="16" height="16"></svg>';
      document.querySelector('footer').appendChild(b);
    });

    const picked = await page.evaluate(() => {
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? b.id : null;
    });
    expect(picked).toBe('true-send');
  });

  test('same-form popup toggles (#model-select-trigger, #composer-plus-btn) are refused — issues #4/#5', async ({ page }) => {
    // The exact field trap: a model-picker and a "+" attach menu live INSIDE
    // the composer form next to the input, so the heuristic's "same-form"
    // signal alone used to qualify them and SelectorMemory learned the wrong
    // control (#model-select-trigger on Grok, #composer-plus-btn on ChatGPT).
    // With no real send present, getSendBtn must return NOTHING rather than a
    // dropdown — and it must not persist a learned 'send' selector.
    const FORM_PAGE = `data:text/html,${encodeURIComponent(`<!doctype html>
      <html><body><main><form id="composer">
        <button id="model-select-trigger" aria-haspopup="listbox" aria-label="Grok 4"><svg width="16" height="16"></svg></button>
        <button id="composer-plus-btn" aria-expanded="false" aria-label="Add photos & files"><svg width="16" height="16"></svg></button>
        <textarea id="chat-box" placeholder="Ask anything"></textarea>
      </form></main></body></html>`)}`;

    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(FORM_PAGE);
    await page.waitForTimeout(600);

    // Force the input to be found and the heuristic send tier to run.
    const picked = await page.evaluate(() => {
      window.__GITL_Adapter.getInput();
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? (b.id || b.getAttribute('aria-label') || b.tagName) : null;
    });
    const learnedSend = await page.evaluate(() => {
      try {
        const mem = JSON.parse(window.GM_getValue('gitlLearnedSelectors', '{}'));
        const host = mem[location.hostname] || {};
        return host.send ? host.send.sel : null;
      } catch (_) { return 'parse-error'; }
    });

    expect(picked).toBe(null);          // never a model-picker or "+" menu
    expect(learnedSend).toBe(null);     // and nothing wrong gets persisted

    // Now add the genuine send button in the same form — it must win.
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'true-send';
      b.setAttribute('type', 'submit');
      b.setAttribute('aria-label', 'Send message');
      b.innerHTML = '<svg width="16" height="16"></svg>';
      document.getElementById('composer').appendChild(b);
    });
    const real = await page.evaluate(() => {
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? b.id : null;
    });
    expect(real).toBe('true-send');
  });

  test('a ROTTED configured selector (class*="send" on a Copy button) is refused', async ({ page }) => {
    // The generic profile ships 'button[class*="send" i]'. After a site
    // redesign that class can land on a message-action control. The veto
    // must beat the configured tier too — this was the second half of the
    // DeepSeek incident risk.
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(TRAP_PAGE);
    await page.waitForTimeout(600);

    await page.evaluate(() => {
      const b = document.createElement('button');
      b.className = 'msg-send-utils';            // matches button[class*="send" i]
      b.setAttribute('aria-label', 'Copy');      // …but it's a copy control
      b.innerHTML = '<svg width="16" height="16"></svg>';
      document.querySelector('footer').appendChild(b);
    });

    const picked = await page.evaluate(() => {
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? (b.getAttribute('aria-label') || b.id) : null;
    });
    expect(picked).toBe(null);
  });
});
