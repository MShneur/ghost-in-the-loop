// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const EXPOSE = `
  window.__GITL_MobileTest = {
    Adapter,
    GHOST,
    preDispatchEvidence: _preDispatchEvidence,
    composerRawText: _composerRawText,
    sendEvidence: _sendEvidence,
    confirmSend: _confirmSend,
    sendPromise: null,
    startSend(text) {
      GHOST.loop.state = 'RUNNING';
      GHOST.loop.round = 0;
      GHOST.loop.isSending = false;
      GHOST.loop.sendPending = false;
      GHOST.loop.sendTxn = null;
      this.sendPromise = engineSend(text, true);
    }
  };
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');
const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };
  window.GM_notification = () => {};
`;
const FIXTURE = fs.readFileSync(path.join(__dirname, 'mobile-send-fixture.html'), 'utf8');
const PROMPT = 'Continue.\\n\\n[mobile fixture] Preserve this exact prompt ✓';
const PLATFORMS = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/c/mobile-send-fixture', key: 'chatgpt' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai/search/mobile-send-fixture', key: 'perplexity' }
];

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
  hasTouch: true
});

async function openFixture(page, platform) {
  await page.route(platform.url, route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: FIXTURE
  }));
  await page.addInitScript(GM + '\n' + SCRIPT);
  await page.goto(platform.url);
  await page.waitForFunction(() => window.__GITL_MobileTest && window.__mobileSendFixture);
}

for (const platform of PLATFORMS) {
  test.describe(`${platform.name} mobile send last mile`, () => {
    test('injectText stages the exact prompt and enables the reviewed button fixture', async ({ page, browserName }) => {
      await openFixture(page, platform);

      const result = await page.evaluate(async ({ expected, key }) => {
        const fixture = window.__mobileSendFixture;
        const runtime = window.__GITL_MobileTest;
        fixture.setMode('enable-after-input', expected);
        const before = runtime.Adapter.getSendBtn();
        const input = runtime.Adapter.getInput();
        const injected = runtime.Adapter.injectText(input, expected);
        await new Promise(resolve => setTimeout(resolve, 50));
        const button = runtime.Adapter.getSendBtn();
        const live = runtime.preDispatchEvidence(input, expected, {
          path: 'reviewed-button',
          actuator: button
        });
        button.disabled = true;
        const disabled = runtime.preDispatchEvidence(input, expected, {
          path: 'reviewed-button',
          actuator: button
        });
        return {
          platform: fixture.platform,
          before: before && before.id,
          injected,
          staged: runtime.composerRawText(input),
          inputEvents: fixture.stats.inputEvents,
          buttonId: button.id,
          live,
          disabled,
          mobile: {
            width: innerWidth,
            touchPoints: navigator.maxTouchPoints,
            androidUA: navigator.userAgent.includes('Android')
          },
          expectedKey: key
        };
      }, { expected: PROMPT, key: platform.key });

      expect(result.platform).toBe(result.expectedKey);
      expect(result.before).toBeNull();
      expect(result.injected).toBe(true);
      expect(result.staged).toBe(PROMPT);
      expect(result.inputEvents).toBeGreaterThan(0);
      expect(result.buttonId).toBe('fixture-send');
      expect(result.live).toEqual({ ok: true, composerExact: true, actuatorReady: true });
      expect(result.disabled).toEqual({ ok: false, composerExact: true, actuatorReady: false });
      expect(result.mobile.width).toBe(390);
      expect(result.mobile.androidUA).toBe(true);
      // Playwright's desktop Gecko build accepts the mobile viewport/UA but
      // does not expose touch points; Chromium's emulation does.
      expect(result.mobile.touchPoints).toBe(browserName === 'chromium' ? 1 : 0);
    });

    test('buttonless reviewed Enter dispatches once with exact staging and confirms by observation', async ({ page }) => {
      await openFixture(page, platform);
      await page.evaluate(expected => {
        window.__mobileSendFixture.setMode('buttonless', expected);
        window.__GITL_MobileTest.startSend(expected);
      }, PROMPT);

      await expect.poll(() => page.evaluate(() => window.__mobileSendFixture.stats.enterKeydowns))
        .toBe(1);

      const beforeConfirm = await page.evaluate(() => ({
        path: window.__GITL_MobileTest.GHOST.loop.sendTxn?.path,
        state: window.__GITL_MobileTest.GHOST.loop.sendTxn?.state,
        enteredPrompt: window.__mobileSendFixture.stats.submittedPrompt,
        enterKeydowns: window.__mobileSendFixture.stats.enterKeydowns,
        buttonClicks: window.__mobileSendFixture.stats.buttonClicks
      }));
      expect(beforeConfirm).toEqual({
        path: 'reviewed-enter',
        state: 'dispatching',
        enteredPrompt: PROMPT,
        enterKeydowns: 1,
        buttonClicks: 0
      });

      const confirmed = await page.evaluate(async () => {
        const runtime = window.__GITL_MobileTest;
        const observed = runtime.sendEvidence();
        const committed = observed.confirmed
          ? runtime.confirmSend(observed.evidence)
          : false;
        const result = await runtime.sendPromise;
        return {
          observed,
          committed,
          result,
          state: runtime.GHOST.loop.sendTxn?.state,
          path: runtime.GHOST.loop.sendTxn?.path,
          round: runtime.GHOST.loop.round,
          enterKeydowns: window.__mobileSendFixture.stats.enterKeydowns
        };
      });
      expect(confirmed).toEqual({
        observed: { confirmed: true, evidence: 'composer+stop' },
        committed: true,
        result: true,
        state: 'committed',
        path: 'reviewed-enter',
        round: 1,
        enterKeydowns: 1
      });
    });

    test('exact-prompt evidence failure blocks Enter before the journal opens', async ({ page }) => {
      await openFixture(page, platform);
      await page.evaluate(expected => {
        window.__mobileSendFixture.setMode('tamper', expected);
        window.__GITL_MobileTest.startSend(expected);
      }, PROMPT);

      const blocked = await page.evaluate(async expected => {
        const runtime = window.__GITL_MobileTest;
        const result = await runtime.sendPromise;
        return {
          result,
          staged: window.__mobileSendFixture.readComposer(),
          intended: expected,
          enterKeydowns: window.__mobileSendFixture.stats.enterKeydowns,
          sendTxn: runtime.GHOST.loop.sendTxn,
          state: runtime.GHOST.loop.state,
          detail: runtime.GHOST.loop.detail
        };
      }, PROMPT);

      expect(blocked.result).toBe(false);
      expect(blocked.staged).not.toBe(blocked.intended);
      expect(blocked.enterKeydowns).toBe(0);
      expect(blocked.sendTxn).toBeNull();
      expect(blocked.state).toBe('PAUSED');
      expect(blocked.detail).toContain('paused without Send');
    });
  });
}
