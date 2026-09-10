// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Deterministic regression coverage for the ChatGPT 8.8 field report.
 *
 * This fixture uses DOM facts observed on the current signed-out public
 * ChatGPT composer. It is not an authenticated-live certification.
 */
const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const EXPOSE = `
  window.__GITL_ReviewedSend = () => _reviewedSend();
  window.__GITL_TestRoute = (round) => {
    const input = Adapter.getInput();
    const strategy = _selectDispatchStrategy(input, round);
    return { path: strategy?.path || null, route: strategy?.route || null, manual: !!strategy?.manual, preflight: strategy?.preflight || null };
  };
  window.__GITL_TestRunRoute = (round) => {
    const input = Adapter.getInput();
    const strategy = _selectDispatchStrategy(input, round);
    if (!strategy || strategy.manual || typeof strategy.run !== 'function') return { path: strategy?.path || null, ran: false };
    strategy.run();
    return { path: strategy.path, ran: true };
  };
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = { panelCollapsed: false, panelPosition: 'top-right' };
  window.GM_getValue = (key, fallback) => (
    window.__gmStore[key] !== undefined ? window.__gmStore[key] : fallback
  );
  window.GM_setValue = (key, value) => { window.__gmStore[key] = value; };
  window.GM_addStyle = (css) => {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };
  window.GM_setClipboard = () => {};
  window.GM_notification = () => {};
`;

const FIXTURE = `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin: 0; min-height: 5200px; font: 14px system-ui; }
    #probe-anchor { position: absolute; top: 2100px; }
    #composer-wrap { position: absolute; top: 4700px; left: 20%; width: 60%; }
    #prompt-textarea { min-height: 48px; border: 1px solid #999; }
    #composer-submit-button { width: 40px; height: 40px; }
    #hidden-composer { display: none; }
  </style>
</head>
<body>
  <div id="probe-anchor">scroll probe</div>
  <div id="composer-wrap">
    <form id="composer" data-type="unified-composer">
      <textarea aria-label="Chat with ChatGPT" hidden></textarea>
      <div id="prompt-textarea" role="textbox" contenteditable="true" aria-label="Chat with ChatGPT"></div>
      <button id="composer-submit-button" data-testid="send-button" aria-label="Send prompt">Send</button>
    </form>
    <div id="hidden-composer">
      <button aria-label="Send message">Hidden Send</button>
    </div>
  </div>
  <script>
    window.__hostProbe = { submits: 0, hashChanges: 0, sendClicks: 0 };
    document.getElementById('composer').addEventListener('submit', (event) => {
      window.__hostProbe.submits += 1;
      event.preventDefault();
    });
    document.getElementById('composer-submit-button').addEventListener('click', () => {
      window.__hostProbe.sendClicks += 1;
    });
    window.addEventListener('hashchange', () => { window.__hostProbe.hashChanges += 1; });
  </script>
</body>
</html>`;

async function boot(page, options = {}) {
  await page.route('https://chatgpt.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: FIXTURE
  }));
  if (options.firefoxAndroid) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (Android 16; Mobile; rv:155.0) Gecko/155.0 Firefox/155.0' });
    });
  }
  await page.addInitScript(GM);
  await page.addInitScript(SCRIPT);
  await page.goto('https://chatgpt.com/gitl-regression#field-probe');
  await expect(page.locator('#gitl')).toBeVisible({ timeout: 5000 });
  await expect.poll(() => page.locator('html').getAttribute('data-gitl-boot')).toMatch(/^ok:/);
}

test.describe('ChatGPT 8.8 regression fixture', () => {
  test('current public Send prompt identity resolves to the exact unmodified host node', async ({ page }) => {
    await boot(page);
    await page.locator('#composer-submit-button').scrollIntoViewIfNeeded();
    await expect(page.locator('#composer-submit-button')).toBeVisible();

    const resolved = await page.evaluate(() => {
      const chosen = window.__GITL_ReviewedSend();
      const host = document.getElementById('composer-submit-button');
      return {
        sameNode: chosen === host,
        id: chosen && chosen.id,
        label: chosen && chosen.getAttribute('aria-label'),
        testId: chosen && chosen.getAttribute('data-testid'),
        type: chosen && chosen.getAttribute('type'),
        sendClicks: window.__hostProbe.sendClicks,
        submits: window.__hostProbe.submits
      };
    });

    expect(resolved).toEqual({
      sameNode: true,
      id: 'composer-submit-button',
      label: 'Send prompt',
      testId: 'send-button',
      type: null,
      sendClicks: 0,
      submits: 0
    });
  });

  test('a visible alternate Send identity makes actuator authority ambiguous', async ({ page }) => {
    await boot(page);
    await page.locator('#composer-submit-button').scrollIntoViewIfNeeded();
    await expect(page.locator('#composer-submit-button')).toBeVisible();

    const result = await page.evaluate(() => {
      const duplicate = document.createElement('button');
      duplicate.setAttribute('aria-label', 'Send message');
      duplicate.textContent = 'Alternate Send';
      duplicate.style.cssText = 'position:fixed;left:8px;bottom:8px;width:80px;height:40px';
      document.body.appendChild(duplicate);
      return {
        resolved: window.__GITL_ReviewedSend() !== null,
        sendClicks: window.__hostProbe.sendClicks,
        submits: window.__hostProbe.submits
      };
    });

    expect(result).toEqual({ resolved: false, sendClicks: 0, submits: 0 });
  });


  test('Firefox Android uses a fresh distinct route on the second identical send after composer replacement', async ({ page }) => {
    await boot(page, { firefoxAndroid: true });
    await page.locator('#composer-submit-button').scrollIntoViewIfNeeded();

    await page.evaluate(() => {
      const input = document.getElementById('prompt-textarea');
      input.textContent = 'Continue.';
      input.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:'Continue.' }));
    });

    const first = await page.evaluate(() => window.__GITL_TestRoute(0));
    expect(first.path).toBe('alpha-click');
    expect(first.preflight.sendConnected).toBe(true);
    const firstRun = await page.evaluate(() => window.__GITL_TestRunRoute(0));
    expect(firstRun).toEqual({ path:'alpha-click', ran:true });

    const beforeReplacement = await page.evaluate(() => ({ ...window.__hostProbe }));
    await page.evaluate(() => {
      const oldForm = document.getElementById('composer');
      const freshForm = oldForm.cloneNode(true);
      oldForm.replaceWith(freshForm);
      const form = document.getElementById('composer');
      const button = document.getElementById('composer-submit-button');
      form.addEventListener('submit', (event) => {
        window.__hostProbe.submits += 1;
        event.preventDefault();
      });
      button.addEventListener('click', () => { window.__hostProbe.sendClicks += 1; });
      const input = document.getElementById('prompt-textarea');
      input.textContent = 'Continue.';
      input.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:'Continue.' }));
    });

    const second = await page.evaluate(() => window.__GITL_TestRoute(1));
    expect(second.path).toBe('beta-request-submit');
    expect(second.preflight.sendConnected).toBe(true);
    expect(second.preflight.sameForm).toBe(true);
    expect(second.preflight.canRequestSubmit).toBe(true);
    const secondRun = await page.evaluate(() => window.__GITL_TestRunRoute(1));
    expect(secondRun).toEqual({ path:'beta-request-submit', ran:true });

    const third = await page.evaluate(() => window.__GITL_TestRoute(2));
    expect(third.path).toBe('gamma-enter');

    const after = await page.evaluate(() => ({ ...window.__hostProbe }));
    expect(after.sendClicks).toBeGreaterThanOrEqual(beforeReplacement.sendClicks);
    expect(after.submits).toBeGreaterThan(beforeReplacement.submits);
  });

  test('Adaptive and committee controls mutate Ghost only, without form, URL, hash, or scroll side effects', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.scrollTo(0, 2100));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(2100);

    const before = await page.evaluate(() => ({
      url: location.href,
      hash: location.hash,
      scrollY: window.scrollY,
      panelInForm: Boolean(document.getElementById('gitl').closest('form'))
    }));

    await page.locator('#run-adv').click();
    const beforeAdaptive = await page.evaluate(() => {
      const r = document.getElementById('gitl').getBoundingClientRect();
      return { left:r.left, top:r.top, scrollY:window.scrollY };
    });
    await page.locator('.g-pst[data-pst="evolving"]').click();
    const commit = page.locator('#g-committee-commit');
    await expect(commit).toBeVisible();
    await expect(commit).toBeDisabled();
    await expect(commit).toHaveJSProperty('type', 'button');

    const after = await page.evaluate(() => ({
      url: location.href,
      hash: location.hash,
      scrollY: window.scrollY,
      panelInForm: Boolean(document.getElementById('gitl').closest('form')),
      buttonTypes: [...document.querySelectorAll('#gitl button')].map(button => button.type),
      runAdv: window.__gmStore.runAdv,
      posture: window.__gmStore.posture,
      commitTag: document.getElementById('g-committee-commit')?.tagName,
      commitHeight: document.getElementById('g-committee-commit')?.getBoundingClientRect().height || 0,
      panelRect: (() => { const r=document.getElementById('gitl').getBoundingClientRect(); return {left:r.left,top:r.top}; })(),
      host: { ...window.__hostProbe }
    }));

    expect(before.panelInForm).toBe(false);
    expect(after.panelInForm).toBe(false);
    expect(after.buttonTypes.length).toBeGreaterThan(0);
    expect(new Set(after.buttonTypes)).toEqual(new Set(['button']));
    expect(after.runAdv).toBe(true);
    expect(after.posture).toBe('evolving');
    expect(after.commitTag).toBe('BUTTON');
    expect(after.commitHeight).toBeGreaterThanOrEqual(40);
    expect(Math.abs(after.panelRect.left - beforeAdaptive.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.panelRect.top - beforeAdaptive.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.scrollY - beforeAdaptive.scrollY)).toBeLessThanOrEqual(1);
    expect(after.host).toEqual({ submits: 0, hashChanges: 0, sendClicks: 0 });
    expect(after.url).toBe(before.url);
    expect(after.hash).toBe(before.hash);
    expect(Math.abs(after.scrollY - before.scrollY)).toBeLessThanOrEqual(1);
  });
});
