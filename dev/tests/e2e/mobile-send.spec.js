// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * MOBILE SEND REPRO (v8.7.0 / Track G)
 *
 * Reproduces the ChatGPT mobile-web class: ProseMirror composer, no visible
 * Send button (dictation slot), dispatch via reviewed Enter fallback.
 */
const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const EXPOSE = `
  window.__GITL_Adapter = Adapter;
  window.__GITL_select = _selectDispatchStrategy;
  window.__GITL_hold = _composerHoldsPrompt;
  window.__GITL_forceMobileChatGpt = () => {
    PLAT.reviewed = true;
    PLAT.dispatchFallback = 'enter';
    PLAT.key = 'chatgpt';
    PLAT.send = [];
    PLAT.input = ['#prompt-textarea'];
    PLAT.assistant = ['div[data-message-author-role="assistant"]'];
    PLAT.stop = [];
  };
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const MOBILE_CHATGPT = `data:text/html,${encodeURIComponent(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
  <main>
    <div data-message-author-role="assistant">Prior reply [[GITL::PROCEED]]</div>
    <form id="composer-form">
      <div id="prompt-textarea" contenteditable="true" role="textbox"></div>
      <!-- mobile: dictation occupies send slot; no unique reviewed button -->
      <button type="button" aria-label="Dictate" id="dictate-btn"><svg width="16" height="16"></svg></button>
    </form>
  </main>
  <script>
    const ce = document.getElementById('prompt-textarea');
    ce.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        ce.textContent = '';
        const msg = document.createElement('div');
        msg.setAttribute('data-message-author-role', 'assistant');
        msg.textContent = 'Echo [[GITL::PROCEED]]';
        document.querySelector('main').insertBefore(msg, document.getElementById('composer-form'));
      }
    });
  </script>
</body></html>`)}`;

test.describe('Mobile ChatGPT send path', () => {
  test.use({ hasTouch: true });

  test('buttonless mobile composer selects reviewed-enter and stages prompt', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOBILE_CHATGPT);
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      window.__GITL_forceMobileChatGpt();
      const input = window.__GITL_Adapter.getInput();
      const prompt = 'Continue — mobile staging check';
      window.__GITL_Adapter.injectText(input, prompt);
      const held = window.__GITL_hold(input, prompt);
      const btn = window.__GITL_Adapter.getSendBtn();
      const strategy = window.__GITL_select(input);
      return {
        held,
        btn: btn ? btn.id || btn.getAttribute('aria-label') : null,
        path: strategy ? strategy.path : null
      };
    });

    expect(result.held).toBe(true);
    expect(result.btn).toBe(null);
    expect(result.path).toBe('reviewed-enter');
  });

  test('reviewed-enter clears the composer on mock mobile ChatGPT', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(MOBILE_CHATGPT);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.__GITL_forceMobileChatGpt();
      const input = window.__GITL_Adapter.getInput();
      window.__GITL_Adapter.injectText(input, 'Mobile send probe');
      const strategy = window.__GITL_select(input);
      strategy.run();
    });
    await page.waitForTimeout(200);

    const composerEmpty = await page.evaluate(() => {
      const ce = document.getElementById('prompt-textarea');
      return (ce.textContent || '').trim().length < 4;
    });
    expect(composerEmpty).toBe(true);
  });
});
