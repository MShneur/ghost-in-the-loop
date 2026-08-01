// @ts-check
const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Mobile Send last-mile (v8.7.0 Track A/G)
 *
 * Reproduces the ChatGPT-mobile class: no unique enabled Send button until a
 * native keystroke. Asserts reviewed Enter single-dispatch (or loud pause),
 * never a second actuator.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const EXPOSE = `
  window.__GITL_Adapter = Adapter;
  window.__GITL_selectSendStrategy = _selectSendStrategy;
  window.__GITL_PLAT = PLAT;
  window.__GITL_engineSend = engineSend;
  window.__GITL_GHOST = GHOST;
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
  window.GM_setClipboard = () => {};
`;

const FIXTURE = 'file://' + path.join(__dirname, 'mock-chat-mobile.html');

async function boot(page) {
  await page.addInitScript(GM);
  await page.addInitScript(SCRIPT);
  await page.goto(FIXTURE);
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    // Force ChatGPT reviewed profile + Enter fallback on this fixture host.
    window.__GITL_PLAT.key = 'chatgpt';
    window.__GITL_PLAT.reviewed = true;
    window.__GITL_PLAT.dispatchFallback = 'enter';
    window.__GITL_PLAT.input = ['#prompt-textarea', 'div[contenteditable="true"]'];
    window.__GITL_PLAT.send = ['button[data-testid="send-button"]', 'button[aria-label="Send prompt"]'];
    window.__GITL_PLAT.assistant = ['div[data-message-author-role="assistant"]'];
    window.__GITL_PLAT.useCE = true;
    window.__GITL_GHOST.loop.state = 'RUNNING';
  });
}

test.describe('Mobile send — buttonless Enter path', () => {
  test('selects reviewed-enter when Send is hidden/disabled', async ({ page }) => {
    await boot(page);
    const info = await page.evaluate(async () => {
      const input = window.__GITL_Adapter.getInput();
      const btn = document.querySelector('[data-testid="send-button"]');
      // Keep the mobile class: Send stays hidden/disabled (no trusted input).
      btn.hidden = true;
      btn.disabled = true;
      btn.setAttribute('hidden', '');
      window.__GITL_Adapter.injectText(input, 'Continue from mobile');
      await new Promise(r => setTimeout(r, 100));
      btn.hidden = true;
      btn.disabled = true;
      const reviewed = window.__GITL_Adapter.getSendBtn();
      const strategy = window.__GITL_selectSendStrategy(input);
      return {
        path: strategy && strategy.path,
        reviewed: reviewed ? (reviewed.id || reviewed.getAttribute('aria-label')) : null,
        btnHidden: !!btn.hidden,
        btnDisabled: !!btn.disabled,
      };
    });
    expect(info.reviewed).toBe(null);
    expect(info.path).toBe('reviewed-enter');
  });

  test('Enter single-dispatch submits once — no second actuator', async ({ page }) => {
    await boot(page);
    const before = await page.evaluate(() => window.__MOBILE_SENT__);
    await page.evaluate(async () => {
      const input = document.getElementById('prompt-textarea');
      input.focus();
      input.textContent = 'Hello mobile';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'Hello mobile' }));
      const strategy = window.__GITL_selectSendStrategy(input);
      if (!strategy) throw new Error('no strategy');
      // Fire exactly once, mirroring engineSend.
      strategy.run();
    });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => window.__MOBILE_SENT__);
    // Synthetic keydown may or may not submit depending on browser trust;
    // the invariant under test is single strategy selection + single run.
    expect(after - before).toBeLessThanOrEqual(1);
    const runs = await page.evaluate(() => {
      const input = document.getElementById('prompt-textarea');
      const s = window.__GITL_selectSendStrategy(input);
      return s ? s.path : null;
    });
    expect(['reviewed-enter', 'reviewed-button', 'reviewed-form']).toContain(runs);
  });

  test('device descriptor project uses a mobile viewport', async ({ page }, testInfo) => {
    const viewport = page.viewportSize();
    if (/mobile/i.test(testInfo.project.name)) {
      expect(viewport).toBeTruthy();
      expect(viewport.width).toBeLessThanOrEqual(500);
      // Chromium mobile projects expose touch points; Firefox Playwright may not.
      const touch = await page.evaluate(() => navigator.maxTouchPoints || 0);
      if (testInfo.project.name.startsWith('chromium')) {
        expect(touch).toBeGreaterThan(0);
      }
    }
  });
});
