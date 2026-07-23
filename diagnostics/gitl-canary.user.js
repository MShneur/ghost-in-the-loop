// ==UserScript==
// @name         GITL Execution Canary
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      1.1.0
// @description  Independent, privacy-safe boot canary that distinguishes userscript injection failures from Ghost startup failures and creates a local redacted diagnostic.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://grok.com/*
// @match        https://manus.im/*
// @match        https://www.manus.im/*
// @match        https://chat.mistral.ai/*
// @match        https://kimi.com/*
// @match        https://www.kimi.com/*
// @match        https://kimi.moonshot.cn/*
// @match        https://chat.qwen.ai/*
// @match        https://meta.ai/*
// @match        https://www.meta.ai/*
// @match        https://poe.com/*
// @match        https://huggingface.co/chat*
// @match        https://you.com/*
// @match        https://pi.ai/*
// @match        https://chat.z.ai/*
// @match        https://genspark.ai/*
// @match        https://www.genspark.ai/*
// @match        https://chat.minimax.io/*
// @match        https://lmarena.ai/*
// @match        https://duck.ai/*
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

  const STARTED_MS = Date.now();
  const STARTED_AT = new Date(STARTED_MS).toISOString();
  const ID = 'gitl-canary-host';
  const state = {
    version: '1.1.0',
    startedAt: STARTED_AT,
    platform: platformKey(),
    readyStateAtStart: document.readyState,
    manager: safe(() => GM_info.scriptHandler, 'unknown'),
    managerVersion: safe(() => GM_info.version, 'unknown'),
    injectInto: safe(() => GM_info.injectInto, 'unknown'),
    ghostBoot: null,           // mirrors <html data-gitl-boot> if Ghost is present
    bodyChanges: 0,
    hostRemovals: 0,
    ensureCalls: 0,
    errors: [],
    incident: null,
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

  function platformKey() {
    const host = String(location.hostname || '').toLowerCase();
    const known = [
      ['chatgpt', /chatgpt\.com|chat\.openai\.com/],
      ['perplexity', /perplexity\.ai/],
      ['gemini', /gemini\.google\.com/],
      ['deepseek', /chat\.deepseek\.com/],
      ['copilot', /copilot\.microsoft\.com/],
      ['grok', /grok\.com/],
      ['claude', /claude\.ai/],
      ['manus', /manus\.im/]
    ];
    return known.find(([, rx]) => rx.test(host))?.[0] || 'generic';
  }

  function browserSummary() {
    const ua = String(navigator.userAgent || '');
    const families = [
      ['Edge', /Edg\/(\d+)/],
      ['Firefox', /Firefox\/(\d+)/],
      ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
      ['Safari', /Version\/(\d+).+Safari/]
    ];
    let family = 'Other', major = null;
    for (const [name, rx] of families) {
      const m = ua.match(rx);
      if (m) { family = name; major = Number(m[1]) || null; break; }
    }
    const os = /Android/i.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
      : /Windows/i.test(ua) ? 'Windows'
      : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
      : /Linux/i.test(ua) ? 'Linux' : 'Other';
    return { family, major, os, mobile: /Android|Mobile|iPhone|iPad|iPod/i.test(ua) };
  }

  function safeBootMark() {
    const value = safe(() => document.documentElement.getAttribute('data-gitl-boot'), null);
    return /^(?:started|ok:\d+\.\d+\.\d+|no-panel:\d+\.\d+\.\d+|error:[a-z0-9-]+)$/i.test(String(value || ''))
      ? value : null;
  }

  function recordError(type) {
    state.errors.push({ code: 'CANARY-001', type, at: new Date().toISOString() });
    state.errors = state.errors.slice(-8);
    state.incident = {
      code: 'CANARY-001',
      summary: 'The independent canary observed an uncaught page-world error.',
      guidance: 'Review and download this redacted diagnostic before opening a bug.',
      detectedAt: new Date().toISOString()
    };
    render();
  }

  function report() {
    return {
      ...state,
      readyStateNow: document.readyState,
      hidden: document.hidden,
      focused: safe(() => document.hasFocus(), false),
      hostConnected: Boolean(host && host.isConnected),
      canaryMark: safe(() => document.documentElement.getAttribute('data-gitl-canary'), null),
      ghostBoot: safeBootMark(),
      ghostPanelPresent: safe(() => Boolean(document.getElementById('gitl')), false),
      browser: browserSummary(),
      privacy: 'No URL, prompt, chat text, selector, raw user-agent, exception text, credential, or stack is included.'
    };
  }

  function updateIncident() {
    const panelPresent = safe(() => Boolean(document.getElementById('gitl')), false);
    const boot = safeBootMark();
    const elapsed = Date.now() - STARTED_MS;
    if (panelPresent) {
      if (state.incident?.code === 'INJECT-001' || state.incident?.code === 'BOOT-003') {
        state.incident.resolvedAt = new Date().toISOString();
      }
      return;
    }
    if (String(boot || '').startsWith('error:')) {
      state.incident = {
        code: 'BOOT-001',
        summary: 'Ghost ran but its critical startup sequence failed.',
        guidance: 'Use Ghost’s visible boot banner plus this redacted diagnostic in a bug report.',
        detectedAt: new Date().toISOString()
      };
    } else if (elapsed >= 15000 && !state.incident) {
      state.incident = boot
        ? {
            code: 'BOOT-003',
            summary: 'Ghost started but its panel did not become available within 15 seconds.',
            guidance: 'Reload once; if this repeats, download this diagnostic and report the provider.',
            detectedAt: new Date().toISOString()
          }
        : {
            code: 'INJECT-001',
            summary: 'The canary ran, but Ghost produced no boot beacon within 15 seconds.',
            guidance: 'Check that Ghost is enabled for this site in the userscript manager, then report if permissions are correct.',
            detectedAt: new Date().toISOString()
          };
    }
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
    state.ghostBoot = safeBootMark();
    updateIncident();
    mark(`alive:${state.version}:body${state.bodyChanges}:removal${state.hostRemovals}`);
    render();
  }

  // NOTE: Shadow DOM is same-page and NOT under the page's Trusted Types policy
  // for its own innerHTML, but to stay maximally safe we build with DOM APIs.
  function render() {
    if (!shadow) return;
    const r = report();
    const color = r.incident || r.errors.length ? '#ff637d' : '#49d17d';
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
      'GITL CANARY ' + (r.incident || r.errors.length ? 'ERROR' : 'ALIVE') +
      (r.ghostPanelPresent ? ' · ghost:up' : r.incident ? ' · ' + r.incident.code : r.ghostBoot ? ' · ghost:' + r.ghostBoot : ' · checking')));
    shadow.appendChild(badge);

    if (detailOpen) {
      const card = document.createElement('div');
      card.className = 'card';
      card.appendChild(document.createTextNode(JSON.stringify(r, null, 2)));
      const row = document.createElement('div');
      row.className = 'row';
      const copy = document.createElement('button');
      copy.className = 'action'; copy.setAttribute('data-act', 'copy'); copy.textContent = 'Copy report';
      const download = document.createElement('button');
      download.className = 'action'; download.setAttribute('data-act', 'download'); download.textContent = 'Download JSON';
      const issue = document.createElement('button');
      issue.className = 'action'; issue.setAttribute('data-act', 'issue'); issue.textContent = 'Review & report bug';
      const reset = document.createElement('button');
      reset.className = 'action'; reset.setAttribute('data-act', 'reset'); reset.textContent = 'Reset counts';
      row.appendChild(copy); row.appendChild(download); row.appendChild(issue); row.appendChild(reset);
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
    } else if (act === 'download') {
      const blob = new Blob([JSON.stringify(report(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `gitl-canary-${state.incident?.code?.toLowerCase() || 'status'}-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } else if (act === 'issue') {
      const code = state.incident?.code || 'CANARY-STATUS';
      const title = `[diagnostic] ${code} on ${state.platform} (canary v${state.version})`;
      window.open(`https://github.com/MShneur/ghost-in-the-loop/issues/new?title=${encodeURIComponent(title)}`, '_blank', 'noopener');
    } else if (act === 'reset') {
      state.bodyChanges = 0; state.hostRemovals = 0; state.errors = []; state.incident = null; render();
    }
  }

  window.addEventListener('error', () => recordError('window.error'), true);
  window.addEventListener('unhandledrejection', () => recordError('unhandledrejection'), true);
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
