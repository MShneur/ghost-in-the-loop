// ==UserScript==
// @name         GITL Dual-AI Automatic Field Tester
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.2.0
// @description  One-button ChatGPT + Perplexity first-send/follow-up field tester with fail-closed Send safety.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const V='0.2.0', STAGE=4500, ACK=18000, READY=120000, MANUAL=35000, POLL=160, KEY='gitl-dual-ai-report:';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)), now=()=>new Date().toISOString(), norm=v=>String(v??'').replace(/\s+/g,' ').trim();
  const site=/perplexity\.ai$/i.test(location.hostname)?'perplexity':(/chatgpt\.com$|chat\.openai\.com$/i.test(location.hostname)?'chatgpt':'unknown');
  const label=site==='perplexity'?'Perplexity':site==='chatgpt'?'ChatGPT':location.hostname;
  const state={version:V,site,host:location.hostname,userAgent:navigator.userAgent,startedAt:null,finishedAt:null,running:false,final:'NOT_RUN',cycles:[],manualCheck:null,events:[]};
  let statusEl,runBtn,copyBtn,bothBtn;

  const visible=el=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return r.width>1&&r.height>1&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0};
  const text=el=>!el?'':(('value'in el&&typeof el.value==='string')?el.value:(el.innerText??el.textContent??''));
  const log=(type,data={})=>state.events.push({at:now(),type,...data});
  const setStatus=t=>{if(statusEl)statusEl.textContent=t};

  function editors(){
    const set=new Set(),sels=['textarea','[contenteditable="true"]','[role="textbox"][contenteditable="true"]','[data-lexical-editor="true"]','.ProseMirror[contenteditable="true"]'];
    for(const s of sels){try{document.querySelectorAll(s).forEach(el=>visible(el)&&set.add(el))}catch(_){}}
    return [...set].filter(el=>!/(search settings|rename|filter|sidebar|search chats)/.test(`${norm(el.getAttribute('aria-label'))} ${norm(el.getAttribute('placeholder'))}`.toLowerCase()));
  }
  function editorScore(el){const r=el.getBoundingClientRect(),a=`${norm(el.getAttribute('aria-label'))} ${norm(el.getAttribute('placeholder'))}`.toLowerCase();let n=r.bottom+r.width/1000;if(document.activeElement===el||el.contains(document.activeElement))n+=100000;if(/message|ask|prompt|anything|follow|reply/.test(a))n+=12000;if(el.closest('form'))n+=2500;if(el.matches('[data-lexical-editor="true"],.ProseMirror'))n+=1500;return n}
  function findEditor(){const all=editors().sort((a,b)=>editorScore(b)-editorScore(a));return{editor:all[0]||null,count:all.length}}

  function sends(){
    const set=new Set(),sels=['button[type="submit"]','button[data-testid*="send" i]','button[data-testid*="submit" i]','button[aria-label*="send" i]','button[aria-label*="submit" i]','[role="button"][aria-label*="send" i]','[role="button"][aria-label*="submit" i]'];
    for(const s of sels){try{document.querySelectorAll(s).forEach(el=>visible(el)&&set.add(el))}catch(_){}}
    return [...set].filter(el=>!/(stop|cancel|voice|upload|attach|search)/.test(`${norm(el.getAttribute('aria-label'))} ${norm(el.textContent)} ${norm(el.getAttribute('data-testid'))}`.toLowerCase()));
  }
  const enabled=el=>!!el&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&!el.hasAttribute('data-disabled');
  function sendState(){const all=sends(),on=all.filter(enabled);return{allCount:all.length,enabledCount:on.length,button:on.length===1?on[0]:null}}
  function generating(){for(const s of ['button[aria-label*="stop" i]','button[data-testid*="stop" i]','[role="button"][aria-label*="stop" i]']){try{if([...document.querySelectorAll(s)].some(visible))return true}catch(_){}}return false}

  function nativeSet(el,v){const p=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLInputElement?HTMLInputElement.prototype:null,d=p&&Object.getOwnPropertyDescriptor(p,'value');if(d?.set)d.set.call(el,v);else if('value'in el)el.value=v;else el.textContent=v}
  function domSet(el,v){if(el instanceof HTMLTextAreaElement||el instanceof HTMLInputElement)nativeSet(el,v);else{el.textContent='';el.appendChild(document.createTextNode(v))}}
  function selectAll(el){el.focus();if(el instanceof HTMLTextAreaElement||el instanceof HTMLInputElement){try{el.select()}catch(_){};return}const s=getSelection();if(!s)return;const r=document.createRange();r.selectNodeContents(el);s.removeAllRanges();s.addRange(r)}
  function input(el,type,data){try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:type,data}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}}
  function clear(el){if(!el)return;try{el.focus();if(el.isContentEditable){selectAll(el);let ok=false;try{ok=document.execCommand('delete',false)}catch(_){}if(!ok)domSet(el,'')}else nativeSet(el,'');input(el,'deleteContentBackward',null);el.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}}

  async function execStage(el,v){el.focus();selectAll(el);let ok=false;try{ok=document.execCommand('insertText',false,v)}catch(_){}if(!ok||norm(text(el))!==norm(v))domSet(el,v);input(el,'insertText',v);el.dispatchEvent(new Event('change',{bubbles:true}))}
  async function nativeStage(el,v){el.focus();domSet(el,v);input(el,'insertText',v);el.dispatchEvent(new Event('change',{bubbles:true}))}
  async function beforeStage(el,v){el.focus();clear(el);try{el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:v}))}catch(_){}domSet(el,v);input(el,'insertText',v)}
  async function rangeStage(el,v){if(!el.isContentEditable)return nativeStage(el,v);el.focus();selectAll(el);const s=getSelection(),r=s?.rangeCount?s.getRangeAt(0):null;if(!r)return nativeStage(el,v);r.deleteContents();const n=document.createTextNode(v);r.insertNode(n);r.setStartAfter(n);r.collapse(true);s.removeAllRanges();s.addRange(r);input(el,'insertText',v)}
  async function compositionStage(el,v){el.focus();clear(el);try{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''}));el.dispatchEvent(new CompositionEvent('compositionupdate',{bubbles:true,data:v}))}catch(_){}domSet(el,v);try{el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:v}))}catch(_){}input(el,'insertCompositionText',v)}
  const methods=[['execcommand',execStage],['native-setter',nativeStage],['beforeinput',beforeStage],['range-input',rangeStage],['composition-input',compositionStage]];

  const promptFor=(cycle,method)=>`GITL FIELD TEST ${label} CYCLE-${cycle} ${method} ${Math.random().toString(36).slice(2,8).toUpperCase()}. Reply only: OK-${cycle}`;
  async function waitSend(ms){const end=Date.now()+ms;let s=sendState();while(Date.now()<end){s=sendState();if(s.enabledCount>1)return{ok:false,reason:'AMBIGUOUS_SEND',...s};if(s.button)return{ok:true,reason:null,...s};await sleep(POLL)}s=sendState();return{ok:false,reason:s.enabledCount>1?'AMBIGUOUS_SEND':'SEND_DISABLED_TIMEOUT',...s}}
  async function waitAck(editor,sent){const end=Date.now()+ACK;while(Date.now()<end){const cur=findEditor().editor||editor;if(norm(text(cur))!==norm(sent)||generating())return true;await sleep(POLL)}return false}
  async function waitReady(){const end=Date.now()+READY;let saw=false,stable=null;while(Date.now()<end){const active=generating();if(active){saw=true;stable=null}else if(saw){if(!stable)stable=Date.now();if(Date.now()-stable>1000&&findEditor().editor)return{ok:true,sawGeneration:true}}else if(findEditor().editor&&sendState().allCount>=1){if(!stable)stable=Date.now();if(Date.now()-stable>12000)return{ok:true,sawGeneration:false}}await sleep(350)}return{ok:false,sawGeneration:saw,active:generating()}}

  async function stageUntilReady(cycle){
    const attempts=[];let lastEditor=null;
    for(const [name,fn] of methods){
      setStatus(`Cycle ${cycle}: ${name}…`);const found=findEditor();if(!found.editor)return{ok:false,reason:'NO_EDITOR',attempts};
      const p=promptFor(cycle,name);clear(found.editor);await sleep(120);let err=null;try{await fn(found.editor,p)}catch(e){err=e?.name||'Error'}await sleep(220);
      const after=findEditor(),editor=after.editor||found.editor;lastEditor=editor;const shown=norm(text(editor)).includes(`GITL FIELD TEST ${label} CYCLE-${cycle}`);
      const rec={method:name,editorCandidatesBefore:found.count,editorCandidatesAfter:after.count,textVisible:shown,stageException:err,sendCandidates:0,enabledSendCandidates:0,result:'NO_SEND'};attempts.push(rec);
      if(err||!shown){rec.result=err?'STAGE_EXCEPTION':'TEXT_NOT_VISIBLE';continue}
      const ready=await waitSend(STAGE);rec.sendCandidates=ready.allCount;rec.enabledSendCandidates=ready.enabledCount;
      if(ready.reason==='AMBIGUOUS_SEND'){rec.result='AMBIGUOUS_SEND';return{ok:false,reason:'AMBIGUOUS_SEND',attempts,editor,prompt:p}}
      if(ready.ok){rec.result='SEND_READY';return{ok:true,method:name,attempts,editor,prompt:p,button:ready.button}}
      rec.result='SEND_DISABLED';
    }
    return{ok:false,reason:lastEditor?'ALL_METHODS_SEND_DISABLED':'NO_EDITOR',attempts,editor:lastEditor};
  }

  async function manualProbe(editor){
    if(!editor)return null;const start=norm(text(editor)),before=sendState();setStatus('Manual check: type ONE normal character. Do not press Send.');const end=Date.now()+MANUAL;let typed=false,after=before;
    while(Date.now()<end){const cur=findEditor().editor||editor;if(norm(text(cur))!==start)typed=true;after=sendState();if(typed&&after.enabledCount!==before.enabledCount)break;await sleep(POLL)}
    return{needed:true,typed,beforeEnabledCount:before.enabledCount,afterEnabledCount:after.enabledCount,enabledAfterKeystroke:typed&&after.enabledCount===1,ambiguousAfterKeystroke:typed&&after.enabledCount>1};
  }

  async function cycle(n){
    const rec={cycle:n,startedAt:now(),attempts:[],chosenMethod:null,sent:false,sendAck:false,responseComplete:false,result:'FAIL',reason:null};state.cycles.push(rec);
    const staged=await stageUntilReady(n);rec.attempts=staged.attempts;
    if(!staged.ok){rec.reason=staged.reason;if(staged.reason==='ALL_METHODS_SEND_DISABLED'){state.manualCheck=await manualProbe(staged.editor);rec.reason=state.manualCheck?.enabledAfterKeystroke?'PROGRAMMATIC_TEXT_NOT_COMMITTED':state.manualCheck?.typed?'SEND_STILL_DISABLED_AFTER_REAL_KEYSTROKE':'MANUAL_KEYSTROKE_TIMEOUT'}return rec}
    rec.chosenMethod=staged.method;const pre=sendState();if(pre.enabledCount!==1||pre.button!==staged.button||!enabled(staged.button)){rec.reason=pre.enabledCount>1?'AMBIGUOUS_SEND_AT_ACTUATION':'SEND_CHANGED_BEFORE_ACTUATION';return rec}
    setStatus(`Cycle ${n}: sending once…`);staged.button.click();rec.sent=true;log('send-click',{cycle:n,method:staged.method});rec.sendAck=await waitAck(staged.editor,staged.prompt);
    if(!rec.sendAck){rec.result='UNCERTAIN';rec.reason='SEND_ACK_TIMEOUT';return rec}
    setStatus(`Cycle ${n}: waiting for reply…`);const ready=await waitReady();rec.responseComplete=ready.ok;rec.sawGeneration=ready.sawGeneration;if(!ready.ok){rec.reason=ready.active?'GENERATION_TIMEOUT_ACTIVE':'RESPONSE_READY_TIMEOUT';return rec}
    rec.result='PASS';rec.finishedAt=now();return rec;
  }

  function classify(){const a=state.cycles[0],b=state.cycles[1];if(!a)return'NO_RESULT';if(a.result==='UNCERTAIN')return'STOPPED_UNCERTAIN_FIRST_SEND';if(a.result!=='PASS')return`FIRST_CYCLE_FAILED:${a.reason||'UNKNOWN'}`;if(!b)return'FIRST_CYCLE_ONLY';if(b.result==='UNCERTAIN')return'STOPPED_UNCERTAIN_FOLLOWUP_SEND';if(b.result==='PASS')return'PASS_BOTH_CYCLES';if(b.reason==='PROGRAMMATIC_TEXT_NOT_COMMITTED')return'FOLLOWUP_REQUIRES_REAL_KEYSTROKE';return`FOLLOWUP_FAILED:${b.reason||'UNKNOWN'}`}
  const report=()=>({tool:'GITL Dual-AI Automatic Field Tester',version:V,site:state.site,host:state.host,startedAt:state.startedAt,finishedAt:state.finishedAt,userAgent:state.userAgent,final:state.final,cycles:state.cycles,manualCheck:state.manualCheck,events:state.events,privacy:'No conversation history or assistant response text is collected.'});
  async function save(){try{await GM_setValue(KEY+site,report())}catch(_){}}
  async function load(s){try{return await GM_getValue(KEY+s,null)}catch(_){return null}}
  async function refreshBoth(){bothBtn.hidden=!((await load('chatgpt'))&&(await load('perplexity')))}
  async function copyCurrent(){const s=JSON.stringify(report(),null,2);try{GM_setClipboard(s,'text');setStatus('Report copied.')}catch(_){try{await navigator.clipboard.writeText(s);setStatus('Report copied.')}catch(_){setStatus('Copy failed.')}}}
  async function copyBoth(){const s=JSON.stringify({tool:'GITL Dual-AI Automatic Field Tester',version:V,copiedAt:now(),chatgpt:await load('chatgpt'),perplexity:await load('perplexity')},null,2);try{GM_setClipboard(s,'text');setStatus('Both reports copied.')}catch(_){try{await navigator.clipboard.writeText(s);setStatus('Both reports copied.')}catch(_){setStatus('Copy failed.')}}}

  async function run(){
    if(state.running)return;state.running=true;state.startedAt=now();state.finishedAt=null;state.final='RUNNING';state.cycles=[];state.manualCheck=null;state.events=[];runBtn.disabled=true;copyBtn.hidden=true;bothBtn.hidden=true;
    try{setStatus(`${label}: finding message box…`);if(!findEditor().editor){state.final='NO_EDITOR';return}const first=await cycle(1);if(first.result!=='PASS'){state.final=classify();return}await sleep(700);await cycle(2);state.final=classify();if(state.final==='PASS_BOTH_CYCLES')setStatus(`${label}: PASS — first send + follow-up.`)}catch(e){state.final=`TESTER_EXCEPTION:${e?.name||'Error'}`;log('tester-exception',{name:e?.name||'Error'})}finally{state.running=false;state.finishedAt=now();await save();runBtn.disabled=false;copyBtn.hidden=false;await refreshBoth();if(state.final!=='PASS_BOTH_CYCLES')setStatus(`${label}: ${state.final}`)}
  }

  function mount(){
    if(document.getElementById('gitl-dual-ai-auto-tester'))return;const host=document.createElement('div');host.id='gitl-dual-ai-auto-tester';Object.assign(host.style,{position:'fixed',right:'8px',bottom:'8px',zIndex:'2147483647',width:'min(286px, calc(100vw - 16px))',maxWidth:'286px'});document.documentElement.appendChild(host);const sh=host.attachShadow({mode:'open'});
    sh.innerHTML=`<style>:host{all:initial}.card{box-sizing:border-box;width:100%;border-radius:12px;border:1px solid rgba(127,127,127,.38);background:rgba(24,24,27,.96);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.28);padding:10px;font:12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.head{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px}.title{font-weight:700;font-size:13px}.site{opacity:.75;font-size:11px}.status{min-height:34px;max-height:74px;overflow:auto;border-radius:8px;background:rgba(255,255,255,.07);padding:7px;margin-bottom:8px;overflow-wrap:anywhere}.buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px}button{min-height:40px;border:0;border-radius:9px;padding:7px 8px;font:600 12px system-ui;cursor:pointer}button:disabled{opacity:.5;cursor:default}.run{grid-column:1/-1;font-size:13px}[hidden]{display:none!important}.foot{margin-top:6px;opacity:.6;font-size:10px}</style><div class="card"><div class="head"><div class="title">GITL Field Tester</div><div class="site">${label} · v${V}</div></div><div class="status" id="status">Ready. Press RUN once.</div><div class="buttons"><button class="run" id="run" type="button">RUN THIS SITE</button><button id="copy" type="button" hidden>COPY REPORT</button><button id="both" type="button" hidden>COPY BOTH</button></div><div class="foot">Maximum two controlled sends. Stops on ambiguity or uncertain Send.</div></div>`;
    statusEl=sh.getElementById('status');runBtn=sh.getElementById('run');copyBtn=sh.getElementById('copy');bothBtn=sh.getElementById('both');runBtn.addEventListener('click',run);copyBtn.addEventListener('click',copyCurrent);bothBtn.addEventListener('click',copyBoth);refreshBoth();
  }
  mount();
})();
