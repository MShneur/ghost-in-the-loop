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
  window.__nativeProbe = { click:0, submit:0, input:0, keydown:0, sendClicks:0 };
  for (const type of ['click','submit','input','keydown']) {
    document.addEventListener(type, () => { window.__nativeProbe[type]++; }, true);
  }
`;

function fixture({ extraSend = '', nestedActionWrapper = false, proseMirror = true } = {}) {
  const row = `<div data-claude-actions="active">
    <button type="button" aria-label="Attach file">+</button>
    <button type="button" aria-label="Tools">Tools</button>
    <button data-claude-send="active" type="submit" aria-label="Send Message">Send</button>
    ${extraSend}
  </div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box} body{margin:0;font:14px system-ui;min-height:100vh}
    form[data-claude-composer="active"]{display:flex;flex-direction:column;width:min(760px,calc(100vw - 20px));margin:40px auto;padding:10px;border:1px solid #aaa}
    [data-claude-editor]{min-height:54px}
    [data-claude-actions]{display:flex;align-items:center;gap:8px;min-height:40px;overflow:visible}
    [data-claude-actions]>button{min-width:36px;min-height:36px}
    [data-claude-send]{margin-left:auto}
    [data-action-wrapper]{display:flex;align-items:center;overflow:visible}
    @media(max-width:480px){form[data-claude-composer="active"]{width:calc(100vw - 12px);margin:12px auto}[data-claude-actions]{flex-wrap:wrap}}
  </style></head><body>
    <form data-claude-composer="active">
      <div class="${proseMirror ? 'ProseMirror' : 'editor'}" contenteditable="true" aria-label="Message Claude" data-claude-editor="active" tabindex="0"></div>
      ${nestedActionWrapper ? `<div data-action-wrapper="ambiguous">${row}</div>` : row}
    </form>
    <script>
      window.__fixtureSend = document.querySelector('[data-claude-send="active"]');
      window.__fixtureSend.addEventListener('click', () => { window.__nativeProbe.sendClicks++; });
      document.querySelector('[data-claude-editor="active"]').focus();
    <\/script>
  </body></html>`;
}

async function boot(page, html = fixture()) {
  await page.route('https://claude.ai/', route => route.fulfill({ status:200, contentType:'text/html', body:html }));
  await page.addInitScript(GM);
  await page.addInitScript(RAW);
  await page.goto('https://claude.ai/');
  await page.waitForSelector('#gitl', { state: 'attached' });
}

async function events(page) { return page.evaluate(() => ({ ...window.__nativeProbe })); }

test.describe('Claude native site takeover — production userscript', () => {
  test('verified structural row mounts one in-flow Ghost host, preserves exact Send/focus, and suppresses the passive rail', async ({ page }) => {
    await boot(page);
    const before = await events(page);
    await page.waitForSelector('[data-gitl-native-mount="claude"]');
    const state = await page.evaluate(() => {
      const host = document.querySelector('[data-gitl-native-mount="claude"]');
      const buttons = host?.shadowRoot ? [...host.shadowRoot.querySelectorAll('button')] : [];
      const send = document.querySelector('[data-claude-send="active"]');
      const panel = document.getElementById('gitl');
      return {
        sendSame: window.__fixtureSend === send,
        sendConnected: window.__fixtureSend.isConnected,
        sendParent: send?.parentElement?.getAttribute('data-claude-actions'),
        activeEditor: document.activeElement?.getAttribute('data-claude-editor'),
        mountParent: host?.parentElement?.getAttribute('data-claude-actions'),
        mountLast: host?.parentElement?.lastElementChild === host,
        mountPosition: host ? getComputedStyle(host).position : null,
        shadowOpen: !!host?.shadowRoot,
        buttonTypes: buttons.map(b => b.type),
        buttonNames: buttons.map(b => b.getAttribute('aria-label')),
        panelDisplay: panel ? getComputedStyle(panel).display : null,
        panelSuppressed: panel?.dataset?.gitlNativeSuppressed || null,
      };
    });
    expect(state.sendSame).toBe(true);
    expect(state.sendConnected).toBe(true);
    expect(state.sendParent).toBe('active');
    expect(state.activeEditor).toBe('active');
    expect(state.mountParent).toBe('active');
    expect(state.mountLast).toBe(true);
    expect(['static','relative']).toContain(state.mountPosition);
    expect(state.shadowOpen).toBe(true);
    expect(state.buttonTypes).toEqual(['button','button']);
    expect(state.buttonNames).toEqual(['Start or resume Ghost automation','Open Ghost panel']);
    expect(state.panelDisplay).toBe('none');
    expect(state.panelSuppressed).toBe('1');
    expect(await events(page)).toEqual(before);
  });

  test('ambiguous structural action-row ancestry stays on the existing rail without passive actuation', async ({ page }) => {
    await boot(page, fixture({ nestedActionWrapper:true }));
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      nativeCount: document.querySelectorAll('[data-gitl-native-mount]').length,
      panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
      sendSame: window.__fixtureSend === document.querySelector('[data-claude-send="active"]'),
      activeEditor: document.activeElement?.getAttribute('data-claude-editor'),
    }));
    expect(state.nativeCount).toBe(0);
    expect(state.panelDisplay).not.toBe('none');
    expect(state.sendSame).toBe(true);
    expect(state.activeEditor).toBe('active');
    expect(await events(page)).toEqual({ click:0, submit:0, input:0, keydown:0, sendClicks:0 });
  });

  test('ambiguous reviewed Send structure stays on rail and preserves the original Send identity', async ({ page }) => {
    await boot(page, fixture({ extraSend:'<button type="submit" aria-label="Send">Second Send</button>' }));
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      nativeCount: document.querySelectorAll('[data-gitl-native-mount]').length,
      panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
      sendSame: window.__fixtureSend === document.querySelector('[data-claude-send="active"]'),
    }));
    expect(state.nativeCount).toBe(0);
    expect(state.panelDisplay).not.toBe('none');
    expect(state.sendSame).toBe(true);
    expect(await events(page)).toEqual({ click:0, submit:0, input:0, keydown:0, sendClicks:0 });
  });

  test('broad contenteditable fallback without the reviewed ProseMirror signature stays on rail', async ({ page }) => {
    await boot(page, fixture({ proseMirror:false }));
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      nativeCount: document.querySelectorAll('[data-gitl-native-mount]').length,
      panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
      sendSame: window.__fixtureSend === document.querySelector('[data-claude-send="active"]'),
    }));
    expect(state.nativeCount).toBe(0);
    expect(state.panelDisplay).not.toBe('none');
    expect(state.sendSame).toBe(true);
    expect(await events(page)).toEqual({ click:0, submit:0, input:0, keydown:0, sendClicks:0 });
  });

  test('Send replacement after mount fails closed, removes only Ghost, and restores the rail', async ({ page }) => {
    await boot(page);
    await page.waitForSelector('[data-gitl-native-mount="claude"]');
    const before = await events(page);
    await page.evaluate(() => {
      const oldSend = window.__fixtureSend;
      const replacement = oldSend.cloneNode(true);
      oldSend.replaceWith(replacement);
    });
    await expect.poll(async () => page.locator('[data-gitl-native-mount="claude"]').count()).toBe(0);
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.getElementById('gitl')).display)).not.toBe('none');
    const state = await page.evaluate(() => ({
      oldSendConnected: window.__fixtureSend.isConnected,
      replacementConnected: !!document.querySelector('[data-claude-send="active"]')?.isConnected,
      panelSuppressed: document.getElementById('gitl')?.dataset?.gitlNativeSuppressed || null,
    }));
    expect(state.oldSendConnected).toBe(false);
    expect(state.replacementConnected).toBe(true);
    expect(state.panelSuppressed).toBeNull();
    expect(await events(page)).toEqual(before);
  });

  test('action-row growth repairs by moving only the same Ghost node and never Send', async ({ page }) => {
    await boot(page);
    await page.waitForSelector('[data-gitl-native-mount="claude"]');
    const before = await events(page);
    await page.evaluate(() => { window.__fixtureGhostHost = document.querySelector('[data-gitl-native-mount="claude"]'); });
    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      const late = document.createElement('button');
      late.type = 'button';
      late.setAttribute('data-native-late', '1');
      late.textContent = 'Late';
      row.append(late);
    });
    await expect.poll(async () => page.evaluate(() => document.querySelector('[data-claude-actions="active"]')?.lastElementChild?.matches('[data-gitl-native-mount="claude"]'))).toBe(true);
    const state = await page.evaluate(() => ({
      sameGhost: window.__fixtureGhostHost === document.querySelector('[data-gitl-native-mount="claude"]'),
      sameSend: window.__fixtureSend === document.querySelector('[data-claude-send="active"]'),
      lateConnected: !!document.querySelector('[data-native-late="1"]')?.isConnected,
      panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
    }));
    expect(state.sameGhost).toBe(true);
    expect(state.sameSend).toBe(true);
    expect(state.lateConnected).toBe(true);
    expect(state.panelDisplay).toBe('none');
    expect(await events(page)).toEqual(before);
  });
});
