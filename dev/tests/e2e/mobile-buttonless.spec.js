// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const fixture = fs.readFileSync(path.join(__dirname, 'mock-mobile-buttonless.html'), 'utf8');

const expose = `
  window.__GITL_MOBILE_TEST__ = {
    start(text) {
      GHOST.loop.state = 'RUNNING';
      GHOST.loop.isSending = false;
      window.__gitlMobileSendPromise = engineSend(text, true);
    },
    settleFromEvidence() {
      const evidence = _sendEvidence();
      return { ...evidence, settled: evidence.confirmed ? _confirmSend(evidence.evidence) : false };
    },
    markUncertain() {
      return _markSendUncertain();
    },
    result() {
      return window.__gitlMobileSendPromise;
    },
    snapshot() {
      return {
        path: GHOST.loop.sendTxn && GHOST.loop.sendTxn.path,
        state: GHOST.loop.sendTxn && GHOST.loop.sendTxn.state,
        pending: GHOST.loop.sendPending,
        round: GHOST.loop.round
      };
    }
  };
`;
const script = /\n\} catch\(__gitlBootErr\)/.test(raw)
  ? raw.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + expose + '\n} catch(__gitlBootErr)')
  : raw.replace(/(\}\)\(\)\s*;?\s*)$/, expose + '\n$1');

const gm = `
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

async function openFixture(page) {
  await page.route('https://chatgpt.com/mobile-fixture', route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: fixture
  }));
  await page.addInitScript(gm);
  await page.addInitScript(script);
  await page.goto('https://chatgpt.com/mobile-fixture');
  await expect(page.locator('#gitl')).toBeAttached();
}

test.describe('Synthetic mobile buttonless composer', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-firefox',
      'This fixture is the explicit touch/mobile Gecko-emulation coverage.');
    await openFixture(page);
  });

  test('mobile project uses touch, phone viewport, and an Android-style Firefox UA', async ({ page, browserName }, testInfo) => {
    expect(browserName).toBe('firefox');
    expect(testInfo.project.use.hasTouch).toBe(true);
    const environment = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      userAgent: navigator.userAgent
    }));
    expect(environment.width).toBe(412);
    expect(environment.height).toBe(915);
    expect(environment.userAgent).toContain('Android');
    expect(environment.userAgent).toContain('Firefox/');

    const box = await page.locator('#prompt-textarea').boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => page.evaluate(() => window.__fixture.touchPointers)).toBe(1);
  });

  test('one reviewed Enter dispatch submits without clicking dictation or attachment traps', async ({ page }) => {
    await page.evaluate(() => window.__GITL_MOBILE_TEST__.start('Synthetic mobile follow-up'));
    await expect.poll(() => page.evaluate(() => window.__fixture.enterKeydowns)).toBe(1);

    const beforeConfirmation = await page.evaluate(() => ({
      txn: window.__GITL_MOBILE_TEST__.snapshot(),
      fixture: { ...window.__fixture },
      reviewedSendMatches: document.querySelectorAll(
        'button[data-testid="send-button"],button[aria-label="Send prompt"],button[aria-label="Send"],form button[type="submit"]'
      ).length
    }));
    expect(beforeConfirmation.reviewedSendMatches).toBe(0);
    expect(beforeConfirmation.txn).toMatchObject({
      path: 'reviewed-enter',
      state: 'dispatching',
      pending: true,
      round: 0
    });
    expect(beforeConfirmation.fixture.attachClicks).toBe(0);
    expect(beforeConfirmation.fixture.dictationClicks).toBe(0);

    const evidence = await page.evaluate(() => window.__GITL_MOBILE_TEST__.settleFromEvidence());
    expect(evidence).toMatchObject({
      confirmed: true,
      evidence: 'composer+stop',
      settled: true
    });
    await expect(await page.evaluate(() => window.__GITL_MOBILE_TEST__.result())).toBe(true);

    const after = await page.evaluate(() => ({
      txn: window.__GITL_MOBILE_TEST__.snapshot(),
      fixture: { ...window.__fixture }
    }));
    expect(after.txn).toMatchObject({ path: 'reviewed-enter', state: 'committed', round: 1 });
    expect(after.fixture.enterKeydowns).toBe(1);
    expect(after.fixture.attachClicks).toBe(0);
    expect(after.fixture.dictationClicks).toBe(0);
  });

  test('an ignored Enter becomes uncertain with no second actuator', async ({ page }) => {
    await page.evaluate(() => {
      window.__fixture.submitEnabled = false;
      window.__GITL_MOBILE_TEST__.start('Synthetic no-op follow-up');
    });
    await expect.poll(() => page.evaluate(() => window.__fixture.enterKeydowns)).toBe(1);

    const evidence = await page.evaluate(() => window.__GITL_MOBILE_TEST__.settleFromEvidence());
    expect(evidence).toMatchObject({ confirmed: false, evidence: 'insufficient', settled: false });
    expect(await page.evaluate(() => window.__GITL_MOBILE_TEST__.markUncertain())).toBe(true);
    await expect(await page.evaluate(() => window.__GITL_MOBILE_TEST__.result())).toBe(false);

    const after = await page.evaluate(() => ({
      txn: window.__GITL_MOBILE_TEST__.snapshot(),
      fixture: { ...window.__fixture },
      composer: document.getElementById('prompt-textarea').textContent
    }));
    expect(after.txn).toMatchObject({ path: 'reviewed-enter', state: 'uncertain', pending: false, round: 0 });
    expect(after.fixture.enterKeydowns).toBe(1);
    expect(after.fixture.attachClicks).toBe(0);
    expect(after.fixture.dictationClicks).toBe(0);
    expect(after.composer).toContain('Synthetic no-op follow-up');
  });
});
