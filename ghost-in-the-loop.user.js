// ==UserScript==
// @name         Ghost in the Loop
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      9.0.0-alpha.2
// @description  Perpetual Play + truthful Export. External protocol activators. No controller-side reasoning.
// @author       Michael S (CTRL-AI)
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @match        https://gemini.google.com/*
// @match        https://claude.ai/*
// @match        https://grok.com/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://chat.mistral.ai/*
// @match        https://kimi.com/*
// @match        https://www.kimi.com/*
// @match        https://chat.qwen.ai/*
// @match        https://poe.com/*
// @match        https://duck.ai/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-idle
// @noframes
// @updateURL     https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @downloadURL   https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js
// @license      AGPL-3.0
// ==/UserScript==

(() => {
'use strict';
if (window.__GITL_V9__ === true) return;
if (window.__GITL_V9_BOOTING__ && Date.now() - window.__GITL_V9_BOOTING__ < 15000) return;
window.__GITL_V9_BOOTING__ = Date.now();

const VER = '9.0.0-alpha.2';
const TICK_MS = 1000;
const VALID_QUIET_MS = 1400;
const DRIFT_QUIET_MS = 9000;
const WRITE_VERIFY_MS = 1800;
const SEND_WAIT_MS = 2200;
const SEND_CONFIRM_MS = 16000;
const STALL_SOFT_MS = 5 * 60 * 1000;
const STALL_GRACE_MS = 2 * 60 * 1000;
const STOP_CONFIRM_MS = 5000;
const STOP_RETRY_DELAY_MS = 1500;
const STOP_MAX_ATTEMPTS = 3;
const TOP_MAX_PASSES = 24;
const TOP_WAIT_MS = 500;
const TOP_STABLE_PASSES = 2;

const G = Object.freeze({
  proceed: '[[GITL::PROCEED]]',
  human: '[[GITL::HUMAN]]',
  halt: '[[GITL::HALT]]'
});
const A = Object.freeze({
  proceed: '[[AOA::CONTINUE]]',
  human: '[[AOA::HUMAN]]',
  halt: '[[AOA::HALT]]'
});

const AOA_BRANCH = 'feature/plex-universal-model-relay';
const ACT = Object.freeze({
  plex: ['PLEX', `https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/modes/plex.md`],
  relay: ['Model Relay', `https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/workflows/model-relay.md`],
  human: ['Human Gate', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/human-gate-committee.md'],
  cleanerz: ['Cleanerz', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/cleanerz.md'],
  quorum: ['Quorum', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/quorum.md'],
  ctrl: ['CTRL-AI', 'https://raw.githubusercontent.com/MShneur/CTRL-AI/main/llms-full.txt'],
  rduck: ['R-Duck', 'https://raw.githubusercontent.com/MShneur/R-Duck/main/AGENTS.md']
});

const SKINS = Object.freeze({
  classic:{ name:'Classic', bg:'#17161a', surface:'#201e24', panel:'#0f0e11', border:'#45414b', text:'#eeeeee', muted:'#9a96a0', accent:'#34d399', accentBg:'#0c4434', radius:'12px', shadow:'0 8px 30px rgba(0,0,0,.4)' },
  aurora:{ name:'Aurora', bg:'#12132b', surface:'#1a1c3a', panel:'#0b0c1f', border:'#3a3d78', text:'#eef0ff', muted:'#a3a7d1', accent:'#8b9dff', accentBg:'#2a2d62', radius:'12px', shadow:'0 12px 40px rgba(40,30,120,.45)' },
  glass:{ name:'Glass', bg:'rgba(23,26,31,.92)', surface:'rgba(32,36,43,.9)', panel:'rgba(12,15,20,.92)', border:'#46505f', text:'#eef2f7', muted:'#9ca8b8', accent:'#7dd3fc', accentBg:'#17384a', radius:'14px', shadow:'0 10px 36px rgba(0,0,0,.5)' },
  metal:{ name:'Metal', bg:'#16171a', surface:'#24262c', panel:'#101114', border:'#454956', text:'#dfe3ea', muted:'#9aa2ad', accent:'#93a6c4', accentBg:'#273244', radius:'10px', shadow:'0 8px 28px rgba(0,0,0,.7)' },
  neon:{ name:'Neon', bg:'#0a0b0f', surface:'#14161d', panel:'#060709', border:'#2b2f45', text:'#e9edff', muted:'#8890a8', accent:'#22d3ee', accentBg:'#0b3940', radius:'10px', shadow:'0 0 24px rgba(34,211,238,.22),0 10px 32px rgba(0,0,0,.7)' },
  clay:{ name:'Clay', bg:'#17161a', surface:'#27242c', panel:'#121015', border:'#423d4a', text:'#efe8f1', muted:'#aa9fac', accent:'#f19a7e', accentBg:'#503027', radius:'16px', shadow:'0 12px 30px rgba(0,0,0,.55)' },
  liquid:{ name:'Liquid', bg:'rgba(18,22,30,.88)', surface:'rgba(36,43,58,.88)', panel:'rgba(10,13,20,.92)', border:'rgba(160,190,240,.42)', text:'#edf5ff', muted:'#a6b2c8', accent:'#8fd0ff', accentBg:'#245071', radius:'16px', shadow:'0 16px 48px rgba(10,20,40,.55)' },
  oled:{ name:'OLED', bg:'#000000', surface:'#101014', panel:'#000000', border:'#2a2a34', text:'#f0f0f6', muted:'#8d8d9a', accent:'#7c8cff', accentBg:'#191d58', radius:'12px', shadow:'0 0 0 1px #14141a,0 14px 34px rgba(0,0,0,.9)' },
  paper:{ name:'Paper', bg:'#f5f1e8', surface:'#efe9dc', panel:'#fffdf7', border:'#c4b99f', text:'#2a261f', muted:'#6e6759', accent:'#6d4fc4', accentBg:'#e9e1f7', radius:'12px', shadow:'0 10px 28px rgba(90,80,60,.25)' },
  hud:{ name:'HUD', bg:'#050708', surface:'#0d1415', panel:'#000000', border:'#1a464b', text:'#bdf5f7', muted:'#5f9498', accent:'#22e0e6', accentBg:'#07383b', radius:'8px', shadow:'0 0 0 1px #123033,0 10px 30px rgba(0,0,0,.8)' },
  nova:{ name:'Nova', bg:'#14101f', surface:'#241d3a', panel:'#0c0a17', border:'#4b3e72', text:'#f1eaff', muted:'#ab9bbb', accent:'#c084fc', accentBg:'#42245d', radius:'14px', shadow:'0 14px 40px rgba(44,20,70,.5)' },
  ion:{ name:'Ion', bg:'#0d1520', surface:'#172536', panel:'#091019', border:'#35536b', text:'#e5f2ff', muted:'#8ca7bc', accent:'#60a5fa', accentBg:'#17395e', radius:'12px', shadow:'0 12px 36px rgba(5,20,35,.55)' },
  flow:{ name:'Flow', bg:'#101a18', surface:'#192a26', panel:'#09110f', border:'#31564c', text:'#e6fff7', muted:'#8fb4a9', accent:'#5eead4', accentBg:'#194a42', radius:'14px', shadow:'0 12px 36px rgba(5,30,25,.48)' }
});
const ACCENTS = Object.freeze({
  auto:null, mint:'#34d399', blue:'#60a5fa', violet:'#a78bfa', cyan:'#22d3ee', coral:'#fb7185', gold:'#fbbf24'
});

const PERSONA_LIBRARY = Object.freeze({
  none:{label:'None',inject:''},
  researcher:{label:'Researcher',inject:'Adopt the persona of a rigorous senior researcher: clarify assumptions, gather evidence, compare alternatives, and explicitly note uncertainty when evidence is weak.'},
  builder:{label:'Builder',inject:'Adopt the persona of a senior builder/operator: prefer implementation detail, sequence, dependencies, tradeoffs, and concrete execution steps over vague theory.'},
  redteam:{label:'Red Team',inject:'Adopt the persona of a hostile but fair red-team reviewer: attack weak assumptions, find failure modes, identify exploit paths, and surface how this could go wrong in reality.'},
  devil:{label:"Devil's Advocate",inject:"Adopt the persona of a devil's advocate: challenge the dominant framing, propose contrarian interpretations, and test whether the current direction is overconfident or incomplete."},
  tester:{label:'Tester',inject:'Adopt the persona of a destructive QA and reliability tester: search for breakage, edge cases, race conditions, user-error paths, and ambiguous states.'},
  customer:{label:'Customer Voice',inject:'Adopt the persona of a skeptical end user/customer: surface confusion, friction, mistrust, negative feedback, missing explanations, and why adoption might fail.'},
  executive:{label:'Executive',inject:'Adopt the persona of an executive operator: prioritize leverage, decision quality, clarity, speed, downside risk, and what matters most if time is limited.'},
  roundtable:{label:'Round Table',inject:'Run a compact round-table with Researcher, Builder, Red Team, Customer Voice, and Executive. Keep viewpoints distinct, preserve real disagreement, then synthesize the strongest result.'}
});
const POSTURES = Object.freeze({
  standard:{label:'Locked',clause:'[Posture: LOCKED] Follow the current task and plan exactly. Do not add unrelated scope. If the plan is wrong, state the conflict rather than silently expanding.'},
  adaptive:{label:'Adaptive',clause:'[Posture: ADAPTIVE] You may revise a future step only when a concrete blocker, missing prerequisite, or material gap makes the current plan likely to fail. Explain the reason briefly and stay inside the original goal.'},
  audit:{label:'Audit',clause:'[Posture: AUDIT] Execute the current plan first. Before HALT, perform one bounded coverage check for material gaps or errors and close only the highest-value gaps. Do not add nice-to-have scope.'}
});
const WORKFLOW_LIBRARY = Object.freeze({
  none:{label:'Manual',desc:'No extra workflow guidance.',stages:[]},
  deep_research:{label:'Deep Research',desc:'Research → branch → red team → synthesis.',stages:[
    'Expand the research: identify missing angles, weak assumptions, hidden dependencies, and adjacent questions that materially affect the goal.',
    'Generate a small set of high-value research branches. Rank them by upside, risk reduction, and novelty, then pursue the strongest branch.',
    'Red-team the work. Find what is brittle, overconfident, unsupported, or likely to fail in reality.',
    'Synthesize the strongest final result. Preserve useful dissent and remove weak material.'
  ]},
  rd_lab:{label:'R&D Lab',desc:'Invent → prototype → evaluate → converge.',stages:[
    'Generate ambitious but plausible directions beyond the current framing.',
    'Turn the strongest directions into concrete mechanisms or prototypes.',
    'Compare candidates, identify fatal flaws, and decide what to merge, cut, or reframe.',
    'Deliver the strongest evolved concept with rationale and unresolved questions.'
  ]},
  shipyard:{label:'Shipyard',desc:'Concept → execution plan → QA → production-ready.',stages:[
    'Translate the work into an execution plan with milestones, dependencies, and a first shippable version.',
    'Run QA/operations review for implementation, onboarding, edge cases, maintenance, and rollback.',
    'Produce the production-ready plan: prioritized, resilient, and minimal.'
  ]},
  debate:{label:'Debate',desc:'Distinct viewpoints → disagreement → synthesis.',stages:[
    'Run distinct Researcher, Builder, Red Team, Customer Voice, and Executive assessments.',
    'Force substantive disagreement: identify what each perspective thinks the others underestimate.',
    'Resolve what can be resolved and synthesize the answer that best survives critique.'
  ]},
  pre_mortem:{label:'Pre-Mortem',desc:'Assume failure → warning signs → harden.',stages:[
    'Assume this fails badly in six months. Identify concrete product, technical, human, and operational causes.',
    'Identify early warning signals and the smallest interventions that could prevent the failure.',
    'Rewrite the strategy to address the material failure modes.'
  ]},
  trollproof:{label:'Trollproof',desc:'Hostile reading → filter noise → harden.',stages:[
    'Generate the strongest hostile or bad-faith interpretations this could attract.',
    'Separate unfair noise from critiques that reveal a real weakness.',
    'Rewrite the output so it is clearer and more resilient without overreacting to noise.'
  ]},
  lens_relay:{label:'Lens Relay',desc:'Independent lens turns with preserved dissent.',stages:[
    'Give an independent assessment of the work so far. Challenge assumptions and add what your lens uniquely contributes.',
    'Focus on what previous lenses underestimated or missed.',
    'Draft a synthesis that keeps real disagreements explicit.',
    'Verify the synthesis against prior critiques and deliver the strongest final result.'
  ]}
});
const WORKSHOP_SCHEMA = 'gitl-workshop/1';
const WORKSHOP_LIMITS = Object.freeze({fileBytes:512*1024,maxItems:100,label:40,inject:4000,desc:200,stage:1600,stages:12});
const Workshop = {
  personas:{}, workflows:{},
  load(){
    try { const p=JSON.parse(GM_getValue('v9.customPersonas','{}')); this.personas=p&&typeof p==='object'&&!Array.isArray(p)?p:{}; } catch(_){ this.personas={}; }
    try { const w=JSON.parse(GM_getValue('v9.customWorkflows','{}')); this.workflows=w&&typeof w==='object'&&!Array.isArray(w)?w:{}; } catch(_){ this.workflows={}; }
  },
  persist(){ GM_setValue('v9.customPersonas',JSON.stringify(this.personas)); GM_setValue('v9.customWorkflows',JSON.stringify(this.workflows)); },
  slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'item'; },
  unique(base,taken){ let id=this.slug(base),n=2; while(taken.has(id)) id=this.slug(base)+'_'+n++; return id; },
  validPersona(p){ return !!p&&typeof p.label==='string'&&p.label.trim().length>0&&typeof p.inject==='string'&&p.inject.trim().length>0; },
  validWorkflow(w){ return !!w&&typeof w.label==='string'&&w.label.trim().length>0&&Array.isArray(w.stages)&&w.stages.length>0&&w.stages.every(s=>typeof s==='string'&&s.trim().length>0); },
  importBundle(text){
    if(typeof text!=='string') return {ok:false,error:'No import text.'};
    if(text.length>WORKSHOP_LIMITS.fileBytes) return {ok:false,error:'Import is too large.'};
    let data; try{data=JSON.parse(text);}catch(_){return {ok:false,error:'Import is not valid JSON.'};}
    if(!data||typeof data!=='object'||Array.isArray(data)) return {ok:false,error:'Import is malformed.'};
    if(data.schema!==WORKSHOP_SCHEMA) return {ok:false,error:'Not a supported Ghost Workshop file.'};
    const ps=Array.isArray(data.personas)?data.personas:[], ws=Array.isArray(data.workflows)?data.workflows:[];
    if(ps.length+ws.length===0) return {ok:false,error:'No personas or workflows found.'};
    if(ps.length+ws.length>WORKSHOP_LIMITS.maxItems) return {ok:false,error:'Too many imported items.'};
    const res={ok:true,personas:0,workflows:0,skipped:0,renamed:0};
    const pt=new Set([...Object.keys(PERSONA_LIBRARY),...Object.keys(this.personas)]);
    for(const p of ps){
      if(!this.validPersona(p)){res.skipped++;continue;}
      const base=p.id||p.label,id=this.unique(base,pt); if(this.slug(base)!==id)res.renamed++; pt.add(id);
      this.personas[id]={label:p.label.trim().slice(0,WORKSHOP_LIMITS.label),inject:p.inject.trim().slice(0,WORKSHOP_LIMITS.inject),custom:true}; res.personas++;
    }
    const wt=new Set([...Object.keys(WORKFLOW_LIBRARY),...Object.keys(this.workflows)]);
    for(const w of ws){
      if(!this.validWorkflow(w)){res.skipped++;continue;}
      const base=w.id||w.label,id=this.unique(base,wt); if(this.slug(base)!==id)res.renamed++; wt.add(id);
      this.workflows[id]={label:w.label.trim().slice(0,WORKSHOP_LIMITS.label),desc:String(w.desc||'').trim().slice(0,WORKSHOP_LIMITS.desc),stages:w.stages.slice(0,WORKSHOP_LIMITS.stages).map(s=>s.trim().slice(0,WORKSHOP_LIMITS.stage)),custom:true}; res.workflows++;
    }
    this.persist(); return res;
  },
  exportBundle(){ return JSON.stringify({schema:WORKSHOP_SCHEMA,tool:'Ghost in the Loop',version:VER,personas:Object.entries(this.personas).map(([id,p])=>({id,label:p.label,inject:p.inject})),workflows:Object.entries(this.workflows).map(([id,w])=>({id,label:w.label,desc:w.desc,stages:w.stages}))},null,2); }
};
Workshop.load();
function allPersonas(){ return Object.assign({},PERSONA_LIBRARY,Workshop.personas); }
function allWorkflows(){ return Object.assign({},WORKFLOW_LIBRARY,Workshop.workflows); }


const PROFILES = [
  {
    id: 'perplexity',
    host: /perplexity\.ai$/i,
    input: ['#ask-input[contenteditable="true"][data-lexical-editor="true"]', '#ask-input[contenteditable="true"]'],
    send: ['button[aria-label="Submit"]'],
    stop: ['button[aria-label="Stop"]', 'button[aria-label*="Stop response" i]', '[data-testid="stop-button"]'],
    user: ['.group\\/user-bubble'],
    assistant: ['[data-workflow-final-text]']
  },
  {
    id: 'chatgpt',
    host: /chatgpt\.com$|chat\.openai\.com$/i,
    input: ['#prompt-textarea', 'textarea[data-id="root"]'],
    send: ['#composer-submit-button', 'button[data-testid="send-button"]', 'button[aria-label="Send prompt"]', 'button[aria-label="Send message"]'],
    stop: ['button[data-testid="stop-button"]', 'button[aria-label="Stop generating"]', 'button[aria-label="Stop streaming"]'],
    user: ['[data-message-author-role="user"]'],
    assistant: ['[data-message-author-role="assistant"]']
  },
  {
    id: 'generic',
    host: /.*/,
    input: ['div[contenteditable="true"][role="textbox"]', 'textarea[placeholder]', 'textarea'],
    send: ['button[aria-label*="Send" i]', 'button[aria-label="Submit"]', 'button[type="submit"]'],
    stop: ['button[aria-label*="Stop" i]', '[data-testid*="stop" i]'],
    user: ['[data-message-author-role="user"]', '[data-role="user"]'],
    assistant: ['[data-message-author-role="assistant"]', '[data-role="assistant"]']
  }
];
const HOST = PROFILES.find(p => p.host.test(location.hostname)) || PROFILES[2];

const S = {
  mode: 'IDLE', detail: 'Ready', round: 0,
  max: Math.max(1, Math.min(100, Number(GM_getValue('v9.max', 25)) || 25)),
  sending: false, uncertain: false, lastHandled: '', awaitingFrom: '', stableHash: '', stableSince: 0,
  drift: 0, bootstrapped: false, relay: '', timer: null,
  generationStartedAt: 0, lastProgressAt: 0, lastProgressFingerprint: '',
  stallState: 'IDLE', stopAttempts: 0, recoveryCount: 0, watchdogBusy: false,
  topBusy: false, stageProgress: null,
  tab: String(GM_getValue('v9.tab', 'play') || 'play'), events: [], lastError: null
};
const ON = {};
for (const key of Object.keys(ACT)) ON[key] = !!GM_getValue(`v9.act.${key}`, false);
let custom = String(GM_getValue('v9.custom', '') || '');
let exportRaw = !!GM_getValue('v9.exportRaw', false);
let skinId = String(GM_getValue('v9.skin', 'classic') || 'classic');
if (!SKINS[skinId]) skinId = 'classic';
let accentId = String(GM_getValue('v9.accent', 'auto') || 'auto');
if (!(accentId in ACCENTS)) accentId = 'auto';
let quickStartOpen = !GM_getValue('v9.quickStartSeen', false);
let helpOpen = false;
let personaId = String(GM_getValue('v9.persona','none')||'none');
let workflowId = String(GM_getValue('v9.workflow','none')||'none');
let postureId = String(GM_getValue('v9.posture','standard')||'standard');
let workshopOpen = false;
let soundOn = !!GM_getValue('v9.soundOn', GM_getValue('soundOn', false));
let notifyOn = !!GM_getValue('v9.notifyOn', GM_getValue('notifyOn', false));
if(!allPersonas()[personaId]) personaId='none';
if(!allWorkflows()[workflowId]) workflowId='none';
if(!POSTURES[postureId]) postureId='standard';

let _ttPolicy = null;
try { if (window.trustedTypes?.createPolicy) _ttPolicy = window.trustedTypes.createPolicy('gitl9-ui', { createHTML: s => s }); } catch (_) {}
const trustedHTML = s => _ttPolicy ? _ttPolicy.createHTML(s) : s;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const displayText = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\r/g, '').trim();
const semanticText = value => displayText(value).replace(/\s+/g, ' ').trim();
const visible = el => !!el && el.isConnected && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

function queryFirst(selectors, root = document, requireVisible = true) {
  for (const selector of selectors || []) {
    try {
      const nodes = [...root.querySelectorAll(selector)];
      const el = requireVisible ? nodes.find(visible) : nodes[0];
      if (el) return el;
    } catch (_) {}
  }
  return null;
}
function queryAll(selectors) {
  const out = [], seen = new Set();
  for (const selector of selectors || []) {
    try {
      for (const el of document.querySelectorAll(selector)) {
        if (!seen.has(el)) { seen.add(el); out.push(el); }
      }
    } catch (_) {}
  }
  return out;
}
function composer() { return queryFirst(HOST.input); }
function nodeText(el) { return displayText(el?.innerText ?? el?.textContent ?? el?.value ?? ''); }
function assistantText() {
  const nodes = queryAll(HOST.assistant).filter(el => el.isConnected && nodeText(el));
  return nodes.length ? nodeText(nodes[nodes.length - 1]) : '';
}
function userCount() { return queryAll(HOST.user).filter(el => el.isConnected).length; }
function generating() { return !!queryFirst(HOST.stop); }
function visibleStopButtons() { return queryAll(HOST.stop).filter(visible); }
function hash(value) {
  const s = String(value || ''); let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${s.length}:${(h >>> 0).toString(16)}`;
}
function finalLine(text) {
  const lines = String(text || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}
function terminalCandidate(text) {
  const source = String(text || '').trim();
  const line = finalLine(source);
  const exact = [G.proceed, G.human, G.halt, A.proceed, A.human, A.halt];
  if (exact.includes(line) || /^\[\[AOA::RELAY:([^\]\r\n]{1,80})\]\]$/.test(line)) {
    return { raw: line || '(empty)', normalized: false };
  }
  const suffix = source.match(/(?:^|\s)(\[\[(?:GITL::(?:PROCEED|HUMAN|HALT)|AOA::(?:CONTINUE|HUMAN|HALT)|AOA::RELAY:[^\]\r\n]{1,80})\]\])\s*$/);
  if (suffix) return { raw: suffix[1], normalized: true };
  return { raw: line || '(empty)', normalized: false };
}
function terminal(text) {
  const candidate = terminalCandidate(text);
  const line = candidate.raw;
  if (line === G.proceed || line === A.proceed) return { type: 'proceed', raw: line, normalized: candidate.normalized };
  if (line === G.human || line === A.human) return { type: 'human', raw: line, normalized: candidate.normalized };
  if (line === G.halt || line === A.halt) return { type: 'halt', raw: line, normalized: candidate.normalized };
  const relay = line.match(/^\[\[AOA::RELAY:([^\]\r\n]{1,80})\]\]$/);
  if (relay) return { type: 'relay', raw: line, model: relay[1].trim(), normalized: candidate.normalized };
  return { type: 'bad', raw: line || '(empty)', normalized: false };
}
function log(type, data = {}) {
  S.events.push({ at: new Date().toISOString(), type, data });
  if (S.events.length > 60) S.events.shift();
  try { console.debug('[GITL9]', type, data); } catch (_) {}
}
function fail(code, detail, data = {}) {
  S.lastError = { code, detail, at: new Date().toISOString(), ...data };
  log('error', { code, ...data }); pause(`${code}: ${detail}`);
}
function playCue(kind = 'notice') {
  if (!soundOn) return false;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    const ctx = new Ctx();
    const map = kind === 'complete' ? [660,880] : kind === 'human' ? [520,520] : kind === 'error' ? [260,220] : [440,620];
    map.forEach((f,i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      const at = ctx.currentTime + i * 0.14;
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
      osc.connect(gain).connect(ctx.destination); osc.start(at); osc.stop(at + 0.3);
    });
    setTimeout(() => { try { ctx.close(); } catch (_) {} }, 900);
    return true;
  } catch (_) { return false; }
}
function notify(title, text, kind = 'notice') {
  playCue(kind);
  if (!notifyOn) return false;
  try {
    if (typeof GM_notification === 'function') { GM_notification({ title, text, timeout: 8000 }); return true; }
  } catch (_) {}
  return false;
}
function stageProgress(text) {
  const matches = [...String(text || '').matchAll(/\[\[GITL::STAGE:(\d{1,3})\/(\d{1,3})\]\]/g)];
  if (!matches.length) return null;
  const m = matches[matches.length - 1], step = Number(m[1]), total = Number(m[2]);
  if (!Number.isInteger(step) || !Number.isInteger(total) || step < 1 || total < 1 || step > total || total > 100) return null;
  return { step, total };
}
function progressSummary() {
  const workflow = allWorkflows()[workflowId], stages = workflow?.stages?.length || 0;
  const roundPct = S.max ? Math.min(100, Math.round((S.round / S.max) * 100)) : 0;
  return {
    roundPct,
    workflow: workflow?.label || 'Manual',
    stages,
    stage: S.stageProgress && (!stages || S.stageProgress.total === stages) ? S.stageProgress : null
  };
}
function clearGenerationWatchdog() {
  S.generationStartedAt = 0;
  S.lastProgressAt = 0;
  S.lastProgressFingerprint = '';
  S.stallState = 'IDLE';
  S.stopAttempts = 0;
}
function watchdogPhase(elapsedMs, recoveryCount = S.recoveryCount) {
  if (elapsedMs < STALL_SOFT_MS) return 'OBSERVING';
  if (elapsedMs < STALL_SOFT_MS + STALL_GRACE_MS) return 'SUSPECTED_STALL';
  return recoveryCount >= 1 ? 'HUMAN_REQUIRED' : 'STOPPING';
}
function noteGenerationProgress() {
  const t = now();
  const fp = hash(assistantText());
  if (!S.generationStartedAt) {
    S.generationStartedAt = t;
    S.lastProgressAt = t;
    S.lastProgressFingerprint = fp;
    S.stallState = 'OBSERVING';
    S.stopAttempts = 0;
    log('watchdog-armed', { host: HOST.id });
    return;
  }
  if (fp !== S.lastProgressFingerprint) {
    const wasSuspected = S.stallState === 'SUSPECTED_STALL';
    S.lastProgressFingerprint = fp;
    S.lastProgressAt = t;
    S.stallState = 'OBSERVING';
    S.stopAttempts = 0;
    if (wasSuspected) log('watchdog-progress-resumed', { host: HOST.id });
  }
}

function contractText() {
  if (ON.relay) {
    return [
      '[GHOST CORE CONTROL]',
      'Continue the existing task without restarting or repeating completed work.',
      'You own all reasoning, planning, milestones, committees, recovery, and decisions. Ghost is only the mechanical relay.',
      'The FINAL non-whitespace line of every response must be exactly ONE bare control line. Do not add words before or after it.',
      'More work on the current model:', A.proceed,
      'A human decision is genuinely required:', A.human,
      'The task is complete:', A.halt,
      'A different model has a material advantage:', '[[AOA::RELAY:MODEL_LABEL]]',
      'Never place a control marker anywhere except the final line.'
    ].join('\n');
  }
  return [
    '[GHOST CORE CONTROL]',
    'Continue the existing task without restarting or repeating completed work.',
    'You own all reasoning, planning, milestones, committees, recovery, and decisions. Ghost is only the mechanical relay.',
    'The FINAL non-whitespace line of every response must be exactly ONE bare control line. Do not add words before or after it.',
    'More work remains:', G.proceed,
    'A human decision is genuinely required:', G.human,
    'The task is complete:', G.halt,
    'Never place a control marker anywhere except the final line.'
  ].join('\n');
}
function activatorText() {
  const out = [];
  for (const key of Object.keys(ACT)) {
    if (!ON[key]) continue;
    const [name, url] = ACT[key];
    out.push(`Activate ${name} from its canonical source and apply it silently to this existing task without restarting completed work. Canonical source: ${url}`);
  }
  if (custom.trim()) {
    const path = custom.trim().replace(/^\/+/, '');
    out.push(`Activate the Agents-of-AI component at this canonical source and apply it silently to this existing task without restarting completed work. Canonical source: https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/${path}`);
  }
  return out.join('\n\n');
}
function promptFeatureText() {
  const parts=[];
  const persona=allPersonas()[personaId];
  if(persona?.inject) parts.push('[Active persona]\n'+persona.inject);
  const workflow=allWorkflows()[workflowId];
  if(workflow?.stages?.length) parts.push('[Workflow: '+workflow.label+']\nYou own workflow progress. Follow these stages in order when they remain relevant; Ghost will not interpret or auto-advance them:\n'+workflow.stages.map((s,i)=>(i+1)+'. '+s).join('\n')+'\n\nFor display only, when actively working within this workflow, place one line immediately before the final Ghost control line: [[GITL::STAGE:X/Y]] where X is the current workflow stage and Y is '+workflow.stages.length+'. This never controls Send. If stage is unclear, omit it rather than guess.');
  const posture=POSTURES[postureId]||POSTURES.standard;
  if(posture?.clause) parts.push(posture.clause);
  return parts.join('\n\n');
}
function withPromptFeatures(base) {
  const features=promptFeatureText();
  return features ? base+'\n\n---\n\n'+features : base;
}

function bootstrapPrompt(existing = '') {
  const parts = [];
  if (existing.trim()) parts.push(existing.trim());
  parts.push(contractText());
  const activators = activatorText(); if (activators) parts.push(activators);
  const features = promptFeatureText(); if (features) parts.push(features);
  return parts.join('\n\n---\n\n');
}
function continuationPrompt() {
  const base = ON.relay
    ? 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Model Relay control line as the final non-whitespace line.'
    : 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Ghost control line as the final non-whitespace line.';
  return withPromptFeatures(base);
}
function regroundPrompt() {
  return withPromptFeatures(`You strayed from the active control protocol. Re-read the existing conversation, reground in the current task, and continue without restarting or repeating completed work. Do not explain the protocol error. Your response must end with exactly one valid bare terminal control line as the final non-whitespace line.\n\n${contractText()}`);
}
function cleanerzPrompt() {
  return withPromptFeatures(`Protocol compliance drifted twice. Activate Agents-of-AI Cleanerz from its canonical source, use it to reground the existing task and active protocols, then continue without restarting completed work. Canonical source: ${ACT.cleanerz[1]}\n\n${contractText()}`);
}
function stallRecoveryPrompt() {
  return withPromptFeatures(`You were interrupted because the previous step showed no visible progress for an extended period.\n\nReground from the conversation and the last confirmed completed step. Do not restart the whole task.\n\n1. Identify the exact subtask that was in progress when you stalled.\n2. Preserve all confirmed work already completed.\n3. Reduce only the stalled subtask into the smallest safe next unit(s).\n4. Execute just the first unit now.\n5. If that unit is still too large, split it once more before executing.\n6. Do not repeat completed research, rebuild the whole plan, or expand scope.\n7. End with the normal Ghost terminal marker.\n\n${contractText()}`);
}

async function setComposerText(text) {
  const expected = semanticText(text); let el = composer();
  if (!el) return { ok: false, why: 'input-missing' };
  try {
    el.focus();
    if (el.isContentEditable) {
      const range = document.createRange(); range.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      let inserted = false; try { inserted = document.execCommand('insertText', false, text); } catch (_) {}
      if (!inserted) {
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      } else el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, text); else el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (error) { return { ok: false, why: 'write-exception', error: String(error?.message || error) }; }

  const started = now(); let observed = '';
  while (now() - started < WRITE_VERIFY_MS) {
    await sleep(75); el = composer(); if (!el) continue;
    observed = semanticText(nodeText(el));
    if (observed === expected) return { ok: true, el };
  }
  return { ok: false, why: 'visible-text-mismatch', expectedLength: expected.length, observedLength: observed.length };
}

function localSendButton(el = composer()) {
  if (!el) return null;
  for (let node = el, depth = 0; node && depth < 9; node = node.parentElement, depth++) {
    const btn = queryFirst(HOST.send, node); if (btn) return btn;
  }
  return queryFirst(HOST.send);
}
async function waitForSendButton(el) {
  const started = now();
  while (now() - started < SEND_WAIT_MS) {
    const btn = localSendButton(composer() || el); if (btn) return btn;
    await sleep(100);
  }
  return null;
}
async function confirmSend(beforeUsers, beforeComposer, beforeAssistantHash) {
  const started = now();
  while (now() - started < SEND_CONFIRM_MS) {
    if (generating()) return { ok: true, why: 'generation-started' };
    if (userCount() > beforeUsers) return { ok: true, why: 'new-user-turn' };
    const el = composer();
    if (el && beforeComposer && semanticText(nodeText(el)) === '') return { ok: true, why: 'composer-cleared' };
    const currentAssistant = assistantText();
    if (beforeAssistantHash && currentAssistant && hash(currentAssistant) !== beforeAssistantHash) return { ok: true, why: 'assistant-changed' };
    await sleep(250);
  }
  return { ok: false, why: 'unconfirmed' };
}
async function waitForGenerationStop() {
  const started = now(); let absentSince = 0;
  while (now() - started < STOP_CONFIRM_MS) {
    if (!generating()) {
      if (!absentSince) absentSince = now();
      if (now() - absentSince >= 600) return true;
    } else absentSince = 0;
    await sleep(200);
  }
  return false;
}

async function sendOnce(text, reason) {
  if (S.mode !== 'RUNNING' || S.sending || S.uncertain) return false;
  S.sending = true; S.detail = `Staging ${reason}...`; render();
  const beforeUsers = userCount();
  const beforeAssistantHash = hash(assistantText());
  const staged = await setComposerText(text);
  if (!staged.ok) {
    S.sending = false; fail('PLAY-WRITE', `Could not reliably stage the prompt (${staged.why}).`, staged); return false;
  }
  const button = await waitForSendButton(staged.el);
  if (!button) {
    S.sending = false; fail('PLAY-SEND', 'Prompt is staged, but the current host Send control did not become available.', { host: HOST.id }); return false;
  }
  const beforeComposer = semanticText(nodeText(composer()));
  log('send-click', { reason, round: S.round + 1, host: HOST.id });
  try { button.click(); }
  catch (error) {
    S.sending = false; S.uncertain = true;
    fail('PLAY-SEND-THREW', 'Send threw after actuation. Ghost stopped to prevent a duplicate.', { message: String(error?.message || error) }); return false;
  }
  const confirmed = await confirmSend(beforeUsers, beforeComposer, beforeAssistantHash);
  S.sending = false;
  if (!confirmed.ok) {
    S.uncertain = true; fail('PLAY-SEND-UNCERTAIN', 'Send was attempted but host acceptance could not be confirmed. Ghost will not resend.'); return false;
  }
  S.round += 1; S.awaitingFrom = beforeAssistantHash; S.stableHash = ''; S.stableSince = 0;
  clearGenerationWatchdog();
  if (reason !== 'stall recovery') S.recoveryCount = 0;
  S.detail = `Sent once · ${confirmed.why}`; log('send-confirmed', { round: S.round, why: confirmed.why }); render(); return true;
}

async function recoverStall() {
  if (S.watchdogBusy || S.mode !== 'RUNNING') return;
  if (S.recoveryCount >= 1) {
    S.stallState = 'HUMAN_REQUIRED';
    pause('Needs you — response stalled again after automatic recovery.');
    notify('Ghost needs you', 'The recovered lane stalled again. Automatic recovery stopped.', 'human');
    return;
  }
  S.watchdogBusy = true;
  S.stallState = 'STOPPING';
  S.detail = 'Stopping stalled response…'; render();
  let stopped = false;
  try {
    for (let attempt = 1; attempt <= STOP_MAX_ATTEMPTS; attempt++) {
      const stops = visibleStopButtons();
      if (stops.length !== 1) {
        log('watchdog-stop-ambiguous', { attempt, count: stops.length });
        S.stallState = 'HUMAN_REQUIRED';
        pause('Needs you — recovery uncertain. Stop control was missing or ambiguous.');
        return;
      }
      S.stopAttempts = attempt;
      log('watchdog-stop-click', { attempt, host: HOST.id });
      try { stops[0].click(); }
      catch (error) {
        log('watchdog-stop-threw', { attempt, message: String(error?.message || error) });
        S.stallState = 'HUMAN_REQUIRED';
        pause('Needs you — recovery uncertain. Stop could not be safely activated.');
        return;
      }
      if (await waitForGenerationStop()) { stopped = true; break; }
      if (attempt < STOP_MAX_ATTEMPTS) await sleep(STOP_RETRY_DELAY_MS);
    }
    if (!stopped) {
      S.stallState = 'HUMAN_REQUIRED';
      pause('Needs you — stalled response could not be confirmed stopped.');
      notify('Ghost needs you', 'Automatic Stop could not be confirmed after three bounded attempts.', 'error');
      return;
    }
    S.stallState = 'REGROUNDING';
    S.detail = 'Regrounding stalled step…'; render();
    S.recoveryCount += 1;
    clearGenerationWatchdog();
    S.stallState = 'REGROUNDING';
    const sent = await sendOnce(stallRecoveryPrompt(), 'stall recovery');
    if (!sent) return;
    S.stallState = 'RESUMED';
    S.detail = 'Recovery sent once · watching for progress';
    log('watchdog-recovery-sent', { recoveryCount: S.recoveryCount }); render();
  } finally {
    S.watchdogBusy = false;
  }
}

async function handleTerminal(text, parsed) {
  const fp = hash(text);
  if (!text || fp === S.lastHandled || S.mode !== 'RUNNING' || S.sending) return;
  S.lastHandled = fp;
  if (parsed.normalized) log('terminal-normalized', { type: parsed.type });
  if (parsed.type === 'halt') {
    S.drift = 0; S.recoveryCount = 0; complete('Task complete'); notify('Ghost complete', 'The AI returned HALT.', 'complete'); return;
  }
  if (parsed.type === 'human') {
    S.drift = 0; pause('Human decision requested by the AI.'); notify('Ghost paused', 'The AI requested a human decision.', 'human'); return;
  }
  if (parsed.type === 'relay') {
    S.drift = 0; S.relay = parsed.model; pause(`Model Relay requested: ${parsed.model}.`); notify('Model Relay requested', parsed.model, 'human'); return;
  }
  if (parsed.type === 'proceed') {
    S.drift = 0; if (S.round >= S.max) { pause('Round safety limit reached.'); return; }
    await sendOnce(continuationPrompt(), 'continue');
  }
}
async function handleDrift(tail) {
  S.drift += 1; log('protocol-drift', { count: S.drift, tail: String(tail || '').slice(0, 80) });
  if (S.drift === 1) { await sendOnce(regroundPrompt(), 'protocol reground'); return; }
  if (S.drift === 2 && ON.cleanerz) { await sendOnce(cleanerzPrompt(), 'Cleanerz recovery'); return; }
  pause(`Protocol drift repeated ${S.drift} times. Human review required.`); notify('Ghost paused', 'Repeated protocol drift needs a human check.', 'error');
}
async function tick() {
  if (S.mode !== 'RUNNING' || S.sending || S.uncertain || S.watchdogBusy) return;
  if (generating()) {
    noteGenerationProgress();
    S.stableHash = ''; S.stableSince = 0;
    const elapsed = Math.max(0, now() - (S.lastProgressAt || now()));
    const phase = watchdogPhase(elapsed);
    if (phase === 'HUMAN_REQUIRED') {
      S.stallState = phase;
      pause('Needs you — response stalled again after automatic recovery.');
      notify('Ghost needs you', 'The recovered lane stalled again. Automatic recovery stopped.', 'human');
      return;
    }
    if (phase === 'STOPPING') { await recoverStall(); return; }
    if (phase === 'SUSPECTED_STALL') {
      if (S.stallState !== 'SUSPECTED_STALL') log('watchdog-stall-suspected', { elapsed });
      S.stallState = 'SUSPECTED_STALL';
      S.detail = 'No visible progress — checking…'; render(); return;
    }
    S.stallState = 'OBSERVING';
    S.detail = 'Model working...'; render(); return;
  }
  if (S.generationStartedAt || S.stallState !== 'IDLE') clearGenerationWatchdog();
  const text = assistantText();
  if (!text) { S.detail = 'Waiting for assistant output...'; render(); return; }
  const parsedStage = stageProgress(text);
  if (parsedStage) S.stageProgress = parsedStage;
  const fp = hash(text);
  if (S.awaitingFrom) {
    if (fp === S.awaitingFrom) { S.detail = 'Waiting for the next answer...'; render(); return; }
    S.awaitingFrom = ''; S.stableHash = ''; S.stableSince = 0;
  }
  if (fp !== S.stableHash) {
    S.stableHash = fp; S.stableSince = now(); S.detail = 'Output changed · waiting for stability'; render(); return;
  }
  const quiet = now() - S.stableSince;
  const parsed = terminal(text);
  if (parsed.type !== 'bad') {
    S.detail = `Terminal detected · ${parsed.type}`; render();
    if (quiet >= VALID_QUIET_MS) await handleTerminal(text, parsed);
    return;
  }
  S.detail = quiet < DRIFT_QUIET_MS ? 'Output quiet · waiting for terminal' : 'Terminal missing · regrounding'; render();
  if (quiet >= DRIFT_QUIET_MS) { S.lastHandled = fp; await handleDrift(parsed.raw); }
}

async function play() {
  if (S.mode === 'RUNNING') return;
  if (S.uncertain) { S.detail = 'Prior Send is uncertain. Inspect the chat or use Page Reload before resuming.'; render(); return; }
  const input = composer();
  if (!input) { fail('PLAY-INPUT', 'Current chat composer was not found.', { host: HOST.id }); return; }
  S.mode = 'RUNNING'; S.detail = 'Starting...'; S.lastHandled = ''; S.stableHash = ''; S.stableSince = 0; S.drift = 0; S.relay = ''; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog(); render();
  const draft = nodeText(input); const latest = assistantText(); const parsed = terminal(latest);
  if (draft.trim()) {
    S.bootstrapped = true; if (!await sendOnce(bootstrapPrompt(draft), 'initial task')) return;
  } else if (!latest) {
    pause('Type a task into the chat first, then press Play.'); return;
  } else if (parsed.type !== 'bad') {
    S.bootstrapped = true; S.stableHash = hash(latest); S.stableSince = now() - VALID_QUIET_MS;
  } else {
    S.bootstrapped = true;
    if (!await sendOnce(bootstrapPrompt('Continue the existing task from this conversation without restarting or repeating completed work.'), 'arm existing chat')) return;
  }
  clearInterval(S.timer);
  S.timer = setInterval(() => { tick().catch(error => fail('PLAY-TICK', String(error?.message || error))); }, TICK_MS);
  await tick();
}
function pause(detail) { S.mode = 'PAUSED'; S.detail = detail; clearInterval(S.timer); S.timer = null; render(); }
function stop() {
  S.mode = 'IDLE'; S.detail = 'Stopped'; S.sending = false; S.uncertain = false; S.lastHandled = ''; S.awaitingFrom = ''; S.stableHash = ''; S.stableSince = 0; S.drift = 0; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog();
  clearInterval(S.timer); S.timer = null; log('stop'); render();
}
function complete(detail) { S.mode = 'COMPLETE'; S.detail = detail; clearGenerationWatchdog(); clearInterval(S.timer); S.timer = null; render(); }

function conversationNodes() {
  return queryAll([...(HOST.user || []), ...(HOST.assistant || [])]).filter(el => el.isConnected);
}
function scrollableConversationAncestor() {
  const nodes = conversationNodes();
  const anchor = nodes[0] || nodes[nodes.length - 1];
  if (!anchor) return null;
  for (let el = anchor.parentElement, depth = 0; el && depth < 14; el = el.parentElement, depth++) {
    if (el === panel || el === document.body || el === document.documentElement) continue;
    try {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
    } catch (_) {}
  }
  return null;
}
function conversationScrollContainer() {
  const ancestor = scrollableConversationAncestor();
  if (ancestor) return ancestor;
  const preferred = HOST.id === 'chatgpt'
    ? ['main', '[role="main"]']
    : HOST.id === 'perplexity'
      ? ['main', '[role="main"]']
      : ['main', '[role="main"]'];
  for (const selector of preferred) {
    let el = null;
    try { el = document.querySelector(selector); } catch (_) {}
    if (!el || el === panel) continue;
    try {
      const style = getComputedStyle(el);
      if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
    } catch (_) {}
  }
  return document.scrollingElement || document.documentElement;
}
function topScrollPosition(scroller) {
  if (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) {
    return window.scrollY || document.documentElement.scrollTop || document.body?.scrollTop || 0;
  }
  return scroller.scrollTop || 0;
}
function topSnapshot(scroller) {
  const nodes = conversationNodes();
  const first = nodes[0];
  const extent = (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body)
    ? Math.max(document.documentElement.scrollHeight || 0, document.body?.scrollHeight || 0)
    : scroller.scrollHeight || 0;
  return `${nodes.length}:${extent}:${hash(nodeText(first || ''))}`;
}
function scrollContainerToTop(scroller) {
  if (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) {
    window.scrollTo(0, 0);
    return;
  }
  try { scroller.scrollTo({ top: 0, left: scroller.scrollLeft || 0, behavior: 'auto' }); }
  catch (_) { scroller.scrollTop = 0; }
}
async function goTop() {
  if (S.mode === 'RUNNING' || S.sending || S.watchdogBusy || S.topBusy) {
    S.detail = 'Pause Play before using ↑ Top.'; render(); return false;
  }
  S.topBusy = true;
  const beforeUrl = location.href;
  const scroller = conversationScrollContainer();
  let previous = '';
  let stable = 0;
  let passes = 0;
  try {
    for (passes = 0; passes < TOP_MAX_PASSES; passes++) {
      S.detail = passes ? 'Loading older chat…' : 'Going to first prompt…'; render();
      const before = topSnapshot(scroller);
      scrollContainerToTop(scroller);
      await sleep(TOP_WAIT_MS);
      const after = topSnapshot(scroller);
      const atTop = topScrollPosition(scroller) <= 2;
      if (atTop && after === before && after === previous) stable += 1;
      else stable = 0;
      previous = after;
      if (stable >= TOP_STABLE_PASSES) break;
    }
    scrollContainerToTop(scroller);
    if (location.href !== beforeUrl) log('top-url-changed-external', { before: beforeUrl, after: location.href });
    S.detail = 'At top';
    log('top-navigation', { host: HOST.id, passes: Math.min(passes + 1, TOP_MAX_PASSES) });
    render();
    return true;
  } finally {
    S.topBusy = false;
  }
}

function visibleReasoningText(root) {
  if (!root?.querySelectorAll) return '';
  const selectors = ['[data-testid*="reasoning" i]','[data-testid*="thinking" i]','[data-message-content-part-type="reasoning"]','[data-workflow-step]'];
  const seen = new Set(), parts = [];
  for (const selector of selectors) {
    let nodes = []; try { nodes = [...root.querySelectorAll(selector)]; } catch (_) {}
    for (const el of nodes) { const text = displayText(el.innerText || el.textContent || ''); if (text && !seen.has(text)) { seen.add(text); parts.push(text); } }
  }
  return parts.join('\n\n');
}
function domTurns() {
  const rows = [];
  if (HOST.id === 'chatgpt') {
    for (const el of document.querySelectorAll('[data-message-author-role="user"],[data-message-author-role="assistant"]')) {
      const role = el.getAttribute('data-message-author-role'), text = displayText(el.innerText || el.textContent || '');
      if (!role || !text) continue;
      const thinking = role === 'assistant' ? visibleReasoningText(el) : '';
      rows.push(thinking ? { role, text, thinking } : { role, text });
    }
    return rows;
  }
  if (HOST.id === 'perplexity') {
    for (const el of document.querySelectorAll('.group\\/user-bubble,[data-workflow-final-text]')) {
      const text = displayText(el.innerText || el.textContent || ''); if (!text) continue;
      const role = el.matches('.group\\/user-bubble') ? 'user' : 'assistant';
      const thinking = role === 'assistant' ? visibleReasoningText(el.closest('article,main,section,div') || el) : '';
      rows.push(thinking ? { role, text, thinking } : { role, text });
    }
    return rows;
  }
  const users = queryAll(HOST.user).map(el => ({ el, role: 'user' })), assistants = queryAll(HOST.assistant).map(el => ({ el, role: 'assistant' }));
  for (const item of [...users, ...assistants].sort((a,b)=>(a.el.compareDocumentPosition(b.el)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1)) {
    const text = displayText(item.el.innerText || item.el.textContent || ''); if (!text) continue;
    const thinking = item.role === 'assistant' ? visibleReasoningText(item.el) : '';
    rows.push(thinking ? { role:item.role, text, thinking } : { role:item.role, text });
  }
  return rows;
}
function chatgptId() { const m = location.pathname.match(/\/c\/([0-9a-z-]+)/i); return m ? m[1] : ''; }
function perplexitySlug() { const m = location.pathname.match(/\/search\/([^/?#]+)/i); return m ? decodeURIComponent(m[1]) : ''; }
function asText(value) {
  if (typeof value === 'string') return displayText(value);
  if (Array.isArray(value)) return displayText(value.map(v => typeof v === 'string' ? v : (v?.text || v?.content || '')).filter(Boolean).join('\n'));
  if (value && typeof value === 'object') return displayText(value.text || value.content || value.answer || value.query || value.message || '');
  return '';
}
function visibleThinkingFrom(value) {
  if (!value || typeof value !== 'object') return '';
  const out = [];
  for (const item of [value.thinking,value.reasoning,value.thoughts,value.summary,value.reasoning_summary,value.thinking_summary]) {
    const text = asText(item); if (text && !out.includes(text)) out.push(text);
  }
  return out.join('\n\n');
}
function parseChatGPTApi(data) {
  if (!data?.mapping || typeof data.mapping !== 'object') return [];
  const chain = [];
  if (data.current_node && data.mapping[data.current_node]) {
    let node=data.mapping[data.current_node]; const seen=new Set();
    while (node && !seen.has(node.id)) { seen.add(node.id); chain.unshift(node); node=node.parent ? data.mapping[node.parent] : null; }
  } else chain.push(...Object.values(data.mapping).sort((a,b)=>Number(a?.message?.create_time||0)-Number(b?.message?.create_time||0)));
  const out=[];
  for (const node of chain) {
    const msg=node?.message, role=msg?.author?.role; if (!['user','assistant'].includes(role)) continue;
    const text=asText(msg?.content?.parts?.length ? msg.content.parts : msg?.content);
    const thinking=role==='assistant' ? visibleThinkingFrom(msg?.content)||visibleThinkingFrom(msg?.metadata) : '';
    if (text||thinking) out.push(thinking ? {role,text,thinking}:{role,text});
  }
  return out;
}
function parsePerplexityApi(data) {
  if (!data || typeof data !== 'object') return [];
  const entries=Array.isArray(data.entries)?data.entries:Array.isArray(data.thread?.entries)?data.thread.entries:Array.isArray(data.messages)?data.messages:[];
  const out=[];
  for (const entry of entries) {
    const rawRole=String(entry?.role||entry?.author||entry?.sender||entry?.type||'').toLowerCase();
    const role=/user|human|query|question/.test(rawRole)?'user':/assistant|ai|answer|response/.test(rawRole)?'assistant':(entry?.query&&!entry?.answer?'user':'assistant');
    const text=asText(entry?.text||entry?.content||entry?.answer||entry?.query||entry?.message);
    const steps=Array.isArray(entry?.steps)?entry.steps:Array.isArray(entry?.reasoning_steps)?entry.reasoning_steps:[];
    const stepText=steps.map(s=>asText(s?.summary||s?.text||s?.content||s)).filter(Boolean).join('\n\n');
    const thinking=role==='assistant'?[visibleThinkingFrom(entry),stepText].filter(Boolean).join('\n\n'):'';
    if (text||thinking) out.push(thinking?{role,text,thinking}:{role,text});
  }
  if (!out.length && Array.isArray(data.steps)) {
    const text=asText(data.answer||data.response||data.text||''), thinking=data.steps.map(s=>asText(s?.summary||s?.text||s?.content||s)).filter(Boolean).join('\n\n');
    if (text||thinking) out.push(thinking?{role:'assistant',text,thinking}:{role:'assistant',text});
  }
  return out;
}
async function apiCapture() {
  try {
    if (HOST.id === 'chatgpt') {
      const id=chatgptId(); if (!id) return null;
      const r=await fetch('/backend-api/conversation/'+encodeURIComponent(id),{credentials:'include'}); if (!r.ok) return null;
      const raw=await r.json(), turns=parseChatGPTApi(raw); return {source:turns.length?'platform archive':'platform archive (unparsed)',turns,raw};
    }
    if (HOST.id === 'perplexity') {
      const slug=perplexitySlug(); if (!slug) return null;
      const r=await fetch('/rest/thread/'+encodeURIComponent(slug),{credentials:'include'}); if (!r.ok) return null;
      const raw=await r.json(), turns=parsePerplexityApi(raw); return {source:turns.length?'platform archive':'platform archive (unparsed)',turns,raw};
    }
  } catch (error) { log('export-api-failed',{host:HOST.id,message:String(error?.message||error)}); }
  return null;
}
async function captureExport() {
  const api=await apiCapture();
  if (api?.turns?.length) return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:api.source,partial:false,turns:api.turns,...(exportRaw?{raw:api.raw}:{})};
  const dom=domTurns();
  if (api) return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:'visible page fallback',partial:true,note:'Ghost could read the platform archive but could not safely map its current shape. Visible chat was exported instead.',turns:dom,...(exportRaw?{raw:api.raw}:{})};
  return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:'visible page fallback',partial:true,note:'This export uses what is currently visible on the page and may omit older unloaded turns.',turns:dom};
}
function markdown(cap) {
  const lines=['# Ghost conversation export','', '- Platform: '+cap.platform, '- Captured: '+cap.capturedAt, '- Source: '+cap.source+(cap.partial?' (may be incomplete)':''), ''];
  if (cap.note) lines.push('> '+cap.note,'');
  cap.turns.forEach((turn,i)=>{ lines.push('## '+(i+1)+'. '+(turn.role==='user'?'User':'Assistant'),'',turn.text||''); if(turn.thinking) lines.push('','### Platform-visible reasoning','',turn.thinking); lines.push(''); });
  return lines.join('\n');
}
function download(name,text,type) {
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name;
  document.documentElement.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function exportStatus(cap,action) { return action+' · '+cap.turns.length+' turns · '+(cap.partial?'may be incomplete':'full platform history'); }
async function doExport(kind) {
  S.detail='Reading conversation…'; render(); const cap=await captureExport();
  if (!cap.turns.length && !cap.raw) { S.detail='No conversation data was available to export.'; render(); return; }
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  if (kind==='copy') { const text=markdown(cap); try { GM_setClipboard(text,'text'); } catch (_) { await navigator.clipboard?.writeText(text); } S.detail=exportStatus(cap,'Copied Markdown'); }
  else if (kind==='md') { download('ghost-'+HOST.id+'-'+stamp+'.md',markdown(cap),'text/markdown;charset=utf-8'); S.detail=exportStatus(cap,'Markdown saved'); }
  else { download('ghost-'+HOST.id+'-'+stamp+'.json',JSON.stringify(cap,null,2),'application/json;charset=utf-8'); S.detail=exportStatus(cap,'JSON saved'); }
  render();
}

function report() {
  return {
    product: 'Ghost in the Loop', version: VER, platform: HOST.id, state: S.mode, round: S.round, maxRounds: S.max,
    sending: S.sending, uncertain: S.uncertain, driftCount: S.drift,
    watchdog: { state: S.stallState, stopAttempts: S.stopAttempts, recoveryCount: S.recoveryCount, lastProgressAt: S.lastProgressAt || null },
    progress: { round: S.round, maxRounds: S.max, workflow: allWorkflows()[workflowId]?.label || 'Manual', stage: S.stageProgress, soundOn, notifyOn },
    capabilities: { input: !!composer(), send: !!localSendButton(), stop: generating(), assistant: !!assistantText(), top: S.mode !== 'RUNNING' && !S.topBusy },
    lastError: S.lastError, relayRequested: S.relay || null, events: S.events.slice(-20), when: new Date().toISOString()
  };
}
function copyReport() {
  const text = JSON.stringify(report(), null, 2);
  try { GM_setClipboard(text, 'text'); } catch (_) { navigator.clipboard?.writeText(text); }
  S.detail = 'Diagnostic report copied.'; render();
}

const style = document.createElement('style');
style.textContent = `#gitl9{position:fixed;z-index:2147483646;top:70px;right:8px;width:min(270px,calc(100vw - 16px));background:var(--g-bg);color:var(--g-text);border:1px solid var(--g-border);border-radius:var(--g-radius);box-shadow:var(--g-shadow);font:12px/1.35 system-ui,sans-serif;padding:8px}#gitl9 *{box-sizing:border-box}#gitl9 .head{display:flex;align-items:center;justify-content:space-between;gap:6px}#gitl9 .brand{font-weight:750}#gitl9 .meta{font-size:10px;opacity:.65}#gitl9 .tabs{display:flex;gap:4px;margin:7px 0}#gitl9 button{border:1px solid #494550;background:var(--g-surface);color:var(--g-text);border-radius:8px;padding:7px 6px;font:inherit}#gitl9 button.on{background:var(--g-accent-bg);border-color:var(--g-accent);color:var(--g-text)}#gitl9 button.stop{background:#46191d;border-color:#85333a}#gitl9 button:disabled{opacity:.45;cursor:not-allowed}#gitl9 .tabs button{flex:1;padding:5px 3px}#gitl9 .status{background:var(--g-panel);border-radius:8px;padding:7px;min-height:42px;margin:5px 0 7px;word-break:break-word}#gitl9 .row{display:flex;gap:5px}#gitl9 .row>*{flex:1;min-width:0}#gitl9 .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}#gitl9 label{display:flex;align-items:center;gap:5px;padding:5px;border:1px solid #35323a;border-radius:7px;background:var(--g-surface)}#gitl9 input[type="text"],#gitl9 input[type="number"],#gitl9 select,#gitl9 textarea{width:100%;background:var(--g-panel);color:var(--g-text);border:1px solid var(--g-border);border-radius:7px;padding:6px}#gitl9 .pane{display:none}#gitl9 .pane.show{display:block}#gitl9 .tiny{font-size:10px;color:var(--g-muted);margin-top:5px}.helpbox{background:var(--g-panel);border:1px solid var(--g-border);border-radius:9px;padding:7px;margin:5px 0}.helpbox b{color:var(--g-accent)}.swatches{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}.swatches button{flex:0 0 28px;height:28px;padding:0}.headtools{display:flex;align-items:center;gap:5px}.helpbtn{padding:3px 6px!important;font-size:10px!important}.progline{height:4px;background:var(--g-surface);border-radius:99px;overflow:hidden;margin-top:5px}.progline span{display:block;height:100%;background:var(--g-accent);transition:width .15s ease}@media(max-width:520px){#gitl9{top:58px;width:min(238px,calc(100vw - 12px));right:6px;padding:7px}#gitl9 .tabs{display:grid;grid-template-columns:repeat(3,1fr)}#gitl9 .tabs button{min-height:38px}#gitl9 .transport{display:grid;grid-template-columns:1fr 1fr}#gitl9 .transport button,#gitl9 .helpbox button{min-height:40px}#gitl9 button{padding:7px 5px}}`;
document.documentElement.appendChild(style);
const panel = document.createElement('div'); panel.id = 'gitl9'; (document.body || document.documentElement).appendChild(panel);
function applyAppearance() {
  const skin = SKINS[skinId] || SKINS.classic;
  const accent = ACCENTS[accentId] || skin.accent;
  panel.style.setProperty('--g-bg', skin.bg);
  panel.style.setProperty('--g-surface', skin.surface);
  panel.style.setProperty('--g-panel', skin.panel);
  panel.style.setProperty('--g-border', skin.border);
  panel.style.setProperty('--g-text', skin.text);
  panel.style.setProperty('--g-muted', skin.muted);
  panel.style.setProperty('--g-accent', accent);
  panel.style.setProperty('--g-accent-bg', accentId === 'auto' ? skin.accentBg : 'color-mix(in srgb, ' + accent + ' 28%, ' + skin.panel + ')');
  panel.style.setProperty('--g-radius', skin.radius);
  panel.style.setProperty('--g-shadow', skin.shadow);
}
applyAppearance();
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render() {
  const prog = progressSummary();
  panel.innerHTML = trustedHTML(`
    <div class="head"><span class="brand">👻 GHOST</span><span class="headtools"><button class="helpbtn" data-a="help">? Help</button><span class="meta">${esc(HOST.id)} · ${VER}</span></span></div>
    <div class="tabs"><button data-tab="play" class="${S.tab==='play'?'on':''}">Play</button><button data-tab="prompt" class="${S.tab==='prompt'?'on':''}">Prompt</button><button data-tab="aoa" class="${S.tab==='aoa'?'on':''}">AoA</button><button data-tab="export" class="${S.tab==='export'?'on':''}">Export</button><button data-tab="settings" class="${S.tab==='settings'?'on':''}">Settings</button></div>
    <div class="status"><b>${esc(S.mode)}</b> · round ${S.round}/${S.max}<br>${esc(S.detail)}<div class="progline"><span style="width:${prog.roundPct}%"></span></div><div class="tiny">${prog.stages ? "Workflow: "+esc(prog.workflow)+" · "+(prog.stage ? "stage "+prog.stage.step+"/"+prog.stage.total : prog.stages+" stages · waiting for explicit stage") : "Manual workflow"}</div></div>
    <div class="pane ${S.tab==='play'?'show':''}" data-pane="play">
      ${quickStartOpen ? '<div class="helpbox"><b>Quick Start</b><br>1. Type your task in the chat.<br>2. Press ▶ Play.<br>3. Ghost continues only through the one-Send Play pathway.<br><button data-a="quick-done" style="margin-top:6px">Got it</button></div>' : ''}
      ${helpOpen ? '<div class="helpbox"><b>What the controls do</b><br><b>Play</b> starts/resumes Ghost. <b>Stop</b> stops Ghost automation. <b>Page</b> reloads the host page. <b>Top</b> finds the first loaded prompt and loads older history when possible. <b>AoA</b> chooses external protocols. <b>Export</b> saves the conversation. <b>Settings</b> changes appearance only.</div>' : ''}
      <div class="row transport"><button class="on" data-a="play">▶ Play</button><button class="stop" data-a="stop">■ Stop</button><button data-a="reload">↻ Page</button><button data-a="top" ${S.mode==='RUNNING'||S.sending||S.watchdogBusy||S.topBusy?'disabled':''}>↑ Top</button></div>
      <div class="row" style="margin-top:5px"><input data-max type="number" min="1" max="100" value="${S.max}"><button data-a="report">Copy report</button></div>
      <div class="tiny">Core only: final control line → one Send → repeat. Stall watchdog interrupts only after 5 min quiet + 2 min grace.</div>
    </div>
    <div class="pane ${S.tab==='prompt'?'show':''}" data-pane="prompt">
      <label style="display:block"><span class="tiny">Persona</span><select data-persona style="width:100%;margin-top:3px">${Object.entries(allPersonas()).map(([id,p])=>'<option value="'+esc(id)+'" '+(personaId===id?'selected':'')+'>'+esc(p.label)+(p.custom?' · custom':'')+'</option>').join('')}</select></label>
      <label style="display:block;margin-top:5px"><span class="tiny">Workflow</span><select data-workflow style="width:100%;margin-top:3px">${Object.entries(allWorkflows()).map(([id,w])=>'<option value="'+esc(id)+'" '+(workflowId===id?'selected':'')+'>'+esc(w.label)+(w.custom?' · custom':'')+'</option>').join('')}</select></label>
      <label style="display:block;margin-top:5px"><span class="tiny">Posture</span><select data-posture style="width:100%;margin-top:3px">${Object.entries(POSTURES).map(([id,p])=>'<option value="'+id+'" '+(postureId===id?'selected':'')+'>'+esc(p.label)+'</option>').join('')}</select></label>
      <div class="tiny">${esc(allWorkflows()[workflowId]?.desc||'')} These settings change prompt guidance only; Play remains the sole Send authority.</div>
      <button data-a="workshop" style="width:100%;margin-top:6px">Workshop ${workshopOpen?'▴':'▾'}</button>
      ${workshopOpen?'<div class="helpbox"><b>Custom personas/workflows</b><br>Paste a Ghost Workshop JSON bundle. Imports are additive; built-ins cannot be replaced.<textarea data-workshop-text rows="5" placeholder="{ &quot;schema&quot;: &quot;gitl-workshop/1&quot;, ... }" style="width:100%;margin-top:6px"></textarea><div class="row" style="margin-top:5px"><button data-a="workshop-import">Import</button><button data-a="workshop-copy">Copy custom JSON</button></div></div>':''}
    </div>
    <div class="pane ${S.tab==='aoa'?'show':''}" data-pane="aoa">
      <div class="grid">${Object.entries(ACT).map(([k,v])=>`<label><input type="checkbox" data-act="${k}" ${ON[k]?'checked':''}>${esc(v[0])}</label>`).join('')}</div>
      <div class="tiny">Optional protocols stay external. Ghost points the AI to their canonical source; Play transport does not change.</div>
      <input data-custom type="text" placeholder="AoA path, e.g. personas/compass.md" value="${esc(custom)}" style="margin-top:6px">
    </div>
    <div class="pane ${S.tab==='export'?'show':''}" data-pane="export">
      <div class="row"><button data-a="copy">Copy MD</button><button data-a="md">Save MD</button><button data-a="json">Save JSON</button></div>
      <label style="margin-top:6px"><input type="checkbox" data-export-raw ${exportRaw?'checked':''}>Include raw platform JSON in saved JSON</label>
      <div class="tiny">Ghost uses the platform archive first when supported. Visible-page fallback is clearly marked as possibly incomplete. Platform-visible reasoning is included when exposed.</div>
    </div>
    <div class="pane ${S.tab==='settings'?'show':''}" data-pane="settings">
      <div class="row"><label style="display:block"><span class="tiny">Skin</span><select data-skin style="width:100%;margin-top:3px">${Object.entries(SKINS).map(([id,s])=>'<option value="'+id+'" '+(skinId===id?'selected':'')+'>'+esc(s.name)+'</option>').join('')}</select></label></div>
      <div class="tiny">Accent</div>
      <div class="swatches">${Object.entries(ACCENTS).map(([id,color])=>'<button data-accent="'+id+'" class="'+(accentId===id?'on':'')+'" title="'+id+'" style="'+(color?'background:'+color:'')+'">'+(id==='auto'?'A':'')+'</button>').join('')}</div>
      <div class="row" style="margin-top:6px"><button data-a="show-quick">Show Quick Start</button><button data-a="reset-look">Reset look</button></div>
      <label style="margin-top:6px"><input type="checkbox" data-sound ${soundOn?'checked':''}>Sound cues</label>
      <label style="margin-top:5px"><input type="checkbox" data-notify ${notifyOn?'checked':''}>Notifications</label>
      <div class="row" style="margin-top:5px"><button data-a="test-sound">Test sound</button><button data-a="test-notify">Test notification</button></div>
      <div class="tiny">Feedback is optional and status-only. It never sends a prompt or changes the Ghost loop.</div>
    </div>`);
  panel.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { S.tab = btn.dataset.tab; GM_setValue('v9.tab', S.tab); render(); }));
  panel.querySelector('[data-a="play"]')?.addEventListener('click', () => play().catch(e => fail('PLAY', String(e?.message || e))));
  panel.querySelector('[data-a="stop"]')?.addEventListener('click', stop);
  panel.querySelector('[data-a="reload"]')?.addEventListener('click', () => location.reload());
  panel.querySelector('[data-a="help"]')?.addEventListener('click', () => { helpOpen = !helpOpen; if (helpOpen) S.tab = 'play'; render(); });
  panel.querySelector('[data-a="quick-done"]')?.addEventListener('click', () => { quickStartOpen = false; GM_setValue('v9.quickStartSeen', true); S.detail = 'Quick Start hidden. You can reopen it in Settings.'; render(); });
  panel.querySelector('[data-a="show-quick"]')?.addEventListener('click', () => { quickStartOpen = true; helpOpen = false; S.tab = 'play'; render(); });
  panel.querySelector('[data-a="reset-look"]')?.addEventListener('click', () => { skinId = 'classic'; accentId = 'auto'; GM_setValue('v9.skin', skinId); GM_setValue('v9.accent', accentId); applyAppearance(); S.detail = 'Appearance reset.'; render(); });
  panel.querySelector('[data-sound]')?.addEventListener('change', e => { soundOn = !!e.target.checked; GM_setValue('v9.soundOn', soundOn); S.detail = soundOn ? 'Sound cues enabled.' : 'Sound cues off.'; render(); });
  panel.querySelector('[data-notify]')?.addEventListener('change', e => { notifyOn = !!e.target.checked; GM_setValue('v9.notifyOn', notifyOn); S.detail = notifyOn ? 'Notifications enabled.' : 'Notifications off.'; render(); });
  panel.querySelector('[data-a="test-sound"]')?.addEventListener('click', () => { const prior=soundOn; soundOn=true; const ok=playCue('complete'); soundOn=prior; S.detail = ok ? 'Sound test played.' : 'Sound test was blocked by this browser.'; render(); });
  panel.querySelector('[data-a="test-notify"]')?.addEventListener('click', () => { if (!notifyOn) { S.detail='Turn Notifications on first.'; render(); return; } const ok=notify('Ghost notification test','Notifications are working.','notice'); S.detail = ok ? 'Notification sent.' : 'Notification unavailable in this runtime.'; render(); });
  panel.querySelector('[data-skin]')?.addEventListener('change', e => { skinId = SKINS[e.target.value] ? e.target.value : 'classic'; GM_setValue('v9.skin', skinId); applyAppearance(); S.detail = SKINS[skinId].name + ' skin applied.'; render(); });
  panel.querySelectorAll('[data-accent]').forEach(btn => btn.addEventListener('click', () => { accentId = btn.dataset.accent in ACCENTS ? btn.dataset.accent : 'auto'; GM_setValue('v9.accent', accentId); applyAppearance(); S.detail = 'Accent updated.'; render(); }));
  const topButton = panel.querySelector('[data-a="top"]');
  topButton?.addEventListener('pointerdown', e => e.preventDefault());
  topButton?.addEventListener('click', () => goTop().catch(error => { S.detail = 'Could not reach the top safely.'; log('top-navigation-error', { message: String(error?.message || error) }); render(); }));
  panel.querySelector('[data-a="report"]')?.addEventListener('click', copyReport);
  panel.querySelector('[data-persona]')?.addEventListener('change', e => { personaId = allPersonas()[e.target.value] ? e.target.value : 'none'; GM_setValue('v9.persona', personaId); S.detail = 'Persona saved for future Ghost prompts.'; render(); });
  panel.querySelector('[data-workflow]')?.addEventListener('change', e => { workflowId = allWorkflows()[e.target.value] ? e.target.value : 'none'; GM_setValue('v9.workflow', workflowId); S.detail = 'Workflow guidance saved.'; render(); });
  panel.querySelector('[data-posture]')?.addEventListener('change', e => { postureId = POSTURES[e.target.value] ? e.target.value : 'standard'; GM_setValue('v9.posture', postureId); S.detail = 'Posture saved.'; render(); });
  panel.querySelector('[data-a="workshop"]')?.addEventListener('click', () => { workshopOpen = !workshopOpen; render(); });
  panel.querySelector('[data-a="workshop-import"]')?.addEventListener('click', () => {
    const raw = String(panel.querySelector('[data-workshop-text]')?.value || '');
    const res = Workshop.importBundle(raw);
    if (!res.ok) { S.detail = res.error; render(); return; }
    S.detail = 'Imported '+res.personas+' personas and '+res.workflows+' workflows'+(res.skipped?' · '+res.skipped+' skipped':'')+'.';
    render();
  });
  panel.querySelector('[data-a="workshop-copy"]')?.addEventListener('click', async () => {
    const text = Workshop.exportBundle(); try { GM_setClipboard(text,'text'); } catch (_) { await navigator.clipboard?.writeText(text); }
    S.detail = 'Custom Workshop JSON copied.'; render();
  });
  panel.querySelector('[data-a="copy"]')?.addEventListener('click', () => doExport('copy'));
  panel.querySelector('[data-a="md"]')?.addEventListener('click', () => doExport('md'));
  panel.querySelector('[data-a="json"]')?.addEventListener('click', () => doExport('json'));
  panel.querySelector('[data-export-raw]')?.addEventListener('change', e => { exportRaw = !!e.target.checked; GM_setValue('v9.exportRaw', exportRaw); S.detail = exportRaw ? 'Raw platform JSON will be included in saved JSON.' : 'Raw platform JSON is off.'; render(); });
  panel.querySelector('[data-max]')?.addEventListener('change', e => { S.max = Math.max(1, Math.min(100, Number(e.target.value) || 25)); GM_setValue('v9.max', S.max); render(); });
  panel.querySelectorAll('[data-act]').forEach(box => box.addEventListener('change', () => { ON[box.dataset.act] = box.checked; GM_setValue(`v9.act.${box.dataset.act}`, box.checked); S.detail = `${ACT[box.dataset.act][0]} ${box.checked?'enabled':'disabled'} for the next injected prompt.`; render(); }));
  panel.querySelector('[data-custom]')?.addEventListener('change', e => { custom = String(e.target.value || '').trim(); GM_setValue('v9.custom', custom); S.detail = custom ? 'Custom AoA path saved.' : 'Custom AoA path cleared.'; render(); });
}

render();
window.__GITL_V9__ = true;
try { delete window.__GITL_V9_BOOTING__; } catch (_) { window.__GITL_V9_BOOTING__ = 0; }
log('boot', { version: VER, host: HOST.id });
})();
