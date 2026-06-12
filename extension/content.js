// Firefox MV3 Extension wrapper — GM shim + Ghost in the Loop v6.6.0 engine
(function() {
  'use strict';
  const _storageCache = {};
  let _ready = false;
  function _initStorage() {
    return new Promise(resolve => {
      try {
        browser.storage.local.get(null).then(data => {
          Object.assign(_storageCache, data);
          _ready = true;
          resolve();
        });
      } catch(_) { _ready = true; resolve(); }
    });
  }
  function GM_getValue(key, def) { return key in _storageCache ? _storageCache[key] : def; }
  function GM_setValue(key, val) { _storageCache[key] = val; try { browser.storage.local.set({ [key]: val }); } catch(_){} }
  function GM_addStyle(css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }

  _initStorage().then(() => {
window.__GITL_V6__ = true;

/* ═══════════════════════════════════════════════════════════════
   LAYER 0 — CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const VER = '6.6.0';
const SIGIL_PROCEED = '[[GITL::PROCEED]]';
const SIGIL_HALT    = '[[GITL::HALT]]';
const LEGACY_PROCEED = 'PROCEED';
const LEGACY_HALT    = 'SYSTEM_HALT';
const MIN_RESPONSE_LEN = 50;

/* ═══════════════════════════════════════════════════════════════
   LAYER 1 — PLATFORM ADAPTERS (all DOM access lives here)
   The loop engine NEVER touches the DOM directly.
   ═══════════════════════════════════════════════════════════════ */
const PROFILES = {
  chatgpt: {
    host: /chatgpt\.com|chat\.openai\.com/,
    label: 'ChatGPT',
    input: ['#prompt-textarea','div[contenteditable="true"][id="prompt-textarea"]','textarea[data-id="root"]','textarea'],
    send: ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send"]','form button[type="submit"]','button[class*="send"]'],
    stop: ['button[aria-label="Stop generating"]','button[data-testid="stop-button"]'],
    assistant: ['div[data-message-author-role="assistant"]','article [data-message-author-role="assistant"]'],
    continueLabels: ['Continue generating','Continue'],
    useCE: false, useNS: true
  },
  perplexity: {
    host: /perplexity\.ai/,
    label: 'Perplexity',
    input: ['textarea[placeholder*="Ask"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','textarea:not([disabled])'],
    send: ['button[aria-label="Submit"]','button[aria-label="Send"]','button[type="submit"]'],
    stop: ['button[aria-label="Stop"]','[data-testid="stop-button"]'],
    assistant: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]','.pb-md > div'],
    continueLabels: [],
    useCE: true, useNS: false
  },
  gemini: {
    host: /gemini\.google\.com/,
    label: 'Gemini',
    input: ['div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','div[contenteditable="true"]','textarea'],
    send: ['button[aria-label="Send message"]','button[aria-label*="Send"]','button.send-button'],
    stop: ['button[aria-label*="Stop"]'],
    assistant: ['model-response message-content','message-content','div[class*="model-response"]'],
    continueLabels: [],
    useCE: true, useNS: false
  },
  deepseek: {
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
    host: /grok\.com/,
    label: 'Grok',
    input: ['textarea[placeholder*="Ask"]','textarea','div[contenteditable="true"]'],
    send: ['button[aria-label="Send"]','button[type="submit"]'],
    stop: ['button[aria-label="Stop"]'],
    assistant: ['div[class*="message"][class*="bot"]','div[data-role="assistant"]'],
    continueLabels: [],
    useCE: false, useNS: false
  },
  claude: {
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

function _q(key, sels) {
  const c = _cache.get(key);
  if (c?.isConnected) return c;
  _cache.delete(key);
  for (const s of sels || []) {
    try { const el = document.querySelector(s); if (el) { _cache.set(key, el); return el; } } catch(_){}
  }
  // Shadow DOM fallback (Copilot-style shadow roots) — throttled to once per 5s per key
  const now = Date.now();
  if ((now - (_deepLast.get(key) || 0)) > 5000) {
    _deepLast.set(key, now);
    for (const s of sels || []) {
      const el = _shadowQS(s);
      if (el) { _cache.set(key, el); return el; }
    }
  }
  return null;
}

function _qAll(sels) {
  // Merge all matching elements, deduplicated (fixes v5 qAll bug)
  const seen = new Set(), results = [];
  for (const s of (Array.isArray(sels) ? sels : [sels])) {
    try { document.querySelectorAll(s).forEach(el => { if (!seen.has(el)) { seen.add(el); results.push(el); } }); } catch(_){}
  }
  return results;
}

// Adapter — all DOM reads/writes
const Adapter = {
  getInput()      { return _q('in', PLAT.input); },
  getSendBtn()    { return _q('send', PLAT.send); },
  isGenerating()  { return !!_q('gen', PLAT.stop); },
  hasMessages()   { return _qAll(PLAT.assistant).length > 0; },
  getLastText() {
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
      if (!ok) { el.textContent = text; }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      DIAG.sendPath = 'contenteditable';
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
    ['keydown','keypress','keyup'].forEach(t => {
      el.dispatchEvent(new KeyboardEvent(t, { key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true }));
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

function resolvePersonaInject() {
  const sel = GHOST.persona.selected;
  if (sel === 'roundtable' && /Perplexity/i.test(PLAT.label)) return ROUNDTABLE_LIVE;
  return PERSONA_LIBRARY[sel]?.inject || '';
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

const GHOST = {
  project: { name: GM_getValue('projectName',''), slug: GM_getValue('projectSlug','') },
  workflow: {
    selected: GM_getValue('wfSelected','none'),
    stageIndex: GM_getValue('wfStage',0),
    autoAdvance: GM_getValue('wfAuto',true),
    pauseBetween: GM_getValue('wfPause',false),
    active: false
  },
  persona: { selected: GM_getValue('persona','none') },
  roadmap: {
    steps: JSON.parse(GM_getValue('rmSteps','[]')),
    index: GM_getValue('rmIndex',0),
    captured: GM_getValue('rmCaptured',false),
    synthSent: false
  },
  loop: {
    state: 'IDLE', // IDLE | RUNNING | PAUSED | COMPLETE | ERROR
    payloadMode: GM_getValue('payloadMode','loop'),
    round: 0,
    maxRounds: GM_getValue('maxRounds',20),
    needsPayload: true,
    isSending: false,
    timer: null,
    lastActivity: Date.now(),
    staleTicks: 0,
    lastSignal: 'none',
    lastConfidence: 0,
    lastProgress: null,
    detail: ''
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
    helpSec: 'start',
    qDraft: (()=>{ try { const a = JSON.parse(GM_getValue('qDraft','[""]')); return Array.isArray(a)&&a.length?a:['']; } catch(_){ return ['']; } })(),
    expAdv: GM_getValue('expAdv',false),
    showDiag: false,
    showSites: false,
    firstRun: GM_getValue('firstRun',true)
  }
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
    console.warn('[Ghost 6.1]', msg);
  },
  runProbe() {
    // Live-test every selector chain; report the winning selector + match count per role.
    const out = [];
    for (const k of ['input','send','stop','assistant']) {
      let win = '', n = 0;
      for (const s of PLAT[k] || []) {
        try { const m = document.querySelectorAll(s); if (m.length) { win = s; n = m.length; break; } } catch(_){}
      }
      out.push(n ? `✓ ${k}: ${win} (${n})` : `✗ ${k}: NO MATCH`);
    }
    this.probe = out.join('\n');
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
  // Legacy keywords
  if (tail.includes(LEGACY_HALT))    hScore += 3;
  if (tail.includes(LEGACY_PROCEED)) pScore += 3;
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
  engineSend(`Continue.\n\n[Ghost roadmap — step ${i+1} of ${n}]\n${R.steps[i]}\n\nComplete this step fully and concretely. Deliverable output only, no fluff. End with [[GITL::PROCEED]] when this step is done — or [[GITL::HALT]] only if the ENTIRE roadmap is genuinely finished.`, false)
    .then(ok => { if (ok) { R.index = i + 1; _save('rmIndex', R.index); render(); } });
}

function sendRoadmapSynthesis() {
  GHOST.roadmap.synthSent = true;
  GHOST.loop.detail = '🗺 Final synthesis';
  engineSend(`Continue.\n\n[Ghost roadmap — final synthesis]\nAll roadmap steps are complete. Compile the final deliverable: merge every step's output into one clean, complete, ready-to-use result. No recap of process, no fluff. End with [[GITL::HALT]].`, false);
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

async function engineSend(text, skipDelay) {
  const L = GHOST.loop;
  if (L.isSending) { DIAG.push('Send blocked — lock active'); return false; }
  L.isSending = true;
  try {
    if (!skipDelay) {
      const delay = randomDelay(L.round);
      L.detail = `Waiting ${(delay/1000).toFixed(0)}s…`;
      render();
      await sleep(delay);
    }
    if (L.state !== 'RUNNING') return false;
    const input = Adapter.getInput();
    if (!input) { DIAG.push('No input element'); pauseWithProbe('Input element missing'); return false; }
    if (!Adapter.injectText(input, text)) { DIAG.push('Inject failed'); pauseWithProbe('Text injection failed'); return false; }
    await sleep(500);
    // 5-path send: button → retry → retry → retry → Enter key
    let sent = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const btn = Adapter.getSendBtn();
      if (btn && !btn.disabled) { btn.click(); DIAG.sendPath = `btn-${attempt+1}`; sent = true; break; }
      await sleep(600);
    }
    if (!sent) { Adapter.pressEnter(input); DIAG.sendPath = 'enter-key'; }
    L.round++;
    L.lastActivity = Date.now();
    L.staleTicks = 0;
    L.detail = '';
    render();
    return true;
  } catch(e) {
    DIAG.push('Send error: ' + String(e));
    enginePause('Send failed');
    return false;
  } finally {
    setTimeout(() => { L.isSending = false; }, 1500);
  }
}

function engineHalt(reason) {
  const L = GHOST.loop;
  L.state = 'COMPLETE'; L.detail = reason; L.needsPayload = true;
  clearInterval(L.timer); L.timer = null;
  render();
  if (GHOST.ui.soundOn) playBeep();
  notify(reason);
}

function enginePause(reason) {
  const L = GHOST.loop;
  L.state = 'PAUSED'; L.detail = reason;
  clearInterval(L.timer); L.timer = null;
  render();
  notify('⏸ ' + reason);
}

function engineTick() {
  const L = GHOST.loop;
  if (L.state !== 'RUNNING') return;

  // Watchdog — 90s soft, 180s hard
  const idle = Date.now() - L.lastActivity;
  if (idle > 180000) { enginePause('Watchdog: no activity 3min'); return; }
  if (idle > 90000) { L.detail = '⚠ Watchdog: 90s idle'; render(); }

  // Round limit
  if (L.round >= L.maxRounds) { enginePause(`Round limit (${L.maxRounds}) reached`); return; }

  // Still generating
  if (Adapter.isGenerating()) { L.lastActivity = Date.now(); return; }

  // Native continue button
  if (Adapter.clickContinue()) { L.lastActivity = Date.now(); return; }

  // Read output
  const text = Adapter.getLastText();
  if (!text) { L.staleTicks++; if (L.staleTicks >= 5) pauseWithProbe('No output detected'); return; }

  // Detect signal
  const result = detectSignal(text);
  L.lastSignal = result.signal;
  L.lastConfidence = result.confidence;
  if (result.progress) L.lastProgress = result.progress;

  if (result.signal === 'short') { L.staleTicks++; if (L.staleTicks >= 3) enginePause('Response too short — review output'); return; }

  if (result.signal === 'halt') {
    L.staleTicks = 0;
    // Workflow auto-advance
    if (GHOST.workflow.active && GHOST.workflow.autoAdvance) {
      const wf = WORKFLOW_LIBRARY[GHOST.workflow.selected] || WORKFLOW_LIBRARY.none;
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
    if (L.payloadMode === 'roadmap' && GHOST.roadmap.captured) { engineHalt('✅ Roadmap complete'); resetRoadmap(); return; }
    engineHalt('✅ Task complete');
    return;
  }

  if (result.signal === 'proceed') {
    L.staleTicks = 0;
    if (L.payloadMode === 'roadmap') {
      const R = GHOST.roadmap;
      if (!R.captured) {
        if (parseRoadmap(text)) { L.detail = `🗺 Roadmap captured: ${R.steps.length} steps`; render(); sendRoadmapStep(); }
        else { enginePause('Roadmap mode: no [[GITL::ROADMAP]] list found — review output, then ▶ to retry'); }
        return;
      }
      if (R.index < R.steps.length) { sendRoadmapStep(); return; }
      if (!R.synthSent) { sendRoadmapSynthesis(); return; }
      engineHalt('✅ Roadmap complete'); resetRoadmap(); return;
    }
    engineSend('Continue', false);
    return;
  }

  // No signal
  L.staleTicks++;
  if (L.staleTicks >= 5) enginePause('No signal detected — review output');
}

// Watchdog heartbeat (supplements tick)
setInterval(() => {
  if (GHOST.loop.state !== 'RUNNING' || !GHOST.loop.lastActivity) return;
  if (Date.now() - GHOST.loop.lastActivity > 45000) {
    DIAG.push('Watchdog heartbeat: 45s stale');
  }
}, 10000);

function startLoop() {
  const L = GHOST.loop;
  if (L.state === 'RUNNING') return;
  const input = Adapter.getInput();
  const typed = input ? (input.value || input.textContent || '').trim() : '';

  // Mark first run done
  if (GHOST.ui.firstRun) { GHOST.ui.firstRun = false; _save('firstRun', false); }

  // Case 1: resume from pause
  if (!L.needsPayload) {
    L.state = 'RUNNING'; L.lastActivity = Date.now(); L.detail = '';
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    L.timer = setInterval(engineTick, 2500);
    render(); engineTick();
    return;
  }

  // Case 2: new prompt
  if (typed) {
    L.needsPayload = false; L.round = 0; L.lastProgress = null; L.staleTicks = 0;
    L.state = 'RUNNING'; L.lastActivity = Date.now();
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    if (L.payloadMode === 'roadmap') { resetRoadmap(); GHOST.workflow.active = false; }
    const personaInject = resolvePersonaInject();
    const full = typed + (personaInject ? `\n\n[Active persona]\n${personaInject}` : '') + PAYLOADS[L.payloadMode].inject;
    engineSend(full, true);
    L.timer = setInterval(engineTick, 2500);
    render();
    return;
  }

  // Case 3: empty input, existing conversation → resume
  if (Adapter.hasMessages()) {
    L.needsPayload = false; L.round = 0; L.lastProgress = null; L.staleTicks = 0;
    L.state = 'RUNNING'; L.lastActivity = Date.now(); L.detail = 'Resuming…';
    GHOST.workflow.active = GHOST.workflow.selected !== 'none';
    engineSend(RESUME_TEXT, true);
    L.timer = setInterval(engineTick, 2500);
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
  L.timer = setInterval(engineTick, 2500);
  sendRoadmapStep();
  render();
}

function pauseLoop() { enginePause('Paused'); }
function stopLoop() {
  const L = GHOST.loop;
  L.state = 'IDLE'; L.round = 0; L.staleTicks = 0; L.lastProgress = null;
  L.lastSignal = 'none'; L.lastConfidence = 0; L.needsPayload = true; L.detail = '';
  clearInterval(L.timer); L.timer = null;
  resetRoadmap();
  render();
}

/* ═══════════════════════════════════════════════════════════════
   SPA ROUTE DETECTION
   ═══════════════════════════════════════════════════════════════ */
(function patchHistory() {
  const orig = history.pushState;
  history.pushState = function(...a) { orig.apply(this, a); window.dispatchEvent(new Event('gitl:route')); };
  const origR = history.replaceState;
  history.replaceState = function(...a) { origR.apply(this, a); window.dispatchEvent(new Event('gitl:route')); };
})();
window.addEventListener('popstate', () => window.dispatchEvent(new Event('gitl:route')));
window.addEventListener('gitl:route', () => {
  if (location.href !== _lastHref) {
    _lastHref = location.href;
    _cache.clear();
    if (GHOST.loop.state === 'RUNNING') enginePause('Route changed — paused');
  }
});

/* ═══════════════════════════════════════════════════════════════
   CRASH RECOVERY
   ═══════════════════════════════════════════════════════════════ */
window.addEventListener('beforeunload', () => {
  if (GHOST.loop.state === 'RUNNING' || GHOST.loop.state === 'PAUSED') {
    _save('crashState', JSON.stringify({
      state: GHOST.loop.state, round: GHOST.loop.round, mode: GHOST.loop.payloadMode,
      url: location.href, ts: Date.now(), wasRunning: GHOST.loop.state === 'RUNNING'
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
    if (cs.url !== location.href) return;
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

/* ── The Veil: export progress overlay ───────────────────────── */
const VEIL = {
  el: null, steps: [], idx: 0, cancelled: false, lastBeat: 0, _wd: null,
  ensure() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.id = 'gitl-veil';
    this.el.innerHTML = `
      <div class="gv-card">
        <div class="gv-ringwrap"><div class="gv-ring"></div><div class="gv-ghost">👻</div></div>
        <div class="gv-title" id="gv-title">Working…</div>
        <div class="gv-steps" id="gv-steps"></div>
        <div class="gv-barwrap"><div class="gv-bar" id="gv-bar"></div></div>
        <div class="gv-pct" id="gv-pct"></div>
        <div class="gv-note" id="gv-note">Please don't reload the page</div>
        <button class="gv-cancel" id="gv-cancel">Cancel</button>
      </div>`;
    document.body.appendChild(this.el);
    this.el.querySelector('#gv-cancel').addEventListener('click', () => { this.cancelled = true; this.el.querySelector('#gv-title').textContent = 'Stopping…'; });
  },
  show(steps) {
    this.ensure(); this.steps = steps; this.idx = 0; this.cancelled = false; this.lastBeat = Date.now();
    this.el.style.display = 'flex'; this.renderSteps(); this.beat(null);
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
    this.el.querySelector('#gv-steps').innerHTML = this.steps.map((s, i) =>
      `<div class="gv-step${i < this.idx ? ' done' : i === this.idx ? ' act' : ''}">${i < this.idx ? '✓' : i === this.idx ? '▶' : '·'} ${s}</div>`).join('');
  },
  beat(pct) {
    this.lastBeat = Date.now();
    const bar = this.el.querySelector('#gv-bar'), p = this.el.querySelector('#gv-pct');
    const note = this.el.querySelector('#gv-note'); if (note) note.textContent = "Please don't reload the page";
    if (pct == null) { bar.classList.add('indet'); bar.style.width = '40%'; p.textContent = ''; }
    else { bar.classList.remove('indet'); bar.style.width = Math.min(100, pct) + '%'; p.textContent = Math.round(Math.min(100, pct)) + '%'; }
  },
  hide() { if (this._wd) clearInterval(this._wd); this._wd = null; if (this.el) this.el.style.display = 'none'; }
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
      const text = cleanManusText(el.innerText);
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
    let text = el.innerText.trim();
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

const GM_KEYS = ['projectName','projectSlug','wfSelected','wfStage','wfAuto','wfPause','persona','payloadMode','maxRounds','customProceed','customStop','sigWindow','expFormat','expFilter','expRoles','expThinking','expSlug','panelCollapsed','panelPosition','soundOn','notifyOn','cfgAdv','expAdv','firstRun','customSites','rmSteps','rmIndex','rmCaptured','qDraft'];

function downloadText(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportCapsule() {
  const all = extractMessages();
  const mission = (all.find(m => m.role === 'user')?.text || '').slice(0, 600);
  const msgs = all.filter(m => m.role !== 'user').slice(-5);
  const R = GHOST.roadmap, W = GHOST.workflow;
  const idle = !R.steps.length && !W.active && GHOST.loop.round === 0;
  if (idle) { GHOST.loop.detail = '💡 No loop state to capture — "Ask in chat" or Export may serve better'; render(); }
  const wf = (WORKFLOW_LIBRARY[W.selected]||WORKFLOW_LIBRARY.none).label;
  const steps = R.steps.length ? R.steps.map((s,i) =>
    `${i < R.index ? '✓' : i === R.index ? '▶' : '·'} ${i+1}. ${s}`).join('\n') : '(none)';
  const md = [
    '# 👻 GITL Handoff Capsule',
    '*This is a baton, not a record: paste it into a fresh AI chat to continue this work. For the complete transcript, use Export instead.*',
    '',
    '```yaml',
    `project: ${GHOST.project.name || 'Untitled'}`,
    `platform: ${PLAT.label}`,
    `exported: ${new Date().toISOString()}`,
    `mode: ${GHOST.loop.payloadMode}`,
    `persona: ${(PERSONA_LIBRARY[GHOST.persona.selected]||PERSONA_LIBRARY.none).label}`,
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
    '## Instructions for the next model',
    'You are a NEW LENS picking up this work. Read the state above and the outputs below.',
    '1. Give your own independent assessment first — do not agree by default.',
    '2. Continue from the current roadmap position (▶), not from the beginning.',
    '3. Deliverable-first output, single code block where possible, no fluff.',
    '4. End every response with [[GITL::PROCEED]] (more work remains) or [[GITL::HALT]] (fully done).',
    '',
    '## Last outputs (most recent last)',
    ...msgs.map((m,i) => `### Output ${i+1}\n${m.text}\n`),
    '---',
    `*Capsule generated by Ghost in the Loop v${VER}*`
  ].join('\n');
  downloadText(md, buildFilename('capsule').replace(/\.\w+$/,'') + '.md', 'text/markdown');
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

function capsuleInChat() {
  if (GHOST.loop.state === 'RUNNING') { GHOST.loop.detail = 'Pause the loop first'; render(); return; }
  GHOST.loop.detail = '📦 Handoff prompt sent — export the chat when it finishes';
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
  const steps = ['Reading chat', ...(GHOST.export.thinking ? ['Opening thinking blocks'] : []), ...(isManus ? ['Collecting every message'] : []), 'Building your file'];
  VEIL.show(steps);
  let raw = null;
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
  const msgs = applyFilter(raw || extractMessages(GHOST.export.thinking));
  if (!msgs.length) { alert('Ghost: no messages found to export.'); return; }
  const proj = GHOST.project.name || 'Untitled';
  const ts = new Date().toLocaleString();
  let content, mime;
  if (GHOST.export.format === 'json') {
    content = JSON.stringify({ project: proj, platform: PLAT.label, exported: ts, rounds: GHOST.loop.round, workflow: (WORKFLOW_LIBRARY[GHOST.workflow.selected]||WORKFLOW_LIBRARY.none).label, persona: (PERSONA_LIBRARY[GHOST.persona.selected]||PERSONA_LIBRARY.none).label, messages: msgs }, null, 2);
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

/* ═══════════════════════════════════════════════════════════════
   UI — STYLES
   ═══════════════════════════════════════════════════════════════ */
GM_addStyle(`
#gitl{position:fixed;z-index:2147483647;width:268px;max-width:calc(100vw - 16px);background:#111214;border:1px solid #27282e;
  border-radius:12px;padding:10px 12px;font:11.5px 'SF Mono','Cascadia Code','JetBrains Mono','Fira Mono',monospace;
  color:#c9cad0;box-shadow:0 10px 32px rgba(0,0,0,.65);user-select:none;transition:width .2s}
#gitl *{box-sizing:border-box}
#gitl.collapsed .g-body{display:none} #gitl.collapsed{width:auto;min-width:180px}
.g-body{max-height:min(52vh,380px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#2e2f35 transparent}
.g-body::-webkit-scrollbar{width:4px}.g-body::-webkit-scrollbar-thumb{background:#2e2f35;border-radius:2px}
.g-adv{width:100%;padding:4px 0;margin:4px 0;border:none;border-top:1px dashed #27282e;background:transparent;color:#555;font-size:9px;cursor:pointer;text-align:center;font-family:inherit;font-weight:600}
.g-adv:hover{color:#888}
.g-hdr{display:flex;justify-content:space-between;align-items:center;cursor:grab;padding:2px 0;margin-bottom:6px}
.g-hdr:active{cursor:grabbing}
.g-logo{font-weight:800;font-size:10.5px;text-transform:uppercase;color:#555;letter-spacing:.6px;display:flex;align-items:center;gap:5px}
.g-dot{display:inline-block;width:7px;height:7px;border-radius:50%;transition:all .3s}
.g-dot.run{background:#34d399;box-shadow:0 0 5px #34d399;animation:gpulse 1.4s infinite}
.g-dot.pause{background:#fbbf24}.g-dot.done{background:#818cf8}.g-dot.err{background:#f87171}.g-dot.idle{background:#555}
@keyframes gpulse{0%,100%{opacity:1}50%{opacity:.4}}
.g-plat{font-size:9.5px;background:#1c1d22;padding:2px 6px;border-radius:4px;color:#818cf8;font-weight:600;border:1px solid #2a2b33}
.g-minbtn{background:#18191c;border:1px solid #2e2f35;color:#888;font-size:10px;cursor:pointer;padding:1px 6px;border-radius:4px;font-weight:700;transition:all .15s}
.g-minbtn:hover{background:#27282e;color:#fff}
.g-coll-row{display:none;align-items:center;gap:6px;margin-top:4px}
#gitl.collapsed .g-coll-row{display:flex}
.g-qbtn{width:34px;height:26px;border:1px solid #27282e;border-radius:6px;font-size:13px;cursor:pointer;transition:all .15s}
.g-qbtn.play{background:#052e1c;color:#34d399;border-color:#064e3b}.g-qbtn.pause{background:#2d1900;color:#fbbf24;border-color:#78350f}
.g-qstat{font-size:10px;font-weight:700}
.g-proj{display:flex;align-items:center;gap:5px;margin-bottom:7px;padding:5px 7px;background:#16171b;border:1px solid #27282e;border-radius:7px}
.g-proj-lbl{font-size:9px;color:#444;flex-shrink:0}
.g-proj-in{flex:1;background:transparent;border:none;color:#a5b4fc;font-size:10px;font-family:inherit;font-weight:600;outline:none;min-width:0}
.g-proj-in::placeholder{color:#333}
.g-tabs{display:flex;gap:3px;margin-bottom:8px}
.g-tab{flex:1;padding:4px 0;border:1px solid #27282e;border-radius:5px;background:#18191c;color:#555;font-size:8.5px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s;font-family:inherit}
.g-tab:hover{background:#222329;color:#888}.g-tab.act{background:#1a1b2e;border-color:#3730a3;color:#a5b4fc}
.g-modes{display:flex;gap:3px;margin-bottom:6px}
.g-md{flex:1;padding:5px 0;border:1px solid #27282e;border-radius:6px;background:#18191c;color:#666;font-size:9px;cursor:pointer;text-align:center;font-weight:600;transition:all .15s;font-family:inherit}
.g-md:hover{background:#222329}.g-md.act{background:#1a1b2e;border-color:#3730a3;color:#a5b4fc}
.g-hint{font-size:9px;color:#484a57;margin-bottom:7px;padding:4px 6px;background:#16171b;border-radius:4px;border-left:2px solid #27282e;line-height:1.4}
.g-btns{display:flex;gap:3px;margin-bottom:7px}
.g-btn{flex:1;padding:7px 0;border:1px solid #27282e;border-radius:7px;background:#18191c;color:#999;font-size:14px;cursor:pointer;text-align:center;transition:all .15s;font-family:inherit}
.g-btn:hover{background:#222329}
.g-btn.go{background:#052e1c;border-color:#064e3b;color:#34d399}.g-btn.go:hover{background:#064e3b}
.g-btn.st{background:#2d0a0a;border-color:#7f1d1d;color:#f87171}.g-btn.st:hover{background:#7f1d1d}
.g-prog{margin:2px 0 6px}
.g-trk{height:4px;background:#1c1d22;border-radius:2px;overflow:hidden}
.g-fill{height:100%;background:linear-gradient(90deg,#34d399,#818cf8);border-radius:2px;transition:width .4s}
.g-plbl{display:flex;justify-content:space-between;font-size:9px;color:#555;margin-top:2px}
.g-stat{text-align:center;font-weight:600;font-size:10.5px;padding:4px 0;border-top:1px solid #1c1d22;margin-top:2px}
.g-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;color:#666;margin-bottom:5px}
.g-row label{color:#555}
.g-row input[type="number"],.g-row input[type="text"]{background:#18191c;border:1px solid #2e2f35;border-radius:4px;color:#c9cad0;font-size:10px;padding:2px 5px;font-family:inherit}
.g-row input[type="number"]{width:52px;text-align:center}.g-row input[type="text"]{width:110px}
.g-row input:focus{outline:none;border-color:#4338ca}
.g-row select{background:#18191c;border:1px solid #2e2f35;border-radius:4px;color:#c9cad0;font-size:10px;padding:2px 4px;font-family:inherit}
.g-tog{width:28px;height:14px;background:#2e2f35;border-radius:7px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
.g-tog.on{background:#064e3b}
.g-tog::after{content:'';width:10px;height:10px;background:#666;border-radius:50%;position:absolute;top:2px;left:2px;transition:left .2s,background .2s}
.g-tog.on::after{left:16px;background:#34d399}
.g-pos-row{display:flex;gap:3px}
.g-pos{background:#18191c;border:1px solid #2e2f35;color:#777;font-size:11px;width:22px;height:20px;cursor:pointer;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.g-pos:hover{background:#27282e;color:#fff}.g-pos.act{background:#1a1b2e;border-color:#3730a3;color:#a5b4fc}
.g-exp-btn{width:100%;padding:8px;background:#052e1c;border:1px solid #064e3b;border-radius:7px;color:#34d399;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:2px;text-align:center;transition:all .15s}
.g-exp-btn:hover{background:#064e3b}
.g-div{height:1px;background:#1c1d22;margin:7px 0}
.g-diag{font-size:9px;color:#444;line-height:1.6;padding:5px 6px;background:#0c0d10;border:1px solid #27282e;border-radius:5px;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
.g-sites{width:100%;box-sizing:border-box;background:#0c0d10;border:1px solid #27282e;border-radius:5px;color:#9aa;font-size:9px;font-family:monospace;padding:5px 6px;margin-bottom:4px;resize:vertical}
.g-btn-sm{padding:3px 8px;margin-top:5px;border:1px solid #3730a3;border-radius:5px;background:#1a1b2e;color:#a5b4fc;font-size:9px;cursor:pointer;font-family:inherit;font-weight:600}
.g-btn-sm:hover{background:#222345}
.g-qrow{display:flex;align-items:center;gap:5px;margin-bottom:4px}
.g-qin{flex:1;min-width:0;background:#0c0d10;border:1px solid #27282e;border-radius:5px;color:#aab;font-size:9.5px;padding:4px 6px;font-family:inherit}
.g-qin:focus{border-color:#3730a3;outline:none}
.g-qdel{border:none;background:transparent;color:#444;cursor:pointer;font-size:10px;padding:2px}
.g-qdel:hover{color:#e66}
.g-qtext{flex:1;font-size:9.5px;color:#999;line-height:1.4;word-break:break-word}
.g-qtext.done{color:#4a5;text-decoration:line-through;text-decoration-color:#2a3}
.g-hpills{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:7px}
.g-hpill{padding:3px 7px;border:1px solid #27282e;border-radius:10px;background:#18191c;color:#666;font-size:8.5px;cursor:pointer;font-family:inherit;font-weight:600}
.g-hpill.act{background:#1a1b2e;border-color:#3730a3;color:#a5b4fc}
#gitl-veil{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;background:rgba(8,9,12,.55);backdrop-filter:blur(1.5px);font-family:-apple-system,'Segoe UI',Roboto,sans-serif}
.gv-card{background:#111214;border:1px solid #27282e;border-radius:14px;padding:22px 26px;width:240px;text-align:center;box-shadow:0 12px 48px rgba(0,0,0,.6)}
.gv-ringwrap{position:relative;width:64px;height:64px;margin:0 auto 12px}
.gv-ring{position:absolute;inset:0;border:3px solid #25262c;border-top-color:#a5b4fc;border-radius:50%;animation:gvspin 1s linear infinite}
.gv-ghost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;animation:gvbob 2s ease-in-out infinite}
@keyframes gvspin{to{transform:rotate(360deg)}}
@keyframes gvbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.gv-title{color:#e7e7ea;font-size:12px;font-weight:700;margin-bottom:8px}
.gv-steps{text-align:left;margin:0 auto 10px;display:inline-block}
.gv-step{font-size:9.5px;color:#555;line-height:1.8}
.gv-step.act{color:#a5b4fc}.gv-step.done{color:#4a5}
.gv-barwrap{height:5px;background:#1c1d22;border-radius:3px;overflow:hidden;margin-bottom:5px}
.gv-bar{height:100%;background:linear-gradient(90deg,#6366f1,#a5b4fc);border-radius:3px;width:0;transition:width .25s}
.gv-bar.indet{animation:gvslide 1.2s ease-in-out infinite}
@keyframes gvslide{0%{margin-left:-40%}100%{margin-left:100%}}
.gv-pct{font-size:9px;color:#777;height:12px;margin-bottom:6px}
.gv-note{font-size:8.5px;color:#666;margin-bottom:10px}
.gv-cancel{padding:4px 14px;border:1px solid #3a2a2a;border-radius:6px;background:#1c1416;color:#c88;font-size:9px;cursor:pointer;font-family:inherit}
.gv-cancel:hover{background:#241719}
#gitl.pos-dock{border-radius:10px 0 0 10px;border-right:none;width:268px}
#gitl.pos-dock.collapsed{width:32px!important;min-width:0}
#gitl.pos-dock.collapsed .g-hdr{flex-direction:column;padding:10px 4px;gap:6px}
#gitl.pos-dock.collapsed .g-hdr > span:last-child{flex-direction:column}
#gitl.pos-dock.collapsed .g-plat{display:none}
#gitl.pos-dock.collapsed .g-logo{writing-mode:vertical-rl;font-size:11px}
#gitl.pos-dock.collapsed .g-coll-row{flex-direction:column;padding:4px 2px}
#gitl.pos-dock.collapsed .g-qstat{display:none}
.g-diag .ok{color:#34d399}.g-diag .warn{color:#f87171}
.g-persona-btn{width:100%;text-align:left;padding:5px 7px;margin-bottom:3px;border:1px solid #27282e;border-radius:6px;background:#18191c;color:#c9cad0;font-family:inherit;font-size:10px;cursor:pointer;transition:all .15s}
.g-persona-btn.act{background:#1a1b2e;border-color:#3730a3;color:#c7d2fe}
.g-persona-btn .plbl{font-weight:700;color:#9ca3af}.g-persona-btn.act .plbl{color:#a5b4fc}
.g-persona-btn .pdesc{font-size:9px;color:#6b7280;line-height:1.4;margin-top:1px}
.g-wf-stage{padding:4px 6px;margin-bottom:3px;background:#16171b;border:1px solid #27282e;border-radius:5px;font-size:9px;line-height:1.45;color:#6b7280}
.g-wf-stage.act{background:#1a1b2e;border-color:#3730a3;color:#c7d2fe}
.g-wf-stage b{color:#8b8ea3}.g-wf-stage.act b{color:#a5b4fc}
.g-peek-btn{font-size:9px;color:#3a3b44;cursor:pointer;text-align:center;margin-top:5px;padding-top:4px;border-top:1px solid #1c1d22}
.g-peek-btn:hover{color:#777}
.g-peek{display:none;margin-top:4px;padding:5px;background:#0c0d10;border:1px solid #27282e;border-radius:5px;font-size:9px;line-height:1.5;color:#48505e;white-space:pre-wrap;max-height:140px;overflow-y:auto}
.g-peek.open{display:block}
.g-shortcuts{font-size:8.5px;color:#333;text-align:center;margin-top:4px}
.g-firstrun{padding:6px 8px;background:#1a1b2e;border:1px solid #3730a3;border-radius:6px;font-size:9.5px;color:#a5b4fc;line-height:1.4;margin-bottom:7px;text-align:center}
#gitl.pos-bb{bottom:0!important;left:0!important;right:0!important;width:100%!important;border-radius:10px 10px 0 0!important;top:auto!important}
`);

/* ═══════════════════════════════════════════════════════════════
   UI — RENDER + TABS
   ═══════════════════════════════════════════════════════════════ */
const panel = document.createElement('div');
panel.id = 'gitl';
document.body.appendChild(panel);

function dotClass() {
  const s = GHOST.loop.state;
  return s==='RUNNING'?'run':s==='PAUSED'?'pause':s==='COMPLETE'?'done':s==='ERROR'?'err':'idle';
}
function statColor() {
  const s = GHOST.loop.state;
  return s==='RUNNING'?'#34d399':s==='PAUSED'?'#fbbf24':s==='COMPLETE'?'#818cf8':s==='ERROR'?'#f87171':'#555';
}
function statLabel() {
  const L = GHOST.loop;
  if (L.state==='IDLE') return L.detail || 'Ready — type a prompt and press ▶';
  if (L.state==='RUNNING') return L.detail || `Round ${L.round} / ${L.maxRounds}`;
  if (L.state==='PAUSED') return L.detail || 'Paused';
  if (L.state==='COMPLETE') return L.detail || 'Complete';
  return L.detail || L.state;
}

function renderRunTab() {
  const L = GHOST.loop, p = L.lastProgress, pct = p ? Math.round((p.step/p.total)*100) : 0;
  const pm = L.payloadMode;
  const peekOpen = panel.querySelector('.g-peek')?.classList.contains('open');
  const firstRun = GHOST.ui.firstRun;
  return `
    ${firstRun ? `<div class="g-firstrun"><b>👻 Quick start</b><br>1. Type your big task in the chat box<br>2. Press ▶ — Ghost wraps it in the loop protocol<br>3. Walk away. Ghost auto-continues, stops on [[GITL::HALT]]<br><button class="g-btn-sm" id="g-onb-done">Got it</button></div>` : ''}
    <div class="g-modes">
      <button class="g-md${pm==='loop'?' act':''}" data-m="loop">${PAYLOADS.loop.label}</button>
      <button class="g-md${pm==='think'?' act':''}" data-m="think">${PAYLOADS.think.label}</button>
      <button class="g-md${pm==='roadmap'?' act':''}" data-m="roadmap">${PAYLOADS.roadmap.label}</button>
    </div>
    <div class="g-hint">${PAYLOADS[pm].hint}</div>
    <div class="g-btns">
      <button class="g-btn go" id="g-play" title="Start / Resume (Alt+P)">▶</button>
      <button class="g-btn" id="g-pause" title="Pause (Alt+P)">⏸</button>
      <button class="g-btn st" id="g-stop" title="Stop & Reset (Alt+S)">■</button>
    </div>
    <div class="g-prog">
      <div class="g-trk"><div class="g-fill" style="width:${pct}%"></div></div>
      <div class="g-plbl">
        <span>${p?`${pm==='think'?'Batch':'Step'} ${p.step}/${p.total}${p.desc?' — '+p.desc.slice(0,24):''}` : 'Waiting…'}</span>
        <span>${pct}%</span>
      </div>
    </div>
    <div class="g-stat" style="color:${statColor()}">${statLabel()}</div>
    <div class="g-peek-btn" id="g-peek-btn">${peekOpen?'▾ Hide prompt':'▸ What gets injected'}</div>
    <div class="g-peek${peekOpen?' open':''}" id="g-peek">${PAYLOADS[pm].preview}</div>
    <div class="g-shortcuts">v${VER} · Alt+P toggle · Alt+S stop</div>`;
}

function renderFlowTab() {
  const wf = WORKFLOW_LIBRARY[GHOST.workflow.selected] || WORKFLOW_LIBRARY.none;
  const opts = Object.entries(WORKFLOW_LIBRARY).map(([k,v]) => `<option value="${k}"${GHOST.workflow.selected===k?' selected':''}>${v.label}</option>`).join('');
  const stages = wf.stages.length
    ? wf.stages.map((s,i) => `<div class="g-wf-stage${i===GHOST.workflow.stageIndex&&GHOST.workflow.active?' act':''}"><b>Stage ${i+1}</b><br>${s.slice(0,120)}${s.length>120?'…':''}</div>`).join('')
    : '<div style="font-size:9px;color:#555">Manual mode — no predefined stages.</div>';
  return `
    <div class="g-row"><label>Workflow</label><select id="wf-sel" style="width:118px">${opts}</select></div>
    <div style="font-size:9px;color:#555;line-height:1.45;background:#16171b;border:1px solid #27282e;border-radius:5px;padding:5px;margin-bottom:6px">${wf.desc}</div>
    <div class="g-row"><label>Auto-advance</label><div class="g-tog${GHOST.workflow.autoAdvance?' on':''}" id="wf-auto"></div></div>
    <div class="g-row"><label>Pause between</label><div class="g-tog${GHOST.workflow.pauseBetween?' on':''}" id="wf-pause"></div></div>
    <div class="g-row"><label>Stage</label><span style="font-size:10px;color:#a5b4fc">${wf.stages.length?(GHOST.workflow.stageIndex+1)+' / '+wf.stages.length:'—'}</span></div>
    <div class="g-div"></div>${stages}
    <button class="g-exp-btn" id="wf-reset" style="background:#18191c;border-color:#2e2f35;color:#ccc;margin-top:5px">Reset stage</button>`;
}

const HELP_SECTIONS = {
  start: { label: 'Start', html: `
    <b>What is Ghost?</b><br>You give the AI a big task. Ghost keeps pressing "continue" for you — through every step — until the AI says it's truly done.<br><br>
    <b>The 30-second version:</b><br>1. Type your task in the chat box<br>2. Press the big ▶<br>3. Walk away ☕<br><br>
    <b>How does it know when to stop?</b><br>Ghost teaches the AI two signals: <code>[[GITL::PROCEED]]</code> = "more to do", <code>[[GITL::HALT]]</code> = "finished". Ghost reads them and acts.` },
  run: { label: 'Run', html: `
    <b>The Run tab</b> is the classic loop.<br><br>
    <b>Three modes:</b><br>· <b>Loop</b> — AI works in batches, Ghost continues each one<br>· <b>Think First</b> — AI plans before working, then batches<br>· <b>Roadmap</b> — AI researches, writes its own plan, Ghost runs every step (see Auto)<br><br>
    <b>Buttons:</b> ▶ start/resume · ⏸ pause · ⏹ stop &amp; reset<br><br>
    <b>Q: It paused by itself?</b><br>The status line says why — usually round limit reached or the page changed. Press ▶ to resume.` },
  auto: { label: 'Auto', html: `
    <b>The Auto tab</b> = fire &amp; forget.<br><br>
    <b>Roadmap</b> (AI plans): pick Roadmap on Run, press ▶. The AI studies your task, writes a numbered plan, and Ghost executes every step + a final synthesis. Watch steps get ✓ here.<br><br>
    <b>Queue</b> (you plan): write your own steps — one box each, ＋ to add more — and hit ▶ Run queue.<br><br>
    <b>Q: Roadmap vs Workflow?</b><br><i>Workflow</i> = you know the recipe, same stages every time.<br><i>Roadmap</i> = the AI invents the plan for THIS task.<br>Example, "build a landing page": a workflow always runs draft→critique→refine; a roadmap might plan research→copy→HTML→styling→review, because that's what this task needed.` },
  flow: { label: 'Flow', html: `
    <b>The Flow tab</b> holds fixed recipes (workflows): stages you pick up-front, like Draft → Critique → Polish. Ghost moves to the next stage every time the AI HALTs.<br><br>
    <b>Pause between</b> stops after each stage so you can review — or switch the model.<br><br>
    <b>Lens Relay</b> is built for that: turn Pause between ON, swap the model at every pause (e.g. Perplexity's selector), press ▶. Each model gives an independent take, then a verified consensus.` },
  roles: { label: 'Roles', html: `
    <b>The Roles tab</b> injects a persona into your first prompt — Red Team attacks the work, Round Table simulates a committee, and so on.<br><br>
    <b>On Perplexity</b>, Round Table automatically becomes a REAL round table: it expects you to switch models between turns, and each model must give its own independent assessment, in a code block, naming who goes next.` },
  export: { label: 'Export', html: `
    <b>Q: Export vs Capsule — what's the difference?</b><br><br>
    <b>⬇ Export</b> = the whole conversation as a file (Markdown or JSON), with 💭 thinking logs if enabled. Use it to archive or read later.<br><br>
    <b>📦 Capsule file</b> = a small briefing for the NEXT AI: current state, roadmap position, last outputs, and instructions to continue. Paste it into a fresh chat — the new model picks up where this one stopped.<br><br>
    <b>📦 Ask in chat</b> = Ghost asks the AI itself to write a full handoff report in the chat. Best on agent platforms (like Manus) where scraping misses things.<br><br>
    <i>Rule of thumb: keeping records → Export. Moving to another model → Capsule.</i>` },
  setup: { label: 'Setup', html: `
    <b>The Setup tab:</b><br>· <b>Max rounds</b> — safety cap on auto-continues<br>· <b>Notify</b> — desktop alert when done (great with ☕)<br>· <b>Position</b> — corners, bottom bar, or ▐ <b>Dock</b>: a slim edge tab that never covers the chat<br><br>
    <b>Advanced ▾</b> hides the power tools: custom signal words, per-site selector overrides (Custom sites), and <b>Diagnostics → Probe</b>, which live-tests Ghost's connection to the page — your first stop when a platform misbehaves.` },
  feedback: { label: 'Feedback', html: `
    <b>Found a bug? Have an idea?</b><br><br>
    Open an issue: <a href="https://github.com/MShneur/ghost-in-the-loop/issues" target="_blank" rel="noopener" style="color:#a5b4fc">github.com/MShneur/ghost-in-the-loop</a><br><br>
    <b>Please include:</b><br>· Ghost version (v${VER}) and the platform<br>· What you did, what you expected, what happened<br>· Setup → Advanced → Diagnostics → <b>Probe</b> output — it tells us exactly what Ghost can and can't see<br><br>
    ⭐ A star on GitHub helps more people find Ghost.` }
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
  return Object.entries(PERSONA_LIBRARY).map(([k,v]) =>
    `<button class="g-persona-btn${GHOST.persona.selected===k?' act':''}" data-p="${k}"><span class="plbl">${v.label}</span><div class="pdesc">${v.inject||'No persona framing.'}</div></button>`
  ).join('');
}

function renderExportTab() {
  const fn = buildFilename('export');
  const adv = GHOST.ui.expAdv;
  return `
    <div class="g-row"><label>Format</label><select id="exp-fmt"><option value="markdown"${GHOST.export.format==='markdown'?' selected':''}>Markdown</option><option value="json"${GHOST.export.format==='json'?' selected':''}>JSON</option></select></div>
    <div class="g-row"><label>💭 Thinking logs</label><div class="g-tog${GHOST.export.thinking?' on':''}" id="exp-think"></div></div>
    <button class="g-exp-btn" id="g-export">⬇ Export conversation</button>
    <div style="display:flex;gap:5px;margin-top:5px">
      <button class="g-exp-btn" id="g-capsule" style="flex:1;margin-top:0">📦 Capsule file</button>
      <button class="g-exp-btn" id="g-capsule-chat" style="flex:1;margin-top:0">📦 Ask in chat</button>
    </div>
    <div class="g-hint" style="margin-top:4px">File = Ghost scrapes state + outputs. Ask in chat = the AI writes its own full handoff report (best on agent platforms).</div>
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
      <div class="g-pos-row">${['top-left','top-right','bot-left','bot-right','bottom-bar','dock'].map(p=>
        `<button class="g-pos${GHOST.ui.position===p?' act':''}" data-pos="${p}" title="${p==='dock'?'Dock — slim edge tab, blocks nothing':p}">${p==='top-left'?'↖':p==='top-right'?'↗':p==='bot-left'?'↙':p==='bot-right'?'↘':p==='bottom-bar'?'━':'▐'}</button>`
      ).join('')}</div>
    </div>
    <div class="g-row"><label>❓ Quick start</label><button class="g-btn-sm" id="cfg-qs" style="margin-top:0">Show</button></div>
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
    ${GHOST.ui.showDiag ? renderDiag() : ''}` : ''}`;
}

function renderDiag() {
  const L = GHOST.loop;
  const lines = [
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
    DIAG.probe ? `<span class="ok">Probe:</span>\n${DIAG.probe}` : '',
    DIAG.errors.length ? `<span class="warn">Errors:</span>\n${DIAG.errors.slice(0,5).join('\n')}` : ''
  ].filter(Boolean).join('\n');
  return `<div class="g-diag">${lines}</div><button class="g-btn-sm" id="g-probe">🔍 Probe selectors</button>`;
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
}

function render() {
  const L = GHOST.loop, tab = GHOST.ui.tab, col = GHOST.ui.collapsed;
  panel.className = [col?'collapsed':'', GHOST.ui.position==='bottom-bar'?'pos-bb':'', GHOST.ui.position==='dock'?'pos-dock':''].filter(Boolean).join(' ');
  const qc = statColor(), ql = L.state==='RUNNING'?'Running…':L.state==='PAUSED'?'Paused':L.state==='COMPLETE'?'Done':'Idle';
  panel.innerHTML = `
    <div class="g-hdr" id="g-drag">
      <span class="g-logo">👻 Ghost<span class="g-dot ${dotClass()}"></span></span>
      <span style="display:flex;align-items:center;gap:5px">
        <span class="g-plat">${PLAT.label}</span>
        <button class="g-minbtn" id="g-info" title="Help & FAQ">?</button>
        <button class="g-minbtn" id="g-col" title="${col?'Expand':'Minimize'}">${GHOST.ui.position==='dock' ? (col?'◀':'▶') : (col?'＋':'－')}</button>
      </span>
    </div>
    <div class="g-coll-row">
      <button class="g-qbtn ${L.state==='RUNNING'?'pause':'play'}" id="g-quick">${L.state==='RUNNING'?'⏸':'▶'}</button>
      <span class="g-qstat" style="color:${qc}">${ql}</span>
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
        <button class="g-tab${tab==='personas'?' act':''}" data-t="personas" title="Personas">Roles</button>
        <button class="g-tab${tab==='export'?' act':''}" data-t="export" title="Export & handoff">Export</button>
        <button class="g-tab${tab==='settings'?' act':''}" data-t="settings" title="Settings">Setup</button>
      </div>
      <div id="g-tc">
        ${tab==='run'?renderRunTab():''}${tab==='auto'?renderAutoTab():''}${tab==='info'?renderInfoTab():''}${tab==='flow'?renderFlowTab():''}
        ${tab==='personas'?renderPersonasTab():''}${tab==='export'?renderExportTab():''}
        ${tab==='settings'?renderSettingsTab():''}
      </div>
    </div>`;
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
  if (GHOST.ui.position==='dock' && GHOST.ui.collapsed) {
    panel.addEventListener('click', e => {
      if (e.target.closest('#g-quick') || e.target.closest('#g-col')) return;
      GHOST.ui.collapsed = false; _save('panelCollapsed', false); render();
    }, { once: true });
  }
  $('#g-quick')?.addEventListener('click', () => { GHOST.loop.state==='RUNNING'?pauseLoop():startLoop(); });
  $('#g-projname')?.addEventListener('change', e => {
    GHOST.project.name = e.target.value.trim();
    GHOST.project.slug = GHOST.project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    _save('projectName',GHOST.project.name); _save('projectSlug',GHOST.project.slug);
    if (GHOST.ui.tab==='export') render();
  });
  $$('.g-tab').forEach(b => b.addEventListener('click', () => { GHOST.ui.tab=b.dataset.t; render(); }));

  // Run tab
  $$('.g-md').forEach(b => b.addEventListener('click', () => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.payloadMode=b.dataset.m; GHOST.loop.needsPayload=true; _save('payloadMode',GHOST.loop.payloadMode); render();
  }));
  $('#g-play')?.addEventListener('click', startLoop);
  $('#g-pause')?.addEventListener('click', pauseLoop);
  $('#g-stop')?.addEventListener('click', stopLoop);
  $('#g-peek-btn')?.addEventListener('click', () => {
    const p=$('#g-peek'),b=$('#g-peek-btn');
    if(p&&b){p.classList.toggle('open'); b.textContent=p.classList.contains('open')?'▾ Hide prompt':'▸ What gets injected';}
  });

  // Flow tab
  $('#wf-sel')?.addEventListener('change', e => {
    GHOST.workflow.selected=e.target.value; GHOST.workflow.stageIndex=0; GHOST.workflow.active=e.target.value!=='none';
    _save('wfSelected',GHOST.workflow.selected); _save('wfStage',0); render();
  });
  $('#wf-auto')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.workflow.autoAdvance=this.classList.contains('on'); _save('wfAuto',GHOST.workflow.autoAdvance); });
  $('#wf-pause')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.workflow.pauseBetween=this.classList.contains('on'); _save('wfPause',GHOST.workflow.pauseBetween); });
  $('#wf-reset')?.addEventListener('click', () => { GHOST.workflow.stageIndex=0; GHOST.workflow.active=GHOST.workflow.selected!=='none'; _save('wfStage',0); render(); });

  // Personas tab
  $$('.g-persona-btn').forEach(b => b.addEventListener('click', () => { GHOST.persona.selected=b.dataset.p; _save('persona',GHOST.persona.selected); render(); }));

  // Export tab
  $('#exp-fmt')?.addEventListener('change', e => { GHOST.export.format=e.target.value; _save('expFormat',e.target.value); render(); });
  $('#exp-flt')?.addEventListener('change', e => { GHOST.export.filter=e.target.value; _save('expFilter',e.target.value); });
  $('#exp-roles')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.export.includeRoles=this.classList.contains('on'); _save('expRoles',GHOST.export.includeRoles); });
  $('#exp-slug')?.addEventListener('change', e => { GHOST.export.customSlug=e.target.value.trim(); _save('expSlug',GHOST.export.customSlug); render(); });
  $('#g-export')?.addEventListener('click', runExport);
  $('#exp-think')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.export.thinking=this.classList.contains('on'); _save('expThinking',GHOST.export.thinking); });
  $('#g-capsule')?.addEventListener('click', exportCapsule);
  $('#g-capsule-chat')?.addEventListener('click', capsuleInChat);
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
  $('#cfg-sites-tog')?.addEventListener('click', function(){ this.classList.toggle('on'); GHOST.ui.showSites=this.classList.contains('on'); render(); });
  $('#cfg-sites')?.addEventListener('change', e => {
    const raw = e.target.value.trim(), st = $('#cfg-sites-status');
    if (!raw) { _save('customSites',''); if(st) st.textContent='Cleared. Reload the page to apply.'; return; }
    try { JSON.parse(raw); _save('customSites', raw); if(st) st.textContent='✓ Saved. Reload the page to apply.'; }
    catch(err) { if(st) st.textContent='⚠ Invalid JSON — not saved.'; }
  });
  $('#cfg-qs')?.addEventListener('click', () => { GHOST.ui.firstRun=true; _save('firstRun',true); GHOST.ui.tab='run'; render(); });
  $('#g-info')?.addEventListener('click', () => { GHOST.ui.tab = GHOST.ui.tab==='info' ? 'run' : 'info'; render(); });
  $('#g-info-back')?.addEventListener('click', () => { GHOST.ui.tab='run'; render(); });
  $$('.g-hpill').forEach(b => b.addEventListener('click', e => { GHOST.ui.helpSec = e.target.dataset.h; render(); }));
  $('#cfg-adv')?.addEventListener('click', () => { GHOST.ui.cfgAdv=!GHOST.ui.cfgAdv; _save('cfgAdv',GHOST.ui.cfgAdv); render(); });
  $('#exp-adv')?.addEventListener('click', () => { GHOST.ui.expAdv=!GHOST.ui.expAdv; _save('expAdv',GHOST.ui.expAdv); render(); });
  $('#g-onb-done')?.addEventListener('click', () => { GHOST.ui.firstRun=false; _save('firstRun',false); render(); });

  bindDrag();
}

function bindDrag() {
  const hdr = panel.querySelector('#g-drag');
  if (!hdr) return;
  let dragging=false, ox=0, oy=0;
  hdr.addEventListener('mousedown', e => { if(e.button!==0)return; dragging=true; ox=e.clientX-panel.getBoundingClientRect().left; oy=e.clientY-panel.getBoundingClientRect().top; e.preventDefault(); });
  document.addEventListener('mousemove', e => { if(!dragging)return; panel.style.left=`${e.clientX-ox}px`; panel.style.top=`${e.clientY-oy}px`; panel.style.right='auto'; panel.style.bottom='auto'; });
  document.addEventListener('mouseup', () => { dragging=false; });
}

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if(e.altKey&&e.key.toLowerCase()==='p'){e.preventDefault(); GHOST.loop.state==='RUNNING'?pauseLoop():startLoop();}
  if(e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault(); stopLoop();}
});

/* ═══════════════════════════════════════════════════════════════
   MUTATION OBSERVER (gated by sendInProgress to prevent double-fire)
   ═══════════════════════════════════════════════════════════════ */
let _mutDebounce;
new MutationObserver(() => {
  if (GHOST.loop.state !== 'RUNNING' || GHOST.loop.isSending) return;
  clearTimeout(_mutDebounce);
  _mutDebounce = setTimeout(() => { GHOST.loop.lastActivity = Date.now(); Adapter.clickContinue(); }, 300);
}).observe(document.body, { childList: true, subtree: true });

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
render();
console.log(`[Ghost in the Loop v${VER}] ${PLAT.label} | ${DIAG.adapter}`);
  });
})();
