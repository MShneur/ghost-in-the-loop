/**
 * Ghost in the Loop — Test Harness Setup
 * Runs the userscript IIFE in a mocked VM context,
 * injects test-export hook inside the IIFE to extract symbols.
 */

/* ── GM_* API shims ──────────────────────────────────────────── */
const _gmStore = {};
global.GM_getValue = (key, def) => (_gmStore[key] !== undefined ? _gmStore[key] : def);
global.GM_setValue = (key, val) => { _gmStore[key] = val; };
global.GM_addStyle = () => {};

/* ── crypto shims ───────────────────────────────────────────── */
if (!global.crypto) global.crypto = {};
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
if (!global.crypto.subtle) {
  global.crypto.subtle = {
    digest: async (_alg, data) => {
      let h = 5381;
      for (const b of new Uint8Array(data)) h = ((h << 5) + h) ^ b;
      const buf = new ArrayBuffer(32);
      new DataView(buf).setUint32(0, h >>> 0);
      new DataView(buf).setUint32(4, (h * 0x9e3779b9) >>> 0);
      return buf;
    }
  };
}

/* ── BroadcastChannel shim ───────────────────────────────────── */
global.BroadcastChannel = class {
  constructor() {}
  postMessage() {}
  close() {}
  set onmessage(_) {}
};

/* ── document shims ──────────────────────────────────────────── */
if (!global.document.hasFocus) global.document.hasFocus = () => true;
// createElement returns a minimal object — prevents render() crash
const _origCreate = global.document.createElement.bind(global.document);
global.document.createElement = (tag) => {
  try { return _origCreate(tag); } catch { return {}; }
};

/* ── Load and instrument the userscript ──────────────────────── */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const src = fs.readFileSync(
  path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8'
);

/* Strip only the ==UserScript== header block. Keep the IIFE intact. */
const noHeader = src.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

/* Inject export hook INSIDE the IIFE, just before the final })(); 
   This gives us access to locals defined inside the closure.        */
const EXPORT_HOOK = `
/* ─── TEST EXPORT HOOK (injected by test harness) ─── */
if (typeof __GITL_TEST_SINK__ !== 'undefined') {
  const _exp = __GITL_TEST_SINK__;
  [ 'VER','SIGIL_PROCEED','SIGIL_HALT','LEGACY_PROCEED','LEGACY_HALT',
    'MIN_RESPONSE_LEN','GHOST','DIAG','Timeline','GITL_NET',
    'detectSignal','parseProgress','parseRoadmap','randomDelay','sleep',
    'platformHealth','assertInteractionSafe','claimTabLock','releaseTabLock',
    '_tabLockKey','GITL_TAB_ID','RecoveryEngine','GhostBus',
    'gitlSha256','buildCapsuleV2','buildFilename','PROFILES',
    'FUZZY_PROCEED','FUZZY_HALT','WORKFLOW_LIBRARY','PERSONA_LIBRARY',
    'Workshop','WORKSHOP_LIMITS','allPersonas','allWorkflows',
    'SKIN','SKIN_TOKENS','SKIN_FX','SKIN_PRESETS',
    'Adapter','_heurSend','_heurInput','SEND_WORDS','UW',
    'EXPLAIN','_explainLookup',
    'render','runDirectives','hasPendingDirectives','startLoop','stopLoop','resolvePersonaInject',
    'PERSONA_LIBRARY','PAYLOADS','POSTURES',
    'Ticker','unattendedOn','isTabSafeToAct','assertInteractionSafe',
    'POSTURES','POSTURE_CEILING','PAYLOADS',
    'startTabHeartbeat','engineSend','engineHalt','enginePause'
  ].forEach(name => {
    try { if (typeof eval(name) !== 'undefined') _exp[name] = eval(name); } catch(_) {}
  });
}
`;

/* Find the last })(); and insert hook before it */
const instrumented = noHeader.replace(/(\}\)\(\)\s*;?\s*)$/, `${EXPORT_HOOK}\n$1`);

/* Sink object that the hook writes into */
const sink = {};

const ctx = vm.createContext({
  window:    global,
  document:  global.document,
  location:  { href: 'https://chatgpt.com/c/test', hostname: 'chatgpt.com', pathname: '/c/test' },
  navigator: { userAgent: 'Mozilla/5.0 test' },
  innerHeight: 800,
  innerWidth: 1200,
  console,
  setTimeout:           global.setTimeout,
  clearTimeout:         global.clearTimeout,
  setInterval:          global.setInterval,
  clearInterval:        global.clearInterval,
  requestAnimationFrame:(fn) => setTimeout(fn, 16),
  URL:                  global.URL,
  Blob:                 global.Blob,
  Event:                global.Event,
  CustomEvent:          global.CustomEvent,
  EventTarget:          global.EventTarget,
  MutationObserver:     global.MutationObserver || class { observe(){} disconnect(){} },
  XMLHttpRequest:       global.XMLHttpRequest   || class { open(){} send(){} addEventListener(){} },
  crypto:               global.crypto,
  BroadcastChannel:     global.BroadcastChannel,
  performance:          global.performance || { now: Date.now },
  GM_getValue:          global.GM_getValue,
  GM_setValue:          global.GM_setValue,
  GM_addStyle:          global.GM_addStyle,
  __GITL_V8__:          false,     // allow the script to initialise
  __GITL_TEST_SINK__:   sink,
  history:              global.history || { pushState: ()=>{}, replaceState: ()=>{} },
});

try {
  vm.runInContext(instrumented, ctx);
} catch(e) {
  /* Expected: render() fails in jsdom — panel elements don't exist.
     Everything else should be fine.                                  */
  if (!/(panel|Cannot set|Cannot read|getElementById)/i.test(String(e))) {
    console.warn('[test setup] Unexpected script error:', e.message);
  }
}

/* Push all extracted symbols onto global for tests to use */
Object.entries(sink).forEach(([k, v]) => { global[k] = v; });
/* history shim — needed for SPA route watcher */
if (!global.history) {
  global.history = { pushState: () => {}, replaceState: () => {} };
}
