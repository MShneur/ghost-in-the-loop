// ==UserScript==
// @name         Ghost in the Loop — Play Rescue Lab
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.3.0
// @description  Primary observer plus independent Alpha/Beta Play rescue methods with fail-loud diagnostics.
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

const LAB_VERSION = '0.3.0';
const CORE_VERSION = '8.8.2';
const SUPPORT_URL = 'https://github.com/sponsors/MShneur';
const STORE_KEY = 'gitl:play-rescue:feedback:v1';
const CONFIRM_MS = 9000;
const POLL_MS = 180;
let attempt = null;
let syncTimer = null;

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = String(text);
  return n;
}
function btn(id, text) { const b=node('button','',text); b.id=id; b.type='button'; return b; }
function own(n) { return !!n?.closest?.('#gitl'); }
function shown(n) {
  if (!n || !n.isConnected) return false;
  try { const s=getComputedStyle(n),r=n.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>2&&r.height>2; }
  catch (_) { return false; }
}
function label(n) { return String(n?.getAttribute?.('aria-label')||n?.getAttribute?.('data-testid')||n?.getAttribute?.('title')||n?.textContent||'').trim(); }
function editorText(n) { return typeof n?.value==='string' ? n.value.trim() : String(n?.innerText||n?.textContent||'').trim(); }
function site() {
  const h=location.hostname.toLowerCase();
  if(h.includes('chatgpt')||h.includes('openai'))return'ChatGPT'; if(h.includes('claude'))return'Claude';
  if(h.includes('perplexity'))return'Perplexity'; if(h.includes('gemini'))return'Gemini'; if(h.includes('deepseek'))return'DeepSeek';
  if(h.includes('copilot'))return'Copilot'; if(h.includes('grok'))return'Grok'; if(h.includes('manus'))return'Manus'; return'Other';
}

function composer() {
  const vh=Math.max(1,innerHeight||800);
  const c=[...document.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]')]
    .filter(n=>!own(n)&&shown(n)&&!n.disabled&&n.getAttribute('aria-disabled')!=='true')
    .map(n=>{const r=n.getBoundingClientRect();let score=0;if(r.top>vh*.45)score+=6;if(r.width>200)score+=3;if(n.tagName==='TEXTAREA')score+=2;if(n.getAttribute('contenteditable')==='true')score+=2;if(/prompt|message|ask|chat/i.test(label(n)+' '+(n.getAttribute('placeholder')||'')))score+=2;return{n,score,top:r.top};})
    .sort((a,b)=>b.score-a.score||b.top-a.top);
  if(!c.length)return null;
  if(c.length>1&&c[0].score===c[1].score&&Math.abs(c[0].top-c[1].top)<20)return null;
  return c[0].n;
}

function alphaSend(c) {
  const SEND=/^(send|submit|ask|go)$/i,VETO=/copy|share|attach|upload|voice|audio|mic|menu|more|stop|cancel|regenerate|retry|edit|like|dislike|download|image|file/i;
  const cr=c?.getBoundingClientRect?.(),found=[];
  for(const n of [...document.querySelectorAll('button,[role="button"],input[type="submit"]')]){
    if(own(n)||!shown(n)||n.disabled||n.getAttribute('aria-disabled')==='true')continue;
    const t=label(n).replace(/[\s:._-]+/g,' ').trim(); if(!SEND.test(t)||VETO.test(t))continue;
    const r=n.getBoundingClientRect(),d=cr?Math.hypot((r.left+r.width/2)-(cr.left+cr.width/2),(r.top+r.height/2)-(cr.top+cr.height/2)):9999;
    let s=0;if(n.type==='submit')s+=4;if(/send/i.test(n.getAttribute('aria-label')||''))s+=4;if(/send|submit/i.test(n.getAttribute('data-testid')||''))s+=3;if(c?.closest('form')&&n.closest('form')===c.closest('form'))s+=5;s+=Math.max(0,3-d/180);found.push({n,s,d});
  }
  found.sort((a,b)=>b.s-a.s||a.d-b.d);
  if(!found.length)return{ok:false,code:'ALPHA-AUTH-001',reason:'No semantic Send control was found.'};
  if(found.length>1&&Math.abs(found[0].s-found[1].s)<1.5)return{ok:false,code:'ALPHA-AUTH-002',reason:`${found.length} plausible Send controls were found; Alpha refused to guess.`};
  return{ok:true,n:found[0].n};
}

function userTurns(){const set=new Set();for(const s of ['[data-message-author-role="user"]','.human-turn','[class*="user-message" i]'])try{document.querySelectorAll(s).forEach(n=>{if(!own(n)&&shown(n))set.add(n);});}catch(_){}return set.size;}
function stopVisible(){return[...document.querySelectorAll('button,[role="button"]')].some(n=>!own(n)&&shown(n)&&/^(stop|stop generating|cancel response|cancel generation)$/i.test(label(n)));}
function snap(c){return{turns:userTurns(),stop:stopVisible(),text:editorText(c)};}
async function confirm(before,c){const end=Date.now()+CONFIRM_MS;while(Date.now()<end){if(userTurns()>before.turns)return{ok:true,evidence:'new-user-turn'};if(!before.stop&&stopVisible())return{ok:true,evidence:'generation-control'};await new Promise(r=>setTimeout(r,POLL_MS));}return{ok:false,evidence:editorText(c)!==before.text?'composer-changed-only':'none'};}
function coreUncertain(){const r=document.querySelector('#gitl');return!!r&&(!!r.querySelector('#g-send-seen,#g-send-manual')||/uncertain|check the conversation|delivery/i.test(r.querySelector('.g-report')?.textContent||''));}

function begin(method){attempt={id:Math.random().toString(36).slice(2,8).toUpperCase(),method,site:site(),stage:'PLAY',code:'',actuated:false,delivery:'not-observed',at:new Date().toISOString()};paint();return attempt;}
function set(p){if(attempt)Object.assign(attempt,p);paint();}
function fail(code,stage,reason,opt={}){set({code,stage,reason,delivery:opt.delivery||(attempt?.actuated?'uncertain':'not-sent')});if(opt.suggest&&!attempt?.actuated)suggest(opt.suggest);}
function pass(evidence){set({code:'OK',stage:'CONFIRM',reason:evidence,delivery:'confirmed'});feedbackVisible(true);}

async function alpha(){const a=begin('Alpha');if(coreUncertain())return fail('RESCUE-SAFETY-001','PREFLIGHT','Primary has unresolved delivery; Alpha is locked out.',{delivery:'uncertain'});const c=composer();if(!c)return fail('ALPHA-COMP-001','COMPOSER','Alpha could not identify one safe live composer.',{suggest:'Beta'});if(!editorText(c))return fail('ALPHA-STAGE-001','STAGE','The composer is empty. Type the task first.',{suggest:'Beta'});const auth=alphaSend(c);if(!auth.ok)return fail(auth.code,'AUTHORITY',auth.reason,{suggest:'Beta'});const before=snap(c);set({stage:'DISPATCH'});try{a.actuated=true;paint();auth.n.click();}catch(_){return fail('ALPHA-DISPATCH-001','DISPATCH','Alpha could not activate the semantic Send control.',{delivery:'uncertain'});}set({stage:'CONFIRM'});const result=await confirm(before,c);return result.ok?pass(result.evidence):fail('ALPHA-CONF-001','CONFIRM','Alpha actuated once but could not prove delivery. Check the chat before trying another engine.',{delivery:'uncertain'});}
async function beta(){const a=begin('Beta');if(coreUncertain())return fail('RESCUE-SAFETY-001','PREFLIGHT','Primary has unresolved delivery; Beta is locked out.',{delivery:'uncertain'});const c=composer();if(!c)return fail('BETA-COMP-001','COMPOSER','Beta could not identify one safe live composer.',{suggest:'Alpha'});if(!editorText(c))return fail('BETA-STAGE-001','STAGE','The composer is empty. Type the task first.',{suggest:'Alpha'});const f=c.closest('form');if(!f)return fail('BETA-FORM-001','AUTHORITY','Beta requires a native form around the composer; none was found.',{suggest:'Alpha'});if(typeof f.requestSubmit!=='function')return fail('BETA-FORM-002','AUTHORITY','Native form submission is unavailable here.',{suggest:'Alpha'});const before=snap(c);set({stage:'DISPATCH'});try{a.actuated=true;paint();f.requestSubmit();}catch(_){return fail('BETA-DISPATCH-001','DISPATCH','Beta could not invoke the native form submission path.',{delivery:'uncertain'});}set({stage:'CONFIRM'});const result=await confirm(before,c);return result.ok?pass(result.evidence):fail('BETA-CONF-001','CONFIRM','Beta submitted once but could not prove delivery. Check the chat before trying another engine.',{delivery:'uncertain'});}

function primarySuggestSafe(text){const t=String(text||'').toLowerCase();return!!t&&!/uncertain|delivery|sent|confirm|attempted|clicked/.test(t)&&/blocked|missing|not found|cannot find|can't find|adapter|composer|authority/.test(t);}
function observePrimary(){const a=begin('Primary'),before=userTurns();setTimeout(()=>{const r=document.querySelector('#gitl');if(!r||attempt!==a)return;if(r.dataset.run==='1'||/pause/i.test(r.querySelector('#g-play')?.textContent||'')){set({stage:'RUNNING',code:'PRIMARY-RUNNING',reason:'Primary entered RUNNING state.',delivery:'not-observed'});return;}if(coreUncertain()){set({stage:'CONFIRM',code:'PRIMARY-UNCERTAIN',reason:'Primary reports uncertain delivery. Rescue engines are locked out.',delivery:'uncertain'});return;}if(userTurns()>before){pass('new-user-turn');return;}const report=r.querySelector('.g-report')?.textContent||'',core=r.querySelector('.g-report-k')?.textContent?.trim()||'';set({stage:report?'PREFLIGHT':'PLAY',code:core?`PRIMARY-${core}`:'PRIMARY-START-001',reason:report?'Primary reported a failure; the rescue lab did not observe a new outbound turn.':'Primary did not enter RUNNING state and the rescue lab did not observe a new outbound turn.',delivery:'not-observed'});suggest(primarySuggestSafe(report)?'Alpha or Beta after confirming no new message appeared':'Alpha or Beta only if you can see that Primary did not send anything');},2200);}

function record(worked){if(!attempt)return;const row={site:attempt.site,method:attempt.method,worked:!!worked,code:attempt.code||'',stage:attempt.stage||'',core:CORE_VERSION,lab:LAB_VERSION,at:new Date().toISOString()};let rows=[];try{rows=JSON.parse(GM_getValue(STORE_KEY,'[]'))||[];}catch(_){}rows.push(row);rows=rows.slice(-80);try{GM_setValue(STORE_KEY,JSON.stringify(rows));}catch(_){}const line=`GITL-FEEDBACK | ${row.site} | ${row.method} | ${worked?'WORKED':'FAILED'} | ${row.stage} | ${row.code||'none'} | core ${row.core} | lab ${row.lab}`;try{GM_setClipboard(line);}catch(_){try{navigator.clipboard?.writeText?.(line);}catch(_){}}set({feedback:worked?'Worked — redacted result copied':'Failed — redacted result copied'});}
function suggest(text){const x=document.querySelector('#gitl-play-rescue-suggest');if(x){x.hidden=false;x.textContent=`Try ${text}. No automatic fallback will run after a possible send.`;}}
function feedbackVisible(v){const x=document.querySelector('#gitl-play-rescue-feedback');if(x)x.hidden=!v;}
function paint(){const x=document.querySelector('#gitl-play-rescue-status');if(!x)return;if(!attempt){x.textContent='Ready · Primary default · Alpha/Beta available for testing';return;}const d=attempt.delivery==='confirmed'?'confirmed':attempt.delivery==='uncertain'?'delivery uncertain':attempt.delivery==='not-sent'?'nothing sent':'no send observed';x.textContent=`${attempt.id} · ${attempt.method} · ${attempt.stage} · ${d}${attempt.code&&attempt.code!=='OK'?' · '+attempt.code:''}${attempt.feedback?' · '+attempt.feedback:''}`;feedbackVisible(attempt.delivery==='confirmed'||!!attempt.code);}

function styles(){if(document.getElementById('gitl-play-rescue-style'))return;const s=node('style');s.id='gitl-play-rescue-style';s.textContent='#gitl .gitl-brand-words{display:inline-flex;flex-direction:column;line-height:1;margin-left:2px}.gitl-brand-main{font-size:11px;font-weight:800}.gitl-brand-sub{font-size:7.5px;font-weight:600;opacity:.62;margin-top:2px;white-space:nowrap}#gitl.collapsed .gitl-brand-sub{display:none}#gitl-play-rescue-group{margin:6px 0;padding:7px 8px;border:1px solid var(--g-border-2,#2a2c35);border-radius:7px;background:var(--g-surface-2,#17181d)}#gitl-play-rescue-group .pr-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:9px;font-weight:800;color:var(--g-text-mid,#9ca3af)}#gitl-play-rescue-group .pr-note{font-size:8.5px;line-height:1.4;color:var(--g-muted,#6b7280);margin:4px 0 7px}#gitl-play-rescue-group .pr-primary{font-size:8px;font-weight:800;letter-spacing:.03em;color:var(--g-text-low,#777);margin:0 0 3px;text-transform:uppercase}#gitl-play-rescue-group .g-mod-transport{margin:0 0 6px}#gitl-play-rescue{margin:0;padding-top:6px;border-top:1px solid var(--g-border,#292b32)}#gitl-play-rescue .pr-sub{font-size:8px;font-weight:800;letter-spacing:.03em;color:var(--g-text-low,#777);margin:0 0 5px;text-transform:uppercase}#gitl-play-rescue .pr-buttons{display:grid;grid-template-columns:1fr 1fr;gap:5px}#gitl-play-rescue button{font:600 9px/1.2 system-ui;padding:6px 7px;border-radius:6px;border:1px solid var(--g-border-2,#30323a);background:var(--g-surface,#202127);color:var(--g-text,#e5e7eb)}#gitl-play-rescue-status{font:600 8px/1.4 ui-monospace,monospace;color:var(--g-text-low,#777);margin-top:6px;word-break:break-word}#gitl-play-rescue-suggest{font-size:8.5px;color:#f5c86b;margin-top:5px}#gitl-play-rescue-feedback{display:flex;gap:5px;margin-top:6px}#gitl-play-rescue-feedback[hidden],#gitl-play-rescue-suggest[hidden]{display:none}#gitl .gitl-identity-card{margin:0 0 7px;padding:8px 9px;border:1px solid var(--g-border,#292b32);border-radius:7px;background:var(--g-surface-2,#17181d)}#gitl .gitl-identity-title{font-size:11px;font-weight:800}#gitl .gitl-identity-sub,#gitl .gitl-donate{font-size:8.5px;color:var(--g-muted,#777);margin-top:3px}.gitl-donate{display:inline-block;color:var(--g-accent-text,#a5b4fc)!important;text-decoration:none}';(document.head||document.documentElement).appendChild(s);}
function brand(r){const logo=r.querySelector('.g-logo');if(!logo||logo.dataset.rescueBrand==='1'||r.classList.contains('collapsed'))return;const dot=logo.querySelector('.g-dot'),ghost=logo.querySelector('.g-ghost')||node('span','g-ghost','👻'),words=node('span','gitl-brand-words');words.append(node('span','gitl-brand-main','Ghost'),node('span','gitl-brand-sub',`in the Loop · v${CORE_VERSION}`));while(logo.firstChild)logo.removeChild(logo.firstChild);logo.append(ghost,words);if(dot)logo.append(dot);logo.dataset.rescueBrand='1';}
function identity(r){const tc=r.querySelector('#g-tc');if(!r.querySelector('.g-tab.act[data-t="settings"]')||!tc||tc.querySelector('.gitl-identity-card'))return;const card=node('div','gitl-identity-card');card.append(node('div','gitl-identity-title',`Ghost in the Loop · v${CORE_VERSION}`),node('div','gitl-identity-sub',`Play Rescue Lab ${LAB_VERSION} · Free forever · supported by donations`));const a=node('a','gitl-donate','Support development');a.href=SUPPORT_URL;a.target='_blank';a.rel='noopener noreferrer';card.append(a);tc.prepend(card);}
function rescue(r){const t=r.querySelector('.g-mod-transport');if(!t||r.querySelector('#gitl-play-rescue-group'))return;const group=node('div');group.id='gitl-play-rescue-group';const h=node('div','pr-head');h.append(node('span','','Play compatibility check'),node('span','','TEMP'));group.append(h,node('div','pr-note','Three Play methods are shown temporarily while we figure out what changed. Start with Primary. If it fails, confirm nothing was sent, then try Alpha or Beta. Once Primary is reliable again, Ghost goes back to one Play button.'),node('div','pr-primary','Primary · current Ghost'));t.parentNode.insertBefore(group,t);group.append(t);const box=node('div');box.id='gitl-play-rescue';box.append(node('div','pr-sub','Fallback test methods'));const actions=node('div','pr-buttons'),a=btn('gitl-alpha','Alpha · semantic Send'),b=btn('gitl-beta','Beta · native form');actions.append(a,b);box.append(actions);const st=node('div','','Ready · Primary default · Alpha/Beta available for testing');st.id='gitl-play-rescue-status';st.setAttribute('aria-live','polite');box.append(st);const sug=node('div');sug.id='gitl-play-rescue-suggest';sug.hidden=true;box.append(sug);const fb=node('div');fb.id='gitl-play-rescue-feedback';fb.hidden=true;const yes=btn('gitl-worked','👍 Worked'),no=btn('gitl-failed','👎 Failed');fb.append(yes,no);box.append(fb);group.append(box);a.addEventListener('click',alpha);b.addEventListener('click',beta);yes.addEventListener('click',()=>record(true));no.addEventListener('click',()=>record(false));paint();}
function primary(r){const p=r.querySelector('#g-play');if(!p||p.dataset.rescueBound==='1')return;p.dataset.rescueBound='1';p.addEventListener('click',observePrimary,{capture:true});}
function sync(){styles();const r=document.querySelector('#gitl');if(!r)return;brand(r);identity(r);rescue(r);primary(r);}
function schedule(){clearTimeout(syncTimer);syncTimer=setTimeout(sync,60);}
function boot(){sync();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});setInterval(sync,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
