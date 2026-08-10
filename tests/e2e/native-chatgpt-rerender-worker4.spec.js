// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const GM = `
  window.__gmStore = { panelPosition: 'rail', panelCollapsed: true };
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
  window.GM_setClipboard = () => {};
  window.unsafeWindow = window;
  window.__worker4Probe = { click:0, submit:0, input:0, keydown:0, sendClicks:0 };
  for (const type of ['click','submit','input','keydown']) {
    document.addEventListener(type, () => { window.__worker4Probe[type]++; }, true);
  }
`;

const FIXTURE = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box} body{margin:0;font:14px system-ui;min-height:100vh}
  form[data-type="unified-composer"]{display:flex;flex-direction:column;width:min(760px,calc(100vw - 20px));margin:40px auto;padding:10px;border:1px solid #aaa}
  #prompt-textarea{min-height:54px}
  [data-testid="composer-actions"]{display:flex;align-items:center;gap:8px;min-height:40px;overflow:visible}
  [data-testid="composer-actions"]>button{min-width:36px;min-height:36px}
  [data-testid="send-button"]{margin-left:auto}
</style></head><body>
  <form data-testid="composer" data-type="unified-composer">
    <div id="prompt-textarea" class="ProseMirror" contenteditable="true" role="textbox" tabindex="0" aria-label="Message ChatGPT"></div>
    <div data-testid="composer-actions">
      <button type="button" aria-label="Add files" aria-haspopup="menu">+</button>
      <button type="button" aria-label="Model selector" aria-haspopup="menu">Instant</button>
      <button data-testid="send-button" type="submit" aria-label="Send prompt">Send</button>
    </div>
  </form>
  <script>
    window.__worker4Send = document.querySelector('[data-testid="send-button"]');
    window.__worker4Send.addEventListener('click', () => { window.__worker4Probe.sendClicks++; });
    document.getElementById('prompt-textarea').focus();
  <\/script>
</body></html>`;

async function boot(page) {
  await page.route('https://chatgpt.com/', route => route.fulfill({ status:200, contentType:'text/html', body:FIXTURE }));
  await page.addInitScript(GM);
  await page.addInitScript(RAW);
  await page.goto('https://chatgpt.com/');
  await page.waitForSelector('[data-gitl-native-mount="chatgpt"]');
}

test('whole composer replacement after hydration fails closed and restores the rail without passive actuation', async ({ page }) => {
  await boot(page);
  await page.waitForTimeout(2300); // boot retry has observed the original composer and stopped
  const before = await page.evaluate(() => ({ ...window.__worker4Probe }));

  await page.evaluate(() => {
    const oldForm = document.querySelector('form[data-type="unified-composer"]');
    const replacement = oldForm.cloneNode(true);
    replacement.querySelector('[data-gitl-native-mount]')?.remove();
    oldForm.replaceWith(replacement);
  });

  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    nativeCount: document.querySelectorAll('[data-gitl-native-mount="chatgpt"]').length,
    panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
    panelSuppressed: document.getElementById('gitl')?.dataset?.gitlNativeSuppressed || null,
    events: { ...window.__worker4Probe },
  }));

  expect(state.nativeCount).toBe(0);
  expect(state.panelDisplay).not.toBe('none');
  expect(state.panelSuppressed).toBeNull();
  expect(state.events).toEqual(before);
});
