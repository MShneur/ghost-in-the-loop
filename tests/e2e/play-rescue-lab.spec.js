const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '../../diagnostics/play-rescue-lab.user.js'),
  'utf8'
).replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

async function fixture(page) {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.setContent(`<!doctype html><html><head></head><body>
    <main id="chat" style="min-height:700px;padding-bottom:120px"></main>
    <form id="host-form" style="position:fixed;left:20px;bottom:20px;width:620px;height:90px">
      <textarea id="composer" aria-label="Message" style="width:520px;height:70px">test rescue message</textarea>
      <button id="host-send" type="button" aria-label="Send" style="width:70px;height:40px">Send</button>
    </form>
    <section id="gitl" data-run="0" style="position:fixed;right:10px;top:10px;width:260px;min-height:300px">
      <div class="g-hdr"><span class="g-logo"><span class="g-ghost">👻</span> Ghost<span class="g-dot ok"></span></span></div>
      <div class="g-body">
        <div class="g-tabs"><button class="g-tab act" data-t="run">Run</button><button class="g-tab" data-t="settings">Setup</button></div>
        <div id="g-tc"><div class="g-mod g-mod-transport"><button id="g-play" type="button">▶ Start</button></div></div>
      </div>
    </section>
  </body></html>`);
  await page.evaluate(() => {
    window.__sendCount = 0;
    window.__submitCount = 0;
    window.__clip = '';
    window.__store = {};
    window.GM_getValue = (k, d) => Object.prototype.hasOwnProperty.call(window.__store, k) ? window.__store[k] : d;
    window.GM_setValue = (k, v) => { window.__store[k] = v; };
    window.GM_setClipboard = v => { window.__clip = String(v); };
    const appendTurn = () => {
      const turn = document.createElement('div');
      turn.setAttribute('data-message-author-role', 'user');
      turn.style.width = '300px';
      turn.style.height = '24px';
      turn.textContent = 'sent';
      document.querySelector('#chat').appendChild(turn);
    };
    document.querySelector('#host-send').addEventListener('click', () => {
      window.__sendCount++;
      appendTurn();
    });
    document.querySelector('#host-form').addEventListener('submit', e => {
      e.preventDefault();
      window.__submitCount++;
      appendTurn();
    });
  });
  await page.addScriptTag({ content: source });
  await expect(page.locator('#gitl-play-rescue')).toBeVisible();
}

test('branding exposes Ghost / in the Loop / core version and Settings identity', async ({ page }) => {
  await fixture(page);
  await expect(page.locator('.gitl-brand-main')).toHaveText('Ghost');
  await expect(page.locator('.gitl-brand-sub')).toHaveText('in the Loop · v8.8.2');

  await page.evaluate(() => {
    document.querySelector('[data-t="run"]').classList.remove('act');
    document.querySelector('[data-t="settings"]').classList.add('act');
    const marker = document.createElement('span');
    marker.id = 'settings-render-marker';
    document.querySelector('#g-tc').appendChild(marker);
  });
  await expect(page.locator('.gitl-identity-card')).toContainText('Ghost in the Loop · v8.8.2');
  await expect(page.locator('.gitl-identity-card')).toContainText('Free forever');
  await expect(page.locator('.gitl-identity-card')).toContainText('supported by donations');
});

test('Alpha click performs exactly one semantic Send and confirms one outbound turn', async ({ page }) => {
  await fixture(page);
  await page.locator('#gitl-alpha').click();
  await expect.poll(() => page.evaluate(() => window.__sendCount)).toBe(1);
  await expect(page.locator('#gitl-play-rescue-status')).toContainText('Alpha · CONFIRM · confirmed');
  await expect.poll(() => page.evaluate(() => window.__submitCount)).toBe(0);
});

test('Beta click bypasses Alpha button authority and submits the native form exactly once', async ({ page }) => {
  await fixture(page);
  await page.locator('#gitl-beta').click();
  await expect.poll(() => page.evaluate(() => window.__submitCount)).toBe(1);
  await expect(page.locator('#gitl-play-rescue-status')).toContainText('Beta · CONFIRM · confirmed');
  await expect.poll(() => page.evaluate(() => window.__sendCount)).toBe(0);
});

test('uncertain Primary delivery locks both rescue actuators', async ({ page }) => {
  await fixture(page);
  await page.evaluate(() => {
    const report = document.createElement('div');
    report.className = 'g-report';
    report.textContent = 'Delivery uncertain — check the conversation';
    document.querySelector('#gitl').appendChild(report);
  });
  await page.locator('#gitl-alpha').click();
  await expect(page.locator('#gitl-play-rescue-status')).toContainText('RESCUE-SAFETY-001');
  await expect.poll(() => page.evaluate(() => window.__sendCount)).toBe(0);
  await page.locator('#gitl-beta').click();
  await expect(page.locator('#gitl-play-rescue-status')).toContainText('RESCUE-SAFETY-001');
  await expect.poll(() => page.evaluate(() => window.__submitCount)).toBe(0);
});

test('feedback is privacy-minimal and copies only coarse site/method/error metadata', async ({ page }) => {
  await fixture(page);
  await page.locator('#gitl-alpha').click();
  await expect(page.locator('#gitl-play-rescue-status')).toContainText('confirmed');
  await page.locator('#gitl-worked').click();
  const clip = await page.evaluate(() => window.__clip);
  expect(clip).toContain('GITL-FEEDBACK | ChatGPT | Alpha | WORKED');
  expect(clip).toContain('core 8.8.2 | lab 0.2.0');
  expect(clip).not.toContain('test rescue message');
  expect(clip).not.toContain('/c/');
});

test('rescue UI does not require innerHTML and survives a Trusted-Types-like sink block', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.setContent(`<!doctype html><html><body>
    <form style="position:fixed;left:20px;bottom:20px;width:620px;height:90px"><textarea aria-label="Message" style="width:520px;height:70px">hello</textarea><button type="button" aria-label="Send" style="width:70px;height:40px">Send</button></form>
    <section id="gitl" data-run="0" style="position:fixed;right:10px;top:10px;width:260px;min-height:300px"><div class="g-hdr"><span class="g-logo"><span class="g-ghost">👻</span> Ghost<span class="g-dot ok"></span></span></div><div class="g-tabs"><button class="g-tab act" data-t="run">Run</button></div><div id="g-tc"><div class="g-mod g-mod-transport"><button id="g-play" type="button">▶ Start</button></div></div></section>
  </body></html>`);
  await page.evaluate(() => {
    window.GM_getValue = (_k,d) => d;
    window.GM_setValue = () => {};
    window.GM_setClipboard = () => {};
    const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      get: d.get,
      set() { throw new TypeError('Trusted Types sink blocked'); }
    });
  });
  await page.addScriptTag({ content: source });
  await expect(page.locator('#gitl-play-rescue')).toBeVisible();
  await expect(page.locator('.gitl-brand-sub')).toHaveText('in the Loop · v8.8.2');
});
