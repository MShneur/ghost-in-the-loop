// ==UserScript==
// @name         Ghost in the Loop 8.8.3 Recovery R3
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      8.8.3-r3
// @description  Emergency Alpha/Beta/Gamma/Delta Proceed recovery for ChatGPT and Perplexity.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @noframes
// ==/UserScript==
(() => {
'use strict';

const ROOT = 'gitl-883-recovery-r3';
const TEXT = 'Continue.';
const POLL = 140;
const ACK_AUTO = 22000;
const ACK_MANUAL = 45000;
const ISSUE = 'https://github.com/MShneur/ghost-in-the-loop/issues/41';

const PROFILES = {
  alpha: { label: 'Alpha', note: 'Field order', manual: false, wait: 6000, order: ['native-setter','execcommand','beforeinput','range-input','paste-input','keycycle-input'] },
  beta:  { label: 'Beta',  note: 'Event-first', manual: false, wait: 7500, order: ['beforeinput','execcommand','native-setter','keycycle-input','range-input','paste-input'] },
  gamma: { label: 'Gamma', note: 'DOM-first', manual: false, wait: 9000, order: ['range-input','paste-input','keycycle-input','execcommand','beforeinput','native-setter'] },
  delta: { label: 'Delta', note: 'Manual host Send', manual: true, wait: 0, order: ['keycycle-input','paste-input','range-input','beforeinput','native-setter','execcommand'] }
};
const NAMES = ['alpha','beta','gamma','delta'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const low = v => norm(v).toLowerCase();

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
  return { count: a.length, ambiguous: a.length > 1, button: a.length === 1 ? a[0] : null };
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
    all: countUnique(['[data-testid^="conversation-turn-"]']),
    user: countUnique(['[data-message-author-role="user"]','[data-testid^="conversation-turn-"] [data-message-author-role="user"]']),
    assistant: countUnique(['[data-message-author-role="assistant"]','[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]'])
  };
  if (host() === 'perplexity') return {
    all: countUnique(['[data-testid*="message" i]','[data-message-author-role]']),
    user: countUnique(['[data-message-author-role="user"]','[data-testid*="user-message" i]','.human-turn']),
    assistant: countUnique(['[data-message-author-role="assistant"]','[data-testid*="assistant-message" i]','.bot-turn'])
  };
  return { all:0, user:0, assistant:0 };
}
function evidenceSince(base, beforeEditor) {
  const now = turnCounts();
  if (now.user > base.user) return { ok:true, evidence:'new-user-turn' };
  if (now.all > base.all) return { ok:true, evidence:'new-conversation-turn' };
  if (now.assistant > base.assistant) return { ok:true, evidence:'new-assistant-turn' };
  const cur = findEditor();
  const replaced = !!(cur && beforeEditor && cur !== beforeEditor);
  const cleared = !cur || norm(read(cur)) !== TEXT;
  if (generating() && (replaced || cleared)) return { ok:true, evidence:'composer+generation' };
  return { ok:false, evidence:'none' };
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
    const ed=findEditor(); last=authority(ed);
    if (last.ambiguous) return {ok:false,reason:'AMBIGUOUS_SEND',...last,ed};
    if (last.button) return {ok:true,...last,ed};
    await sleep(POLL);
  }
  return {ok:false,reason:'SEND_NOT_READY',...last,ed:findEditor()};
}
async function stage(profile,status) {
  let reason='STAGE_FAILED';
  const initial=findEditor();
  if (!initial) return {ok:false,reason:'NO_EDITOR'};
  if (norm(read(initial)) && norm(read(initial)) !== TEXT) return {ok:false,reason:'COMPOSER_NOT_EMPTY'};
  for (const name of profile.order) {
    let ed=findEditor();
    if (!ed) return {ok:false,reason:'NO_EDITOR'};
    status(`Staging with ${name}...`);
    if (norm(read(ed)) === TEXT) { clearEditor(ed); await sleep(POLL); ed=findEditor()||ed; }
    else if (norm(read(ed))) return {ok:false,reason:'COMPOSER_CHANGED'};
    try { await METHODS.get(name)(ed,TEXT); } catch (_) { reason='STAGE_EXCEPTION'; continue; }
    await sleep(POLL);
    ed=findEditor()||ed;
    if (norm(read(ed)) !== TEXT) { if (norm(read(ed))) return {ok:false,reason:'STAGE_VERIFY_FAILED'}; reason='STAGE_VERIFY_FAILED'; continue; }
    if (profile.manual) {
      await sleep(POLL*2);
      const cur=findEditor()||ed;
      if (norm(read(cur))===TEXT) return {ok:true,name,ed:cur,button:null,manual:true};
      reason='EDITOR_REPLACED_OR_TEXT_CHANGED'; continue;
    }
    status(`Staged with ${name}; waiting for exactly one Send...`);
    const ready=await waitSend(profile.wait);
    if (ready.reason==='AMBIGUOUS_SEND') return {ok:false,reason:'AMBIGUOUS_SEND',count:ready.count};
    if (ready.ok) {
      const cur=ready.ed||findEditor()||ed;
      if (norm(read(cur))!==TEXT) { reason='EDITOR_REPLACED_OR_TEXT_CHANGED'; continue; }
      return {ok:true,name,ed:cur,button:ready.button,manual:false};
    }
    reason=ready.reason||'SEND_NOT_READY';
    const cur=findEditor()||ed;
    if (norm(read(cur))===TEXT) { clearEditor(cur); await sleep(POLL); }
  }
  return {ok:false,reason};
}
async function waitAck(before,baseline,ms) {
  const end=Date.now()+ms;
  while (Date.now()<=end) {
    const e=evidenceSince(baseline,before);
    if (e.ok) return e;
    await sleep(POLL);
  }
  return {ok:false,evidence:'uncertain'};
}
function clearExactDraft() {
  const ed=findEditor();
  if (ed && norm(read(ed))===TEXT) clearEditor(ed);
}
const next=n=>NAMES[(NAMES.indexOf(n)+1)%NAMES.length];
let profile=NAMES.includes(GM_getValue('gitlRecoveryProfile','alpha'))?GM_getValue('gitlRecoveryProfile','alpha'):'alpha';
let busy=false, safeNext=false, last=profile, uncertain=false;

function ui() {
  if (document.getElementById(ROOT)) return;
  const r=document.createElement('section');
  r.id=ROOT;
  r.innerHTML=`<style>
#${ROOT}{position:fixed;right:10px;bottom:10px;z-index:2147483647;width:min(360px,calc(100vw - 20px));max-height:min(78vh,620px);overflow:auto;box-sizing:border-box;background:rgba(20,20,24,.96);color:#fff;border:1px solid #666;border-radius:14px;padding:10px;font:14px/1.3 system-ui,sans-serif;box-shadow:0 10px 30px #0006}
#${ROOT}*{box-sizing:border-box}#${ROOT} .p{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:8px 0}
#${ROOT} button{min-height:44px;border:1px solid #777;border-radius:10px;background:#2c2d34;color:#fff;font-weight:650;padding:7px;touch-action:manipulation}
#${ROOT} button[aria-pressed=true]{outline:2px solid currentColor;background:#444650}#${ROOT} button:disabled{opacity:.45}
#${ROOT} .go{width:100%;min-height:54px;font-size:18px}#${ROOT} .next,#${ROOT} .checked{width:100%;margin-top:6px}
#${ROOT} .checked{border-color:#d9a441;background:#4a3512}#${ROOT} .s{min-height:40px;margin-top:7px;padding:7px;background:#ffffff12;border-radius:9px;white-space:pre-wrap}
#${ROOT} .vote{width:100%;margin-top:6px;min-height:38px;font-size:12px}</style>
<b>Ghost Recovery</b> <small>8.8.3-r3</small>
<div class="p">${NAMES.map(n=>`<button type="button" data-p="${n}">${PROFILES[n].label}<br><small>${PROFILES[n].note}</small></button>`).join('')}</div>
<button type="button" class="go">Proceed</button>
<button type="button" class="next" disabled>Not working → try next</button>
<button type="button" class="checked" disabled>I checked: it did NOT send → unlock next</button>
<div class="s" role="status">Ready. Start with Alpha.</div>
<button type="button" class="vote">Vote / report on GitHub</button>`;
  document.documentElement.appendChild(r);

  const s=r.querySelector('.s'), go=r.querySelector('.go'), nb=r.querySelector('.next'), cb=r.querySelector('.checked'), pbs=[...r.querySelectorAll('[data-p]')];
  const status=t=>s.textContent=t;
  const render=()=>{ pbs.forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===profile?'true':'false')); nb.textContent=`Not working → try ${PROFILES[next(profile)].label}`; };
  const lock=v=>{ busy=v; go.disabled=v||uncertain; pbs.forEach(b=>b.disabled=v||uncertain); nb.disabled=v||uncertain||!safeNext; cb.disabled=v||!uncertain; };
  const enterUncertain=msg=>{ busy=false; safeNext=false; uncertain=true; status(msg+'\nAll alternate paths are locked. Check the conversation first. If it definitely did NOT send, use the confirmation button below.'); lock(false); };

  pbs.forEach(b=>b.onclick=()=>{ if(busy||uncertain)return; profile=b.dataset.p; GM_setValue('gitlRecoveryProfile',profile); safeNext=false; render(); status(`${PROFILES[profile].label} selected. Press Proceed.`); lock(false); });
  nb.onclick=()=>{ if(busy||uncertain||!safeNext)return; profile=next(last); GM_setValue('gitlRecoveryProfile',profile); safeNext=false; render(); status(`${PROFILES[profile].label} selected. Press Proceed.`); lock(false); };
  cb.onclick=()=>{ if(busy||!uncertain)return; uncertain=false; safeNext=true; profile=next(last); GM_setValue('gitlRecoveryProfile',profile); render(); status(`Confirmed no send. ${PROFILES[profile].label} is selected. Press Proceed when ready.`); lock(false); };

  go.onclick=async()=>{
    if(busy||uncertain)return;
    last=profile; safeNext=false; lock(true);
    const p=PROFILES[profile];
    if(host()==='unknown'){ safeNext=true; status('Unsupported host. Nothing was sent.'); lock(false); return; }
    if(generating()){ safeNext=true; status('A response is still generating. Nothing was sent. Wait, then retry.'); lock(false); return; }

    const baseline=turnCounts();
    const st=await stage(p,status);
    if(!st.ok){ safeNext=true; status(`${p.label} stopped before Send: ${st.reason}. No Send click occurred.\nTry ${PROFILES[next(profile)].label}.`); lock(false); return; }

    // A host/manual send may happen while staging on mobile. Detect it before
    // any Ghost actuation so we never follow it with a second send.
    const duringStage=evidenceSince(baseline,st.ed);
    if(duringStage.ok){ clearExactDraft(); status(`${p.label} detected delivery during staging via ${duringStage.evidence}. Ghost did not click Send.`); lock(false); return; }

    if(p.manual){
      status(`${p.label}: ${st.name} staged. Ghost will NOT click Send. Tap the host Send button once now; I will only watch for acknowledgement.`);
      const ack=await waitAck(st.ed,baseline,ACK_MANUAL);
      if(ack.ok){ clearExactDraft(); status(`${p.label} confirmed delivery via ${ack.evidence}. No Ghost Send click was used.`); lock(false); }
      else enterUncertain(`${p.label}: manual delivery could not be confirmed.`);
      return;
    }

    const finalEd=findEditor(), finalAuth=authority(finalEd);
    if(!finalEd||norm(read(finalEd))!==TEXT||finalAuth.ambiguous||!finalAuth.button){ safeNext=true; status(`${p.label} stopped before Send: final editor/Send recheck failed. No Send click occurred.\nTry ${PROFILES[next(profile)].label}.`); lock(false); return; }

    const preClick=evidenceSince(baseline,finalEd);
    if(preClick.ok){ clearExactDraft(); status(`${p.label} detected delivery before Ghost Send via ${preClick.evidence}. Ghost did not click Send.`); lock(false); return; }

    const sendBtn=finalAuth.button; // AT-MOST-ONCE BOUNDARY: no retry or alternate actuator after this line.
    status(`${p.label}: ${st.name} ready. Clicking the one reviewed Send once...`);
    try { sendBtn.click(); } catch (_) {}
    status(`${p.label}: Send clicked once. Waiting for acknowledgement...`);
    const ack=await waitAck(finalEd,baseline,ACK_AUTO);
    if(ack.ok){ clearExactDraft(); status(`${p.label} confirmed delivery via ${ack.evidence}. Vote for ${p.label} if it keeps working.`); lock(false); }
    else enterUncertain(`${p.label}: Send was clicked once, but delivery acknowledgement is uncertain.`);
  };

  r.querySelector('.vote').onclick=()=>{ try{GM_openInTab(ISSUE,{active:true,insert:true});}catch(_){window.open(ISSUE,'_blank','noopener,noreferrer');} };
  render(); lock(false);
}

ui();
new MutationObserver(()=>{ if(!document.getElementById(ROOT)) ui(); }).observe(document.documentElement,{childList:true,subtree:true});
})();
