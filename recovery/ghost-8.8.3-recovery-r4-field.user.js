// ==UserScript==
// @name         Ghost in the Loop 8.8.3 Recovery R4 Field Router
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      8.8.3-r4-field
// @description  Mobile-first Alpha/Beta/Gamma/Delta recovery router with failover tracing and SEND-002 diagnostics.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @run-at       document-idle
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==
(() => {
'use strict';

const VERSION = '8.8.3-r4-field';
const ROOT = 'gitl-883-r4-field-router';
const TEXT = 'Continue.';
const POLL = 140;
const ACK_AUTO = 22000;
const ACK_MANUAL = 45000;
const ISSUE = 'https://github.com/MShneur/ghost-in-the-loop/issues/41';

const PROFILES = [
  { id:'alpha', label:'Alpha', note:'field order', manual:false, wait:6000, order:['native-setter','execcommand','beforeinput','range-input','paste-input','keycycle-input'] },
  { id:'beta', label:'Beta', note:'event first', manual:false, wait:7500, order:['beforeinput','execcommand','native-setter','keycycle-input','range-input','paste-input'] },
  { id:'gamma', label:'Gamma', note:'DOM first', manual:false, wait:9000, order:['range-input','paste-input','keycycle-input','execcommand','beforeinput','native-setter'] },
  { id:'delta', label:'Delta', note:'manual host Send', manual:true, wait:0, order:['keycycle-input','paste-input','range-input','beforeinput','native-setter','execcommand'] }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const low = v => norm(v).toLowerCase();
const startedAt = new Date().toISOString();
let busy = false;
let events = [];

function host() {
  if (/perplexity\.ai$/i.test(location.hostname)) return 'perplexity';
  if (/chatgpt\.com$|chat\.openai\.com$/i.test(location.hostname)) return 'chatgpt';
  return 'unknown';
}
function own(e) { return !!e?.closest?.('#' + ROOT); }
function visible(e) {
  if (!e || !e.isConnected) return false;
  const r = e.getBoundingClientRect();
  const s = getComputedStyle(e);
  return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0;
}
function read(e) { return String(e?.value ?? e?.innerText ?? e?.textContent ?? ''); }
function disabled(e) { return !!e?.disabled || e?.getAttribute?.('aria-disabled') === 'true' || e?.hasAttribute?.('data-disabled'); }
function safeSend(e) {
  return !/feedback|report|share|upload|voice|mic|record|search|stop|cancel/.test(`${low(e?.getAttribute?.('aria-label'))} ${low(e?.getAttribute?.('data-testid'))} ${low(e?.textContent)}`);
}

function editorSelectors() {
  if (host() === 'chatgpt') return ['#prompt-textarea','[data-testid="prompt-textarea"]','div.ProseMirror[contenteditable="true"]','[role="textbox"][contenteditable="true"]'];
  if (host() === 'perplexity') return ['textarea[placeholder*="Ask" i]','[contenteditable="true"][data-lexical-editor="true"]','[role="textbox"][contenteditable="true"]'];
  return [];
}
function scoreEditor(e) {
  const r = e.getBoundingClientRect();
  const h = `${low(e.getAttribute?.('aria-label'))} ${low(e.getAttribute?.('placeholder'))}`;
  let n = r.bottom + r.width / 20;
  if (document.activeElement === e || e.contains?.(document.activeElement)) n += 100000;
  if (/ask|message|prompt|follow|anything|chat/.test(h)) n += 8000;
  if (e.id === 'prompt-textarea' || e.getAttribute?.('data-testid') === 'prompt-textarea') n += 12000;
  if (e.closest?.('form')) n += 2500;
  return n;
}
function findEditor() {
  const set = new Set();
  for (const q of editorSelectors()) {
    try {
      document.querySelectorAll(q).forEach(e => {
        const h = `${low(e.getAttribute?.('aria-label'))} ${low(e.getAttribute?.('placeholder'))}`;
        if (visible(e) && !own(e) && !/(search settings|rename|filter|search chats|search conversations)/.test(h)) set.add(e);
      });
    } catch (_) {}
  }
  return [...set].sort((a,b) => scoreEditor(b) - scoreEditor(a))[0] || null;
}
function authority(ed = findEditor()) {
  const selectors = host() === 'chatgpt'
    ? ['button[data-testid="send-button"]','button[aria-label*="Send" i]']
    : host() === 'perplexity'
      ? ['button[aria-label*="Submit" i]','button[aria-label*="Send" i]']
      : [];
  const set = new Set();
  for (const q of selectors) {
    try { document.querySelectorAll(q).forEach(e => { if (visible(e) && !own(e) && !disabled(e) && safeSend(e)) set.add(e); }); } catch (_) {}
  }
  if (!set.size && ed?.closest?.('form')) {
    try { ed.closest('form').querySelectorAll('button[type="submit"]').forEach(e => { if (visible(e) && !own(e) && !disabled(e) && safeSend(e)) set.add(e); }); } catch (_) {}
  }
  const a = [...set];
  return { count:a.length, ambiguous:a.length > 1, button:a.length === 1 ? a[0] : null };
}
function generating() {
  const qs = ['button[aria-label*="stop" i]','button[data-testid*="stop" i]','[role="button"][aria-label*="stop" i]','button[aria-label*="cancel" i]'];
  for (const q of qs) {
    try {
      for (const e of document.querySelectorAll(q)) {
        if (visible(e) && !own(e) && !/stop sharing|stop listening/i.test(norm(e.getAttribute?.('aria-label')))) return true;
      }
    } catch (_) {}
  }
  return false;
}
function countUnique(selectors) {
  const set = new Set();
  for (const q of selectors) {
    try { document.querySelectorAll(q).forEach(e => { if (!own(e)) set.add(e); }); } catch (_) {}
  }
  return set.size;
}
function turnCounts() {
  if (host() === 'chatgpt') return {
    all:countUnique(['[data-testid^="conversation-turn-"]']),
    user:countUnique(['[data-message-author-role="user"]','[data-testid^="conversation-turn-"] [data-message-author-role="user"]']),
    assistant:countUnique(['[data-message-author-role="assistant"]','[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]'])
  };
  if (host() === 'perplexity') return {
    all:countUnique(['[data-testid*="message" i]','[data-message-author-role]']),
    user:countUnique(['[data-message-author-role="user"]','[data-testid*="user-message" i]','.human-turn']),
    assistant:countUnique(['[data-message-author-role="assistant"]','[data-testid*="assistant-message" i]','.bot-turn'])
  };
  return {all:0,user:0,assistant:0};
}
function composerState() {
  const ed = findEditor();
  if (!ed) return 'missing';
  const t = norm(read(ed));
  if (!t) return 'empty';
  if (t === TEXT) return 'continue';
  return 'other';
}
function snapshot(extra={}) {
  const a = authority();
  return {
    host:host(),
    editor:composerState(),
    sendCandidates:a.count,
    sendAmbiguous:a.ambiguous,
    generating:generating(),
    turns:turnCounts(),
    online:navigator.onLine,
    visibility:document.visibilityState,
    ua:navigator.userAgent,
    ...extra
  };
}
function log(type, data={}) {
  events.push({ t:new Date().toISOString(), type, ...data });
  if (events.length > 120) events = events.slice(-120);
}
function evidenceSince(base, beforeEditor) {
  const now = turnCounts();
  if (now.user > base.user) return {ok:true,evidence:'new-user-turn'};
  if (now.all > base.all) return {ok:true,evidence:'new-conversation-turn'};
  if (now.assistant > base.assistant) return {ok:true,evidence:'new-assistant-turn'};
  const cur = findEditor();
  const replaced = !!(cur && beforeEditor && cur !== beforeEditor);
  const cleared = !cur || norm(read(cur)) !== TEXT;
  if (generating() && (replaced || cleared)) return {ok:true,evidence:'composer+generation'};
  return {ok:false,evidence:'none'};
}

function setVal(e,v) {
  if (e instanceof HTMLTextAreaElement) {
    const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
    s ? s.call(e,v) : (e.value=v);
  } else if (e instanceof HTMLInputElement) {
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    s ? s.call(e,v) : (e.value=v);
  } else {
    e.textContent=''; e.appendChild(document.createTextNode(v));
  }
}
function fireInput(e,type,data) {
  try { e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:type,data})); }
  catch (_) { e.dispatchEvent(new Event('input',{bubbles:true,composed:true})); }
}
function clearEditor(e) {
  if (!e) return;
  try { e.focus(); setVal(e,''); fireInput(e,'deleteContentBackward',null); e.dispatchEvent(new Event('change',{bubbles:true})); } catch (_) {}
}
function clearExactDraft() {
  const ed = findEditor();
  if (ed && norm(read(ed)) === TEXT) clearEditor(ed);
}
function selectAll(e) {
  e.focus();
  if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) { e.select?.(); return; }
  const s = getSelection(); if (!s) return;
  const r = document.createRange(); r.selectNodeContents(e); s.removeAllRanges(); s.addRange(r);
}
async function nativeSetter(e,v) { e.focus(); setVal(e,v); fireInput(e,'insertText',v); e.dispatchEvent(new Event('change',{bubbles:true})); }
async function execcommand(e,v) { e.focus(); selectAll(e); let ok=false; try { ok=document.execCommand('insertText',false,v); } catch (_) {} if (!ok || norm(read(e))!==norm(v)) setVal(e,v); fireInput(e,'insertText',v); }
async function beforeinput(e,v) { e.focus(); clearEditor(e); try { e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,composed:true,cancelable:true,inputType:'insertText',data:v})); } catch (_) {} setVal(e,v); fireInput(e,'insertText',v); }
async function rangeInput(e,v) { e.focus(); if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) return nativeSetter(e,v); selectAll(e); const s=getSelection(),r=s?.rangeCount?s.getRangeAt(0):null; if(!r) return nativeSetter(e,v); r.deleteContents(); const n=document.createTextNode(v); r.insertNode(n); r.setStartAfter(n); r.collapse(true); s.removeAllRanges(); s.addRange(r); fireInput(e,'insertText',v); }
async function pasteInput(e,v) { e.focus(); clearEditor(e); try { const d=new DataTransfer(); d.setData('text/plain',v); e.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,composed:true,cancelable:true,clipboardData:d})); } catch (_) {} setVal(e,v); fireInput(e,'insertFromPaste',v); }
async function keycycle(e,v) { e.focus(); clearEditor(e); try { e.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,composed:true,key:'a'})); } catch (_) {} setVal(e,v); fireInput(e,'insertText',v); try { e.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,composed:true,key:'a'})); } catch (_) {} e.dispatchEvent(new Event('change',{bubbles:true})); }
const METHODS = new Map([['native-setter',nativeSetter],['execcommand',execcommand],['beforeinput',beforeinput],['range-input',rangeInput],['paste-input',pasteInput],['keycycle-input',keycycle]]);

async function waitSend(ms) {
  const end = Date.now() + ms;
  let last = authority();
  while (Date.now() <= end) {
    const ed = findEditor(); last = authority(ed);
    if (last.ambiguous) return {ok:false,reason:'AMBIGUOUS_SEND',...last,ed};
    if (last.button) return {ok:true,...last,ed};
    await sleep(POLL);
  }
  return {ok:false,reason:'SEND_NOT_READY',...last,ed:findEditor()};
}
async function stage(profile, status) {
  const initial = findEditor();
  if (!initial) return {ok:false,reason:'NO_EDITOR'};
  if (norm(read(initial)) && norm(read(initial)) !== TEXT) return {ok:false,reason:'COMPOSER_NOT_EMPTY'};
  let lastReason = 'STAGE_FAILED';
  for (const method of profile.order) {
    let ed = findEditor();
    if (!ed) return {ok:false,reason:'NO_EDITOR'};
    if (norm(read(ed)) === TEXT) { clearEditor(ed); await sleep(POLL); ed = findEditor() || ed; }
    else if (norm(read(ed))) return {ok:false,reason:'COMPOSER_CHANGED'};
    status(`${profile.label}: trying ${method}...`);
    log('stage-attempt',{profile:profile.id,method,state:snapshot()});
    try { await METHODS.get(method)(ed,TEXT); }
    catch (err) { lastReason='STAGE_EXCEPTION'; log('stage-fail',{profile:profile.id,method,reason:lastReason,error:String(err)}); continue; }
    await sleep(POLL);
    ed = findEditor() || ed;
    if (norm(read(ed)) !== TEXT) {
      lastReason = 'STAGE_VERIFY_FAILED';
      log('stage-fail',{profile:profile.id,method,reason:lastReason,state:snapshot()});
      if (norm(read(ed))) return {ok:false,reason:lastReason,method};
      continue;
    }
    if (profile.manual) return {ok:true,method,ed,manual:true};
    const ready = await waitSend(profile.wait);
    if (ready.reason === 'AMBIGUOUS_SEND') return {ok:false,reason:'AMBIGUOUS_SEND',method,count:ready.count};
    if (ready.ok) {
      const cur = ready.ed || findEditor() || ed;
      if (norm(read(cur)) !== TEXT) { lastReason='EDITOR_REPLACED_OR_TEXT_CHANGED'; continue; }
      return {ok:true,method,ed:cur,button:ready.button,manual:false};
    }
    lastReason = ready.reason || 'SEND_NOT_READY';
    log('stage-fail',{profile:profile.id,method,reason:lastReason,state:snapshot()});
    const cur = findEditor() || ed;
    if (norm(read(cur)) === TEXT) { clearEditor(cur); await sleep(POLL); }
  }
  return {ok:false,reason:lastReason};
}
async function waitAck(before, baseline, ms) {
  const end = Date.now() + ms;
  while (Date.now() <= end) {
    const e = evidenceSince(baseline,before);
    if (e.ok) return e;
    await sleep(POLL);
  }
  return {ok:false,evidence:'uncertain'};
}

function reportObject() {
  return { version:VERSION, startedAt, exportedAt:new Date().toISOString(), host:host(), userAgent:navigator.userAgent, events };
}
function reportText() { return JSON.stringify(reportObject(), null, 2); }
async function copyReport(status) {
  const text = reportText();
  try {
    if (typeof GM_setClipboard === 'function') { GM_setClipboard(text); status('Report copied. Paste it back into ChatGPT.'); return; }
    await navigator.clipboard.writeText(text); status('Report copied. Paste it back into ChatGPT.');
  } catch (_) {
    window.prompt('Copy this report:', text);
  }
}

async function runProfile(profile, status) {
  const baseline = turnCounts();
  log('profile-start',{profile:profile.id,state:snapshot({baseline})});
  const st = await stage(profile,status);
  if (!st.ok) {
    log('profile-pre-send-fail',{profile:profile.id,reason:st.reason,method:st.method || null,sendTouched:false,state:snapshot()});
    return {kind:'safe-fail',reason:st.reason};
  }

  const during = evidenceSince(baseline,st.ed);
  if (during.ok) {
    clearExactDraft();
    log('confirmed',{profile:profile.id,method:st.method,sendTouched:false,evidence:during.evidence,phase:'during-stage',state:snapshot()});
    return {kind:'success',evidence:during.evidence,sendTouched:false};
  }

  if (profile.manual) {
    status(`Delta staged with ${st.method}. Tap the host Send button ONCE. Ghost is only observing.`);
    log('delta-waiting-manual-send',{profile:profile.id,method:st.method,state:snapshot()});
    const ack = await waitAck(st.ed,baseline,ACK_MANUAL);
    if (ack.ok) {
      clearExactDraft();
      log('confirmed',{profile:profile.id,method:st.method,sendTouched:'manual',evidence:ack.evidence,state:snapshot()});
      return {kind:'success',evidence:ack.evidence,sendTouched:'manual'};
    }
    const state = snapshot();
    if (state.editor === 'continue' && state.turns.user === baseline.user && state.turns.all === baseline.all && !state.generating) {
      log('delta-no-manual-send-detected',{profile:profile.id,method:st.method,sendTouched:false,state});
      return {kind:'safe-fail',reason:'DELTA_NO_SEND_DETECTED'};
    }
    log('send-unknown',{code:'SEND-002',profile:profile.id,method:st.method,sendTouched:'manual-or-unknown',state});
    return {kind:'unknown',code:'SEND-002'};
  }

  const finalEd = findEditor();
  const finalAuth = authority(finalEd);
  if (!finalEd || norm(read(finalEd)) !== TEXT || finalAuth.ambiguous || !finalAuth.button) {
    const reason = finalAuth.ambiguous ? 'FINAL_SEND_AMBIGUOUS' : 'FINAL_EDITOR_SEND_RECHECK_FAILED';
    log('profile-pre-send-fail',{profile:profile.id,method:st.method,reason,sendTouched:false,state:snapshot()});
    return {kind:'safe-fail',reason};
  }
  const pre = evidenceSince(baseline,finalEd);
  if (pre.ok) {
    clearExactDraft();
    log('confirmed',{profile:profile.id,method:st.method,sendTouched:false,evidence:pre.evidence,phase:'pre-click',state:snapshot()});
    return {kind:'success',evidence:pre.evidence,sendTouched:false};
  }

  const sendBtn = finalAuth.button; // AT-MOST-ONCE BOUNDARY: no alternate path after this click unless delivery is proven NOT_SENT by a human.
  status(`${profile.label}: ${st.method} ready. Clicking the one reviewed Send once...`);
  log('send-click',{profile:profile.id,method:st.method,sendTouched:true,before:snapshot({baseline})});
  try { sendBtn.click(); }
  catch (err) { log('send-click-exception',{profile:profile.id,method:st.method,error:String(err),sendTouched:true,state:snapshot()}); }
  const ack = await waitAck(finalEd,baseline,ACK_AUTO);
  if (ack.ok) {
    clearExactDraft();
    log('confirmed',{profile:profile.id,method:st.method,sendTouched:true,evidence:ack.evidence,state:snapshot()});
    return {kind:'success',evidence:ack.evidence,sendTouched:true};
  }
  log('send-unknown',{code:'SEND-002',profile:profile.id,method:st.method,sendTouched:true,after:snapshot({baseline})});
  return {kind:'unknown',code:'SEND-002'};
}

function mount() {
  if (document.getElementById(ROOT)) return;
  const r = document.createElement('section');
  r.id = ROOT;
  r.innerHTML = `<style>
#${ROOT}{position:fixed;right:8px;bottom:8px;z-index:2147483647;width:min(350px,calc(100vw - 16px));max-height:min(72vh,560px);overflow:auto;background:rgba(20,20,24,.97);color:#fff;border:1px solid #666;border-radius:14px;padding:10px;font:14px/1.35 system-ui,sans-serif;box-sizing:border-box;box-shadow:0 10px 30px #0006}
#${ROOT}*{box-sizing:border-box}#${ROOT} .path{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:7px 0}#${ROOT} .path span{padding:5px 2px;text-align:center;border:1px solid #555;border-radius:7px;font-size:11px}#${ROOT} button{width:100%;min-height:46px;margin-top:6px;border:1px solid #777;border-radius:10px;background:#2c2d34;color:#fff;font-weight:700;padding:7px;touch-action:manipulation}#${ROOT} button:disabled{opacity:.45}#${ROOT} .go{min-height:54px;font-size:17px}#${ROOT} .s{min-height:48px;padding:7px;background:#ffffff12;border-radius:9px;white-space:pre-wrap}</style>
<b>Ghost Recovery Field Router</b> <small>${VERSION}</small>
<div class="path"><span>Alpha</span><span>Beta</span><span>Gamma</span><span>Delta</span></div>
<div class="s" role="status">Ready. One press tests Alpha → Beta → Gamma → Delta safely.</div>
<button type="button" class="go">Proceed / run recovery chain</button>
<button type="button" class="copy">Copy diagnostic report</button>
<button type="button" class="issue">Open report issue</button>`;
  document.documentElement.appendChild(r);
  const s = r.querySelector('.s'), go = r.querySelector('.go');
  const status = t => { s.textContent = t; };

  go.onclick = async () => {
    if (busy) return;
    busy = true; go.disabled = true;
    events = [];
    log('run-start',{state:snapshot()});
    if (host() === 'unknown') { log('run-stop',{reason:'UNSUPPORTED_HOST'}); status('Unsupported host. Nothing was sent.'); busy=false; go.disabled=false; return; }
    if (generating()) { log('run-stop',{reason:'ALREADY_GENERATING',state:snapshot()}); status('A response is already generating. Nothing was sent.'); busy=false; go.disabled=false; return; }

    for (let i=0; i<PROFILES.length; i++) {
      const p = PROFILES[i];
      status(`${p.label}: testing ${p.note}...`);
      const result = await runProfile(p,status);
      if (result.kind === 'success') {
        log('run-success',{profile:p.id,evidence:result.evidence,sendTouched:result.sendTouched});
        status(`${p.label} PASSED via ${result.evidence}. Report saved; copy it if you want me to compare future runs.`);
        busy=false; go.disabled=false; return;
      }
      if (result.kind === 'safe-fail') {
        const next = PROFILES[i+1];
        log('fallback',{from:p.id,to:next?.id || null,reason:result.reason});
        if (next) { status(`${p.label} failed safely (${result.reason}). Trying ${next.label} automatically...`); await sleep(350); continue; }
        status(`All four paths failed before a confirmed Send (${result.reason}). Nothing was auto-retried after a Send. Copy the report.`);
        busy=false; go.disabled=false; return;
      }
      if (result.kind === 'unknown') {
        log('run-hard-stop',{code:result.code,profile:p.id,state:snapshot()});
        status(`${result.code}: ${p.label} reached Send, but delivery is unconfirmed. HARD STOP to prevent a duplicate. Copy the report and send it back to me.`);
        busy=false; go.disabled=false; return;
      }
    }
    busy=false; go.disabled=false;
  };

  r.querySelector('.copy').onclick = () => copyReport(status);
  r.querySelector('.issue').onclick = () => { try { GM_openInTab(ISSUE,{active:true,insert:true}); } catch (_) { window.open(ISSUE,'_blank','noopener,noreferrer'); } };
}

window.__GITL_R4_FIELD__ = { version:VERSION, report:reportObject, snapshot };
mount();
new MutationObserver(() => { if (!document.getElementById(ROOT)) mount(); }).observe(document.documentElement,{childList:true,subtree:true});
})();
