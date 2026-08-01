// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const expose = `
  window.__GITL_OBSERVER_TEST__ = {
    continueCalls: 0,
    setRunning() {
      GHOST.loop.state = 'RUNNING';
      this.continueCalls = 0;
    }
  };
  const __gitlOriginalContinue = Adapter.clickContinue.bind(Adapter);
  Adapter.clickContinue = () => {
    window.__GITL_OBSERVER_TEST__.continueCalls++;
    return __gitlOriginalContinue();
  };
`;
const script = /\n\} catch\(__gitlBootErr\)/.test(raw)
  ? raw.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + expose + '\n} catch(__gitlBootErr)')
  : raw.replace(/(\}\)\(\)\s*;?\s*)$/, expose + '\n$1');
const mock = 'file://' + path.join(__dirname, 'mock-chat.html');

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

test.describe('Observer cost boundaries', () => {
  test('continue observer ignores unrelated attribute churn but still sees a revealed control', async ({ page }) => {
    const body = `<!doctype html><html><body>
      <main><div id="stream"></div><div id="prompt-textarea" contenteditable="true"></div></main>
    </body></html>`;
    await page.route('https://chatgpt.com/observer-fixture', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body
    }));
    await page.addInitScript(gm);
    await page.addInitScript(script);
    await page.goto('https://chatgpt.com/observer-fixture');
    await expect(page.locator('#gitl')).toBeAttached();
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'continue-fixture';
      button.textContent = 'Continue generating';
      button.style.display = 'none';
      button.addEventListener('click', () => { window.__continueFixtureClicks = (window.__continueFixtureClicks || 0) + 1; });
      document.body.appendChild(button);
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      window.__GITL_OBSERVER_TEST__.setRunning();
      const stream = document.getElementById('stream');
      for (let i = 0; i < 200; i++) stream.className = 'stream-frame-' + i;
    });
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => window.__GITL_OBSERVER_TEST__.continueCalls)).toBe(0);

    await page.evaluate(() => { document.getElementById('continue-fixture').style.display = 'block'; });
    await expect.poll(() => page.evaluate(() => window.__continueFixtureClicks || 0)).toBe(1);
    expect(await page.evaluate(() => window.__GITL_OBSERVER_TEST__.continueCalls)).toBe(1);
  });

  test('panel sentinel performs no layout read for unrelated child mutations', async ({ page }) => {
    await page.addInitScript(gm);
    await page.addInitScript(raw);
    await page.goto(mock);
    await expect(page.locator('#gitl')).toBeAttached();
    await page.waitForTimeout(150);

    await page.evaluate(() => {
      const original = window.getComputedStyle.bind(window);
      window.__gitlSentinelStyleReads = 0;
      window.getComputedStyle = (element, pseudo) => {
        if (element && element.id === 'gitl') window.__gitlSentinelStyleReads++;
        return original(element, pseudo);
      };
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 200; i++) {
        const token = document.createElement('span');
        token.textContent = String(i);
        fragment.appendChild(token);
      }
      document.querySelector('.conversation').appendChild(fragment);
    });
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.__gitlSentinelStyleReads)).toBe(0);

    await page.evaluate(() => document.getElementById('gitl').remove());
    await expect.poll(() => page.evaluate(() => !!document.getElementById('gitl'))).toBe(true);
    const remounts = await page.evaluate(() => {
      const timeline = JSON.parse(window.GM_getValue('gitlTimeline', '[]'));
      return timeline.filter(event => event.type === 'panel_remount').length;
    });
    expect(remounts).toBe(1);
    // A disconnected panel is known-down without a style/layout read.
    expect(await page.evaluate(() => window.__gitlSentinelStyleReads)).toBe(0);
  });
});
