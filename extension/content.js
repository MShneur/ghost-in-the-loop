/*
 * Ghost in the Loop v5.0.0 — Firefox Extension Content Script
 * GM_* API shim → browser.storage.local
 */

// ── GM Shim ──────────────────────────────────────────────────
const _gitlCache = {};

async function _gitlLoadStorage() {
  try {
    const result = await browser.storage.local.get('gitl_data');
    Object.assign(_gitlCache, result.gitl_data || {});
  } catch(e) { console.warn('[GITL] Storage load failed:', e); }
}

function GM_getValue(key, defaultValue) {
  return key in _gitlCache ? _gitlCache[key] : defaultValue;
}

function GM_setValue(key, value) {
  _gitlCache[key] = value;
  browser.storage.local.set({ gitl_data: _gitlCache }).catch(() => {});
}

function GM_addStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Load storage then boot
_gitlLoadStorage().then(() => {
(() => {
'use strict';
if (window.__GITL_V5__) return;
window.__GITL_V5__ = true;

/****************************************************************
 * 1. CONSTANTS
 ****************************************************************/
const VER = '5.0.0';
const SIGIL_PROCEED = '[[GITL::PROCEED]]';
const SIGIL_HALT    = '[[GITL::HALT]]';
const LEGACY_PROCEED = 'PROCEED';
const LEGACY_HALT    = 'SYSTEM_HALT';
const CONTINUE_TEXT  = 'Continue';

const DEFAULTS = {
  tickMs: 2500,
  watchdogSoftMs: 90000,
  watchdogHardMs: 180000,
  minDelaySec: 8,
  maxDelaySec: 15,
  maxRounds: 20,
  staleLimit: 5,
  signalWindow: 400,
  confidenceThreshold: 3
};

/****************************************************************
 * 2. PLATFORM PROFILES
 ****************************************************************/
const PLATFORMS = {
  chatgpt: {
    host: /chatgpt\.com|chat\.openai\.com/,
    label: 'ChatGPT',
    input: ['#prompt-textarea','div[contenteditable="true"][id="prompt-textarea"]','textarea[data-id="root"]','textarea'],
    send: ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send"]','form button[type="submit"]','button[class*="send"]'],
    generating: ['button[aria-label="Stop generating"]','button[data-testid="stop-button"]'],
    assistant: ['div[data-message-author-role="assistant"]','article [data-message-author-role="assistant"]'],
    continueLabels: ['Continue generating','Continue'],
    nativeSetter: true
  },
  perplexity: {
    host: /perplexity\.ai/,
    label: 'Perplexity',
    input: ['textarea[placeholder*="Ask"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','textarea:not([disabled])'],
    send: ['button[aria-label="Submit"]','button[aria-label="Send"]','button[type="submit"]'],
    generating: ['button[aria-label="Stop"]','[data-testid="stop-button"]'],
    assistant: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]','.pb-md > div'],
    continueLabels: [],
    nativeSetter: false
  },
  gemini: {
    host: /gemini\.google\.com/,
    label: 'Gemini',
    input: ['div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','div[contenteditable="true"]','textarea'],
    send: ['button[aria-label="Send message"]','button[aria-label*="Send"]','button.send-button'],
    generating: ['button[aria-label*="Stop"]'],
    assistant: ['model-response message-content','message-content','div[class*="model-response"]'],
    continueLabels: [],
    nativeSetter: false
  },
  deepseek: {
    host: /chat\.deepseek\.com/,
    label: 'DeepSeek',
    input: ['textarea[placeholder]','#chat-input','textarea'],
    send: ['div[class*="send"]','button[class*="send"]','button[aria-label*="Send"]'],
    generating: ['div[class*="stop"]','button[class*="stop"]'],
    assistant: ['div[class*="markdown"]'],
    continueLabels: [],
    nativeSetter: false
  },
  copilot: {
    host: /copilot\.microsoft\.com/,
    label: 'Copilot',
    input: ['textarea#userInput','#searchbox','textarea[placeholder*="message"]','textarea'],
    send: ['button[aria-label="Submit"]','button[title="Submit"]'],
    generating: ['button[aria-label="Stop Responding"]'],
    assistant: ['cib-message-group[source="bot"]'],
    continueLabels: [],
    nativeSetter: false
  },
  grok: {
    host: /grok\.com/,
    label: 'Grok',
    input: ['textarea[placeholder*="Ask"]','textarea','div[contenteditable="true"]'],
    send: ['button[aria-label="Send"]','button[type="submit"]'],
    generating: ['button[aria-label="Stop"]'],
    assistant: ['div[class*="message"][class*="bot"]','div[data-role="assistant"]'],
    continueLabels: [],
    nativeSetter: false
  }
};

const SITE_ID = Object.keys(PLATFORMS).find(k => PLATFORMS[k].host.test(location.hostname));
const SITE = SITE_ID ? PLATFORMS[SITE_ID] : null;
if (!SITE) return;

/****************************************************************
 * 3. PAYLOADS
 ****************************************************************/
const PAYLOADS = {
  loop: {
    label: '▶ Loop',
    hint: 'Step-by-step execution. You set the task.',
    text: `\n\n---\n[Ghost in the Loop v${VER} — Loop Mode]\nExecute this task step by step. One focused section per response.\n\nAt the end of every response, print:\n████░░░░ [Step X of Y] — one line describing what was completed\n\nThen on a new line:\n- More steps remain → [[GITL::PROCEED]]\n- Fully complete → [[GITL::HALT]]\n\nDo not skip the progress line. Make reasonable assumptions.\n---`
  },
  think: {
    label: '🧠 Think First',
    hint: 'AI plans batches at ~80% capacity, then executes.',
    text: `\n\n---\n[Ghost in the Loop v${VER} — Think First Mode]\nBefore doing any work, read this task and plan how to complete it in focused batches.\n\nKeep each batch to ~80% of your comfortable response length.\n\nYour FIRST response: plan only — list batches briefly, end with [[GITL::PROCEED]]\n\nEach subsequent response: complete one batch, end with:\n████░░░░ [Batch X of Y] — what this batch covered\nThen: [[GITL::PROCEED]] or [[GITL::HALT]]\n\nThe script sends "Continue" automatically.\n---`
  }
};

const RESUME_PAYLOAD = `Continue.\n\n[Reminder: end each response with ████░░░░ [Step X of Y] then [[GITL::PROCEED]] if more remain, or [[GITL::HALT]] when fully done.]`;

/****************************************************************
 * 4. STATE
 ****************************************************************/
const S = {
  mode: 'IDLE',
  payloadMode: GM_getValue('payloadMode','loop'),
  rounds: 0,
  maxRounds: GM_getValue('maxRounds', DEFAULTS.maxRounds),
  needsPayload: true,
  isSending: false,
  timer: null,
  lastActivity: Date.now(),
  staleTicks: 0,
  lastSignal: 'none',
  lastConfidence: 0,
  lastProgress: null,
  lastSendPath: 'none',
  collapsed: GM_getValue('panelCollapsed', false),
  position: GM_getValue('panelPosition','bottom-bar'),
  soundOn: GM_getValue('soundOnComplete', true),
  customProceed: GM_getValue('customProceed',''),
  customStop: GM_getValue('customStop',''),
  log: []
};

function log(msg, data) {
  S.log.unshift({ t: new Date().toLocaleTimeString(), msg, data });
  if (S.log.length > 30) S.log.length = 30;
  console.log(`[GITL ${VER}] ${msg}`, data || '');
  render();
}

/****************************************************************
 * 5. DOM ENGINE + SELECTOR CACHE
 ****************************************************************/
const CACHE = new Map();
let lastHref = location.href;

function invalidateCache() { CACHE.clear(); }

function qCached(key, selectors) {
  const cached = CACHE.get(key);
  if (cached?.isConnected) return cached;
  CACHE.delete(key);
  for (const sel of selectors || []) {
    try { const el = document.querySelector(sel); if (el) { CACHE.set(key, el); return el; } } catch(_){}
  }
  return null;
}

function qAll(selectors) {
  for (const sel of (Array.isArray(selectors) ? selectors : [selectors])) {
    try { const els = document.querySelectorAll(sel); if (els.length) return [...els]; } catch(_){}
  }
  return [];
}

const DOM = {
  input()      { return qCached('input', SITE.input); },
  sendBtn()    { return qCached('send', SITE.send); },
  isGenerating() { return !!qCached('gen', SITE.generating); },
  lastText() {
    const els = qAll(SITE.assistant);
    return els.length ? (els[els.length-1].innerText || '').trim() : '';
  },
  hasConvo()   { return qAll(SITE.assistant).length > 0; },
  clickContinue() {
    if (!SITE.continueLabels?.length) return false;
    for (const btn of document.querySelectorAll('button')) {
      if (SITE.continueLabels.some(l => btn.textContent.includes(l))) { btn.click(); log('Clicked native Continue'); return true; }
    }
    return false;
  }
};

/****************************************************************
 * 6. SPA ROUTE DETECTION
 ****************************************************************/
(function patchHistory() {
  const orig = history.pushState;
  history.pushState = function(...a) {
    orig.apply(this, a);
    window.dispatchEvent(new Event('gitl:route'));
  };
  const origReplace = history.replaceState;
  history.replaceState = function(...a) {
    origReplace.apply(this, a);
    window.dispatchEvent(new Event('gitl:route'));
  };
})();

window.addEventListener('popstate', () => window.dispatchEvent(new Event('gitl:route')));
window.addEventListener('gitl:route', () => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    invalidateCache();
    log('Route changed — cache cleared');
    if (S.mode === 'RUNNING') { LOOP.pause('Route changed — paused'); }
  }
});

/****************************************************************
 * 7. SIGNAL ENGINE — halt-first, confidence-scored
 ****************************************************************/
const FUZZY_PROCEED = ['to proceed','shall i continue','should i continue','want me to continue',
  'ready for the next',"type 'continue'",'type "continue"','type continue','say continue',
  'continue?','next section?','go on?','ready to proceed','awaiting your'];

const FUZZY_HALT = ['task complete','all sections complete','all parts complete','that concludes',
  'this concludes','fully complete','everything is complete','all done','sequence complete',
  'final section complete','session complete'];

function parseProgress(text) {
  const m = text.match(/\[(?:Step|Batch|QA Step)\s*(\d+)\s*(?:of|\/)\s*(\d+)\]/i);
  return m ? { step: +m[1], total: +m[2] } : null;
}

function detectSignal(fullText) {
  const tail = (fullText || '').slice(-DEFAULTS.signalWindow);
  const low = tail.toLowerCase();
  const cStop = S.customStop.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const cProceed = S.customProceed.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);

  let haltScore = 0, proceedScore = 0;
  const progress = parseProgress(tail);

  // Exact sigils (highest weight)
  if (tail.includes(SIGIL_HALT))     haltScore += 4;
  if (tail.includes(SIGIL_PROCEED))  proceedScore += 4;

  // Legacy keywords
  if (tail.includes(LEGACY_HALT))    haltScore += 3;
  if (tail.includes(LEGACY_PROCEED)) proceedScore += 3;

  // Fuzzy patterns
  if (FUZZY_HALT.some(p => low.includes(p)))    haltScore += 2;
  if (FUZZY_PROCEED.some(p => low.includes(p))) proceedScore += 2;

  // Custom keywords
  if (cStop.some(p => low.includes(p)))    haltScore += 2;
  if (cProceed.some(p => low.includes(p))) proceedScore += 2;

  // Progress bar = mid-task
  if (progress && progress.step < progress.total) proceedScore += 2;
  if (progress && progress.step >= progress.total) haltScore += 1;

  // HALT-FIRST PRIORITY: halt wins ties
  if (haltScore >= DEFAULTS.confidenceThreshold && haltScore >= proceedScore)
    return { signal: 'halt', confidence: haltScore, progress };
  if (proceedScore >= DEFAULTS.confidenceThreshold)
    return { signal: 'proceed', confidence: proceedScore, progress };

  return { signal: 'none', confidence: Math.max(haltScore, proceedScore), progress };
}

/****************************************************************
 * 8. SEND ENGINE — locked, with Enter fallback + randomized delay
 ****************************************************************/
function injectText(el, text) {
  if (!el) return false;
  el.focus();
  if (el.getAttribute('contenteditable') === 'true') {
    el.innerHTML = '';
    try { document.execCommand('insertText', false, text); } catch(_) { el.textContent = text; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    return true;
  }
  if (SITE.nativeSetter && el.tagName === 'TEXTAREA') {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) { setter.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
  }
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function pressEnter(el) {
  ['keydown','keypress','keyup'].forEach(t => {
    el.dispatchEvent(new KeyboardEvent(t, { key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true }));
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randomDelay() {
  return (DEFAULTS.minDelaySec + Math.random() * (DEFAULTS.maxDelaySec - DEFAULTS.minDelaySec)) * 1000;
}

async function send(text, skipDelay) {
  if (S.isSending) { log('Send blocked — lock active'); return false; }
  S.isSending = true;
  try {
    if (!skipDelay) {
      const delay = randomDelay();
      log(`Waiting ${(delay/1000).toFixed(1)}s before send…`);
      await sleep(delay);
    }
    if (S.mode !== 'RUNNING') return false;

    const input = DOM.input();
    if (!input) { log('Input not found'); LOOP.pause('Input element missing'); return false; }
    if (!injectText(input, text)) { log('Inject failed'); LOOP.pause('Text injection failed'); return false; }

    await sleep(500);
    const btn = DOM.sendBtn();
    if (btn && !btn.disabled) {
      btn.click();
      S.lastSendPath = 'button';
    } else {
      await sleep(600);
      const btn2 = DOM.sendBtn();
      if (btn2 && !btn2.disabled) { btn2.click(); S.lastSendPath = 'button-retry'; }
      else { pressEnter(input); S.lastSendPath = 'enter-key'; }
    }
    S.rounds++;
    S.lastActivity = Date.now();
    S.staleTicks = 0;
    log(`Sent "${text.slice(0,20)}…"`, { round: S.rounds, path: S.lastSendPath });
    render();
    return true;
  } catch(e) {
    log('Send error', { err: String(e) });
    LOOP.pause('Send failed');
    return false;
  } finally {
    setTimeout(() => { S.isSending = false; }, 1500);
  }
}

/****************************************************************
 * 9. LOOP ENGINE + WATCHDOG
 ****************************************************************/
const LOOP = {
  start() {
    if (S.mode === 'RUNNING') return;
    const input = DOM.input();
    const typed = input ? (input.value || input.textContent || '').trim() : '';

    // CASE 1: Resume from pause
    if (!S.needsPayload) {
      S.mode = 'RUNNING';
      S.lastActivity = Date.now();
      if (!S.timer) S.timer = setInterval(() => LOOP.tick(), DEFAULTS.tickMs);
      log('Resumed');
      render();
      LOOP.tick();
      return;
    }

    // CASE 2: New cycle with prompt
    if (typed) {
      S.needsPayload = false;
      S.rounds = 0;
      S.lastProgress = null;
      S.staleTicks = 0;
      S.mode = 'RUNNING';
      S.lastActivity = Date.now();
      send(typed + PAYLOADS[S.payloadMode].text, true); // skip delay for first send
      S.timer = setInterval(() => LOOP.tick(), DEFAULTS.tickMs);
      log('Started — new cycle');
      render();
      return;
    }

    // CASE 3: Empty input, existing conversation — resume
    if (DOM.hasConvo()) {
      S.needsPayload = false;
      S.rounds = 0;
      S.lastProgress = null;
      S.staleTicks = 0;
      S.mode = 'RUNNING';
      S.lastActivity = Date.now();
      send(RESUME_PAYLOAD, true);
      S.timer = setInterval(() => LOOP.tick(), DEFAULTS.tickMs);
      log('Started — resuming session');
      render();
      return;
    }

    // CASE 4: Nothing
    log('Cannot start — type a prompt or open an existing chat');
    render();
  },

  pause(reason = 'Paused') {
    S.mode = 'PAUSED';
    clearInterval(S.timer); S.timer = null;
    log(reason);
    render();
  },

  stop(reason = 'Stopped') {
    S.mode = 'IDLE';
    S.rounds = 0; S.staleTicks = 0;
    S.lastProgress = null; S.lastSignal = 'none'; S.lastConfidence = 0;
    S.needsPayload = true;
    clearInterval(S.timer); S.timer = null;
    log(reason);
    render();
  },

  complete(reason = '✅ Done!') {
    S.mode = 'COMPLETE';
    S.needsPayload = true;
    clearInterval(S.timer); S.timer = null;
    log(reason);
    render();
    if (S.soundOn) playBeep();
  },

  tick() {
    if (S.mode !== 'RUNNING') return;

    // Watchdog
    const idle = Date.now() - S.lastActivity;
    if (idle > DEFAULTS.watchdogHardMs) { LOOP.pause('Watchdog: no activity for 3min'); return; }
    if (idle > DEFAULTS.watchdogSoftMs) { log('Watchdog: soft warning — 90s idle'); }

    // Round limit
    if (S.rounds >= S.maxRounds) { LOOP.pause(`Round limit (${S.maxRounds}) reached`); return; }

    // Still generating
    if (DOM.isGenerating()) { S.lastActivity = Date.now(); return; }

    // Native continue button
    if (DOM.clickContinue()) { S.lastActivity = Date.now(); return; }

    // Read output
    const text = DOM.lastText();
    if (!text) { S.staleTicks++; if (S.staleTicks >= DEFAULTS.staleLimit) LOOP.pause('No output detected'); return; }

    // Detect signal
    const result = detectSignal(text);
    S.lastSignal = result.signal;
    S.lastConfidence = result.confidence;
    if (result.progress) S.lastProgress = result.progress;

    if (result.signal === 'halt') { LOOP.complete(); return; }
    if (result.signal === 'proceed') {
      send(CONTINUE_TEXT);
      return;
    }

    // No signal
    S.staleTicks++;
    if (S.staleTicks >= DEFAULTS.staleLimit) LOOP.pause('No signal detected — review output');
  }
};

/****************************************************************
 * 10. EXPORT
 ****************************************************************/
function exportChat(format) {
  const msgs = qAll(SITE.assistant);
  if (!msgs.length) { log('Export: no messages found'); return; }
  const texts = msgs.map((el, i) => ({ i: i+1, text: (el.innerText||'').trim() })).filter(m => m.text);
  const title = document.title.replace(/\s*[-|].*$/, '').trim() || 'Untitled';
  const safeTitle = title.replace(/[^a-z0-9]+/gi, '-').slice(0, 60).toLowerCase();
  const ts = new Date().toISOString();
  let content, type, ext;

  if (format === 'json') {
    content = JSON.stringify({ meta: { app: `Ghost in the Loop v${VER}`, platform: SITE.label, title, url: location.href, exported: ts }, messages: texts }, null, 2);
    type = 'application/json'; ext = 'json';
  } else {
    content = `${SITE.label} — ${title}\n${location.href}\nExported: ${ts}\n\n` + texts.map(m => `[${m.i}]\n${m.text}\n\n${'─'.repeat(40)}\n`).join('\n');
    type = 'text/plain'; ext = 'txt';
  }

  const blob = new Blob([content], { type: type + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${SITE_ID}_${safeTitle}.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  log(`Exported ${ext.toUpperCase()}`);
}

/****************************************************************
 * 11. AUDIO
 ****************************************************************/
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

/****************************************************************
 * 12. UI
 ****************************************************************/
GM_addStyle(`
  #gitl{position:fixed;z-index:2147483647;width:280px;background:#0f1117;border:1px solid #23252e;
    border-radius:12px;padding:10px 12px;font:11px 'SF Mono','JetBrains Mono',monospace;
    color:#c8cad0;box-shadow:0 8px 32px rgba(0,0,0,.5);user-select:none}
  #gitl *{box-sizing:border-box}
  #gitl.collapsed .g-body{display:none}
  #gitl.collapsed{width:auto;min-width:200px}
  .g-hdr{display:flex;justify-content:space-between;align-items:center;cursor:grab;padding:2px 0;margin-bottom:6px}
  .g-hdr:active{cursor:grabbing}
  .g-logo{font-weight:800;font-size:10px;text-transform:uppercase;color:#777;letter-spacing:.5px}
  .g-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:5px;vertical-align:middle;transition:all .3s}
  .g-dot.run{background:#34d399;box-shadow:0 0 6px #34d399}.g-dot.pause{background:#fbbf24}
  .g-dot.done{background:#818cf8}.g-dot.err{background:#f87171}.g-dot.idle{background:#555}
  .g-plat{font-size:10px;background:#1a1b22;padding:2px 7px;border-radius:4px;color:#818cf8;font-weight:600}
  .g-minbtn{background:#1a1b22;border:1px solid #2e303a;color:#aaa;font-size:10px;cursor:pointer;
    padding:2px 8px;border-radius:4px;font-weight:700;margin-left:5px;transition:all .15s}
  .g-minbtn:hover{background:#2e303a;color:#fff}
  .g-coll-row{display:none;align-items:center;gap:6px;margin-top:4px}
  #gitl.collapsed .g-coll-row{display:flex}
  .g-qbtn{width:36px;height:26px;border:none;border-radius:6px;font-size:13px;cursor:pointer;transition:all .15s}
  .g-qbtn.play{background:#064e3b;color:#34d399}.g-qbtn.pause{background:#422006;color:#fbbf24}
  .g-qstat{font-size:10px;font-weight:600}
  .g-modes{display:flex;gap:3px;margin-bottom:6px}
  .g-md{flex:1;padding:4px 0;border:1px solid #23252e;border-radius:5px;background:#1a1b22;
    color:#777;font-size:10px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s}
  .g-md.act{background:#1e1b4b;border-color:#4338ca;color:#a5b4fc}
  .g-hint{font-size:9px;color:#555;margin-bottom:6px;padding:3px 5px;background:#12131a;
    border-radius:3px;border-left:2px solid #23252e;line-height:1.4}
  .g-btns{display:flex;gap:3px;margin-bottom:6px}
  .g-btn{flex:1;padding:6px 0;border:1px solid #23252e;border-radius:6px;background:#1a1b22;
    color:#c8cad0;font-size:13px;cursor:pointer;text-align:center;transition:all .15s;font-family:inherit}
  .g-btn:hover{background:#23252e}
  .g-btn.go{background:#064e3b;border-color:#065f46;color:#34d399}
  .g-btn.go:hover{background:#065f46}
  .g-btn.st{background:#450a0a;border-color:#7f1d1d;color:#f87171}
  .g-prog{margin:4px 0}
  .g-trk{height:4px;background:#1a1b22;border-radius:2px;overflow:hidden}
  .g-fill{height:100%;background:linear-gradient(90deg,#34d399,#818cf8);border-radius:2px;transition:width .4s}
  .g-plbl{display:flex;justify-content:space-between;font-size:9px;color:#555;margin-top:2px}
  .g-stat{text-align:center;font-weight:600;font-size:10px;padding:4px 0;border-top:1px solid #1a1b22;margin-top:2px}
  .g-meta{display:flex;justify-content:space-between;font-size:9px;color:#555;margin-top:4px}
  .g-meta input,.g-meta select{width:50px;background:#1a1b22;border:1px solid #2e303a;border-radius:3px;
    color:#c8cad0;font-size:9px;padding:2px 3px;text-align:center;font-family:inherit}
  .g-sig{font-size:9px;color:#555;margin-top:4px;padding:3px 5px;background:#0a0b0f;border-radius:3px}
  .g-sig b{color:#777}
  .g-row{display:flex;align-items:center;justify-content:space-between;font-size:9px;color:#666;
    margin-top:5px;padding-top:5px;border-top:1px solid #1a1b22}
  .g-tog{width:26px;height:13px;background:#23252e;border-radius:7px;position:relative;cursor:pointer;transition:all .2s}
  .g-tog.on{background:#065f46}
  .g-tog::after{content:'';width:9px;height:9px;background:#999;border-radius:50%;position:absolute;top:2px;left:2px;transition:left .2s}
  .g-tog.on::after{left:15px;background:#34d399}
  .g-pos{display:flex;gap:2px}
  .g-p{background:#1a1b22;border:1px solid #2e303a;color:#777;font-size:11px;width:20px;height:18px;
    cursor:pointer;border-radius:3px;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .g-p:hover{background:#2e303a;color:#fff}.g-p.act{background:#1e1b4b;border-color:#4338ca;color:#a5b4fc}
  .g-exp{display:flex;gap:3px;margin-top:5px;padding-top:5px;border-top:1px solid #1a1b22}
  .g-exp button{flex:1;padding:3px 0;border:1px solid #23252e;border-radius:4px;background:#1a1b22;
    color:#888;font-size:9px;cursor:pointer;font-family:inherit}
  .g-exp button:hover{background:#23252e;color:#c8cad0}
  .g-log{margin-top:5px;padding-top:5px;border-top:1px solid #1a1b22;max-height:80px;overflow-y:auto;
    font-size:8px;color:#444;line-height:1.5}
  .g-shortcuts{font-size:8px;color:#333;text-align:center;margin-top:4px}
  #gitl .g-peek-btn{font-size:8px;color:#444;cursor:pointer;margin-top:4px}
  #gitl .g-peek-btn:hover{color:#888}
  #gitl .g-peek{display:none;margin-top:4px;padding:5px;background:#0a0b0f;border-radius:3px;
    font-size:8px;color:#444;white-space:pre-wrap;max-height:120px;overflow-y:auto}
  #gitl .g-peek.open{display:block}
  #gitl.pos-bb{bottom:0!important;left:0!important;right:0!important;width:100%!important;
    border-radius:10px 10px 0 0!important;top:auto!important}
`);

const panel = document.createElement('div');
panel.id = 'gitl';
document.body.appendChild(panel);

function applyPosition(pos) {
  const G = '12px';
  panel.style.top = panel.style.bottom = panel.style.left = panel.style.right = 'auto';
  panel.style.width = '280px';
  panel.classList.remove('pos-bb');
  if (pos==='top-right'){panel.style.top=G;panel.style.right=G}
  else if(pos==='top-left'){panel.style.top=G;panel.style.left=G}
  else if(pos==='bot-right'){panel.style.bottom=G;panel.style.right=G}
  else if(pos==='bot-left'){panel.style.bottom=G;panel.style.left=G}
  else if(pos==='bottom-bar'){panel.classList.add('pos-bb')}
}

function render() {
  const dotClass = S.mode==='RUNNING'?'run':S.mode==='PAUSED'?'pause':S.mode==='COMPLETE'?'done':S.mode==='ERROR'?'err':'idle';
  const p = S.lastProgress;
  const pct = p ? Math.round((p.step/p.total)*100) : 0;
  const pm = S.payloadMode;
  const peekOpen = panel.querySelector('.g-peek')?.classList.contains('open');

  panel.className = S.collapsed ? 'collapsed' : '';
  if (S.position === 'bottom-bar') panel.classList.add('pos-bb');

  panel.innerHTML = `
    <div class="g-hdr">
      <span class="g-logo">👻 Ghost Loop <span class="g-dot ${dotClass}"></span></span>
      <span style="display:flex;align-items:center;gap:4px">
        <span class="g-plat">${SITE.label}</span>
        <button class="g-minbtn" id="g-col">${S.collapsed?'▲':'▼'}</button>
      </span>
    </div>
    <div class="g-coll-row">
      <button class="g-qbtn ${S.mode==='RUNNING'?'pause':'play'}" id="g-quick">${S.mode==='RUNNING'?'⏸':'▶'}</button>
      <span class="g-qstat" style="color:${S.mode==='RUNNING'?'#34d399':S.mode==='PAUSED'?'#fbbf24':'#555'}">${S.mode==='RUNNING'?'Running…':S.mode==='PAUSED'?'Paused':S.mode==='COMPLETE'?'Done':'Idle'}</span>
    </div>
    <div class="g-body">
      <div class="g-modes">
        <button class="g-md${pm==='loop'?' act':''}" data-m="loop">${PAYLOADS.loop.label}</button>
        <button class="g-md${pm==='think'?' act':''}" data-m="think">${PAYLOADS.think.label}</button>
      </div>
      <div class="g-hint">${PAYLOADS[pm].hint}</div>
      <div class="g-btns">
        <button class="g-btn go" id="g-play">▶</button>
        <button class="g-btn" id="g-pause">⏸</button>
        <button class="g-btn st" id="g-stop">■</button>
      </div>
      <div class="g-prog">
        <div class="g-trk"><div class="g-fill" style="width:${pct}%"></div></div>
        <div class="g-plbl">
          <span>${p?`${pm==='think'?'Batch':'Step'} ${p.step}/${p.total}`:'Waiting…'}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="g-stat" style="color:${S.mode==='RUNNING'?'#34d399':S.mode==='PAUSED'?'#fbbf24':S.mode==='COMPLETE'?'#818cf8':'#555'}">
        ${S.mode==='RUNNING'?`Round ${S.rounds}/${S.maxRounds}`:S.mode} ${S.log[0]?.msg&&S.mode!=='IDLE'?'— '+S.log[0].msg.slice(0,30):''}
      </div>
      <div class="g-sig">
        <b>Signal:</b> ${S.lastSignal} (${S.lastConfidence}) · <b>Via:</b> ${S.lastSendPath}
      </div>
      <div class="g-meta">
        <span>Rounds: <strong>${S.rounds}</strong></span>
        <span>Limit: <input id="g-limit" type="number" min="1" max="999" value="${S.maxRounds}"></span>
      </div>
      <div class="g-row">
        <span>🔔 Sound</span>
        <div class="g-tog${S.soundOn?' on':''}" id="g-snd"></div>
      </div>
      <div class="g-row">
        <span>📍 Position</span>
        <div class="g-pos">
          ${['top-left','top-right','bot-left','bot-right','bottom-bar'].map(pos=>
            `<button class="g-p${S.position===pos?' act':''}" data-pos="${pos}">${
              pos==='top-left'?'↖':pos==='top-right'?'↗':pos==='bot-left'?'↙':pos==='bot-right'?'↘':'━'
            }</button>`
          ).join('')}
        </div>
      </div>
      <div class="g-exp">
        <button id="g-exp-txt">📄 Export TXT</button>
        <button id="g-exp-json">📋 Export JSON</button>
      </div>
      <div class="g-peek-btn" id="g-peek-btn">${peekOpen?'▾ Hide payload':'▸ What gets injected'}</div>
      <div class="g-peek${peekOpen?' open':''}" id="g-peek">${PAYLOADS[pm].text.replace(/</g,'&lt;')}</div>
      <div class="g-log">${S.log.slice(0,8).map(l=>`<span style="color:#555">${l.t}</span> ${l.msg}`).join('<br>')}</div>
      <div class="g-shortcuts">v${VER} · Alt+P toggle · Alt+S stop</div>
    </div>`;

  // Bind events
  panel.querySelector('#g-col')?.addEventListener('click', () => { S.collapsed=!S.collapsed; GM_setValue('panelCollapsed',S.collapsed); render(); });
  panel.querySelector('#g-quick')?.addEventListener('click', () => { S.mode==='RUNNING'?LOOP.pause():LOOP.start(); });
  panel.querySelector('#g-play')?.addEventListener('click', () => LOOP.start());
  panel.querySelector('#g-pause')?.addEventListener('click', () => LOOP.pause());
  panel.querySelector('#g-stop')?.addEventListener('click', () => LOOP.stop());
  panel.querySelectorAll('.g-md').forEach(b => b.addEventListener('click', () => {
    if(S.mode==='RUNNING') return;
    S.payloadMode=b.dataset.m; S.needsPayload=true; GM_setValue('payloadMode',S.payloadMode); render();
  }));
  panel.querySelector('#g-limit')?.addEventListener('change', e => {
    const v=parseInt(e.target.value,10); if(v>0&&v<=999){S.maxRounds=v; GM_setValue('maxRounds',v);}
  });
  panel.querySelector('#g-snd')?.addEventListener('click', function(){ this.classList.toggle('on'); S.soundOn=this.classList.contains('on'); GM_setValue('soundOnComplete',S.soundOn); });
  panel.querySelectorAll('.g-p').forEach(b => b.addEventListener('click', () => {
    S.position=b.dataset.pos; GM_setValue('panelPosition',S.position); applyPosition(S.position); render();
  }));
  panel.querySelector('#g-exp-txt')?.addEventListener('click', () => exportChat('txt'));
  panel.querySelector('#g-exp-json')?.addEventListener('click', () => exportChat('json'));
  panel.querySelector('#g-peek-btn')?.addEventListener('click', () => {
    const p=panel.querySelector('#g-peek'),b=panel.querySelector('#g-peek-btn');
    if(p&&b){p.classList.toggle('open'); b.textContent=p.classList.contains('open')?'▾ Hide payload':'▸ What gets injected';}
  });
  applyPosition(S.position);
}

render();

/****************************************************************
 * 13. KEYBOARD SHORTCUTS
 ****************************************************************/
document.addEventListener('keydown', e => {
  if(e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault(); S.mode==='RUNNING'?LOOP.pause():LOOP.start();}
  if(e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault(); LOOP.stop();}
});

/****************************************************************
 * 14. MUTATION OBSERVER — supplement polling
 ****************************************************************/
let mutDebounce;
new MutationObserver(() => {
  if(S.mode!=='RUNNING') return;
  clearTimeout(mutDebounce);
  mutDebounce = setTimeout(() => { S.lastActivity = Date.now(); DOM.clickContinue(); }, 300);
}).observe(document.body, { childList: true, subtree: true });

/****************************************************************
 * 15. CRASH RECOVERY — persist state on unload, offer resume
 ****************************************************************/
window.addEventListener('beforeunload', () => {
  if(S.mode==='RUNNING'||S.mode==='PAUSED') {
    GM_setValue('crashState', JSON.stringify({ mode:S.mode, rounds:S.rounds, payloadMode:S.payloadMode, url:location.href, ts:Date.now() }));
  }
});

(function checkCrashRecovery() {
  try {
    const raw = GM_getValue('crashState','');
    if(!raw) return;
    const cs = JSON.parse(raw);
    GM_setValue('crashState','');
    if(Date.now()-cs.ts > 300000) return; // >5min ago, stale
    if(cs.url !== location.href) return;
    log(`Previous session detected (${cs.rounds} rounds). Press ▶ to resume.`);
  } catch(_){}
})();

/****************************************************************
 * 16. BOOT
 ****************************************************************/
log(`Loaded on ${SITE.label}`);
})();
}).catch(e => console.error("[GITL] Boot failed:", e));
