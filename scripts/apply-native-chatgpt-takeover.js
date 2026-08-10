'use strict';

const fs = require('fs');

function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (text.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous patch anchor: ${label}`);
  return text.slice(0, first) + after + text.slice(first + before.length);
}

const sourcePath = 'ghost-in-the-loop.user.js';
let source = fs.readFileSync(sourcePath, 'utf8');

const railAnchor = `  if (pos==='rail') startRailTracker(); else stopRailTracker();\n}`;
source = replaceOnce(
  source,
  railAnchor,
  `  const nativeOwnsRail = typeof NativeSiteMount !== 'undefined' && NativeSiteMount.ownsRail();\n  if (pos==='rail' && !nativeOwnsRail) startRailTracker(); else stopRailTracker();\n}`,
  'native rail ownership'
);

const managerAnchor = `\n/* Position the orb. Collapsed: a tucked circle clinging to the saved edge`;
const manager = `
/* Native site takeover — ChatGPT production slice.
   Promotes the Round-6 deterministic in-flow primitive into the real product,
   but only behind a strict reviewed structural contract. The native host never
   moves, wraps, clones, replaces, or clicks Send. Any loss of certainty removes
   only Ghost's node and restores the pre-existing panel/rail. */
const NativeSiteMount = (() => {
  const MOUNT_SELECTOR = '[data-gitl-native-mount="chatgpt"]';
  let host = null, row = null, send = null;
  let mutationObserver = null, resizeObserver = null;
  let raf = 0, generation = 0, verified = false, closedReason = null;
  let suppressNextMutation = false, panelExplicit = false, panelDisplayBefore = null;

  const _raf = (fn) => typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16);
  const _caf = (id) => { try { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); else clearTimeout(id); } catch(_) {} };
  const visible = (el) => {
    if (!(el instanceof Element) || !el.isConnected) return false;
    try {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch(_) { return false; }
  };
  const withinBounds = (el, container) => {
    if (!(el instanceof Element) || !(container instanceof Element)) return false;
    try {
      const cs = getComputedStyle(container);
      const clipsX = ['hidden','clip'].includes(cs.overflowX);
      const clipsY = ['hidden','clip'].includes(cs.overflowY);
      if (!clipsX && !clipsY) return true;
      const er = el.getBoundingClientRect(), cr = container.getBoundingClientRect(), e = 1;
      if (clipsX && (er.left < cr.left - e || er.right > cr.right + e)) return false;
      if (clipsY && (er.top < cr.top - e || er.bottom > cr.bottom + e)) return false;
      return true;
    } catch(_) { return false; }
  };

  const resolveChatGPT = () => {
    if (!PLAT || PLAT.key !== 'chatgpt' || !PLAT.reviewed) return { ok:false, reason:'site-not-reviewed-chatgpt' };
    const input = Adapter.peekInput();
    if (!visible(input)) return { ok:false, reason:'composer-input-missing' };
    const composer = input.closest && input.closest('form[data-type="unified-composer"]');
    if (!(composer instanceof Element) || !composer.isConnected) return { ok:false, reason:'unified-composer-missing' };

    const rows = [...composer.querySelectorAll('[data-testid="composer-actions"]')].filter(visible);
    if (rows.length !== 1) return { ok:false, reason:rows.length ? 'composer-actions-ambiguous' : 'composer-actions-missing' };
    const actionRow = rows[0];

    const sends = new Set();
    for (const selector of PLAT.send || []) {
      try {
        for (const el of composer.querySelectorAll(selector)) {
          if (visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && _sendLooksSafe(el)) sends.add(el);
        }
      } catch(_) {}
    }
    if (sends.size !== 1) return { ok:false, reason:sends.size ? 'send-ambiguous' : 'send-missing' };
    const exactSend = [...sends][0];
    if (!actionRow.contains(exactSend)) return { ok:false, reason:'send-outside-actions' };
    if (Adapter.getSendBtn() !== exactSend) return { ok:false, reason:'reviewed-send-identity-mismatch' };
    const display = getComputedStyle(actionRow).display;
    if (!['flex','inline-flex','grid','inline-grid'].includes(display)) return { ok:false, reason:'composer-actions-not-structural' };
    if (!withinBounds(exactSend, actionRow)) return { ok:false, reason:'send-clipped' };
    return { ok:true, input, composer, row:actionRow, send:exactSend };
  };

  const restorePanel = () => {
    if (panelDisplayBefore !== null) panel.style.display = panelDisplayBefore;
    panelDisplayBefore = null;
    try { delete panel.dataset.gitlNativeSuppressed; } catch(_) {}
    if (GHOST.ui.position === 'rail' && panel.isConnected) startRailTracker();
  };
  const suppressPanel = () => {
    if (!verified || panelExplicit || !panel) return;
    if (panelDisplayBefore === null) panelDisplayBefore = panel.style.display;
    panel.dataset.gitlNativeSuppressed = '1';
    panel.style.display = 'none';
    stopRailTracker();
  };

  const disconnectResources = () => {
    if (raf) _caf(raf);
    raf = 0;
    try { mutationObserver?.disconnect(); } catch(_) {}
    try { resizeObserver?.disconnect(); } catch(_) {}
    mutationObserver = resizeObserver = null;
  };
  const dropHost = () => {
    try { if (host?.isConnected) host.remove(); } catch(_) {}
    host = null;
  };
  const failClosed = (reason) => {
    verified = false;
    closedReason = reason;
    generation++;
    disconnectResources();
    dropHost();
    row = send = null;
    panelExplicit = false;
    restorePanel();
    try { Timeline.record('native_mount_demoted', { site:'chatgpt', reason }); } catch(_) {}
    return { status:'rail', reason, fallback:'rail', attemptedStructural:true };
  };

  const verify = () => {
    const cap = resolveChatGPT();
    if (!cap.ok) return cap.reason;
    if (cap.row !== row || cap.send !== send) return 'capability-target-changed';
    if (!(host instanceof Element) || !host.isConnected || host.parentElement !== row) return 'mount-disconnected';
    const position = getComputedStyle(host).position;
    if (position === 'fixed' || position === 'absolute') return 'mount-not-in-flow';
    if (!withinBounds(host, row)) return 'mount-clipped';
    if (document.querySelectorAll(MOUNT_SELECTOR).length !== 1) return 'duplicate-mount';
    if (!send?.isConnected || !row.contains(send)) return 'send-identity-changed';
    return null;
  };

  const updateControls = () => {
    const shadow = host?.shadowRoot;
    if (!shadow) return;
    const primary = shadow.querySelector('[data-gitl-native-action="primary"]');
    const menu = shadow.querySelector('[data-gitl-native-action="menu"]');
    const running = GHOST.loop.state === 'RUNNING';
    if (primary) {
      primary.textContent = running ? '⏸' : '▶';
      primary.setAttribute('aria-label', running ? 'Pause Ghost automation' : 'Start or resume Ghost automation');
      primary.title = running ? 'Pause Ghost automation' : 'Start or resume Ghost automation';
    }
    if (menu) {
      menu.textContent = panelExplicit ? '×' : '👻';
      menu.setAttribute('aria-label', panelExplicit ? 'Close Ghost panel' : 'Open Ghost panel');
      menu.title = panelExplicit ? 'Close Ghost panel' : 'Open Ghost panel';
    }
  };

  const buildHost = () => {
    const el = document.createElement('div');
    el.setAttribute('data-gitl-native-mount', 'chatgpt');
    el.style.position = 'static';
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.style.flex = '0 0 auto';
    const shadow = el.attachShadow({ mode:'open', delegatesFocus:false });
    const style = document.createElement('style');
    style.textContent = ':host{font:inherit;color:inherit}.row{display:inline-flex;align-items:center;gap:4px}button{font:inherit;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 28%,transparent);border-radius:8px;min-width:32px;min-height:32px;padding:4px 7px;cursor:pointer}button:focus-visible{outline:2px solid currentColor;outline-offset:2px}';
    const controls = document.createElement('div');
    controls.className = 'row';
    const primary = document.createElement('button');
    primary.type = 'button';
    primary.setAttribute('data-gitl-native-action', 'primary');
    primary.addEventListener('click', () => { primaryAction(); updateControls(); });
    const menu = document.createElement('button');
    menu.type = 'button';
    menu.setAttribute('data-gitl-native-action', 'menu');
    menu.addEventListener('click', () => {
      panelExplicit = !panelExplicit;
      if (panelExplicit) {
        restorePanel();
        if (GHOST.ui.collapsed) { GHOST.ui.collapsed = false; _save('panelCollapsed', false); }
        render();
      } else {
        suppressPanel();
        updateControls();
      }
    });
    controls.append(primary, menu);
    shadow.append(style, controls);
    host = el;
    updateControls();
    return el;
  };

  const scheduleRepair = () => {
    if (raf || !verified) return;
    const currentGeneration = generation;
    raf = _raf(() => {
      raf = 0;
      if (!verified || currentGeneration !== generation) return;
      const cap = resolveChatGPT();
      if (!cap.ok) return void failClosed(cap.reason);
      if (cap.row !== row || cap.send !== send) return void failClosed('capability-target-changed');
      if (!host?.isConnected || host.parentElement !== row || row.lastElementChild !== host) {
        suppressNextMutation = true;
        row.append(host);
      }
      const failure = verify();
      if (failure) failClosed(failure);
      else suppressPanel();
    });
  };

  const mountNow = () => {
    const cap = resolveChatGPT();
    if (!cap.ok) return { status:'rail', reason:cap.reason, fallback:'rail', attemptedStructural:false };
    const existing = document.querySelector(MOUNT_SELECTOR);
    if (existing) {
      if (existing === host && verified) return { status:'structural', reason:null, reused:true };
      return failClosed('duplicate-mount');
    }
    closedReason = null;
    panelExplicit = false;
    generation++;
    row = cap.row;
    send = cap.send;
    row.append(buildHost());
    verified = true;
    const failure = verify();
    if (failure) return failClosed(failure);

    mutationObserver = new MutationObserver(() => {
      if (suppressNextMutation) { suppressNextMutation = false; return; }
      scheduleRepair();
    });
    mutationObserver.observe(row, { childList:true });
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(scheduleRepair);
      resizeObserver.observe(row);
      resizeObserver.observe(host);
    }
    suppressPanel();
    try { Timeline.record('native_mount_active', { site:'chatgpt' }); } catch(_) {}
    return { status:'structural', reason:null, reused:false };
  };

  const refresh = () => {
    if (verified) {
      const failure = verify();
      if (failure) return failClosed(failure);
      suppressPanel();
      updateControls();
      return { status:'structural', reason:null, reused:true };
    }
    return mountNow();
  };
  const stop = () => {
    verified = false;
    generation++;
    disconnectResources();
    dropHost();
    row = send = null;
    panelExplicit = false;
    restorePanel();
  };
  const ownsRail = () => verified && !panelExplicit;
  const isSuppressingPanel = () => ownsRail() && panel?.dataset?.gitlNativeSuppressed === '1' && panel.style.display === 'none';

  return { start:refresh, refresh, stop, verify, updateControls, ownsRail, isSuppressingPanel, state:() => ({ verified, closedReason, panelExplicit }) };
})();
`;
source = replaceOnce(source, managerAnchor, `\n${manager}\n/* Position the orb. Collapsed: a tucked circle clinging to the saved edge`, 'native manager insertion');

const renderAnchor = `  bindEvents();\n  applyPosition(GHOST.ui.position);\n}`;
source = replaceOnce(
  source,
  renderAnchor,
  `  bindEvents();\n  applyPosition(GHOST.ui.position);\n  try { if (typeof NativeSiteMount !== 'undefined') NativeSiteMount.updateControls(); } catch(_) {}\n}`,
  'native control render sync'
);

const bootAnchor = `  _phase('render',   true,  () => render());\n\n  // Panel is up and rendered — commit the singleton NOW (never before boot).`;
source = replaceOnce(
  source,
  bootAnchor,
  `  _phase('render',   true,  () => render());\n  _phase('native-takeover', false, () => NativeSiteMount.start());\n\n  // Panel is up and rendered — commit the singleton NOW (never before boot).`,
  'native takeover boot phase'
);

const retryAnchor = `      const inp = _q('input', PLAT.input);\n      if (inp) {`;
source = replaceOnce(
  source,
  retryAnchor,
  `      const inp = _q('input', PLAT.input);\n      try { NativeSiteMount.refresh(); } catch(_) {}\n      if (inp) {`,
  'native takeover hydration retry'
);

const sentinelAnchor = `    const n = document.getElementById('gitl');\n    if (!n || !n.isConnected || !document.body) return true;\n    try {\n      const st = getComputedStyle(n);`;
source = replaceOnce(
  source,
  sentinelAnchor,
  `    const n = document.getElementById('gitl');\n    if (!n || !n.isConnected || !document.body) return true;\n    if (typeof NativeSiteMount !== 'undefined' && NativeSiteMount.isSuppressingPanel()) return false;\n    try {\n      const st = getComputedStyle(n);`,
  'sentinel native suppression awareness'
);

fs.writeFileSync(sourcePath, source);

const configPath = 'playwright.config.js';
let config = fs.readFileSync(configPath, 'utf8');
config = replaceOnce(
  config,
  `      '**/repair-resume-production.spec.js',\n      '**/lifecycle-mobile-perf.spec.js',`,
  `      '**/repair-resume-production.spec.js',\n      '**/native-chatgpt-takeover.spec.js',\n      '**/lifecycle-mobile-perf.spec.js',`,
  'mobile native takeover coverage'
);
fs.writeFileSync(configPath, config);

const ciPath = '.github/workflows/test.yml';
let ci = fs.readFileSync(ciPath, 'utf8');
ci = replaceOnce(
  ci,
  `      - 'agent/**'\n`,
  `      - 'agent/**'\n      - feature/native-site-takeover\n`,
  'feature branch CI trigger'
);
fs.writeFileSync(ciPath, ci);

const testPath = 'tests/e2e/native-chatgpt-takeover.spec.js';
if (fs.existsSync(testPath)) throw new Error(`Refusing to overwrite existing ${testPath}`);
fs.writeFileSync(testPath, `// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\\/\\/ ==UserScript==[\\s\\S]*?\\/\\/ ==\\/UserScript==/m, '');

const GM = \\`
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
\\`;

function fixture(extraSend = '') {
  return \\`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
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
        \\${extraSend}
      </div>
    </form>
    <script>
      window.__fixtureSend = document.querySelector('[data-testid="send-button"]');
      window.__fixtureSend.addEventListener('click', () => { window.__nativeProbe.sendClicks++; });
      document.getElementById('prompt-textarea').focus();
    <\\/script>
  </body></html>\\`;
}

async function boot(page, html = fixture()) {
  await page.route('https://chatgpt.com/', route => route.fulfill({ status:200, contentType:'text/html', body:html }));
  await page.addInitScript(GM);
  await page.addInitScript(RAW);
  await page.goto('https://chatgpt.com/');
  await page.waitForSelector('#gitl');
}

async function events(page) { return page.evaluate(() => ({ ...window.__nativeProbe })); }

test.describe('ChatGPT native site takeover — production userscript', () => {
  test('verified action row mounts one in-flow Ghost host, preserves Send/focus, and suppresses the passive rail', async ({ page }) => {
    await boot(page);
    const before = await events(page);
    await page.waitForSelector('[data-gitl-native-mount="chatgpt"]');
    const state = await page.evaluate(() => {
      const host = document.querySelector('[data-gitl-native-mount="chatgpt"]');
      const buttons = host?.shadowRoot ? [...host.shadowRoot.querySelectorAll('button')] : [];
      const send = document.querySelector('[data-testid="send-button"]');
      const panel = document.getElementById('gitl');
      return {
        sendSame: window.__fixtureSend === send,
        sendConnected: window.__fixtureSend.isConnected,
        sendParent: send?.parentElement?.getAttribute('data-testid'),
        activeId: document.activeElement?.id,
        mountParent: host?.parentElement?.getAttribute('data-testid'),
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
    expect(state.sendParent).toBe('composer-actions');
    expect(state.activeId).toBe('prompt-textarea');
    expect(state.mountParent).toBe('composer-actions');
    expect(state.mountLast).toBe(true);
    expect(['static','relative']).toContain(state.mountPosition);
    expect(state.shadowOpen).toBe(true);
    expect(state.buttonTypes).toEqual(['button','button']);
    expect(state.buttonNames).toEqual(['Start or resume Ghost automation','Open Ghost panel']);
    expect(state.panelDisplay).toBe('none');
    expect(state.panelSuppressed).toBe('1');
    expect(await events(page)).toEqual(before);
  });

  test('ambiguous reviewed Send structure stays on the existing rail without any passive actuation', async ({ page }) => {
    await boot(page, fixture('<button type="submit" aria-label="Send">Second Send</button>'));
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      nativeCount: document.querySelectorAll('[data-gitl-native-mount="chatgpt"]').length,
      panelDisplay: getComputedStyle(document.getElementById('gitl')).display,
      sendSame: window.__fixtureSend === document.querySelector('[data-testid="send-button"]'),
      activeId: document.activeElement?.id,
    }));
    expect(state.nativeCount).toBe(0);
    expect(state.panelDisplay).not.toBe('none');
    expect(state.sendSame).toBe(true);
    expect(state.activeId).toBe('prompt-textarea');
    expect(await events(page)).toEqual({ click:0, submit:0, input:0, keydown:0, sendClicks:0 });
  });

  test('Send replacement after mount fails closed, removes only Ghost, and restores the rail', async ({ page }) => {
    await boot(page);
    await page.waitForSelector('[data-gitl-native-mount="chatgpt"]');
    const before = await events(page);
    await page.evaluate(() => {
      const oldSend = window.__fixtureSend;
      const replacement = oldSend.cloneNode(true);
      oldSend.replaceWith(replacement);
    });
    await expect.poll(async () => page.locator('[data-gitl-native-mount="chatgpt"]').count()).toBe(0);
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.getElementById('gitl')).display)).not.toBe('none');
    const state = await page.evaluate(() => ({
      oldSendConnected: window.__fixtureSend.isConnected,
      replacementConnected: !!document.querySelector('[data-testid="send-button"]')?.isConnected,
      panelSuppressed: document.getElementById('gitl')?.dataset?.gitlNativeSuppressed || null,
    }));
    expect(state.oldSendConnected).toBe(false);
    expect(state.replacementConnected).toBe(true);
    expect(state.panelSuppressed).toBeNull();
    expect(await events(page)).toEqual(before);
  });

  test('action-row growth repairs by moving only the same Ghost node and never Send', async ({ page }) => {
    await boot(page);
    await page.waitForSelector('[data-gitl-native-mount="chatgpt"]');
    const before = await events(page);
    const identity = await page.evaluate(() => {
      window.__fixtureGhostHost = document.querySelector('[data-gitl-native-mount="chatgpt"]');
      return window.__fixtureSend;
    });
    void identity;
    await page.evaluate(() => {
      const row = document.querySelector('[data-testid="composer-actions"]');
      const late = document.createElement('button');
      late.type = 'button';
      late.setAttribute('data-native-late', '1');
      late.textContent = 'Late';
      row.append(late);
    });
    await expect.poll(async () => page.evaluate(() => document.querySelector('[data-testid="composer-actions"]')?.lastElementChild?.matches('[data-gitl-native-mount="chatgpt"]'))).toBe(true);
    const state = await page.evaluate(() => ({
      sameGhost: window.__fixtureGhostHost === document.querySelector('[data-gitl-native-mount="chatgpt"]'),
      sameSend: window.__fixtureSend === document.querySelector('[data-testid="send-button"]'),
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
`);

console.log('Applied ChatGPT native site takeover production slice and focused tests.');
