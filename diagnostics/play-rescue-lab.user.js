// ==UserScript==
// @name         Ghost in the Loop — Play Rescue Lab
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.1.0
// @description  Field-test companion for Ghost Play reliability: Primary observer + independent Alpha/Beta rescue engines + fail-loud diagnostics.
// @author       Michael S (CTRL-AI)
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
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @run-at       document-idle
// @noframes
// @license      AGPL-3.0
// ==/UserScript==

(() => {
'use strict';

const LAB_VERSION = '0.1.0';
const CORE_VERSION = '8.8.2';
const STORE_KEY = 'gitl:play-rescue:feedback:v1';
const MAX_FEEDBACK = 80;
const CONFIRM_MS = 9000;
const POLL_MS = 180;

const SEND_WORDS = /^(send|submit|ask|go|发送|傳送|送信|보내기|enviar|envoyer|senden|invia|отправить|إرسال|gönder)$/i;
const SEND_VETO = /copy|share|attach|upload|voice|audio|mic|microphone|menu|more|stop|cancel|regenerate|retry|edit|like|dislike|download|image|file/i;

let lastAttempt = null;
let syncTimer = null;
let observer = null;

function siteFamily() {
  const h = location.hostname.toLowerCase();
  if (h.includes('chatgpt.com') || h.includes('openai.com')) return 'ChatGPT';
  if (h.includes('claude.ai')) return 'Claude';
  if (h.includes('perplexity.ai')) return 'Perplexity';
  if (h.includes('gemini.google.com')) return 'Gemini';
  if (h.includes('deepseek.com')) return 'DeepSeek';
  if (h.includes('copilot.microsoft.com')) return 'Copilot';
  if (h.includes('grok.com')) return 'Grok';
  if (h.includes('manus.im')) return 'Manus';
  return 'Other';
}

function visible(el) {
  if (!el || !el.isConnected) return false;
  try {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  } catch (_) { return false; }
}

function own(el) { return !!el?.closest?.('#gitl'); }

function textOf(el) {
  return String(
    el?.getAttribute?.('aria-label') ||
    el?.getAttribute?.('data-testid') ||
    el?.getAttribute?.('title') ||
    el?.textContent || ''
  ).trim();
}

function editorText(el) {
  if (!el) return '';
  if (typeof el.value === 'string') return el.value.trim();
  return String(el.innerText || el.textContent || '').trim();
}

function findComposer() {
  const nodes = [...document.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]')]
    .filter(el => !own(el) && visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true');
  if (!nodes.length) return null;
  const vh = Math.max(1, innerHeight || 800);
  const scored = nodes.map(el => {
    const r = el.getBoundingClientRect();
    let score = 0;
    if (r.top > vh * 0.45) score += 6;
    if (r.width > 200) score += 3;
    if (el.tagName === 'TEXTAREA') score += 2;
    if (el.getAttribute('contenteditable') === 'true') score += 2;
    if (el.getAttribute('role') === 'textbox') score += 1;
    if (/prompt|message|ask|chat/i.test(textOf(el) + ' ' + (el.getAttribute('placeholder') || ''))) score += 2;
    return { el, score, top: r.top };
  }).sort((a,b) => b.score - a.score || b.top - a.top);
  if (scored.length > 1 && scored[0].score === scored[1].score && Math.abs(scored[0].top - scored[1].top) < 20) return null;
  return scored[0].el;
}

function safeSemanticSend(composer) {
  const nodes = [...document.querySelectorAll('button,[role="button"],input[type="submit"]')]
    .filter(el => !own(el) && visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true');
  const cr = composer?.getBoundingClientRect?.();
  const candidates = [];
  for (const el of nodes) {
    const label = textOf(el);
    const compact = label.replace(/[\s:._-]+/g, ' ').trim();
    if (!SEND_WORDS.test(compact) || SEND_VETO.test(compact)) continue;
    const r = el.getBoundingClientRect();
    const dist = cr ? Math.hypot((r.left+r.width/2)-(cr.left+cr.width/2), (r.top+r.height/2)-(cr.top+cr.height/2)) : 9999;
    let score = 0;
    if (el.type === 'submit') score += 4;
    if (/send/i.test(el.getAttribute('aria-label') || '')) score += 4;
    if (/send|submit/i.test(el.getAttribute('data-testid') || '')) score += 3;
    if (composer?.closest('form') && el.closest('form') === composer.closest('form')) score += 5;
    score += Math.max(0, 3 - dist / 180);
    candidates.push({ el, score, dist, label: compact });
  }
  candidates.sort((a,b) => b.score - a.score || a.dist - b.dist);
  if (!candidates.length) return { ok:false, code:'ALPHA-AUTH-001', reason:'No unique semantic Send control was found.' };
  if (candidates.length > 1 && Math.abs(candidates[0].score - candidates[1].score) < 1.5) {
    return { ok:false, code:'ALPHA-AUTH-002', reason:`${candidates.length} plausible Send controls were found; Alpha refused to guess.` };
  }
  return { ok:true, button:candidates[0].el, label:candidates[0].label };
}

function userTurnCount() {
  const sels = [
    '[data-message-author-role="user"]',
    '.human-turn',
    '[class*="user-message" i]',
    '[data-testid*="user" i][data-message-id]'
  ];
  const set = new Set();
  for (const s of sels) {
    try { document.querySelectorAll(s).forEach(n => { if (!own(n) && visible(n)) set.add(n); }); } catch (_) {}
  }
  return set.size;
}

function stopVisible() {
  return [...document.querySelectorAll('button,[role="button"]')].some(el => {
    if (own(el) || !visible(el)) return false;
    const t = textOf(el);
    return /^(stop|stop generating|cancel response|cancel generation)$/i.test(t);
  });
}

function snapshot(composer) {
  return {
    userTurns: userTurnCount(),
    stop: stopVisible(),
    composerText: editorText(composer)
  };
}

async function waitForConfirmation(before, composer) {
  const deadline = Date.now() + CONFIRM_MS;
  while (Date.now() < deadline) {
    if (userTurnCount() > before.userTurns) return { confirmed:true, evidence:'new-user-turn' };
    if (!before.stop && stopVisible()) return { confirmed:true, evidence:'generation-control' };
    await new Promise(r => setTimeout(r, POLL_MS));
  }
  const afterText = editorText(composer);
  return {
    confirmed:false,
    evidence: afterText !== before.composerText ? 'composer-changed-only' : 'none'
  };
}

function uncertainCoreState() {
  const root = document.querySelector('#gitl');
  if (!root) return false;
  if (root.querySelector('#g-send-seen,#g-send-manual')) return true;
  const report = root.querySelector('.g-report');
  return /uncertain|check the conversation|delivery/i.test(report?.textContent || '');
}

function makeAttempt(method) {
  const id = Math.random().toString(36).slice(2,8).toUpperCase();
  lastAttempt = {
    runId:id,
    method,
    site:siteFamily(),
    stage:'PLAY',
    code:'',
    actuation:'no',
    delivery:'not-observed',
    at:new Date().toISOString()
  };
  paintStatus();
  return lastAttempt;
}

function setAttempt(patch) {
  if (!lastAttempt) return;
  Object.assign(lastAttempt, patch);
  paintStatus();
}

function failure(code, stage, reason, opts={}) {
  setAttempt({
    code,
    stage,
    reason,
    delivery:opts.delivery || (lastAttempt?.actuation === 'yes' ? 'uncertain' : 'not-sent')
  });
  if (opts.suggest && lastAttempt?.actuation !== 'yes') showSuggestion(opts.suggest);
}

function success(stage='CONFIRM', evidence='confirmed') {
  setAttempt({ code:'OK', stage, reason:evidence, delivery:'confirmed' });
  showFeedback(true);
}

async function runAlpha() {
  const A = makeAttempt('Alpha');
  if (uncertainCoreState()) return failure('RESCUE-SAFETY-001','PREFLIGHT','Primary has an unresolved delivery. Alpha is locked out.',{delivery:'uncertain'});
  const composer = findComposer();
  if (!composer) return failure('ALPHA-COMP-001','COMPOSER','Alpha could not identify one safe live composer.',{suggest:'Beta'});
  if (!editorText(composer)) return failure('ALPHA-STAGE-001','STAGE','The composer is empty. Type the task first.',{suggest:'Beta'});
  const auth = safeSemanticSend(composer);
  if (!auth.ok) return failure(auth.code,'AUTHORITY',auth.reason,{suggest:'Beta'});
  const before = snapshot(composer);
  setAttempt({stage:'DISPATCH'});
  try {
    A.actuation = 'yes';
    paintStatus();
    auth.button.click();
  } catch (_) {
    return failure('ALPHA-DISPATCH-001','DISPATCH','Alpha could not activate the semantic Send control.',{delivery:'uncertain'});
  }
  setAttempt({stage:'CONFIRM'});
  const result = await waitForConfirmation(before, composer);
  if (result.confirmed) return success('CONFIRM', result.evidence);
  return failure('ALPHA-CONF-001','CONFIRM','Alpha actuated once but could not prove delivery. Do not try another engine until you check the chat.',{delivery:'uncertain'});
}

async function runBeta() {
  const A = makeAttempt('Beta');
  if (uncertainCoreState()) return failure('RESCUE-SAFETY-001','PREFLIGHT','Primary has an unresolved delivery. Beta is locked out.',{delivery:'uncertain'});
  const composer = findComposer();
  if (!composer) return failure('BETA-COMP-001','COMPOSER','Beta could not identify one safe live composer.',{suggest:'Alpha'});
  if (!editorText(composer)) return failure('BETA-STAGE-001','STAGE','The composer is empty. Type the task first.',{suggest:'Alpha'});
  const form = composer.closest('form');
  if (!form) return failure('BETA-FORM-001','AUTHORITY','Beta requires a native form around the composer; none was found.',{suggest:'Alpha'});
  if (typeof form.requestSubmit !== 'function') return failure('BETA-FORM-002','AUTHORITY','This browser does not expose native requestSubmit for the composer form.',{suggest:'Alpha'});
  const before = snapshot(composer);
  setAttempt({stage:'DISPATCH'});
  try {
    A.actuation = 'yes';
    paintStatus();
    form.requestSubmit();
  } catch (_) {
    return failure('BETA-DISPATCH-001','DISPATCH','Beta could not invoke the composer form submit path.',{delivery:'uncertain'});
  }
  setAttempt({stage:'CONFIRM'});
  const result = await waitForConfirmation(before, composer);
  if (result.confirmed) return success('CONFIRM', result.evidence);
  return failure('BETA-CONF-001','CONFIRM','Beta submitted once but could not prove delivery. Do not try another engine until you check the chat.',{delivery:'uncertain'});
}

function observePrimaryClick() {
  const A = makeAttempt('Primary');
  const beforeTurns = userTurnCount();
  setTimeout(() => {
    const root = document.querySelector('#gitl');
    if (!root || lastAttempt !== A) return;
    if (root.dataset.run === '1' || /pause/i.test(root.querySelector('#g-play')?.textContent || '')) {
      setAttempt({stage:'RUNNING', code:'PRIMARY-RUNNING', reason:'Primary entered RUNNING state.'});
      return;
    }
    if (uncertainCoreState()) {
      failure('PRIMARY-UNCERTAIN','CONFIRM','Primary reports uncertain delivery. Rescue engines are locked out.',{delivery:'uncertain'});
      return;
    }
    if (userTurnCount() > beforeTurns) {
      success('CONFIRM','new-user-turn');
      return;
    }
    const report = root.querySelector('.g-report');
    if (report) {
      const coreCode = root.querySelector('.g-report-k')?.textContent?.trim() || 'CORE-REPORT';
      failure(`PRIMARY-${coreCode}`,'PREFLIGHT','Primary reported a failure before the rescue lab observed a new outbound turn.',{suggest:'Alpha or Beta'});
      return;
    }
    failure('PRIMARY-START-001','PLAY','Primary did not enter RUNNING state and no new outbound turn was observed.',{suggest:'Alpha or Beta'});
  }, 2200);
}

function recordFeedback(worked) {
  if (!lastAttempt) return;
  const row = {
    site:lastAttempt.site,
    method:lastAttempt.method,
    worked:!!worked,
    code:lastAttempt.code || '',
    stage:lastAttempt.stage || '',
    core:CORE_VERSION,
    lab:LAB_VERSION,
    at:new Date().toISOString()
  };
  let rows = [];
  try { rows = JSON.parse(GM_getValue(STORE_KEY,'[]')) || []; } catch (_) {}
  rows.push(row);
  rows = rows.slice(-MAX_FEEDBACK);
  try { GM_setValue(STORE_KEY, JSON.stringify(rows)); } catch (_) {}
  const line = `GITL-FEEDBACK | ${row.site} | ${row.method} | ${worked?'WORKED':'FAILED'} | ${row.stage} | ${row.code||'none'} | core ${row.core} | lab ${row.lab}`;
  try { GM_setClipboard(line); } catch (_) {
    try { navigator.clipboard?.writeText?.(line); } catch (_) {}
  }
  setAttempt({ feedback: worked ? 'Worked — redacted result copied' : 'Failed — redacted result copied' });
}

function showSuggestion(label) {
  const box = document.querySelector('#gitl-play-rescue-suggest');
  if (!box) return;
  box.hidden = false;
  box.textContent = `Try ${label}. No automatic fallback will run after a possible send.`;
}

function showFeedback(show) {
  const row = document.querySelector('#gitl-play-rescue-feedback');
  if (row) row.hidden = !show;
}

function paintStatus() {
  const el = document.querySelector('#gitl-play-rescue-status');
  if (!el) return;
  if (!lastAttempt) {
    el.textContent = 'Ready · Primary default · Alpha/Beta available for testing';
    return;
  }
  const sent = lastAttempt.delivery === 'confirmed' ? 'confirmed' : lastAttempt.delivery === 'uncertain' ? 'delivery uncertain' : lastAttempt.delivery === 'not-sent' ? 'nothing sent' : 'no send observed';
  const code = lastAttempt.code && lastAttempt.code !== 'OK' ? ` · ${lastAttempt.code}` : '';
  const fb = lastAttempt.feedback ? ` · ${lastAttempt.feedback}` : '';
  el.textContent = `${lastAttempt.runId} · ${lastAttempt.method} · ${lastAttempt.stage} · ${sent}${code}${fb}`;
  showFeedback(lastAttempt.delivery === 'confirmed' || !!lastAttempt.code);
}

function injectStyles() {
  if (document.getElementById('gitl-play-rescue-style')) return;
  const s = document.createElement('style');
  s.id = 'gitl-play-rescue-style';
  s.textContent = `
#gitl .gitl-brand-words{display:inline-flex;flex-direction:column;line-height:1;vertical-align:middle;margin-left:2px}
#gitl .gitl-brand-main{font-size:11px;font-weight:800;letter-spacing:.02em}
#gitl .gitl-brand-sub{font-size:7.5px;font-weight:600;opacity:.62;letter-spacing:.04em;margin-top:2px;white-space:nowrap}
#gitl.collapsed .gitl-brand-sub{display:none}
#gitl-play-rescue{margin:6px 0;padding:7px 8px;border:1px solid var(--g-border-2,#2a2c35);border-radius:7px;background:var(--g-surface-2,#17181d)}
#gitl-play-rescue .pr-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:9px;font-weight:800;color:var(--g-text-mid,#9ca3af)}
#gitl-play-rescue .pr-sub{font-size:8.5px;line-height:1.35;color:var(--g-muted,#6b7280);margin:4px 0 6px}
#gitl-play-rescue .pr-buttons{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#gitl-play-rescue button{font:600 9px/1.2 system-ui,sans-serif;padding:6px 7px;border-radius:6px;border:1px solid var(--g-border-2,#30323a);background:var(--g-surface,#202127);color:var(--g-text,#e5e7eb);cursor:pointer}
#gitl-play-rescue button:hover{border-color:var(--g-accent-deep,#4f46e5)}
#gitl-play-rescue-status{font:600 8px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--g-text-low,#777);margin-top:6px;word-break:break-word}
#gitl-play-rescue-suggest{font-size:8.5px;color:#f5c86b;margin-top:5px}
#gitl-play-rescue-feedback{display:flex;gap:5px;margin-top:6px}
#gitl-play-rescue-feedback[hidden],#gitl-play-rescue-suggest[hidden]{display:none}
#gitl .gitl-identity-card{margin:0 0 7px;padding:8px 9px;border:1px solid var(--g-border,#292b32);border-radius:7px;background:var(--g-surface-2,#17181d)}
#gitl .gitl-identity-title{font-size:11px;font-weight:800;color:var(--g-text-hot,#f3f4f6)}
#gitl .gitl-identity-sub{font-size:8.5px;color:var(--g-muted,#777);margin-top:2px;line-height:1.45}
#gitl .gitl-identity-sub a{color:var(--g-accent-text,#a5b4fc);text-decoration:none}
`;
  (document.head || document.documentElement).appendChild(s);
}

function upgradeBrand(root) {
  const logo = root.querySelector('.g-logo');
  if (!logo || logo.dataset.rescueBrand === '1') return;
  if (root.classList.contains('collapsed')) return;
  const dot = logo.querySelector('.g-dot');
  let ghost = logo.querySelector('.g-ghost');
  if (!ghost) {
    ghost = document.createElement('span');
    ghost.className = 'g-ghost';
    ghost.textContent = '👻';
  }
  const words = document.createElement('span');
  words.className = 'gitl-brand-words';
  const main = document.createElement('span');
  main.className = 'gitl-brand-main';
  main.textContent = 'Ghost';
  const sub = document.createElement('span');
  sub.className = 'gitl-brand-sub';
  sub.textContent = `in the Loop · v${CORE_VERSION}`;
  words.append(main, sub);
  logo.textContent = '';
  logo.append(ghost, words);
  if (dot) logo.append(dot);
  logo.dataset.rescueBrand = '1';
}

function injectSettingsIdentity(root) {
  const active = root.querySelector('.g-tab.act[data-t="settings"]');
  const tc = root.querySelector('#g-tc');
  if (!active || !tc || tc.querySelector('.gitl-identity-card')) return;
  const card = document.createElement('div');
  card.className = 'gitl-identity-card';
  const title = document.createElement('div');
  title.className = 'gitl-identity-title';
  title.textContent = `Ghost in the Loop · v${CORE_VERSION}`;
  const sub = document.createElement('div');
  sub.className = 'gitl-identity-sub';
  sub.textContent = `Play Rescue Lab ${LAB_VERSION} · Free forever · donations support development`;
  card.append(title, sub);
  tc.prepend(card);
}

function rescueCard(root) {
  const transport = root.querySelector('.g-mod-transport');
  if (!transport || root.querySelector('#gitl-play-rescue')) return;
  const box = document.createElement('div');
  box.id = 'gitl-play-rescue';
  box.innerHTML = `
    <div class="pr-head"><span>Play rescue engines</span><span>TEST</span></div>
    <div class="pr-sub">Primary stays default. If it fails, manually try one independent fallback. Never run another method after an uncertain send.</div>
    <div class="pr-buttons"><button type="button" id="gitl-alpha">Alpha · semantic Send</button><button type="button" id="gitl-beta">Beta · native form</button></div>
    <div id="gitl-play-rescue-status" aria-live="polite">Ready · Primary default · Alpha/Beta available for testing</div>
    <div id="gitl-play-rescue-suggest" hidden></div>
    <div id="gitl-play-rescue-feedback" hidden><button type="button" id="gitl-worked">👍 Worked</button><button type="button" id="gitl-failed">👎 Failed</button></div>`;
  transport.insertAdjacentElement('afterend', box);
  box.querySelector('#gitl-alpha')?.addEventListener('click', runAlpha);
  box.querySelector('#gitl-beta')?.addEventListener('click', runBeta);
  box.querySelector('#gitl-worked')?.addEventListener('click', () => recordFeedback(true));
  box.querySelector('#gitl-failed')?.addEventListener('click', () => recordFeedback(false));
  paintStatus();
}

function bindPrimary(root) {
  const play = root.querySelector('#g-play');
  if (!play || play.dataset.rescueBound === '1') return;
  play.dataset.rescueBound = '1';
  play.addEventListener('click', observePrimaryClick, { capture:true });
}

function sync() {
  injectStyles();
  const root = document.querySelector('#gitl');
  if (!root) return;
  upgradeBrand(root);
  injectSettingsIdentity(root);
  rescueCard(root);
  bindPrimary(root);
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, 60);
}

function boot() {
  sync();
  observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setInterval(sync, 1500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
else boot();

})();
