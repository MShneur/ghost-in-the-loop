// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Mobile send repro (v8.7) — buttonless composer, Enter tier only.
 */

const SCRIPT_PATH = path.join(__dirname, '../../ghost-in-the-loop.user.js');
const MOCK_PAGE = 'file://' + path.join(__dirname, 'mobile-mock-chat.html');

function buildScript() {
  const raw = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const noHeader = raw.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
  const EXPOSE = `
    PLAT.reviewed = true;
    PLAT.dispatchFallback = 'enter';
    PLAT.key = 'chatgpt';
    PLAT.send = ['button[data-testid="ghost-missing-send"]'];
    window.__GITL_select = _selectSendStrategy;
    window.__GITL_gate = _preDispatchEvidenceGate;
  `;
  if (/\n\} catch\(__gitlBootErr\)/.test(noHeader)) {
    return noHeader.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)');
  }
  return noHeader.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');
}

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => {
    const s = document.createElement('style');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  };
`;

test.describe('mobile send scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(buildScript());
    await page.goto(MOCK_PAGE);
    await page.waitForFunction(() => window.__GITL_select);
  });

  test('selects reviewed-enter when no send button exists', async ({ page }) => {
    const tier = await page.evaluate(() => {
      const input = document.querySelector('#prompt-textarea');
      input.textContent = 'Hello from Ghost mobile repro';
      return window.__GITL_select(input)?.path || null;
    });
    expect(tier).toBe('reviewed-enter');
  });

  test('evidence gate passes when composer holds injected text', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const input = document.querySelector('#prompt-textarea');
      const text = 'Hello from Ghost mobile repro';
      input.textContent = text;
      const strategy = window.__GITL_select(input);
      return window.__GITL_gate(input, text, strategy).ok;
    });
    expect(ok).toBe(true);
  });
});
