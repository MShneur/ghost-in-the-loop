// ==UserScript==
// @name         GITL Execution Canary
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      1.0.0
// @description  Independent, mobile-safe canary that proves userscript execution, body replacement, panel-host removal, and manager identity — separate from Ghost core, so it can tell "the manager never ran my script" apart from "Ghost ran and crashed."
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://grok.com/*
// @run-at       document-start
// @grant        GM_info
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

/*
 * WHY THIS EXISTS (read diagnostics/README.md)
 * Ghost's own boot beacon lives INSIDE Ghost. If a userscript manager never
 * executes Ghost on a page (an injection/permission problem), that beacon is
 * never written and you can't tell it apart from "Ghost ran and crashed."
 * This canary is a *separate* userscript: if the canary badge appears but
 * Ghost doesn't, the fault is in Ghost; if NEITHER appears, the fault is the
 * manager/injection layer, and no change to Ghost's code can help.
 *
 * It renders in a Shadow DOM host attached to <html> (not <body>), so it
 * survives body replacement and z-index/transform wars, and — importantly —
 * it does NOT use innerHTML string sinks the way that broke Ghost on Gemini's
 * Trusted Types CSP. It is intentionally trivial and dependency-free.
 */
(() => {
  'use strict';

  const STARTED_AT = new Date().toISOString();
  const ID = 'gitl-canary-host';
  const state = {
    version: '1.0.0',
    startedAt: STARTED_AT,
    href: location.href,
    readyStateAtStart: document.readyState,
    manager: safe(() => GM_info.scriptHandler, 'unknown'),
    managerVersion: safe(() => GM_info.version, 'unknown'),
    injectInto: safe(() => GM_info.injectInto, 'unknown'),
    ghostBoot: null,           // mirrors <html data-gitl-boot> if Ghost is present
    bodyChanges: 0,
    hostRemovals: 0,
    ensureCalls: 0,
    errors: [],
    lastBodySeenAt: null,
    lastEnsureAt: null,
  };

  let lastBody = null;
  let host = null;
  let shadow = null;
  let detailOpen = false;
  let observer = null;

  function safe(fn, fallback) { try { return fn(); } catch (_) { return fallback; } }
  function mark(value) { try { document.documentElement && document.documentElement.setAttribute('data-gitl-canary', value); } catch (_) {} }

  function recordError(type, value) {
    const text = String((value && value.message) || value || 'unknown').slice(0, 500);
    state.errors.push({ type, text, at: new Date().toISOString() });
    state.errors = state.errors.slice(-8);
    render();
  }

  function report() {
    return {
      ...state,
      href: location.href,
      readyStateNow: document.readyState,
      hidden: document.hidden,
      focused: safe(() => document.hasFocus(), false),
      hostConnected: Boolean(host && host.isConnected),
      canaryMark: safe(() => document.documentElement.getAttribute('data-gitl-canary'), null),
      ghostBoot: safe(() => document.documentElement.getAttribute('data-gitl-boot'), null),
      ghostPanelPresent: safe(() => Boolean(document.getElementById('gitl')), false),
      userAgent: navigator.userAgent,
    };
  }

  function ensureHost() {
    state.ensureCalls++;
    state.lastEnsureAt = new Date().toISOString();
    const html = document.documentElement;
    if (!html) { queueMicrotask(ensureHost); return; }

    if (!host) {
      host = document.createElement('div');
      host.id = ID;
      host.setAttribute('data-owner', 'gitl-canary');
      host.style.cssText = [
        'all:initial', 'position:fixed',
        'top:max(8px,env(safe-area-inset-top))', 'right:8px',
        'z-index:2147483647', 'display:block',
        'font-family:system-ui,sans-serif', 'pointer-events:auto',
      ].join(';');
      shadow = host.attachShadow({ mode: 'open' });
      shadow.addEventListener('click', onClick);
    }
    if (!host.isConnected) { state.hostRemovals++; html.appendChild(host); }
    if (document.body && document.body !== lastBody) {
      lastBody = document.body;
      state.bodyChanges++;
      state.lastBodySeenAt = new Date().toISOString();
    }
    state.ghostBoot = report().ghostBoot;
    mark(`alive:${state.version}:body${state.bodyChanges}:removal${state.hostRemovals}`);
    render();
  }

  // NOTE: Shadow DOM is same-page and NOT under the page's Trusted Types policy
  // for its own innerHTML, but to stay maximally safe we build with DOM APIs.
  function render() {
    if (!shadow) return;
    const r = report();
    const color = r.errors.length ? '#ff637d' : '#49d17d';
    shadow.textContent = '';
    const style = document.createElement('style');
    style.textContent =
      ':host{all:initial}' +
      'button{all:unset;box-sizing:border-box;cursor:pointer;font:700 12px/1.2 system-ui,sans-serif}' +
      `.badge{background:#111827;color:#f9fafb;border:1px solid ${color};border-radius:999px;padding:7px 10px;box-shadow:0 5px 20px #0008}` +
      `.dot{color:${color};margin-right:5px}` +
      '.card{margin-top:6px;width:min(360px,calc(100vw - 24px));max-height:55vh;overflow:auto;background:#0b1020;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:10px;box-shadow:0 12px 36px #000b;font:11px/1.4 ui-monospace,monospace;white-space:pre-wrap;word-break:break-word}' +
      '.row{display:flex;gap:6px;margin-top:8px}' +
      '.action{background:#1e293b;border:1px solid #475569;border-radius:7px;padding:6px 8px;color:#f8fafc}';
    shadow.appendChild(style);

    const badge = document.createElement('button');
    badge.className = 'badge';
    badge.setAttribute('data-act', 'toggle');
    const dot = document.createElement('span');
    dot.className = 'dot'; dot.textContent = '●';
    badge.appendChild(dot);
    badge.appendChild(document.createTextNode(
      'GITL CANARY ' + (r.errors.length ? 'ERROR' : 'ALIVE') +
      (r.ghostPanelPresent ? ' · ghost:up' : r.ghostBoot ? ' · ghost:' + r.ghostBoot : ' · ghost:absent')));
    shadow.appendChild(badge);

    if (detailOpen) {
      const card = document.createElement('div');
      card.className = 'card';
      card.appendChild(document.createTextNode(JSON.stringify(r, null, 2)));
      const row = document.createElement('div');
      row.className = 'row';
      const copy = document.createElement('button');
      copy.className = 'action'; copy.setAttribute('data-act', 'copy'); copy.textContent = 'Copy report';
      const reset = document.createElement('button');
      reset.className = 'action'; reset.setAttribute('data-act', 'reset'); reset.textContent = 'Reset counts';
      row.appendChild(copy); row.appendChild(reset);
      card.appendChild(row);
      shadow.appendChild(card);
    }
  }

  function onClick(event) {
    const t = event.target;
    const act = t && t.closest && t.closest('[data-act]') && t.closest('[data-act]').getAttribute('data-act');
    if (act === 'toggle') { detailOpen = !detailOpen; render(); }
    else if (act === 'copy') {
      const text = JSON.stringify(report(), null, 2);
      try { GM_setClipboard(text, 'text'); }
      catch (_) { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {}); }
    } else if (act === 'reset') {
      state.bodyChanges = 0; state.hostRemovals = 0; state.errors = []; render();
    }
  }

  window.addEventListener('error', e => recordError('window.error', e.error || e.message), true);
  window.addEventListener('unhandledrejection', e => recordError('unhandledrejection', e.reason), true);
  document.addEventListener('readystatechange', ensureHost);
  window.addEventListener('pageshow', ensureHost);
  window.addEventListener('popstate', ensureHost);
  document.addEventListener('visibilitychange', ensureHost);

  function startObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(() => ensureHost());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  mark('started');
  ensureHost();
  startObserver();
  setInterval(ensureHost, 2000);
})();
