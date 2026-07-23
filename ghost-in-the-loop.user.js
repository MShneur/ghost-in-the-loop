// ==UserScript==
// @name         Ghost in the Loop
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      8.2.1
// @description  👻 AI workflow engine — auto-proceed, pipelines, personas, export, diagnostics, roadmap autopilot, handoff capsules. ChatGPT · Claude · Perplexity · Gemini · DeepSeek · Copilot · Grok · Manus + 13 more.
// @author       Michael S (CTRL-AI) — Architecture by Claude
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @match        https://gemini.google.com/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://grok.com/*
// @match        https://claude.ai/*
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
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        unsafeWindow
// @updateURL    https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @downloadURL  https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @run-at       document-idle
// @noframes
// @license      AGPL-3.0
// ==/UserScript==

(() => {
'use strict';
/* v8.2.0 transactional boot: do NOT commit the singleton here. Committing it
   before boot succeeded meant a partial/failed boot (e.g. the Trusted Types
   throw) permanently blocked any same-page retry. `window.__GITL_V8__` is now
   set to `true` only after the CRITICAL UI phases (styles → panel → render)
   succeed. A short in-flight marker prevents concurrent double-execution
   without poisoning a retry after a failed attempt. */
if (window.__GITL_V8__ === true) return;                                          // already fully booted
if (window.__GITL_BOOTING__ && Date.now() - window.__GITL_BOOTING__ < 15000) return; // an attempt is in flight
window.__GITL_BOOTING__ = Date.now();

/* ═══════════════════════════════════════════════════════════════
   BOOT BEACON + FAIL-LOUD (v8.1.4)
   The Gemini "panel never appears" reports were undiagnosable because a
   silent top-level throw kills the whole script before the panel (which is
   where all diagnostics live) can mount — so lastBootError was invisible.
   Two dependency-free instruments that work even when nothing else does:
     • a beacon written to <html data-gitl-boot="…"> at each phase, so it
       shows up in a plain SingleFile/"save page" capture: `started` →
       `ok:<ver>` on success, or `error:<stage>` if boot throws. This turns a
       static page save into a real diagnosis of whether the script even ran.
     • _gitlFatal(): on any fatal boot throw, surface it via GM_notification
       AND a fixed banner injected at documentElement level (not body — body
       may be the very thing that's missing/hostile), so the user can SEE and
       screenshot the actual error instead of a blank page.
   _gitlFatal is declared at IIFE scope (outside the try below) so it is
   reachable from both the top-level catch and safeBoot's catch. */
const _beacon = (s) => { try { document.documentElement.setAttribute('data-gitl-boot', s); } catch(_) {} };
_beacon('started');
function _gitlFatal(stage, err) {
  const msg = String((err && (err.message || err)) || 'unknown');
  _beacon('error:' + stage);
  /* Persist metadata only. The live banner can show the browser's error, but
     recovery/reporting must never retain page content, URLs, or stack data. */
  try { GM_setValue('lastBootError', JSON.stringify({ code: 'BOOT-001', stage, at: new Date().toISOString() })); } catch(_) {}
  try { console.error('[GITL] FATAL @' + stage + ':', err); } catch(_) {}
  try { if (typeof GM_notification === 'function') GM_notification({ title: '👻 Ghost failed to load (' + stage + ')', text: msg, timeout: 15000 }); } catch(_) {}
  try {
    if (document.getElementById('gitl-fatal')) return;
    const b = document.createElement('div');
    b.id = 'gitl-fatal';
    b.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#3a0d12;color:#ffd7dd;font:600 12px/1.4 system-ui,sans-serif;padding:10px 34px 10px 12px;border-bottom:2px solid #ff5570;box-shadow:0 4px 18px rgba(0,0,0,.5);white-space:pre-wrap;word-break:break-word');
    b.textContent = '👻 Ghost in the Loop couldn’t start on this page (' + stage + ').\n' + msg + '\nScreenshot this and send it — it says exactly what broke.';
    const x = document.createElement('span');
    x.textContent = '×';
    x.setAttribute('style', 'position:absolute;top:6px;right:10px;cursor:pointer;font-size:18px;line-height:1');
    x.addEventListener('click', () => b.remove());
    b.appendChild(x);
    (document.body || document.documentElement).appendChild(b);
  } catch(_) {}
}

try {

/* ═══════════════════════════════════════════════════════════════
   LAYER 0 — CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const VER = '8.2.1';
const SUPPORT_URL = 'https://github.com/sponsors/MShneur';
const REPORT_REPO = 'MShneur/ghost-in-the-loop';

/* ═══════════════════════════════════════════════════════════════
   TRUSTED TYPES (v8.1.5) — the actual Gemini root cause
   Gemini (a Google property) enforces `require-trusted-types-for 'script'`.
   Under that CSP, assigning a plain string to `.innerHTML` THROWS
   ("Sink type mismatch violation blocked by CSP" in Firefox) — which killed
   boot on the very first render and is why the panel never appeared on
   Gemini specifically (no other supported platform enforces Trusted Types).
   Confirmed from the v8.1.4 fail-loud banner on the reporter's device.
   Fix: register one policy at boot and route GITL's 4 innerHTML sinks through
   it. On every site that does NOT enforce Trusted Types, `_ttPolicy` stays
   null and `_TT()` returns the raw string — byte-identical behaviour, zero
   regression risk off Gemini. GITL only ever passes its OWN static templates
   here (persona/workflow text is already escaped via _esc upstream), so the
   pass-through policy introduces no new injection surface. */
let _ttPolicy = null;
try {
  if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
    // A per-script named policy — page-scoped, does NOT touch the page's own
    // default policy or other code. Name kept unique to avoid collisions.
    _ttPolicy = window.trustedTypes.createPolicy('gitl-ui', { createHTML: (s) => s });
  }
} catch (e) {
  // A restrictive `trusted-types` allow-list can forbid creating our policy.
  // Record it (surfaces via the beacon/banner) — the panel would then need a
  // DOM-built fallback, tracked as follow-up. Never fatal here.
  _ttPolicy = null;
  try { _beacon('tt-policy-blocked'); } catch(_) {}
}
/* Wrap any HTML string destined for an innerHTML sink. */
function _TT(s) { return _ttPolicy ? _ttPolicy.createHTML(s) : s; }
const SIGIL_PROCEED = '[[GITL::PROCEED]]';
const SIGIL_HALT    = '[[GITL::HALT]]';
const LEGACY_PROCEED = 'PROCEED';
const LEGACY_HALT    = 'SYSTEM_HALT';
const MIN_RESPONSE_LEN = 50;

/* Send-confirmation watchdog (v7.1): after a send, generation must
   actually start within this window. Guards the "Enter swallowed by a
   notification focus-steal" failure where the script thinks it sent
   but the platform never began generating. */
const SEND_CONFIRM_MS  = 9000;  // grace for generation to begin (covers slow first-token)

/* ═══════════════════════════════════════════════════════════════
   LAYER 0.5 — BOOT SAFETY + TAB LOCK + FOCUS GUARD
   Fixes v7.0-alpha loading failures: race conditions, multi-tab
   conflicts, background token burn.
   Sources: Kimi Deep Dive, Software Architect GPT, HTML/CSS GPT
   ═══════════════════════════════════════════════════════════════ */
const GITL_TAB_ID = crypto.randomUUID?.() || `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let _tabLockInterval = null;

/* safeBoot: guarantees document.body exists before any DOM work.
   If body isn't ready, retries via rAF. Catches and logs boot errors. */
function safeBoot(fn) {
  const boot = () => {
    try {
      if (!document.body) { requestAnimationFrame(boot); return; }
      fn();
    } catch (err) {
      // v8.1.4: was silent (stored to GM only, invisible since the panel that
      // shows it never mounted). Now fails loud via the same beacon+banner.
      _gitlFatal('boot', err);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else { boot(); }
}

/* Tab lock: prevents multi-tab race conditions. Only one GITL
   instance per conversation route can run the loop engine.
   Uses GM_getValue heartbeat with 8s expiry. */
function _tabLockKey() {
  return `gitl:lock:${location.hostname}:${location.pathname.split('/').slice(0,3).join('/')}`;
}

function claimTabLock() {
  const key = _tabLockKey();
  const now = Date.now();
  try {
    const raw = GM_getValue(key, null);
    const lock = raw ? JSON.parse(raw) : null;
    if (lock && lock.tabId !== GITL_TAB_ID && (now - lock.ts < 8000)) {
      return false; // another tab owns it
    }
  } catch(_){}
  GM_setValue(key, JSON.stringify({ tabId: GITL_TAB_ID, ts: now }));
  return true;
}

/* A read/write lease is not atomic across tabs. Before any actuator runs,
   claim, yield briefly, then re-read. If two tabs raced from an empty lock,
   only the deterministic last owner survives this verification step. */
async function verifyTabLease() {
  if (!claimTabLock()) return false;
  await new Promise(resolve => setTimeout(resolve, 35 + Math.floor(Math.random() * 45)));
  try {
    const raw = GM_getValue(_tabLockKey(), null);
    const lock = raw ? JSON.parse(raw) : null;
    return !!lock && lock.tabId === GITL_TAB_ID && Date.now() - lock.ts < 8000;
  } catch(_) {
    return false;
  }
}

function releaseTabLock() {
  try {
    const key = _tabLockKey();
    const raw = GM_getValue(key, null);
    if (raw) {
      const lock = JSON.parse(raw);
      if (lock.tabId === GITL_TAB_ID) GM_setValue(key, '');
    }
  } catch(_){}
}

function startTabHeartbeat() {
  if (_tabLockInterval) clearInterval(_tabLockInterval);
  _tabLockInterval = setInterval(() => {
    if (!claimTabLock()) {
      // lost ownership — pause if running
      if (typeof GHOST !== 'undefined' && GHOST.loop.state === 'RUNNING') {
        GHOST.loop.state = 'PAUSED';
        GHOST.loop.detail = '⚠ Tab lock lost — paused';
        if (typeof render === 'function') render();
      }
    }
  }, 5000);
}

/* ── Ticker (d12) ───────────────────────────────────────────────
   Hidden tabs throttle setInterval to roughly once a minute, which stalls the
   engine loop when you walk away. A Web Worker's timer is not throttled the
   same way, so unattended runs tick from a Worker. Strict page CSP can refuse
   blob: workers — in that case we transparently fall back to setInterval and
   report which path is live (visible in Diagnostics). */
const Ticker = {
  _worker: null, _iv: null, mode: 'none',
  start(fn, ms) {
    this.stop();
    if (unattendedOn() && typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
      try {
        const code = 'let i=null;onmessage=e=>{if(e.data&&e.data.cmd==="start"){if(i)clearInterval(i);i=setInterval(()=>postMessage("t"),e.data.ms);}else{clearInterval(i);i=null;}};';
        const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        this._worker = new Worker(url);
        URL.revokeObjectURL(url);
        this._worker.onmessage = () => { try { fn(); } catch(e) { DIAG.push('tick: ' + e.message); } };
        this._worker.postMessage({ cmd: 'start', ms });
        this.mode = 'worker';
        DIAG.push('Unattended: Worker ticker active (background-throttle immune)');
        return 'worker';
      } catch (e) {
        DIAG.push('Worker ticker blocked (page CSP) — using throttled timer: ' + e.message);
        this._worker = null;
      }
    }
    this._iv = setInterval(fn, ms);
    this.mode = 'interval';
    return 'interval';
  },
  stop() {
    if (this._worker) { try { this._worker.postMessage({ cmd: 'stop' }); this._worker.terminate(); } catch(_) {} this._worker = null; }
    if (this._iv) { clearInterval(this._iv); this._iv = null; }
    this.mode = 'none';
  }
};

/* Focus guard: prevents background tabs from burning tokens
   by auto-sending prompts while user isn't looking. */
function unattendedOn() {
  try { return !!(GHOST && GHOST.ui && GHOST.ui.unattended); } catch(_) { return false; }
}
function isTabSafeToAct() {
  if (!unattendedOn()) {
    if (!document.hasFocus()) return false;
    if (document.hidden) return false;
  }
  return claimTabLock();   // multi-tab collision guard is NEVER relaxed
}

/* Pre-send safety gate: called before every engineSend.
   Returns { ok, reason } */
function assertInteractionSafe() {
  if (!unattendedOn() && !document.hasFocus() && typeof GHOST !== 'undefined' && GHOST.loop.state === 'RUNNING') {
    return { ok: false, reason: 'tab-not-focused' };
  }
  if (!claimTabLock()) {
    return { ok: false, reason: 'tab-lock-held-by-other' };
  }
  return { ok: true, reason: 'ok' };
}

/* Cleanup on tab close */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    releaseTabLock();
    if (_tabLockInterval) clearInterval(_tabLockInterval);
  });
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 0.7 — NETWORK INTERCEPTOR (S1)
   Captures AI responses from fetch/XHR streams BEFORE they hit
   the DOM. Supplements DOM-based detection — does NOT replace it.
   Sources: Gemini Phase 0, Kimi Deep Dive, DeepSeek cascade
   ═══════════════════════════════════════════════════════════════ */
/* Page-world handle: with GM grants the script runs sandboxed, so patching
   the sandbox's window.fetch never sees the site's own requests. unsafeWindow
   is the page's real window (Firefox MV3 port: inject in world:"MAIN"). */
const UW = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

const GITL_NET = {
  bus: new EventTarget(),
  capturedAt: 0,
  lastEventBytes: 0,
  bytesSeen: 0,
  active: false,        // interceptor installed (kept for health snapshot compat)
  lastPulseT: 0,        // last traffic on a KNOWN chat endpoint (trusted)
  lastPulseH: 0,        // last traffic on a heuristic same-origin stream
  _open: 0,             // streams currently open
  expectUntil: 0,       // set by a dispatch attempt; bounds heuristic pulses

  AI_ENDPOINTS: [
    '/backend-api/conversation',   // ChatGPT
    '/api/organizations',          // Claude
    '/socket.io/',                 // Perplexity
    '/api/v1/chat/completions',    // DeepSeek / OpenAI-compat
    '/chat/conversation',          // HuggingChat
    '/api/chat',                   // Generic
    '/bard',                       // Gemini (legacy)
    'batchexecute',                // Gemini (current streaming transport)
    '/turn/',                      // Copilot
  ],

  _isChat(url) {
    if (!url) return false;
    const s = typeof url === 'string' ? url : url?.url || String(url);
    return this.AI_ENDPOINTS.some(ep => s.includes(ep));
  },

  _pulse(trusted) {
    const t = Date.now();
    if (trusted) this.lastPulseT = t; else this.lastPulseH = t;
  },

  /* Same-origin streams that LOOK like chat traffic even when the endpoint
     isn't in AI_ENDPOINTS — the platform-proof fallback when sites reshuffle
     their APIs. Analytics-ish URLs are excluded. */
  _maybeChat(url, method) {
    try {
      const s = typeof url === 'string' ? url : (url && url.url) || String(url || '');
      if (!s) return false;
      const sameOrigin = s.startsWith('/') || s.includes(location.hostname);
      if (!sameOrigin) return false;
      if (/log|telemetry|beacon|analytics|sentry|metric|track|collect|report/i.test(s)) return false;
      return String(method || 'GET').toUpperCase() === 'POST';
    } catch(_) { return false; }
  },

  /* True while generation traffic is plausibly flowing.
     Trusted (known-endpoint) pulses always count; heuristic pulses only count
     inside the post-send expectation window, so a random background stream
     can't convince the engine that a reply is being written. */
  streaming() {
    const now = Date.now();
    if (now - this.lastPulseT < 1500) return true;
    if (now < this.expectUntil && (this._open > 0 || now - this.lastPulseH < 1500)) return true;
    return false;
  },

  _emit(byteCount, isDone) {
    const bytes = Math.max(0, Number(byteCount) || 0);
    this.lastEventBytes = bytes;
    this.bytesSeen += bytes;
    this.capturedAt = Date.now();
    this._pulse(true);
    this.bus.dispatchEvent(new CustomEvent('gitl:net', {
      detail: { bytes, isDone: !!isDone, ts: Date.now() }
    }));
  },

  install() {
    if (this.active) return;
    this.active = true;
    /* v8.1.3 field report (Gemini "doesn't load"): install() used to run
       fully unguarded at module top-level, OUTSIDE safeBoot()'s try/catch
       (which only wraps panel creation much further down). In strict mode,
       reassigning a property a host page has hardened (Object.defineProperty
       with writable:false — a real pattern on security-conscious Google
       properties) throws a TypeError right here, which aborts the ENTIRE
       script before a single line of panel code runs: no #gitl, no console
       message a normal user would ever see, nothing. Every patch below is
       now individually fault-tolerant, and the whole method is wrapped too,
       so one hardened site can only cost that site's network telemetry —
       never the panel. */
    try {

    /* Fetch proxy on the PAGE window — captures SSE / JSON streams */
    const self = this;
    let origFetch; try { origFetch = UW.fetch; } catch(_) { origFetch = null; }
    try { if (typeof origFetch === 'function') UW.fetch = async function(...args) {
      const response = await origFetch.apply(this, args);
      const listed = self._isChat(args[0]);
      let heur = false;
      if (!listed) {
        try {
          const ct = response.headers && response.headers.get && (response.headers.get('content-type') || '');
          heur = ct.includes('event-stream') || self._maybeChat(args[0], args[1] && args[1].method);
        } catch(_) {}
      }
      if (heur) {
        /* Heuristic path: timestamps only — content is never read or stored. */
        try {
          const cloned = response.clone();
          if (cloned.body) {
            const reader = cloned.body.getReader();
            self._open++; self._pulse(false);
            (async () => {
              try { while (true) { const { done } = await reader.read(); self._pulse(false); if (done) break; } }
              catch(_) {}
              finally { self._open = Math.max(0, self._open - 1); }
            })();
          }
        } catch(_) {}
      }
      if (listed) {
        try {
              const cloned = response.clone();
              if (cloned.body) {
                const reader = cloned.body.getReader();
                (async () => {
                  try {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) { self._emit(0, true); break; }
                      self._emit(value?.byteLength || value?.length || 0, false);
                    }
                  } catch(_) { /* stream aborted — normal on navigation */ }
            })();
          }
        } catch(err) {
          console.warn('[GITL] fetch intercept error:', err);
        }
      }
      return response;
    }; } catch(err) { console.warn('[GITL] fetch patch skipped:', err); }

    /* XHR proxy on the PAGE window — Gemini streams via batchexecute XHRs */
    try {
      const XP = (UW.XMLHttpRequest && UW.XMLHttpRequest.prototype) || null;
      if (XP && XP.open && XP.send) {
        const origOpen = XP.open;
        XP.open = function(method, url, ...rest) {
          this._gitlUrl = url; this._gitlMethod = method;
          return origOpen.call(this, method, url, ...rest);
        };
        const origSend = XP.send;
        XP.send = function(...args) {
          const listed = self._isChat(this._gitlUrl);
          const heur = !listed && self._maybeChat(this._gitlUrl, this._gitlMethod);
          if (listed || heur) {
            try {
              this.addEventListener('loadstart', () => { self._open++; self._pulse(listed); });
              this.addEventListener('progress',  () => self._pulse(listed));
              this.addEventListener('loadend',   () => { self._open = Math.max(0, self._open - 1); self._pulse(listed); });
              if (listed) this.addEventListener('load', function() {
                if (this.status >= 200 && this.status < 300) self._emit(this.responseText?.length || 0, true);
              });
            } catch(_) {}
          }
          return origSend.apply(this, args);
        };
      }
    } catch(err) { console.warn('[GITL] XHR patch skipped:', err); }

    /* WebSocket pulse — Perplexity's socket.io traffic (timestamps only) */
    try {
      if (typeof UW.WebSocket === 'function') {
        UW.WebSocket = new Proxy(UW.WebSocket, {
          construct(T, a) {
            const ws = new T(...a);
            try { ws.addEventListener('message', () => self._pulse(self._isChat(a[0]))); } catch(_) {}
            return ws;
          }
        });
      }
    } catch(err) { console.warn('[GITL] WebSocket patch skipped:', err); }

    console.log('[GITL] Network interceptor active');
    } catch(err) {
      console.error('[GITL] Network interceptor failed to install — panel will still boot:', err);
      try { GM_setValue('lastNetInstallError', JSON.stringify({ code: 'BOOT-002', at: new Date().toISOString() })); } catch(_) {}
    }
  }
};

/* Install immediately — safe even before DOM. Also guarded at the call site:
   this runs before safeBoot() and used to be able to take the whole script
   down with it (see the v8.1.3 note inside install()). */
try { GITL_NET.install(); } catch(err) { console.error('[GITL] GITL_NET.install() threw at top level — continuing boot anyway:', err); }

/* ═══════════════════════════════════════════════════════════════
   LAYER 1 — PLATFORM ADAPTERS (all DOM access lives here)
   The loop engine NEVER touches the DOM directly.
   ═══════════════════════════════════════════════════════════════ */
const PROFILES = {
  chatgpt: {
    key: 'chatgpt', reviewed: true,
    host: /chatgpt\.com|chat\.openai\.com/,
    label: 'ChatGPT',
    input: ['#prompt-textarea','div[contenteditable="true"][id="prompt-textarea"]','div[contenteditable="true"][data-placeholder]','textarea[data-id="root"]','textarea'],
    send: ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send"]','form button[type="submit"]','button[data-testid*="send"]','button[data-testid*="submit"]','button[class*="send"]'],
    stop: ['button[aria-label="Stop generating"]','button[data-testid="stop-button"]','button[aria-label*="Stop"]','button[data-testid*="stop"]'],
    assistant: ['div[data-message-author-role="assistant"]','article [data-message-author-role="assistant"]','div[data-testid^="conversation-turn"] div[data-message-author-role="assistant"]'],
    continueLabels: ['Continue generating','Continue'],
    useCE: false, useNS: true
  },
  perplexity: {
    key: 'perplexity', reviewed: true,
    host: /perplexity\.ai/,
    label: 'Perplexity',
    input: ['textarea[placeholder*="Ask"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','[data-testid="composer"]','textarea:not([disabled])'],
    send: ['button[aria-label="Submit"]','button[aria-label="Send"]','button[type="submit"]'],
    stop: ['button[aria-label="Stop"]','button[aria-label*="Stop"]','[data-testid="stop-button"]','button[data-testid*="stop"]'],
    staleTicks: 24,   // Deep Research thinks for minutes with no DOM growth and no stop button
    assistant: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]','.pb-md > div'],
    continueLabels: [],
    useCE: true, useNS: false
  },
  gemini: {
    key: 'gemini', reviewed: true,
    host: /gemini\.google\.com/,
    label: 'Gemini',
    input: ['rich-textarea .ql-editor[contenteditable="true"]','div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','div[role="textbox"][contenteditable="true"]','div[contenteditable="true"]','textarea'],
    send: ['button[aria-label="Send message"]','button[aria-label*="Send"]','button.send-button','button[data-test-id="send-button"]'],
    stop: ['button[aria-label*="Stop"]','button[aria-label*="stop"]'],
    assistant: ['model-response message-content','model-response .message-content','model-response','div[class*="model-response"]','message-content'],
    continueLabels: [],
    useCE: true, useNS: false
  },
  deepseek: {
    key: 'deepseek', reviewed: true,
    host: /chat\.deepseek\.com/,
    label: 'DeepSeek',
    input: ['textarea[placeholder]','#chat-input','textarea'],
    send: ['div[class*="send"]','button[class*="send"]','button[aria-label*="Send"]'],
    stop: ['div[class*="stop"]','button[class*="stop"]'],
    assistant: ['div[class*="markdown"]'],
    continueLabels: [],
    useCE: false, useNS: false
  },
  copilot: {
    key: 'copilot', reviewed: true,
    host: /copilot\.microsoft\.com/,
    label: 'Copilot',
    input: ['textarea#userInput','#searchbox','textarea[placeholder*="message"]','textarea'],
    send: ['button[aria-label="Submit"]','button[title="Submit"]'],
    stop: ['button[aria-label="Stop Responding"]'],
    assistant: ['cib-message-group[source="bot"]'],
    continueLabels: [],
    useCE: false, useNS: false
  },
  grok: {
    key: 'grok', reviewed: true,
    host: /grok\.com/,
    label: 'Grok',
    input: ['textarea[aria-label="Ask Grok anything"]','textarea[placeholder*="Grok"]','textarea[placeholder*="Ask"]','textarea[data-testid="grok-compose-input"]','div[contenteditable="true"][data-lexical-editor="true"]','div[contenteditable="true"]','textarea'],
    send: ['button[aria-label="Submit"]','button[aria-label="Send message"]','button[aria-label*="Send"]','button[data-testid="send-button"]','button[data-testid*="submit"]','button[type="submit"]','button.send-button'],
    stop: ['button[aria-label="Stop"]','button[aria-label*="stop"]'],
    assistant: ['div[class*="message"][class*="bot"]','div[data-role="assistant"]','div[class*="response"]'],
    continueLabels: [],
    useCE: false, useNS: false
  },
  claude: {
    key: 'claude', reviewed: true,
    host: /claude\.ai/,
    label: 'Claude',
    input: ['div[contenteditable="true"].ProseMirror','div[contenteditable="true"][aria-label*="message"]','div.ProseMirror','div[contenteditable="true"]'],
    send: ['button[aria-label="Send Message"]','button[type="submit"]','button[aria-label*="Send"]'],
    stop: ['button[aria-label="Stop Response"]'],
    assistant: ['div[data-is-streaming]','div.font-claude-message','.claude-message'],
    continueLabels: [],
    useCE: true, useNS: false
  },
  manus: {
    key: 'manus', reviewed: true,
    host: /manus\.im/,
    label: 'Manus',
    // Verified against real Manus DOM: Tiptap ProseMirror input; Monaco code viewer has a decoy <textarea>.
    input: ['div.ProseMirror[contenteditable="true"]','div[contenteditable="true"][role="textbox"]','div[contenteditable="true"]:not(.monaco-editor *)'],
    send: ['button[type="submit"]','button[aria-label*="Send" i]','button[data-testid*="send"]'],
    stop: ['button[aria-label*="Stop" i]','button[class*="stop" i]'],
    assistant: ['[data-event-id]','div.manus-markdown'],
    continueLabels: [],
    useCE: true, useNS: false
  }
};

// Known platforms that run on the generic adapter (labeled, no dedicated selectors yet)
const GENERIC_HOSTS = [
  [/chat\.mistral\.ai/, 'Mistral'],
  [/kimi\.com|kimi\.moonshot\.cn/, 'Kimi'],
  [/chat\.qwen\.ai/, 'Qwen'],
  [/meta\.ai/, 'Meta AI'],
  [/poe\.com/, 'Poe'],
  [/huggingface\.co/, 'HuggingChat'],
  [/you\.com/, 'You.com'],
  [/pi\.ai/, 'Pi'],
  [/chat\.z\.ai/, 'Z.ai'],
  [/genspark\.ai/, 'Genspark'],
  [/chat\.minimax\.io/, 'MiniMax'],
  [/lmarena\.ai/, 'LMArena'],
  [/duck\.ai/, 'Duck.ai']
];

// Detect platform or use generic fallback
let PLAT = null;
for (const [, p] of Object.entries(PROFILES)) {
  if (p.host.test(location.hostname)) { PLAT = p; break; }
}
if (!PLAT) {
  let gLabel = 'Generic';
  for (const [rx, label] of GENERIC_HOSTS) { if (rx.test(location.hostname)) { gLabel = label; break; } }
  PLAT = {
    key: 'generic', reviewed: false,
    label: gLabel,
    input: ['textarea:not([disabled])','div[contenteditable="true"][role="textbox"]','div[contenteditable="true"]','textarea','input[type="text"]'],
    send: ['button[type="submit"]','button[aria-label*="Send" i]','button[aria-label*="Submit" i]','button[data-testid*="send"]','button[class*="send" i]'],
    stop: ['button[aria-label*="Stop" i]','button[data-testid*="stop"]','button[class*="stop" i]'],
    assistant: ['[data-message-author-role="assistant"]','[role="assistant"]','div[class*="markdown" i]','div[class*="prose" i]','div[class*="assistant" i]','div[class*="response" i]','div[class*="message" i]'],
    continueLabels: [],
    useCE: false, useNS: false
  };
}

// User-defined selector overrides (Settings → Custom sites). Prepended so they win.
// Shape: { "hostname-fragment": { label, input:[], send:[], stop:[], assistant:[], useCE, useNS } }
try {
  const _custom = JSON.parse(GM_getValue('customSites','{}'));
  for (const [hostKey, o] of Object.entries(_custom)) {
    if (hostKey && location.hostname.includes(hostKey)) {
      for (const k of ['input','send','stop','assistant']) {
        if (Array.isArray(o[k]) && o[k].length) PLAT[k] = [...o[k], ...(PLAT[k]||[])];
      }
      if (o.label) PLAT.label = o.label + ' (custom)';
      if (typeof o.useCE === 'boolean') PLAT.useCE = o.useCE;
      if (typeof o.useNS === 'boolean') PLAT.useNS = o.useNS;
      // Custom selectors remain useful for read-only capture, but an
      // unreviewed import must never gain autonomous actuator authority.
      PLAT.reviewed = false;
      break;
    }
  }
} catch(_){}

// Selector cache with route-change invalidation
const _cache = new Map();
let _lastHref = location.href;

const _deepLast = new Map(); // throttle shadow walks per key
function _shadowQS(sel) {
  const walk = (root, depth) => {
    if (depth > 4) return null;
    for (const host of root.querySelectorAll('*')) {
      if (host.shadowRoot) {
        try { const hit = host.shadowRoot.querySelector(sel); if (hit) return hit; } catch(_){}
        const deep = walk(host.shadowRoot, depth + 1); if (deep) return deep;
      }
    }
    return null;
  };
  try { return walk(document, 0); } catch(_) { return null; }
}

function _isOwnUI(el) {
  // Never match elements inside GITL's own panel (prevents the input/recovery
  // selectors from matching our settings textarea — found by Replit e2e)
  return !!(el && el.closest && el.closest('#gitl'));
}

function _q(key, sels) {
  const c = _cache.get(key);
  if (c?.isConnected && !_isOwnUI(c)) return c;
  _cache.delete(key);
  for (const s of sels || []) {
    try {
      for (const el of document.querySelectorAll(s)) {
        if (el && !_isOwnUI(el)) { _cache.set(key, el); return el; }
      }
    } catch(_){}
  }
  // Shadow DOM fallback (Copilot-style shadow roots) — throttled to once per 5s per key
  const now = Date.now();
  if ((now - (_deepLast.get(key) || 0)) > 5000) {
    _deepLast.set(key, now);
    for (const s of sels || []) {
      const el = _shadowQS(s);
      if (el && !_isOwnUI(el)) { _cache.set(key, el); return el; }
    }
  }
  return null;
}

function _qAll(sels) {
  // Merge all matching elements, deduplicated (fixes v5 qAll bug)
  // Excludes GITL's own UI elements.
  const seen = new Set(), results = [];
  for (const s of (Array.isArray(sels) ? sels : [sels])) {
    try { document.querySelectorAll(s).forEach(el => { if (!seen.has(el) && !_isOwnUI(el)) { seen.add(el); results.push(el); } }); } catch(_){}
  }
  return results;
}

/* ── Heuristic finders (final fallback tier) ─────────────────────
   When a site redesign breaks every configured selector, these locate the
   composer and send button by ROLE and MEANING instead of class names —
   the Playwright-style aria/text-first strategy. Engaged only when the
   selector arrays come up empty, so normal operation is unchanged. */
const SEND_WORDS = /send|submit|发送|傳送|送信|보내기|enviar|envoyer|senden|invia|отправ|إرسال|gönder/i;
/* v8.1: veto list expanded after the DeepSeek incident — the heuristic tier
   clicked the reply's "Copy" button (svg icon + proximity alone scored past
   the old threshold) and the user's prompt got copied instead of sent.
   Message-action verbs are now hard-vetoed on EVERY send tier. */
/* v8.2.1: added model/plus/tool/option after issues #4 and #5 — the heuristic
   tier learned a WRONG send control on two sites because it lived inside the
   composer form (the "same-form" signal alone qualified it): #model-select-
   trigger on Grok and #composer-plus-btn on ChatGPT. Their ids/labels are now
   vetoed too, and a structural popup-toggle check (below) catches the general
   case regardless of wording. */
const SEND_VETO  = /stop|voice|mic|dictat|attach|upload|search|new chat|settings|menu|close|copy|download|share|edit|delete|regenerat|retry|rewrite|like|dislike|thumb|feedback|read.?aloud|speaker|volume|translat|pin\b|bookmark|history|sidebar|scroll|expand|collapse|fullscreen|deep.?think|research|model|plus\b|tool|option|picker|dropdown|emoji|format/i;

/* A candidate send control must clear the veto no matter which tier found
   it — configured selectors can rot into matching the wrong control after
   a site redesign (e.g. div[class*="send"] matching a share widget). */
function _sendLooksSafe(el) {
  if (!el) return false;
  try {
    /* v8.2.1 structural gate (issues #4/#5): a send button submits — it never
       opens a menu or toggles a disclosure. Model pickers, the "+" attach menu
       and tool dropdowns all carry aria-haspopup and/or aria-expanded. This
       one check kills #model-select-trigger (Grok) and #composer-plus-btn
       (ChatGPT) no matter how they are labelled. */
    if (el.getAttribute('aria-haspopup')) return false;
    if (el.getAttribute('aria-expanded') != null) return false;
    /* id is telltale on both field mislearns ("model-select", "plus-btn") yet
       was never inspected before — fold it into the veto surface. */
    const label = [el.getAttribute('id'), el.getAttribute('aria-label'),
                   el.getAttribute('title'), el.getAttribute('data-testid'),
                   el.textContent].join(' ').slice(0, 160);
    return !SEND_VETO.test(label);
  } catch(_) { return false; }
}

function _visible(el) {
  try {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  } catch(_) { return false; }
}

const _heurCache = { input:{el:null,ts:0}, send:{el:null,ts:0} };
let _heurNoteTs = 0;
function _heurNote(what) {
  if (Date.now() - _heurNoteTs < 60000) return;
  _heurNoteTs = Date.now();
  DIAG.push('Heuristic ' + what + ' engaged — configured selectors failed');
}

function _heurInput() {
  const c = _heurCache.input;
  if (c.el && c.el.isConnected && Date.now() - c.ts < 4000) return c.el;
  let best = null, bestScore = 3;
  for (const el of _qAll(['textarea:not([disabled])','div[contenteditable="true"]'])) {
    if (!_visible(el)) continue;
    let s = 0;
    const r = el.getBoundingClientRect();
    if (el.getAttribute('role') === 'textbox' || el.getAttribute('aria-label')) s += 3;
    if (r.top > innerHeight * 0.4) s += 2;
    s += Math.min(2, (r.width * r.height) / 50000);
    if (/ProseMirror|ql-editor/.test(String(el.className || ''))) s += 2;
    if (s > bestScore) { bestScore = s; best = el; }
  }
  if (best) { _heurNote('input finder'); _heurCache.input.el = best; _heurCache.input.ts = Date.now(); }
  return best;
}

function _heurSend(anchor) {
  const c = _heurCache.send;
  if (c.el && c.el.isConnected && !c.el.disabled && Date.now() - c.ts < 4000) return c.el;
  let best = null, bestScore = 3.5;
  const ar = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
  const aForm = anchor && anchor.closest ? anchor.closest('form') : null;
  for (const el of _qAll(['button','[role="button"]'])) {
    if (!_visible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    const label = [el.getAttribute('aria-label'), el.getAttribute('title'),
                   el.getAttribute('data-testid'), el.textContent].join(' ').slice(0, 120);
    // Single veto gate (v8.2.1): _sendLooksSafe now also inspects id and rejects
    // popup-toggles (aria-haspopup/aria-expanded), so a wrong click (mic, attach,
    // model-picker, "+") is filtered here too — worse than no click at all.
    if (!_sendLooksSafe(el)) continue;
    /* v8.1 semantic gate: proximity + an svg icon must NEVER be enough on
       their own (that combination is every message-action button on the
       page). A candidate needs at least one POSITIVE send signal. */
    const sem = SEND_WORDS.test(label)
             || (el.getAttribute('type') || '') === 'submit';
    if (!sem) continue;
    let s = 0;
    if (SEND_WORDS.test(label)) s += 4;
    if ((el.getAttribute('type') || '') === 'submit') s += 2;
    if (el.querySelector && el.querySelector('svg') && (el.textContent || '').trim().length < 2) s += 1;
    if (aForm && el.closest && el.closest('form') === aForm) s += 3;
    if (ar) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot((r.left + r.width/2) - (ar.left + ar.width/2),
                           (r.top + r.height/2) - (ar.top + ar.height/2));
      if (d < 320) s += 3;
    }
    if (s > bestScore) { bestScore = s; best = el; }
  }
  if (best) { _heurNote('send-button finder'); _heurCache.send.el = best; _heurCache.send.ts = Date.now(); }
  return best;
}

/* ── SELECTOR MEMORY (read-only locators only) ───────────────────
   Composer/message observation may learn a unique locator. Actuators never
   do: an automatically learned Send/Delete/Continue control would turn a
   guess into persistent authority. */
const SelectorMemory = {
  key: 'gitlLearnedSelectors',
  MAX_HOSTS: 12,
  _data: null,

  _load() {
    if (this._data) return this._data;
    try { this._data = JSON.parse(GM_getValue(this.key, '{}')) || {}; } catch(_) { this._data = {}; }
    return this._data;
  },
  _persist() { try { GM_setValue(this.key, JSON.stringify(this._data)); } catch(_){} },

  /* Derive a stable selector that uniquely matches el right now, or null. */
  derive(el) {
    if (!el || !el.getAttribute) return null;
    const esc = (s) => (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(s) : String(s).replace(/([^\w-])/g, '\\$1');
    const tag = (el.tagName || '').toLowerCase();
    const cands = [];
    const id = el.getAttribute('id');
    if (id) cands.push(`#${esc(id)}`);
    for (const a of ['data-testid','data-test-id','aria-label','name','placeholder','data-placeholder']) {
      const v = el.getAttribute(a);
      if (v && v.length <= 80) cands.push(`${tag}[${a}="${v.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}"]`);
    }
    const role = el.getAttribute('role');
    if (role && el.getAttribute('contenteditable') === 'true') cands.push(`${tag}[contenteditable="true"][role="${role}"]`);
    for (const sel of cands) {
      try { const m = document.querySelectorAll(sel); if (m.length === 1 && m[0] === el) return sel; } catch(_){}
    }
    return null;
  },

  learn(kind, el) {
    if (kind === 'send') {
      this.forget('send');
      return null;
    }
    const sel = this.derive(el);
    if (!sel) return null;
    const d = this._load(), h = location.hostname;
    d[h] = d[h] || {};
    const prev = d[h][kind];
    d[h][kind] = { sel, at: Date.now() };
    // Prune least-recently-touched hosts beyond the cap.
    const hosts = Object.keys(d);
    if (hosts.length > this.MAX_HOSTS) {
      hosts.sort((a, b) =>
        Math.max(0, ...Object.values(d[a]).map(x => x.at || 0)) -
        Math.max(0, ...Object.values(d[b]).map(x => x.at || 0)));
      while (hosts.length > this.MAX_HOSTS) delete d[hosts.shift()];
    }
    this._persist();
    if (!prev || prev.sel !== sel) {
      try { DIAG.push(`Learned ${kind} selector: ${sel}`); } catch(_){}
      try { Timeline.record('selector_learned', { kind, sel }); } catch(_){}
    }
    return sel;
  },

  lookup(kind) {
    if (kind === 'send') {
      this.forget('send');
      return null;
    }
    const rec = this._load()[location.hostname]?.[kind];
    if (!rec || !rec.sel) return null;
    try {
      for (const el of document.querySelectorAll(rec.sel)) {
        if (el && !_isOwnUI(el) && _visible(el)) {
          return el;
        }
      }
    } catch(_) { this.forget(kind); }
    return null;
  },

  forget(kind) {
    const d = this._load(), h = location.hostname;
    if (d[h] && d[h][kind]) {
      delete d[h][kind];
      if (!Object.keys(d[h]).length) delete d[h];
      this._persist();
    }
  }
};

/* Only reviewed profile selectors can authorize a send. A heuristic result
   is diagnostic information, never an actuator. Each selector tier must
   resolve to exactly one enabled, visible, veto-safe element. */
function _reviewedSend() {
  if (!PLAT?.reviewed) return null;
  for (const sel of PLAT.send || []) {
    let matches = [];
    try {
      matches = [...document.querySelectorAll(sel)].filter(el =>
        !_isOwnUI(el)
        && !el.disabled
        && el.getAttribute('aria-disabled') !== 'true'
        && _visible(el)
        && _sendLooksSafe(el));
    } catch(_) {
      matches = [];
    }
    if (matches.length === 1) return matches[0];
  }
  return null;
}

// Adapter — all DOM reads/writes
const Adapter = {
  peekInput() {
    return _q('in', PLAT.input) || SelectorMemory.lookup('input');
  },
  getInput() {
    let el = this.peekInput();
    if (!el) { el = _heurInput(); if (el) SelectorMemory.learn('input', el); }
    return el;
  },
  getSendBtn() {
    return _reviewedSend();
  },
  getSendCandidate() {
    return _heurSend(this.peekInput() || null);
  },
  isGenerating()  { return !!_q('gen', PLAT.stop) || GITL_NET.streaming(); },
  hasMessages()   { return _qAll(PLAT.assistant).length > 0; },
  getLastText() {
    // Gemini only: virtual scroll — nudge infinite-scroller to bottom
    if (PLAT && PLAT.key === 'gemini') {
      try { const s = document.querySelector('infinite-scroller'); if (s) s.scrollTop = s.scrollHeight; } catch(_){}
    }
    const els = _qAll(PLAT.assistant);
    return els.length ? (els[els.length-1].innerText || '').trim() : '';
  },
  clickContinue() {
    if (!PLAT.continueLabels?.length) return false;
    for (const btn of document.querySelectorAll('button')) {
      if (PLAT.continueLabels.some(l => btn.textContent.includes(l))) { btn.click(); return true; }
    }
    return false;
  },
  injectText(el, text) {
    if (!el) return false;
    el.focus();
    // Path 1: contenteditable (ProseMirror/Quill/Lexical)
    if (el.getAttribute('contenteditable') === 'true' || PLAT.useCE) {
      // FIX: selectAll+insertText preserves ProseMirror state (innerHTML='' destroys it)
      document.execCommand('selectAll', false, null);
      const ok = document.execCommand('insertText', false, text);
      if (!ok) {
        // execCommand unavailable — fall back with proper InputEvent
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { inputType:'insertText', data:text, bubbles:true, cancelable:true, composed:true }));
      } else {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Paste tier: some editors (Lexical builds) ignore both paths above.
      if ((el.textContent || '').indexOf(text.slice(0, 24)) === -1) {
        try {
          if (typeof DataTransfer !== 'undefined' && typeof ClipboardEvent !== 'undefined') {
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true }));
            DIAG.sendPath = 'ce-paste';
          }
        } catch(_) {}
      }
      el.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:text, composed:true }));
      if (DIAG.sendPath !== 'ce-paste') DIAG.sendPath = 'contenteditable';
      return true;
    }
    // Path 2: native React setter
    if (PLAT.useNS && el.tagName === 'TEXTAREA') {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) { setter.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); DIAG.sendPath = 'native-setter'; return true; }
    }
    // Path 3: direct value
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    DIAG.sendPath = 'direct-value';
    return true;
  },
  pressEnter(el) {
    // Stage A: insertParagraph beforeinput — ProseMirror/Lexical native submit signal
    try { el.dispatchEvent(new InputEvent('beforeinput', { inputType:'insertParagraph', bubbles:true, cancelable:true, composed:true })); } catch(_){}
    // Stage B: keyboard Enter with composed:true — crosses Shadow DOM boundaries
    ['keydown','keypress','keyup'].forEach(t => {
      el.dispatchEvent(new KeyboardEvent(t, { key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true, cancelable:true, composed:true }));
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   LAYER 2 — STATE STORE (single GHOST object)
   ═══════════════════════════════════════════════════════════════ */
const PERSONA_LIBRARY = {
  none:       { label: 'None', inject: '' },
  researcher: { label: 'Researcher', inject: 'Adopt the persona of a rigorous senior researcher: clarify assumptions, gather evidence, compare alternatives, and explicitly note uncertainty when evidence is weak.' },
  builder:    { label: 'Builder', inject: 'Adopt the persona of a senior builder/operator: prefer implementation detail, sequence, dependencies, tradeoffs, and concrete execution steps over vague theory.' },
  redteam:    { label: 'Red Team', inject: 'Adopt the persona of a hostile but fair red-team reviewer: attack weak assumptions, find failure modes, identify exploit paths, and surface how this could go wrong in reality.' },
  devil:      { label: "Devil's Advocate", inject: "Adopt the persona of a devil's advocate: challenge the dominant framing, propose contrarian interpretations, and test whether the current direction is overconfident or incomplete." },
  tester:     { label: 'Tester', inject: 'Adopt the persona of a destructive QA and reliability tester: search for breakage, edge cases, race conditions, user-error paths, and ambiguous states.' },
  customer:   { label: 'Customer Voice', inject: 'Adopt the persona of a skeptical end user/customer: surface confusion, friction, mistrust, negative feedback, missing explanations, and why adoption might fail.' },
  executive:  { label: 'Executive', inject: 'Adopt the persona of an executive operator: prioritize leverage, decision quality, clarity, speed, downside risk, and what matters most if time is limited.' },
  roundtable: { label: 'Round Table', inject: 'Simulate a compact round-table: Researcher, Builder, Red Team, Customer Voice, and Executive. Let each contribute distinct viewpoints, then synthesize a stronger consensus with disagreements preserved.' }
};

// Perplexity (and any model-switcher) variant — a REAL round table across models, not a simulated one.
const ROUNDTABLE_LIVE = 'This is a live multi-model round table. The operator switches the active model between turns using the model selector. You are ONE lens at this table. Give your OWN independent assessment of the work so far — do NOT simply agree with or extend the previous model. Challenge assumptions, fill gaps, add what only you would add. Put all substantive output in a single code block, no fluff, so it carries cleanly to the next model. End with one line naming which model should take the next turn and why, then [[GITL::PROCEED]] — or [[GITL::HALT]] only if genuine consensus is reached.';

/* The full context block for a run: who the model is (persona/committee),
   how it should think (posture), and how it should work (strategy).
   `includeStrategy` is false on roadmap resumes — re-sending the roadmap
   payload mid-run would ask for a brand-new roadmap. */
function runDirectives(includeStrategy = true) {
  const L = GHOST.loop;
  const persona = resolvePersonaInject();
  const posture = POSTURES[L.posture] || POSTURES.standard;
  let out = '';
  if (persona) out += `\n\n[Active persona]\n${persona}`;
  if (includeStrategy && PAYLOADS[L.payloadMode]) out += PAYLOADS[L.payloadMode].inject;
  out += posture.clause + (L.posture === 'standard' ? '' : POSTURE_CEILING);
  return out;
}
function hasPendingDirectives() {
  return !GHOST.persona._delivered && !!resolvePersonaInject();
}

function resolvePersonaInject() {
  let sel = GHOST.persona.selected;
  if (typeof sel === 'string') sel = [sel];
  if (!Array.isArray(sel)) sel = ['none'];
  const active = sel.filter(s => s && s !== 'none');
  if (!active.length) return '';
  // Special: live Perplexity round table is a protocol, not composable
  if (active.includes('roundtable') && /Perplexity/i.test(PLAT.label)) return ROUNDTABLE_LIVE;
  // Single persona — classic behavior
  if (active.length === 1) return allPersonas()[active[0]]?.inject || '';
  // Committee: concatenate perspectives with framing
  const personas = active.map(s => allPersonas()[s]).filter(Boolean);
  if (!personas.length) return '';
  const names = personas.map(p => p.label).join(', ');
  const injects = personas.map(p => `• ${p.label}: ${p.inject}`).join('\n');
  return `You are operating as a committee of ${active.length} expert perspectives: ${names}.\nFor each task or decision point, give each perspective's independent assessment, then synthesize a stronger consensus with disagreements preserved.\n\nThe perspectives:\n${injects}`;
}

const WORKFLOW_LIBRARY = {
  none:          { label: 'Manual', desc: 'Standard Ghost loop — no automatic stage prompts.', stages: [] },
  deep_research: { label: 'Deep Research', desc: 'Research → branch → red team → synthesis.', stages: [
    'You have completed the initial pass. Now expand the research: identify missing angles, weakly supported assumptions, hidden dependencies, and adjacent questions worth investigating.',
    'Generate 3–7 high-value research branches. Rank by upside, risk reduction, and novelty. Pursue the top branch first.',
    'Red-team everything produced so far. Find what is wrong, brittle, naïve, overfit, ungrounded, or likely to fail in reality.',
    'Synthesize the best final output. Preserve the strongest ideas, remove weak ones, deliver the upgraded result with clear reasoning and tradeoffs.'
  ]},
  rd_lab:        { label: 'R&D Lab', desc: 'Invent → prototype → evaluate → converge.', stages: [
    'Shift into R&D mode. Generate ambitious but plausible directions beyond the current framing.',
    'Choose the most promising directions and expand into concrete mechanisms. Explain how each one would actually work.',
    'Prototype-review mode: compare candidates, identify fatal flaws, decide which to merge, cut, or reframe.',
    'Deliver the strongest evolved concept as a coherent final design with rationale and open questions.'
  ]},
  shipyard:      { label: 'Shipyard', desc: 'Concept → execution plan → QA → production-ready.', stages: [
    'Translate the work into an execution plan. Break into milestones, dependencies, and the first shippable version.',
    'Act as QA plus operations. Identify what will fail during implementation, onboarding, edge cases, and scaling.',
    'Rewrite the plan into a production-ready version: streamlined, resilient, and prioritized with rollback thinking.'
  ]},
  debate:        { label: 'Debate', desc: 'Multi-persona challenge and synthesis.', stages: [
    'Run a structured round-table: Researcher, Builder, Red Team, Customer Voice, Executive. Keep viewpoints distinct.',
    'Force disagreement: identify main conflicts, what each persona thinks the others underestimate, which critique matters most.',
    'Resolve the debate and produce the improved answer that best survives all critiques.'
  ]},
  pre_mortem:    { label: 'Pre-Mortem', desc: 'Assume failure → investigate → harden.', stages: [
    'Assume this fails badly in 6 months. Explain exactly how and why: product, technical, human, messaging, and market reasons.',
    'Identify early warning indicators and the smallest interventions that would have prevented that failure.',
    'Rewrite the strategy so it is explicitly hardened against those failure modes.'
  ]},
  trollproof:    { label: 'Trollproof', desc: 'Hostile feedback → filter → harden.', stages: [
    'Simulate the most damaging negative feedback, mocking reactions, bad-faith interpretations, and hostile public criticism this could attract.',
    'Determine which criticisms are unfair noise and which reveal a real weakness that should be fixed.',
    'Rewrite the output so it is clearer, more resilient, and better prepared for hostile interpretation.'
  ]},
  lens_relay:    { label: 'Lens Relay', desc: 'Real model-switch round table. Turn on "Pause between" — swap the model each pause, press ▶.', stages: [
    'New lens turn. Give your OWN independent assessment of all work so far. Do not agree by default — challenge assumptions, surface gaps, add what only your perspective adds. All substantive output in one code block, no fluff. Name which model should go next.',
    'New lens turn. Focus on what every previous lens underestimated or missed entirely. Independent take, code block, no fluff. Name the next model.',
    'New lens turn. Draft the synthesis candidate: merge the strongest points across all lenses, preserve real disagreements explicitly. Code block, no fluff.',
    'Final lens. Verify the synthesis against every prior critique. Deliver the consensus result — complete, deliverable-grade, in one code block.'
  ]}
};

/* ═══════════════════════════════════════════════════════════════
   WORKSHOP (v7.1) — community-content layer
   Custom personas & workflows the user creates or imports from a file.
   Built-ins above are IMMUTABLE; customs layer on top. Import is purely
   additive (built-in ids are protected; custom-id clashes auto-rename),
   so a bad import can never destroy existing items or break the plugin.
   Shared as a single combined .gitl.json bundle.
   ═══════════════════════════════════════════════════════════════ */
const WORKSHOP_SCHEMA = 'gitl-workshop/1';
const WORKSHOP_LIMITS = {
  fileBytes: 512 * 1024,   // reject import files larger than 512 KB before parsing
  maxItems:  200,          // max personas + workflows accepted from one import
  label:     40,
  inject:    4000,
  desc:      200,
  stage:     2000,
  stages:    20
};
const Workshop = {
  personas: {},   // id → { label, inject, custom:true }
  workflows: {},  // id → { label, desc, stages:[], custom:true }

  load() {
    try { this.personas  = JSON.parse(GM_getValue('customPersonas',  '{}')) || {}; } catch(_) { this.personas = {}; }
    try { this.workflows = JSON.parse(GM_getValue('customWorkflows', '{}')) || {}; } catch(_) { this.workflows = {}; }
  },
  _persist() {
    _save('customPersonas',  JSON.stringify(this.personas));
    _save('customWorkflows', JSON.stringify(this.workflows));
  },

  _slug(s) { return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40) || 'item'; },
  _uniqueId(base, taken) {
    let id = this._slug(base), n = 2;
    while (taken.has(id)) { id = `${this._slug(base)}_${n++}`; }
    return id;
  },

  // ── Validation: tolerant but strict enough to never inject garbage ──
  _validPersona(p) {
    return p && typeof p.label === 'string' && p.label.trim().length > 0
             && typeof p.inject === 'string' && p.inject.trim().length > 0;
  },
  _validWorkflow(w) {
    return w && typeof w.label === 'string' && w.label.trim().length > 0
             && Array.isArray(w.stages) && w.stages.length > 0
             && w.stages.every(s => typeof s === 'string' && s.trim().length > 0);
  },

  addPersona(label, inject) {
    const taken = new Set([...Object.keys(PERSONA_LIBRARY), ...Object.keys(this.personas)]);
    const id = this._uniqueId(label, taken);
    this.personas[id] = { label: String(label).slice(0,40), inject: String(inject).slice(0,4000), custom: true };
    this._persist(); return id;
  },
  addWorkflow(label, desc, stages) {
    const taken = new Set([...Object.keys(WORKFLOW_LIBRARY), ...Object.keys(this.workflows)]);
    const id = this._uniqueId(label, taken);
    this.workflows[id] = { label: String(label).slice(0,40), desc: String(desc||'').slice(0,200),
      stages: stages.map(s => String(s).slice(0,2000)).slice(0,20), custom: true };
    this._persist(); return id;
  },
  removePersona(id)  { if (this.personas[id])  { delete this.personas[id];  this._persist(); return true; } return false; },
  removeWorkflow(id) { if (this.workflows[id]) { delete this.workflows[id]; this._persist(); return true; } return false; },

  // ── Export: combined bundle of custom items only ──
  exportBundle() {
    const out = {
      schema: WORKSHOP_SCHEMA,
      tool: 'Ghost in the Loop',
      version: VER,
      exported: new Date().toISOString(),
      personas:  Object.entries(this.personas).map(([id,p])  => ({ id, label: p.label, inject: p.inject })),
      workflows: Object.entries(this.workflows).map(([id,w]) => ({ id, label: w.label, desc: w.desc, stages: w.stages }))
    };
    // v8.1: the active custom skin rides along (validated tokens only), so a
    // single .gitl.json can share a complete look-and-brains pack.
    try {
      if (typeof SKIN !== 'undefined' && typeof GHOST !== 'undefined'
          && GHOST.ui.skinTheme === 'custom' && GHOST.ui.customSkin) {
        const r = SKIN.validate(GHOST.ui.customSkin);
        if (r.ok) out.skin = r.skin;
      }
    } catch(_) {}
    return JSON.stringify(out, null, 2);
  },

  // ── Share (v8.1): paste-ready markdown post for GitHub Discussions ──
  shareText() {
    const nP = Object.keys(this.personas).length;
    const nW = Object.keys(this.workflows).length;
    const items = [
      ...Object.values(this.personas).map(p => `- 👤 ${p.label}`),
      ...Object.values(this.workflows).map(w => `- ⛓ ${w.label} (${(w.stages||[]).length} stages)`)
    ];
    let skinLine = '';
    try {
      if (typeof GHOST !== 'undefined' && GHOST.ui.skinTheme === 'custom' && GHOST.ui.customSkin) {
        const nm = JSON.parse(GHOST.ui.customSkin).name || 'custom';
        items.push(`- 🎨 Skin: ${nm}`);
        skinLine = ', 1 skin';
      }
    } catch(_) {}
    const title = (typeof GHOST !== 'undefined' && GHOST.project.name) ? GHOST.project.name : 'My GITL pack';
    return `## Workshop pack: ${title}\n\n**Contains:** ${nP} persona(s), ${nW} workflow(s)${skinLine}\n\n${items.join('\n')}\n\nTo use: save the JSON below as \`pack.gitl.json\`, then **⬆ Import** in Ghost's Workshop.\n\n\`\`\`json\n${this.exportBundle()}\n\`\`\`\n`;
  },

  // ── Import: additive, protects built-ins, auto-renames custom clashes ──
  importBundle(text) {
    if (typeof text !== 'string') return { ok:false, error:'No file content' };
    // Reject oversized payloads BEFORE parsing (cheap DoS / paste-bomb guard).
    if (text.length > WORKSHOP_LIMITS.fileBytes) return { ok:false, error:`File too large (max ${Math.round(WORKSHOP_LIMITS.fileBytes/1024)} KB)` };
    let data; try { data = JSON.parse(text); } catch(_) { return { ok:false, error:'Not valid JSON' }; }
    if (!data || typeof data !== 'object') return { ok:false, error:'Empty or malformed file' };
    if (data.schema && !String(data.schema).startsWith('gitl-workshop/')) return { ok:false, error:'Not a Ghost Workshop file' };
    const inP = Array.isArray(data.personas)  ? data.personas  : [];
    const inW = Array.isArray(data.workflows) ? data.workflows : [];
    const hasSkin = data.skin && typeof data.skin === 'object';
    if (inP.length + inW.length === 0 && !hasSkin) return { ok:false, error:'No personas, workflows, or skin in file' };
    if (inP.length + inW.length > WORKSHOP_LIMITS.maxItems) return { ok:false, error:`Too many items (max ${WORKSHOP_LIMITS.maxItems})` };
    const res = { ok:true, personas:0, workflows:0, skipped:0, renamed:0 };
    const pTaken = new Set([...Object.keys(PERSONA_LIBRARY), ...Object.keys(this.personas)]);
    for (const p of inP) {
      if (!this._validPersona(p)) { res.skipped++; continue; }
      const base = p.id || p.label;
      const id = this._uniqueId(base, pTaken);
      if (this._slug(base) !== id) res.renamed++;
      pTaken.add(id);
      this.personas[id] = { label: p.label.trim().slice(0,WORKSHOP_LIMITS.label), inject: p.inject.trim().slice(0,WORKSHOP_LIMITS.inject), custom: true };
      res.personas++;
    }
    const wTaken = new Set([...Object.keys(WORKFLOW_LIBRARY), ...Object.keys(this.workflows)]);
    for (const w of inW) {
      if (!this._validWorkflow(w)) { res.skipped++; continue; }
      const base = w.id || w.label;
      const id = this._uniqueId(base, wTaken);
      if (this._slug(base) !== id) res.renamed++;
      wTaken.add(id);
      this.workflows[id] = { label: w.label.trim().slice(0,WORKSHOP_LIMITS.label), desc: String(w.desc||'').trim().slice(0,WORKSHOP_LIMITS.desc),
        stages: w.stages.map(s => String(s).trim().slice(0,WORKSHOP_LIMITS.stage)).slice(0,WORKSHOP_LIMITS.stages), custom: true };
      res.workflows++;
    }
    // v8.1: optional bundled skin — validated by the skin whitelist, applied
    // as the custom skin. Invalid skins are skipped, never fatal.
    res.skin = 0;
    if (hasSkin) {
      try {
        if (typeof SKIN !== 'undefined') {
          const r = SKIN.validate(JSON.stringify(data.skin));
          if (r.ok && typeof GHOST !== 'undefined') {
            GHOST.ui.customSkin = JSON.stringify(r.skin);
            GHOST.ui.skinTheme = 'custom';
            _save('customSkin', GHOST.ui.customSkin);
            _save('skinTheme', 'custom');
            SKIN.apply();
            res.skin = 1;
          } else { res.skipped++; }
        }
      } catch(_) { res.skipped++; }
    }
    this._persist();
    return res;
  }
};

// Merge accessors — built-ins first, customs layered on top. All read sites
// use these so custom items appear everywhere built-ins do.
function allPersonas()  { return Object.assign({}, PERSONA_LIBRARY,  Workshop.personas); }
function allWorkflows() { return Object.assign({}, WORKFLOW_LIBRARY, Workshop.workflows); }

const GHOST = {
  project: { name: GM_getValue('projectName',''), slug: GM_getValue('projectSlug','') },
  workflow: {
    selected: GM_getValue('wfSelected','none'),
    stageIndex: GM_getValue('wfStage',0),
    autoAdvance: GM_getValue('wfAuto',true),
    pauseBetween: GM_getValue('wfPause',false),
    active: false
  },
  persona: {
    selected: (()=>{ const raw=GM_getValue('persona','none'); try { const p=JSON.parse(raw); return Array.isArray(p)?p:[raw]; } catch(_){ return [typeof raw==='string'?raw:'none']; } })(),
    committee: GM_getValue('personaCommittee',false),
    _delivered: false,  // runtime: have this run's directives reached the model yet?
    perTask: GM_getValue('personaPerTask',false),
    finalReview: GM_getValue('personaFinalReview',false),
    _reviewDone: false
  },
  roadmap: {
    steps: JSON.parse(GM_getValue('rmSteps','[]')),
    index: GM_getValue('rmIndex',0),
    captured: GM_getValue('rmCaptured',false),
    synthSent: false
  },
  loop: {
    state: 'IDLE', // IDLE | RUNNING | PAUSED | LIMIT | COMPLETE | ERROR
    payloadMode: GM_getValue('payloadMode','loop'),
    posture: GM_getValue('posture','standard'),
    round: 0,
    maxRounds: GM_getValue('maxRounds',20),
    limitStep: GM_getValue('maxRounds',20), // how many more rounds each "Continue" grants
    needsPayload: true,
    isSending: false,
    timer: null,
    driftEnabled: GM_getValue('driftEnabled',true),
    lastActivity: Date.now(),
    staleTicks: 0,
    lastSignal: 'none',
    lastConfidence: 0,
    lastProgress: null,
    detail: '',
    // At-most-once send transaction. Prompt text is never retained here.
    sendPending: false,
    sendDeadline: 0,
    sendTxn: null,
    originalTask: ''         // first task text of the run, for the reground gate
  },
  signals: {
    customProceed: GM_getValue('customProceed',''),
    customStop: GM_getValue('customStop',''),
    windowSize: GM_getValue('sigWindow',400)
  },
  export: {
    format: GM_getValue('expFormat','markdown'),
    filter: GM_getValue('expFilter','all'),
    includeRoles: GM_getValue('expRoles',true),
    thinking: GM_getValue('expThinking',true),
    customSlug: GM_getValue('expSlug','')
  },
  ui: {
    collapsed: GM_getValue('panelCollapsed',false),
    position: GM_getValue('panelPosition','top-right'),
    tab: 'run',
    soundOn: GM_getValue('soundOn',true),
    notifyOn: GM_getValue('notifyOn',false),
    cfgAdv: GM_getValue('cfgAdv',false),
    unattended: GM_getValue('unattended',false), // relax the focus guard + use a Worker ticker
    explain: false, // runtime-only: tap-ⓘ-then-tap-anything help mode
    helpSec: 'start',
    prevTab: null,
    wsNewPersona: false,
    wsNewWorkflow: false,
    qDraft: (()=>{ try { const a = JSON.parse(GM_getValue('qDraft','[""]')); return Array.isArray(a)&&a.length?a:['']; } catch(_){ return ['']; } })(),
    expAdv: GM_getValue('expAdv',false),
    skinTheme: (v => v==='new' ? 'aurora' : v)(GM_getValue('skinTheme','classic')),
    customSkin: GM_getValue('customSkin',''),
    accentHue: (v => (v===''||v==null) ? NaN : parseInt(v,10))(GM_getValue('accentHue','')),
    runAdv: false,
    showDiag: false,
    showSites: false,
    firstRun: GM_getValue('firstRun',true)
  },
  report: null /* v7.1: latest Reporter trouble report, or null */
};

const _save = (k,v) => GM_setValue(k,v);

/* ═══════════════════════════════════════════════════════════════
   LAYER 3 — DIAGNOSTICS
   ═══════════════════════════════════════════════════════════════ */
const DIAG = {
  adapter: PLAT.label,
  selector: '',
  sendPath: '',
  lastSignal: '',
  lastTail: '',
  probe: '',
  errors: [],
  push(msg) {
    const e = `[${new Date().toISOString().slice(11,19)}] ${msg}`;
    this.errors.unshift(e);
    if (this.errors.length > 15) this.errors.pop();
    console.warn('[GITL]', msg);
    Timeline.record('diag', { msg });
  },
  runProbe() {
    const out = [];
    for (const k of ['input','send','stop','assistant']) {
      let win = '', n = 0;
      for (const s of PLAT[k] || []) {
        try { const m = document.querySelectorAll(s); if (m.length) { win = s; n = m.length; break; } } catch(_){}
      }
      out.push(n ? `✓ ${k}: ${win} (${n})` : `✗ ${k}: NO MATCH`);
    }
    // Fallback tiers (v8.1): learned per-host selectors, then role/meaning heuristics.
    try {
      const lm = (typeof SelectorMemory !== 'undefined') ? SelectorMemory._load()[location.hostname] : null;
      out.push(lm ? `✓ learned: ${Object.entries(lm).map(([k,v]) => k + '=' + v.sel).join(' · ')}` : '— learned: none for this host');
    } catch(_) {}
    try {
      const hi = _heurInput(), hs = _heurSend(hi || null);
      out.push(hi ? `✓ heur input: <${(hi.tagName||'?').toLowerCase()}>` : '✗ heur input: none');
      out.push(hs ? `✓ heur send: <${(hs.tagName||'?').toLowerCase()}> "${String(hs.getAttribute && (hs.getAttribute('aria-label')||hs.textContent)||'').trim().slice(0,30)}"` : '✗ heur send: none');
    } catch(_) {}
    this.probe = out.join('\n');
  }
};

/* ═══════════════════════════════════════════════════════════════
   S2 — SELECTOR DOCTOR + HEALTH SCORING
   Scores platform readiness 0-100. Exposes 🟢🟡🔴 badge.
   Sources: HTML/CSS GPT capability scoring, Software Architect GPT
   ═══════════════════════════════════════════════════════════════ */
function platformHealth() {
  const input = Adapter.peekInput();
  const send  = Adapter.getSendBtn();
  const stop  = _q('gen', PLAT.stop);
  const msgs  = _qAll(PLAT.assistant);
  const canRead   = msgs.length > 0;
  const canInject  = !!input;
  const canSend    = !!send;
  const canExport  = canRead;
  const score = (canRead ? 25 : 0) + (canInject ? 30 : 0) + (canSend ? 30 : 0) + (canExport ? 15 : 0);
  return {
    platform: PLAT.label, score,
    input: canInject, send: canSend, stop: !!stop,
    assistantCount: msgs.length, ready: canInject && canSend,
    badge: score >= 80 ? '🟢' : score >= 40 ? '🟡' : '🔴',
    netActive: GITL_NET.active,
    netStreaming: GITL_NET.streaming(),
    netAge: GITL_NET.capturedAt ? Date.now() - GITL_NET.capturedAt : -1
  };
}

/* ═══════════════════════════════════════════════════════════════
   S3 — PRIVACY-SAFE TIMELINE
   The timeline is useful for sequencing failures, not for retaining chat
   content. It accepts metadata primitives and a small set of enum-like
   strings; selectors, URLs, error messages, prompts, and arbitrary text are
   dropped at the storage boundary.
   ═══════════════════════════════════════════════════════════════ */
const _TL_STRING_KEYS = new Set([
  'code','stage','reason','evidence','path','kind','name','platform',
  'version','signal','state','mode','adapter','ticker'
]);
const _TL_PLATFORMS = new Set([
  'chatgpt','perplexity','gemini','deepseek','copilot',
  'grok','claude','manus','generic'
]);

function _safeTimelineString(key, value) {
  const s = String(value == null ? '' : value).slice(0, 80);
  if (!_TL_STRING_KEYS.has(key)) return '';
  if (/https?:|www\.|[?&][^ ]*=|[a-f0-9]{8}-[a-f0-9-]{20,}/i.test(s)) return '';
  if (key === 'platform') return _TL_PLATFORMS.has(s.toLowerCase()) ? s.toLowerCase() : '';
  return /^[a-z0-9_.:+-]{1,80}$/i.test(s) ? s : '';
}

function _safeTimelineData(data) {
  const out = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'string') {
      const safe = _safeTimelineString(key, value);
      if (safe) out[key] = safe;
    } else if (Array.isArray(value)) {
      out[`${key}Count`] = value.length;
    }
  }
  return out;
}

function _safeTimelineEvent(event) {
  const type = /^[a-z0-9_.:-]{1,64}$/i.test(String(event?.type || ''))
    ? String(event.type) : 'unknown';
  const at = /^\d{4}-\d{2}-\d{2}T/.test(String(event?.at || ''))
    ? String(event.at) : new Date().toISOString();
  const workflow = String(event?.wf || 'none');
  return {
    type,
    data: _safeTimelineData(event?.data),
    platform: _safeTimelineString('platform', event?.platform) || 'generic',
    wf: workflow === 'none' || Object.prototype.hasOwnProperty.call(WORKFLOW_LIBRARY, workflow)
      ? workflow : 'custom',
    at
  };
}

const Timeline = {
  key: 'gitlTimeline',
  _cache: null,
  all() {
    if (this._cache) return this._cache;
    try {
      const raw = JSON.parse(GM_getValue(this.key, '[]'));
      this._cache = Array.isArray(raw) ? raw.map(_safeTimelineEvent) : [];
      /* Rewrite older entries once so previously retained selectors/error
         strings do not linger after upgrading. */
      GM_setValue(this.key, JSON.stringify(this._cache));
    } catch {
      this._cache = [];
    }
    return this._cache;
  },
  record(type, data = {}) {
    const items = this.all();
    items.push(_safeTimelineEvent({
      type,
      data,
      platform: PLAT?.key || 'generic',
      wf: (typeof GHOST !== 'undefined' && GHOST.workflow) ? GHOST.workflow.selected : 'none',
      at: new Date().toISOString()
    }));
    if (items.length > 500) items.splice(0, items.length - 500);
    this._cache = items;
    GM_setValue(this.key, JSON.stringify(items));
  },
  failures() { return this.all().filter(e => e.type === 'failure' || e.type === 'send_fail'); },
  since(ms) { const cutoff = new Date(Date.now() - ms).toISOString(); return this.all().filter(e => e.at > cutoff); }
};

/* ═══════════════════════════════════════════════════════════════
   S3.5 — LOCAL, PRIVACY-SAFE INCIDENT REPORTER
   Failures automatically create a redacted local diagnostic. Nothing is
   uploaded and no GitHub issue body is prefilled. The user can review,
   copy, or download the exact metadata before deciding to report it.
   ═══════════════════════════════════════════════════════════════ */
const ERROR_CATALOG = Object.freeze({
  'BOOT-001': {
    summary: 'Ghost could not complete its critical startup sequence.',
    guidance: 'Reload once. If the banner returns, download this diagnostic and open a bug.'
  },
  'BOOT-002': {
    summary: 'Optional network observation could not start; the panel may still work.',
    guidance: 'Continue manually if needed, then download this diagnostic for a bug report.'
  },
  'COMPOSER-001': {
    summary: 'No unique, usable chat composer was available.',
    guidance: 'Tap inside the site composer, use Re-detect, and report the diagnostic if it persists.'
  },
  'SEND-001': {
    summary: 'No unique reviewed Send control could be safely activated.',
    guidance: 'Review the inserted prompt and use the site Send button manually.'
  },
  'SEND-002': {
    summary: 'A Send attempt occurred but delivery could not be confirmed.',
    guidance: 'Check the conversation before doing anything else. Ghost did not resend.'
  },
  'ADAPTER-001': {
    summary: 'The site adapter could not identify a required capability.',
    guidance: 'Run Re-detect, download the diagnostic, and report the affected site.'
  },
  'MANUAL-001': {
    summary: 'A diagnostic was requested manually.',
    guidance: 'Review the contents below before copying, downloading, or opening a bug.'
  },
  'UNKNOWN-001': {
    summary: 'An unexpected runtime failure was detected.',
    guidance: 'Pause the run, review the page, and download this diagnostic.'
  }
});

const ERROR_ALIASES = Object.freeze({
  probe_fail: 'ADAPTER-001',
  manual: 'MANUAL-001'
});

function _browserSummary() {
  const ua = String((typeof navigator !== 'undefined' && navigator.userAgent) || '');
  let family = 'Other', major = null;
  const matchers = [
    ['Edge', /Edg\/(\d+)/],
    ['Firefox', /Firefox\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+).+Safari/]
  ];
  for (const [name, rx] of matchers) {
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

function _ageBucket(ts) {
  if (!ts) return 'none';
  const age = Math.max(0, Date.now() - ts);
  if (age < 2000) return '<2s';
  if (age < 10000) return '2-10s';
  if (age < 60000) return '10-60s';
  return '>60s';
}

const Reporter = {
  last: null,
  _seen: new Map(),

  code(kind) {
    const candidate = ERROR_ALIASES[kind] || String(kind || '').toUpperCase();
    return ERROR_CATALOG[candidate] ? candidate : 'UNKNOWN-001';
  },

  envelope(kind) {
    const code = this.code(kind);
    const catalog = ERROR_CATALOG[code];
    const L = (typeof GHOST !== 'undefined') ? GHOST.loop : {};
    const h = (typeof platformHealth === 'function') ? platformHealth() : {};
    const p = L.lastProgress;
    const recent = (typeof Timeline !== 'undefined')
      ? Timeline.since(120000).slice(-16).map(_safeTimelineEvent) : [];
    let learnedKinds = [];
    try {
      const lm = SelectorMemory._load()[location.hostname] || {};
      learnedKinds = Object.keys(lm).filter(k => k !== 'send').sort().slice(0, 8);
    } catch(_) {}
    const send = L.sendTxn || null;
    return {
      schema: 'gitl.diagnostic.v1',
      code,
      summary: catalog.summary,
      guidance: catalog.guidance,
      createdAt: new Date().toISOString(),
      app: {
        version: VER,
        platform: /^[a-z0-9_-]{1,32}$/i.test(String(PLAT?.key || ''))
          ? PLAT.key : 'generic',
        reviewedAdapter: !!PLAT?.reviewed
      },
      runtime: {
        state: String(L.state || 'unknown'),
        round: Number(L.round) || 0,
        maxRounds: Number(L.maxRounds) || 0,
        signal: String(L.lastSignal || 'none'),
        confidence: Number(L.lastConfidence) || 0,
        progress: p ? { step: Number(p.step) || 0, total: Number(p.total) || 0 } : null,
        send: send ? {
          state: String(send.state || 'unknown'),
          path: String(send.path || 'unknown'),
          attemptedAge: _ageBucket(send.attemptedAt)
        } : null,
        unattended: !!unattendedOn(),
        ticker: String(Ticker.mode || 'unknown'),
        degradedPhases: Array.isArray(GHOST?._degraded)
          ? GHOST._degraded.filter(x => /^[a-z0-9-]{1,32}$/i.test(String(x))).slice(0, 12) : []
      },
      capabilities: {
        input: !!h.input,
        send: !!h.send,
        stop: !!h.stop,
        canRead: Number(h.assistantCount) > 0,
        assistantCount: Number(h.assistantCount) || 0,
        learnedKinds,
        heuristicInputCandidate: !!(() => { try { return _heurInput(); } catch(_) { return false; } })(),
        heuristicSendCandidate: !!(() => { try { return Adapter.getSendCandidate(); } catch(_) { return false; } })()
      },
      network: {
        observerInstalled: !!h.netActive,
        streaming: !!h.netStreaming,
        trustedPulseAge: _ageBucket(GITL_NET.lastPulseT),
        streamOpen: GITL_NET._open > 0
      },
      environment: {
        ..._browserSummary(),
        focused: typeof document !== 'undefined' ? !!document.hasFocus() : false,
        hidden: typeof document !== 'undefined' ? !!document.hidden : false
      },
      timeline: recent
    };
  },

  human(envelope) {
    const d = envelope;
    const lines = [];
    lines.push(`### Ghost in the Loop — auto report`);
    lines.push('');
    lines.push(`**Error code:** ${d.code}`);
    lines.push(`**Summary:** ${d.summary}`);
    lines.push(`**Suggested next step:** ${d.guidance}`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| Version | ${d.app.version} |`);
    lines.push(`| Platform adapter | ${d.app.platform} (${d.app.reviewedAdapter ? 'reviewed' : 'manual-send only'}) |`);
    lines.push(`| Loop | ${d.runtime.state} · round ${d.runtime.round}/${d.runtime.maxRounds} |`);
    lines.push(`| Capabilities | input:${d.capabilities.input} send:${d.capabilities.send} stop:${d.capabilities.stop} read:${d.capabilities.canRead} |`);
    lines.push(`| Learned locator kinds | ${d.capabilities.learnedKinds.join(', ') || 'none'} (values excluded) |`);
    lines.push(`| Network observer | ${d.network.observerInstalled ? 'active' : 'off'} · trusted pulse:${d.network.trustedPulseAge} |`);
    lines.push(`| Browser | ${d.environment.family}${d.environment.major ? ' ' + d.environment.major : ''} · ${d.environment.os}${d.environment.mobile ? ' · mobile' : ''} |`);
    lines.push(`| Focus | focused:${d.environment.focused} hidden:${d.environment.hidden} |`);
    lines.push(`| When | ${d.createdAt} |`);
    lines.push('');
    lines.push(`_Privacy: this diagnostic excludes prompts, chat/output text, URLs, conversation IDs, selector strings, raw user-agent text, credentials, and stack traces._`);
    if (d.timeline.length) {
      lines.push('');
      lines.push(`**Metadata timeline (last 2 min):**`);
      lines.push('```json');
      lines.push(JSON.stringify(d.timeline, null, 2));
      lines.push('```');
    }
    return lines.join('\n');
  },

  build(kind) {
    return this.human(this.envelope(kind));
  },

  capture(kind) {
    const code = this.code(kind);
    const seenAt = this._seen.get(code) || 0;
    this._seen.set(code, Date.now());
    if (this.last?.kind === code && Date.now() - seenAt < 600000) return this.last;
    const envelope = this.envelope(code);
    const text = this.human(envelope);
    this.last = {
      kind: code,
      detail: envelope.summary,
      envelope,
      text,
      at: Date.now()
    };
    if (typeof GHOST !== 'undefined') GHOST.report = this.last;
    try { GM_setValue('lastDiagnostic', JSON.stringify(envelope)); } catch(_) {}
    try { if (typeof renderReportBadge === 'function') renderReportBadge(); } catch(_){}
    return this.last;
  },

  copy() {
    const t = this.last?.text || this.build('MANUAL-001');
    try {
      if (typeof GM_setClipboard === 'function') { GM_setClipboard(t, { type:'text', mimetype:'text/plain' }); return Promise.resolve(true); }
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t).then(()=>true).catch(()=>false);
    } catch(_){}
    return Promise.resolve(false);
  },

  download() {
    const r = this.last || this.capture('MANUAL-001');
    const day = new Date(r.envelope.createdAt).toISOString().slice(0, 10);
    downloadText(
      JSON.stringify(r.envelope, null, 2),
      `gitl-diagnostic-${r.kind.toLowerCase()}-${day}.json`,
      'application/json'
    );
    Timeline.record('report_downloaded', { code: r.kind });
    return true;
  },

  issueURL() {
    const r = this.last || this.capture('MANUAL-001');
    const title = `[diagnostic] ${r.kind} on ${r.envelope.app.platform} (v${VER})`;
    /* Title only: opening GitHub never transmits the diagnostic. The user
       chooses whether to paste the already-reviewed redacted report. */
    return `https://github.com/${REPORT_REPO}/issues/new?title=${encodeURIComponent(title)}`;
  },

  openIssue() {
    try {
      const r = this.last || this.capture('MANUAL-001');
      Timeline.record('report_issue_opened', { code: r.kind });
      window.open(this.issueURL(), '_blank', 'noopener');
      return true;
    } catch(_) {
      return false;
    }
  }
};

/* ═══════════════════════════════════════════════════════════════
   S4.5 — GHOST BUS (BroadcastChannel cross-tab relay)
   Enables cooperative multi-tab handoff. User-initiated only —
   never auto-executes received prompts (security).
   Sources: ChatGPT Export 4, Gemini Phase 5 (with security fix)
   ═══════════════════════════════════════════════════════════════ */
const GhostBus = {
  channel: null,
  peers: new Map(),

  init() {
    try {
      this.channel = new BroadcastChannel('gitl.bus.v1');
      this.channel.onmessage = (e) => this._onMessage(e.data);
      this.announce();
    } catch(err) {
      console.warn('[GITL] BroadcastChannel unavailable:', err);
    }
  },

  announce() {
    this._send('discover', { platform: PLAT?.label, url: location.href });
  },

  sendHandoff(text) {
    this._send('handoff', { text, from: PLAT?.label, url: location.href });
    Timeline.record('bus_handoff_sent', { to: 'broadcast', chars: text.length });
  },

  _send(type, payload) {
    if (!this.channel) return;
    this.channel.postMessage({
      type, payload,
      tabId: GITL_TAB_ID,
      at: Date.now()
    });
  },

  _onMessage(msg) {
    if (msg.tabId === GITL_TAB_ID) return; // ignore self
    if (msg.type === 'discover') {
      this.peers.set(msg.tabId, { platform: msg.payload.platform, url: msg.payload.url, seen: Date.now() });
    }
    if (msg.type === 'handoff') {
      // Store received handoff for user to manually apply — NOT auto-injected
      GM_setValue('pendingHandoff', JSON.stringify(msg.payload));
      Timeline.record('bus_handoff_received', { from: msg.payload.from, chars: msg.payload.text?.length });
      if (typeof render === 'function') render();
    }
  },

  getPendingHandoff() {
    try { return JSON.parse(GM_getValue('pendingHandoff', 'null')); } catch { return null; }
  },

  clearPendingHandoff() {
    GM_setValue('pendingHandoff', '');
  }
};

/* ═══════════════════════════════════════════════════════════════
   LAYER 4 — SIGNAL ENGINE (pure logic, no DOM)
   Halt ALWAYS wins. Confidence-scored. Unique sigils first.
   ═══════════════════════════════════════════════════════════════ */
const FUZZY_PROCEED = ['to proceed','shall i continue','should i continue','want me to continue',
  'ready for the next',"type 'continue'",'type "continue"','type continue','say continue',
  'continue?','next section?','go on?','ready to proceed','awaiting your'];

const FUZZY_HALT = ['task complete','all sections complete','all parts complete','that concludes',
  'this concludes','fully complete','everything is complete','all done','sequence complete',
  'final section complete','session complete'];

function parseProgress(text) {
  const m = text.match(/\[(?:Step|Batch|Stage)\s*(\d+)\s*(?:of|\/)\s*(\d+)\](?:\s*[—–\-]\s*(.+))?/i);
  return m ? { step: +m[1], total: +m[2], desc: (m[3]||'').trim() } : null;
}

function detectSignal(fullText) {
  if (!fullText || fullText.length < MIN_RESPONSE_LEN) return { signal: 'short', confidence: 0, progress: null };

  const tail = fullText.slice(-GHOST.signals.windowSize);
  const low = tail.toLowerCase();
  const cStop = GHOST.signals.customStop.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const cProc = GHOST.signals.customProceed.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);

  let hScore = 0, pScore = 0;
  const progress = parseProgress(tail);

  // Unique sigils (highest weight)
  if (tail.includes(SIGIL_HALT))     hScore += 4;
  if (tail.includes(SIGIL_PROCEED))  pScore += 4;
  // Legacy keywords — only fire if sigil NOT already present (prevents substring double-count:
  // LEGACY_PROCEED='PROCEED' is a substring of '[[GITL::PROCEED]]' which would otherwise
  // add 3 extra points to pScore when sigil fires, defeating the halt-first invariant)
  if (!tail.includes(SIGIL_HALT)    && tail.includes(LEGACY_HALT))    hScore += 3;
  if (!tail.includes(SIGIL_PROCEED) && tail.includes(LEGACY_PROCEED)) pScore += 3;
  // Fuzzy
  if (FUZZY_HALT.some(p => low.includes(p)))    hScore += 2;
  if (FUZZY_PROCEED.some(p => low.includes(p))) pScore += 2;
  // Custom
  if (cStop.some(p => low.includes(p)))  hScore += 2;
  if (cProc.some(p => low.includes(p)))  pScore += 2;
  // Progress bar
  if (progress && progress.step < progress.total) pScore += 2;
  if (progress && progress.step >= progress.total) hScore += 1;

  DIAG.lastSignal = `h:${hScore} p:${pScore}`;
  DIAG.lastTail = tail.slice(-80);

  // HALT-FIRST: halt wins ties at threshold
  if (hScore >= 3 && hScore >= pScore) return { signal: 'halt', confidence: hScore, progress };
  if (pScore >= 3) return { signal: 'proceed', confidence: pScore, progress };
  return { signal: 'none', confidence: Math.max(hScore, pScore), progress };
}

/* ═══════════════════════════════════════════════════════════════
   PAYLOADS
   ═══════════════════════════════════════════════════════════════ */
const PAYLOADS = {
  loop: {
    label: '▶ Loop',
    hint: 'Step-by-step execution. You set the task.',
    inject: `\n\n---\n[Ghost in the Loop v${VER} — Loop Mode]\nExecute this task step by step. One focused section per response.\n\nAt the end of every response, print:\n████░░░░ [Step X of Y] — one line describing what was completed\n\nThen on a new line:\n- More steps remain → [[GITL::PROCEED]]\n- Fully complete → [[GITL::HALT]]\n\nDo not skip the progress line. Make reasonable assumptions.\n---`,
    preview: '▶ LOOP — Step-by-step execution.\nEnd each response with:\n████░░░░ [Step X of Y]\n[[GITL::PROCEED]] or [[GITL::HALT]]'
  },
  think: {
    label: '🧠 Think First',
    hint: 'AI plans batches at ~80% capacity, then executes.',
    inject: `\n\n---\n[Ghost in the Loop v${VER} — Think First Mode]\nBefore doing any work, read this task and plan how to complete it in focused batches.\n\nKeep each batch to ~80% of your comfortable response length.\n\nYour FIRST response: plan only — list batches briefly, end with [[GITL::PROCEED]]\n\nEach subsequent response: complete one batch, end with:\n████░░░░ [Batch X of Y] — what this batch covered\nThen: [[GITL::PROCEED]] or [[GITL::HALT]]\n\nThe script sends "Continue" automatically.\n---`,
    preview: '🧠 THINK FIRST — AI self-plans.\nResponse 1: plan + batch count.\nEach batch ends with:\n████░░░░ [Batch X of Y]\n[[GITL::PROCEED]] or [[GITL::HALT]]'
  },
  roadmap: {
    label: '🗺 Roadmap',
    hint: 'AI researches → builds a roadmap → Ghost runs every step. Walk away.',
    inject: `\n\n---\n[Ghost in the Loop v${VER} — Roadmap Autopilot]\nPhase 1 (this response): RESEARCH ONLY. Analyze this task deeply — context, constraints, unknowns, best approach. Do no execution work yet.\nThen output a machine-readable roadmap in EXACTLY this format:\n\n[[GITL::ROADMAP]]\n1. first concrete step\n2. second concrete step\n3. ...\n\n(3–12 steps, each one self-contained and executable in a single response)\nEnd with [[GITL::PROCEED]]\n\nPhase 2: The script will then send you each step as its own prompt. Complete each step fully, end each with [[GITL::PROCEED]]. A final synthesis prompt will close the run.\n---`,
    preview: '🗺 ROADMAP — Fire & forget.\nResponse 1: research + numbered\nroadmap under [[GITL::ROADMAP]].\nGhost then auto-runs every step\n+ final synthesis. [[GITL::HALT]] ends.'
  }
};

const RESUME_TEXT = `Continue.\n\n[Ghost reminder: end each response with ████░░░░ [Step X of Y] then [[GITL::PROCEED]] if more remain, or [[GITL::HALT]] when fully done.]`;

/* ── Thinking postures (v7.1) ─────────────────────────────────────
   A user-declared expansion clause appended to whichever mode is running
   (Loop / Think / Roadmap). The model never guesses the posture — the user
   picks it up front, like a reasoning dial. Wording synthesised from the
   uploaded multi-model research relay (OpenAI reasoning + Anthropic context
   guidance, ReAct/Reflexion/Plan-and-Act for mid-run replanning, Self-Refine
   for the end-of-run coverage check, and practitioner anti-runaway guardrails:
   justification gate, minimality rule, ceiling stop-condition). The three
   clauses differ ONLY in how/when expansion is permitted. */
const POSTURES = {
  standard: {
    label: 'Locked',
    short: 'Exact plan',
    desc: 'Locked to the plan it declares. No added steps. Most predictable.',
    clause: `\n\n[Posture: STANDARD — locked plan]\nComplete exactly the steps you declared. Do not add, remove, merge, or reorder steps. If you discover the plan is wrong, finish what you can and report it at the end rather than expanding. Keep your declared Y fixed for the whole run.`
  },
  evolving: {
    label: 'Adaptive',
    short: 'Grows mid-run',
    desc: 'The plan may GROW while working — the AI adds steps when a real blocker or gap forces it, justifying each one. (Formerly "Evolving".)',
    clause: `\n\n[Posture: EVOLVING — adaptive mid-run replanning]\nExecute your declared steps one at a time. You MAY add a step during the run ONLY IF a concrete blocker, a missing prerequisite, or a material gap is visible from the work already done and continuing without it would likely fail the original goal.\nBefore adding a step, print on their own lines:\n  Why needed: <one sentence>\n  Why existing steps are insufficient: <one sentence>\nIf that justification is weak, do NOT add the step. Prefer tightening or replacing a future step over adding to the total. Any added step must stay strictly within the ORIGINAL goal — do not expand scope into adjacent topics. Update Y when you legitimately add a step, and keep printing ████░░░░ [Step X of Y].`
  },
  extended: {
    label: 'Audit',
    short: 'Plan + final gap check',
    desc: 'Runs the plan locked, THEN performs one end-of-run audit and fills only material gaps. (Formerly "Extended".)',
    clause: `\n\n[Posture: EXTENDED — bounded end-of-run review]\nExecute your declared steps exactly, with no mid-run additions. AFTER the last declared step, perform ONE coverage check against the original goal, its constraints, and the promised deliverable. List only material gaps, errors, or unanswered sub-questions — for each: the gap, why it matters, and the smallest step that closes it. Then complete only those high-value follow-ups. If no material gaps remain, print "No material gaps found" and HALT. Do not invent "nice to have" extras.`
  }
};
// Shared ceiling stop-condition appended to the two expanding postures.
const POSTURE_CEILING = `\nHard ceiling: never exceed the drift-guard limit. If you reach it, STOP and report the single highest-value unresolved gap instead of compressing in more work.`;

/* ── Roadmap Autopilot ───────────────────────────────────────── */
const SIGIL_ROADMAP = '[[GITL::ROADMAP]]';

function resetRoadmap() {
  GHOST.roadmap = { steps: [], index: 0, captured: false, synthSent: false };
  _save('rmSteps','[]'); _save('rmIndex',0); _save('rmCaptured',false);
}

function parseRoadmap(fullText) {
  const at = fullText.lastIndexOf(SIGIL_ROADMAP);
  if (at < 0) return false;
  const after = fullText.slice(at + SIGIL_ROADMAP.length);
  const steps = [];
  for (const line of after.split('\n')) {
    if (line.includes(SIGIL_PROCEED) || line.includes(SIGIL_HALT)) break;
    const m = line.match(/^\s*(?:\d+[.)]\s+|[-*]\s+)(.+)$/);
    if (m && m[1].trim().length > 3) steps.push(m[1].trim());
    if (steps.length >= 30) break;
  }
  if (steps.length < 2) return false;
  GHOST.roadmap.steps = steps; GHOST.roadmap.index = 0;
  GHOST.roadmap.captured = true; GHOST.roadmap.synthSent = false;
  _save('rmSteps', JSON.stringify(steps)); _save('rmIndex', 0); _save('rmCaptured', true);
  return true;
}

function sendRoadmapStep() {
  const R = GHOST.roadmap, i = R.index, n = R.steps.length;
  GHOST.loop.detail = `🗺 Step ${i+1}/${n}`;
  const personaClause = GHOST.persona.perTask && resolvePersonaInject() ? `\n\n[Active committee — maintain all assigned perspectives for this step]\n${resolvePersonaInject()}` : '';
  engineSend(`Continue.\n\n[Ghost roadmap — step ${i+1} of ${n}]\n${R.steps[i]}\n\nComplete this step fully and concretely. Deliverable output only, no fluff. End with [[GITL::PROCEED]] when this step is done — or [[GITL::HALT]] only if the ENTIRE roadmap is genuinely finished.${personaClause}`, false)
    .then(ok => { if (ok) { R.index = i + 1; _save('rmIndex', R.index); render(); } });
}

function sendRoadmapSynthesis() {
  GHOST.loop.detail = '🗺 Final synthesis';
  engineSend(`Continue.\n\n[Ghost roadmap — final synthesis]\nAll roadmap steps are complete. Compile the final deliverable: merge every step's output into one clean, complete, ready-to-use result. No recap of process, no fluff. End with [[GITL::HALT]].`, false)
    .then(ok => { GHOST.roadmap.synthSent = !!ok; render(); });
}

/* ── Walk-away notifications ─────────────────────────────────── */
function notify(body) {
  if (!GHOST.ui.notifyOn) return;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('👻 Ghost in the Loop', { body });
    }
  } catch(_){}
}

/* ── Auto-probe on adapter failure ───────────────────────────── */
function pauseWithProbe(reason) {
  try { DIAG.runProbe(); GHOST.ui.showDiag = true; } catch(_){}
  // Avoid double-reporting if a richer report was just captured (e.g. send_unconfirmed).
  try { if (!(Reporter.last && Date.now() - Reporter.last.at < 2000)) Reporter.capture('probe_fail', reason); } catch(_){}
  enginePause(reason + ' — probe ran, see ⚙ Diagnostics');
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 5 — LOOP ENGINE (state transitions, no DOM)
   ═══════════════════════════════════════════════════════════════ */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randomDelay(round) {
  // Adaptive: short on round 1 (planning), normal 8–15s on execution rounds
  if (round <= 1) return 2000;
  return (8 + Math.random() * 7) * 1000;
}

let _pendingSendResolve = null;

function _composerText(el) {
  return String((el && (el.value || el.textContent)) || '').trim();
}

function _settleSendPromise(ok) {
  const resolve = _pendingSendResolve;
  _pendingSendResolve = null;
  if (resolve) {
    try { resolve(!!ok); } catch(_) {}
  }
}

function _beginSendAttempt(path, input) {
  const L = GHOST.loop;
  const lastText = Adapter.getLastText() || '';
  const txn = {
    id: crypto.randomUUID?.() || `cmd-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    state: 'dispatching',
    path: String(path || 'reviewed-button'),
    attemptedAt: Date.now(),
    assistantCount: _qAll(PLAT.assistant).length,
    assistantTextLength: lastText.length,
    trustedPulseAt: GITL_NET.lastPulseT || 0,
    composerHadText: _composerText(input).length > 0
  };
  L.sendTxn = txn;
  L.sendPending = true;
  L.sendDeadline = Date.now() + SEND_CONFIRM_MS;
  GITL_NET.expectUntil = Date.now() + SEND_CONFIRM_MS;
  Timeline.record('send_attempted', {
    command: txn.id.slice(0, 8),
    round: L.round + 1,
    path: txn.path
  });
  return new Promise(resolve => { _pendingSendResolve = resolve; });
}

function _sendEvidence() {
  const L = GHOST.loop;
  const txn = L.sendTxn;
  if (!txn || txn.state !== 'dispatching') return { confirmed: false, evidence: 'none' };

  const assistantCount = _qAll(PLAT.assistant).length;
  const assistantTextLength = (Adapter.getLastText() || '').length;
  if (assistantCount > txn.assistantCount || assistantTextLength > txn.assistantTextLength + 4) {
    return { confirmed: true, evidence: 'assistant-transition' };
  }

  const input = Adapter.peekInput();
  const composerCleared = txn.composerHadText && !!input && _composerText(input).length < 4;
  const stopVisible = !!_q('gen', PLAT.stop);
  const trustedNetwork = GITL_NET.lastPulseT > txn.trustedPulseAt
    && Date.now() - GITL_NET.lastPulseT < 5000;
  if (composerCleared && stopVisible) return { confirmed: true, evidence: 'composer+stop' };
  if (composerCleared && trustedNetwork) return { confirmed: true, evidence: 'composer+trusted-network' };
  return { confirmed: false, evidence: 'insufficient' };
}

async function engineSend(text, skipDelay) {
  const L = GHOST.loop;
  if (L.isSending) { DIAG.push('Send blocked — lock active'); return false; }
  const safe = assertInteractionSafe();
  if (!safe.ok) { DIAG.push(`Send blocked — ${safe.reason}`); L.detail = `⚠ ${safe.reason}`; render(); return false; }
  L.isSending = true;
  try {
    if (!skipDelay) {
      const delay = randomDelay(L.round);
      L.detail = `Waiting ${(delay/1000).toFixed(0)}s…`;
      render();
      await sleep(delay);
    }
    if (L.state !== 'RUNNING') return false;
    if (!await verifyTabLease()) {
      L.detail = '⚠ Another tab owns this conversation';
      Timeline.record('send_blocked', { reason: 'tab-lease-lost' });
      enginePause('Another tab owns this conversation');
      return false;
    }
    if (Adapter.isGenerating()) {
      L.detail = '⚠ Reply is still generating';
      Timeline.record('send_blocked', { reason: 'reply-generating' });
      render();
      return false;
    }
    const input = Adapter.getInput();
    if (!input) {
      Reporter.capture('COMPOSER-001', 'No uniquely identifiable chat composer was available.');
      pauseWithProbe('No safe chat composer found');
      return false;
    }
    if (!Adapter.injectText(input, text)) {
      Reporter.capture('COMPOSER-001', 'The reviewed composer rejected text injection.');
      pauseWithProbe('Chat composer rejected the prompt');
      return false;
    }
    await sleep(500);
    const btn = Adapter.getSendBtn();
    if (!btn) {
      Reporter.capture('SEND-001', PLAT?.reviewed
        ? 'No unique reviewed Send control was available.'
        : 'This site has no reviewed automation adapter; use manual Send.');
      pauseWithProbe('No safe Send control — prompt left for manual review');
      return false;
    }
    DIAG.sendPath = 'reviewed-button';
    const completion = _beginSendAttempt(DIAG.sendPath, input);
    try {
      btn.click();
    } catch(_) {
      L.sendPending = false;
      L.sendDeadline = 0;
      if (L.sendTxn) L.sendTxn.state = 'failed';
      Timeline.record('send_failed', { code: 'SEND-001', stage: 'dispatch' });
      Reporter.capture('SEND-001', 'The reviewed Send control could not be activated.');
      _settleSendPromise(false);
      enginePause('Send failed before dispatch');
      return false;
    }
    return await completion;
  } catch(e) {
    DIAG.push('Send error');
    if (L.sendPending) {
      L.sendPending = false;
      if (L.sendTxn) L.sendTxn.state = 'uncertain';
    }
    _settleSendPromise(false);
    Timeline.record('send_failed', { code: 'SEND-002', stage: 'exception' });
    Reporter.capture('SEND-002', 'Send could not be confirmed after an internal error.');
    enginePause('Send failed');
    return false;
  } finally {
    L.isSending = false;
  }
}

/* Commit is the only transition allowed to advance state. */
function _confirmSend(evidence) {
  const L = GHOST.loop;
  const txn = L.sendTxn;
  if (!L.sendPending || !txn || txn.state !== 'dispatching') return false;
  txn.state = 'committed';
  txn.evidence = evidence || 'independent-observation';
  txn.committedAt = Date.now();
  L.sendPending = false;
  L.sendDeadline = 0;
  L.round++;
  L.lastActivity = Date.now();
  L.staleTicks = 0;
  L.detail = '';
  try { GM_setValue('sendTier:' + location.hostname, txn.path); } catch(_) {}
  Timeline.record('send_confirmed', {
    command: txn.id.slice(0, 8),
    round: L.round,
    path: txn.path,
    evidence: txn.evidence
  });
  _settleSendPromise(true);
  render();
  return true;
}

function _markSendUncertain() {
  const L = GHOST.loop;
  const txn = L.sendTxn;
  if (!L.sendPending || !txn) return false;
  txn.state = 'uncertain';
  txn.uncertainAt = Date.now();
  L.sendPending = false;
  L.sendDeadline = 0;
  Timeline.record('send_uncertain', {
    code: 'SEND-002',
    command: txn.id.slice(0, 8),
    round: L.round
  });
  Reporter.capture('SEND-002', 'Send could not be confirmed. Nothing was resent.');
  _settleSendPromise(false);
  try { DIAG.runProbe(); GHOST.ui.showDiag = true; } catch(_) {}
  enginePause('Send uncertain — review the conversation before retrying');
  return true;
}

/* Human reconciliation is the only way out of an ambiguous dispatch.
   This never re-clicks Send. */
function reconcileUncertainSend(delivered) {
  const L = GHOST.loop;
  const txn = L.sendTxn;
  if (!txn || txn.state !== 'uncertain') return false;
  if (!delivered) {
    txn.state = 'failed';
    txn.reconciledAt = Date.now();
    L.detail = 'Prompt left in the composer — use the site’s Send button manually.';
    Timeline.record('send_reconciled', { command: txn.id.slice(0, 8), delivered: false });
    render();
    return true;
  }
  txn.state = 'committed';
  txn.evidence = 'human-confirmed';
  txn.committedAt = Date.now();
  L.round++;
  L.lastActivity = Date.now();
  L.staleTicks = 0;
  L.state = 'RUNNING';
  L.detail = '✓ Delivery confirmed by you';
  Timeline.record('send_reconciled', {
    command: txn.id.slice(0, 8),
    delivered: true,
    round: L.round
  });
  L.timer = Ticker.start(engineTick, 2500);
  render();
  return true;
}

function engineHalt(reason) {
  const L = GHOST.loop;
  L.state = 'COMPLETE'; L.detail = reason; L.needsPayload = true;
  Ticker.stop(); L.timer = null;
  Timeline.record('halt', { reason, round: L.round });
  render();
  if (GHOST.ui.soundOn) playBeep();
  notify(reason);
}

function enginePause(reason) {
  const L = GHOST.loop;
  let interruptedDispatch = false;
  if (L.sendPending) {
    L.sendPending = false;
    L.sendDeadline = 0;
    if (L.sendTxn && L.sendTxn.state === 'dispatching') {
      L.sendTxn.state = 'uncertain';
      L.sendTxn.uncertainAt = Date.now();
      interruptedDispatch = true;
    }
    _settleSendPromise(false);
  }
  L.state = 'PAUSED'; L.detail = reason;
  Ticker.stop(); L.timer = null;
  Timeline.record('pause', { reason, round: L.round });
  if (interruptedDispatch) {
    Timeline.record('send_uncertain', { code: 'SEND-002', round: L.round });
    Reporter.capture('SEND-002');
  }
  render();
  notify('⏸ ' + reason);
}

/* Soft round-limit checkpoint (v7.1): the AI hasn't HALTed but we've
   hit the auto-continue cap. Pause in a dedicated LIMIT state and invite
   one-tap continuation rather than stranding the run. */
function engineLimit() {
  const L = GHOST.loop;
  L.state = 'LIMIT';
  L.detail = `Hit ${L.maxRounds} auto-continues — chat's still going. ▶ to run ${L.limitStep} more.`;
  L.sendPending = false;
  Ticker.stop(); L.timer = null;
  Timeline.record('limit', { round: L.round, cap: L.maxRounds });
  render();
  if (GHOST.ui.soundOn) playBeep();
  notify(`▶ ${L.maxRounds} continues reached — tap to keep going`);
}

/* Extends the cap by one increment and resumes. Called by ▶ from either
   the expanded panel or the collapsed mini-bar when in LIMIT state. */
function extendLimit() {
  const L = GHOST.loop;
  L.maxRounds += (L.limitStep || 20);
  L.state = 'RUNNING'; L.detail = ''; L.lastActivity = Date.now();
  Timeline.record('limit_extended', { newCap: L.maxRounds, round: L.round });
  L.timer = Ticker.start(engineTick, 2500);
  render();
  engineTick();
}

/* Reground (v7.1): at the drift-guard ceiling, instead of blindly continuing,
   re-anchor the AI to the task it started on. Sends a grounding command that
   restates the original goal and asks the model to confirm it's still on-task
   (or correct course) before proceeding. Extends the cap so it can run on. */
function regroundLoop() {
  const L = GHOST.loop;
  const task = (L.originalTask || '').trim();
  const anchor = task
    ? `\n\nThe ORIGINAL task you were given was:\n"""\n${task}\n"""\n`
    : '\n';
  const cmd = `[Ghost reground — drift check]\nYou have run for many steps. Before continuing, re-anchor to the original goal.${anchor}
In 2–3 lines: (1) state what the original task was, (2) confirm whether your recent work is still directly serving it or has drifted, (3) if drifted, correct course now.
Then continue the task. End with ████ [Step X of Y] and [[GITL::PROCEED]] if work remains, or [[GITL::HALT]] if the original task is genuinely complete.`;
  L.maxRounds += (L.limitStep || 20);
  L.state = 'RUNNING'; L.detail = '⊕ Regrounding to original task…'; L.lastActivity = Date.now();
  Timeline.record('reground', { round: L.round, hadTask: !!task });
  L.timer = Ticker.start(engineTick, 2500);
  render();
  engineSend(cmd, true);
}

function engineTick() {
  const L = GHOST.loop;
  if (L.state !== 'RUNNING') return;

  // ── At-most-once send observation ─────────────────────────────
  if (L.sendPending) {
    const observed = _sendEvidence();
    if (observed.confirmed) {
      _confirmSend(observed.evidence);
      L.lastActivity = Date.now();
    } else if (Date.now() >= L.sendDeadline) {
      _markSendUncertain();
      return;
    } else {
      // Do not parse stale output or dispatch another command while the
      // current attempt is unresolved.
      return;
    }
  }

  // Watchdog — 90s soft, 180s hard
  const idle = Date.now() - L.lastActivity;
  if (idle > 180000) { enginePause('Watchdog: no activity 3min'); return; }
  if (idle > 90000) { L.detail = '⚠ Watchdog: 90s idle'; render(); }

  // Round limit — soft checkpoint, not a hard stop. The cap exists to
  // catch runaway loops, so we PAUSE and ASK rather than strand the user
  // mid-task (e.g. a chat that legitimately runs to 24 with cap=20).
  // Skipped entirely if drift guard is toggled off.
  if (GHOST.loop.driftEnabled && L.round >= L.maxRounds) { engineLimit(); return; }

  // Still generating
  if (Adapter.isGenerating()) { L.lastActivity = Date.now(); return; }

  // Native continue button
  if (Adapter.clickContinue()) { L.lastActivity = Date.now(); return; }

  // Read output
  const text = Adapter.getLastText();
  if (!text) {
    /* v8.1.2 field report (Perplexity Deep Research): this branch fires
       before the FIRST assistant DOM node exists at all — during a long
       silent "thinking" phase there is no text to read yet, but net traffic
       or a stop button proves the model is working. The later no-signal
       branch already got this isGenerating() witness + per-platform budget
       in d7; this earlier branch was missed, so slow-starting platforms
       could still pause ~12s after a perfectly good send. */
    if (Adapter.isGenerating()) { L.staleTicks = 0; L.detail = '🧠 Model is still working…'; render(); return; }
    L.staleTicks++;
    const staleLimit = (PLAT && PLAT.staleTicks) || 5;
    if (L.staleTicks >= staleLimit) pauseWithProbe('No output detected');
    return;
  }

  // Detect signal
  const result = detectSignal(text);
  L.lastSignal = result.signal;
  L.lastConfidence = result.confidence;
  if (result.progress) L.lastProgress = result.progress;

  if (result.signal === 'short') { L.staleTicks++; if (L.staleTicks >= 3) enginePause('Response too short — review output'); return; }

  if (result.signal === 'halt') {
    L.staleTicks = 0;
    L.noSigilStreak = 0; L._nudgedTail = '';
    // Workflow auto-advance
    if (GHOST.workflow.active && GHOST.workflow.autoAdvance) {
      const wf = allWorkflows()[GHOST.workflow.selected] || WORKFLOW_LIBRARY.none;
      const next = wf.stages[GHOST.workflow.stageIndex];
      if (next) {
        if (GHOST.workflow.pauseBetween) { enginePause(`Stage ${GHOST.workflow.stageIndex+1} complete — next queued`); return; }
        L.detail = `Advancing workflow stage ${GHOST.workflow.stageIndex+1}…`;
        engineSend(`Continue.\n\n[Ghost workflow — stage ${GHOST.workflow.stageIndex+1} of ${wf.stages.length}]\n${next}\n\nUse the same [[GITL::PROCEED]] / [[GITL::HALT]] protocol.`, false).then(ok => {
          if (ok) { GHOST.workflow.stageIndex++; _save('wfStage', GHOST.workflow.stageIndex); render(); }
          else { enginePause('Workflow advance failed'); }
        });
        return;
      }
      GHOST.workflow.active = false;
      GHOST.workflow.stageIndex = 0; _save('wfStage', 0);
    }
    if (L.payloadMode === 'roadmap' && GHOST.roadmap.captured) {
      // Final committee review on roadmap completion
      if (GHOST.persona.finalReview && !GHOST.persona._reviewDone && GHOST.persona.selected.filter(s=>s&&s!=='none').length>1) {
        GHOST.persona._reviewDone = true; L.detail = '📋 Committee final review…';
        const names = GHOST.persona.selected.filter(s=>s&&s!=='none').map(s=>(allPersonas()[s]||{}).label||s).join(', ');
        engineSend(`[Ghost — Final Committee Review]\nAll work is complete. As a committee of ${names}, conduct a final review:\n1. Each perspective: state your assessment — what is strong, what is missing, what risks remain.\n2. Surface disagreements between perspectives.\n3. Synthesize a final verdict with actionable improvements.\nEnd with [[GITL::HALT]] when the review is complete.`, false);
        render(); return;
      }
      engineHalt('✅ Roadmap complete'); resetRoadmap(); return;
    }
    // Final committee review on task completion
    if (GHOST.persona.finalReview && !GHOST.persona._reviewDone && GHOST.persona.selected.filter(s=>s&&s!=='none').length>1) {
      GHOST.persona._reviewDone = true; L.detail = '📋 Committee final review…';
      const names = GHOST.persona.selected.filter(s=>s&&s!=='none').map(s=>(allPersonas()[s]||{}).label||s).join(', ');
      engineSend(`[Ghost — Final Committee Review]\nThe task is complete. As a committee of ${names}, conduct a final review:\n1. Each perspective: state your assessment — what is strong, what is missing, what risks remain.\n2. Surface disagreements between perspectives.\n3. Synthesize a final verdict with actionable improvements.\nEnd with [[GITL::HALT]] when the review is complete.`, false);
      render(); return;
    }
    engineHalt('✅ Task complete');
    return;
  }

  if (result.signal === 'proceed') {
    L.staleTicks = 0;
    L.noSigilStreak = 0; L._nudgedTail = '';
    if (L.payloadMode === 'roadmap') {
      const R = GHOST.roadmap;
      if (!R.captured) {
        if (parseRoadmap(text)) { L.detail = `🗺 Roadmap captured: ${R.steps.length} steps`; render(); sendRoadmapStep(); }
        else if (!R._reask) {
          // Model planned (it signaled PROCEED) but skipped the machine-readable block —
          // common with custom GPTs that self-track "[Step X of Y]". Ask once for just the block.
          R._reask = true;
          L.detail = '🗺 No roadmap block — re-requesting format (1 auto-retry)…';
          Timeline.record('roadmap_reask', { round: L.round });
          engineSend('No [[GITL::ROADMAP]] block was detected in your last response. Do NOT redo the research or execute anything. Output ONLY the roadmap now, in exactly this format:\n\n[[GITL::ROADMAP]]\n1. first concrete step\n2. second concrete step\n3. ...\n\n(3–12 steps, each self-contained) End with [[GITL::PROCEED]]', false);
          render();
        }
        else { enginePause('Roadmap mode: no [[GITL::ROADMAP]] list found after auto-retry — review output, then ▶ to retry'); }
        return;
      }
      if (R.index < R.steps.length) { sendRoadmapStep(); return; }
      if (!R.synthSent) { sendRoadmapSynthesis(); return; }
      engineHalt('✅ Roadmap complete'); resetRoadmap(); return;
    }
    if (GHOST.persona.perTask && resolvePersonaInject()) {
      engineSend(`Continue.\n\n[Active committee — maintain all assigned perspectives for this step]\n${resolvePersonaInject()}`, false);
    } else if (hasPendingDirectives()) {
      // Personas were selected mid-run (or the run began from a paused state) —
      // deliver the context block once instead of a bare "Continue".
      GHOST.persona._delivered = true;
      engineSend('Continue.' + runDirectives(false), false);
    } else {
      engineSend('Continue', false);
    }
    return;
  }

  // No signal — but only count it as stale if the model is genuinely idle.
  // Long "Thinking" phases (Perplexity Deep Research, o-series reasoning) produce
  // no DOM growth and no stop button for minutes at a time; the network channel
  // is the only honest witness that work is still happening.
  if (Adapter.isGenerating()) {
    L.staleTicks = 0;
    if (!L._thinkNoted) { L._thinkNoted = true; DIAG.push('Still generating (net/stop) — stale counter held'); }
    L.detail = '🧠 Model is still working…';
    render();
    return;
  }
  L._thinkNoted = false;
  L.staleTicks++;
  const staleLimit = (PLAT && PLAT.staleTicks) || 5;
  if (L.staleTicks >= staleLimit) {
    /* v8.1 sigil-free completion fallback: some models (DeepSeek especially)
       answer fully but never echo the [[GITL::…]] protocol markers. The reply
       IS complete — generation ended and the text went quiet — so instead of
       stranding the run, auto-continue once with a protocol reminder. Only
       after two consecutive sigil-free replies do we pause for review. Every
       nudge still consumes a round, so drift guard / round limit keep their
       grip on runaway loops. */
    const tail = text.slice(-200);
    if (tail === L._nudgedTail && (L.isSending || L.sendPending)) return; // nudge already in flight
    if (!L.isSending && !L.sendPending && text.length > 20 && (L.noSigilStreak || 0) < 2 && tail !== L._nudgedTail) {
      L.noSigilStreak = (L.noSigilStreak || 0) + 1;
      L._nudgedTail = tail;
      L.staleTicks = 0;
      L.detail = `🕯 Reply had no sigil — auto-continuing (${L.noSigilStreak}/2) + re-stating protocol`;
      DIAG.push(`Sigil missing — soft proceed (${L.noSigilStreak}/2)`);
      Timeline.record('soft_proceed', { streak: L.noSigilStreak, round: L.round });
      engineSend('Continue.\n\n[Ghost protocol reminder — your last reply was missing the control marker. From now on END EVERY reply with exactly one of:\n[[GITL::PROCEED]] — more work remains\n[[GITL::HALT]] — the whole task is fully complete\nAlso include "[Step X of Y]" on its own line so progress can be tracked.]', false);
      render();
      return;
    }
    enginePause('No sigil after 2 auto-continues — review output (the model may be ignoring the protocol)');
  }
}

// Watchdog heartbeat (supplements tick)
setInterval(() => {
  if (GHOST.loop.state !== 'RUNNING' || !GHOST.loop.lastActivity) return;
  if (Date.now() - GHOST.loop.lastActivity > 45000) {
    DIAG.push('Watchdog heartbeat: 45s stale');
  }
}, 10000);

/* Inserts a single prompt into the site's chat box (manual use of one
   workflow stage). Does NOT send — the user reviews and presses the
   site's own send, or Ghost's ▶. Gives brief tap feedback on mobile. */
function insertPrompt(text, btnEl) {
  const input = Adapter.getInput();
  if (!input) {
    if (btnEl) { const o = btnEl.textContent; btnEl.textContent = 'NO BOX'; setTimeout(()=>{ btnEl.textContent = o; }, 1400); }
    GHOST.loop.detail = '⚠ Couldn’t find the chat box on this page'; render();
    return false;
  }
  Adapter.injectText(input, text);
  try { input.focus(); } catch(_){}
  if (btnEl) { const o = btnEl.textContent; btnEl.classList.add('ins-ok'); btnEl.textContent = '✓ IN'; setTimeout(()=>{ btnEl.textContent = o; btnEl.classList.remove('ins-ok'); }, 1400); }
  Timeline.record('stage_inserted', { chars: text.length });
  return true;
}

/* ▶ Start workflow: turns the selected workflow on (active + auto-advance)
   so stages fire automatically, then starts the loop using whatever is in
   the chat box (or resumes an existing chat). One button, no tab-hopping. */
function startWorkflow() {
  const L = GHOST.loop;
  if (GHOST.workflow.selected === 'none') { L.detail = 'Pick a workflow first'; render(); return; }
  if (L.state === 'RUNNING') return;
  GHOST.workflow.active = true;
  GHOST.workflow.autoAdvance = true;
  _save('wfAuto', true);
  const input = Adapter.getInput();
  const typed = input ? (input.value || input.textContent || '').trim() : '';
  if (!typed && !Adapter.hasMessages()) {
    // Nothing to run yet — guide the user instead of silently doing nothing.
    try { input?.focus(); } catch(_){}
    L.detail = '⌨ Type your task in the chat box above, then press ▶ Start';
    render();
    return;
  }
  startLoop();
}

function startLoop() {
  const L = GHOST.loop;
  if (L.state === 'RUNNING') return;
  if (L.sendTxn?.state === 'uncertain') {
    L.detail = 'Choose “I see it in chat” or “Leave for manual Send” first.';
    render();
    return;
  }
  const input = Adapter.getInput();
  const typed = input ? (input.value || input.textContent || '').trim() : '';

  // Mark first run done
  if (GHOST.ui.firstRun) { GHOST.ui.firstRun = false; _save('firstRun', false); }

  // Case 1: resume from pause
  if (!L.needsPayload) {
    L.state = 'RUNNING'; L.lastActivity = Date.now(); L.detail = '';
    L.sendPending = false;
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    L.timer = Ticker.start(engineTick, 2500);
    render(); engineTick();
    return;
  }

  // Case 2: new prompt
  if (typed) {
    L.needsPayload = false; L.round = 0; L.lastProgress = null; L.staleTicks = 0;
    L.originalTask = typed.slice(0, 2000); // remembered for the reground gate
    L.state = 'RUNNING'; L.lastActivity = Date.now();
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    if (L.payloadMode === 'roadmap') { resetRoadmap(); GHOST.workflow.active = false; }
    const full = typed + runDirectives(true);
    GHOST.persona._delivered = true;
    engineSend(full, true);
    L.timer = Ticker.start(engineTick, 2500);
    render();
    return;
  }

  // Case 3: empty input, existing conversation → resume
  if (Adapter.hasMessages()) {
    L.needsPayload = false; L.round = 0; L.lastProgress = null; L.staleTicks = 0;
    L.state = 'RUNNING'; L.lastActivity = Date.now(); L.detail = 'Resuming…';
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    // Resume carries persona + posture (+ strategy, unless roadmap owns its own flow).
    GHOST.persona._delivered = true;
    engineSend(RESUME_TEXT + runDirectives(L.payloadMode !== 'roadmap'), true);
    L.timer = Ticker.start(engineTick, 2500);
    render();
    return;
  }

  L.detail = 'Type a prompt or open an existing chat';
  render();
}

function startQueue(rawLines) {
  const L = GHOST.loop;
  if (L.state === 'RUNNING') return;
  const steps = rawLines.split('\n').map(s => s.replace(/^\s*(?:\d+[.)]\s+|[-*]\s+)?/,'').trim()).filter(s => s.length > 2).slice(0, 30);
  if (!steps.length) { L.detail = 'Queue is empty'; render(); return; }
  L.payloadMode = 'roadmap'; _save('payloadMode','roadmap');
  GHOST.roadmap = { steps, index: 0, captured: true, synthSent: false };
  _save('rmSteps', JSON.stringify(steps)); _save('rmIndex', 0); _save('rmCaptured', true);
  L.needsPayload = false; L.round = 0; L.lastProgress = null; L.staleTicks = 0;
  L.state = 'RUNNING'; L.lastActivity = Date.now();
  GHOST.workflow.active = false;
  if (GHOST.ui.firstRun) { GHOST.ui.firstRun = false; _save('firstRun', false); }
  L.timer = Ticker.start(engineTick, 2500);
  sendRoadmapStep();
  render();
}

function pauseLoop() { enginePause('Paused'); }

/* The single ▶/⏸ button's behavior depends on state. Used by both the
   collapsed mini-bar and the Run-tab play button so they never diverge. */
function primaryAction() {
  const s = GHOST.loop.state;
  if (s === 'RUNNING') return pauseLoop();
  if (s === 'LIMIT')   return extendLimit();
  return startLoop();
}

function stopLoop() {
  const L = GHOST.loop;
  if (L.state === 'IDLE' || L.state === 'COMPLETE') return;
  enginePause('Stopped — progress preserved. Resume or reset when ready.');
}

function resetLoop() {
  const L = GHOST.loop;
  _settleSendPromise(false);
  L.state = 'IDLE'; L.round = 0; L.staleTicks = 0; L.lastProgress = null;
  L.originalTask = '';
  L.lastSignal = 'none'; L.lastConfidence = 0; L.needsPayload = true; L.detail = '';
  L.sendPending = false; L.sendDeadline = 0; L.sendTxn = null;
  GHOST.persona._reviewDone = false;
  GHOST.persona._delivered = false;
  Ticker.stop(); L.timer = null;
  resetRoadmap();
  render();
}

/* ═══════════════════════════════════════════════════════════════
   SPA ROUTE DETECTION
   ═══════════════════════════════════════════════════════════════ */
(function patchHistory() {
  // Guarded so a boot retry (top-level code re-running) can't double-wrap.
  if (window.__GITL_HIST_PATCHED__) return;
  window.__GITL_HIST_PATCHED__ = true;
  const orig = history.pushState;
  history.pushState = function(...a) { orig.apply(this, a); window.dispatchEvent(new Event('gitl:route')); };
  const origR = history.replaceState;
  history.replaceState = function(...a) { origR.apply(this, a); window.dispatchEvent(new Event('gitl:route')); };
})();
window.addEventListener('popstate', () => window.dispatchEvent(new Event('gitl:route')));
window.addEventListener('gitl:route', () => {
  if (location.href !== _lastHref) {
    const prevHref = _lastHref;
    _lastHref = location.href;
    _clearElementCaches();
    if (GHOST.loop.state === 'RUNNING') {
      /* v8.1.2 field report (Grok): almost every platform assigns a fresh
         conversation URL (e.g. "/" -> "/c/<uuid>") the instant the FIRST
         message is sent — that is normal same-conversation continuation,
         not navigating away, but it used to pause every run one tick after
         it started. Only treat it as a real navigation-away when the host
         changed, or when nothing was sent recently to explain the URL move. */
      let sameHost = false;
      try { sameHost = new URL(prevHref).hostname === location.hostname; } catch(_) {}
      const justSent = GHOST.loop.sendPending || (Date.now() - (GHOST.loop.lastActivity || 0) < 15000);
      if (sameHost && justSent) {
        Timeline.record('route_id_assigned', {
          from: _safeRouteClass(prevHref),
          to: _safeRouteClass(location.href)
        });
        return;
      }
      enginePause('Route changed — paused');
    }
  }
});

/* One place that forgets every cached element reference — the route watcher,
   reDetect, and the visibility healer all funnel through here so no cache
   (selector, shadow-walk throttle, heuristic) can be missed again. */
function _clearElementCaches() {
  _cache.clear();
  _deepLast.clear();
  _heurCache.input = { el: null, ts: 0 };
  _heurCache.send  = { el: null, ts: 0 };
}

/* Silent self-heal (v8.1): coming back from another app/tab is exactly when
   the SPA has rebuilt its DOM underneath us. If our cached composer is now a
   detached node, drop the caches so the next lookup re-resolves — no UI
   noise, no user action needed. This removes most manual 🔄 presses. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const c = _cache.get('in');
  if (c && !c.isConnected) _clearElementCaches();
});

/* Manual re-detect (v7.1, hardened v8.1): force a clean re-resolution of the
   page's chat input / send button. Fixes the case where you move browser →
   app → back into the same chat: the URL is unchanged so the route-watcher
   never fired, but the SPA rebuilt the DOM and Ghost is holding stale nodes.
   v8.1: no longer one-shot. If the first pass misses (SPA mid-remount — the
   exact moment users press 🔄), a MutationObserver + interval keeps watching
   for up to 12s and reports success the moment the composer appears. */
const _redetectWatch = { obs: null, timer: null, deadline: 0, nudged: false };

function _redetectStop() {
  try { _redetectWatch.obs?.disconnect(); } catch(_){}
  if (_redetectWatch.timer) clearInterval(_redetectWatch.timer);
  _redetectWatch.obs = null; _redetectWatch.timer = null; _redetectWatch.deadline = 0;
  try { document.querySelector('#g-redetect')?.classList.remove('spin'); } catch(_){}
}

function _redetectCheck() {
  const input = Adapter.getInput();
  if (input) {
    _redetectStop();
    try { DIAG.runProbe(); } catch(_){}
    Timeline.record('redetect_late', { platform: PLAT?.label });
    GHOST.loop.detail = `🔄 Re-detected ✓ — found chat input on ${PLAT?.label || 'page'}`;
    render();
    return true;
  }
  if (Date.now() > _redetectWatch.deadline) {
    _redetectStop();
    Timeline.record('redetect_timeout', { platform: PLAT?.label });
    GHOST.loop.detail = '🔄 Still no chat input after 12s. Tap inside the chat box once, then 🔄 again.';
    render();
    return false;
  }
  // Focus nudge (once): some editors only mount their real composer on focus.
  // Never steal focus from the user — only when nothing meaningful is focused.
  if (!_redetectWatch.nudged && Date.now() > _redetectWatch.deadline - 9000) {
    _redetectWatch.nudged = true;
    try {
      const ae = document.activeElement;
      if (!ae || ae === document.body) {
        for (const el of _qAll(['textarea:not([disabled])','div[contenteditable="true"]'])) {
          if (_visible(el)) { el.focus(); break; }
        }
      }
    } catch(_){}
  }
  return false;
}

function reDetect() {
  _redetectStop();
  _clearElementCaches();
  // Abandoned streams from a background hop can leave stale counters that
  // fake "still generating" — zero the network expectation state too.
  GITL_NET._open = 0;
  GITL_NET.expectUntil = 0;
  // Re-resolve platform in case the host changed (e.g. app vs web shell).
  let matched = null;
  for (const [, p] of Object.entries(PROFILES)) { if (p.host.test(location.hostname)) { matched = p; break; } }
  if (matched) PLAT = matched;
  // Force fresh element lookups now.
  const input = Adapter.getInput();
  const send  = Adapter.getSendBtn();
  try { DIAG.runProbe(); } catch(_){}
  Timeline.record('redetect', { found_input: !!input, found_send: !!send, platform: PLAT?.label });
  if (input) {
    GHOST.loop.detail = `🔄 Re-detected ✓ — found chat input on ${PLAT?.label || 'page'}`;
    render();
    return true;
  }
  // Not found yet — keep watching. SPAs often remount the composer a beat
  // after the user notices it's "gone" and presses 🔄.
  GHOST.loop.detail = '🔄 Searching for the chat box…';
  render();
  try { document.querySelector('#g-redetect')?.classList.add('spin'); } catch(_){}
  _redetectWatch.deadline = Date.now() + 12000;
  _redetectWatch.nudged = false;
  try {
    _redetectWatch.obs = new MutationObserver(() => {
      if (_redetectWatch._raf) return; // throttle bursts to one check per frame-ish
      _redetectWatch._raf = setTimeout(() => { _redetectWatch._raf = null; _redetectCheck(); }, 250);
    });
    _redetectWatch.obs.observe(document.body, { childList: true, subtree: true });
  } catch(_){}
  _redetectWatch.timer = setInterval(_redetectCheck, 800);
  return false;
}

/* ═══════════════════════════════════════════════════════════════
   CRASH RECOVERY
   ═══════════════════════════════════════════════════════════════ */
function _safeRouteClass(href) {
  try {
    const pathname = href ? new URL(href, location.origin).pathname : location.pathname;
    return pathname.split('/').filter(Boolean).slice(0, 3)
      .map(part => (/^[a-f0-9-]{12,}$/i.test(part) || part.length > 32) ? ':id' : part)
      .join('/') || '/';
  } catch(_) {
    return '/';
  }
}

window.addEventListener('beforeunload', () => {
  if (GHOST.loop.state === 'RUNNING' || GHOST.loop.state === 'PAUSED') {
    const txn = GHOST.loop.sendTxn;
    _save('crashState', JSON.stringify({
      state: GHOST.loop.state, round: GHOST.loop.round, mode: GHOST.loop.payloadMode,
      site: PLAT?.key || 'generic', routeClass: _safeRouteClass(),
      ts: Date.now(), wasRunning: GHOST.loop.state === 'RUNNING',
      send: txn ? { id: String(txn.id || '').slice(0, 8), state: txn.state, attemptedAt: txn.attemptedAt || 0 } : null
    }));
  }
});

(function recoverCrash() {
  try {
    const raw = GM_getValue('crashState','');
    if (!raw) return;
    const cs = JSON.parse(raw);
    _save('crashState', '');
    if (Date.now() - cs.ts > 300000) return;
    if (cs.site !== (PLAT?.key || 'generic') || cs.routeClass !== _safeRouteClass()) return;
    if (cs.send && (cs.send.state === 'dispatching' || cs.send.state === 'uncertain')) {
      GHOST.loop.state = 'PAUSED';
      GHOST.loop.sendTxn = {
        id: cs.send.id || 'unknown',
        state: 'uncertain',
        attemptedAt: cs.send.attemptedAt || cs.ts
      };
      GHOST.loop.detail = 'Crash recovery: prior Send is uncertain. Check the conversation; nothing was resent.';
      Reporter.capture('SEND-002', 'A reload interrupted Send confirmation. Nothing was resent.');
      return;
    }
    // Only flag as crash if it was running (not manual refresh)
    if (cs.wasRunning) {
      const rm = GHOST.roadmap.captured && GHOST.roadmap.steps.length ? ` Roadmap at step ${GHOST.roadmap.index}/${GHOST.roadmap.steps.length}.` : '';
      GHOST.loop.detail = `Crash recovery: ${cs.round} rounds.${rm} Press ▶ to resume.`;
    }
  } catch(_){}
})();

/* ═══════════════════════════════════════════════════════════════
   EXPORT ENGINE
   ═══════════════════════════════════════════════════════════════ */
function buildFilename(mode) {
  const ts = new Date().toISOString().replace('T','_').replace(/:/g,'').slice(0,15);
  const proj = (GHOST.project.slug || GHOST.project.name || 'ghost').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'ghost';
  const slug = (GHOST.export.customSlug || document.title.replace(/\s*[-|].*$/,'').trim() || PLAT.label).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);
  const ext = GHOST.export.format === 'json' ? 'json' : 'md';
  return `${proj}_${mode}_${ts}_${slug}.${ext}`;
}

/* ── API-first exporters (lesson from the top GitHub exporters: the platform's own
      conversation API beats DOM scraping — complete history, exact roles, structured
      thinking, immune to virtualization and redesigns). DOM remains the fallback. ── */

// ChatGPT — technique from pionxzh/chatgpt-exporter: session token + backend-api, walk the node tree
async function apiExportChatGPT() {
  const id = location.pathname.match(/\/c\/([\w-]+)/)?.[1];
  if (!id) return null;
  const sess = await (await fetch(location.origin + '/api/auth/session')).json();
  if (!sess?.accessToken) return null;
  const r = await fetch(location.origin + '/backend-api/conversation/' + id, {
    headers: { 'Authorization': 'Bearer ' + sess.accessToken }
  });
  if (!r.ok) return null;
  const conv = await r.json();
  if (!conv?.mapping || !conv.current_node) return null;
  // Walk parent pointers from current_node → linear thread (correctly resolves branches/regenerations)
  const chain = [];
  let node = conv.mapping[conv.current_node];
  while (node) { chain.unshift(node); node = node.parent ? conv.mapping[node.parent] : null; }
  const out = [];
  for (const n of chain) {
    const m = n.message;
    if (!m || !m.author || m.author.role === 'system' || m.author.role === 'tool') continue;
    const c = m.content || {};
    let text = '';
    if (Array.isArray(c.parts)) text = c.parts.map(p => typeof p === 'string' ? p : (p?.text || '')).join('\n').trim();
    else if (typeof c.text === 'string') text = c.text.trim();
    if (c.content_type === 'code' && text) text = '```\n' + text + '\n```';
    let thinking = '';
    if (GHOST.export.thinking && Array.isArray(c.thoughts)) thinking = c.thoughts.map(t => t?.content || t?.summary || '').filter(Boolean).join('\n\n');
    if (text || thinking) out.push(thinking ? { role: m.author.role, index: out.length, text, thinking } : { role: m.author.role, index: out.length, text });
  }
  return out.length ? out : null;
}

// Claude — technique from socketteer/Claude-Conversation-Exporter, improved: orgId auto-fetched
// (their users had to paste it manually — their top setup complaint)
async function apiExportClaude() {
  const convId = location.pathname.match(/\/chat\/([\w-]+)/)?.[1];
  if (!convId) return null;
  const orgs = await (await fetch('/api/organizations', { credentials: 'include' })).json();
  const orgId = Array.isArray(orgs) ? orgs[0]?.uuid : null;
  if (!orgId) return null;
  const r = await fetch(`/api/organizations/${orgId}/chat_conversations/${convId}?tree=True&rendering_mode=messages&render_all_tools=true`, { credentials: 'include' });
  if (!r.ok) return null;
  const data = await r.json();
  const msgs = data?.chat_messages;
  if (!Array.isArray(msgs)) return null;
  const out = [];
  for (const m of msgs) {
    const role = m.sender === 'human' ? 'user' : 'assistant';
    let text = '', thinking = '';
    for (const b of (m.content || [])) {
      if (b.type === 'text' && b.text) text += (text ? '\n\n' : '') + b.text;
      else if (b.type === 'thinking' && GHOST.export.thinking) thinking += (thinking ? '\n\n' : '') + (b.thinking || b.text || '');
      else if (b.type === 'tool_use') text += (text ? '\n' : '') + `[tool: ${b.name || 'call'}]`;
    }
    if (!text && typeof m.text === 'string') text = m.text;
    text = text.trim();
    if (text || thinking) out.push(thinking ? { role, index: out.length, text, thinking } : { role, index: out.length, text });
  }
  return out.length ? out : null;
}

const API_EXPORTERS = { 'ChatGPT': apiExportChatGPT, 'Claude': apiExportClaude };

/* ── The Veil: export progress overlay ───────────────────────── */
const VEIL = {
  el: null, steps: [], idx: 0, cancelled: false, lastBeat: 0, _wd: null,
  _popover: false,        // true if using the Popover API top-layer path
  _richChecked: false,    // FPS probe runs once per session
  _visBound: false,
  ensure() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.id = 'gitl-veil';
    // Popover API renders in the top layer — above ALL host stacking contexts,
    // immune to z-index wars and transform-based parents. Feature-detected.
    this._popover = typeof this.el.showPopover === 'function';
    if (this._popover) { try { this.el.setAttribute('popover', 'manual'); } catch(_) { this._popover = false; } }
    this.el.innerHTML = _TT(`
      <div class="gv-card">
        <div class="gv-ringwrap">
          <div class="gv-ghost-x gv-gx1">👻</div>
          <div class="gv-ghost-x gv-gx2">👻</div>
          <div class="gv-ghost-x gv-gx3">👻</div>
          <div class="gv-ring"></div>
          <div class="gv-ghost">👻</div>
        </div>
        <div class="gv-title" id="gv-title">Working…</div>
        <div class="gv-steps" id="gv-steps"></div>
        <div class="gv-barwrap"><div class="gv-bar" id="gv-bar"></div></div>
        <div class="gv-pct" id="gv-pct"></div>
        <div class="gv-note" id="gv-note">Please don't reload the page</div>
        <button class="gv-cancel" id="gv-cancel">Cancel</button>
      </div>`);
    document.body.appendChild(this.el);
    this.el.querySelector('#gv-cancel').addEventListener('click', () => { this.cancelled = true; this.el.querySelector('#gv-title').textContent = 'Stopping…'; });
    // Re-assert top-layer if the tab was backgrounded (mobile browsers can drop
    // the overlay behind native chrome when returning to the foreground).
    if (!this._visBound) {
      this._visBound = true;
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.el && this._isOpen()) this._reassert();
      });
    }
  },
  _isOpen() {
    if (!this.el) return false;
    return this._popover ? this.el.matches(':popover-open') : this.el.style.display === 'flex';
  },
  _reassert() {
    // Re-show in the top layer; harmless if already shown.
    if (this._popover) { try { this.el.hidePopover(); } catch(_){} try { this.el.showPopover(); } catch(_){ this.el.style.display = 'flex'; } }
    else { this.el.style.display = 'flex'; }
  },
  // One-time FPS probe: only enable the heavier multi-ghost parallax if the
  // device can sustain it AND the user hasn't asked for reduced motion.
  _maybeRich() {
    if (this._richChecked) return;
    this._richChecked = true;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch(_){}
    let frames = 0; const t0 = performance.now();
    const tick = () => {
      frames++;
      const dt = performance.now() - t0;
      if (dt < 500) { requestAnimationFrame(tick); return; }
      const fps = (frames / dt) * 1000;
      if (fps >= 50 && this.el) this.el.classList.add('gv-rich'); // smooth device only
    };
    requestAnimationFrame(tick);
  },
  show(steps) {
    this.ensure(); this.steps = steps; this.idx = 0; this.cancelled = false; this.lastBeat = Date.now();
    if (this._popover) { try { this.el.showPopover(); } catch(_) { this._popover = false; this.el.style.display = 'flex'; } }
    else { this.el.style.display = 'flex'; }
    this._maybeRich();
    this.renderSteps(); this.beat(null);
    this._wd = setInterval(() => {
      const quiet = Date.now() - this.lastBeat;
      const note = this.el.querySelector('#gv-note');
      if (quiet > 8000) note.textContent = '⏳ Still working — the page is slow. Don\'t reload.';
      if (quiet > 25000) note.textContent = '⚠️ This looks stuck. Cancel is safe — Ghost keeps what it collected.';
    }, 2000);
  },
  step(i, label) {
    this.idx = i; this.lastBeat = Date.now();
    this.el.querySelector('#gv-title').textContent = label || this.steps[i] || 'Working…';
    this.renderSteps(); this.beat(null);
  },
  renderSteps() {
    this.el.querySelector('#gv-steps').innerHTML = _TT(this.steps.map((s, i) =>
      `<div class="gv-step${i < this.idx ? ' done' : i === this.idx ? ' act' : ''}">${i < this.idx ? '✓' : i === this.idx ? '▶' : '·'} ${s}</div>`).join(''));
  },
  beat(pct) {
    this.lastBeat = Date.now();
    const bar = this.el.querySelector('#gv-bar'), p = this.el.querySelector('#gv-pct');
    const note = this.el.querySelector('#gv-note'); if (note) note.textContent = "Please don't reload the page";
    if (pct == null) { bar.classList.add('indet'); bar.style.width = '40%'; p.textContent = ''; }
    else { bar.classList.remove('indet'); bar.style.width = Math.min(100, pct) + '%'; p.textContent = Math.round(Math.min(100, pct)) + '%'; }
  },
  hide() {
    if (this._wd) clearInterval(this._wd); this._wd = null;
    if (!this.el) return;
    if (this._popover) { try { this.el.hidePopover(); } catch(_){} this.el.style.display = 'none'; }
    else { this.el.style.display = 'none'; }
  }
};

/* ── Deep Export: capture thinking logs, not just chat ───────── */
const THINK_TOGGLE_RX = /\b(thinking|thought|thoughts|reasoning|chain of thought|thought for|show (?:steps|work|reasoning|thinking)|view (?:steps|reasoning))\b/i;

async function expandThinking() {
  // Auto-click collapsed "Thinking" toggles so reasoning text enters the DOM.
  let clicked = 0;
  for (let pass = 0; pass < 3; pass++) {
    let n = 0;
    document.querySelectorAll('details:not([open])').forEach(d => {
      if (!d.closest('#gitl')) { try { d.open = true; n++; } catch(_){} }
    });
    document.querySelectorAll('button,[role="button"],summary').forEach(b => {
      try {
        if (b.closest('#gitl') || b.dataset.gitlExpanded) return;
        const label = ((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).slice(0, 80);
        if (THINK_TOGGLE_RX.test(label) && b.getAttribute('aria-expanded') !== 'true') {
          b.click(); b.dataset.gitlExpanded = '1'; n++;
        }
      } catch(_){}
    });
    // Manus-style collapsed steps: clickable group/header divs driving grid-rows-[0fr] panels
    document.querySelectorAll('[class*="group/header"][class*="clickable"]').forEach(h => {
      try {
        if (h.closest('#gitl') || h.dataset.gitlExpanded) return;
        const wrap = h.parentElement?.parentElement || h.parentElement;
        if (!wrap || !wrap.querySelector('[class*="grid-rows-[0fr]"]')) return; // only genuinely collapsed sections
        h.click(); h.dataset.gitlExpanded = '1'; n++;
      } catch(_){}
    });
    clicked += n;
    if (!n) break;
    await sleep(450);
  }
  return clicked;
}

function tableToMd(t) {
  const rows = [...t.querySelectorAll('tr')].map(tr =>
    [...tr.children].map(c => (c.innerText || '').trim().replace(/\|/g, '/').replace(/\s*\n+\s*/g, ' ')));
  if (!rows.length || !rows[0].length) return '';
  const out = ['| ' + rows[0].join(' | ') + ' |', '| ' + rows[0].map(() => '---').join(' | ') + ' |'];
  rows.slice(1).forEach(r => out.push('| ' + r.join(' | ') + ' |'));
  return out.join('\n');
}

// innerText, but with <table> elements serialized as markdown tables so structure survives export
function textWithTables(el) {
  if (!el.querySelector || !el.querySelector('table')) return el.innerText || '';
  try {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('table').forEach(t => {
      const pre = document.createElement('pre');
      pre.textContent = '\n' + tableToMd(t) + '\n';
      t.replaceWith(pre);
    });
    // clone must be in-document for innerText to compute layout; use a detached fallback
    return clone.innerText || clone.textContent || el.innerText;
  } catch(_) { return el.innerText || ''; }
}

const FILE_NAME_RX = /^[\w][\w\-. ()]{0,60}\.(md|py|js|ts|jsx|tsx|json|csv|txt|html|css|pdf|docx|xlsx|pptx|zip|yaml|yml|sh|sql)$/;

const MANUS_CHROME = new Set(['Lite','Accepted','View more','View all files in this task','Task completed','How was this result?','Suggested follow-ups','Knowledge recalled']);

function cleanManusText(raw) {
  return (raw || '').split('\n').filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (MANUS_CHROME.has(t)) return false;
    if (/^Knowledge recalled/.test(t)) return false;
    if (/^\d+\/\d+$/.test(t)) return false;     // virtual-list counters like 5/16
    if (/^Code · [\d.]+ [KMG]B$/.test(t)) return false;
    return true;
  }).join('\n').trim();
}

// Manus virtualizes the chat — off-screen turns don't exist in the DOM.
// Harvest: scroll the list top→bottom, collecting top-level [data-event-id] turns by id.
async function harvestManus() {
  const first = document.querySelector('[data-event-id]');
  if (!first) return null;
  let sc = first.parentElement;
  while (sc && sc !== document.body && sc.scrollHeight <= sc.clientHeight * 1.5) sc = sc.parentElement;
  if (!sc || sc === document.body) sc = document.scrollingElement;
  const seen = new Map();
  const grab = () => {
    document.querySelectorAll('[data-event-id]').forEach(el => {
      if (el.parentElement?.closest('[data-event-id]')) return; // top-level turns only
      const id = el.getAttribute('data-event-id');
      const text = cleanManusText(textWithTables(el));
      if (!text) return;
      const role = /items-end/.test(el.className) ? 'user' : 'assistant';
      const pos = el.getBoundingClientRect().top + (sc.scrollTop || 0);
      const prev = seen.get(id);
      if (!prev || prev.text.length < text.length) seen.set(id, { role, text, pos });
    });
  };
  const orig = sc.scrollTop;
  const step = Math.max(300, (sc.clientHeight || 600) * 0.85);
  const maxIter = Math.min(800, Math.ceil(sc.scrollHeight / step) + 20); // sized to the chat, not a blind cap
  sc.scrollTop = 0; await sleep(420); grab();
  let guard = 0;
  while (sc.scrollTop + sc.clientHeight < sc.scrollHeight - 10 && guard++ < maxIter) {
    if (VEIL.cancelled) break; // user cancelled — keep what we have
    sc.scrollTop += step; await sleep(240); grab();
    if (guard % 3 === 0) VEIL.beat(100 * sc.scrollTop / sc.scrollHeight);
  }
  // Bottom settle: virtualizers render the tail late — force bottom twice
  if (!VEIL.cancelled) for (let i = 0; i < 2; i++) { sc.scrollTop = sc.scrollHeight; await sleep(550); grab(); VEIL.beat(100); }
  sc.scrollTop = orig;
  let arr = [...seen.values()].sort((a, b) => a.pos - b.pos)
    .map((m, i) => ({ role: m.role, index: i, text: m.text }));
  // Merge consecutive same-role fragments (Manus plan steps) into readable blocks
  const merged = [];
  for (const m of arr) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role && (m.text.length < 200 || last.text.length < 200)) {
      last.text += '\n' + m.text;
    } else merged.push({ ...m });
  }
  merged.forEach((m, i) => m.index = i);
  // Manus creates files during the task — surface them as a manifest (contents live in Manus's file panel)
  const files = new Set();
  for (const m of merged) for (const line of m.text.split('\n')) {
    const t = line.trim();
    if (FILE_NAME_RX.test(t)) files.add(t);
  }
  if (files.size) merged.push({
    role: 'assistant', index: merged.length,
    text: '## 📎 Files created in this task\n' + [...files].map(f => '- ' + f).join('\n') +
          '\n\n*(File contents are not in the chat DOM — download them from Manus via "View all files in this task" before the session expires.)*'
  });
  return merged.length ? merged : null;
}

const THINK_BLOCK_SELS = ['[class*="thinking" i]','[class*="thought" i]','[class*="reasoning" i]','[data-testid*="thought"]','[data-testid*="reasoning"]','details'];

function extractThinking(el) {
  const parts = [];
  for (const s of THINK_BLOCK_SELS) {
    try {
      el.querySelectorAll(s).forEach(t => {
        const txt = (t.innerText || '').trim();
        if (txt && txt.length > 40 && !parts.some(p => p.includes(txt.slice(0, 80)))) parts.push(txt);
      });
    } catch(_){}
  }
  return parts.join('\n\n');
}

function extractMessages(withThinking) {
  const allTurns = document.querySelectorAll('[data-message-author-role], .human-turn, .bot-turn, div[class*="user-message"], div[class*="assistant-message"]');
  const messages = [];
  const push = (el, role, i) => {
    let text = textWithTables(el).trim();
    let thinking = '';
    if (withThinking && role === 'assistant') {
      thinking = extractThinking(el);
      if (thinking) text = text.replace(thinking, '').trim(); // avoid double-capture
    }
    if (text || thinking) messages.push(thinking ? { role, index: i, text, thinking } : { role, index: i, text });
  };
  if (allTurns.length > 0) {
    allTurns.forEach((el, i) => {
      const role = el.dataset?.messageAuthorRole || (el.className.includes('user') || el.className.includes('human') ? 'user' : 'assistant');
      push(el, role, i);
    });
  } else {
    const els = [..._qAll(PLAT.assistant)];
    const leaves = els.filter(el => !els.some(o => o !== el && el.contains(o))); // drop ancestors of other matches
    const texts = new Set();
    leaves.forEach((el, i) => {
      const t = el.innerText.trim();
      if (t && !texts.has(t)) { texts.add(t); push(el, 'assistant', i); }
    });
  }
  return messages;
}

function applyFilter(msgs) {
  const f = GHOST.export.filter;
  if (f === 'user') return msgs.filter(m => m.role === 'user');
  if (f === 'assistant') return msgs.filter(m => m.role === 'assistant');
  if (f === 'code') return msgs.filter(m => /```/.test(m.text));
  return msgs;
}

const GM_KEYS = ['projectName','projectSlug','wfSelected','wfStage','wfAuto','wfPause','persona','personaCommittee','personaPerTask','personaFinalReview','payloadMode','posture','maxRounds','driftEnabled','customProceed','customStop','sigWindow','expFormat','expFilter','expRoles','expThinking','expSlug','panelCollapsed','panelPosition','soundOn','notifyOn','cfgAdv','expAdv','skinTheme','customSkin','accentHue','unattended','firstRun','customSites','rmSteps','rmIndex','rmCaptured','qDraft','customPersonas','customWorkflows'];

function downloadText(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ── Workshop export (W2): write custom items to a .gitl.json bundle.
   Exports ONLY custom personas/workflows — never project text, chat
   content, settings, or credentials. */
function workshopExport() {
  const nP = Object.keys(Workshop.personas).length;
  const nW = Object.keys(Workshop.workflows).length;
  if (nP + nW === 0) { GHOST.loop.detail = 'No custom items to export yet'; render(); return; }
  const slug = (GHOST.project.slug || 'ghost') + '-workshop';
  downloadText(Workshop.exportBundle(), `${slug}.gitl.json`, 'application/json');
  Timeline.record('workshop_export', { personas: nP, workflows: nW });
  GHOST.loop.detail = `⬇ Exported ${nP} persona(s) + ${nW} workflow(s)`;
  render();
}

/* ── Workshop import (W3): pick a .gitl.json file, validate, merge.
   Untrusted input — all text is stored as plain strings and only ever
   rendered via textContent, never innerHTML, so a malicious label/inject
   cannot inject markup into Ghost's panel. */
function workshopImport() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,.gitl.json,application/json';
  inp.addEventListener('change', () => {
    const file = inp.files && inp.files[0];
    if (!file) return;
    if (file.size > WORKSHOP_LIMITS.fileBytes) { GHOST.loop.detail = `⚠ File too large (max ${Math.round(WORKSHOP_LIMITS.fileBytes/1024)} KB)`; render(); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const res = Workshop.importBundle(String(reader.result || ''));
      if (!res.ok) { GHOST.loop.detail = `⚠ Import failed: ${res.error}`; render(); return; }
      Timeline.record('workshop_import', res);
      const bits = [];
      if (res.personas)  bits.push(`${res.personas} persona(s)`);
      if (res.workflows) bits.push(`${res.workflows} workflow(s)`);
      let msg = bits.length ? `✓ Imported ${bits.join(' + ')}` : '✓ Import complete';
      if (res.renamed) msg += ` · ${res.renamed} renamed`;
      if (res.skipped) msg += ` · ${res.skipped} skipped (invalid)`;
      GHOST.loop.detail = msg;
      render();
    };
    reader.onerror = () => { GHOST.loop.detail = '⚠ Could not read file'; render(); };
    reader.readAsText(file);
  });
  inp.click();
}

function exportBackupHandoff() {
  const all = extractMessages();
  const mission = (all.find(m => m.role === 'user')?.text || '').slice(0, 600);
  const msgs = all.slice(-10); // verbatim tail, both roles — the part a stuck chat can't summarize for you
  const R = GHOST.roadmap, W = GHOST.workflow;
  const wf = (allWorkflows()[W.selected]||WORKFLOW_LIBRARY.none).label;
  const steps = R.steps.length ? R.steps.map((s,i) =>
    `${i < R.index ? '✓' : i === R.index ? '▶' : '·'} ${i+1}. ${s}`).join('\n') : '(none)';
  const md = [
    '# 🧷 GITL Backup Handoff',
    '*Use this when a chat is stuck, full, or dead and cannot be prompted anymore. Paste it into a NEW chat to continue the work. (If the chat still responds, the 🤝 Handoff button produces a better briefing — the AI writes it itself.)*',
    '',
    '```yaml',
    `project: ${GHOST.project.name || 'Untitled'}`,
    `platform: ${PLAT.label}`,
    `exported: ${new Date().toISOString()}`,
    `mode: ${GHOST.loop.payloadMode}`,
    `persona: ${(GHOST.persona.selected||['none']).filter(s=>s&&s!=='none').map(s=>(allPersonas()[s]||{}).label||s).join(', ')||'None'}`,
    `workflow: ${wf} (stage ${W.stageIndex})`,
    `rounds: ${GHOST.loop.round}`,
    `last_signal: ${GHOST.loop.lastSignal}`,
    '```',
    '',
    '## Mission (first prompt)',
    mission || '(not captured — describe the task to the next AI yourself)',
    '',
    '## Roadmap state',
    steps,
    '',
    '## Resumption instructions for the next AI',
    'The previous chat became unusable. You are continuing its work.',
    '1. Read the mission and the verbatim tail below — that is the freshest state available.',
    '2. Continue from the current roadmap position (▶) if one exists, not from the beginning.',
    '3. Deliverable-first output, no fluff.',
    '4. End every response with [[GITL::PROCEED]] (more work remains) or [[GITL::HALT]] (fully done).',
    '',
    '## Last 10 messages — verbatim (most recent last)',
    ...msgs.map((m) => `### ${m.role === 'user' ? '👤 User' : '🤖 Assistant'}\n${m.text}\n`),
    '---',
    `*Backup Handoff — generated by Ghost in the Loop v${VER}. The lightweight sibling of Handoff: state + last 10 messages only, enough to resume elsewhere.*`
  ].join('\n');
  downloadText(md, buildFilename('backup-handoff').replace(/\.\w+$/,'') + '.md', 'text/markdown');
}

const HANDOFF_IN_CHAT = `Stop all other work. Produce a COMPLETE HANDOFF REPORT for this entire conversation, in ONE markdown code block, structured exactly as:
# Handoff Report
## Mission — what we are building and why
## Everything tried — every approach/version, what worked, what failed and WHY
## Current state — exactly where things stand right now
## Key decisions & reasoning
## Open items — unresolved problems, risks, unknowns
## Next steps — concrete, ordered
## Instructions for a fresh AI — how to pick this up with zero prior knowledge
Be exhaustive — this report is the only memory the next AI will have. No fluff outside the code block. End with [[GITL::HALT]]`;

function handoffInChat() {
  if (GHOST.loop.state === 'RUNNING') { GHOST.loop.detail = 'Pause the loop first'; render(); return; }
  GHOST.loop.detail = '🤝 Handoff requested — copy the report (or Export) when it finishes';
  engineSend(HANDOFF_IN_CHAT, false);
  render();
}

function backupConfig() {
  const cfg = {};
  for (const k of GM_KEYS) cfg[k] = GM_getValue(k, undefined);
  downloadText(JSON.stringify({ gitl_version: VER, exported: new Date().toISOString(), config: cfg }, null, 2),
    'gitl-config-backup.json', 'application/json');
}

function restoreConfig(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    const cfg = data.config || data;
    let n = 0;
    for (const k of GM_KEYS) { if (k in cfg && cfg[k] !== undefined) { GM_setValue(k, cfg[k]); n++; } }
    return `✓ Restored ${n} settings — reload the page to apply.`;
  } catch(e) { return '⚠ Invalid backup file.'; }
}

async function runExport() {
  const isManus = /Manus/i.test(PLAT.label);
  const apiFn = API_EXPORTERS[PLAT.label];
  let raw = null;
  // Path 1 — the platform's own archive: complete, exact, virtualization-proof
  if (apiFn) {
    VEIL.show(['Fetching from platform archive', 'Building your file']);
    try {
      VEIL.step(0, 'Fetching from platform archive…');
      raw = await apiFn().catch(e => { DIAG.push('API export failed: ' + e.message); return null; });
      VEIL.step(1, 'Building your file…');
      await sleep(150);
    } finally { if (raw) { VEIL.hide(); } }
  }
  // Path 2 — DOM (fallback, and the only path on platforms without a known API)
  if (!raw) {
    const steps = ['Reading chat', ...(GHOST.export.thinking ? ['Opening thinking blocks'] : []), ...(isManus ? ['Collecting every message'] : []), 'Building your file'];
    VEIL.show(steps);
    try {
      VEIL.step(0);
      await sleep(250);
      if (GHOST.export.thinking) {
        VEIL.step(1, 'Opening thinking blocks…');
        const n = await expandThinking();
        await sleep(n ? 600 : 0);
      }
      if (isManus && !VEIL.cancelled) {
        VEIL.step(steps.indexOf('Collecting every message'), 'Collecting every message…');
        raw = await harvestManus();
      }
      VEIL.step(steps.length - 1, 'Building your file…');
      await sleep(200);
    } finally { VEIL.hide(); GHOST.loop.detail = ''; render(); }
  } else { VEIL.hide(); GHOST.loop.detail = ''; render(); }
  const msgs = applyFilter(raw || extractMessages(GHOST.export.thinking));
  if (!msgs.length) { alert('Ghost: no messages found to export.'); return; }
  const proj = GHOST.project.name || 'Untitled';
  const ts = new Date().toLocaleString();
  let content, mime;
  if (GHOST.export.format === 'json') {
    content = JSON.stringify({ project: proj, platform: PLAT.label, exported: ts, rounds: GHOST.loop.round, workflow: (allWorkflows()[GHOST.workflow.selected]||WORKFLOW_LIBRARY.none).label, persona: (GHOST.persona.selected||['none']).filter(s=>s&&s!=='none').map(s=>(allPersonas()[s]||{}).label||s).join(', ')||'None', messages: msgs }, null, 2);
    mime = 'application/json';
  } else {
    const lines = [`# Ghost Export — ${proj}`, `**Platform:** ${PLAT.label} | **Exported:** ${ts} | **Rounds:** ${GHOST.loop.round}`, '', '---', ''];
    for (const m of msgs) {
      if (GHOST.export.includeRoles) lines.push(`## ${m.role === 'user' ? '👤 User' : '🤖 Assistant'}`, '');
      if (m.thinking) lines.push('> 💭 **Thinking**', ...m.thinking.split('\n').map(l => '> ' + l), '');
      lines.push(m.text, '', '---', '');
    }
    content = lines.join('\n');
    mime = 'text/markdown';
  }
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = buildFilename('export');
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ═══════════════════════════════════════════════════════════════
   S5 — ENHANCED EXPORT: SHA-256 DEDUP + CAPSULE V2
   Deduplicates messages from virtualized DOM re-renders.
   Produces resumable capsule with DAG links + resume token.
   Sources: Kimi capsule, ChatGPT Export 3 capsule builder
   ═══════════════════════════════════════════════════════════════ */
async function gitlSha256(text) {
  try {
    const data = new TextEncoder().encode(text || '');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback: djb2 hash (used when crypto.subtle unavailable)
    const s = String(text || '');
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return `djb2-${(h >>> 0).toString(16).padStart(8, '0')}`;
  }
}

async function buildCapsuleV2(rawMessages) {
  const seen = new Set();
  const graph = [];
  for (let i = 0; i < rawMessages.length; i++) {
    const m = rawMessages[i];
    const text = (m.text || '').trim();
    if (!text || text.length < 5) continue;
    const hash = await gitlSha256(`${m.role}:${text}`);
    if (seen.has(hash)) continue;
    seen.add(hash);
    graph.push({
      id: `m_${graph.length + 1}`,
      role: m.role || 'unknown',
      text,
      sha256: hash.slice(0, 16),
      parentId: graph.length > 0 ? graph[graph.length - 1].id : null
    });
  }
  const h = typeof platformHealth === 'function' ? platformHealth() : {};
  return {
    schema: 'gitl.capsule.v2',
    version: VER,
    exported_at: new Date().toISOString(),
    platform: PLAT.label,
    url: location.href,
    title: document.title || '',
    project: GHOST.project || {},
    workflow: { selected: GHOST.workflow.selected, stage: GHOST.workflow.stageIndex },
    health: { score: h.score, badge: h.badge },
    messages: graph,
    deduplicated: rawMessages.length - graph.length,
    resume: {
      last_id: graph.length ? graph[graph.length - 1].id : null,
      next_action: 'continue_from_capsule',
      instruction: 'Read this capsule. Preserve decisions. Continue from resume.next_action without restarting.'
    },
    timeline_summary: {
      total_events: Timeline.all().length,
      recent_failures: Timeline.failures().slice(-5).map(f => f.data)
    }
  };
}

async function exportCapsuleV2() {
  const raw = extractMessages(GHOST.export.thinking);
  const capsule = await buildCapsuleV2(raw);
  const json = JSON.stringify(capsule, null, 2);
  const fname = buildFilename('capsule').replace(/\.\w+$/, '') + '.gitl.json';
  downloadText(json, fname, 'application/json');
  Timeline.record('export_capsule', { messages: capsule.messages.length, deduped: capsule.deduplicated });
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO
   ═══════════════════════════════════════════════════════════════ */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [520,680].forEach((f,i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime+i*0.18); o.stop(ctx.currentTime+0.5+i*0.18);
    });
  } catch(_){}
}

/* ══════════════════════════════════════════════════════════════
   SKIN — token-based theme engine (d6)
   Skins are DATA, not code: a whitelist of CSS custom properties
   (+ enumerated fx flags) applied to the panel root. A skin cannot
   add, remove, or restructure controls — structure and behavior are
   owned by core. Unknown tokens from newer/older versions are
   silently ignored, so community skins stay forward-compatible.
   ══════════════════════════════════════════════════════════════ */
const SKIN_TOKENS = {
  '--g-bg':'#111214','--g-bg-deep':'#0c0d10','--g-surface':'#18191c',
  '--g-surface-2':'#16171b','--g-surface-3':'#1c1d22','--g-hover':'#222329',
  '--g-border':'#27282e','--g-border-2':'#2e2f35','--g-text':'#c9cad0',
  '--g-text-mid':'#888','--g-text-dim':'#555','--g-text-hot':'#fff',
  '--g-text-low':'#666','--g-text-faint':'#444','--g-text-ghost':'#333','--g-muted':'#6b7280',
  '--g-accent':'#818cf8','--g-accent-text':'#a5b4fc','--g-accent-deep':'#3730a3',
  '--g-accent-bg':'#1a1b2e','--g-ok':'#34d399','--g-ok-deep':'#064e3b',
  '--g-ok-bg':'#052e1c','--g-warn':'#fbbf24','--g-err':'#f87171',
  '--g-radius':'12px','--g-shadow':'0 10px 32px rgba(0,0,0,.65)',
  '--g-font':"'SF Mono','Cascadia Code','JetBrains Mono','Fira Mono',monospace",
  '--g-blur':'0px','--g-aur1':'transparent','--g-aur2':'transparent','--g-aur3':'transparent'
};
const SKIN_FX = {
  border:  ['none','aurora','glow'],
  ghost:   ['none','float','flicker','halo','glow'],
  tabs:    ['none','underline','pill'],
  progress:['none','shimmer','ekg'],
  surface: ['none','sheen']
};
const SKIN_PRESETS = {
  classic:{ name:'Classic', tokens:{}, fx:{} },
  aurora:{ name:'Aurora', fx:{ border:'aurora', ghost:'float', tabs:'underline', progress:'shimmer', surface:'sheen' }, tokens:{
    '--g-bg':'#12132b','--g-bg-deep':'#0b0c1f','--g-surface':'#1a1c3a','--g-surface-2':'#16182f',
    '--g-surface-3':'#1e2040','--g-hover':'#232655','--g-border':'#2b2e5c','--g-border-2':'#3a3d78',
    '--g-text':'#d6d8f2','--g-muted':'#7d82b8','--g-accent':'#8b9dff','--g-accent-text':'#b9c4ff',
    '--g-accent-deep':'#4338ca','--g-accent-bg':'#1d1f4a','--g-blur':'8px',
    '--g-shadow':'0 12px 40px rgba(40,30,120,.55)',
    '--g-aur1':'#4f7cff','--g-aur2':'#a855f7','--g-aur3':'#ff6ac1' } },
  glass:{ name:'Glass', fx:{ ghost:'halo', tabs:'underline', surface:'sheen' }, tokens:{
    '--g-bg':'#171a1f','--g-bg-deep':'#101318','--g-surface':'#1d2127','--g-surface-2':'#191c22',
    '--g-surface-3':'#20242b','--g-hover':'#242932','--g-border':'#2a2f38','--g-border-2':'#343a45',
    '--g-text':'#d3d7de','--g-accent':'#7dd3fc','--g-accent-text':'#bae6fd','--g-accent-deep':'#0369a1',
    '--g-accent-bg':'#16222c','--g-blur':'10px','--g-shadow':'0 10px 36px rgba(0,0,0,.5)' } },
  metal:{ name:'Metal', fx:{ surface:'sheen', tabs:'pill' }, tokens:{
    '--g-bg':'#16171a','--g-surface':'#202227','--g-surface-2':'#1b1d21','--g-surface-3':'#24262c',
    '--g-hover':'#282b32','--g-border':'#33363e','--g-border-2':'#454956','--g-text':'#cfd3da',
    '--g-accent':'#93a6c4','--g-accent-text':'#c2d0e6','--g-accent-deep':'#3b4d6b',
    '--g-accent-bg':'#1b2230','--g-shadow':'0 8px 28px rgba(0,0,0,.7)' } },
  neon:{ name:'Neon', fx:{ border:'glow', ghost:'flicker', tabs:'pill', progress:'ekg' }, tokens:{
    '--g-bg':'#0a0b0f','--g-bg-deep':'#060709','--g-surface':'#101218','--g-surface-2':'#0d0f14',
    '--g-surface-3':'#14161d','--g-hover':'#171a26','--g-border':'#1f2230','--g-border-2':'#2b2f45',
    '--g-text':'#d8dbea','--g-accent':'#22d3ee','--g-accent-text':'#67e8f9','--g-accent-deep':'#0e7490',
    '--g-accent-bg':'#0b1b22','--g-shadow':'0 0 24px rgba(34,211,238,.25), 0 10px 32px rgba(0,0,0,.7)' } },
  clay:{ name:'Clay', fx:{ ghost:'float', tabs:'pill' }, tokens:{
    '--g-bg':'#17161a','--g-surface':'#221f26','--g-surface-2':'#1c1a20','--g-surface-3':'#27242c',
    '--g-hover':'#2a2731','--g-border':'#322e38','--g-border-2':'#423d4a','--g-text':'#d9d4de',
    '--g-accent':'#f19a7e','--g-accent-text':'#ffc4ae','--g-accent-deep':'#9a4a35',
    '--g-accent-bg':'#2a1e1e','--g-radius':'16px','--g-shadow':'0 12px 30px rgba(0,0,0,.55)' } },
  liquid:{ name:'Liquid', fx:{ border:'aurora', surface:'sheen', ghost:'halo', tabs:'underline', progress:'shimmer' }, tokens:{
    '--g-bg':'rgba(18,22,30,.55)','--g-bg-deep':'rgba(10,13,20,.6)','--g-surface':'rgba(30,36,48,.55)',
    '--g-surface-2':'rgba(24,29,40,.5)','--g-surface-3':'rgba(36,43,58,.55)','--g-hover':'rgba(52,62,84,.6)',
    '--g-border':'rgba(140,170,220,.28)','--g-border-2':'rgba(160,190,240,.4)','--g-text':'#e8edf7',
    '--g-muted':'#93a0bd','--g-accent':'#8fd0ff','--g-accent-text':'#c9e7ff','--g-accent-deep':'#1e6fae',
    '--g-accent-bg':'rgba(60,110,170,.22)','--g-blur':'16px','--g-shadow':'0 16px 48px rgba(10,20,40,.55)',
    '--g-aur1':'#9bd8ff','--g-aur2':'#c3b2ff','--g-aur3':'#8fffe0' } },
  oled:{ name:'OLED', fx:{ border:'glow', ghost:'glow', progress:'ekg' }, tokens:{
    '--g-bg':'#000000','--g-bg-deep':'#000000','--g-surface':'#0b0b0e','--g-surface-2':'#08080a',
    '--g-surface-3':'#101014','--g-hover':'#15151b','--g-border':'#1d1d24','--g-border-2':'#2a2a34',
    '--g-text':'#e6e6ee','--g-text-mid':'#9a9aa8','--g-muted':'#6a6a78','--g-accent':'#7c8cff',
    '--g-accent-text':'#aeb8ff','--g-accent-deep':'#2e37b8','--g-accent-bg':'#0e1030',
    '--g-shadow':'0 0 0 1px #14141a, 0 14px 34px rgba(0,0,0,.9)' } },
  paper:{ name:'Paper', fx:{ tabs:'underline' }, tokens:{
    '--g-bg':'#f5f1e8','--g-bg-deep':'#ece7db','--g-surface':'#efe9dc','--g-surface-2':'#f2ede2',
    '--g-surface-3':'#e9e2d2','--g-hover':'#e3dcc9','--g-border':'#d6cdb8','--g-border-2':'#c4b99f',
    '--g-text':'#2a261f','--g-text-mid':'#5c564a','--g-text-dim':'#8a8271','--g-text-hot':'#141210',
    '--g-text-low':'#6e6759','--g-text-faint':'#938b7a','--g-text-ghost':'#a89f8d','--g-muted':'#7a715f',
    '--g-accent':'#6d4fc4','--g-accent-text':'#4c2f9e','--g-accent-deep':'#6d4fc4','--g-accent-bg':'#e9e1f7',
    '--g-ok':'#176b41','--g-ok-deep':'#9cc9ae','--g-ok-bg':'#dff0e5','--g-warn':'#946200','--g-err':'#b3442e',
    '--g-shadow':'0 10px 28px rgba(90,80,60,.35)' } },
  hud:{ name:'HUD', fx:{ border:'glow', ghost:'flicker', tabs:'underline', progress:'ekg' }, tokens:{
    '--g-bg':'#050708','--g-bg-deep':'#000000','--g-surface':'#0a0f10','--g-surface-2':'#080c0d',
    '--g-surface-3':'#0d1415','--g-hover':'#101a1c','--g-border':'#123033','--g-border-2':'#1a464b',
    '--g-text':'#bdf5f7','--g-text-mid':'#5f9498','--g-muted':'#3f6367','--g-accent':'#22e0e6',
    '--g-accent-text':'#8ff2f5','--g-accent-deep':'#0e6a6f','--g-accent-bg':'#04191b',
    '--g-shadow':'0 0 0 1px #123033, 0 10px 30px rgba(0,0,0,.8)' } },
  nova:{ name:'Nova', fx:{ border:'aurora', ghost:'halo', tabs:'pill', progress:'shimmer', surface:'sheen' }, tokens:{
    '--g-bg':'#14101f','--g-bg-deep':'#0c0a17','--g-surface':'#1d1830','--g-surface-2':'#181428',
    '--g-surface-3':'#241d3a','--g-hover':'#2b2245','--g-border':'#2f2650','--g-border-2':'#3d3268',
    '--g-text':'#e9def0','--g-muted':'#9080ad','--g-accent':'#ec4fa0','--g-accent-text':'#ff9fd0',
    '--g-accent-deep':'#7a2160','--g-accent-bg':'#2a1330','--g-shadow':'0 14px 42px rgba(70,30,90,.5)',
    '--g-aur1':'#ec4fa0','--g-aur2':'#8b5cf6','--g-aur3':'#38bdf8' } },
  ion:{ name:'Ion', fx:{ surface:'sheen', ghost:'halo', tabs:'pill' }, tokens:{
    '--g-bg':'#18191a','--g-bg-deep':'#101112','--g-surface':'#212324','--g-surface-2':'#1c1e1f',
    '--g-surface-3':'#26282a','--g-hover':'#2b2e30','--g-border':'#323536','--g-border-2':'#454849',
    '--g-text':'#d6dadb','--g-muted':'#7a8082','--g-accent':'#2dd4dc','--g-accent-text':'#8fe9ed',
    '--g-accent-deep':'#116d72','--g-accent-bg':'#132325','--g-radius':'10px',
    '--g-shadow':'0 8px 26px rgba(0,0,0,.75)' } },
  flow:{ name:'Flow', fx:{ tabs:'pill' }, tokens:{
    '--g-bg':'#131722','--g-bg-deep':'#0d1019','--g-surface':'#1a2030','--g-surface-2':'#161b28',
    '--g-surface-3':'#1e2536','--g-hover':'#232b3f','--g-border':'#28324a','--g-border-2':'#334060',
    '--g-text':'#d8dfef','--g-muted':'#6d7896','--g-accent':'#38bdf8','--g-accent-text':'#93d9fb',
    '--g-accent-deep':'#0d6ba8','--g-accent-bg':'#0f2740','--g-blur':'0px',
    '--g-shadow':'0 6px 20px rgba(0,0,0,.4)' } }
};
const SKIN = {
  LIMIT_BYTES: 8*1024,
  VAL_MAX: 240,
  _bad: /url\s*\(|expression\s*\(|@import|javascript:|[<>{};]/i,
  /* Validate untrusted skin input (string or object). Unknown tokens and
     unknown fx are DROPPED, never fatal — this is the forward-compat rule. */
  validate(raw) {
    let o = raw;
    if (typeof raw === 'string') {
      if (raw.length > this.LIMIT_BYTES) return { ok:false, error:'file too large' };
      try { o = JSON.parse(raw); } catch(_) { return { ok:false, error:'not valid JSON' }; }
    }
    if (!o || typeof o !== 'object' || Array.isArray(o) || (o.kind && o.kind !== 'skin'))
      return { ok:false, error:'not a skin file' };
    const name = String(o.name || 'Custom').replace(/[<>&"'`]/g,'').slice(0,40) || 'Custom';
    const tokens = {}; let dropped = 0;
    const tsrc = (o.tokens && typeof o.tokens === 'object') ? o.tokens : {};
    for (const [k,v] of Object.entries(tsrc)) {
      if (!(k in SKIN_TOKENS)) { dropped++; continue; }
      const val = String(v).trim();
      if (!val || val.length > this.VAL_MAX || this._bad.test(val)) { dropped++; continue; }
      tokens[k] = val;
    }
    const fx = {}; const fsrc = (o.fx && typeof o.fx === 'object') ? o.fx : {};
    for (const [k,v] of Object.entries(fsrc)) {
      if (SKIN_FX[k] && SKIN_FX[k].includes(v)) fx[k] = v; else dropped++;
    }
    return { ok:true, skin:{ kind:'skin', gitlSkin:1, name, tokens, fx }, dropped };
  },
  _hexToHsl(hex) {
    let h = hex.replace('#',''); if (h.length === 3) h = h.split('').map(c=>c+c).join('');
    const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), l = (mx+mn)/2;
    if (mx === mn) return [0,0,Math.round(l*100)];
    const d = mx-mn, s = l > .5 ? d/(2-mx-mn) : d/(mx+mn);
    let hu = mx===r ? (g-b)/d + (g<b?6:0) : mx===g ? (b-r)/d + 2 : (r-g)/d + 4;
    return [Math.round(hu*60), Math.round(s*100), Math.round(l*100)];
  },
  /* Rotate a hex color to hue h, preserving its own saturation/lightness.
     Non-hex values pass through untouched. */
  hueShift(val, h) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(val))) return val;
    const [,s,l] = this._hexToHsl(val);
    return `hsl(${((h%360)+360)%360} ${s}% ${l}%)`;
  },
  baseHue() {
    const sk = this.resolve();
    return this._hexToHsl(sk.tokens['--g-accent'] || SKIN_TOKENS['--g-accent'])[0];
  },
  resolve() {
    const id = GHOST.ui.skinTheme;
    if (id === 'custom') {
      const r = this.validate(GHOST.ui.customSkin || '');
      return r.ok ? r.skin : SKIN_PRESETS.classic;
    }
    return SKIN_PRESETS[id] || SKIN_PRESETS.classic;
  },
  /* Apply active skin to the panel root. Only sets CSS custom properties
     and enumerated data-fx-* attributes — never touches structure. */
  apply() {
    try {
      const p = (typeof panel !== 'undefined' && panel) ? panel : document.getElementById('gitl');
      if (!p) return;
      const sk = this.resolve();
      for (const k of Object.keys(SKIN_TOKENS)) {
        const v = sk.tokens[k];
        if (v != null) p.style.setProperty(k, v); else p.style.removeProperty(k);
      }
      const h = GHOST.ui.accentHue;
      if (Number.isFinite(h)) {
        for (const k of ['--g-accent','--g-accent-text','--g-accent-deep','--g-accent-bg'])
          p.style.setProperty(k, this.hueShift(sk.tokens[k] || SKIN_TOKENS[k], h));
      }
      for (const k of Object.keys(SKIN_FX)) {
        const dk = 'fx' + k[0].toUpperCase() + k.slice(1);
        const v = sk.fx && sk.fx[k];
        if (v && v !== 'none') p.dataset[dk] = v; else delete p.dataset[dk];
      }
    } catch(e) { DIAG.push('skin apply: ' + e.message); }
  },
  importFile() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,.gitl.json,application/json';
    inp.addEventListener('change', () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      if (file.size > this.LIMIT_BYTES) { GHOST.loop.detail = `⚠ Skin too large (max ${Math.round(this.LIMIT_BYTES/1024)} KB)`; render(); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const res = this.validate(String(reader.result || ''));
        if (!res.ok) { GHOST.loop.detail = `⚠ Skin import failed: ${res.error}`; render(); return; }
        GHOST.ui.customSkin = JSON.stringify(res.skin); _save('customSkin', GHOST.ui.customSkin);
        GHOST.ui.skinTheme = 'custom'; _save('skinTheme','custom');
        this.apply();
        GHOST.loop.detail = `✓ Skin “${res.skin.name}” applied` + (res.dropped ? ` · ${res.dropped} field(s) ignored` : '');
        render();
      };
      reader.onerror = () => { GHOST.loop.detail = '⚠ Could not read skin file'; render(); };
      reader.readAsText(file);
    });
    inp.click();
  },
  exportCurrent() {
    const sk = this.resolve();
    const out = { kind:'skin', gitlSkin:1, name:sk.name, tokens:sk.tokens, fx:sk.fx||{} };
    downloadText(JSON.stringify(out, null, 2),
      `${String(sk.name||'skin').toLowerCase().replace(/\W+/g,'-')}.gitl.json`, 'application/json');
  }
};

/* ═══════════════════════════════════════════════════════════════
   UI — STYLES
   Deferred: GM_addStyle / appendChild require document.head, which is
   null at document-start. Called inside safeBoot() once DOM exists.
   ═══════════════════════════════════════════════════════════════ */
let _stylesInjected = false;
function injectStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const css = `\n#gitl{--g-bg:#111214;--g-bg-deep:#0c0d10;--g-surface:#18191c;--g-surface-2:#16171b;--g-surface-3:#1c1d22;--g-hover:#222329;--g-border:#27282e;--g-border-2:#2e2f35;--g-text:#c9cad0;--g-text-mid:#888;--g-text-dim:#555;--g-muted:#6b7280;--g-accent:#818cf8;--g-accent-text:#a5b4fc;--g-accent-deep:#3730a3;--g-accent-bg:#1a1b2e;--g-ok:#34d399;--g-ok-deep:#064e3b;--g-ok-bg:#052e1c;--g-warn:#fbbf24;--g-err:#f87171;--g-radius:12px;--g-shadow:0 10px 32px rgba(0,0,0,.65);--g-font:'SF Mono','Cascadia Code','JetBrains Mono','Fira Mono',monospace;--g-text-hot:#fff;--g-text-low:#666;--g-text-faint:#444;--g-text-ghost:#333;--g-blur:0px;--g-aur1:transparent;--g-aur2:transparent;--g-aur3:transparent}\n#gitl{backdrop-filter:blur(var(--g-blur));-webkit-backdrop-filter:blur(var(--g-blur))}\n#gitl[data-fx-border="aurora"]::before,#gitl[data-fx-border="glow"]::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none}\n#gitl[data-fx-border="aurora"],#gitl[data-fx-border="glow"]{border-color:transparent}\n#gitl[data-fx-border="aurora"]::before{background:linear-gradient(120deg,var(--g-aur1),var(--g-aur2),var(--g-aur3),var(--g-aur1));background-size:300% 100%;animation:gaur 14s linear infinite;opacity:.6}\n#gitl[data-run="1"][data-fx-border="aurora"]::before{animation-duration:5s;opacity:1}\n#gitl[data-fx-border="glow"]::before{background:linear-gradient(120deg,transparent 35%,var(--g-accent) 50%,transparent 65%);background-size:280% 100%;animation:gbreath 7s ease-in-out infinite;opacity:.5}\n#gitl[data-run="1"][data-fx-border="glow"]::before{animation:gaur 4.5s linear infinite;opacity:.95}\n#gitl .g-ghost{display:inline-block}\n#gitl[data-fx-ghost="float"] .g-ghost{animation:gfloat 3.2s ease-in-out infinite}\n#gitl[data-fx-ghost="flicker"] .g-ghost{animation:gflick 5s linear infinite}\n#gitl[data-run="1"][data-fx-ghost="flicker"] .g-ghost{animation-duration:2.4s}\n#gitl[data-fx-ghost="halo"] .g-ghost{animation:ghalo 4.5s ease-in-out infinite}\n#gitl[data-run="1"][data-fx-ghost="halo"] .g-ghost{animation-duration:2s}\n#gitl[data-fx-ghost="glow"] .g-ghost{filter:drop-shadow(0 0 5px var(--g-accent))}\n#gitl[data-run="1"][data-fx-ghost="glow"] .g-ghost{animation:ghalo 2.2s ease-in-out infinite}\n#gitl[data-fx-tabs="underline"] .g-tab{background:transparent;border-color:transparent;border-radius:0;position:relative}\n#gitl[data-fx-tabs="underline"] .g-tab:hover{background:var(--g-hover)}\n#gitl[data-fx-tabs="underline"] .g-tab.act{background:transparent;border-color:transparent;color:var(--g-accent-text)}\n#gitl[data-fx-tabs="underline"] .g-tab.act::after{content:"";position:absolute;left:14%;right:14%;bottom:-2px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,var(--g-accent),transparent)}\n#gitl[data-fx-tabs="pill"] .g-tab{border-radius:999px}\n#gitl[data-fx-progress="shimmer"] .g-fill{background:linear-gradient(90deg,var(--g-accent-deep),var(--g-accent),var(--g-accent-deep));background-size:220% 100%;animation:gaur 3.5s linear infinite}\n#gitl[data-run="1"][data-fx-progress="shimmer"] .g-fill{animation-duration:1.8s}\n#gitl[data-fx-progress="ekg"] .g-trk{position:relative;overflow:hidden}\n#gitl[data-fx-progress="ekg"] .g-trk::after{content:"";position:absolute;top:0;bottom:0;left:0;width:16%;background:linear-gradient(90deg,transparent,var(--g-accent),transparent);opacity:.45;animation:gekg 2.6s ease-in-out infinite}\n#gitl[data-run="1"][data-fx-progress="ekg"] .g-trk::after{opacity:.9;animation-duration:1.2s}\n#gitl[data-fx-surface="sheen"]::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.05) 50%,transparent 58%);background-size:280% 100%;animation:gsheen 11s linear infinite;opacity:.7}\n#gitl[data-run="1"][data-fx-surface="sheen"]::after{animation-duration:5s;opacity:1}\n@keyframes gaur{0%{background-position:0% 50%}100%{background-position:300% 50%}}\n@keyframes gbreath{0%,100%{opacity:.3}50%{opacity:.75}}\n@keyframes gflick{0%,88%,92%,100%{opacity:1}90%{opacity:.35}95%{opacity:.7}}\n@keyframes ghalo{0%,100%{filter:drop-shadow(0 0 2px var(--g-accent))}50%{filter:drop-shadow(0 0 8px var(--g-accent))}}\n@keyframes gekg{0%{transform:translateX(-110%)}100%{transform:translateX(740%)}}\n@keyframes gsheen{0%{background-position:130% 0}100%{background-position:-50% 0}}\n#gitl[data-explain="1"] #g-explain-tog{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}\n#gitl[data-explain="1"] .g-body{cursor:help}\n.g-xtip{position:absolute;left:8px;right:8px;top:54px;z-index:9;background:var(--g-surface-3);border:1px solid var(--g-accent-deep);border-radius:7px;padding:6px 22px 7px 8px;font-size:9.5px;line-height:1.45;color:var(--g-text);box-shadow:var(--g-shadow)}\n.g-xtip b{color:var(--g-accent-text)}\n.g-xtip .x{position:absolute;top:4px;right:7px;cursor:pointer;color:var(--g-muted);font-size:10px}\n@media (prefers-reduced-motion:reduce){#gitl,#gitl *,#gitl::before,#gitl::after{animation:none!important}}\n@keyframes gfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes gin{from{opacity:0;transform:translateY(5px) scale(.985)}}
#gitl.g-enter{animation:gin .18s ease-out}
#gitl{position:fixed;z-index:2147483647;width:268px;max-width:calc(100vw - 16px);background:var(--g-bg);border:1px solid var(--g-border);
  border-radius:var(--g-radius);padding:10px 12px;font:11.5px var(--g-font);
  color:var(--g-text);box-shadow:var(--g-shadow);user-select:none;transition:width .2s}
#gitl *{box-sizing:border-box}
#gitl.collapsed .g-body{display:none} #gitl.collapsed{width:auto;min-width:180px}
.g-body{max-height:min(52vh,380px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--g-border-2) transparent}
.g-body::-webkit-scrollbar{width:4px}.g-body::-webkit-scrollbar-thumb{background:var(--g-border-2);border-radius:2px}
.g-adv{width:100%;padding:4px 0;margin:4px 0;border:none;border-top:1px dashed var(--g-border);background:transparent;color:var(--g-text-dim);font-size:9px;cursor:pointer;text-align:center;font-family:inherit;font-weight:600}
.g-adv:hover{color:var(--g-text-mid)}
.g-mod{border:1px solid var(--g-border);border-radius:8px;background:var(--g-surface-2);margin:5px 0;overflow:hidden}
.g-mod-h{display:flex;align-items:center;gap:5px;padding:3px 7px;background:var(--g-surface-3);border-bottom:1px solid var(--g-border);font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--g-text-mid)}
.g-mod-i{font-size:10px;filter:grayscale(.25)}
.g-mod-x{margin-left:auto;font-weight:600;letter-spacing:0;text-transform:none;color:var(--g-text-low);font-size:8.5px;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.g-mod .g-btns,.g-mod .g-prog,.g-mod .g-row,.g-mod .g-hint,.g-mod .g-posture-wrap{margin:0;padding:5px 7px}
.g-mod .g-hint{padding-top:0}
.g-mod-transport .g-btns{gap:5px}
.g-swatches{display:flex;gap:5px;margin:2px 0 6px}
.g-swatch{width:15px;height:15px;border-radius:50%;border:1px solid rgba(255,255,255,.25);cursor:pointer;padding:0;flex-shrink:0}
.g-swatch:hover{transform:scale(1.15)}
.g-xlist{display:flex;flex-direction:column;gap:5px;margin:6px 0}
.g-xrow{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;cursor:pointer;background:var(--g-surface-2);box-shadow:inset 0 1px 3px rgba(0,0,0,.45),inset 0 -1px 0 rgba(255,255,255,.02);border-left:3px solid transparent;transition:background .15s}
.g-xrow:hover{background:var(--g-hover)}
.g-xrow:active{box-shadow:inset 0 2px 5px rgba(0,0,0,.55)}
.g-xicon{flex-shrink:0;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border-radius:6px;background:var(--g-surface-3)}
.g-xtext{display:flex;flex-direction:column;gap:1px;min-width:0}
.g-xtext b{font-size:10.5px;color:var(--g-text)}
.g-xtext span{font-size:8.5px;color:var(--g-text-mid);line-height:1.3}
.g-xrow-accent{border-left-color:var(--g-accent)}.g-xrow-accent .g-xicon{color:var(--g-accent-text)}
.g-xrow-ok{border-left-color:var(--g-ok)}.g-xrow-ok .g-xicon{color:var(--g-ok)}
.g-xrow-warn{border-left-color:var(--g-warn)}.g-xrow-warn .g-xicon{color:var(--g-warn)}
.g-xrow-muted{border-left-color:var(--g-muted)}.g-xrow-muted .g-xicon{color:var(--g-muted)}
.g-hdr{display:flex;justify-content:space-between;align-items:center;cursor:grab;padding:2px 0;margin-bottom:6px}
.g-hdr:active{cursor:grabbing}
.g-logo{font-weight:800;font-size:10.5px;text-transform:uppercase;color:var(--g-text-dim);letter-spacing:.6px;display:flex;align-items:center;gap:5px}
.g-dot{display:inline-block;width:7px;height:7px;border-radius:50%;transition:all .3s}
.g-dot.run{background:var(--g-ok);box-shadow:0 0 5px var(--g-ok);animation:gpulse 1.4s infinite}
.g-dot.pause{background:var(--g-warn)}.g-dot.done{background:var(--g-accent)}.g-dot.err{background:var(--g-err)}.g-dot.idle{background:var(--g-text-dim)}
@keyframes gpulse{0%,100%{opacity:1}50%{opacity:.4}}
.g-plat{font-size:9.5px;background:var(--g-surface-3);padding:2px 6px;border-radius:4px;color:var(--g-accent);font-weight:600;border:1px solid #2a2b33}
.g-minbtn{background:var(--g-surface);border:1px solid var(--g-border-2);color:var(--g-text-mid);font-size:10px;cursor:pointer;padding:1px 6px;border-radius:4px;font-weight:700;transition:all .15s}
.g-minbtn.spin{animation:gvspin .6s linear}
.g-minbtn:hover{background:var(--g-border);color:var(--g-text-hot)}
.g-coll-row{display:none;align-items:center;gap:6px;margin-top:4px}
#gitl.collapsed .g-coll-row{display:flex}
.g-qbtn{width:34px;height:26px;border:1px solid var(--g-border);border-radius:6px;font-size:13px;cursor:pointer;transition:all .15s}
.g-qbtn.play{background:var(--g-ok-bg);color:var(--g-ok);border-color:var(--g-ok-deep)}.g-qbtn.pause{background:#2d1900;color:var(--g-warn);border-color:#78350f}
.g-qstat{font-size:10px;font-weight:700}
.g-proj{display:flex;align-items:center;gap:5px;margin-bottom:7px;padding:5px 7px;background:var(--g-surface-2);border:1px solid var(--g-border);border-radius:7px}
.g-proj-lbl{font-size:9px;color:var(--g-text-faint);flex-shrink:0}
.g-proj-in{flex:1;background:transparent;border:none;color:var(--g-accent-text);font-size:10px;font-family:inherit;font-weight:600;outline:none;min-width:0}
.g-proj-in::placeholder{color:var(--g-text-ghost)}
.g-tabs{display:flex;gap:3px;margin-bottom:8px}
.g-tab{flex:1;padding:4px 0;border:1px solid var(--g-border);border-radius:5px;background:var(--g-surface);color:var(--g-text-dim);font-size:8.5px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s;font-family:inherit}
.g-tab:hover{background:var(--g-hover);color:var(--g-text-mid)}.g-tab.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
#g-tc{position:relative}
.g-tabhelp{position:absolute;top:-2px;right:0;width:16px;height:16px;line-height:14px;text-align:center;border:1px solid var(--g-border-2);border-radius:50%;background:var(--g-surface-2);color:var(--g-muted);font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;padding:0;z-index:3}
.g-tabhelp:hover{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-modes{display:flex;gap:3px;margin-bottom:6px}
.g-md{flex:1;padding:5px 0;border:1px solid var(--g-border);border-radius:6px;background:var(--g-surface);color:var(--g-text-low);font-size:9px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s;font-family:inherit}
.g-md:hover{background:var(--g-hover)}.g-md.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-hint{font-size:9px;color:#484a57;margin-bottom:7px;padding:4px 6px;background:var(--g-surface-2);border-radius:4px;border-left:2px solid var(--g-border);line-height:1.4}
.g-posture-wrap{margin-bottom:7px}
.g-posture-lbl{font-size:8.5px;text-transform:uppercase;letter-spacing:.5px;color:#4a4d57;font-weight:600;margin-bottom:3px;display:flex;align-items:center;gap:5px}
.g-posture-q{width:14px;height:14px;line-height:12px;text-align:center;border:1px solid var(--g-border-2);border-radius:50%;background:var(--g-surface-2);color:var(--g-muted);font-size:9px;font-weight:700;cursor:pointer;font-family:inherit;padding:0}
.g-posture-q:hover{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-postures{display:flex;gap:3px}
.g-pst{flex:1;padding:5px 0;border:1px solid var(--g-border);border-radius:6px;background:var(--g-surface);color:var(--g-text-low);font-size:9px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s;font-family:inherit}
.g-pst:hover{background:var(--g-hover)}.g-pst.act{background:#1f1a2e;border-color:#6d28d9;color:#c4b5fd}
.g-posture-hint{font-size:8.5px;color:#5a5d68;line-height:1.4;margin-top:4px;padding:3px 6px;background:#141519;border-radius:4px;border-left:2px solid #3a2e5a}
.g-btns{display:flex;gap:3px;margin-bottom:7px}
.g-btn{flex:1;padding:7px 0;border:1px solid var(--g-border);border-radius:7px;background:var(--g-surface);color:#999;font-size:14px;cursor:pointer;text-align:center;transition:all .15s;font-family:inherit}
.g-btn:hover{background:var(--g-hover)}
.g-btn.go{background:var(--g-ok-bg);border-color:var(--g-ok-deep);color:var(--g-ok)}.g-btn.go:hover{background:var(--g-ok-deep)}
.g-btn.rg{background:#1a1a2e;border-color:#312e81;color:var(--g-accent-text)}.g-btn.rg:hover{background:#312e81}
.g-dim{opacity:.35;cursor:not-allowed;pointer-events:none}
.g-plink{color:var(--g-accent);text-decoration:none;font-size:9px;margin-left:4px}.g-plink:hover{text-decoration:underline}
.g-cust-badge{font-size:8px;color:#f59e0b;font-weight:400}
.g-btn.st{background:#2d0a0a;border-color:#7f1d1d;color:var(--g-err)}.g-btn.st:hover{background:#7f1d1d}
.g-prog{margin:2px 0 6px}
.g-trk{height:5px;background:var(--g-surface-3);border-radius:2px;overflow:hidden}
.g-fill{height:100%;background:linear-gradient(90deg,var(--g-ok),var(--g-accent));border-radius:2px;transition:width .4s}
.g-plbl{display:flex;justify-content:space-between;align-items:baseline;margin-top:3px}
.g-step{font-size:11px;color:var(--g-text)}.g-step b{font-size:13px;color:#e7e7ea;font-weight:700}
.g-step-pct{font-size:10px;color:#777}
.g-safety{margin-top:6px;padding:5px 7px;background:#141519;border:1px solid #20212a;border-radius:6px}
.g-safety-row{display:flex;align-items:center;gap:6px;font-size:8.5px}
.g-safety-lbl{color:#4a4d57;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.g-safety-num{margin-left:auto;color:var(--g-muted)}.g-safety-num b{color:#9ca3af}
.g-safety-rst{flex:0 0 auto;width:16px;height:16px;line-height:14px;text-align:center;border:1px solid #2a2c35;border-radius:4px;background:var(--g-surface-2);color:var(--g-muted);font-size:10px;cursor:pointer;font-family:inherit;padding:0}
.g-safety-rst:hover{background:var(--g-surface-3);color:var(--g-accent-text);border-color:var(--g-accent-deep)}
.g-safety-trk{height:2px;background:var(--g-surface-3);border-radius:1px;overflow:hidden;margin-top:4px}
.g-safety-fill{height:100%;background:#3a3d47;border-radius:1px;transition:width .4s}
.g-safety.warn{border-color:#5a4420;background:#1f1808}
.g-safety.warn .g-safety-num b,.g-safety.warn .g-safety-lbl{color:#fcd34d}
.g-safety.warn .g-safety-fill{background:#f59e0b}
.g-safety.off{opacity:.5;border-color:var(--g-surface-3)}
.g-safety.off .g-safety-lbl{color:var(--g-text-dim)}
.g-safety-edit{width:42px;background:var(--g-bg-deep);border:1px solid var(--g-border-2);border-radius:4px;color:var(--g-text);font-size:10px;text-align:center;font-family:inherit;padding:2px 3px;margin-left:4px}
.g-safety-edit:focus{border-color:#4338ca;outline:none}
.g-stat{text-align:center;font-weight:600;font-size:10.5px;padding:4px 0;border-top:1px solid var(--g-surface-3);margin-top:2px}
.g-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--g-text-low);margin-bottom:5px}
.g-row label{color:var(--g-text-dim)}
.g-row input[type="number"],.g-row input[type="text"]{background:var(--g-surface);border:1px solid var(--g-border-2);border-radius:4px;color:var(--g-text);font-size:10px;padding:2px 5px;font-family:inherit}
.g-row input[type="number"]{width:52px;text-align:center}.g-row input[type="text"]{width:110px}
.g-row input:focus{outline:none;border-color:#4338ca}
.g-row select{background:var(--g-surface);border:1px solid var(--g-border-2);border-radius:4px;color:var(--g-text);font-size:10px;padding:2px 4px;font-family:inherit}
.g-tog{width:28px;height:14px;background:var(--g-border-2);border-radius:7px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
.g-tog.on{background:var(--g-ok-deep)}
.g-tog::after{content:'';width:10px;height:10px;background:var(--g-text-low);border-radius:50%;position:absolute;top:2px;left:2px;transition:left .2s,background .2s}
.g-tog.on::after{left:16px;background:var(--g-ok)}
.g-pos-row{display:flex;gap:3px}
.g-pos{background:var(--g-surface);border:1px solid var(--g-border-2);color:#777;font-size:11px;width:22px;height:20px;cursor:pointer;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.g-pos:hover{background:var(--g-border);color:var(--g-text-hot)}.g-pos.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-exp-btn{width:100%;padding:8px;background:var(--g-ok-bg);border:1px solid var(--g-ok-deep);border-radius:7px;color:var(--g-ok);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:2px;text-align:center;transition:all .15s}
.g-exp-btn:hover{background:var(--g-ok-deep)}
.g-div{height:1px;background:var(--g-surface-3);margin:7px 0}
.g-diag{font-size:9px;color:var(--g-text-faint);line-height:1.6;padding:5px 6px;background:var(--g-bg-deep);border:1px solid var(--g-border);border-radius:5px;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
.g-sites{width:100%;box-sizing:border-box;background:var(--g-bg-deep);border:1px solid var(--g-border);border-radius:5px;color:#9aa;font-size:9px;font-family:monospace;padding:5px 6px;margin-bottom:4px;resize:vertical}
.g-btn-sm{padding:3px 8px;margin-top:5px;border:1px solid var(--g-accent-deep);border-radius:5px;background:var(--g-accent-bg);color:var(--g-accent-text);font-size:9px;cursor:pointer;font-family:inherit;font-weight:600}
.g-btn-sm:hover{background:#222345}
.g-qrow{display:flex;align-items:center;gap:5px;margin-bottom:4px}
.g-qin{flex:1;min-width:0;background:var(--g-bg-deep);border:1px solid var(--g-border);border-radius:5px;color:#aab;font-size:9.5px;padding:4px 6px;font-family:inherit}
.g-qin:focus{border-color:var(--g-accent-deep);outline:none}
.g-qdel{border:none;background:transparent;color:var(--g-text-faint);cursor:pointer;font-size:10px;padding:2px}
.g-qdel:hover{color:#e66}
.g-qtext{flex:1;font-size:9.5px;color:#999;line-height:1.4;word-break:break-word}
.g-qtext.done{color:#4a5;text-decoration:line-through;text-decoration-color:#2a3}
.g-hpills{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px}
.g-hpill{padding:3px 7px;border:1px solid var(--g-border);border-radius:10px;background:var(--g-surface);color:var(--g-text-low);font-size:8.5px;cursor:pointer;font-family:inherit;font-weight:600}
.g-hpill.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-support{text-align:center;font-size:8px;color:#3a3b40;margin-top:8px;padding-top:6px;border-top:1px solid var(--g-surface-3)}
.g-support a{color:#4a4b55;text-decoration:none}
.g-support a:hover{color:var(--g-accent-text)}
#gitl-veil{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;background:rgba(8,9,12,.62);backdrop-filter:blur(2px);font-family:-apple-system,'Segoe UI',Roboto,sans-serif;border:none;padding:0;margin:0;width:100vw;height:100vh;max-width:none;max-height:none;overflow:hidden}
/* Popover top-layer mode: renders above ALL host stacking contexts */
#gitl-veil:popover-open{display:flex}
#gitl-veil::backdrop{background:rgba(8,9,12,.62);backdrop-filter:blur(2px)}
.gv-card{position:relative;background:var(--g-bg);border:1px solid var(--g-border);border-radius:14px;padding:22px 26px;width:240px;text-align:center;box-shadow:0 12px 48px rgba(0,0,0,.6);z-index:1}
/* ── Ghost field (3D-ish parallax). Compositor-only transforms — no JS loop. */
.gv-ringwrap{position:relative;width:96px;height:72px;margin:0 auto 12px;perspective:340px;transform-style:preserve-3d}
.gv-ring{position:absolute;top:4px;left:50%;width:60px;height:60px;margin-left:-30px;border:3px solid #25262c;border-top-color:var(--g-accent-text);border-radius:50%;animation:gvspin 1s linear infinite;opacity:.9}
.gv-ghost{position:absolute;top:50%;left:50%;font-size:30px;line-height:1;transform:translate(-50%,-50%);animation:gvbob 2s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));z-index:2}
/* extra ghosts only appear in full-motion mode */
.gv-ghost-x{position:absolute;top:50%;left:50%;font-size:18px;line-height:1;opacity:0;pointer-events:none;will-change:transform,opacity}
#gitl-veil.gv-rich .gv-ghost-x{opacity:1}
#gitl-veil.gv-rich .gv-gx1{animation:gvz1 3.2s ease-in-out infinite}
#gitl-veil.gv-rich .gv-gx2{animation:gvz2 3.8s ease-in-out infinite .5s}
#gitl-veil.gv-rich .gv-gx3{animation:gvz3 4.4s ease-in-out infinite 1s}
#gitl-veil.gv-rich .gv-ring{animation-duration:1.4s}
#gitl-veil.gv-rich .gv-ghost{animation:gvbob3d 2.6s ease-in-out infinite}
@keyframes gvspin{to{transform:rotate(360deg)}}
@keyframes gvbob{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 4px))}}
@keyframes gvbob3d{0%,100%{transform:translate(-50%,-50%) scale(1) rotateY(0deg)}50%{transform:translate(-50%,calc(-50% - 5px)) scale(1.06) rotateY(18deg)}}
/* zoom-in/out depth passes — translateZ + scale read as 3D */
@keyframes gvz1{0%,100%{transform:translate(-150%,-90%) translateZ(-120px) scale(.5);opacity:0}40%{opacity:.55}60%{opacity:.55}50%{transform:translate(-140%,-60%) translateZ(60px) scale(1.1)}}
@keyframes gvz2{0%,100%{transform:translate(60%,-120%) translateZ(-140px) scale(.45);opacity:0}45%{opacity:.5}55%{opacity:.5}50%{transform:translate(70%,-70%) translateZ(50px) scale(1.05)}}
@keyframes gvz3{0%,100%{transform:translate(20%,30%) translateZ(-100px) scale(.55);opacity:0}40%{opacity:.45}60%{opacity:.45}50%{transform:translate(30%,40%) translateZ(70px) scale(1.15)}}
@media (prefers-reduced-motion: reduce){
  #gitl-veil.gv-rich .gv-ghost-x{animation:none;opacity:0}
  #gitl-veil.gv-rich .gv-ghost{animation:gvbob 2s ease-in-out infinite}
  .gv-ring{animation:gvspin 1.4s linear infinite} }
.gv-title{color:#e7e7ea;font-size:12px;font-weight:700;margin-bottom:8px}
.gv-steps{text-align:left;margin:0 auto 10px;display:inline-block}
.gv-step{font-size:9.5px;color:var(--g-text-dim);line-height:1.8}
.gv-step.act{color:var(--g-accent-text)}.gv-step.done{color:#4a5}
.gv-barwrap{height:5px;background:var(--g-surface-3);border-radius:3px;overflow:hidden;margin-bottom:5px}
.gv-bar{height:100%;background:linear-gradient(90deg,#6366f1,var(--g-accent-text));border-radius:3px;width:0;transition:width .25s}
.gv-bar.indet{animation:gvslide 1.2s ease-in-out infinite}
@keyframes gvslide{0%{margin-left:-40%}100%{margin-left:100%}}
.gv-pct{font-size:9px;color:#777;height:12px;margin-bottom:6px}
.gv-note{font-size:8.5px;color:var(--g-text-low);margin-bottom:10px}
.gv-cancel{padding:4px 14px;border:1px solid #3a2a2a;border-radius:6px;background:#1c1416;color:#c88;font-size:9px;cursor:pointer;font-family:inherit}
.gv-cancel:hover{background:#241719}
#gitl.pos-dock{border-radius:10px 0 0 10px;border-right:none;width:268px}
#gitl.pos-dock.collapsed{width:44px!important;min-width:0}
#gitl.pos-dock.collapsed .g-hdr{flex-direction:column;padding:10px 4px;gap:6px}
#gitl.pos-dock.collapsed .g-hdr > span:last-child{flex-direction:column}
#gitl.pos-dock.collapsed .g-plat{display:none}
#gitl.pos-dock.collapsed .g-minbtn:not(#g-col){display:none}
#gitl.pos-dock.collapsed #g-col{font-size:14px;padding:4px 8px}
#gitl.pos-dock.collapsed .g-logo{writing-mode:vertical-rl;font-size:11px}
#gitl.pos-dock.collapsed .g-coll-row{flex-direction:column;padding:4px 2px;gap:6px}
#gitl.pos-dock.collapsed .g-qbtn{width:36px;height:36px;font-size:16px;border-radius:8px}
#gitl.pos-dock.collapsed .g-qstat{display:none}
.g-dock-stat{display:none;font-size:9px;font-weight:700;text-align:center;color:var(--g-text-mid);line-height:1.2;word-break:break-all}
#gitl.pos-dock.collapsed .g-dock-stat,#gitl.pos-dock-left.collapsed .g-dock-stat{display:block}
.g-dk-drift{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:3px}
.g-dk-cap{font-size:7.5px;color:var(--g-text-low);letter-spacing:.02em}
.g-dk-bar{display:block;width:32px;height:4px;margin:0 auto 3px;background:var(--g-surface-3);border-radius:2px;overflow:hidden}
.g-dk-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--g-ok),var(--g-accent));border-radius:2px;transition:width .4s}
.g-dk-edit{width:34px;height:18px;background:var(--g-bg-deep);border:1px solid var(--g-border-2);border-radius:3px;color:var(--g-text);font-size:9px;text-align:center;font-family:inherit;padding:0}
.g-dk-edit:focus{border-color:#4338ca;outline:none}
.g-dk-rst{background:var(--g-surface);border:1px solid var(--g-border-2);color:var(--g-text-mid);font-size:10px;cursor:pointer;padding:1px 6px;border-radius:3px;line-height:1}
.g-dk-rst:hover{background:var(--g-border);color:var(--g-text-hot)}
/* Gold left-dock: mirror geometry to the left edge + gold accents. Our own
   element in the top stacking context — never injected into the host's menu. */
#gitl.pos-dock-left{left:0;right:auto;border-radius:0 10px 10px 0;border-left:none;border-right:1px solid #5a4a1e}
#gitl.pos-dock-left.collapsed .g-hdr{flex-direction:column;padding:10px 4px;gap:6px}
#gitl.pos-dock-left.collapsed .g-minbtn:not(#g-col){display:none}
#gitl.pos-dock-left.collapsed #g-col{font-size:14px;padding:4px 8px}
#gitl.pos-dock-left{border-color:#5a4a1e;box-shadow:0 10px 32px rgba(120,90,10,.28)}
#gitl.pos-dock-left .g-logo{color:#e8c66a}
#gitl.pos-dock-left.collapsed .g-logo{writing-mode:vertical-rl;font-size:13px;color:#f0cd6e;letter-spacing:1px}
#gitl.pos-dock-left.collapsed .g-qbtn{width:36px;height:36px;font-size:16px;border-radius:8px}
#gitl.pos-dock-left .g-dot{box-shadow:0 0 6px rgba(232,198,106,.6)}
.g-pos-gold{color:#e8c66a!important}
.g-pos-gold.act{background:#2a2410!important;border-color:#5a4a1e!important}
.g-diag .ok{color:var(--g-ok)}.g-diag .warn{color:var(--g-err)}
.g-persona-btn{width:100%;text-align:left;padding:5px 7px;margin-bottom:3px;border:1px solid var(--g-border);border-radius:6px;background:var(--g-surface);color:var(--g-text);font-family:inherit;font-size:10px;cursor:pointer;transition:all .15s}
.g-persona-btn.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:#c7d2fe}
.g-persona-btn .plbl{font-weight:700;color:#9ca3af}.g-persona-btn.act .plbl{color:var(--g-accent-text)}
.g-persona-btn .pdesc{font-size:9px;color:var(--g-muted);line-height:1.4;margin-top:1px}
.g-cust-badge{color:#e8c66a;font-size:9px}
.g-del{float:right;color:#7a5050;font-size:10px;padding:0 3px;border-radius:3px;cursor:pointer}
.g-del:hover{background:#3a1f1f;color:#e0a0a0}
.g-ws-bar{display:flex;gap:5px;margin-top:8px;padding-top:7px;border-top:1px solid var(--g-surface-3)}
.g-ws-btn{flex:1;padding:5px 0;border:1px solid #2a2c35;border-radius:5px;background:var(--g-surface-2);color:#8b8ea3;font-size:9px;font-weight:600;cursor:pointer;font-family:inherit}
.g-ws-btn:hover{background:var(--g-accent-bg);border-color:var(--g-accent-deep);color:var(--g-accent-text)}
.g-ws-form{margin-top:6px;padding:7px;background:#141519;border:1px solid #2a2c35;border-radius:6px}
.g-ws-in,.g-ws-ta{width:100%;margin-bottom:5px;padding:5px 6px;background:#0e0f12;border:1px solid #2a2c35;border-radius:4px;color:var(--g-text);font-family:inherit;font-size:9.5px;box-sizing:border-box}
.g-ws-ta{resize:vertical;line-height:1.4}
.g-ws-form-btns{display:flex;gap:5px}.g-ws-form-btns .g-btn-sm{flex:1;margin-top:0}
.g-wf-desc{font-size:9px;color:#7a7d88;line-height:1.45;background:var(--g-surface-2);border:1px solid var(--g-border);border-radius:5px;padding:6px;margin-bottom:7px}
.g-wf-how{font-size:9px;color:#9ca3af;line-height:1.5;background:#16171f;border:1px solid #2a2c3a;border-radius:6px;padding:7px 8px;margin-bottom:8px}
.g-wf-how b{color:#c7d2fe}
.g-wf-start{width:100%;font-size:12px;padding:8px 0;margin-bottom:2px}
.g-wf-start.g-dim{opacity:.4;cursor:default}
.g-wf-progress{font-size:9px;color:#7a7d88;text-align:center;margin:6px 0 2px}.g-wf-progress b{color:var(--g-accent-text)}
.g-wf-stage{display:flex;align-items:stretch;gap:6px;padding:5px 6px;margin-bottom:3px;background:var(--g-surface-2);border:1px solid var(--g-border);border-radius:5px}
.g-wf-stage-txt{flex:1;font-size:9px;line-height:1.45;color:#7a7d88}
.g-wf-stage b{color:#8b8ea3}.g-wf-stage.act{background:var(--g-accent-bg);border-color:var(--g-accent-deep)}.g-wf-stage.act .g-wf-stage-txt,.g-wf-stage.act b{color:#c7d2fe}
.g-wf-ins{flex:0 0 auto;width:20px;border:1px solid var(--g-accent-deep);border-radius:4px;background:var(--g-accent-bg);color:var(--g-accent-text);font-size:8px;font-weight:700;letter-spacing:.5px;cursor:pointer;font-family:inherit;writing-mode:vertical-rl;text-orientation:mixed;padding:4px 0;transition:all .15s}
.g-wf-ins:hover{background:#26284a}
.g-wf-ins.ins-ok{background:#14532d;border-color:#16a34a;color:#86efac}
.g-peek-btn{font-size:9px;color:#3a3b44;cursor:pointer;text-align:center;margin-top:5px;padding-top:4px;border-top:1px solid var(--g-surface-3)}
.g-peek-btn:hover{color:#777}
.g-peek{display:none;margin-top:4px;padding:5px;background:var(--g-bg-deep);border:1px solid var(--g-border);border-radius:5px;font-size:9px;line-height:1.5;color:#48505e;white-space:pre-wrap;max-height:140px;overflow-y:auto}
.g-peek.open{display:block}
.g-shortcuts{font-size:8.5px;color:var(--g-text-ghost);text-align:center;margin-top:4px}
.g-firstrun{padding:6px 8px;background:var(--g-accent-bg);border:1px solid var(--g-accent-deep);border-radius:6px;font-size:9.5px;color:var(--g-accent-text);line-height:1.4;margin-bottom:7px;text-align:center}
.g-report{margin-top:6px;padding:7px 9px;background:#241719;border:1px solid #5a2e2e;border-radius:7px}
.g-report-h{font-size:10px;font-weight:700;color:#f1b4b4;display:flex;align-items:center;gap:6px}
.g-report-k{font-size:8px;font-weight:600;color:#c88;background:#1c1416;border:1px solid #3a2a2a;border-radius:4px;padding:1px 5px}
.g-report-b{font-size:9px;color:#caa;line-height:1.4;margin:4px 0 6px}
.g-report-preview{margin:5px 0;font-size:8.5px;color:#d6a4a4}
.g-report-preview summary{cursor:pointer;color:#e0a0a0}
.g-report-preview textarea{box-sizing:border-box;width:100%;height:110px;margin-top:4px;padding:5px;resize:vertical;background:#120f11;border:1px solid #43292d;border-radius:4px;color:#c9b8bb;font:8px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace}
.g-report-btns{display:flex;gap:5px;margin-top:5px}
.g-report-btns .g-btn-sm{margin-top:0;border-color:#5a2e2e;background:#1c1416;color:#e0a0a0;flex:1}
.g-limit{margin:6px 0;padding:8px 9px;background:#231a0c;border:1px solid #5a4420;border-radius:7px;text-align:center}
.g-limit-h{font-size:10px;font-weight:700;color:#fcd34d}
.g-limit-b{font-size:9px;color:#caa968;line-height:1.4;margin:3px 0 7px}
.g-limit .g-btn.go{width:100%;font-size:11px;padding:7px 0}
.g-limit-btns{display:flex;flex-direction:column;gap:5px}
.g-limit-btns .g-btn{width:100%;font-size:10.5px;padding:6px 0}
.g-limit-btns .g-btn.rg{background:#152a22;border-color:#1e5a44;color:#6ee7b7}
.g-limit-btns .g-btn.rg:hover{background:#1a3a2e}
.g-limit-btns .g-btn.st{background:#241719;border-color:#5a2e2e;color:#e0a0a0}
@keyframes gpulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.5)}50%{box-shadow:0 0 0 5px rgba(245,158,11,0)}}
.pulse{animation:gpulse 1.4s ease-in-out infinite}
.g-qbtn.limit{background:#f59e0b;color:#1a1205;animation:gpulse 1.4s ease-in-out infinite}
#gitl.pos-bb{bottom:0!important;left:0!important;right:0!important;width:100%!important;border-radius:10px 10px 0 0!important;top:auto!important}
`;
  try {
    GM_addStyle(css);
  } catch (e) {
    /* GM_addStyle itself can throw if head is null — inject manually with fallback */
    try {
      const style = document.createElement('style');
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    } catch (e2) {
      console.error('[GITL] style injection failed:', e2);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   UI — RENDER + TABS
   panel element is created at top level (safe — no DOM tree needed),
   but attached to document.body inside safeBoot() (body may be null
   at document-start).
   ═══════════════════════════════════════════════════════════════ */
const panel = document.createElement('div');
panel.id = 'gitl';
let _panelMounted = false;
/* ── EXPLAIN MODE (d9) — tap ⓘ, then tap any control for a one-breath answer.
   Registry-driven; capture-phase intercept swallows the click so nothing fires. */
const EXPLAIN = [
  { sel:'#g-play',        name:'▶ Start / Resume',  desc:'Begins (or resumes) the auto-continue loop using the current Strategy and Thinking posture.' },
  { sel:'#g-pause',       name:'⏸ Pause',           desc:'Stops auto-continuing. The chat is untouched — press ▶ to pick up where you left off.' },
  { sel:'#g-reground',    name:'⊕ Reground',        desc:'Re-anchors the AI to the ORIGINAL task. Use it the moment answers drift off-topic.' },
  { sel:'#g-stop',        name:'✕ End & reset',     desc:'Ends the run and resets rounds, roadmap position and workflow stage.' },
  { sel:'#g-strategy',    name:'Strategy',          desc:'Step by step = one nudge per reply. Plan first = the AI batches a plan, then executes. Autopilot = the AI writes a roadmap and Ghost runs every step.' },
  { sel:'#g-drift-tog',   name:'Drift guard',       desc:'Auto-pauses after N continues so an unattended run can\u2019t wander. The checkpoint asks: continue, reground, or stop.' },
  { sel:'#g-drift-max',   name:'Drift limit',       desc:'The N — how many auto-continues before the drift checkpoint fires.' },
  { sel:'#g-cnt-reset',   name:'↻ Reset counter',   desc:'Resets the used-continues count without ending the run.' },
  { sel:'#run-adv',       name:'Advanced',          desc:'Power tools: Thinking posture (Locked / Adaptive / Audit), the injected-prompt preview, End & reset, and diagnostics.' },
  { sel:'#g-posture-help',name:'Thinking posture',  desc:'Controls whether the AI\u2019s plan may grow: Locked = exact plan \u00b7 Adaptive = may add justified steps mid-run \u00b7 Audit = locked plan + one final gap-review.' },
  { sel:'.g-pst',         name: el => 'Posture: ' + ((POSTURES[el.dataset.pst]||{}).label||''), desc: el => (POSTURES[el.dataset.pst]||{}).desc || '' },
  { sel:'#g-peek-btn',    name:'What gets injected',desc:'Shows the exact instruction block Ghost appends to your prompt for the current Strategy.' },
  { sel:'#g-handoff',     name:'🤝 Handoff',        desc:'The AI writes its own briefing for a fresh chat. Best choice while the current chat STILL RESPONDS.' },
  { sel:'#g-export',      name:'⬇ Export',          desc:'Downloads the full transcript. The complete record of the four export actions — for keeping, not for resuming.' },
  { sel:'#g-capsule',     name:'💊 Capsule v2',       desc:'A resumable JSON snapshot with dedup + a resume token — built for feeding back into an API or another tool, not for reading.' },
  { sel:'#g-rescue',      name:'🧷 Backup Handoff',   desc:'Handoff\u2019s calmer, lighter sibling — for when the chat is DEAD and can\u2019t write its own briefing. A state snapshot + the last 10 messages verbatim, enough to resume elsewhere. Smaller than a full export on purpose.' },
  { sel:'#exp-think',     name:'💭 Thinking logs',  desc:'Include the model\u2019s visible reasoning/thinking sections in the export, on platforms that expose them.' },
  { sel:'#exp-fmt',       name:'Export format',     desc:'Markdown for humans, JSON for tools.' },
  { sel:'#cfg-unattended',name:'🌙 Unattended',      desc:'Normally Ghost pauses when you switch tabs, so it can\u2019t burn tokens unwatched. Turn this on to keep running in a background tab \u2014 it also switches to a Worker-based timer that browsers don\u2019t throttle. The tab must stay OPEN; this does not run on a server.' },
  { sel:'#cfg-skin',      name:'🎨 Skin',           desc:'Visual theme. Skins are pure style tokens — they can never add, remove, or change features.' },
  { sel:'#cfg-skin-imp',  name:'⬆ Import skin',     desc:'Load a .gitl.json skin file. Anything a skin isn\u2019t allowed to do is silently dropped.' },
  { sel:'#cfg-skin-exp',  name:'⬇ Export skin',     desc:'Save the active skin as .gitl.json — edit it in any text editor and re-import. That\u2019s the whole modding loop.' },
  { sel:'#cfg-hue',       name:'Accent hue',        desc:'Tints the active skin\u2019s accent family. Double-click resets to the skin\u2019s own hue.' },
  { sel:'.g-swatch',      name:'Color swatch',       desc:'One-tap accent colors — same effect as dragging the hue slider to that spot.' },
  { sel:'.g-tab',         name: el => 'Tab: ' + (el.textContent||'').trim(), desc: () => 'Switches the panel section. The ? button gives the full guide for whichever tab is open.' },
  { sel:'#g-tabhelp',     name:'? Tab guide',       desc:'Opens the full walkthrough for the current tab.' }
];
function _explainLookup(target) {
  if (!target || !target.closest) return null;
  for (const e of EXPLAIN) {
    const hit = target.closest(e.sel);
    if (hit) return {
      name: typeof e.name === 'function' ? e.name(hit) : e.name,
      desc: typeof e.desc === 'function' ? e.desc(hit) : e.desc
    };
  }
  return null;
}
function _explainShow(info) {
  let tip = panel.querySelector('.g-xtip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'g-xtip'; panel.appendChild(tip); }
  tip.innerHTML = _TT(`<span class="x" id="g-xtip-x">✕</span><b>${info.name}</b><br>${info.desc}`);
}
function _explainIntercept(e) {
  const t = e.target;
  if (t && t.closest && t.closest('#g-explain-tog')) {
    e.preventDefault(); e.stopPropagation();
    GHOST.ui.explain = !GHOST.ui.explain;
    panel.dataset.explain = GHOST.ui.explain ? '1' : '0';
    const tip = panel.querySelector('.g-xtip');
    if (!GHOST.ui.explain) { if (tip) tip.remove(); }
    else _explainShow({ name:'🔎 Explain mode', desc:'Tap any button or control to see what it does — nothing will activate. Tap ⓘ again to exit.' });
    return;
  }
  if (!GHOST.ui.explain) return;
  if (t && t.closest && t.closest('#g-xtip-x')) { e.preventDefault(); e.stopPropagation(); const tip = panel.querySelector('.g-xtip'); if (tip) tip.remove(); return; }
  e.preventDefault(); e.stopPropagation();
  _explainShow(_explainLookup(t) || { name:'—', desc:'No note for this one yet — the ? button has the full tab guide.' });
}

function mountPanel() {
  if (_panelMounted || !document.body) return;
  // Defense-in-depth: if a stray #gitl exists (e.g. script eval'd twice in a
  // test harness that bypasses the __GITL_V8__ guard), remove it first.
  const existing = document.getElementById('gitl');
  if (existing && existing !== panel) existing.remove();
  _panelMounted = true;
  document.body.appendChild(panel);
  // Smoother load: 180ms entrance instead of pop-in. Animation-only — ends at
  // the natural resting state, so nothing downstream can depend on it.
  try { panel.classList.add('g-enter'); setTimeout(() => panel.classList.remove('g-enter'), 400); } catch(_) {}
  panel.addEventListener('click', _explainIntercept, true); // capture: explain mode swallows clicks before handlers
}

/* Escape untrusted text before interpolating into innerHTML templates.
   Custom/imported persona & workflow text flows through here so a crafted
   label/inject/stage can never inject markup into Ghost's own panel. */
function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function dotClass() {
  const s = GHOST.loop.state;
  return s==='RUNNING'?'run':s==='PAUSED'?'pause':s==='COMPLETE'?'done':s==='ERROR'?'err':'idle';
}
function statColor() {
  const s = GHOST.loop.state;
  return s==='RUNNING'?'#34d399':s==='PAUSED'?'#fbbf24':s==='LIMIT'?'#f59e0b':s==='COMPLETE'?'#818cf8':s==='ERROR'?'#f87171':'#555';
}
function statLabel() {
  const L = GHOST.loop;
  if (L.state==='IDLE') return L.detail || 'Ready — type a prompt and press ▶';
  if (L.state==='RUNNING') return L.detail || `Round ${L.round} / ${L.maxRounds}`;
  if (L.state==='PAUSED') return L.detail || 'Paused';
  if (L.state==='LIMIT') return L.detail || `Hit ${L.maxRounds} auto-continues — ▶ for ${L.limitStep} more`;
  if (L.state==='COMPLETE') return L.detail || 'Complete';
  return L.detail || L.state;
}

function renderRunTab() {
  const L = GHOST.loop, p = L.lastProgress, pct = p ? Math.round((p.step/p.total)*100) : 0;
  const pm = L.payloadMode;
  const runAdv = GHOST.ui.runAdv || false;
  const peekOpen = panel.querySelector('.g-peek')?.classList.contains('open');
  const firstRun = GHOST.ui.firstRun;
  const idle = L.state==='IDLE'||L.state==='COMPLETE';
  const activeP = (GHOST.persona.selected||[]).filter(s=>s&&s!=='none');
  const pLabel = activeP.length>1?'Committee: '+activeP.map(s=>(allPersonas()[s]||{}).label||s).join(', '):activeP.length===1?(allPersonas()[activeP[0]]||{}).label||'':'';
  return `
    ${firstRun ? `<div class="g-firstrun"><b>👻 Quick start</b><br>1. Type your task in the chat box<br>2. Press ▶ — Ghost auto-continues until done<br>3. Walk away ☕<br><button class="g-btn-sm" id="g-onb-done">Got it</button></div>` : ''}
    ${pLabel?`<div class="g-hint" style="border-left-color:#6d28d9">♙ ${_esc(pLabel)}${GHOST.persona.perTask?' · per-task':''}${GHOST.persona.finalReview?' · final review':''} <a href="#" class="g-plink" id="g-goto-personas">edit</a></div>`:''}
    ${L.state==='LIMIT' ? `<div class="g-limit"><div class="g-limit-h">⏸ Drift checkpoint — ${L.maxRounds} auto-continues reached</div><div class="g-limit-b">A grounding pause so the run cannot wander off-task unattended.</div><div class="g-limit-btns"><button class="g-btn go pulse" id="g-limit-go">▶ Continue ${L.limitStep} more</button><button class="g-btn rg" id="g-limit-reground">⊕ Reground</button><button class="g-btn st" id="g-limit-wait">✋ Stop &amp; wait</button></div></div>` : ''}
    <div class="g-mod g-mod-transport">
      <div class="g-mod-h"><span class="g-mod-i">🎛</span>Transport<span class="g-mod-x" style="color:${statColor()}">${statLabel()}</span></div>
    <div class="g-btns">
      <button class="g-btn go${L.state==='LIMIT'?' pulse':''}" id="g-play" title="Start / Resume (Alt+P)">▶ ${L.state==='PAUSED'?'Resume':'Start'}</button>
      <button class="g-btn${idle?' g-dim':''}" id="g-pause" title="Pause auto-continue (Alt+P)">⏸ Pause</button>
      <button class="g-btn st${idle?' g-dim':''}" id="g-stop" title="Stop automation and preserve progress (Alt+S)">■ Stop</button>
    </div>
    </div>
    <div class="g-mod g-mod-prog">
      <div class="g-mod-h"><span class="g-mod-i">📊</span>Progress<span class="g-mod-x">${p?pct+'%':'—'}</span></div>
    <div class="g-prog">
      <div class="g-trk"><div class="g-fill" style="width:${pct}%"></div></div>
      <div class="g-plbl">
        <span class="g-step">${p?`${pm==='think'?'Batch':'Step'} <b>${p.step}</b> / ${p.total}${p.desc?' — '+p.desc.slice(0,22):''}` : (L.state==='RUNNING'||L.state==='LIMIT'?`Round <b>${L.round}</b>`:'Waiting…')}</span>
        <span class="g-step-pct">${p?pct+'%':''}</span>
      </div>
      ${(L.state==='RUNNING'||L.state==='PAUSED'||L.state==='LIMIT') ? (()=>{
        const left = Math.max(0, L.maxRounds - L.round);
        const lowpct = L.maxRounds ? (left / L.maxRounds) * 100 : 100;
        const warn = L.driftEnabled && left <= 5;
        const off = !L.driftEnabled;
        return `<div class="g-safety${warn?' warn':''}${off?' off':''}" title="${off?'Drift guard OFF — loop runs without a cap.':'Drift guard: auto-pauses after this many continues.'}">
          <div class="g-safety-row">
            <div class="g-tog${L.driftEnabled?' on':''}" id="g-drift-tog"></div>
            <span class="g-safety-lbl">drift guard</span>
            <span class="g-safety-num">${off?'OFF':'<b>'+left+'</b> left'}</span>
            <input type="number" class="g-safety-edit" id="g-drift-max" value="${L.maxRounds}" min="1" max="999">
            <button class="g-safety-rst" id="g-cnt-reset">↻</button>
          </div>
          ${!off?`<div class="g-safety-trk"><div class="g-safety-fill" style="width:${lowpct}%"></div></div>`:''}
        </div>`;
      })() : ''}
    </div>
    </div>
    <div class="g-detect" style="font-size:8.5px;color:#555;margin-top:2px">● ${PLAT?PLAT.label:'—'} · ${PAYLOADS[pm].label} · ${(POSTURES[L.posture]||POSTURES.standard).label}${L.state!=='IDLE'?' · R'+L.round:''}</div>
    ${GHOST.report ? `<div class="g-report">
      <div class="g-report-h">⚠ Trouble report ready <span class="g-report-k">${_esc(GHOST.report.kind)}</span></div>
      <div class="g-report-b">${_esc((GHOST.report.detail||'').slice(0,120))}</div>
      ${L.sendTxn?.state === 'uncertain' ? `<div class="g-report-b">Nothing was resent. Check the conversation:</div><div class="g-report-btns"><button class="g-btn-sm" id="g-send-seen">✓ I see it in chat</button><button class="g-btn-sm" id="g-send-manual">Leave for manual Send</button></div>` : ''}
      <details class="g-report-preview"><summary>Review redacted contents</summary><textarea readonly spellcheck="false">${_esc(GHOST.report.text || '')}</textarea></details>
      <div class="g-report-btns"><button class="g-btn-sm" id="g-rep-copy">📋 Copy</button><button class="g-btn-sm" id="g-rep-dl">⇩ Download</button></div>
      <div class="g-report-btns"><button class="g-btn-sm" id="g-rep-issue">↗ Review &amp; report bug</button><button class="g-btn-sm" id="g-rep-x" style="background:#18191c">Dismiss</button></div>
    </div>` : ''}
    <button class="g-adv" id="run-adv">${runAdv?'Advanced ▴':'Advanced ▾'}</button>
    ${runAdv ? `
    <div class="g-mod g-mod-adv">
      <div class="g-mod-h"><span class="g-mod-i">🧭</span>Strategy<span class="g-mod-x">${PAYLOADS[pm].label}</span></div>
    <div class="g-row"><label>Strategy</label><select id="g-strategy" style="width:120px"><option value="loop"${pm==='loop'?' selected':''}>Step by step</option><option value="think"${pm==='think'?' selected':''}>Plan first</option><option value="roadmap"${pm==='roadmap'?' selected':''}>Autopilot</option></select></div>
    <div class="g-hint">${PAYLOADS[pm].hint}</div>
    </div>
    <div class="g-mod g-mod-adv">
      <div class="g-mod-h"><span class="g-mod-i">🧠</span>Thinking<span class="g-mod-x">${(POSTURES[L.posture]||POSTURES.standard).label}</span></div>
    <div class="g-posture-wrap">
      <div class="g-posture-lbl">Thinking <button class="g-posture-q" id="g-posture-help">?</button></div>
      <div class="g-postures">
        <button class="g-pst${L.posture==='standard'?' act':''}" data-pst="standard">${POSTURES.standard.label}</button>
        <button class="g-pst${L.posture==='evolving'?' act':''}" data-pst="evolving">${POSTURES.evolving.label}</button>
        <button class="g-pst${L.posture==='extended'?' act':''}" data-pst="extended">${POSTURES.extended.label}</button>
      </div>
    </div>
    </div>
    <div class="g-peek-btn" id="g-peek-btn">${peekOpen?'▾ Hide prompt':'▸ What gets injected'}</div>
    <div class="g-peek${peekOpen?' open':''}" id="g-peek">${PAYLOADS[pm].preview}</div>
    <div class="g-btns" style="margin-top:5px">
      <button class="g-btn" id="g-reground" title="Re-anchor AI to the original task">⊕ Reground</button>
      <button class="g-btn st" id="g-reset" title="Clear run state and start over">↻ Reset session</button>
    </div>
    ` : ''}
    <div class="g-shortcuts">v${VER} · Alt+P toggle · Alt+S stop</div>`;
}

function renderFlowTab() {
  const wf = allWorkflows()[GHOST.workflow.selected] || WORKFLOW_LIBRARY.none;
  const opts = Object.entries(allWorkflows()).map(([k,v]) => `<option value="${_esc(k)}"${GHOST.workflow.selected===k?' selected':''}>${v.custom?'★ ':''}${_esc(v.label)}</option>`).join('');
  const isManual = GHOST.workflow.selected === 'none' || !wf.stages.length;
  const running = GHOST.loop.state === 'RUNNING';
  const stages = wf.stages.length
    ? wf.stages.map((s,i) => `
        <div class="g-wf-stage${i===GHOST.workflow.stageIndex&&GHOST.workflow.active?' act':''}">
          <div class="g-wf-stage-txt"><b>Stage ${i+1}</b><br>${_esc(s.slice(0,120))}${s.length>120?'…':''}</div>
          <button class="g-wf-ins" data-ins="${i}" title="Insert just this stage's prompt into the chat box">INSERT</button>
        </div>`).join('')
    : '<div style="font-size:9px;color:#555;padding:4px 0">Manual mode — no preset stages. Use the Run tab instead.</div>';
  const creating = GHOST.ui.wsNewWorkflow;
  const form = creating ? `
    <div class="g-ws-form">
      <input class="g-ws-in" id="ws-w-label" placeholder="Workflow name (e.g. Spec Review)" maxlength="40">
      <input class="g-ws-in" id="ws-w-desc" placeholder="One-line description (optional)" maxlength="200">
      <textarea class="g-ws-ta" id="ws-w-stages" placeholder="One stage per line. Each line becomes a stage prompt, run in order." rows="5" maxlength="8000"></textarea>
      <div class="g-ws-form-btns"><button class="g-btn-sm" id="ws-w-save">✓ Save workflow</button><button class="g-btn-sm" id="ws-w-cancel" style="background:#18191c">Cancel</button></div>
    </div>` : `<button class="g-exp-btn" id="ws-w-new" style="margin-top:5px">＋ Create custom workflow</button>`;
  const delBtn = wf.custom ? `<button class="g-exp-btn" id="ws-w-del" data-confirm="0" style="margin-top:5px;background:#241719;border-color:#5a2e2e;color:#e0a0a0;font-size:9px">✕ Delete this custom workflow</button>` : '';
  const wsBar = `
    <div class="g-ws-bar">
      <button class="g-ws-btn" id="ws-import" title="Import a .gitl.json pack of personas & workflows">⬆ Import</button>
      <button class="g-ws-btn" id="ws-export" title="Export your custom personas & workflows to a shareable file">⬇ Export</button>
      <button class="g-ws-btn" id="ws-submit" title="Share your pack with the community">🌐 Share</button>
    </div>`;
  return `
    <div class="g-row"><label>Workflow</label><select id="wf-sel" style="width:118px">${opts}</select></div>
    <div class="g-wf-desc">${_esc(wf.desc)}</div>
    ${!isManual ? `
      <div class="g-wf-how">
        <b>How this works:</b> press <b>▶ Start</b> below and Ghost runs all ${wf.stages.length} stages in order, moving to the next each time the AI says it's done. Or tap a single stage's <b>INSERT</b> to drop just that prompt into the chat yourself.
        ${GHOST.workflow.pauseBetween ? '<br><br>⏸ <b>Pause between is ON</b> — Ghost stops after each stage so you can review or switch models, then press ▶ to continue.' : ''}
      </div>
      <button class="g-btn go g-wf-start${running?' g-dim':''}" id="wf-start"${running?' disabled':''}>▶ Start workflow</button>
      ${running||GHOST.workflow.active ? `<div class="g-btns" style="margin-top:4px"><button class="g-btn" id="wf-do-pause" title="Pause workflow">⏸</button><button class="g-btn st" id="wf-do-stop" title="Stop & reset workflow">✕ End</button></div>` : ''}
      <div class="g-row" style="margin-top:8px"><label>Pause between stages</label><div class="g-tog${GHOST.workflow.pauseBetween?' on':''}" id="wf-pause"></div></div>
      <div class="g-wf-progress">Stage <b>${wf.stages.length?(GHOST.workflow.stageIndex+1):'—'}</b> of ${wf.stages.length} ${GHOST.workflow.active?'· running':''}</div>
      <div class="g-div"></div>${stages}
      <button class="g-exp-btn" id="wf-reset" style="background:#18191c;border-color:#2e2f35;color:#999;margin-top:6px;font-size:9px">↺ Reset to stage 1</button>
      ${delBtn}
    ` : stages}
    ${form}${wsBar}`;
}

/* Maps each tab to its help section so a per-tab ? deep-links correctly. */
const TAB_HELP = { run:'run', auto:'auto', flow:'flow', personas:'roles', export:'export', settings:'setup' };

const HELP_SECTIONS = {
  start: { label: 'Start', html: `
    <b>What is Ghost?</b><br>You give the AI a big task. Ghost keeps pressing "continue" for you — through every step — until the AI says it's truly done.<br><br>
    <b>The 30-second version:</b><br>1. Type your task in the chat box<br>2. Press the big ▶<br>3. Walk away ☕<br><br>
    <b>How does it know when to stop?</b><br>Ghost teaches the AI two signals: <code>[[GITL::PROCEED]]</code> = "more to do", <code>[[GITL::HALT]]</code> = "finished". Ghost reads them and acts.` },
  run: { label: 'Run', html: `
    <b>The Run tab</b> is command center.<br><br>
    <b>Strategy dropdown:</b><br>· <b>Step by step</b> — AI works in batches, Ghost continues each one<br>· <b>Plan first</b> — AI plans before working, then batches<br>· <b>Autopilot</b> — AI researches, writes its own plan, Ghost runs every step<br><br>
    <b>Buttons:</b> ▶ start/resume · ⏸ pause · ⊕ reground (re-anchor AI to the original task if you see drift). Full stop is in Advanced ▾.<br><br>
    <b>Personas line:</b> shows your active persona or committee. Tap "edit" to jump to the Personas tab.<br><br>
    <b>Q: It stopped and shows "drift checkpoint"?</b><br>That's the drift guard catching a long run. It's a grounding pause so an unattended run cannot wander off-task. Three choices:<br>· <b>▶ Continue</b> — run more<br>· <b>⊕ Reground</b> — re-anchor the AI to the task it started on<br>· <b>✋ Stop &amp; wait</b> — pause for your instructions<br>You can edit the cap inline, toggle the guard off, or tap ↻ to reset.` },
  auto: { label: 'Auto', html: `
    <b>The Auto tab</b> = fire &amp; forget.<br><br>
    <b>Roadmap</b> (AI plans): pick Roadmap on Run, press ▶. The AI studies your task, writes a numbered plan, and Ghost executes every step + a final synthesis. Watch steps get ✓ here.<br><br>
    <b>Queue</b> (you plan): write your own steps — one box each, ＋ to add more — and hit ▶ Run queue.<br><br>
    <b>Q: Roadmap vs Workflow?</b><br><i>Workflow</i> = you know the recipe, same stages every time.<br><i>Roadmap</i> = the AI invents the plan for THIS task.<br>Example, "build a landing page": a workflow always runs draft→critique→refine; a roadmap might plan research→copy→HTML→styling→review, because that's what this task needed.` },
  flow: { label: 'Flow', html: `
    <b>The Flow tab</b> runs fixed multi-stage recipes (e.g. Draft → Critique → Polish).<br><br>
    <b>To run one:</b><br>1. Pick a workflow from the dropdown<br>2. Type your task in the chat box<br>3. Press <b>▶ Start workflow</b><br>Ghost runs every stage in order, advancing each time the AI HALTs.<br><br>
    <b>INSERT button</b> (the small vertical tab on each stage): drops just that one stage's prompt into the chat box, so you can run a single stage by hand instead of the whole sequence.<br><br>
    <b>Pause between stages:</b> OFF = Ghost runs start-to-finish. ON = Ghost stops after each stage so you can review — or switch the model (that's how <b>Lens Relay</b> works: swap model at each pause, press ▶ to continue).` },
  roles: { label: 'Personas', html: `
    <b>The Personas tab</b> shapes how the AI approaches your task.<br><br>
    <b>Basic:</b> pick a persona from the dropdown — Red Team attacks the work, Researcher digs deep, Devil's Advocate challenges every claim. The persona framing is injected into your first prompt.<br><br>
    <b>Committee mode</b> (toggle at top): select multiple personas. The AI simulates all perspectives on every response, then synthesizes a consensus with disagreements preserved.<br><br>
    <b>Per-task toggle:</b> re-inject the committee framing on every step, not just the first.<br>
    <b>Final review toggle:</b> after all work completes, the committee does one final review pass before halting.<br><br>
    <b>On Perplexity</b>, Round Table becomes a REAL round table: switch models between turns, each model gives independent assessment naming who goes next.` },
  export: { label: 'Export', html: `
    <b>Three buttons, three jobs:</b><br><br>
    <b>⬇ Export</b> — the full record. The whole conversation as a file (with 💭 thinking logs). For archiving and reading.<br><br>
    <b>🤝 Handoff</b> — moving to another model? Ghost asks THIS AI to write a structured briefing in-chat (mission, decisions, failures, next steps). Paste it into the new model. The AI's own summary beats a raw transcript — decisions don't get buried.<br><br>
    <b>🧷 Backup Handoff</b> — the chat is full, stuck, or won't respond, so it can't write its own briefing (that's what Handoff normally does). Ghost writes a smaller one instead: state + last 10 messages verbatim + resumption instructions. Deliberately lighter than a full export — just enough to resume elsewhere.<br><br>
    <i>Working chat → Handoff (AI writes it, fullest briefing). Dead chat → Backup Handoff (Ghost writes it, lighter — Handoff's calmer sibling, not a separate emergency). Complete record → Export (fullest of all four, not for resuming — for keeping).</i>` },
  setup: { label: 'Setup', html: `
    <b>The Setup tab:</b><br>· <b>Max rounds</b> — drift-guard cap on auto-continues<br>· <b>Notify</b> — desktop alert when done (great with ☕)<br>· <b>Position</b> — corners, bottom bar, ▐ <b>Dock</b> (slim right-edge tab that never covers the chat), or ☰ <b>Gold menu</b> (the same slim tab on the left edge, opposite most sites' own menu, styled gold)<br>· <b>Unattended</b> — by default Ghost stops sending the moment the tab loses focus (a guard against burning tokens unwatched). Turn it on to keep a run going in a background tab; it also moves the loop onto a Web Worker timer, because browsers throttle background <code>setInterval</code> to about once a minute. The tab must remain open — closing the browser still ends the run. Drift guard and round limits still apply.<br>
· <b>Skin</b> — 13 presets (Classic, Aurora, Glass, Metal, Neon, Clay, Liquid, OLED, Paper, HUD, Nova, Ion, Flow) or Custom. Swatches or the slider tint the accent family on any of them. (import a .gitl.json skin file). Skins are pure style tokens: they can never add, remove, or change buttons and features, and old skins keep working on new GITL versions<br>· <b>Accent</b> — hue slider to tint the interface any color you want<br><br>
    <b>🔄 Re-detect (top of panel):</b> if Ghost says it can't find the chat box — common after switching between the browser and the app, or between tabs — tap 🔄. It re-finds the input without reloading the page, so you don't have to hop between chats to wake it up.<br><br>
    <b>Advanced ▾</b> hides the power tools: custom signal words, per-site selector overrides (Custom sites), and <b>Diagnostics → Probe</b>, which live-tests Ghost's connection to the page — your first stop when a platform misbehaves.` },
  posture: { label: 'Posture', html: `
    <b>Thinking posture = how much room the AI has to grow its own plan.</b> You pick it up front, like a reasoning dial — Ghost never guesses. It works with any mode (Loop / Think / Roadmap).<br><br>
    <b>Locked</b> (formerly Standard) — The AI does exactly the steps it declared, nothing more. Most predictable; best when you know the scope.<br><br>
    <b>Adaptive</b> (formerly Evolving) — the plan can <i>grow</i>: the AI may add steps <i>while working</i>, but only when it hits a real blocker or a gap that would otherwise make it fail the goal — and it must justify each addition in one line. It can't wander into unrelated topics, and it stays under the drift-guard ceiling.<br><br>
    <b>Audit</b> (formerly Extended) (a.k.a. <i>review</i>) — the AI runs the plan locked, then does <i>one</i> gap-check at the end: what's missing or unanswered against the original goal. It fills only genuinely valuable holes, then stops. If nothing's missing, it says so and halts.<br><br>
    All three keep the drift guard as the hard ceiling — if the AI hits it, it stops and reports the biggest unresolved gap instead of padding. <span style="color:#5a5d68">(Wording based on current best-practice research: OpenAI/Anthropic planning guidance, ReAct/Reflexion, Self-Refine, and agent guardrail patterns.)</span>` },
  workshop: { label: 'Workshop', html: `
    <b>Make Ghost yours — and share it.</b><br><br>
    <b>Custom personas</b> (Roles tab) and <b>custom workflows</b> (Flow tab) are yours to create. Tap <b>＋ Create</b>, give it a name and either a persona framing or one stage per line. Custom items show a ★ and sit right beside the built-ins.<br><br>
    <b>⬇ Export</b> bundles all your custom personas + workflows into one <code>.gitl.json</code> file. <b>⬆ Import</b> loads someone else's bundle — it only ever ADDS (your existing items and the built-ins are never overwritten; name clashes auto-rename).<br><br>
    <b>🌐 Share with the community:</b><br>· Post your <code>.gitl.json</code> in <b>GitHub Discussions</b>: <a href="https://github.com/MShneur/ghost-in-the-loop/discussions" target="_blank" rel="noopener" style="color:#a5b4fc">ghost-in-the-loop/discussions</a><br>· Or open an issue tagged <code>workshop</code> to suggest it for the built-in library<br><br>
    Good packs get folded into future releases so everyone benefits.` },
  feedback: { label: 'Feedback', html: `
    <b>Found a bug? Have an idea?</b><br><br>
    Open an issue: <a href="https://github.com/MShneur/ghost-in-the-loop/issues" target="_blank" rel="noopener" style="color:#a5b4fc">github.com/MShneur/ghost-in-the-loop</a><br><br>
    <b>Please include:</b><br>· Ghost version (v${VER}) and the platform<br>· What you did, what you expected, what happened<br>· Setup → Advanced → Diagnostics → <b>Probe</b> output — it tells us exactly what Ghost can and can't see<br><br>
    ⭐ A star on GitHub helps more people find Ghost.<br>
    ♡ And if Ghost saved you real time: <a href="${SUPPORT_URL}" target="_blank" rel="noopener" style="color:#a5b4fc">support its development</a> — entirely optional, it stays free either way.` }
};

function renderInfoTab() {
  const sec = GHOST.ui.helpSec || 'start';
  const pills = Object.entries(HELP_SECTIONS).map(([k, s]) =>
    `<button class="g-hpill${k===sec?' act':''}" data-h="${k}">${s.label}</button>`).join('');
  return `
    <div class="g-hpills">${pills}</div>
    <div class="g-hint" style="line-height:1.75;font-size:9.5px">${HELP_SECTIONS[sec].html}</div>
    <button class="g-btn-sm" id="g-info-back">← Back to Ghost</button>`;
}

function renderAutoTab() {
  const R = GHOST.roadmap;
  // Active roadmap → live progress rows with ✓ / ▶ / ·
  if (R.steps.length) {
    const rows = R.steps.map((s,i) => {
      const mark = i < R.index ? '<span class="ok" style="width:14px">✓</span>' : i === R.index ? '<span style="color:#a5b4fc;width:14px">▶</span>' : '<span style="color:#3a3b40;width:14px">·</span>';
      return `<div class="g-qrow">${mark}<span class="g-qtext${i<R.index?' done':''}">${i+1}. ${s.replace(/</g,'&lt;')}</span></div>`;
    }).join('');
    return `
      <div style="font-size:9px;color:#777;font-weight:700;margin-bottom:4px">🗺 ROADMAP — step ${Math.min(R.index+1,R.steps.length)} of ${R.steps.length}</div>
      <div style="max-height:170px;overflow-y:auto">${rows}</div>
      <button class="g-btn-sm" id="rm-clear">Clear roadmap</button>`;
  }
  // No roadmap → step editor: one input per step, + to add
  const d = GHOST.ui.qDraft;
  const rows = d.map((s,i) => `
    <div class="g-qrow">
      <span style="color:#555;width:14px;font-size:9px">${i+1}.</span>
      <input type="text" class="g-qin" data-qi="${i}" value="${(s||'').replace(/"/g,'&quot;')}" placeholder="Step ${i+1}…">
      <button class="g-qdel" data-qd="${i}">✕</button>
    </div>`).join('');
  return `
    <div class="g-hint">🗺 <b>Autopilot.</b> Pick <b>Roadmap</b> on the Run tab and press ▶ — the AI plans this task itself. Or write your own steps below; each gets a ✓ as it completes.</div>
    <div style="font-size:9px;color:#777;font-weight:700;margin:6px 0 4px">PROMPT QUEUE</div>
    ${rows}
    <div style="display:flex;gap:5px">
      <button class="g-btn-sm" id="q-add" style="flex:1;margin-top:4px">＋ Add step</button>
      <button class="g-btn-sm" id="q-start" style="flex:1;margin-top:4px">▶ Run queue</button>
    </div>`;
}

function renderPersonasTab() {
  const sel = GHOST.persona.selected || ['none'];
  const comm = GHOST.persona.committee;
  const creating = GHOST.ui.wsNewPersona;
  const allP = allPersonas();
  const activeP = sel.filter(s=>s&&s!=='none');

  // Basic: single persona selector with preview
  const opts = Object.entries(allP).map(([k,v]) => `<option value="${_esc(k)}"${!comm&&sel.includes(k)&&k!=='none'?' selected':''}>${v.custom?'★ ':''}${_esc(v.label)}</option>`).join('');
  const curKey = !comm && activeP.length===1 ? activeP[0] : null;
  const curP = curKey ? allP[curKey] : null;

  // Committee: multi-select rows
  const committeeRows = comm ? activeP.map((k,i) => {
    const p = allP[k];
    const rowOpts = Object.entries(allP).filter(([id])=>id!=='none').map(([id,v]) => `<option value="${_esc(id)}"${id===k?' selected':''}>${v.custom?'★ ':''}${_esc(v.label)}</option>`).join('');
    return `<div class="g-qrow"><select class="g-qin g-cm-sel" data-ci="${i}" style="flex:1">${rowOpts}</select><button class="g-qdel g-cm-del" data-ci="${i}">✕</button></div><div class="g-hint" style="margin-top:-2px;margin-bottom:5px;font-size:8.5px">${p?_esc(p.inject.slice(0,80))+(p.inject.length>80?'…':''):'Unknown persona'}</div>`;
  }).join('') : '';

  return `
    <div class="g-row"><label>Committee</label><div class="g-tog${comm?' on':''}" id="p-comm-tog" title="Toggle committee mode — select multiple personas"></div></div>
    ${!comm ? `
      <div class="g-row"><label>Persona</label><select id="p-single" style="width:130px"><option value="none"${activeP.length===0?' selected':''}>None</option>${opts}</select></div>
      ${curP ? `<div class="g-hint" style="line-height:1.6"><b>${_esc(curP.label)}</b>${curP.custom?' <span class="g-cust-badge">★ custom</span>':''}<br>${_esc(curP.inject.slice(0,200))}${curP.inject.length>200?'…':''}</div>` : '<div class="g-hint">No persona active — the AI uses its default behavior.</div>'}
      <button class="g-exp-btn" id="p-run" style="margin-top:4px">▶ Run with${curP?' '+_esc(curP.label):' persona'}</button>
    ` : `
      <div style="font-size:9px;color:#777;font-weight:700;margin:4px 0">COMMITTEE MEMBERS (${activeP.length})</div>
      ${committeeRows}
      <button class="g-btn-sm" id="p-cm-add" style="width:100%;margin-top:4px">＋ Add member</button>
      <div class="g-div"></div>
      <div class="g-row"><label>Per-task</label><div class="g-tog${GHOST.persona.perTask?' on':''}" id="p-pertask" title="Apply committee perspective to every step, not just the first"></div></div>
      <div class="g-row"><label>Final review</label><div class="g-tog${GHOST.persona.finalReview?' on':''}" id="p-review" title="Committee conducts a final review after all work is complete"></div></div>
      <div class="g-hint">Per-task = each step runs with the committee framing. Final review = after the last step, the committee reviews and synthesizes.</div>
      <button class="g-exp-btn" id="p-run" style="margin-top:4px">▶ Run with committee (${activeP.length})</button>
    `}
    <div class="g-div"></div>
    ${creating ? `
    <div class="g-ws-form">
      <input class="g-ws-in" id="ws-p-label" placeholder="Persona name (e.g. Legal Reviewer)" maxlength="40">
      <textarea class="g-ws-ta" id="ws-p-inject" placeholder="Persona framing — 'Adopt the persona of…'" rows="3" maxlength="4000"></textarea>
      <div class="g-ws-form-btns"><button class="g-btn-sm" id="ws-p-save">✓ Save persona</button><button class="g-btn-sm" id="ws-p-cancel" style="background:#18191c">Cancel</button></div>
    </div>` : `<button class="g-exp-btn" id="ws-p-new" style="margin-top:2px">＋ Create custom persona</button>`}
    <div class="g-ws-bar">
      <button class="g-ws-btn" id="ws-import">⬆ Import</button>
      <button class="g-ws-btn" id="ws-export">⬇ Export</button>
      <button class="g-ws-btn" id="ws-submit">🌐 Share</button>
    </div>`;
}

function renderExportTab() {
  const fn = buildFilename('export');
  const adv = GHOST.ui.expAdv;
  return `
    <div class="g-row"><label>Format</label><select id="exp-fmt"><option value="markdown"${GHOST.export.format==='markdown'?' selected':''}>Markdown</option><option value="json"${GHOST.export.format==='json'?' selected':''}>JSON</option></select></div>
    <div class="g-row"><label>💭 Thinking logs</label><div class="g-tog${GHOST.export.thinking?' on':''}" id="exp-think"></div></div>
    <div class="g-xlist">
      <div class="g-xrow g-xrow-accent" id="g-export"><span class="g-xicon">⬇</span><div class="g-xtext"><b>Export</b><span>Full transcript, markdown or JSON. The complete record — for keeping.</span></div></div>
      <div class="g-xrow g-xrow-muted" id="g-capsule"><span class="g-xicon">💊</span><div class="g-xtext"><b>Capsule v2</b><span>Resumable JSON with a resume token — for feeding back into an API or tool.</span></div></div>
      <div class="g-xrow g-xrow-ok" id="g-handoff"><span class="g-xicon">🤝</span><div class="g-xtext"><b>Handoff</b><span>Chat still responds: asks the AI to write its own briefing for the next chat.</span></div></div>
      <div class="g-xrow g-xrow-warn" id="g-rescue"><span class="g-xicon">🧷</span><div class="g-xtext"><b>Backup Handoff</b><span>Chat is dead: Ghost writes a lighter one itself — state + last 10 messages, enough to resume elsewhere.</span></div></div>
    </div>
    <button class="g-adv" id="exp-adv">${adv?'Advanced ▴':'Advanced ▾'}</button>
    ${adv ? `
    <div class="g-row"><label>Filter</label><select id="exp-flt"><option value="all"${GHOST.export.filter==='all'?' selected':''}>All</option><option value="user"${GHOST.export.filter==='user'?' selected':''}>User</option><option value="assistant"${GHOST.export.filter==='assistant'?' selected':''}>Assistant</option><option value="code"${GHOST.export.filter==='code'?' selected':''}>Code blocks</option></select></div>
    <div class="g-row"><label>Roles</label><div class="g-tog${GHOST.export.includeRoles?' on':''}" id="exp-roles"></div></div>
    <div class="g-row"><label>Slug</label><input type="text" id="exp-slug" placeholder="auto" value="${GHOST.export.customSlug}" style="width:100px"></div>
    <div style="font-size:8.5px;color:#383940;margin-bottom:5px;word-break:break-all">${fn}</div>
    <div style="display:flex;gap:5px">
      <button class="g-btn-sm" id="g-backup" style="flex:1;margin-top:0">⚙ Backup config</button>
      <button class="g-btn-sm" id="g-restore" style="flex:1;margin-top:0">↩ Restore</button>
    </div>
    <input type="file" id="g-restore-file" accept=".json" style="display:none">
    <div class="g-hint" id="g-restore-status" style="margin-top:4px;display:none"></div>` : ''}`;
}

function renderSettingsTab() {
  const adv = GHOST.ui.cfgAdv;
  return `
    <div class="g-row"><label>Max rounds</label><input type="number" id="cfg-max" min="1" max="999" value="${GHOST.loop.maxRounds}"></div>
    <div class="g-row"><label>🔔 Sound</label><div class="g-tog${GHOST.ui.soundOn?' on':''}" id="cfg-snd"></div></div>
    <div class="g-row"><label>💬 Notify when done</label><div class="g-tog${GHOST.ui.notifyOn?' on':''}" id="cfg-ntf"></div></div>
    <div class="g-row"><label>📍 Position</label>
      <div class="g-pos-row">${['top-left','top-right','bot-left','bot-right','bottom-bar','dock','dock-left'].map(p=>
        `<button class="g-pos${GHOST.ui.position===p?' act':''}${p==='dock-left'?' g-pos-gold':''}" data-pos="${p}" title="${p==='dock'?'Dock — slim edge tab, right side':p==='dock-left'?'Gold menu — slim hamburger tab, left side (opposite the site menu)':p}">${p==='top-left'?'↖':p==='top-right'?'↗':p==='bot-left'?'↙':p==='bot-right'?'↘':p==='bottom-bar'?'━':p==='dock-left'?'☰':'▐'}</button>`
      ).join('')}</div>
    </div>
    <div class="g-row"><label>❓ Quick start</label><button class="g-btn-sm" id="cfg-qs" style="margin-top:0">Show</button></div>
    <div class="g-div"></div>
    <div class="g-row"><label>🌙 Unattended</label><div class="g-tog${GHOST.ui.unattended?' on':''}" id="cfg-unattended"></div></div>
    <div class="g-hint" style="margin-top:-2px;margin-bottom:5px">Keeps running when the tab is in the background. The tab must stay <b>open</b> — this does not move the run to a server. Off by default: it sends prompts while you're not looking.</div>
    <div class="g-row"><label>🎨 Skin</label><select id="cfg-skin" style="width:100px">${[...Object.keys(SKIN_PRESETS),'custom'].map(k=>`<option value="${k}"${GHOST.ui.skinTheme===k?' selected':''}>${k==='custom'?'Custom…':SKIN_PRESETS[k].name}</option>`).join('')}</select><button class="g-btn-sm" id="cfg-skin-imp" title="Import a .gitl.json skin" style="margin-top:0">⬆</button><button class="g-btn-sm" id="cfg-skin-exp" title="Export active skin — edit the file, re-import: that's the whole modding loop" style="margin-top:0">⬇</button></div>
    <div class="g-row"><label>🌈 Accent</label><input type="range" id="cfg-hue" title="Tint accent · double-click resets to the skin&#39;s own hue" min="0" max="360" value="${Number.isFinite(GHOST.ui.accentHue)?GHOST.ui.accentHue:SKIN.baseHue()}" style="width:80px;accent-color:hsl(${Number.isFinite(GHOST.ui.accentHue)?GHOST.ui.accentHue:SKIN.baseHue()} 100% 60%)"><span style="width:14px;height:14px;border-radius:50%;background:hsl(${Number.isFinite(GHOST.ui.accentHue)?GHOST.ui.accentHue:SKIN.baseHue()} 100% 60%);display:inline-block;margin-left:5px;border:1px solid #2e2f35;flex-shrink:0"></span></div>
    <div class="g-swatches">${[350,265,220,185,145,40].map(h=>`<button class="g-swatch" data-hue="${h}" title="Set accent" style="background:hsl(${h} 85% 58%)"></button>`).join('')}</div>
    <button class="g-adv" id="cfg-adv">${adv?'Advanced ▴':'Advanced ▾'}</button>
    ${adv ? `
    <div class="g-row"><label>Signal window</label><input type="number" id="cfg-win" min="200" max="1200" step="100" value="${GHOST.signals.windowSize}"></div>
    <div class="g-row"><label>Extra proceed</label><input type="text" id="cfg-cp" placeholder="e.g. go on, next" value="${GHOST.signals.customProceed}"></div>
    <div class="g-row"><label>Extra stop</label><input type="text" id="cfg-cs" placeholder="e.g. all done" value="${GHOST.signals.customStop}"></div>
    <div class="g-row"><label>🌐 Custom sites</label><div class="g-tog${GHOST.ui.showSites?' on':''}" id="cfg-sites-tog"></div></div>
    ${GHOST.ui.showSites ? `
      <textarea id="cfg-sites" class="g-sites" rows="5" spellcheck="false" placeholder='{"example.com":{"label":"MyAI","input":["textarea"],"send":["button[type=submit]"],"assistant":["div.msg"]}}'>${GM_getValue('customSites','').replace(/</g,'&lt;')}</textarea>
      <div class="g-hint" id="cfg-sites-status">Per-host selector overrides (JSON). Also add the site under Tampermonkey → script settings → User matches.</div>` : ''}
    <div class="g-row"><label>🔧 Diagnostics</label><div class="g-tog${GHOST.ui.showDiag?' on':''}" id="cfg-diag"></div></div>
    ${GHOST.ui.showDiag ? renderDiag() : ''}` : ''}
    <div class="g-support"><a href="${SUPPORT_URL}" target="_blank" rel="noopener">♡ Support Ghost</a> · free forever</div>`;
}

function renderDiag() {
  const L = GHOST.loop;
  const h = typeof platformHealth === 'function' ? platformHealth() : null;
  const lines = [
    h ? `<span class="ok">Health:</span> ${h.badge} ${h.score}/100 (in:${h.input?'✓':'✗'} send:${h.send?'✓':'✗'} read:${h.assistantCount} net:${h.netActive?'✓':'✗'})` : '',
    `<span class="ok">Adapter:</span> ${DIAG.adapter}`,
    `<span class="ok">Platform:</span> ${PLAT.label}`,
    `<span>Selector:</span> ${DIAG.selector || '—'}`,
    `<span>Send path:</span> ${DIAG.sendPath || '—'}`,
    `<span>Signal:</span> ${L.lastSignal} (${L.lastConfidence}) ${DIAG.lastSignal}`,
    `<span>Tail:</span> ${DIAG.lastTail ? DIAG.lastTail.slice(-50) : '—'}`,
    `<span>Round:</span> ${L.round} / ${L.maxRounds}`,
    `<span>State:</span> ${L.state}`,
    `<span>Stale:</span> ${L.staleTicks}`,
    `<span>Tick:</span> ${L.lastActivity ? Math.round((Date.now()-L.lastActivity)/1000)+'s ago' : '—'}`,
    `<span>Tab:</span> ${GITL_TAB_ID.slice(0,8)}`,
    DIAG.probe ? `<span class="ok">Probe:</span>\n${DIAG.probe}` : '',
    DIAG.errors.length ? `<span class="warn">Errors:</span>\n${DIAG.errors.slice(0,5).join('\n')}` : ''
  ].filter(Boolean).join('\n');
  return `<div class="g-diag">${lines}</div><button class="g-btn-sm" id="g-probe">🔍 Probe selectors</button> <button class="g-btn-sm" id="g-report-now">⚠ Report a problem</button>`;
}

function applyPosition(pos) {
  const G = '14px';
  panel.style.top = panel.style.bottom = panel.style.left = panel.style.right = 'auto';
  panel.style.width = '268px';
  panel.classList.remove('pos-bb');
  if (pos==='top-right'){panel.style.top=G;panel.style.right=G}
  else if(pos==='top-left'){panel.style.top=G;panel.style.left=G}
  else if(pos==='bot-right'){panel.style.bottom=G;panel.style.right=G}
  else if(pos==='bot-left'){panel.style.bottom=G;panel.style.left=G}
  else if(pos==='bottom-bar'){panel.classList.add('pos-bb')}
  else if(pos==='dock'){panel.style.top='30%';panel.style.right='0';panel.style.width=''}
  else if(pos==='dock-left'){panel.style.top='30%';panel.style.left='0';panel.style.width=''}
}

function renderReportBadge() {
  // v7.1: a report just landed — surface it. Switch to Run tab so the
  // banner is visible, then re-render.
  try {
    if (typeof GHOST === 'undefined' || !GHOST.ui) return;
    if (GHOST.report) GHOST.ui.tab = 'run';
    if (typeof panel !== 'undefined' && panel) render();
  } catch(_){}
}

function render() {
  try { panel.dataset.run = (GHOST.loop.state === 'RUNNING') ? '1' : '0'; panel.dataset.explain = GHOST.ui.explain ? '1' : '0'; } catch(_) {}
  const L = GHOST.loop, tab = GHOST.ui.tab, col = GHOST.ui.collapsed;
  const isDock = GHOST.ui.position==='dock' || GHOST.ui.position==='dock-left';
  panel.className = [col?'collapsed':'', GHOST.ui.position==='bottom-bar'?'pos-bb':'', GHOST.ui.position==='dock'?'pos-dock':'', GHOST.ui.position==='dock-left'?'pos-dock pos-dock-left':''].filter(Boolean).join(' ');
  const qc = statColor();
  const ql = L.state==='RUNNING'?'Running…':L.state==='LIMIT'?`▶ ${L.maxRounds} reached — tap for ${L.limitStep} more`:L.state==='PAUSED'?'Paused':L.state==='COMPLETE'?'Done':'Idle';
  const qIcon = L.state==='RUNNING'?'⏸':'▶';
  const qCls  = L.state==='RUNNING'?'pause':L.state==='LIMIT'?'play limit':'play';
  // Compact dock status: step/round + drift guard remaining (editable)
  const dockStat = (()=>{
    if (L.state==='IDLE'||L.state==='COMPLETE') return '';
    const p = L.lastProgress;
    const pctv = (p && p.total) ? Math.round((p.step / p.total) * 100) : null;
    const bar = pctv !== null
      ? `<span class="g-dk-bar" title="Step ${p.step} of ${p.total}"><i style="width:${pctv}%"></i></span>`
      : '';
    const line1 = p ? `${p.step}/${p.total}` : (L.round ? `round ${L.round}` : '');
    const left = L.driftEnabled ? Math.max(0, L.maxRounds - L.round) : null;
    const line2 = left !== null
      ? `<span class="g-dk-drift" title="Drift guard: ${left} of ${L.maxRounds} continues left before Ghost pauses to check in. Tap the number to change the limit, ↻ resets the counter."><span class="g-dk-cap">${left} left</span><input type="number" class="g-dk-edit" id="g-dk-max" value="${L.maxRounds}" min="1" max="999"><button class="g-dk-rst" id="g-dk-reset">↻</button></span>`
      : '';
    return [bar, line1, line2].filter(Boolean).join('');
  })();
  panel.innerHTML = _TT(`
    <div class="g-hdr" id="g-drag">
      <span class="g-logo">${col && GHOST.ui.position==='dock-left' ? '☰ Ghost' : '<span class="g-ghost">👻</span> Ghost'}<span class="g-dot ${dotClass()}"></span></span>
      <span style="display:flex;align-items:center;gap:5px">
        <span class="g-plat">${(typeof platformHealth==='function'?platformHealth().badge:'') + ' ' + PLAT.label}</span>
        <button class="g-minbtn" id="g-redetect" title="Re-detect the chat box — fixes 'can't find input' after switching browser/app or tabs (no page reload)">🔄</button>
        <button class="g-minbtn" id="g-info" title="Help & FAQ">?</button>
        <button class="g-minbtn" id="g-col" title="${col?'Expand':'Minimize'}">${GHOST.ui.position==='dock' ? (col?'◀':'▶') : GHOST.ui.position==='dock-left' ? (col?'▶':'◀') : (col?'＋':'－')}</button>
      </span>
    </div>
    <div class="g-coll-row">
      <button class="g-qbtn ${qCls}" id="g-quick">${qIcon}</button>
      <span class="g-qstat" style="color:${qc}">${ql}</span>
      ${dockStat?`<span class="g-dock-stat">${dockStat}</span>`:''}
    </div>
    <div class="g-body">
      <div class="g-proj">
        <span class="g-proj-lbl">📁</span>
        <input class="g-proj-in" id="g-projname" type="text" placeholder="Project name…" value="${GHOST.project.name}">
      </div>
      <div class="g-tabs">
        <button class="g-tab${tab==='run'?' act':''}" data-t="run" title="Standard continue loop">Run</button>
        <button class="g-tab${tab==='auto'?' act':''}" data-t="auto" title="Roadmap autopilot & prompt queue">Auto</button>
        <button class="g-tab${tab==='flow'?' act':''}" data-t="flow" title="Multi-stage workflows">Flow</button>
        <button class="g-tab${tab==='personas'?' act':''}" data-t="personas" title="Personas & committee">Personas</button>
        <button class="g-tab${tab==='export'?' act':''}" data-t="export" title="Export & handoff">Export</button>
        <button class="g-tab${tab==='settings'?' act':''}" data-t="settings" title="Settings">Setup</button>
      </div>
      <div id="g-tc">
        <button class="g-tabhelp" id="g-explain-tog" title="Explain mode — tap ⓘ, then tap any control to learn what it does" style="right:20px">ⓘ</button>
        ${TAB_HELP[tab] && tab!=='info' ? `<button class="g-tabhelp" id="g-tabhelp" data-h="${TAB_HELP[tab]}" title="Help for this tab">?</button>` : ''}
        ${tab==='run'?renderRunTab():''}${tab==='auto'?renderAutoTab():''}${tab==='info'?renderInfoTab():''}${tab==='flow'?renderFlowTab():''}
        ${tab==='personas'?renderPersonasTab():''}${tab==='export'?renderExportTab():''}
        ${tab==='settings'?renderSettingsTab():''}
      </div>
    </div>`);
  bindEvents();
  applyPosition(GHOST.ui.position);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT BINDING
   ═══════════════════════════════════════════════════════════════ */
function bindEvents() {
  const $ = s => panel.querySelector(s);
  const $$ = s => panel.querySelectorAll(s);

  $('#g-col')?.addEventListener('click', () => { GHOST.ui.collapsed=!GHOST.ui.collapsed; _save('panelCollapsed',GHOST.ui.collapsed); render(); });
  // Docked + collapsed: the whole strip is the expand target (the play button stays play)
  if ((GHOST.ui.position==='dock' || GHOST.ui.position==='dock-left') && GHOST.ui.collapsed) {
    panel.addEventListener('click', e => {
      if (e.target.closest('#g-quick') || e.target.closest('#g-col')) return;
      GHOST.ui.collapsed = false; _save('panelCollapsed', false); render();
    }, { once: true });
  }
  $('#g-quick')?.addEventListener('click', primaryAction);
  $('#g-projname')?.addEventListener('change', e => {
    GHOST.project.name = e.target.value.trim();
    GHOST.project.slug = GHOST.project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    _save('projectName',GHOST.project.name); _save('projectSlug',GHOST.project.slug);
    if (GHOST.ui.tab==='export') render();
  });
  $$('.g-tab').forEach(b => b.addEventListener('click', () => { GHOST.ui.tab=b.dataset.t; render(); }));
  $('#g-tabhelp')?.addEventListener('click', function(){ GHOST.ui.prevTab = GHOST.ui.tab; GHOST.ui.helpSec = this.dataset.h; GHOST.ui.tab = 'info'; render(); });

  // Run tab — strategy dropdown
  $$('.g-md').forEach(b => b.addEventListener('click', () => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.payloadMode=b.dataset.m; GHOST.loop.needsPayload=true; _save('payloadMode',GHOST.loop.payloadMode); render();
  }));
  $('#g-strategy')?.addEventListener('change', e => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.payloadMode=e.target.value; GHOST.loop.needsPayload=true; _save('payloadMode',GHOST.loop.payloadMode); render();
  });
  $('#run-adv')?.addEventListener('click', () => { GHOST.ui.runAdv=!GHOST.ui.runAdv; render(); });
  $('#g-goto-personas')?.addEventListener('click', e => { e.preventDefault(); GHOST.ui.tab='personas'; render(); });
  $('#g-reground')?.addEventListener('click', () => { if (GHOST.loop.state==='RUNNING'||GHOST.loop.state==='PAUSED') regroundLoop(); });
  $$('.g-pst').forEach(b => b.addEventListener('click', () => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.posture=b.dataset.pst; _save('posture',GHOST.loop.posture); render();
  }));
  $('#g-posture-help')?.addEventListener('click', () => { GHOST.ui.prevTab=GHOST.ui.tab; GHOST.ui.helpSec='posture'; GHOST.ui.tab='info'; render(); });
  $('#g-play')?.addEventListener('click', primaryAction);
  $('#g-limit-go')?.addEventListener('click', extendLimit);
  $('#g-limit-reground')?.addEventListener('click', regroundLoop);
  $('#g-limit-wait')?.addEventListener('click', () => enginePause('✋ Stopped at drift checkpoint — ▶ to resume'));
  $('#g-drift-tog')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.loop.driftEnabled=this.classList.contains('on'); _save('driftEnabled',GHOST.loop.driftEnabled); render(); });
  $('#g-drift-max')?.addEventListener('change', e => { const v=parseInt(e.target.value,10); if(v>0&&v<=999){GHOST.loop.maxRounds=v; _save('maxRounds',v); render();} });
  $('#g-drift-max')?.addEventListener('click', e => e.stopPropagation());
  $('#g-dk-max')?.addEventListener('change', e => { const v=parseInt(e.target.value,10); if(v>0&&v<=999){GHOST.loop.maxRounds=v; _save('maxRounds',v); render();} });
  $('#g-dk-max')?.addEventListener('click', e => e.stopPropagation());
  $('#g-dk-reset')?.addEventListener('click', e => { e.stopPropagation(); GHOST.loop.round=0; GHOST.loop.detail='↻ Drift guard reset'; render(); });
  $('#g-cnt-reset')?.addEventListener('click', () => {
    GHOST.loop.round = 0;
    Timeline.record('drift_guard_reset', { cap: GHOST.loop.maxRounds });
    GHOST.loop.detail = '↻ Drift guard reset';
    render();
  });
  $('#g-pause')?.addEventListener('click', pauseLoop);
  $('#g-stop')?.addEventListener('click', stopLoop);
  $('#g-reset')?.addEventListener('click', resetLoop);
  $('#g-send-seen')?.addEventListener('click', () => reconcileUncertainSend(true));
  $('#g-send-manual')?.addEventListener('click', () => reconcileUncertainSend(false));
  $('#g-rep-copy')?.addEventListener('click', function(){ Reporter.copy().then(ok => { this.textContent = ok ? '✓ Copied' : '✕ Failed'; setTimeout(()=>{ this.textContent='📋 Copy'; }, 1500); }); });
  $('#g-rep-dl')?.addEventListener('click', function(){ const ok = Reporter.download(); this.textContent = ok ? '✓ Downloaded' : '✕ Failed'; });
  $('#g-rep-issue')?.addEventListener('click', () => Reporter.openIssue());
  $('#g-rep-x')?.addEventListener('click', () => {
    if (GHOST.loop.sendTxn?.state === 'uncertain') {
      GHOST.loop.detail = 'Reconcile the uncertain Send before dismissing this report.';
      render();
      return;
    }
    GHOST.report = null; Reporter.last = null; render();
  });
  $('#g-peek-btn')?.addEventListener('click', () => {
    const p=$('#g-peek'),b=$('#g-peek-btn');
    if(p&&b){p.classList.toggle('open'); b.textContent=p.classList.contains('open')?'▾ Hide prompt':'▸ What gets injected';}
  });

  // Flow tab
  $('#wf-sel')?.addEventListener('change', e => {
    GHOST.workflow.selected=e.target.value; GHOST.workflow.stageIndex=0; GHOST.workflow.active=e.target.value!=='none';
    _save('wfSelected',GHOST.workflow.selected); _save('wfStage',0); render();
  });
  $('#wf-pause')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.workflow.pauseBetween=this.classList.contains('on'); _save('wfPause',GHOST.workflow.pauseBetween); render(); });
  $('#wf-reset')?.addEventListener('click', () => { GHOST.workflow.stageIndex=0; GHOST.workflow.active=GHOST.workflow.selected!=='none'; _save('wfStage',0); render(); });
  $('#wf-start')?.addEventListener('click', startWorkflow);
  $('#wf-do-pause')?.addEventListener('click', () => { if(GHOST.loop.state==='RUNNING') pauseLoop(); });
  $('#wf-do-stop')?.addEventListener('click', () => { GHOST.workflow.active=false; GHOST.workflow.stageIndex=0; _save('wfStage',0); stopLoop(); });
  $$('.g-wf-ins').forEach(b => b.addEventListener('click', () => {
    const wf = allWorkflows()[GHOST.workflow.selected] || WORKFLOW_LIBRARY.none;
    const stage = wf.stages[+b.dataset.ins];
    if (stage) insertPrompt(stage, b);
  }));
  $('#ws-w-new')?.addEventListener('click', () => { GHOST.ui.wsNewWorkflow = true; render(); });
  $('#ws-w-cancel')?.addEventListener('click', () => { GHOST.ui.wsNewWorkflow = false; render(); });
  $('#ws-w-save')?.addEventListener('click', () => {
    const label = ($('#ws-w-label')?.value || '').trim();
    const desc  = ($('#ws-w-desc')?.value || '').trim();
    const stages = ($('#ws-w-stages')?.value || '').split('\n').map(s => s.trim()).filter(s => s.length > 1);
    if (!label || !stages.length) { GHOST.loop.detail = '⚠ Name and at least one stage line are required'; render(); return; }
    const id = Workshop.addWorkflow(label, desc, stages);
    GHOST.ui.wsNewWorkflow = false; GHOST.workflow.selected = id; GHOST.workflow.stageIndex = 0;
    _save('wfSelected', id); _save('wfStage', 0);
    GHOST.loop.detail = `✓ Created workflow "${label}" (${stages.length} stages)`; render();
  });
  $('#ws-w-del')?.addEventListener('click', function(){
    const id = GHOST.workflow.selected;
    if (this.dataset.confirm === '1') {
      Workshop.removeWorkflow(id);
      GHOST.workflow.selected = 'none'; GHOST.workflow.stageIndex = 0; GHOST.workflow.active = false;
      _save('wfSelected','none'); _save('wfStage',0); render();
    } else { this.dataset.confirm = '1'; this.textContent = '✕ Tap again to confirm delete'; }
  });

  // Personas tab
  const _saveSel = () => { GHOST.persona._delivered = false; _save('persona', JSON.stringify(GHOST.persona.selected)); };
  $('#p-comm-tog')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.persona.committee=this.classList.contains('on'); _save('personaCommittee',GHOST.persona.committee); if(GHOST.persona.committee&&GHOST.persona.selected.filter(s=>s&&s!=='none').length<2){ GHOST.persona.selected=GHOST.persona.selected.filter(s=>s&&s!=='none'); if(!GHOST.persona.selected.length) GHOST.persona.selected=['researcher','redteam']; _saveSel(); } render(); });
  $('#p-single')?.addEventListener('change', e => { GHOST.persona.selected=[e.target.value]; _saveSel(); render(); });
  $('#p-run')?.addEventListener('click', () => { GHOST.ui.tab='run'; startLoop(); });
  $('#p-pertask')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.persona.perTask=this.classList.contains('on'); _save('personaPerTask',GHOST.persona.perTask); });
  $('#p-review')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.persona.finalReview=this.classList.contains('on'); _save('personaFinalReview',GHOST.persona.finalReview); });
  // Committee multi-select rows
  $$('.g-cm-sel').forEach(sel => sel.addEventListener('change', e => {
    const i=+sel.dataset.ci; const active=GHOST.persona.selected.filter(s=>s&&s!=='none');
    if(i<active.length) active[i]=e.target.value;
    GHOST.persona.selected=active.length?active:['none']; _saveSel(); render();
  }));
  $$('.g-cm-del').forEach(b => b.addEventListener('click', () => {
    const i=+b.dataset.ci; const active=GHOST.persona.selected.filter(s=>s&&s!=='none');
    active.splice(i,1); GHOST.persona.selected=active.length?active:['none']; _saveSel(); render();
  }));
  $('#p-cm-add')?.addEventListener('click', () => {
    const active=GHOST.persona.selected.filter(s=>s&&s!=='none');
    const all=Object.keys(allPersonas()).filter(k=>k!=='none'&&!active.includes(k));
    if(all.length) active.push(all[0]); GHOST.persona.selected=active; _saveSel(); render();
  });
  // Workshop: create/import/export (same as before, updated for array)
  $('#ws-p-new')?.addEventListener('click', () => { GHOST.ui.wsNewPersona = true; render(); });
  $('#ws-p-cancel')?.addEventListener('click', () => { GHOST.ui.wsNewPersona = false; render(); });
  $('#ws-p-save')?.addEventListener('click', () => {
    const label = ($('#ws-p-label')?.value || '').trim();
    const inject = ($('#ws-p-inject')?.value || '').trim();
    if (!label || !inject) { GHOST.loop.detail = '⚠ Name and framing are both required'; render(); return; }
    const id = Workshop.addPersona(label, inject);
    GHOST.ui.wsNewPersona = false;
    if(GHOST.persona.committee){ GHOST.persona.selected.push(id); } else { GHOST.persona.selected=[id]; }
    _saveSel();
    GHOST.loop.detail = `✓ Created persona "${label}"`; render();
  });
  $('#ws-import')?.addEventListener('click', workshopImport);
  $('#ws-export')?.addEventListener('click', workshopExport);
  $('#ws-submit')?.addEventListener('click', () => {
    // v8.1: Share now does the work — a paste-ready Discussions post (item
    // list + JSON bundle) lands on the clipboard, then the how-to opens.
    try {
      const t = Workshop.shareText();
      if (typeof GM_setClipboard === 'function') GM_setClipboard(t, { type:'text', mimetype:'text/plain' });
      else navigator.clipboard?.writeText(t);
      GHOST.loop.detail = '🌐 Share post copied — paste it into GitHub Discussions';
    } catch(_) {}
    GHOST.ui.prevTab = GHOST.ui.tab; GHOST.ui.helpSec = 'workshop'; GHOST.ui.tab = 'info'; render();
  });

  // Export tab
  $('#exp-fmt')?.addEventListener('change', e => { GHOST.export.format=e.target.value; _save('expFormat',e.target.value); render(); });
  $('#exp-flt')?.addEventListener('change', e => { GHOST.export.filter=e.target.value; _save('expFilter',e.target.value); });
  $('#exp-roles')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.export.includeRoles=this.classList.contains('on'); _save('expRoles',GHOST.export.includeRoles); });
  $('#exp-slug')?.addEventListener('change', e => { GHOST.export.customSlug=e.target.value.trim(); _save('expSlug',GHOST.export.customSlug); render(); });
  $('#g-export')?.addEventListener('click', runExport);
  $('#g-capsule')?.addEventListener('click', () => { exportCapsuleV2(); });
  $('#exp-think')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.export.thinking=this.classList.contains('on'); _save('expThinking',GHOST.export.thinking); });
  $('#g-handoff')?.addEventListener('click', handoffInChat);
  $('#g-rescue')?.addEventListener('click', exportBackupHandoff);
  $('#g-backup')?.addEventListener('click', backupConfig);
  $('#g-restore')?.addEventListener('click', () => $('#g-restore-file')?.click());
  $('#g-restore-file')?.addEventListener('change', e => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const st = $('#g-restore-status'); if (st) { st.style.display='block'; st.textContent = restoreConfig(String(r.result)); } };
    r.readAsText(f);
  });

  // Auto tab — roadmap / queue
  $$('.g-qin').forEach(inp => inp.addEventListener('change', e => {
    const i = +e.target.dataset.qi; GHOST.ui.qDraft[i] = e.target.value;
    _save('qDraft', JSON.stringify(GHOST.ui.qDraft));
  }));
  $$('.g-qdel').forEach(b => b.addEventListener('click', e => {
    const i = +e.target.dataset.qd; GHOST.ui.qDraft.splice(i,1);
    if (!GHOST.ui.qDraft.length) GHOST.ui.qDraft = [''];
    _save('qDraft', JSON.stringify(GHOST.ui.qDraft)); render();
  }));
  $('#q-add')?.addEventListener('click', () => { GHOST.ui.qDraft.push(''); render(); setTimeout(()=>{ const ins=$$('.g-qin'); ins[ins.length-1]?.focus(); },50); });
  $('#q-start')?.addEventListener('click', () => {
    const steps = GHOST.ui.qDraft.map(s=>s.trim()).filter(Boolean);
    if (steps.length) startQueue(steps.join('\n'));
  });
  $('#rm-clear')?.addEventListener('click', () => { resetRoadmap(); render(); });

  // Settings tab
  $('#cfg-max')?.addEventListener('change', e => { const v=parseInt(e.target.value,10); if(v>0&&v<=999){GHOST.loop.maxRounds=v; _save('maxRounds',v);} });
  $('#cfg-win')?.addEventListener('change', e => { const v=parseInt(e.target.value,10); if(v>=200&&v<=1200){GHOST.signals.windowSize=v; _save('sigWindow',v);} });
  $('#cfg-cp')?.addEventListener('change', e => { GHOST.signals.customProceed=e.target.value; _save('customProceed',e.target.value); });
  $('#cfg-cs')?.addEventListener('change', e => { GHOST.signals.customStop=e.target.value; _save('customStop',e.target.value); });
  $('#cfg-snd')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.ui.soundOn=this.classList.contains('on'); _save('soundOn',GHOST.ui.soundOn); });
  $('#cfg-ntf')?.addEventListener('click', function(){
    this.classList.toggle('on'); GHOST.ui.notifyOn=this.classList.contains('on'); _save('notifyOn',GHOST.ui.notifyOn);
    if (GHOST.ui.notifyOn) { try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch(_){} }
  });
  $$('.g-pos').forEach(b => b.addEventListener('click', () => { GHOST.ui.position=b.dataset.pos; _save('panelPosition',GHOST.ui.position); applyPosition(GHOST.ui.position); render(); }));
  $('#cfg-diag')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.ui.showDiag=this.classList.contains('on'); render(); });
  $('#g-probe')?.addEventListener('click', () => { DIAG.runProbe(); render(); });
  $('#g-report-now')?.addEventListener('click', () => { DIAG.runProbe(); Reporter.capture('manual', 'User-triggered problem report'); });
  $('#cfg-sites-tog')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.ui.showSites=this.classList.contains('on'); render(); });
  $('#cfg-sites')?.addEventListener('change', e => {
    const raw = e.target.value.trim(), st = $('#cfg-sites-status');
    if (!raw) { _save('customSites',''); if(st) st.textContent='Cleared. Reload the page to apply.'; return; }
    try { JSON.parse(raw); _save('customSites', raw); if(st) st.textContent='✓ Saved. Reload the page to apply.'; }
    catch(err) { if(st) st.textContent='⚠ Invalid JSON — not saved.'; }
  });
  $('#cfg-qs')?.addEventListener('click', () => { GHOST.ui.firstRun=true; _save('firstRun',true); GHOST.ui.tab='run'; render(); });
  $('#cfg-unattended')?.addEventListener('click', function(){
    this.classList.toggle('on');
    GHOST.ui.unattended = this.classList.contains('on');
    _save('unattended', GHOST.ui.unattended);
    // Re-arm the ticker on the new mode if a run is live.
    if (GHOST.loop.state === 'RUNNING') GHOST.loop.timer = Ticker.start(engineTick, 2500);
    GHOST.loop.detail = GHOST.ui.unattended
      ? '🌙 Unattended ON — keeps running in a background tab'
      : 'Unattended OFF — pauses when you switch away';
    render();
  });
  $('#cfg-skin')?.addEventListener('change', e => {
    const v = e.target.value;
    if (v === 'custom' && !GHOST.ui.customSkin) { SKIN.importFile(); render(); return; }
    GHOST.ui.skinTheme = v; _save('skinTheme', v); SKIN.apply(); render();
  });
  $('#cfg-skin-imp')?.addEventListener('click', () => SKIN.importFile());
  $('#cfg-skin-exp')?.addEventListener('click', () => SKIN.exportCurrent());
  $$('.g-swatch').forEach(b => b.addEventListener('click', () => {
    const h = parseInt(b.dataset.hue, 10);
    GHOST.ui.accentHue = h; _save('accentHue', h); SKIN.apply(); render();
  }));
  $('#cfg-hue')?.addEventListener('dblclick', () => { GHOST.ui.accentHue = NaN; _save('accentHue',''); SKIN.apply(); render(); });
  $('#cfg-hue')?.addEventListener('input', e => { GHOST.ui.accentHue=parseInt(e.target.value,10); _save('accentHue',GHOST.ui.accentHue); SKIN.apply(); render(); });
  $('#g-redetect')?.addEventListener('click', function(){
    this.classList.add('spin');
    const ok = reDetect();
    // Found immediately → brief spin. Otherwise the async watcher keeps the
    // spin going and clears it itself on success or 12s timeout.
    if (ok) setTimeout(() => this.classList.remove('spin'), 600);
  });
  $('#g-info')?.addEventListener('click', () => { GHOST.ui.tab = GHOST.ui.tab==='info' ? 'run' : 'info'; render(); });
  $('#g-info-back')?.addEventListener('click', () => { GHOST.ui.tab = GHOST.ui.prevTab || 'run'; GHOST.ui.prevTab = null; render(); });
  $$('.g-hpill').forEach(b => b.addEventListener('click', e => { GHOST.ui.helpSec = e.target.dataset.h; render(); }));
  $('#cfg-adv')?.addEventListener('click', () => { GHOST.ui.cfgAdv=!GHOST.ui.cfgAdv; _save('cfgAdv',GHOST.ui.cfgAdv); render(); });
  $('#exp-adv')?.addEventListener('click', () => { GHOST.ui.expAdv=!GHOST.ui.expAdv; _save('expAdv',GHOST.ui.expAdv); render(); });
  $('#g-onb-done')?.addEventListener('click', () => { GHOST.ui.firstRun=false; _save('firstRun',false); render(); });

  bindDrag();
}

let _dragBound = false;
let _dragging = false;
let _dragOffsetX = 0;
let _dragOffsetY = 0;

function bindDrag() {
  /* panel is a stable shell; its contents are re-rendered. Delegate the
     pointer-down once and install one document move/up pair for the lifetime
     of the script. This prevents two global listeners being added per render
     and gives touch/pen the same path as a mouse. */
  if (_dragBound) return;
  _dragBound = true;
  panel.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.target?.closest?.('#g-drag')) return;
    if (e.target.closest('button,input,select,a')) return;
    const rect = panel.getBoundingClientRect();
    _dragging = true;
    _dragOffsetX = e.clientX - rect.left;
    _dragOffsetY = e.clientY - rect.top;
    try { panel.setPointerCapture(e.pointerId); } catch(_) {}
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!_dragging) return;
    panel.style.left = `${e.clientX - _dragOffsetX}px`;
    panel.style.top = `${e.clientY - _dragOffsetY}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });
  document.addEventListener('pointerup', e => {
    if (!_dragging) return;
    _dragging = false;
    try { panel.releasePointerCapture(e.pointerId); } catch(_) {}
  });
}

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if(e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault(); primaryAction();}
  if(e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault(); stopLoop();}
});

/* ═══════════════════════════════════════════════════════════════
   MUTATION OBSERVER (gated by sendInProgress to prevent double-fire)
   ═══════════════════════════════════════════════════════════════ */
let _mutDebounce;

/* ═══════════════════════════════════════════════════════════════
   BOOT — wrapped in safeBoot to prevent v7.0-alpha loading failures
   ═══════════════════════════════════════════════════════════════ */
safeBoot(() => {
  /* v8.2.0 TRANSACTIONAL BOOT.
     Previously boot was one straight-line block: any throw before mountPanel()
     — including in an OPTIONAL subsystem like the tab bus or heartbeat — aborted
     the rest and the panel never appeared. Now boot runs as isolated phases:
       • CRITICAL phases (styles → panel → render) must succeed; a failure is
         fatal AND loud (_gitlFatal via safeBoot's catch).
       • OPTIONAL phases are each caught: one failing subsystem degrades health
         and is logged, but can never suppress the panel or the phases after it.
     The singleton `window.__GITL_V8__` is committed only after the critical
     phases succeed, so a failed attempt no longer blocks a retry. */
  GHOST._degraded = [];
  const _phase = (name, critical, fn) => {
    const t = Date.now();
    try {
      fn();
      Timeline.record('boot_phase', { name, ok: true, ms: Date.now() - t });
    } catch (e) {
      Timeline.record('boot_phase', { name, ok: false, error: String(e && e.message || e) });
      if (critical) throw new Error('critical boot phase "' + name + '" failed: ' + (e && e.message || e));
      GHOST._degraded.push(name);
      try { DIAG.push('Boot phase "' + name + '" failed (non-critical, panel unaffected): ' + (e && e.message || e)); } catch(_) {}
    }
  };

  // ── CRITICAL: get the panel on screen. Nothing optional runs before this. ──
  _phase('workshop', false, () => Workshop.load());   // custom items for first render; non-fatal if it throws
  _phase('styles',   true,  () => injectStyles());
  _phase('panel',    true,  () => mountPanel());
  _phase('skin',     true,  () => SKIN.apply());
  _phase('render',   true,  () => render());

  // Panel is up and rendered — commit the singleton NOW (never before boot).
  window.__GITL_V8__ = true;
  window.__GITL_BOOTING__ = 0;
  _beacon(document.getElementById('gitl') ? 'ok:' + VER : 'no-panel:' + VER);

  // ── OPTIONAL: isolated. None of these can remove the panel if they throw. ──
  _phase('continue-observer', false, () => {
    // Fast-path: a Continue button revealed via CSS (not just freshly inserted)
    // also triggers the auto-click. The loop tick remains the primary driver.
    new MutationObserver(() => {
      if (GHOST.loop.state !== 'RUNNING' || GHOST.loop.isSending) return;
      clearTimeout(_mutDebounce);
      _mutDebounce = setTimeout(() => { GHOST.loop.lastActivity = Date.now(); Adapter.clickContinue(); }, 300);
    }).observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'disabled', 'aria-hidden']
    });
  });
  _phase('heartbeat', false, () => startTabHeartbeat());
  _phase('tab-lock',  false, () => claimTabLock());
  _phase('bus',       false, () => GhostBus.init());
  _phase('panel-sentinel', false, () => startPanelSentinel());

  _phase('boot-retry', false, () => {
    // SPA boot retry: ChatGPT/Gemini/Angular render chat elements late; keep
    // trying to find input+send for 30s (every 2s), then stop.
    let _bootRetry = 0;
    const _bootInterval = setInterval(() => {
      _bootRetry++;
      const inp = _q('input', PLAT.input);
      if (inp) {
        clearInterval(_bootInterval);
        GHOST.loop.detail = `✓ Connected to ${PLAT.label}`;
        render();
        DIAG.push(`Boot: elements found after ${_bootRetry * 2}s`);
      } else if (_bootRetry >= 15) {
        clearInterval(_bootInterval);
        DIAG.push('Boot: gave up waiting for elements after 30s');
      } else {
        _cache.clear(); // re-attempt detect during SPA hydration
      }
    }, 2000);
  });

  _phase('prior-error-surface', false, () => {
    /* Surface a PRIOR boot failure once (from GM storage), then clear it, so a
       failure on an earlier load becomes a reviewable local diagnostic now
       that the panel is up. Persisted records contain metadata only. */
    const lastBoot = GM_getValue('lastBootError', '');
    const lastNet  = GM_getValue('lastNetInstallError', '');
    if (lastBoot) {
      DIAG.push('Previous page load failed during critical boot.');
      Reporter.capture('BOOT-001');
      _save('lastBootError', '');
    }
    if (lastNet) {
      DIAG.push('Previous page load could not install optional network observation.');
      Reporter.capture('BOOT-002');
      _save('lastNetInstallError', '');
    }
  });

  Timeline.record('boot', { version: VER, platform: PLAT.key, degraded: GHOST._degraded });
  console.log(`[Ghost in the Loop v${VER}] ${PLAT.label} | ${DIAG.adapter} | tab:${GITL_TAB_ID.slice(0,8)}` + (GHOST._degraded.length ? ` | degraded:${GHOST._degraded.join(',')}` : ''));
});

/* PANEL SENTINEL (v8.2.0) — bounded, visibility-aware panel liveness.
   Replaces the v8.1.4 watchdog, which only checked ABSENCE and had no cap, so
   a page that re-hid the panel each time could drive an unbounded
   append/remove storm. This version:
     • treats the panel as "down" when it is disconnected, in a display:none /
       visibility:hidden subtree, or has zero size (host may move #gitl into a
       hidden container rather than remove it) — re-appending to document.body
       rescues all of those. NOTE: safe because GITL never hides its OWN root
       (collapsed state only hides the inner .g-body; the root keeps ≥44px);
     • debounces, and CAPS remounts within a rolling window;
     • on exceeding the cap, OPENS A CIRCUIT BREAKER: stops observing and shows
       a visible, dismissible note instead of thrashing forever;
     • disconnects observers/timers on teardown. */
function startPanelSentinel() {
  const MAX = 5, WINDOW_MS = 30000, DEBOUNCE_MS = 120;
  let mo = null, poll = null, scheduled = null, opened = false;
  const times = [];

  const isDown = () => {
    const n = document.getElementById('gitl');
    if (!n || !n.isConnected || !document.body) return true;
    try {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden') return true;
      const r = n.getBoundingClientRect();
      if (r.width <= 2 && r.height <= 2) return true;
    } catch(_) {}
    return false;
  };

  const teardown = () => {
    try { mo && mo.disconnect(); } catch(_) {}
    if (poll) clearInterval(poll);
    if (scheduled) clearTimeout(scheduled);
    mo = poll = scheduled = null;
  };

  const openBreaker = () => {
    opened = true;
    teardown();
    _beacon('sentinel-open');
    Timeline.record('panel_circuit_open', { remounts: times.length, windowMs: WINDOW_MS });
    try { DIAG.push('Panel sentinel opened: the page kept removing/hiding the panel — stopped re-mounting to avoid a loop.'); } catch(_) {}
    // Visible, dismissible note (reuses the fatal-banner style, distinct id).
    try {
      if (document.getElementById('gitl-sentinel')) return;
      const b = document.createElement('div');
      b.id = 'gitl-sentinel';
      b.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:2147483646;background:#2a230a;color:#ffe6a6;font:600 12px/1.4 system-ui,sans-serif;padding:9px 32px 9px 12px;border-bottom:2px solid #d9a441;white-space:pre-wrap');
      b.textContent = "👻 Ghost's panel keeps being removed by this page, so it stopped re-adding it. Tap 🔄 re-detect or reload to try again.";
      const x = document.createElement('span');
      x.textContent = '×';
      x.setAttribute('style', 'position:absolute;top:5px;right:10px;cursor:pointer;font-size:18px;line-height:1');
      x.addEventListener('click', () => b.remove());
      b.appendChild(x);
      (document.body || document.documentElement).appendChild(b);
    } catch(_) {}
  };

  const ensure = () => {
    if (opened || !isDown()) return;
    const now = Date.now();
    while (times.length && now - times[0] > WINDOW_MS) times.shift();
    if (times.length >= MAX) { openBreaker(); return; }
    times.push(now);
    // Re-append the SAME node (state + event handlers intact).
    _panelMounted = false;
    mountPanel();
    _beacon('remounted:' + times.length);
    Timeline.record('panel_remount', { count: times.length });
    try { DIAG.push('Panel was removed/hidden by the page — re-mounted (#' + times.length + ')'); } catch(_) {}
    render();
  };

  const schedule = () => {
    if (opened || scheduled) return;
    scheduled = setTimeout(() => { scheduled = null; ensure(); }, DEBOUNCE_MS);
  };

  mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  // Belt-and-suspenders: catch body swaps / CSS-only hides the observer may miss.
  poll = setInterval(ensure, 3000);
}

} catch(__gitlBootErr) { _gitlFatal('top-level', __gitlBootErr); }
})();
