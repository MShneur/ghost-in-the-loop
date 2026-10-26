/* GENERATED FILE — edit ghost-in-the-loop.user.js, then run npm run build.
   Firefox MV3 wrapper: GM_* compatibility over browser.storage.local. */
const _store = typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
const _cache = {};
async function _initStore() {
  try { const d = await _store.get(null); Object.assign(_cache, d); } catch(_){}
}
function GM_getValue(k, d) { return _cache[k] !== undefined ? _cache[k] : d; }
function GM_setValue(k, v) { _cache[k] = v; _store.set({ [k]: v }).catch(()=>{}); }
function GM_addStyle(css) {
  const s = document.createElement('style');
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}
function GM_setClipboard(text) {
  try { navigator.clipboard.writeText(text); } catch(_){}
}
function GM_notification(detail) {
  try {
    if (Notification.permission === 'granted') new Notification('Ghost in the Loop', { body: typeof detail === 'string' ? detail : detail?.text || '' });
    else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') GM_notification(detail); });
  } catch(_){}
}
_initStore().then(() => {

(() => {
'use strict';
if (window.__GITL_V9__ === true) return;
if (window.__GITL_V9_BOOTING__ && Date.now() - window.__GITL_V9_BOOTING__ < 15000) return;
window.__GITL_V9_BOOTING__ = Date.now();

const VER = '9.0.17';
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
  classic:{ name:'Classic', bg:'#121922', surface:'#1d2937', panel:'#0c131d', border:'#33465c', text:'#ecf4ff', muted:'#9aacc2', accent:'#8ab4ff', accentBg:'#193756', radius:'12px', shadow:'0 12px 34px rgba(3,9,20,.60)' },
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
let quickStartOpen = false; // Discoverable through Setup > Extras; not a persistent first-run obstruction.
let helpOpen = false;
let panelCollapsed = !!GM_getValue('v9.panelCollapsed', false);
let mobileMoreOpen=false;
let statusExpanded=false;
const uiAccordionStates=new Map();
let lastPanelMarkup=null;
let liveStatusNodes=null;
let personaId = String(GM_getValue('v9.persona','none')||'none');
let workflowId = String(GM_getValue('v9.workflow','none')||'none');
let postureId = String(GM_getValue('v9.posture','standard')||'standard');
let workshopOpen = false;
let soundOn = !!GM_getValue('v9.soundOn', GM_getValue('soundOn', false));
let notifyOn = !!GM_getValue('v9.notifyOn', GM_getValue('notifyOn', false));
function getJsonValue(key, fallback) {
  try { const raw=GM_getValue(key,''); if(!raw) return fallback; const v=JSON.parse(raw); return v ?? fallback; } catch(_) { return fallback; }
}
let runMode = String(GM_getValue('v9.runMode','loop') || 'loop');
if(!['loop','plan','roadmap'].includes(runMode)) runMode='loop';
let queueDraft = getJsonValue('v9.queueDraft',['']);
if(!Array.isArray(queueDraft) || !queueDraft.length) queueDraft=[''];
queueDraft = queueDraft.slice(0,30).map(x=>String(x||'').slice(0,4000));
let queueRun = { active:false, items:[], index:0 };
let roadmapRun = { capture:false, active:false, steps:[], index:0 };
let flowRun = { active:false, index:0, pending:false };
let flowPauseBetween = !!GM_getValue('v9.flowPauseBetween', false);
let personaIds = getJsonValue('v9.personaIds',[personaId]);
if(!Array.isArray(personaIds)) personaIds=[personaId];
personaIds = personaIds.filter(id=>allPersonas()[id] && id!=='none').slice(0,8);
let committeeOn = !!GM_getValue('v9.committeeOn', false);
let committeePerTask = !!GM_getValue('v9.committeePerTask', true);
let committeeFinalReview = !!GM_getValue('v9.committeeFinalReview', false);
let placement = String(GM_getValue('v9.placement', GM_getValue('panelPosition','dock') || 'dock') || 'dock');
const placementMap = {dock:'dock-right','dock-left':'dock-left','top-right':'float','top-left':'float','bot-right':'float','bot-left':'float','bottom-bar':'composer-row'};
placement = placementMap[placement] || placement;
if(!['dock-right','dock-left','float','composer-row','header-row'].includes(placement)) placement='dock-right';
let floatPos = getJsonValue('v9.floatPos',{x:null,y:58});
if(!floatPos || typeof floatPos!=='object') floatPos={x:null,y:58};
let advancedOpen = !!GM_getValue('v9.advancedOpen', false);
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
function nodeText(el) { if (!el) return ''; if (typeof el.value === 'string' && /^(TEXTAREA|INPUT)$/.test(el.tagName || '')) return displayText(el.value); return displayText(el.innerText ?? el.textContent ?? ''); }
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
function activePersonaText(repeat = false) {
  const all=allPersonas();
  if (committeeOn) {
    if (repeat && !committeePerTask) return '';
    const ids=personaIds.filter(id=>all[id] && id!=='none').slice(0,8);
    if (!ids.length) return '';
    const rows=ids.map(id=>'• '+all[id].label+': '+all[id].inject).join('\n');
    let out='Operate as a committee of '+ids.length+' distinct perspectives. Give each perspective an independent assessment when relevant, preserve real disagreement, then synthesize.\n\n'+rows;
    if (committeeFinalReview) out+='\n\nBefore the task reaches its final HALT, perform one bounded committee review for material gaps and correct them before finishing.';
    return out;
  }
  const persona=all[personaId];
  return persona?.inject || '';
}
function strategyText() {
  if (runMode === 'plan') {
    return '[Strategy: PLAN FIRST]\nYou own the plan. First make or maintain a concise plan for this task, then execute it step by step. Ghost will not interpret that plan; it only relays exact prompts and terminal markers. Keep planning inside your responses and use the normal Ghost terminal marker.';
  }
  return '';
}
function promptFeatureText(options = {}) {
  const includePersona = options.includePersona !== false;
  const repeatPersona = !!options.repeatPersona;
  const includeWorkflow = options.includeWorkflow !== false;
  const parts=[];
  const persona=includePersona ? activePersonaText(repeatPersona) : '';
  if(persona) parts.push('[Active persona'+(committeeOn?' committee':'')+']\n'+persona);
  const workflow=allWorkflows()[workflowId];
  if(includeWorkflow && workflow?.stages?.length && !flowRun.active) {
    parts.push('[Workflow reference: '+workflow.label+']\nThe AI owns workflow reasoning. Treat these as optional prompt guidance only; Ghost does not infer stages from prose:\n'+workflow.stages.map((s,i)=>(i+1)+'. '+s).join('\n'));
  }
  const posture=POSTURES[postureId]||POSTURES.standard;
  if(posture?.clause) parts.push(posture.clause);
  const strategy=strategyText(); if(strategy) parts.push(strategy);
  return parts.join('\n\n');
}
function withPromptFeatures(base, options = {}) {
  const features=promptFeatureText(options);
  return features ? base+'\n\n---\n\n'+features : base;
}
function bootstrapPrompt(existing = '') {
  const parts = [];
  if (existing.trim()) parts.push(existing.trim());
  parts.push(contractText());
  const activators = activatorText(); if (activators) parts.push(activators);
  const features = promptFeatureText({repeatPersona:false}); if (features) parts.push(features);
  return parts.join('\n\n---\n\n');
}
function continuationPrompt() {
  const base = ON.relay
    ? 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Model Relay control line as the final non-whitespace line.'
    : 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Ghost control line as the final non-whitespace line.';
  return withPromptFeatures(base,{repeatPersona:true});
}
function roadmapBootstrapPrompt(existing = '') {
  const parts=[];
  if(existing.trim()) parts.push(existing.trim());
  parts.push('[GHOST ROADMAP AUTOPILOT]\nDo not execute the task yet. You own all planning intelligence. Produce a concrete roadmap of 3–30 self-contained executable steps using EXACTLY this structure:\n\n[[GITL::ROADMAP]]\n1. first step\n2. second step\n3. third step\n\nAfter the final numbered step, end the response with exactly [[GITL::PROCEED]] as the final non-whitespace line. Do not place any other Ghost control marker in the response.');
  parts.push(contractText());
  const activators=activatorText(); if(activators) parts.push(activators);
  const features=promptFeatureText({includeWorkflow:false,repeatPersona:false}); if(features) parts.push(features);
  return parts.join('\n\n---\n\n');
}
function parseRoadmapBlock(text) {
  const source=String(text||'');
  const marker='[[GITL::ROADMAP]]';
  const at=source.lastIndexOf(marker);
  if(at<0) return [];
  const after=source.slice(at+marker.length).split(/\[\[(?:GITL|AOA)::/)[0].trim();
  const steps=[];
  for(const line of after.split(/\r?\n/)) {
    const m=line.trim().match(/^(\d{1,2})[.)]\s+(.{3,4000})$/);
    if(!m) continue;
    const n=Number(m[1]); if(n!==steps.length+1) return [];
    steps.push(m[2].trim()); if(steps.length>=30) break;
  }
  if(steps.length>=2) return steps;
  const flat=[]; const re=/(?:^|\s)(\d{1,2})[.)]\s+(.+?)(?=\s+\d{1,2}[.)]\s+|$)/g;
  let m;
  while((m=re.exec(after)) && flat.length<30){
    const n=Number(m[1]); if(n!==flat.length+1) return [];
    const body=m[2].trim(); if(body.length<3||body.length>4000) return [];
    flat.push(body);
  }
  return flat.length>=2 ? flat : [];
}
function mechanicalStepPrompt(kind, step, total, text, last = false, initialContext = '') {
  const terminal = last ? G.halt : G.proceed;
  const parts=[];
  if(initialContext.trim()) parts.push('[Original task / context]\n'+initialContext.trim());
  parts.push('[Ghost '+kind+' — step '+step+' of '+total+']\n'+text+
    '\n\nComplete ONLY this injected step, using the existing conversation as context. Do not invent or advance to a different Ghost step. When this step is complete, the FINAL non-whitespace line must be exactly '+terminal+'.');
  parts.push(contractText());
  if(initialContext.trim()) { const activators=activatorText(); if(activators) parts.push(activators); }
  return withPromptFeatures(parts.join('\n\n---\n\n'),{includeWorkflow:false,repeatPersona:!initialContext.trim()});
}
function regroundPrompt() {
  return withPromptFeatures(`You strayed from the active control protocol. Re-read the existing conversation, reground in the current task, and continue without restarting or repeating completed work. Do not explain the protocol error. Your response must end with exactly one valid bare terminal control line as the final non-whitespace line.\n\n${contractText()}`,{repeatPersona:true});
}
function cleanerzPrompt() {
  return withPromptFeatures(`Protocol compliance drifted twice. Activate Agents-of-AI Cleanerz from its canonical source, use it to reground the existing task and active protocols, then continue without restarting completed work. Canonical source: ${ACT.cleanerz[1]}\n\n${contractText()}`,{repeatPersona:true});
}
function stallRecoveryPrompt() {
  return withPromptFeatures(`You were interrupted because the previous step showed no visible progress for an extended period.\n\nReground from the conversation and the last confirmed completed step. Do not restart the whole task.\n\n1. Identify the exact subtask that was in progress when you stalled.\n2. Preserve all confirmed work already completed.\n3. Reduce only the stalled subtask into the smallest safe next unit(s).\n4. Execute just the first unit now.\n5. If that unit is still too large, split it once more before executing.\n6. Do not repeat completed research, rebuild the whole plan, or expand scope.\n7. End with the normal Ghost terminal marker.\n\n${contractText()}`,{repeatPersona:true});
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


function armTickLoop() {
  clearInterval(S.timer);
  S.timer = setInterval(() => { tick().catch(error => fail('PLAY-TICK', String(error?.message || error))); }, TICK_MS);
}
function enterRunning(detail = 'Starting...') {
  S.mode = 'RUNNING'; S.detail = detail; S.lastHandled = ''; S.stableHash = ''; S.stableSince = 0;
  S.drift = 0; S.relay = ''; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog(); render();
}
function clearMechanicalRuns() {
  queueRun.active=false;
  roadmapRun.capture=false; roadmapRun.active=false;
  flowRun.active=false;
}
function activeMechanicalRun() {
  if(queueRun.active) return 'queue';
  if(roadmapRun.capture || roadmapRun.active) return 'roadmap';
  if(flowRun.active) return 'flow';
  return '';
}
async function startQueueRun() {
  if (S.mode === 'RUNNING' || S.sending || S.uncertain) return false;
  const items=queueDraft.map(x=>String(x||'').trim()).filter(Boolean).slice(0,30);
  if(!items.length){ S.detail='Add at least one queue step first.'; S.tab='auto'; render(); return false; }
  const input=composer(); if(!input){ fail('PLAY-INPUT','Current chat composer was not found.',{host:HOST.id}); return false; }
  const context=nodeText(input);
  clearMechanicalRuns();
  queueRun={active:true,items,index:0};
  enterRunning('Starting prompt queue…');
  const sent=await sendOnce(mechanicalStepPrompt('queue',1,items.length,items[0],items.length===1,context),'queue step 1');
  if(!sent) return false;
  armTickLoop(); await tick(); return true;
}
async function startRoadmapRun() {
  if (S.mode === 'RUNNING' || S.sending || S.uncertain) return false;
  const input=composer(); if(!input){ fail('PLAY-INPUT','Current chat composer was not found.',{host:HOST.id}); return false; }
  const draft=nodeText(input);
  const latest=assistantText();
  if(!draft.trim() && !latest){ S.detail='Type the task in the chat first, then start Roadmap.'; S.tab='run'; render(); return false; }
  const context=draft.trim() || 'Continue the existing task from this conversation without restarting or repeating completed work.';
  clearMechanicalRuns();
  roadmapRun={capture:true,active:false,steps:[],index:0};
  enterRunning('Asking the AI to write the roadmap…');
  const sent=await sendOnce(roadmapBootstrapPrompt(context),'roadmap plan');
  if(!sent) return false;
  armTickLoop(); await tick(); return true;
}
async function startFlowRun() {
  if (S.mode === 'RUNNING' || S.sending || S.uncertain) return false;
  const wf=allWorkflows()[workflowId];
  if(!wf?.stages?.length){ S.detail='Choose a workflow with stages first.'; S.tab='flow'; render(); return false; }
  const input=composer(); if(!input){ fail('PLAY-INPUT','Current chat composer was not found.',{host:HOST.id}); return false; }
  const context=nodeText(input);
  clearMechanicalRuns();
  flowRun={active:true,index:0,pending:false};
  enterRunning('Starting '+wf.label+'…');
  const sent=await sendOnce(mechanicalStepPrompt(wf.label,1,wf.stages.length,wf.stages[0],wf.stages.length===1,context),'workflow stage 1');
  if(!sent) return false;
  armTickLoop(); await tick(); return true;
}
async function resumeMechanicalRun() {
  if(!activeMechanicalRun() || S.mode==='RUNNING' || S.sending || S.uncertain) return false;
  S.mode='RUNNING'; S.detail='Resuming…'; S.lastHandled=''; S.stableHash=''; S.stableSince=0; render();
  if(flowRun.active && flowRun.pending){
    const wf=allWorkflows()[workflowId];
    const i=flowRun.index;
    flowRun.pending=false;
    const sent=await sendOnce(mechanicalStepPrompt(wf.label,i+1,wf.stages.length,wf.stages[i],i===wf.stages.length-1),'workflow stage '+(i+1));
    if(!sent) return false;
    armTickLoop(); await tick(); return true;
  }
  armTickLoop();
  await tick();
  return true;
}
async function advanceQueueRun() {
  if(!queueRun.active) return false;
  const next=queueRun.index+1;
  if(next>=queueRun.items.length){
    queueRun.active=false; complete('Prompt queue complete'); notify('Ghost complete','Prompt queue finished.','complete'); return true;
  }
  queueRun.index=next;
  return await sendOnce(mechanicalStepPrompt('queue',next+1,queueRun.items.length,queueRun.items[next],next===queueRun.items.length-1),'queue step '+(next+1));
}
async function captureOrAdvanceRoadmap(text) {
  if(roadmapRun.capture){
    const steps=parseRoadmapBlock(text);
    if(!steps.length){
      roadmapRun.capture=false;
      pause('Roadmap format was missing or invalid. Nothing was guessed or auto-inferred.');
      return true;
    }
    roadmapRun.capture=false; roadmapRun.active=true; roadmapRun.steps=steps; roadmapRun.index=0;
    S.detail='Roadmap captured · '+steps.length+' steps'; render();
    return await sendOnce(mechanicalStepPrompt('roadmap',1,steps.length,steps[0],steps.length===1),'roadmap step 1');
  }
  if(!roadmapRun.active) return false;
  const next=roadmapRun.index+1;
  if(next>=roadmapRun.steps.length){
    roadmapRun.active=false; complete('Roadmap complete'); notify('Ghost complete','Roadmap finished.','complete'); return true;
  }
  roadmapRun.index=next;
  return await sendOnce(mechanicalStepPrompt('roadmap',next+1,roadmapRun.steps.length,roadmapRun.steps[next],next===roadmapRun.steps.length-1),'roadmap step '+(next+1));
}
async function advanceFlowRun() {
  if(!flowRun.active) return false;
  const wf=allWorkflows()[workflowId];
  if(!wf?.stages?.length){ flowRun.active=false; pause('Workflow is no longer available.'); return true; }
  const next=flowRun.index+1;
  if(next>=wf.stages.length){
    flowRun.active=false; complete(wf.label+' complete'); notify('Ghost complete',wf.label+' finished.','complete'); return true;
  }
  if(flowPauseBetween){
    flowRun.index=next; flowRun.pending=true;
    pause(wf.label+' stage '+next+' complete · press Play to continue to stage '+(next+1)+'.');
    return true;
  }
  flowRun.index=next;
  return await sendOnce(mechanicalStepPrompt(wf.label,next+1,wf.stages.length,wf.stages[next],next===wf.stages.length-1),'workflow stage '+(next+1));
}

async function handleTerminal(text, parsed) {
  const fp = hash(text);
  if (!text || fp === S.lastHandled || S.mode !== 'RUNNING' || S.sending) return;
  S.lastHandled = fp;
  if (parsed.normalized) log('terminal-normalized', { type: parsed.type });
  if (parsed.type === 'halt') {
    S.drift = 0; S.recoveryCount = 0;
    clearMechanicalRuns();
    complete('Task complete'); notify('Ghost complete', 'The AI returned HALT.', 'complete'); return;
  }
  if (parsed.type === 'human') {
    S.drift = 0; pause('Human decision requested by the AI.'); notify('Ghost paused', 'The AI requested a human decision.', 'human'); return;
  }
  if (parsed.type === 'relay') {
    S.drift = 0; S.relay = parsed.model; pause(`Model Relay requested: ${parsed.model}.`); notify('Model Relay requested', parsed.model, 'human'); return;
  }
  if (parsed.type === 'proceed') {
    S.drift = 0;
    if (S.round >= S.max) { pause('Round safety limit reached. Increase the limit or press Play after review to resume.'); return; }
    if (queueRun.active) { await advanceQueueRun(); return; }
    if (roadmapRun.capture || roadmapRun.active) { await captureOrAdvanceRoadmap(text); return; }
    if (flowRun.active) { await advanceFlowRun(); return; }
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
  if (activeMechanicalRun() && S.mode === 'PAUSED') { await resumeMechanicalRun(); return; }
  if (runMode === 'roadmap') { await startRoadmapRun(); return; }
  const input = composer();
  if (!input) { fail('PLAY-INPUT', 'Current chat composer was not found.', { host: HOST.id }); return; }
  if (S.mode === 'IDLE' || S.mode === 'COMPLETE') S.round = 0;
  clearMechanicalRuns();
  enterRunning('Starting...');
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
  armTickLoop();
  await tick();
}
function pause(detail) { S.mode = 'PAUSED'; S.detail = detail; clearInterval(S.timer); S.timer = null; render(); }
function stop() {
  S.mode = 'IDLE'; S.detail = 'Stopped'; S.round = 0; S.sending = false; S.uncertain = false; S.lastHandled = ''; S.awaitingFrom = ''; S.stableHash = ''; S.stableSince = 0; S.drift = 0; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog(); clearMechanicalRuns();
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
  if(HOST.id==='chatgpt'){
    const root=document.querySelector('[data-scroll-root]');
    if(root)return root;
  }
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
function codexThreadRoot() {
  if (HOST.id !== 'chatgpt' || !/^\/local\/[0-9a-z-]+(?:\/|$)/i.test(location.pathname)) return null;
  return document.querySelector('[data-thread-find-target="conversation"]');
}
function codexVisibleGroups(root, collected) {
  for (const el of root.querySelectorAll('[data-turn-key^="history-content:turn:"]')) {
    const key = el.getAttribute('data-turn-key');
    if (!key) continue;
    const user = el.querySelector('[data-user-message-bubble]');
    const assistant = [...el.querySelectorAll('[data-markdown-text-style="assistant-message"]')];
    const userText = user ? displayText(user.innerText || user.textContent || '') : '';
    const assistantText = assistant.map(node => displayText(node.innerText || node.textContent || '')).filter(Boolean).join('\n\n');
    const domText = displayText(el.innerText || el.textContent || '');
    const links = [...el.querySelectorAll('a[href]')].map(a => ({text:displayText(a.innerText || a.textContent || ''),href:a.getAttribute('href') || ''})).filter(x => x.href && !/^javascript:/i.test(x.href)).slice(0,200);
    const images = [...el.querySelectorAll('img')].map(img => ({alt:img.getAttribute('alt') || '',title:img.getAttribute('title') || ''})).filter(x => x.alt || x.title).slice(0,100);
    const rawDomHtml = exportRaw ? el.outerHTML.slice(0,1000000) : undefined;
    const item = {key, userText, assistantText, domText, links, images,
      ...(exportRaw ? {rawDomHtml, rawDomTruncated:el.outerHTML.length>1000000} : {})};
    if (!collected.has(key)) collected.set(key,item);
    else {
      const old = collected.get(key);
      // Prefer a later expanded/rendered version; never discard previously seen content.
      if (item.userText.length >= old.userText.length) old.userText = item.userText;
      if (item.assistantText.length >= old.assistantText.length) old.assistantText = item.assistantText;
      if (item.domText.length >= old.domText.length) old.domText = item.domText;
      if (item.links.length > old.links.length) old.links = item.links;
      if (item.images.length > old.images.length) old.images = item.images;
      if (exportRaw && (item.rawDomHtml?.length || 0) > (old.rawDomHtml?.length || 0)) {
        old.rawDomHtml=item.rawDomHtml;
        old.rawDomTruncated=item.rawDomTruncated;
      }
    }
  }
}
function codexScrollable(root) {
  for (let el=root.parentElement, n=0; el && n<15; el=el.parentElement,n++) {
    try {
      const style = getComputedStyle(el);
      if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
    } catch (_) {}
  }
  return null;
}
async function captureCodexExport() {
  const root=codexThreadRoot();
  if (!root) return null;
  const collected=new Map();
  const scroller=codexScrollable(root);
  const canTraverse=!!scroller && S.mode !== 'RUNNING' && !S.sending && !S.watchdogBusy;
  let traversed=false, reachedBottom=false, passes=0;
  if (!canTraverse) codexVisibleGroups(root,collected);
  else {
    const savedTop=scroller.scrollTop, savedLeft=scroller.scrollLeft;
    try {
      scroller.scrollTop=0;
      await sleep(120);
      for (let n=0;n<120;n++) {
        passes=n+1;
        codexVisibleGroups(root,collected);
        const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
        const current=scroller.scrollTop;
        if (current >= max-4) { reachedBottom=true; break; }
        const next=Math.min(max,current+Math.max(160,scroller.clientHeight*0.7));
        if (next <= current+1) break;
        scroller.scrollTop=next;
        traversed=true;
        await sleep(100);
      }
      codexVisibleGroups(root,collected);
    } finally {
      try { scroller.scrollTop=savedTop; scroller.scrollLeft=savedLeft; } catch (_) {}
    }
  }
  const turns=[];
  for (const entry of collected.values()) {
    const meta={turnKey:entry.key,groupHasUser:!!entry.userText,visibleDomText:entry.domText,links:entry.links,images:entry.images,
      ...(exportRaw?{rawDomHtml:entry.rawDomHtml,rawDomTruncated:entry.rawDomTruncated}:{})};
    if (entry.userText) turns.push({role:'user',text:entry.userText,metadata:meta});
    if (entry.assistantText) turns.push({role:'assistant',text:entry.assistantText,metadata:meta});
    if (!entry.userText && !entry.assistantText && entry.domText) turns.push({role:'activity',text:entry.domText,metadata:meta});
  }
  if (!turns.length) {
    const fallback=displayText(root.innerText || root.textContent || '');
    if (fallback) turns.push({role:'activity',text:fallback,metadata:{note:'Unrecognized Codex turn markup; raw rendered transcript text only.'}});
  }
  return {version:VER,platform:'codex',capturedAt:new Date().toISOString(),
    source:'Codex rendered conversation',partial:true,
    conversationId:location.pathname.split('/')[2] || '', title:document.title || '',
    note:'Codex DOM capture; virtualized, collapsed, or unloaded history may still be incomplete. Only data exposed to this page is available. Private memories and hidden reasoning are not accessible.',
    visibility:{renderedTurnGroups:collected.size,traversed,reachedBottom,passes,scrollTraversalAvailable:!!scroller},
    turns};
}
function captureDotExport() {
  // Dot uses the messaging UI, not the regular ChatGPT conversation DOM/API.
  if (HOST.id !== 'chatgpt' || !/^\/dots(?:\/|$)/.test(location.pathname)) return null;
  const root=document.querySelector('.messaging-root .message-list');
  if (!root) return null;
  const turns=[];
  for (const row of root.querySelectorAll('.message-row[data-message-id]')) {
    const message=row.querySelector('.message-text');
    if (!message) continue;
    const text=displayText(message.innerText || message.textContent || '');
    if (!text) continue;
    turns.push({role:row.classList.contains('self')?'user':'assistant',text});
  }
  if (!turns.length) return null;
  return {version:VER,platform:'chatgpt-dot',capturedAt:new Date().toISOString(),
    source:'Dot rendered conversation',partial:true,
    note:'Only the Dot messages currently rendered in the browser were saved. Older unloaded messages may be missing.',
    turns};
}
function domTurns() {
  const rows = [];
  if (HOST.id === 'chatgpt') {
    const oldRows=document.querySelectorAll('[data-message-author-role="user"],[data-message-author-role="assistant"]');
    const elements=oldRows.length?oldRows:document.querySelectorAll('section[data-turn="user"],section[data-turn="assistant"]');
    for (const el of elements) {
      const role = el.getAttribute('data-message-author-role') || el.getAttribute('data-turn'), text = displayText(el.innerText || el.textContent || '');
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
// Ghost Export Integrity v9.0.1-alpha.11: keep export read-only and fail closed.
function chatgptArchiveProof(data,count) {
  const map=data?.mapping, key=data?.current_node;
  if(!map || Array.isArray(map) || typeof map!=='object')return {verified:false,reason:'unsupported archive'};
  if(!key || !map[key])return {verified:false,reason:'missing current message'};
  let id=key, seen=new Set(), supported=0, unknown=0, assets=0;
  while(id){
    if(seen.has(id))return {verified:false,reason:'conversation branch cycle',nodes:seen.size};
    if(seen.size>=50000)return {verified:false,reason:'conversation history too large',nodes:seen.size};
    const node=map[id];if(!node)return {verified:false,reason:'missing parent message',nodes:seen.size};
    seen.add(id);
    const m=node.message, role=m?.author?.role;
    if(role==='user'||role==='assistant'){
      const value=asText(m?.content?.parts?.length?m.content.parts:m?.content)||asText(m?.metadata?.model_dil_v2?.fallbackMarkdown);
      const thinking=role==='assistant'?(visibleThinkingFrom(m?.content)||visibleThinkingFrom(m?.metadata)):'';
      if(value||thinking)supported++;else if(m?.content)unknown++;
      if(m?.metadata?.attachments?.length||m?.content?.parts?.some?.(v=>v&&typeof v==='object'&&/image|audio|video|file|asset|spatial/i.test(String(v.content_type||v.type||''))))assets++;
    }
    id=node.parent||null;
  }
  if(!supported||supported!==count)return {verified:false,reason:'message count mismatch',nodes:seen.size};
  if(unknown)return {verified:false,reason:'unreadable messages',nodes:seen.size,unreadable:unknown};
  if(assets)return {verified:false,reason:'files or media not captured',nodes:seen.size,assets};
  return {verified:true,reason:'connected conversation history',nodes:seen.size};
}
function parseChatGPTApi(data){
  if(!data?.mapping||typeof data.mapping!=='object')return [];
  const chain=[];
  if(data.current_node&&data.mapping[data.current_node]){
    let id=data.current_node,seen=new Set();
    while(id&&!seen.has(id)&&data.mapping[id]){
      seen.add(id);const node=data.mapping[id];chain.unshift(node);id=node.parent||null;
    }
  }else chain.push(...Object.values(data.mapping).sort((a,b)=>Number(a?.message?.create_time||0)-Number(b?.message?.create_time||0)));
  const out=[];
  for(const node of chain){
    const m=node?.message,role=m?.author?.role;if(!['user','assistant'].includes(role))continue;
    const text=asText(m?.content?.parts?.length?m.content.parts:m?.content)||asText(m?.metadata?.model_dil_v2?.fallbackMarkdown);
    const thinking=role==='assistant'?(visibleThinkingFrom(m?.content)||visibleThinkingFrom(m?.metadata)):'';
    if(text||thinking)out.push(thinking?{role,text,thinking}:{role,text});
  }
  return out;
}
function parsePerplexityApi(data){
  if(!data||typeof data!=='object')return [];
  const entries=Array.isArray(data.entries)?data.entries:Array.isArray(data.thread?.entries)?data.thread.entries:Array.isArray(data.messages)?data.messages:[];
  const out=[];
  for(const entry of entries){
    const rawRole=String(entry?.role||entry?.author||entry?.sender||entry?.type||'').toLowerCase();
    const role=/user|human|query|question/.test(rawRole)?'user':/assistant|ai|answer|response/.test(rawRole)?'assistant':(entry?.query&&!entry?.answer?'user':'assistant');
    const text=asText(entry?.text||entry?.content||entry?.answer||entry?.query||entry?.message);
    const steps=Array.isArray(entry?.steps)?entry.steps:Array.isArray(entry?.reasoning_steps)?entry.reasoning_steps:[];
    const stepText=steps.map(s=>asText(s?.summary||s?.text||s?.content||s)).filter(Boolean).join('\n\n');
    const thinking=role==='assistant'?[visibleThinkingFrom(entry),stepText].filter(Boolean).join('\n\n'):'';
    if(text||thinking)out.push(thinking?{role,text,thinking}:{role,text});
  }
  if(!out.length&&Array.isArray(data.steps)){
    const text=asText(data.answer||data.response||data.text||''),thinking=data.steps.map(s=>asText(s?.summary||s?.text||s?.content||s)).filter(Boolean).join('\n\n');
    if(text||thinking)out.push(thinking?{role:'assistant',text,thinking}:{role:'assistant',text});
  }
  return out;
}
function exportReason(status,kind){
  if(kind==='missing-id')return 'Conversation ID unavailable';
  if(kind==='timeout')return 'History request timed out';
  if(kind==='request-error')return 'History request failed';
  if(status===401||status===403)return 'History access denied (HTTP '+status+')';
  if(status===429)return 'History request rate-limited (HTTP 429)';
  return status?'History request returned HTTP '+status:'Full history was unavailable';
}
// ChatGPT's October 2026 history interface is paginated. All requests remain same-origin;
// the short-lived session bearer token is never persisted, exported or logged.
async function captureChatGPTPages(conversationId){
  let token='',lastFailure=null;
  try{
    const session=await fetch('/api/auth/session',{credentials:'include'});
    if(session.ok){const j=await session.json();if(typeof j?.accessToken==='string')token=j.accessToken;}
  }catch(_){}
  const auth=token?{Authorization:'Bearer '+token}:{};
  const roots=['/backend-api/conversations/'+encodeURIComponent(conversationId),
    '/backend-api/conversations/'+encodeURIComponent(conversationId)+'/messages'];
  for(const root of roots){
    const pages=[],seenCursor=new Set();
    let before='',previous=true,failed=null;
    for(let pageNumber=0;previous&&pageNumber<100;pageNumber++){
      if(recoveryCancelled()) {failed={kind:'cancelled',reason:'Recovery stopped by user'};break;}
      if(exportRecovery?.paused){await recoveryCheckpoint();if(recoveryCancelled()){failed={kind:'cancelled',reason:'Recovery stopped by user'};break;}}
      recoveryNotice('Retrieving history page '+(pageNumber+1)+'…',pages.reduce((total,p)=>total+p.messages.length,0));
      const q='?include_has_versions=true&num_turns=100'+(before?'&before='+encodeURIComponent(before):'');
      let response;
      for(let attempt=0;attempt<3;attempt++){
        const ctl=typeof AbortController==='function'?new AbortController():null;
        let timer=null;
        try{
          if(ctl){timer=setTimeout(()=>ctl.abort(),12000);if(exportRecovery)exportRecovery.controller=ctl;}
          response=await fetch(root+q,{credentials:'include',headers:auth,...(ctl?{signal:ctl.signal}:{})});
        }catch(err){
          failed={kind:err?.name==='AbortError'?'timeout':'request-error',
            reason:err?.name==='AbortError'?'History request timed out':'History request failed'};
          if(attempt<2&&err?.name==='AbortError'){await sleep(300*(attempt+1));continue;}
          break;
        }finally{if(timer)clearTimeout(timer);if(exportRecovery)exportRecovery.controller=null;}
        if(recoveryCancelled())break;
        if(response?.ok)break;
        const status=response?.status||0;
        failed={kind:'http',status,reason:exportReason(status,'http')};
        if(attempt<2&&[429,502,503,504].includes(status)){await sleep(400*(attempt+1));continue;}
        break;
      }
      if(!response?.ok){
        if(pages.length)break;
        lastFailure=failed||{kind:'request-error',reason:'History request failed'};
        break;
      }
      let body;try{body=await response.json();}catch(_){failed={kind:'parse',reason:'History page was not valid JSON'};break;}
      const payload=body?.conversation||body?.data?.conversation||body?.data||body;
      if(payload?.conversation_id&&payload.conversation_id!==conversationId){
        failed={kind:'identity',reason:'History returned a different conversation'};break;
      }
      const messages=payload?.messages||payload?.items,info=payload?.page_info||payload?.pagination;
      if(!Array.isArray(messages)||!info){
        failed={kind:'shape',reason:'History response has an unsupported format'};break;
      }
      if(!messages.length&&info.has_previous_page===true){
        failed={kind:'empty-page',reason:'An older history page was empty'};break;
      }
      pages.unshift({messages,info});
      recoveryNotice('History pages recovered: '+pages.length,pages.reduce((total,p)=>total+p.messages.length,0));
      previous=info.has_previous_page===true;
      if(previous){
        const cursor=info.start_cursor||info.previous_cursor;
        if(!cursor||seenCursor.has(String(cursor))){failed={kind:'cursor',reason:'History pagination did not advance'};break;}
        seenCursor.add(String(cursor));before=String(cursor);
      }
    }
    if(!pages.length){
      lastFailure=failed||lastFailure||{kind:'unavailable',reason:'History was unavailable'};
      if(lastFailure.status===404||lastFailure.status===405||lastFailure.kind==='shape')continue;
      return {failure:lastFailure};
    }
    const all=[],seenMessage=new Set();let unreadable=0,assets=0;
    for(const page of pages)for(const item of page.messages){
      const msg=item?.message||item,id=String(item?.id||msg?.id||'');
      if(!id){unreadable++;continue;}
      if(seenMessage.has(id))continue;seenMessage.add(id);
      const role=msg?.author?.role;if(role!=='user'&&role!=='assistant')continue;
      const text=asText(msg?.content?.parts?.length?msg.content.parts:msg?.content)||
        asText(msg?.metadata?.model_dil_v2?.fallbackMarkdown);
      const thinking=role==='assistant'?(visibleThinkingFrom(msg?.content)||visibleThinkingFrom(msg?.metadata)):'';
      if(!text&&!thinking&&msg?.content&&
        !msg?.metadata?.is_visually_hidden_from_conversation)unreadable++;
      if(msg?.metadata?.attachments?.length||
        msg?.content?.parts?.some?.(v=>v&&typeof v==='object'&&/image|audio|video|file|asset|spatial/i.test(String(v.content_type||v.type||''))))assets++;
      if(text||thinking)all.push(thinking?{role,text,thinking}:{role,text});
    }
    const oldest=pages[0].info,newest=pages[pages.length-1].info;
    const finished=oldest.has_previous_page===false&&newest.has_next_page===false&&!failed;
    const verified=finished&&!!all.length&&!unreadable&&!assets;
    const reason=failed?.reason||(!finished?'Some history pages could not be retrieved':
      unreadable?'Some messages could not be converted':assets?'Some files or media could not be converted':
      all.length?'Complete paginated history':'No readable messages');
    const proof={verified,reason,pages:pages.length,nodes:seenMessage.size,unreadable,assets};
    log('export-history-pages',{host:HOST.id,pages:proof.pages,messages:proof.nodes,verified:proof.verified,reason:proof.reason});
    return {source:'platform archive (paged)',turns:all,verified,proof,
      ...(verified?{}:{failure:{kind:failed?.kind||'partial',reason}}),
      ...(exportRaw?{raw:{messages:pages.flatMap(p=>p.messages),page_info:{has_previous_page:oldest.has_previous_page,has_next_page:newest.has_next_page}}}:{})};
  }
  return {failure:lastFailure||{kind:'unavailable',reason:'Modern history endpoints unavailable'}};
}
async function apiCapture(){
  try{
    if(HOST.id==='chatgpt'){
      const modern=await captureChatGPTPages(chatgptId());
      if(modern?.turns?.length)return modern;
      if(modern?.failure && modern.failure.status!==404 && modern.failure.status!==405)return modern;
      const id=chatgptId();if(!id)return {failure:{kind:'missing-id',reason:exportReason(0,'missing-id')}};
      const url='/backend-api/conversation/'+encodeURIComponent(id);
      for(let attempt=0;attempt<3;attempt++){
        let response,timer=null;
        try{
          const ctrl=typeof AbortController==='function'?new AbortController():null;
          if(ctrl)timer=setTimeout(()=>ctrl.abort(),12000);
          response=await fetch(url,{credentials:'include',...(ctrl?{signal:ctrl.signal}:{})});
        }catch(e){
          const kind=e?.name==='AbortError'?'timeout':'request-error';
          log('export-history-error',{host:HOST.id,kind,attempt:attempt+1});
          if(kind==='timeout'&&attempt<2){await sleep(500*(attempt+1));continue;}
          return {failure:{kind,reason:exportReason(0,kind),attempts:attempt+1}};
        }finally{if(timer)clearTimeout(timer);}
        if(!response.ok){
          const status=response.status;
          log('export-history-http',{host:HOST.id,status,attempt:attempt+1});
          if(attempt<2&&[429,502,503,504].includes(status)){
            const after=Number(response.headers?.get?.('Retry-After'));
            await sleep(Number.isFinite(after)&&after>0?Math.min(after*1000,5000):500*(attempt+1));continue;
          }
          return {failure:{kind:'http',status,reason:exportReason(status,'http'),attempts:attempt+1}};
        }
        try{
          const raw=await response.json(),turns=parseChatGPTApi(raw),proof=chatgptArchiveProof(raw,turns.length);
          log('export-history-shape',{verified:proof.verified,reason:proof.reason,nodes:proof.nodes,turns:turns.length});
          return {source:'platform archive',turns,raw,verified:proof.verified,proof,
            ...(proof.verified?{}:{failure:{kind:'shape',reason:'History structure: '+proof.reason}})};
        }catch(e){return {failure:{kind:'parse',reason:'History response could not be read'}};}
      }
    }
    if(HOST.id==='perplexity'){
      const slug=perplexitySlug();if(!slug)return null;
      const r=await fetch('/rest/thread/'+encodeURIComponent(slug),{credentials:'include'});if(!r.ok)return null;
      const raw=await r.json(),turns=parsePerplexityApi(raw);
      return {source:turns.length?'platform archive':'platform archive (unparsed)',turns,raw,verified:!!turns.length};
    }
  }catch(e){log('export-api-failed',{host:HOST.id,kind:'unexpected'});}
  return null;
}
function chatgptVisibleRows(){
  const rows=[],occurrences=new Map();
  const legacy=document.querySelectorAll('[data-message-author-role="user"],[data-message-author-role="assistant"]');
  const elements=legacy.length?legacy:document.querySelectorAll('section[data-turn="user"],section[data-turn="assistant"]');
  for(const el of elements){
    if(el.closest?.('[hidden],[aria-hidden="true"]'))continue;
    if(typeof el.getClientRects==='function'&&!el.getClientRects().length)continue;
    const role=el.getAttribute('data-message-author-role')||el.getAttribute('data-turn'),text=displayText(el.innerText||el.textContent||'');
    if(!role||!text)continue;
    const id=el.getAttribute('data-message-id')||el.closest?.('[data-message-id]')?.getAttribute('data-message-id')||
      el.getAttribute('data-turn-id')||el.closest?.('[data-turn-id]')?.getAttribute('data-turn-id')||
      el.closest?.('[data-testid^="conversation-turn-"]')?.getAttribute('data-testid');
    const fingerprint=role+':'+text,n=(occurrences.get(fingerprint)||0)+1;occurrences.set(fingerprint,n);
    const key=id?'id:'+id+':'+role:'text:'+fingerprint+':'+n;
    const thinking=role==='assistant'?visibleReasoningText(el):'';
    rows.push({key,turn:thinking?{role,text,thinking}:{role,text}});
  }
  return rows;
}
async function collectChatGPTDomHistory(){
  const scroller=conversationScrollContainer(),page=!scroller||scroller===document.scrollingElement||scroller===document.documentElement||scroller===document.body;
  const pos=()=>page?(window.scrollY||document.documentElement.scrollTop||0):scroller.scrollTop||0;
  const move=y=>{if(page)window.scrollTo(0,y);else scroller.scrollTop=y;};
  const initial=pos(),pathname=location.pathname,stored=new Map(),order=[];
  let passes=0,stall=0,top=false;
  const started=Date.now();
  function observe(){
    const batch=chatgptVisibleRows(),keys=batch.map(row=>row.key);
    for(const row of batch)if(!stored.has(row.key))stored.set(row.key,row.turn);
    if(!order.length)order.push(...keys);
    else{
      const overlap=keys.findIndex(key=>order.includes(key));
      if(overlap<0)order.unshift(...keys.filter(key=>!order.includes(key)));
      else{
        const anchor=order.indexOf(keys[overlap]);
        order.splice(anchor,0,...keys.slice(0,overlap).filter(key=>!order.includes(key)));
        for(let i=overlap+1;i<keys.length;i++){
          if(order.includes(keys[i]))continue;
          const before=order.indexOf(keys[i-1]);
          order.splice(before>=0?before+1:order.length,0,keys[i]);
        }
      }
    }
  }
  if(S.mode==='RUNNING'||S.sending||S.watchdogBusy||S.topBusy)
    return {turns:domTurns(),reason:'Pause Play before collecting older messages',passes:0};
  S.topBusy=true;
  try{
    observe();
    for(passes=0;passes<900&&Date.now()-started<240000;passes++){
      if(location.pathname!==pathname||recoveryCancelled())break;
      if(exportRecovery?.paused){await recoveryCheckpoint();if(recoveryCancelled())break;}
      const old=pos(),count=stored.size;
      const step=Math.max(240,Math.round((page?window.innerHeight:scroller.clientHeight||700)*0.75));
      move(Math.max(0,old-step));await sleep(180);observe();
      const current=pos();
      stall=current<=2&&old<=2&&stored.size===count?stall+1:0;
      S.detail='Collecting older messages: '+stored.size+' captured';
      recoveryNotice('Loading earlier messages · pass '+(passes+1),stored.size);
      if(passes%12===0)render();
      if(stall>=4){top=true;break;}
      if(current===old&&current>2&&stored.size===count&&passes>6)break;
    }
  }finally{try{if(location.pathname===pathname)move(initial);}catch(e){}S.topBusy=false;}
  return {turns:order.map(key=>stored.get(key)),reason:top?'Page start reached, but complete history is unverified':'History loading stopped or was interrupted',passes};
}
async function captureExport(){
  const dot=captureDotExport();if(dot)return dot;
  const codex=await captureCodexExport();if(codex)return codex;
  const api=await apiCapture();
  if(recoveryCancelled()&&!exportRecovery?.savePartial)return null;
  if(api?.turns?.length&&api.verified)return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:api.source,partial:false,turns:api.turns,verification:api.proof,...(exportRaw?{raw:api.raw}:{})};
  // A paginated archive with unsupported rich content is still preferable to scrolling on mobile.
  if(api?.turns?.length&&api.proof?.pages)return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:api.source,partial:true,note:'History pages were retrieved, but '+api.proof.reason+'. No mobile scrolling was required.',turns:api.turns,verification:api.proof,...(exportRaw?{raw:api.raw}:{})};
  const failure=api?.failure?.reason||(api?.turns?.length?'Archive completeness could not be verified':'Platform history unavailable');
  if(HOST.id==='chatgpt'){
    S.detail=failure+'. Checking older messages...';render();
    const dom=await collectChatGPTDomHistory();
    if(recoveryCancelled()&&!exportRecovery?.savePartial)return null;
    const archive=(api?.turns?.length||0)>dom.turns.length;
    return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:archive?'platform archive (unverified)':'visible page fallback',partial:true,
      note:'Full history could not be verified ('+failure+'). '+dom.reason+'. Some older messages or rich media may be missing.',
      turns:archive?api.turns:dom.turns,diagnostic:{code:api?.failure?.kind||'unverified',httpStatus:api?.failure?.status||null,passes:dom.passes},
      ...(exportRaw&&api?.raw?{raw:api.raw}:{})};
  }
  const dom=domTurns();
  return {version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),source:'visible page fallback',partial:true,
    note:'This export uses currently visible content and may be incomplete. '+failure,turns:dom,...(exportRaw&&api?.raw?{raw:api.raw}:{})};
}
function markdown(cap) {
  const ctx=exportFileContext();
  const lines=['# GITL · '+ctx.platform+' · '+ctx.title,'','- Conversation ID: '+(ctx.id||'not available'),
    ...(ctx.project?['- Project: '+ctx.project]:[]),'- Exported: '+cap.capturedAt,
    '- Source: '+cap.source+(cap.partial?' (may be incomplete)':''),''];
  if (cap.note) lines.push('> '+cap.note,'');
  cap.turns.forEach((turn,i)=>{ lines.push('## '+(i+1)+'. '+(turn.role==='user'?'User':turn.role==='activity'?'Activity':'Assistant'),'',turn.text||''); if(turn.thinking) lines.push('','### Platform-visible reasoning','',turn.thinking); if (cap.platform==='codex' && turn.metadata?.visibleDomText && (!turn.metadata.groupHasUser || turn.role==='user')) {
      lines.push('','### Rendered turn context (includes visible activity)','',turn.metadata.visibleDomText);
      if (turn.metadata.links?.length) lines.push('','### Captured links','',...turn.metadata.links.map(link=>'- '+(link.text||'Link')+': '+link.href));
    }
    lines.push(''); });
  return lines.join('\n');
}
function download(name,text,type) {
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name;
  document.documentElement.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
// PROJECT VAULT: manual-only local transcript collection, isolated from Play/Send.
const ProjectVault = (() => {
  const KEY='v9.projectVault.1', LIMIT=16_000_000, CHAT_LIMIT=4_000_000, SOFT=10_000_000;
  const bytes=value=>typeof TextEncoder==='function'?new TextEncoder().encode(value).length:unescape(encodeURIComponent(value)).length;
  let busy=false;
  function read() {
    const raw=GM_getValue(KEY,'');
    if (!raw) return {schema:'gitl-project-vault/1',projects:[]};
    let data;
    try { data=JSON.parse(raw); } catch (_) { throw Error('Project storage could not be read. No data was changed.'); }
    if (data?.schema!=='gitl-project-vault/1' || !Array.isArray(data.projects)) throw Error('Unsupported Project Vault data; no data was changed.');
    return data;
  }
  async function commit(data) {
    const raw=JSON.stringify(data);
    if(raw.length>LIMIT) throw Error('Storage limit reached. Download a project backup before saving more.');
    const written=typeof GM_setValueAsync==='function' ? GM_setValueAsync(KEY,raw) : GM_setValue(KEY,raw);
    if(written && typeof written.then==='function' && await written===false) throw Error('Browser storage rejected this save.');
    if(GM_getValue(KEY,'')!==raw) throw Error('Could not verify saved project. Try exporting a backup.');
  }
  function list() { try {return read().projects.map(p=>({id:p.id,name:p.name,count:p.chats.length,batch:p.batch||1,bytes:bytes(JSON.stringify(p.chats)),pending:!!p.pending}));}catch(_){return [];} }
  function get(projectId) { return read().projects.find(p=>p.id===projectId)||null; }
  function pendingBundle(projectId) {
    const p=get(projectId);
    if(!p?.pending) throw Error('No batch awaiting confirmation.');
    if(p.pending.keys.join('|')!==p.chats.map(c=>c.sourceKey).join('|')) throw Error('Batch changed; nothing was cleared.');
    return {schema:'gitl-project/1',project:{id:p.id,name:p.name,createdAt:p.createdAt},
      batch:p.pending.batch,exportedAt:p.pending.createdAt,partial:p.chats.some(c=>c.capture.partial),
      note:'Saved browser-visible chat records, not hidden account memory.',chats:p.chats};
  }
  async function confirm(projectId) {
    if(busy) throw Error('Vault is busy.');busy=true;
    try { const d=read(),p=d.projects.find(p=>p.id===projectId);
      if(!p?.pending) throw Error('No pending batch.');
      if(p.pending.keys.join('|')!==p.chats.map(c=>c.sourceKey).join('|')) throw Error('Batch changed; nothing was cleared.');
      const next=p.pending.batch+1;
      const incoming=p.pending.incoming||null;
      p.chats=incoming?[incoming]:[];p.batch=next;p.pending=null;await commit(d);return next;
    } finally {busy=false;}
  }
  function usage(projectId) {const p=get(projectId);return p?{bytes:bytes(JSON.stringify(p.chats)),limit:SOFT,batch:p.batch||1,pending:!!p.pending}:null;}

  function sourceKey(cap,url) {
    const path=String(url||'').split(/[?#]/)[0];
    const first=(cap.turns||[]).find(t=>t.role==='user')?.text||'';
    // Home pages have no stable conversation identity. Distinguish by first prompt.
    return /\/(?:c|local|chat|conversation|search|thread)\/[^/]+/i.test(path)
      ? path : path+'#first='+hash(first.slice(0,1024));
  }
  async function create(name) {
    const clean=String(name||'').trim().slice(0,80);
    if(!clean) throw Error('Type a project name first.');
    if(busy) throw Error('Vault is busy.'); busy=true;
    try {
      const data=read();
      const old=data.projects.find(p=>p.name.toLowerCase()===clean.toLowerCase());
      if(old) return old.id;
      if(data.projects.length>=12) throw Error('Project limit reached. Save a backup first.');
      const id='p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
      data.projects.push({id,name:clean,createdAt:new Date().toISOString(),batch:1,pending:null,chats:[]});
      await commit(data); return id;
    } finally {busy=false;}
  }
  async function save(projectId,cap,url,title) {
    if(busy) throw Error('Vault is busy.');
    if(!Array.isArray(cap?.turns)||!cap.turns.length) throw Error('No conversation was captured.');
    busy=true;
    try {
      const data=read(), project=data.projects.find(p=>p.id===projectId);
      if(!project) throw Error('Choose a project first.');
      if(project.pending) return {rollover:true,batch:project.pending.batch};
      const key=sourceKey(cap,url), index=project.chats.findIndex(c=>c.sourceKey===key);
      const old=index>=0?project.chats[index]:null;
      if(old && (old.capture.turns.length>cap.turns.length || (!old.capture.partial && cap.partial)))
        throw Error('A more complete copy is already saved; no content was overwritten.');
      if(index<0 && project.chats.length>=100) throw Error('Project reached 100 chats. Download a backup.');
      const item={sourceKey:key,siteUrl:String(url||'').split(/[?#]/)[0],
        title:String(title||'Untitled chat').slice(0,200),savedAt:new Date().toISOString(),
        platform:cap.platform,capture:cap};
      const incomingBytes=bytes(JSON.stringify(item));
      if(incomingBytes>CHAT_LIMIT) return {oversized:true,item,batch:project.batch||1,name:project.name};
      const next=project.chats.slice();
      if(index>=0) next[index]=item; else next.push(item);
      if(bytes(JSON.stringify(next))>SOFT) {
        if(!project.chats.length) return {oversized:true,item,batch:project.batch||1,name:project.name};
        project.pending={batch:project.batch||1,keys:project.chats.map(c=>c.sourceKey),incoming:item,createdAt:new Date().toISOString()};
        await commit(data);
        return {rollover:true,batch:project.pending.batch};
      }

      if(index>=0) project.chats[index]=item; else project.chats.push(item);
      await commit(data);
      return {name:project.name,count:project.chats.length,replaced:index>=0,partial:!!cap.partial};
    } finally {busy=false;}
  }
  function assemble(projectId) {
    const project=read().projects.find(p=>p.id===projectId);
    if(!project) throw Error('Choose a saved project first.');
    return {schema:'gitl-project/1',project:{id:project.id,name:project.name,createdAt:project.createdAt},
      exportedAt:new Date().toISOString(),partial:project.chats.some(c=>c.capture.partial),
      note:'Only content accessible to the signed-in browser at save time is included. Hidden memories and unloaded turns cannot be assumed present.',
      chats:project.chats};
  }
  function asMarkdown(bundle) {
    const lines=['# '+bundle.project.name,'','Ghost Project Vault · '+bundle.chats.length+' conversations',
      'Conversation completeness is reported for each source.',''];
    bundle.chats.forEach((chat,i)=>{
      lines.push('---','','# Chat '+(i+1)+': '+chat.title,'',
        '- Platform: '+chat.platform,'- Page: '+chat.siteUrl,'- Saved: '+chat.savedAt,
        '- Completeness: '+(chat.capture.partial?'partial / may omit messages':'platform archive'),'',markdown(chat.capture),'');
    });
    return lines.join('\n');
  }
  return {list,create,save,assemble,asMarkdown,sourceKey,usage,get,pendingBundle,confirm};
})();
let vaultProjectId=String(GM_getValue('v9.vault.active','')||'');
let vaultActionBusy=false;
async function runVaultAction(kind,name) {
  if(vaultActionBusy) return;
  vaultActionBusy=true;
  try {
    if(kind==='create'){
      vaultProjectId=await ProjectVault.create(name);
      GM_setValue('v9.vault.active',vaultProjectId);
      S.detail='Project ready. Visit another AI chat to add more.';
    } else if(kind==='save') {
      const cap=await captureExport();
      if(!confirmPartialExport(cap))return;
      const r=await ProjectVault.save(vaultProjectId,cap,location.href,document.title);
      if(r.rollover) {
        const b=ProjectVault.pendingBundle(vaultProjectId);
        download('ghost-'+vaultProjectId+'-batch-'+String(b.batch).padStart(3,'0')+'.json',JSON.stringify(b,null,2),'application/json;charset=utf-8');
        S.detail='Batch '+b.batch+' download started. Verify file, then tap Confirm saved. Old chats retained.';
      } else if(r.oversized) {
        const bundle={schema:'gitl-project/1',project:{id:vaultProjectId,name:r.name},batch:r.batch,oversized:true,partial:!!r.item.capture.partial,chats:[r.item]};
        download('ghost-'+vaultProjectId+'-oversized-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(bundle,null,2),'application/json;charset=utf-8');
        S.detail='Oversized chat downloaded separately. Verify Downloads; previous chats retained.';
      } else S.detail=(r.replaced?'Updated ':'Added chat to ')+r.name+' · '+r.count+' chats'+(r.partial?' · may be incomplete':'');
    } else if(kind==='confirm') {
      const next=await ProjectVault.confirm(vaultProjectId);
      S.detail='Archived batch confirmed. Collecting batch '+next+'.';
    } else if(kind==='retry') {
      const b=ProjectVault.pendingBundle(vaultProjectId);
      download('ghost-'+vaultProjectId+'-batch-'+String(b.batch).padStart(3,'0')+'.json',JSON.stringify(b,null,2),'application/json;charset=utf-8');
      S.detail='Download started again. Previous chats still retained.';
    } else {
      const bundle=ProjectVault.assemble(vaultProjectId);
      if(!bundle.chats.length) throw Error('Add a chat to this project first.');
      const filename='ghost-project-'+bundle.project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,45)+'-'+new Date().toISOString().slice(0,10);
      if(kind==='json') download(filename+'.json',JSON.stringify(bundle,null,2),'application/json;charset=utf-8');
      else download(filename+'.md',ProjectVault.asMarkdown(bundle),'text/markdown;charset=utf-8');
      S.detail='Project saved · '+bundle.chats.length+' chats'+(bundle.partial?' · some may be incomplete':'');
    }
  } catch(e) {S.detail=String(e?.message||e);}
  finally {vaultActionBusy=false;render();}
}

// Read-only fallback evidence; does not read cookies, storage, response bodies or credentials.
function pageEvidence() {
  const scrubUrl=value=>{try {const u=new URL(String(value||''),location.href);return u.origin+u.pathname;} catch(_) {return '[unavailable]';}};
  const safeClone=doc=>{
    const copy=doc.documentElement.cloneNode(true);
    copy.querySelectorAll('script,style,svg,img,picture,canvas,video,audio,source,object,embed,link,#gitl9').forEach(el=>el.remove());
    for(const el of [copy,...copy.querySelectorAll('*')]) {
      for(const attr of [...el.attributes]) {
        const n=attr.name.toLowerCase(),v=attr.value;
        if(n.startsWith('on')||n==='nonce'||n==='integrity'||n==='srcdoc'||n==='ping'
           ||n==='value'||n==='placeholder'&&/pass|token|secret/i.test(v)
           ||n==='srcset'||n==='style'||n==='data-url'
           ||/token|auth|secret|session|csrf|api.?key|password|cookie/i.test(n)) el.removeAttribute(attr.name);
        else if(['href','src','action','formaction','poster'].includes(n)) el.setAttribute(attr.name,scrubUrl(v));
      }
      if(el.matches('input,textarea,select')) {
        el.removeAttribute('value');el.removeAttribute('checked');el.removeAttribute('selected');
        if(el.tagName==='TEXTAREA')el.textContent='';
      }
    }
    return '<!DOCTYPE html>\n'+copy.outerHTML;
  };
  const frames=[];
  for(const [index,f] of [...document.querySelectorAll('iframe')].entries()) {
    const record={index,src:scrubUrl(f.getAttribute('src')||''),title:f.title||'',accessible:false};
    try {
      const fd=f.contentDocument;
      if(fd?.documentElement) {record.accessible=true;record.html=safeClone(fd);}
    }catch(_) {}
    frames.push(record);
  }
  const html=safeClone(document);
  const tables=[...document.querySelectorAll('table')].map((table,index)=>({
    index,caption:displayText(table.caption?.textContent||''),
    rows:[...table.rows].map(row=>[...row.cells].map(cell=>displayText(cell.innerText||cell.textContent||'')))
  }));
  const resources=performance.getEntriesByType('resource').map(e=>({
    url:scrubUrl(e.name),initiatorType:e.initiatorType||'',durationMs:Math.round(e.duration||0)
  })).slice(0,500);
  const selectors={
    chatgptMessageNodes:document.querySelectorAll('[data-message-author-role]').length,
    dotRows:document.querySelectorAll('.messaging-root .message-row').length,
    codexTurns:document.querySelectorAll('[data-turn-key^="history-content:turn:"]').length,
    iframes:frames.length,shadowHosts:0
  };
  const shadows=[];
  for(const el of document.querySelectorAll('*'))if(el.shadowRoot) {
    selectors.shadowHosts++;
    shadows.push({host:el.tagName.toLowerCase(),id:el.id||'',text:displayText(el.shadowRoot.textContent||'').slice(0,20000)});
    if(shadows.length>=30)break;
  }
  return {schema:'ghost-page-evidence/1',createdAt:new Date().toISOString(),version:VER,
    url:scrubUrl(location.href),title:document.title||'',userAgent:navigator.userAgent,
    viewport:{width:innerWidth,height:innerHeight},
    limitations:['Browser-visible DOM only; not server-side state or historical API responses.',
      'Cross-origin iframe contents are inaccessible.','Images, SVG and binary resources excluded.',
      'Scripts, credentials, form values, query strings and sensitive attributes removed.',
      'Resource URLs are paths only; network bodies and headers are unavailable.'],
    html,frames,tables,resources,selectors,shadows};
}
function doPageBackup(kind) {
  try {
    const data=pageEvidence();
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    if(kind==='html') download('ghost-page-'+stamp+'.html',data.html,'text/html;charset=utf-8');
    else download('ghost-diagnostics-'+stamp+'.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');
    S.detail=kind==='html'?'Page HTML download started · images/scripts removed':'Diagnostic JSON download started · review before sharing';
  } catch(e) {S.detail='Page backup failed: '+String(e?.message||e);}
  render();
}


let exportRecovery = null;
function recoveryCancelled(){return !!exportRecovery?.cancelled;}
async function recoveryCheckpoint(){
  const op=exportRecovery;
  if(!op)return;
  while(op.paused&&!op.cancelled){await sleep(200);}
  if(op.cancelled)throw new Error('GITL_EXPORT_CANCELLED');
}
function recoveryNotice(text,found){
  const op=exportRecovery;if(!op)return;
  if(Number.isFinite(found))op.found=Math.max(op.found,found);
  const el=op.root?.querySelector('[data-export-recovery-state]');
  const count=op.root?.querySelector('[data-export-recovery-count]');
  if(el&&el.textContent!==text)el.textContent=text;
  if(count)count.textContent=op.found+' messages recovered';
}
function recoveryOpen(){
  const parent=document.body||document.documentElement;
  const backdrop=document.createElement('div');
  backdrop.id='gitl-export-recovery';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-label','Ghost conversation export progress');
  backdrop.setAttribute('aria-modal','true');
  backdrop.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(3,7,18,.69);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
  backdrop.innerHTML=trustedHTML('<section style="width:min(390px,100%);padding:15px;color:#e8f2ff;background:#121a27;border:1px solid #45617e;border-radius:14px;box-shadow:0 20px 55px #000a;font:13px/1.5 system-ui,sans-serif"><div aria-hidden="true" style="text-align:center;font-size:25px;color:#8ab4ff">◈ <span data-ghost-fly>👻</span> ◈</div><h2 style="text-align:center;font-size:16px;margin:3px 0">GITL · Recovering conversation</h2><div data-export-recovery-state role="status" aria-live="polite">Requesting conversation history…</div><p data-export-recovery-count style="color:#a9c7e5;margin:6px 0 14px">0 messages recovered</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><button type="button" data-recovery-pause style="padding:10px;background:#223c56;color:white;border:1px solid #547291;border-radius:7px">Pause</button><button type="button" data-recovery-save style="padding:10px;background:#1b4550;color:white;border:1px solid #58a9a9;border-radius:7px">Save Partial</button><button type="button" data-recovery-cancel style="grid-column:span 2;padding:9px;background:#2b1b28;color:white;border:1px solid #784353;border-radius:7px">Cancel (no save)</button></div><p style="font-size:11px;color:#9fb0c5;margin:9px 0 0">Ghost tries authenticated history first. Scrolling may affect this page. Pause or cancel at any time.</p></section>');
  const fx=document.createElement('style');
  fx.textContent='#gitl-export-recovery [data-ghost-fly]{display:inline-block;animation:gitl-export-fly 3.2s ease-in-out infinite}@keyframes gitl-export-fly{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@media(prefers-reduced-motion:reduce){#gitl-export-recovery [data-ghost-fly]{animation:none!important}}';
  backdrop.appendChild(fx);
  const op={root:backdrop,cancelled:false,savePartial:false,paused:false,found:0,controller:null};
  exportRecovery=op;
  backdrop.querySelector('[data-recovery-pause]').addEventListener('click',e=>{
    op.paused=!op.paused;
    e.currentTarget.textContent=op.paused?'Resume':'Pause';
    recoveryNotice(op.paused?'Paused · history already recovered is preserved':'Resuming recovery…');
  });
  backdrop.querySelector('[data-recovery-cancel]').addEventListener('click',()=>{
    op.cancelled=true;op.paused=false;op.controller?.abort();
    recoveryNotice('Cancelling…');
  });
  backdrop.querySelector('[data-recovery-save]').addEventListener('click',()=>{
    op.savePartial=true;op.cancelled=true;op.paused=false;op.controller?.abort();
    recoveryNotice('Preparing explicitly labeled partial file…');
  });
  parent.appendChild(backdrop);
  return op;
}
function recoveryClose(op){if(op?.root?.isConnected)op.root.remove();if(exportRecovery===op)exportRecovery=null;}
function exportFileContext(){
  const raw=String(document.title||'Conversation')
    .replace(/\s*[-|–—]\s*ChatGPT\s*$/i,'')
    .replace(/\s*[-|–—]\s*Perplexity\s*$/i,'').trim();
  const title=raw&&raw.toLowerCase()!=='chatgpt'?raw:'Conversation';
  const project=ProjectVault.get(vaultProjectId)?.name||'';
  const id=HOST.id==='chatgpt'?chatgptId():(HOST.id==='perplexity'?perplexitySlug():'');
  const clean=v=>String(v||'').normalize('NFKC').replace(/[\/\\:*?"<>|\x00-\x1f]/g,'_')
    .replace(/\s+/g,' ').replace(/[. ]+$/,'').trim().slice(0,65);
  return {title:clean(title),project:clean(project),id:clean(id).slice(-12),platform:HOST.id==='chatgpt'?'ChatGPT':HOST.id==='perplexity'?'Perplexity':HOST.id};
}
function exportFileName(cap,kind){
  const ctx=exportFileContext(),dt=new Date(cap.capturedAt||Date.now());
  const utc=Number.isFinite(dt.getTime())?dt.toISOString().replace('T','_').replace(/:/g,'-').slice(0,19):new Date().toISOString().replace('T','_').replace(/:/g,'-').slice(0,19);
  return ['GITL',ctx.platform,ctx.project,ctx.title,ctx.id,utc,cap.partial?'PARTIAL':'FULL'].filter(Boolean).join('_')+'.'+(kind==='json'?'json':'md');
}
function exportStatus(cap,action){return action+' · '+cap.turns.length+' turns · '+(cap.partial?'may be incomplete':'full platform history');}
function confirmPartialExport(cap){
  if(!cap.partial)return true;
  S.detail='Incomplete export: '+cap.turns.length+' messages. '+(cap.note||'Full history unverified.');render();
  let yes=false;try{yes=window.confirm('Ghost could not verify the full conversation. Only '+cap.turns.length+' messages were recovered. Save explicitly labeled PARTIAL data anyway?');}catch(e){}
  if(!yes){S.detail='Partial export cancelled. No file saved. '+(cap.note||'');render();}
  return yes;
}
async function doExport(kind){
  S.detail='Checking full conversation history...';render();let cap;
  const progress=recoveryOpen();
  try{
    cap=await captureExport();
    if(progress.cancelled&&!progress.savePartial){S.detail='Export cancelled. No file saved.';render();return;}
    if(progress.savePartial&&cap){cap.partial=true;cap.note=(cap.note||'')+' User requested partial save during recovery.';}
  }catch(e){
    S.detail=progress.cancelled?'Export cancelled. No file saved.':'Export failed. No file saved.';
    log('export-failed',{kind:progress.cancelled?'cancelled':'unexpected'});render();return;
  }finally{recoveryClose(progress);}
  if(!cap?.turns?.length&&!cap?.raw){S.detail='No conversation data was available. '+(cap?.note||'');render();return;}
  if(!(progress.savePartial&&cap.partial)&&!confirmPartialExport(cap))return;
  if(kind==='copy'){const text=markdown(cap);try{GM_setClipboard(text,'text');}catch(e){await navigator.clipboard?.writeText(text);}S.detail=exportStatus(cap,'Copied Markdown');}
  else if(kind==='md'){download(exportFileName(cap,'md'),markdown(cap),'text/markdown;charset=utf-8');S.detail=exportStatus(cap,'Markdown saved');}
  else{download(exportFileName(cap,'json'),JSON.stringify(cap,null,2),'application/json;charset=utf-8');S.detail=exportStatus(cap,'JSON saved');}
  S.lastExport={partial:!!cap.partial,turns:cap.turns.length,source:cap.source,reason:cap.note||null,status:cap.diagnostic?.httpStatus||null};
  if(cap.partial)S.detail+=' · '+(cap.note||'Unverified');render();
}
function report() {
  return {
    product: 'Ghost in the Loop', version: VER, platform: HOST.id, state: S.mode, round: S.round, maxRounds: S.max,
    sending: S.sending, uncertain: S.uncertain, driftCount: S.drift,
    watchdog: { state: S.stallState, stopAttempts: S.stopAttempts, recoveryCount: S.recoveryCount, lastProgressAt: S.lastProgressAt || null },
    progress: { round: S.round, maxRounds: S.max, workflow: allWorkflows()[workflowId]?.label || 'Manual', stage: S.stageProgress, soundOn, notifyOn },
    capabilities: { input: !!composer(), send: !!localSendButton(), stop: generating(), assistant: !!assistantText(), top: S.mode !== 'RUNNING' && !S.topBusy },
    lastExport: S.lastExport || null,
    lastError: S.lastError, relayRequested: S.relay || null, events: S.events.slice(-20), when: new Date().toISOString()
  };
}
function copyReport() {
  const text = JSON.stringify(report(), null, 2);
  try { GM_setClipboard(text, 'text'); } catch (_) { navigator.clipboard?.writeText(text); }
  S.detail = 'Diagnostic report copied.'; render();
}

const style = document.createElement('style');
style.textContent = `#gitl9{position:fixed;z-index:2147483646;top:70px;right:8px;width:min(270px,calc(100vw - 16px));background:var(--g-bg);color:var(--g-text);border:1px solid var(--g-border);border-radius:var(--g-radius);box-shadow:var(--g-shadow);font:12px/1.35 system-ui,sans-serif;padding:8px}#gitl9 *{box-sizing:border-box}#gitl9 .head{display:flex;align-items:center;justify-content:space-between;gap:6px}#gitl9 .brand{font-weight:750}#gitl9 .meta{font-size:10px;opacity:.65}#gitl9 .tabs{display:flex;gap:4px;margin:7px 0}#gitl9 button{border:1px solid #494550;background:var(--g-surface);color:var(--g-text);border-radius:8px;padding:7px 6px;font:inherit}#gitl9 button.on{background:var(--g-accent-bg);border-color:var(--g-accent);color:var(--g-text)}#gitl9 button.stop{background:#46191d;border-color:#85333a}#gitl9 button:disabled{opacity:.45;cursor:not-allowed}#gitl9 .tabs button{flex:1;padding:5px 3px}#gitl9 .status{background:var(--g-panel);border-radius:8px;padding:7px;min-height:42px;margin:5px 0 7px;word-break:break-word}#gitl9 .row{display:flex;gap:5px}#gitl9 .row>*{flex:1;min-width:0}#gitl9 .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}#gitl9 label{display:flex;align-items:center;gap:5px;padding:5px;border:1px solid #35323a;border-radius:7px;background:var(--g-surface)}#gitl9 input[type="text"],#gitl9 input[type="number"],#gitl9 select,#gitl9 textarea{width:100%;background:var(--g-panel);color:var(--g-text);border:1px solid var(--g-border);border-radius:7px;padding:6px}#gitl9 .pane{display:none}#gitl9 .pane.show{display:block}#gitl9 .tiny{font-size:10px;color:var(--g-muted);margin-top:5px}.helpbox{background:var(--g-panel);border:1px solid var(--g-border);border-radius:9px;padding:7px;margin:5px 0}.helpbox b{color:var(--g-accent)}.swatches{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}.swatches button{flex:0 0 28px;height:28px;padding:0}.headtools{display:flex;align-items:center;gap:5px}.helpbtn{padding:3px 6px!important;font-size:10px!important}.rail{display:none}.collapsebtn{padding:3px 7px!important;font-size:12px!important}#gitl9.collapsed{right:0!important;top:34vh!important;width:42px!important;min-width:42px!important;max-width:42px!important;padding:5px!important;border-right:0!important;border-radius:12px 0 0 12px!important}#gitl9.collapsed>*:not(.rail){display:none!important}#gitl9.collapsed .rail{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:92px;cursor:pointer;user-select:none}#gitl9.collapsed .rail .ghost{font-size:20px;line-height:1}#gitl9.collapsed .rail .arrow{font-size:18px;color:var(--g-accent)}#gitl9.collapsed .rail .mini{font-size:9px;color:var(--g-muted);writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:.5px}.progline{height:4px;background:var(--g-surface);border-radius:99px;overflow:hidden;margin-top:5px}.progline span{display:block;height:100%;background:var(--g-accent);transition:width .15s ease}@media(max-width:520px){#gitl9{top:58px;width:min(238px,calc(100vw - 12px));right:6px;padding:7px}#gitl9.collapsed{right:0!important;top:32vh!important;width:42px!important;min-width:42px!important;padding:4px!important}#gitl9 .tabs{display:grid;grid-template-columns:repeat(3,1fr)}#gitl9 .tabs button{min-height:38px}#gitl9 .transport{display:grid;grid-template-columns:1fr 1fr}#gitl9 .transport button,#gitl9 .helpbox button{min-height:40px}#gitl9 button{padding:7px 5px}}`;
style.textContent += '#gitl9 .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}#gitl9 .sectionTitle{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--g-muted);font-weight:750;margin:7px 0 4px}#gitl9 .pillrow{display:flex;gap:4px;flex-wrap:wrap}#gitl9 .pillrow button{flex:1 1 30%;min-width:62px}#gitl9 .qrow{display:grid;grid-template-columns:18px 1fr 30px;gap:4px;align-items:center;margin:4px 0}#gitl9 .qnum{font-size:9px;color:var(--g-muted);text-align:center}#gitl9 .qdel{padding:4px!important}#gitl9 .stage{border:1px solid var(--g-border);border-radius:8px;padding:6px;margin:4px 0;background:var(--g-panel)}#gitl9 .stage.act{border-color:var(--g-accent)}#gitl9 .personGrid{display:grid;grid-template-columns:1fr 1fr;gap:4px}#gitl9 .personGrid label{font-size:10px;padding:5px}#gitl9 .posgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}#gitl9 .posgrid button{padding:6px 2px}#gitl9 .drag{cursor:move;touch-action:none}#gitl9.pos-dock-left{left:0!important;right:auto!important;border-radius:0 var(--g-radius) var(--g-radius) 0}#gitl9.pos-dock-right{right:0!important;left:auto!important;border-radius:var(--g-radius) 0 0 var(--g-radius)}#gitl9.pos-header{top:8px!important;left:50%!important;right:auto!important;transform:translateX(-50%)}#gitl9.collapsed.pos-dock-left{left:0!important;right:auto!important;border-left:0!important;border-right:1px solid var(--g-border)!important;border-radius:0 12px 12px 0!important}#gitl9.collapsed.pos-dock-left .rail .arrow{transform:rotate(180deg)}@media(max-width:520px){#gitl9 .tabs{grid-template-columns:repeat(3,1fr)}#gitl9 .personGrid{grid-template-columns:1fr}}';

// Mobile-safe shell (v8 scroll-body concept, no new images or animation loops).
style.textContent += `
#gitl9{display:flex;flex-direction:column;max-height:min(76vh,calc(100vh - 80px));max-height:min(76dvh,calc(100dvh - 80px - env(safe-area-inset-bottom,0px)));overflow:hidden}
#gitl9 .head{flex:none;min-height:30px;padding:1px 1px 5px;border-bottom:1px solid var(--g-border)}
#gitl9 .brand{display:flex;align-items:center;gap:5px;letter-spacing:.04em}
#gitl9 .g-orbit{width:16px;height:16px;flex:none;display:inline-block;position:relative;border-radius:50%;background:conic-gradient(var(--g-accent) var(--g-pct,0%),var(--g-border) 0)}
#gitl9 .g-orbit:after{content:'';position:absolute;inset:4px;border-radius:50%;background:var(--g-bg)}
#gitl9 .g-status{flex:none;min-height:0;margin:5px 0;padding:6px 7px;border-left:2px solid var(--g-accent);box-shadow:inset 0 0 0 1px var(--g-border)}
#gitl9 .status-top{display:flex;align-items:center;gap:5px;font-size:10px;line-height:1.2}
#gitl9 .status-top button{margin-left:auto;font-size:12px;line-height:1;padding:2px 7px;min-height:22px}
#gitl9 .status-text{font-size:11px;line-height:1.35;margin-top:3px;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
#gitl9.status-open .status-text{-webkit-line-clamp:unset;display:block}
#gitl9 .g-status .tiny{margin-top:3px}
#gitl9 .g-controls{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:1px 0 5px!important}
#gitl9 .g-controls button{font-weight:700;font-size:11px;min-height:35px;padding:5px 2px}
#gitl9 .g-controls button[data-a="play"]{border-color:var(--g-accent);background:var(--g-accent-bg)}
#gitl9 .tabs{flex:0 0 auto;margin:2px 0 4px;gap:4px}
#gitl9 .tabs button{font-weight:650;font-size:11px;min-height:32px}
#gitl9 .tabs .mobile-more{display:none}
#gitl9 .g-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:var(--g-border) transparent;padding:2px 2px 3px 0}
#gitl9 .g-scroll::-webkit-scrollbar{width:4px}
#gitl9 .g-scroll::-webkit-scrollbar-thumb{background:var(--g-border);border-radius:8px}
#gitl9 .pane{padding-bottom:3px}
#gitl9 .g-accordion{display:block;border:1px solid var(--g-border);border-radius:9px;background:var(--g-panel);margin:5px 0;padding:0 7px 7px}
#gitl9 .g-accordion>summary{cursor:pointer;list-style:none;font-size:11px;font-weight:750;color:var(--g-text);min-height:34px;display:flex;align-items:center;gap:5px;user-select:none}
#gitl9 .g-accordion>summary::-webkit-details-marker{display:none}
#gitl9 .g-accordion>summary:after{content:'▾';margin-left:auto;color:var(--g-accent);font-size:14px}
#gitl9 .g-accordion[open]>summary:after{content:'▴'}
#gitl9 .g-accordion[open]>summary{border-bottom:1px solid var(--g-border);margin-bottom:6px}
#gitl9 .g-accordion button{min-height:30px}
#gitl9 .tiny{line-height:1.35}
#gitl9.collapsed{max-height:none!important;overflow:visible}
#gitl9.collapsed .rail{min-height:72px}
@media(max-width:520px){
#gitl9{width:min(268px,calc(100vw - 12px));padding:7px;max-height:min(72dvh,calc(100dvh - 66px - env(safe-area-inset-bottom,0px)))}
#gitl9 .head .meta{display:none}
#gitl9 .tabs{grid-template-columns:repeat(4,minmax(0,1fr))}
#gitl9 .tabs button{min-width:0;font-size:10px;min-height:36px;padding:3px 2px}
#gitl9 .tabs .mobile-more{display:block}
#gitl9 .tabs .tab-advanced{display:none}
#gitl9.more-open .tabs .tab-advanced{display:block}
#gitl9 .g-scroll button,#gitl9 .g-scroll select{min-height:34px}
#gitl9 .g-scroll textarea{max-width:100%}
#gitl9 .personGrid{grid-template-columns:1fr}
}
@media(max-height:430px){#gitl9 .head{min-height:25px}#gitl9 .g-controls button{min-height:28px}#gitl9 .tabs button{min-height:28px}#gitl9 .status-text{-webkit-line-clamp:1}}
@media(prefers-reduced-motion:reduce){#gitl9 .progline span{transition:none}}
`;

style.textContent += `
/* v8-inspired restrained midnight/blue architecture; old skins remain switchable. */
#gitl9{box-sizing:border-box!important}
#gitl9 .head{position:relative;isolation:isolate;overflow:hidden;min-height:42px;background:linear-gradient(110deg,var(--g-bg),var(--g-surface));padding:7px 9px 6px;border:1px solid var(--g-border);border-radius:8px;margin:0 0 6px}
#gitl9 .head::before{content:"⌁   ◇   ·   ⟡   ✧   ·   ◇   ⌁   ·   ✧";position:absolute;right:-4px;top:3px;color:var(--g-accent);opacity:.12;white-space:nowrap;font:12px/2 monospace;letter-spacing:5px;pointer-events:none;z-index:-1}
#gitl9[data-running="1"] .head::before{animation:ghostGlyph 16s steps(4,end) infinite}
@keyframes ghostGlyph{0%,100%{opacity:.09;transform:translateX(0)}50%{opacity:.22;transform:translateX(7px)}}
#gitl9 .brand{font-size:12px;letter-spacing:.08em;white-space:nowrap}
#gitl9 .g-nav-label,#gitl9 .g-section-label{font:700 9px/1.4 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--g-muted);margin:6px 0 5px}
#gitl9 .g-nav-label{padding-top:7px;border-top:1px solid var(--g-border)}
#gitl9 .tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:3px;background:var(--g-panel);border:1px solid var(--g-border);border-radius:9px;margin:0 0 6px}
#gitl9 .tabs button{min-height:38px;padding:4px 1px!important;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--g-muted);font-size:11px;font-weight:700;box-shadow:none}
#gitl9 .tabs button.on{background:var(--g-surface);border-color:var(--g-border);color:var(--g-text);box-shadow:inset 0 -2px 0 var(--g-accent)}
#gitl9 .tabs .mobile-more{display:block}
#gitl9 .g-subnav{display:none;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:0 0 7px;padding:7px;border:1px solid var(--g-border);border-radius:8px;background:var(--g-panel)}
#gitl9.more-open .g-subnav{display:grid}
#gitl9 .g-subnav button{font-size:11px;min-height:36px;text-align:left;padding:4px 6px;border:1px solid var(--g-border);background:var(--g-surface)}
#gitl9 .g-subnav button.on{border-color:var(--g-accent);background:var(--g-accent-bg);color:var(--g-text)}
#gitl9 .g-scroll{border-top:1px solid var(--g-border);padding-top:6px}
#gitl9 .g-pane-intro{display:flex;align-items:center;gap:8px;padding:2px 2px 8px;border-bottom:1px solid var(--g-border);margin-bottom:8px}
#gitl9 .g-pane-symbol{flex:none;width:28px;height:28px;display:grid;place-items:center;background:var(--g-accent-bg);color:var(--g-accent);border:1px solid var(--g-border);border-radius:7px;font-size:16px}
#gitl9 .g-pane-intro b{font-size:13px}
#gitl9 .g-pane-intro .tiny{display:block;margin:0;font-size:10px}
#gitl9 .g-action-well{background:var(--g-panel);border:1px solid var(--g-border);border-radius:9px;padding:8px;margin:0 0 8px}
#gitl9 .g-action-well .g-section-label{margin:0 0 6px}
#gitl9 .g-controls{margin:0!important}
#gitl9 .g-controls button{min-height:38px}
#gitl9 .g-controls [data-a="play"]{border:1px solid var(--g-accent);background:var(--g-accent-bg);font-size:12px}
#gitl9 .g-controls [data-a="top"]{color:var(--g-muted)}
#gitl9 .g-accordion{border-color:var(--g-border);background:var(--g-panel)}
#gitl9 .g-accordion[open]{border-color:var(--g-accent);background:var(--g-bg)}
#gitl9 .g-accordion>summary{min-height:38px}
#gitl9 .g-status{border-left:3px solid var(--g-accent);box-shadow:none}
#gitl9 button:focus-visible,#gitl9 summary:focus-visible{outline:2px solid var(--g-accent);outline-offset:1px}
@media(max-width:520px){#gitl9{width:min(280px,calc(100vw - 12px))}#gitl9 .tabs{grid-template-columns:repeat(4,minmax(0,1fr))}#gitl9 .tabs button{font-size:11px}#gitl9 .head{min-height:38px}}
@media(prefers-reduced-motion:reduce){#gitl9 .head::before{animation:none!important;transform:none!important}}
`;
style.textContent += `
/* GITL_VISUAL_RESTORE_V2: UI-only; no additional Send path */
#gitl9{width:min(334px,calc(100vw - 12px));max-height:min(84dvh,calc(100dvh - 32px - env(safe-area-inset-bottom,0px)))}
#gitl9 .g-nav-label,#gitl9 .g-subnav{display:none!important}
#gitl9 nav.g-site-nav{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;margin:0 0 8px!important;padding:5px!important;background:var(--g-panel);border:1px solid var(--g-border);border-radius:10px}
#gitl9 nav.g-site-nav button{display:block!important;min-width:0!important;min-height:43px!important;padding:4px 1px!important;font-size:10px!important;font-weight:750!important;white-space:nowrap}
#gitl9 nav.g-site-nav button.on{background:var(--g-accent-bg)!important;border:1px solid var(--g-accent)!important;box-shadow:inset 0 -3px var(--g-accent)!important;color:var(--g-text)!important}
#gitl9 .g-status{border-radius:9px;margin:2px 0 7px;padding:8px;background:var(--g-panel)}
#gitl9 .g-accordion{margin:7px 0;padding:0 9px 8px;border-radius:10px}
#gitl9 .g-accordion>summary{min-height:44px;font-size:12px}
#gitl9 .g-accordion[open]>summary{color:var(--g-accent)}
#gitl9 label:has(>input[type="checkbox"]){display:flex!important;align-items:center!important;gap:8px!important;min-height:42px!important;padding:6px!important;flex-wrap:nowrap!important}
#gitl9 label:has(>input[type="checkbox"])::after{content:"OFF";margin-left:auto;font-size:9px;font-weight:800;color:var(--g-muted)}
#gitl9 label:has(>input[type="checkbox"]:checked)::after{content:"ON";color:var(--g-accent)}
#gitl9 input[type="checkbox"]{appearance:none;-webkit-appearance:none;flex:0 0 34px!important;width:34px!important;min-width:34px;height:20px;margin:0!important;padding:0!important;position:relative;border-radius:12px!important;border:1px solid var(--g-border)!important;background:var(--g-border)!important;cursor:pointer}
#gitl9 input[type="checkbox"]::before{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--g-text);transition:transform .13s ease}
#gitl9 input[type="checkbox"]:checked{background:var(--g-accent)!important;border-color:var(--g-accent)!important}
#gitl9 input[type="checkbox"]:checked::before{transform:translateX(14px);background:var(--g-bg)}
#gitl9 input[type="checkbox"]:focus-visible{outline:2px solid var(--g-accent)!important;outline-offset:2px}
#gitl9 .g-controls button{min-height:43px!important;font-weight:750}
#gitl9 .g-scroll{overscroll-behavior:contain}
@media(max-width:520px){#gitl9:not(.collapsed){width:min(280px,calc(100vw - 12px))!important;max-height:min(76dvh,calc(100dvh - 38px - env(safe-area-inset-bottom,0px)))}#gitl9 nav.g-site-nav button{min-height:42px!important;font-size:9px!important}}
@media(prefers-reduced-motion:reduce){#gitl9 input[type="checkbox"]::before{transition:none}}`;
style.textContent += `
/* Persistent loop status for mobile; visible in expanded panel and rail */
#gitl9 .g-steps{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 9px;margin:6px 0 5px;border-radius:9px;background:var(--g-panel);border:1px solid var(--g-accent);color:var(--g-text)}
#gitl9 .g-steps b{font-size:10px;letter-spacing:.1em}
#gitl9 .g-steps strong{font-size:17px;font-variant-numeric:tabular-nums;color:var(--g-accent);line-height:1.1}
#gitl9 .g-steps [data-live-state]{font-size:10px;font-weight:700}
#gitl9 .g-rail-progress{display:block;font-variant-numeric:tabular-nums;font-size:10px;font-weight:800;color:var(--g-text)}
#gitl9[data-running="1"] .g-steps{box-shadow:inset 3px 0 0 var(--g-accent)}
#gitl9 .g-status{display:block!important}
`;
style.textContent += `
#gitl9 .g-approval-mode{border:1px solid var(--g-accent);border-radius:12px;padding:10px;margin:8px 0 12px;background:var(--g-panel)}
#gitl9 .g-approval-toggle{display:flex!important;align-items:center;gap:10px;min-height:52px!important;cursor:pointer}
#gitl9 .g-approval-toggle input{flex:none;width:24px!important;height:24px!important}
#gitl9 .g-approval-toggle>span{display:flex;flex-direction:column;gap:2px;min-width:0}
#gitl9 .g-approval-toggle b{font-size:14px!important;color:var(--g-accent)}
#gitl9 .g-approval-warning{opacity:.76;line-height:1.45;margin-top:5px}
`;
style.textContent += `
/* AA state is not proof of a permission grant. */
#gitl9 .g-aa-badge{display:none;align-items:center;justify-content:center;margin-left:6px;padding:2px 5px;border-radius:6px;font:800 10px/1.4 system-ui,sans-serif;letter-spacing:.03em;color:#10231a;background:#66d492}
#gitl9 .g-aa-badge.is-on{display:inline-flex;animation:gitl-aa-pulse 1.5s ease-in-out infinite}
#gitl9 .g-aa-badge.is-limited{background:#fbbf24;color:#302100}
@keyframes gitl-aa-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.65;transform:scale(1.06)}}
@media(prefers-reduced-motion:reduce){#gitl9 .g-aa-badge.is-on{animation:none}}
`;
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
function applyPlacement() {
  panel.classList.remove('pos-dock-left','pos-dock-right','pos-header');
  panel.style.transform=''; panel.style.left=''; panel.style.right=''; panel.style.top=''; panel.style.bottom='';
  if (placement==='dock-left') { panel.classList.add('pos-dock-left'); panel.style.top='30%'; }
  else if (placement==='dock-right') { panel.classList.add('pos-dock-right'); panel.style.top='30%'; }
  else if (placement==='header-row') { panel.classList.add('pos-header'); }
  else if (placement==='composer-row') {
    const c=composer();
    if (c) {
      try {
        const r=c.getBoundingClientRect();
        panel.style.top=Math.max(8,Math.min(innerHeight-panel.offsetHeight-8,r.top-panel.offsetHeight-8))+'px';
        panel.style.right=Math.max(4,innerWidth-r.right)+'px';
      } catch(_) { panel.style.bottom='90px'; panel.style.right='8px'; }
    } else { panel.style.bottom='90px'; panel.style.right='8px'; }
  } else {
    const x=Number.isFinite(Number(floatPos.x)) ? Number(floatPos.x) : Math.max(6,innerWidth-panel.offsetWidth-10);
    const y=Number.isFinite(Number(floatPos.y)) ? Number(floatPos.y) : 58;
    panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,x))+'px';
    panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,y))+'px';
    panel.style.right='auto';
  }
}
function bindFloatDrag() {
  if (placement!=='float' || panelCollapsed) return;
  const h=panel.querySelector('[data-drag]'); if(!h) return;
  let sx=0,sy=0,ox=0,oy=0,drag=false;
  h.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,input,select')) return;
    const r=panel.getBoundingClientRect(); drag=true; sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
    try{h.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
  });
  h.addEventListener('pointermove',e=>{
    if(!drag)return;
    floatPos={x:Math.max(0,Math.min(innerWidth-panel.offsetWidth,ox+e.clientX-sx)),y:Math.max(0,Math.min(innerHeight-panel.offsetHeight,oy+e.clientY-sy))};
    panel.style.left=floatPos.x+'px'; panel.style.top=floatPos.y+'px'; panel.style.right='auto';
  });
  h.addEventListener('pointerup',e=>{ if(!drag)return; drag=false; GM_setValue('v9.floatPos',JSON.stringify(floatPos)); queueViewportFit(); try{h.releasePointerCapture(e.pointerId)}catch(_){} });
}
function saveQueueDraft() { GM_setValue('v9.queueDraft',JSON.stringify(queueDraft)); }
function fitPanelViewport() {
  if(panelCollapsed){panel.style.maxHeight='';return;}
  const vv=window.visualViewport;
  const bottom=Math.min(innerHeight,vv?vv.height+vv.offsetTop:innerHeight);
  let rect=panel.getBoundingClientRect();
  if(rect.top>bottom-142){panel.style.top=Math.max(6,Math.floor(bottom-148))+'px';rect=panel.getBoundingClientRect();}
  panel.style.maxHeight=Math.min(Math.max(130,Math.floor(bottom-rect.top-9)),Math.floor(bottom*.76))+'px';
}
let fitPending=false;
function queueViewportFit() {
  if(fitPending)return;fitPending=true;
  const run=()=>{fitPending=false;fitPanelViewport();};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run();
}
window.addEventListener('resize',queueViewportFit,{passive:true});
window.visualViewport?.addEventListener('resize',queueViewportFit,{passive:true});
function updateLiveStatus() {
  if(!liveStatusNodes)return;
  const running=S.mode==='RUNNING'?'1':'0';
  if(panel.dataset.running!==running)panel.dataset.running=running;
  const prog=progressSummary();
  const workflow=prog.stages ?
    'Workflow: '+prog.workflow+' · '+(prog.stage ? 'stage '+prog.stage.step+'/'+prog.stage.total : prog.stages+' stages · waiting for stage')
    : 'Manual workflow';
  const set=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  set(liveStatusNodes.mode,S.mode);
  set(liveStatusNodes.round,'round '+S.round+'/'+S.max);
  set(liveStatusNodes.step,S.round+' / '+S.max);
  set(liveStatusNodes.state,S.mode==='RUNNING'?'Active':S.mode==='PAUSED'?'Paused':S.mode==='IDLE'?'Not started':S.mode);
  set(liveStatusNodes.rail,S.round+'/'+S.max);
  set(liveStatusNodes.detail,S.detail);
  set(liveStatusNodes.workflow,workflow);
  const pct=prog.roundPct+'%';
  if(liveStatusNodes.bar&&liveStatusNodes.bar.style.width!==pct)liveStatusNodes.bar.style.width=pct;
  if(liveStatusNodes.orbit&&liveStatusNodes.orbit.style.getPropertyValue('--g-pct')!==pct)liveStatusNodes.orbit.style.setProperty('--g-pct',pct);
}

/* Session-only tool-permission click automation: explicit operator opt-in. */
let approvalWatchOn = false;
let autoApproveOn = false;
let approvalSeenCount = 0;
let approvalClickCount = 0;
const approvalSeenCards = new WeakSet();
const approvalClickedButtons = new WeakSet();
let approvalScanScheduled = false;
let approvalObserver = null;
let approvalLastClickAt = 0;
let approvalOpacityWarned = false;
function inaccessibleChatWidgets() {
  // An opaque component is a warning, not proof of a pending approval.
  return Array.from(document.querySelectorAll('dil-renderer')).some(host => !host.shadowRoot);
}
function approvalCardCandidates() {
  const found = [];
  for (const heading of document.querySelectorAll('h3')) {
    const title = (heading.textContent || '').trim();
    if (!/\bwants to use\b.{1,180}\bto run\b/i.test(title)) continue;
    let card = heading.parentElement;
    for (let depth = 0; card && depth < 6; depth++, card = card.parentElement) {
      if (card === panel || panel.contains(card)) break;
      const buttons = Array.from(card.querySelectorAll('button'));
      const names = buttons.map(b => (b.textContent || '').trim());
      if (names.filter(n => n === 'Approve').length === 1 &&
          names.filter(n => n === 'Cancel').length === 1) {
        found.push(card);
        break;
      }
    }
  }
  return [...new Set(found)];
}
function approvalScan() {
  if (!approvalWatchOn) return;
  if (autoApproveOn && inaccessibleChatWidgets() && !approvalOpacityWarned) {
    approvalOpacityWarned = true;
    S.detail = 'AA LIMITED: ChatGPT components are opaque. Closed Shadow DOM approval buttons cannot be accessed here.';
    render();
  }
  for (const card of approvalCardCandidates()) {
    if (!approvalSeenCards.has(card)) {
      approvalSeenCards.add(card);
      approvalSeenCount++;
      if (!autoApproveOn) {
        S.detail = 'Tool approval needed — review the ChatGPT permission card.';
        notify('Ghost: approval needed', 'ChatGPT is waiting for your permission decision.', 'notice');
        render();
      }
    }
    if (!autoApproveOn || !card.isConnected) continue;
    const buttons = Array.from(card.querySelectorAll('button'));
    const approve = buttons.find(b => (b.textContent || '').trim() === 'Approve');
    if (!approve || approve.disabled || approvalClickedButtons.has(approve)) continue;
    if (Date.now() - approvalLastClickAt < 350) {
      setTimeout(scheduleApprovalScan, 380);
      break;
    }
    approvalClickedButtons.add(approve);  // Never click the same button twice.
    approvalLastClickAt = Date.now();
    try {
      approve.click(); // Operator-enabled browser UI action, never Ghost Play/Send.
      approvalClickCount++;
      S.detail = 'Auto-Approve clicked a permission prompt ('+approvalClickCount+' attempt'+(approvalClickCount===1?'':'s')+').';
      render();
    } catch (error) {
      autoApproveOn = false;
      S.detail = 'Auto-Approve stopped: click failed. Review the permission prompt.';
      render();
    }
    setTimeout(scheduleApprovalScan, 400);
    break;
  }
}
function scheduleApprovalScan() {
  if (!approvalWatchOn || approvalScanScheduled) return;
  approvalScanScheduled = true;
  setTimeout(() => { approvalScanScheduled = false; approvalScan(); }, 50);
}
function setApprovalWatch(enabled) {
  approvalWatchOn = Boolean(enabled);
  if (!approvalWatchOn) autoApproveOn = false;
  if (approvalObserver) { approvalObserver.disconnect(); approvalObserver = null; }
  if (approvalWatchOn) {
    approvalObserver = new MutationObserver(scheduleApprovalScan);
    approvalObserver.observe(document, { childList:true, subtree:true, characterData:true });
    scheduleApprovalScan();
  }
  S.detail = approvalWatchOn ? 'Approval detection ON.' : 'Approval detection OFF.';
  render();
}
function setAutoApprove(enabled) {
  const chatgpt = location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com';
  autoApproveOn = Boolean(enabled) && chatgpt;
  if (autoApproveOn && !approvalWatchOn) setApprovalWatch(true);
  if (!autoApproveOn) approvalOpacityWarned = false;
  S.detail = autoApproveOn
    ? 'AA ON: monitoring accessible approval cards. Closed Shadow DOM is inaccessible.'
    : enabled ? 'Auto-Approve is available on ChatGPT only.' : 'Auto-Approve OFF.';
  render();
  if (autoApproveOn) scheduleApprovalScan();
}

function render() {
  const aaLimited = autoApproveOn && inaccessibleChatWidgets();
  const aaTitle = aaLimited
    ? 'AA ON but limited: some ChatGPT components conceal their approval buttons.'
    : 'AA ON: monitoring accessible approval cards; click attempts are not confirmed grants.';
  const wasCollapsed=panel.classList.contains('collapsed');
  panel.classList.toggle('collapsed',panelCollapsed);
  panel.classList.toggle('more-open',mobileMoreOpen);
  panel.classList.toggle('status-open',statusExpanded);
  panel.dataset.running=S.mode==='RUNNING'?'1':'0';
  const moreLabels={flow:'Flow',prompt:'Personas',aoa:'AoA',settings:'Setup'};
  const moreActive=!!moreLabels[S.tab];
  const markup = `
    <div class="rail" data-a="expand" title="Expand Ghost"><span class="ghost">👻</span><span class="arrow">◀</span><span class="mini">GHOST</span><span class="g-aa-badge ${autoApproveOn?'is-on':''} ${aaLimited?'is-limited':''}" title="${esc(aaTitle)}">${aaLimited?'AA!':'AA'}</span><span class="g-rail-progress" data-rail-round>0/25</span></div>
    <div class="head drag" data-drag><span class="brand"><span class="g-orbit" data-live-orbit></span> GHOST <span class="g-aa-badge ${autoApproveOn?'is-on':''} ${aaLimited?'is-limited':''}" title="${esc(aaTitle)}">${aaLimited?'AA!':'AA'}</span></span><span class="headtools"><button class="collapsebtn" data-a="collapse" title="Minimize Ghost to side" aria-label="Minimize Ghost">▶</button><button class="helpbtn" data-a="help" aria-label="Help">?</button><span class="meta">${esc(HOST.id)} · ${VER}</span></span></div>
    <div class="status g-status" data-live-status>
      <div class="status-top"><b data-live-mode></b><span data-live-round></span><button data-a="status-toggle" aria-label="Expand or collapse status detail" title="Status details">▾</button></div>
      <div class="status-text" data-live-detail></div>
      <div class="g-steps" aria-label="Ghost loop progress"><b>LOOPS</b><strong data-live-step>0 / 25</strong><span data-live-state>Not started</span></div><div class="progline"><span data-live-bar></span></div>
      <div class="tiny" data-live-workflow></div>
    </div>

    <div class="g-nav-label">NAVIGATION</div>
    <nav class="tabs g-site-nav" aria-label="Ghost sections"><button type="button" data-tab="play" class="${S.tab==='play'?'on':''}" aria-current="${S.tab==='play'?'page':'false'}">▶ Run</button><button type="button" data-tab="auto" class="${S.tab==='auto'?'on':''}" aria-current="${S.tab==='auto'?'page':'false'}">▤ Auto</button><button type="button" data-tab="flow" class="${S.tab==='flow'?'on':''}" aria-current="${S.tab==='flow'?'page':'false'}">⇢ Flow</button><button type="button" data-tab="prompt" class="${S.tab==='prompt'?'on':''}" aria-current="${S.tab==='prompt'?'page':'false'}">◈ Personas</button><button type="button" data-tab="aoa" class="${S.tab==='aoa'?'on':''}" aria-current="${S.tab==='aoa'?'page':'false'}">✧ AoA</button><button type="button" data-tab="export" class="${S.tab==='export'?'on':''}" aria-current="${S.tab==='export'?'page':'false'}">⇩ Export</button><button type="button" data-tab="settings" class="${S.tab==='settings'?'on':''}" aria-current="${S.tab==='settings'?'page':'false'}">⚙ Setup</button></nav>
    <div class="g-scroll" role="region" aria-label="Ghost controls" tabindex="0">
    <div class="pane ${S.tab==='play'?'show':''}" data-pane="play">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">▶</span><div><b>Run</b><span class="tiny">Your conversation controls</span></div></div>
      ${quickStartOpen ? '<div class="helpbox"><b>Quick Start</b><br>1. Type your task in the chat.<br>2. Press ▶ Play.<br>3. Ghost continues only through the one-Send Play pathway.<br><button data-a="quick-done" style="margin-top:6px">Got it</button></div>' : ''}
      ${helpOpen ? '<div class="helpbox"><b>What the controls do</b><br><b>Play</b> starts/resumes Ghost. <b>Stop</b> stops Ghost automation. <b>Page</b> reloads the host page. <b>Top</b> finds the first loaded prompt and loads older history when possible. <b>AoA</b> chooses external protocols. <b>Export</b> saves the conversation. <b>Settings</b> changes appearance only.</div>' : ''}
      <div class="g-action-well"><div class="g-section-label">RUN CONTROLS</div><div class="row transport g-controls" role="group" aria-label="Ghost run controls"><button class="on" data-a="play">▶ Play</button><button data-a="pause">Ⅱ Pause</button><button class="stop" data-a="stop">■ End</button><button data-a="top" ${S.mode==='RUNNING'||S.sending||S.watchdogBusy||S.topBusy?'disabled':''}>↑ Top</button></div></div>
      <details class="g-accordion" data-g-acc="run-options"><summary>Modes &amp; posture</summary>
      <div class="sectionTitle">Run mode</div>
      <div class="pillrow"><button data-mode="loop" class="${runMode==='loop'?'on':''}">Loop</button><button data-mode="plan" class="${runMode==='plan'?'on':''}">Plan First</button><button data-mode="roadmap" class="${runMode==='roadmap'?'on':''}">Roadmap</button></div>
      <div class="sectionTitle">Thinking posture</div>
      <div class="pillrow">${Object.entries(POSTURES).map(([id,p])=>'<button data-posture-btn="'+id+'" class="'+(postureId===id?'on':'')+'">'+esc(p.label)+'</button>').join('')}</div>
      </details>
      <details class="g-accordion" data-g-acc="run-advanced"><summary>Limits &amp; diagnostics</summary><div class="row" style="margin-top:5px"><input data-max aria-label="Max rounds" type="number" min="1" max="100" value="${S.max}"><button data-a="report">Copy report</button></div></details>
      <div class="tiny">Core only: final control line → one Send → repeat. Stall watchdog interrupts only after 5 min quiet + 2 min grace.</div>
    </div>
    <div class="pane ${S.tab==='auto'?'show':''}" data-pane="auto">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">▤</span><div><b>Auto</b><span class="tiny">Prompt queues and roadmap</span></div></div>
      <div class="g-approval-mode" aria-label="Ghost Auto-Approve controls">
        <label class="g-approval-toggle"><input type="checkbox" data-auto-approve ${autoApproveOn?'checked':''}><span><b>Auto-Approve · ${autoApproveOn?'ON':'OFF'}</b><span class="tiny">Automatically press Approve when a ChatGPT tool-permission popup appears.</span></span></label>
        <div class="tiny">AA status: ${autoApproveOn?(aaLimited?'LIMITED · ChatGPT may hide approval controls.':'SCANNING · Awaiting an accessible permission card.'):'OFF'} · Click attempts: ${approvalClickCount} · Prompts detected: ${approvalSeenCount}</div>
        <div class="tiny g-approval-warning">OFF by default. When ON, actions may access private data or modify connected services. Enable only for a task and tools you trust. Ghost cannot guarantee a click is accepted by ChatGPT.</div>
      </div>
      <details class="g-accordion" data-g-acc="auto-help"><summary>How Auto works</summary>      <div class="helpbox"><b>Auto / walk-away</b><br><b>Your queue:</b> preset exact steps. <b>AI Roadmap:</b> choose Roadmap on Run; the AI writes the plan and Ghost captures only the exact numbered block, then injects one stored step at a time.</div></details>
      ${roadmapRun.capture?'<div class="stage act">Waiting for the AI roadmap block…</div>':roadmapRun.steps.map((q,i)=>'<div class="stage '+(roadmapRun.active&&i===roadmapRun.index?'act':'')+'">'+(i<roadmapRun.index?'✓ ':i===roadmapRun.index?'▶ ':'· ')+(i+1)+'. '+esc(q)+'</div>').join('')}
      <div class="sectionTitle">Prompt queue</div>
      ${queueDraft.map((q,i)=>'<div class="qrow"><span class="qnum">'+(i+1)+'</span><input type="text" data-q="'+i+'" value="'+esc(q)+'" placeholder="Step '+(i+1)+'"><button class="qdel" data-qdel="'+i+'">×</button></div>').join('')}
      <div class="row"><button data-a="q-add">＋ Step</button><button data-a="q-run" class="on">▶ Run queue</button></div>
    </div>
    <div class="pane ${S.tab==='flow'?'show':''}" data-pane="flow">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">⇢</span><div><b>Flow</b><span class="tiny">Guided workflows</span></div></div>
      <label style="display:block"><span class="tiny">Workflow</span><select data-flow-workflow style="width:100%;margin-top:3px">${Object.entries(allWorkflows()).map(([id,w])=>'<option value="'+esc(id)+'" '+(workflowId===id?'selected':'')+'>'+esc(w.label)+(w.custom?' · custom':'')+'</option>').join('')}</select></label>
      <div class="tiny">${esc(allWorkflows()[workflowId]?.desc||'')}</div>
      <div class="row" style="margin-top:6px"><button data-a="flow-run" class="on" ${!allWorkflows()[workflowId]?.stages?.length?'disabled':''}>▶ Start workflow</button><label><input type="checkbox" data-flow-pause ${flowPauseBetween?'checked':''}>Pause between</label></div>
      ${(allWorkflows()[workflowId]?.stages||[]).map((q,i)=>'<div class="stage '+(flowRun.active&&i===flowRun.index?'act':'')+'"><div class="row"><div style="flex:3">'+(i+1)+'. '+esc(q)+'</div><button data-flow-insert="'+i+'">Insert</button></div></div>').join('')}
      <div class="tiny">Workflow stages are stored prompt text. Ghost advances only the stored index after the exact terminal marker.</div>
    </div>
    <div class="pane ${S.tab==='prompt'?'show':''}" data-pane="prompt">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">◈</span><div><b>Personas</b><span class="tiny">AI behavior and committee</span></div></div>
      <div class="row"><label><input type="checkbox" data-committee ${committeeOn?'checked':''}>Committee</label><label><input type="checkbox" data-committee-each ${committeePerTask?'checked':''}>Every step</label><label><input type="checkbox" data-committee-review ${committeeFinalReview?'checked':''}>Final review</label></div>
      ${committeeOn?'<div class="personGrid">'+Object.entries(allPersonas()).filter(([id])=>id!=='none').map(([id,p])=>'<label><input type="checkbox" data-persona-check="'+esc(id)+'" '+(personaIds.includes(id)?'checked':'')+'>'+esc(p.label)+(p.custom?' ★':'')+'</label>').join('')+'</div>':'<label style="display:block;margin-top:5px"><span class="tiny">Persona</span><select data-persona style="width:100%;margin-top:3px">'+Object.entries(allPersonas()).map(([id,p])=>'<option value="'+esc(id)+'" '+(personaId===id?'selected':'')+'>'+esc(p.label)+(p.custom?' · custom':'')+'</option>').join('')+'</select></label>'}
      <label style="display:block;margin-top:5px"><span class="tiny">Workflow</span><select data-workflow style="width:100%;margin-top:3px">${Object.entries(allWorkflows()).map(([id,w])=>'<option value="'+esc(id)+'" '+(workflowId===id?'selected':'')+'>'+esc(w.label)+(w.custom?' · custom':'')+'</option>').join('')}</select></label>
      <label style="display:block;margin-top:5px"><span class="tiny">Posture</span><select data-posture style="width:100%;margin-top:3px">${Object.entries(POSTURES).map(([id,p])=>'<option value="'+id+'" '+(postureId===id?'selected':'')+'>'+esc(p.label)+'</option>').join('')}</select></label>
      <div class="tiny">${esc(allWorkflows()[workflowId]?.desc||'')} These settings change prompt guidance only; Play remains the sole Send authority.</div>
      <button data-a="workshop" style="width:100%;margin-top:6px">Workshop ${workshopOpen?'▴':'▾'}</button>
      ${workshopOpen?'<div class="helpbox"><b>Custom personas/workflows</b><br>Paste a Ghost Workshop JSON bundle. Imports are additive; built-ins cannot be replaced.<textarea data-workshop-text rows="5" placeholder="{ &quot;schema&quot;: &quot;gitl-workshop/1&quot;, ... }" style="width:100%;margin-top:6px"></textarea><div class="row" style="margin-top:5px"><button data-a="workshop-import">Import</button><button data-a="workshop-copy">Copy custom JSON</button></div></div>':''}
    </div>
    <div class="pane ${S.tab==='aoa'?'show':''}" data-pane="aoa">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">✧</span><div><b>Agents of AI</b><span class="tiny">Protocol options</span></div></div>
      <div class="grid">${Object.entries(ACT).map(([k,v])=>`<label><input type="checkbox" data-act="${k}" ${ON[k]?'checked':''}>${esc(v[0])}</label>`).join('')}</div>
      <div class="tiny">Optional protocols stay external. Ghost points the AI to their canonical source; Play transport does not change.</div>
      <input data-custom type="text" placeholder="AoA path, e.g. personas/compass.md" value="${esc(custom)}" style="margin-top:6px">
    </div>
    <div class="pane ${S.tab==='export'?'show':''}" data-pane="export">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">⇩</span><div><b>Export</b><span class="tiny">Save conversation and projects</span></div></div>
      <div class="g-action-well"><div class="g-section-label">SAVE CONVERSATION</div><div class="row"><button data-a="copy">Copy MD</button><button data-a="md" class="on">Save MD</button><button data-a="json">Save JSON</button></div></div>
      <details class="g-accordion" data-g-acc="export-advanced"><summary>Advanced export</summary>
      <label style="margin-top:6px"><input type="checkbox" data-export-raw ${exportRaw?'checked':''}>Include raw platform JSON / Codex rendered HTML (may contain private data) in saved JSON</label></details>
      <details class="g-accordion" data-g-acc="export-backup"><summary>Page backup</summary><div class="sectionTitle">Works without chat detection</div>
      <div class="row"><button data-page-backup="html">Save Page HTML</button><button data-page-backup="diagnostic">Diagnostic JSON</button></div>
      <div class="tiny">Read-only page snapshot with tables and accessible frames. No images, SVG or scripts. URLs and inputs are sanitized. Review files before sharing; visible page text may still be private.</div>
      </details>
      <details class="g-accordion" data-g-acc="export-vault"><summary>Project Vault · across AI sites</summary>
      <div class="row"><input data-vault-name type="text" placeholder="Project name" maxlength="80"><button data-vault-action="create">Create</button></div>
      <select data-vault-select style="width:100%;margin-top:5px"><option value="">Choose project…</option>${ProjectVault.list().map(p=>'<option value="'+esc(p.id)+'" '+(p.id===vaultProjectId?'selected':'')+'>'+esc(p.name)+' ('+p.count+' chats)</option>').join('')}</select>
      <div class="row" style="margin-top:5px"><button data-vault-action="save" ${!vaultProjectId||vaultActionBusy?'disabled':''}>Add chat</button><button data-vault-action="md" ${!vaultProjectId||vaultActionBusy?'disabled':''}>Project MD</button><button data-vault-action="json" ${!vaultProjectId||vaultActionBusy?'disabled':''}>Project JSON</button></div>
      ${(()=>{const u=ProjectVault.usage(vaultProjectId);if(!u)return '';const percent=Math.min(100,Math.round(u.bytes/u.limit*100));return '<div class="tiny">Batch '+u.batch+' · '+(u.bytes/1000000).toFixed(2)+' / '+(u.limit/1000000).toFixed(0)+' MB · '+percent+'%</div><div role="progressbar" aria-label="Batch storage" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" style="background:var(--g-border);height:8px;border-radius:5px;overflow:hidden"><span style="display:block;background:var(--g-accent);height:100%;width:'+percent+'%"></span></div>'})()}
      ${ProjectVault.get(vaultProjectId)?.pending?'<div class="row" style="margin-top:5px"><button data-vault-action="retry">Download again</button><button data-vault-action="confirm">Confirm saved</button></div><div class="tiny">Only confirm after you see the downloaded file. Nothing is erased beforehand.</div>':''}
      <div class="tiny">Chats are saved locally only when you tap Add chat. Visit another supported AI site to continue collecting. Export a backup before clearing browser data. Partial captures stay labeled partial; Play is unchanged.</div></details>
      <details class="g-accordion" data-g-acc="export-help"><summary>About exports</summary>      <div class="tiny">Ghost uses the platform archive first when supported. Visible-page fallback is clearly marked as possibly incomplete. Platform-visible reasoning is included when exposed.</div></details>
    </div>
    <div class="pane ${S.tab==='settings'?'show':''}" data-pane="settings">
      <div class="g-pane-intro"><span class="g-pane-symbol" aria-hidden="true">⚙</span><div><b>Setup</b><span class="tiny">Appearance and preferences</span></div></div>
      <details class="g-accordion" data-g-acc="settings-approval"><summary>Approval controls · ${autoApproveOn?'AUTO ON':approvalWatchOn?'WATCH ON':'OFF'}</summary>
      <label><input type="checkbox" data-approval-watch ${approvalWatchOn?'checked':''}>Detect tool permission requests</label>
      <div class="tiny">Auto-Approve ON/OFF is in the Auto tab. Detected: ${approvalSeenCount} · Clicks attempted: ${approvalClickCount}.</div>
      </details>
      <details class="g-accordion" data-g-acc="settings-look" open><summary>Appearance</summary>
      <div class="row"><label style="display:block"><span class="tiny">Skin</span><select data-skin style="width:100%;margin-top:3px">${Object.entries(SKINS).map(([id,s])=>'<option value="'+id+'" '+(skinId===id?'selected':'')+'>'+esc(s.name)+'</option>').join('')}</select></label></div>
      <div class="tiny">Accent</div>
      <div class="swatches">${Object.entries(ACCENTS).map(([id,color])=>'<button data-accent="'+id+'" class="'+(accentId===id?'on':'')+'" title="'+id+'" style="'+(color?'background:'+color:'')+'">'+(id==='auto'?'A':'')+'</button>').join('')}</div>
      </details><details class="g-accordion" data-g-acc="settings-position"><summary>Position &amp; attachment</summary>
      <div class="posgrid"><button data-place="dock-left" class="${placement==='dock-left'?'on':''}" title="Attach left">◧L</button><button data-place="dock-right" class="${placement==='dock-right'?'on':''}" title="Attach right">R◨</button><button data-place="float" class="${placement==='float'?'on':''}" title="Floating draggable">↔</button><button data-place="composer-row" class="${placement==='composer-row'?'on':''}" title="Attach near composer">⌨</button><button data-place="header-row" class="${placement==='header-row'?'on':''}" title="Attach near header">▔</button></div>
      </details><details class="g-accordion" data-g-acc="settings-extra"><summary>Extras &amp; help</summary>
      <div class="row" style="margin-top:6px"><button data-a="show-quick">Show Quick Start</button><button data-a="reset-look">Reset look</button></div>
      <label style="margin-top:6px"><input type="checkbox" data-sound ${soundOn?'checked':''}>Sound cues</label>
      <label style="margin-top:5px"><input type="checkbox" data-notify ${notifyOn?'checked':''}>Notifications</label>
      <div class="row" style="margin-top:5px"><button data-a="test-sound">Test sound</button><button data-a="test-notify">Test notification</button></div>
      <div class="tiny">Feedback is optional and status-only. It never sends a prompt or changes the Ghost loop.</div></details>
    </div>
    </div>`;
  const oldScroll=panel.querySelector('.g-scroll')?.scrollTop||0;
  const previousTab=panel.dataset.renderedTab;
  if(lastPanelMarkup===markup&&panel.isConnected){
    updateLiveStatus();
    if(wasCollapsed!==panelCollapsed)fitPanelViewport();
    return;
  }
  for(const detail of panel.querySelectorAll('details[data-g-acc]'))uiAccordionStates.set(detail.dataset.gAcc,detail.open);
  panel.innerHTML=trustedHTML(markup);
  lastPanelMarkup=markup;
  liveStatusNodes={
    mode:panel.querySelector('[data-live-mode]'),round:panel.querySelector('[data-live-round]'),
    detail:panel.querySelector('[data-live-detail]'),workflow:panel.querySelector('[data-live-workflow]'),
    bar:panel.querySelector('[data-live-bar]'),orbit:panel.querySelector('[data-live-orbit]'),
    step:panel.querySelector('[data-live-step]'),state:panel.querySelector('[data-live-state]'),rail:panel.querySelector('[data-rail-round]')
  };
  updateLiveStatus();
  for(const detail of panel.querySelectorAll('details[data-g-acc]')){
    if(uiAccordionStates.has(detail.dataset.gAcc))detail.open=uiAccordionStates.get(detail.dataset.gAcc);
    detail.addEventListener('toggle',()=>uiAccordionStates.set(detail.dataset.gAcc,detail.open));
  }
  panel.dataset.renderedTab=S.tab;
  if(previousTab===S.tab){const scroller=panel.querySelector('.g-scroll');if(scroller)scroller.scrollTop=oldScroll;}
  panel.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { S.tab=btn.dataset.tab; mobileMoreOpen=!!({flow:1,prompt:1,aoa:1,settings:1})[S.tab]; GM_setValue('v9.tab',S.tab); render(); }));
  panel.querySelector('[data-a="more-toggle"]')?.addEventListener('click',()=>{mobileMoreOpen=!mobileMoreOpen;render();});
  panel.querySelector('[data-a="status-toggle"]')?.addEventListener('click',()=>{statusExpanded=!statusExpanded;panel.classList.toggle('status-open',statusExpanded);});
  panel.querySelector('[data-a="collapse"]')?.addEventListener('click', () => { panelCollapsed = true; GM_setValue('v9.panelCollapsed', true); render(); });
  panel.querySelector('[data-a="expand"]')?.addEventListener('click', () => { panelCollapsed = false; GM_setValue('v9.panelCollapsed', false); render(); });
  panel.querySelector('[data-a="expand"]')?.addEventListener('pointerdown', e => e.preventDefault());
  panel.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => { if (S.mode==='RUNNING') return; runMode=btn.dataset.mode; GM_setValue('v9.runMode',runMode); render(); }));
  panel.querySelectorAll('[data-posture-btn]').forEach(btn => btn.addEventListener('click', () => { postureId=POSTURES[btn.dataset.postureBtn]?btn.dataset.postureBtn:'standard'; GM_setValue('v9.posture',postureId); render(); }));
  panel.querySelector('[data-a="pause"]')?.addEventListener('click', () => pause('Paused by you.'));
  panel.querySelector('[data-a="play"]')?.addEventListener('click', () => play().catch(e => fail('PLAY', String(e?.message || e))));
  panel.querySelector('[data-a="stop"]')?.addEventListener('click', stop);
  panel.querySelector('[data-a="reload"]')?.addEventListener('click', () => location.reload());
  panel.querySelector('[data-a="help"]')?.addEventListener('click', () => { helpOpen = !helpOpen; if (helpOpen) S.tab = 'play'; render(); });
  panel.querySelector('[data-a="quick-done"]')?.addEventListener('click', () => { quickStartOpen = false; GM_setValue('v9.quickStartSeen', true); S.detail = 'Quick Start hidden. You can reopen it in Settings.'; render(); });
  panel.querySelector('[data-a="show-quick"]')?.addEventListener('click', () => { quickStartOpen = true; helpOpen = false; S.tab = 'play'; render(); });
  panel.querySelector('[data-a="reset-look"]')?.addEventListener('click', () => { skinId = 'classic'; accentId = 'auto'; GM_setValue('v9.skin', skinId); GM_setValue('v9.accent', accentId); applyAppearance(); S.detail = 'Appearance reset.'; render(); });
  panel.querySelector('[data-approval-watch]')?.addEventListener('change', e => setApprovalWatch(!!e.target.checked));
  panel.querySelector('[data-auto-approve]')?.addEventListener('change', e => setAutoApprove(!!e.target.checked));
  panel.querySelector('[data-sound]')?.addEventListener('change', e => { soundOn = !!e.target.checked; GM_setValue('v9.soundOn', soundOn); S.detail = soundOn ? 'Sound cues enabled.' : 'Sound cues off.'; render(); });
  panel.querySelector('[data-notify]')?.addEventListener('change', e => { notifyOn = !!e.target.checked; GM_setValue('v9.notifyOn', notifyOn); S.detail = notifyOn ? 'Notifications enabled.' : 'Notifications off.'; render(); });
  panel.querySelector('[data-a="test-sound"]')?.addEventListener('click', () => { const prior=soundOn; soundOn=true; const ok=playCue('complete'); soundOn=prior; S.detail = ok ? 'Sound test played.' : 'Sound test was blocked by this browser.'; render(); });
  panel.querySelector('[data-a="test-notify"]')?.addEventListener('click', () => { if (!notifyOn) { S.detail='Turn Notifications on first.'; render(); return; } const ok=notify('Ghost notification test','Notifications are working.','notice'); S.detail = ok ? 'Notification sent.' : 'Notification unavailable in this runtime.'; render(); });
  panel.querySelector('[data-skin]')?.addEventListener('change', e => { skinId = SKINS[e.target.value] ? e.target.value : 'classic'; GM_setValue('v9.skin', skinId); applyAppearance(); S.detail = SKINS[skinId].name + ' skin applied.'; render(); });
  panel.querySelectorAll('[data-accent]').forEach(btn => btn.addEventListener('click', () => { accentId = btn.dataset.accent in ACCENTS ? btn.dataset.accent : 'auto'; GM_setValue('v9.accent', accentId); applyAppearance(); S.detail = 'Accent updated.'; render(); }));
  const topButton = panel.querySelector('[data-a="top"]');
  topButton?.addEventListener('pointerdown', e => e.preventDefault());
  topButton?.addEventListener('click', () => goTop().catch(error => { S.detail = 'Could not reach the top safely.'; log('top-navigation-error', { message: String(error?.message || error) }); render(); }));
  panel.querySelectorAll('[data-q]').forEach(inp => inp.addEventListener('change', () => { const i=Number(inp.dataset.q); queueDraft[i]=String(inp.value||'').slice(0,4000); saveQueueDraft(); }));
  panel.querySelectorAll('[data-qdel]').forEach(btn => btn.addEventListener('click', () => { queueDraft.splice(Number(btn.dataset.qdel),1); if(!queueDraft.length) queueDraft=['']; saveQueueDraft(); render(); }));
  panel.querySelector('[data-a="q-add"]')?.addEventListener('click', () => { if(queueDraft.length<30){ queueDraft.push(''); saveQueueDraft(); render(); } });
  panel.querySelector('[data-a="q-run"]')?.addEventListener('click', () => startQueueRun().catch(e => fail('QUEUE',String(e?.message||e))));
  panel.querySelector('[data-flow-workflow]')?.addEventListener('change', e => { workflowId=allWorkflows()[e.target.value]?e.target.value:'none'; GM_setValue('v9.workflow',workflowId); flowRun.active=false; render(); });
  panel.querySelector('[data-flow-pause]')?.addEventListener('change', e => { flowPauseBetween=!!e.target.checked; GM_setValue('v9.flowPauseBetween',flowPauseBetween); });
  panel.querySelector('[data-a="flow-run"]')?.addEventListener('click', () => startFlowRun().catch(e => fail('FLOW',String(e?.message||e))));
  panel.querySelectorAll('[data-flow-insert]').forEach(btn => btn.addEventListener('click', async () => { if(S.mode==='RUNNING'||S.sending) return; const wf=allWorkflows()[workflowId]; const i=Number(btn.dataset.flowInsert); const text=wf?.stages?.[i]; if(!text) return; const staged=await setComposerText(withPromptFeatures(text,{includeWorkflow:false,repeatPersona:true})); S.detail=staged.ok?'Stage inserted into composer.':'Could not insert stage.'; render(); }));
  panel.querySelector('[data-committee]')?.addEventListener('change', e => { committeeOn=!!e.target.checked; GM_setValue('v9.committeeOn',committeeOn); render(); });
  panel.querySelector('[data-committee-each]')?.addEventListener('change', e => { committeePerTask=!!e.target.checked; GM_setValue('v9.committeePerTask',committeePerTask); });
  panel.querySelector('[data-committee-review]')?.addEventListener('change', e => { committeeFinalReview=!!e.target.checked; GM_setValue('v9.committeeFinalReview',committeeFinalReview); });
  panel.querySelectorAll('[data-persona-check]').forEach(box => box.addEventListener('change', () => { const id=box.dataset.personaCheck; if(box.checked&&!personaIds.includes(id)) personaIds.push(id); if(!box.checked) personaIds=personaIds.filter(x=>x!==id); personaIds=personaIds.slice(0,8); GM_setValue('v9.personaIds',JSON.stringify(personaIds)); render(); }));
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
  panel.querySelectorAll('[data-page-backup]').forEach(btn=>btn.addEventListener('click',()=>doPageBackup(btn.dataset.pageBackup)));
  panel.querySelector('[data-vault-select]')?.addEventListener('change',e=>{vaultProjectId=e.target.value;GM_setValue('v9.vault.active',vaultProjectId);render();});
  panel.querySelectorAll('[data-vault-action]').forEach(btn=>btn.addEventListener('click',()=>{
    runVaultAction(btn.dataset.vaultAction,panel.querySelector('[data-vault-name]')?.value||'');
  }));
  panel.querySelector('[data-export-raw]')?.addEventListener('change', e => { exportRaw = !!e.target.checked; GM_setValue('v9.exportRaw', exportRaw); S.detail = exportRaw ? 'Raw source data enabled for saved JSON (may contain private data).' : 'Raw source data is off.'; render(); });
  panel.querySelector('[data-max]')?.addEventListener('change', e => { S.max = Math.max(1, Math.min(100, Number(e.target.value) || 25)); GM_setValue('v9.max', S.max); render(); });
  panel.querySelectorAll('[data-act]').forEach(box => box.addEventListener('change', () => { ON[box.dataset.act] = box.checked; GM_setValue(`v9.act.${box.dataset.act}`, box.checked); S.detail = `${ACT[box.dataset.act][0]} ${box.checked?'enabled':'disabled'} for the next injected prompt.`; render(); }));
  panel.querySelector('[data-custom]')?.addEventListener('change', e => { custom = String(e.target.value || '').trim(); GM_setValue('v9.custom', custom); S.detail = custom ? 'Custom AoA path saved.' : 'Custom AoA path cleared.'; render(); });
  panel.querySelectorAll('[data-place]').forEach(btn => btn.addEventListener('click', () => { placement=btn.dataset.place; GM_setValue('v9.placement',placement); if(!placement.startsWith('dock')) panelCollapsed=false; render(); }));
  applyPlacement();
  bindFloatDrag();
  queueViewportFit();
}

// Recover the EXISTING panel when a host SPA replaces its body after hydration.
// Never boot a second Ghost instance, rerender, or touch the one-Send transport.
let ghostMountPending = false;
function ensureGhostMounted(reason = 'lifecycle') {
  const host = document.body || document.documentElement;
  if (!host) return;
  let repaired = false;
  if (!style.isConnected) {
    document.documentElement.appendChild(style);
    repaired = true;
  }
  if (!panel.isConnected || panel.parentNode !== host) {
    host.appendChild(panel);
    repaired = true;
  }
  if (repaired) log('ui-remount', { reason });
}
function scheduleGhostRemount(reason = 'lifecycle') {
  const host = document.body || document.documentElement;
  if (!host || (style.isConnected && panel.isConnected && panel.parentNode === host) || ghostMountPending) return;
  ghostMountPending = true;
  setTimeout(() => {
    ghostMountPending = false;
    try { ensureGhostMounted(reason); }
    catch (error) { log('ui-remount-error', { reason, message: String(error?.message || error) }); }
  }, 40);
}
const ghostMountObserver = new MutationObserver(() => {
  if (!panel.isConnected || !style.isConnected || panel.parentNode !== (document.body || document.documentElement)) {
    scheduleGhostRemount('host-dom-replaced');
  }
});
ghostMountObserver.observe(document, { childList: true, subtree: true });
window.addEventListener('pageshow', () => scheduleGhostRemount('pageshow'));
window.addEventListener('popstate', () => scheduleGhostRemount('route'));
window.addEventListener('hashchange', () => scheduleGhostRemount('hash'));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleGhostRemount('visible');
});
// Cheap fallback for hosts that move or detach the panel without observable DOM mutation.
setInterval(() => scheduleGhostRemount('pulse'), 8000);

render();
window.__GITL_V9__ = true;
try { delete window.__GITL_V9_BOOTING__; } catch (_) { window.__GITL_V9_BOOTING__ = 0; }
log('boot', { version: VER, host: HOST.id });
})();
});
