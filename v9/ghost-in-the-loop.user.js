// ==UserScript==
// @name         Ghost in the Loop 9
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      9.0.0-alpha.1
// @description  Perpetual Play + truthful Export. Optional external protocol activators. No controller-side reasoning.
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
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @noframes
// @license      AGPL-3.0
// ==/UserScript==

(() => {
'use strict';
if (window.__GITL_V9__) return;
window.__GITL_V9__ = true;

const VER='9.0.0-alpha.1';
const G={P:'[[GITL::PROCEED]]',U:'[[GITL::HUMAN]]',H:'[[GITL::HALT]]'};
const A={P:'[[AOA::CONTINUE]]',U:'[[AOA::HUMAN]]',H:'[[AOA::HALT]]'};
const AOA_BRANCH='feature/plex-universal-model-relay';
const ACT={
  plex:['PLEX',`https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/modes/plex.md`],
  relay:['Model Relay',`https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/workflows/model-relay.md`],
  human:['Human Gate','https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/human-gate-committee.md'],
  cleanerz:['Cleanerz','https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/cleanerz.md'],
  quorum:['Quorum','https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/quorum.md'],
  ctrl:['CTRL-AI','https://raw.githubusercontent.com/MShneur/CTRL-AI/main/llms-full.txt'],
  rduck:['R-Duck','https://raw.githubusercontent.com/MShneur/R-Duck/main/AGENTS.md']
};
const BASE=[
  '[GHOST CORE CONTROL]',
  'Continue the existing task without restarting completed work.',
  'You own all reasoning, planning, batching, milestones, committees, research, recovery, and decisions.',
  'Ghost is only the mechanical relay. Never ask Ghost to interpret the work.',
  'The FINAL non-whitespace line of every response must be exactly one of:',
  `${G.P}  -- more work remains`,`${G.U}  -- human input is genuinely required`,`${G.H}  -- task complete`,
  'If an active external protocol defines its own terminal contract, follow that exact contract.',
  'Never place terminal markers anywhere except the final control line.'
].join('\n');
const CONT='Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid terminal control line.';
const REGROUND='You strayed from the active control protocol. Re-read the existing conversation, reground in the current task, and continue without restarting. Follow all active external protocols exactly. Your response must end with exactly one valid terminal control line.';

const PROFILES=[
 {id:'perplexity',host:/perplexity\.ai$/i,input:['#ask-input[contenteditable="true"]','div[role="textbox"][data-lexical-editor="true"]','div[contenteditable="true"][role="textbox"]'],send:['button[aria-label="Submit"]','button[aria-label="Send"]'],stop:['button[aria-label="Stop"]','button[aria-label*="Stop response" i]','[data-testid="stop-button"]'],user:['.group\\/user-bubble'],assistant:['[data-workflow-final-text]','div[class*="prose"]'],api:'perplexity'},
 {id:'chatgpt',host:/chatgpt\.com$|chat\.openai\.com$/i,input:['#prompt-textarea','textarea[data-id="root"]','div[contenteditable="true"][id="prompt-textarea"]'],send:['#composer-submit-button','button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send message"]'],stop:['button[data-testid="stop-button"]','button[aria-label="Stop generating"]','button[aria-label="Stop streaming"]'],user:['[data-message-author-role="user"]'],assistant:['[data-message-author-role="assistant"]'],api:'chatgpt'},
 {id:'generic',host:/.*/,input:['div[contenteditable="true"][role="textbox"]','textarea[placeholder]','textarea','div[contenteditable="true"]'],send:['button[aria-label*="Send" i]','button[aria-label="Submit"]','button[type="submit"]'],stop:['button[aria-label*="Stop" i]','[data-testid*="stop" i]'],user:['[data-message-author-role="user"]','[data-role="user"]'],assistant:['[data-message-author-role="assistant"]','[data-role="assistant"]','main article']}
];
const HOST=PROFILES.find(p=>p.host.test(location.hostname))||PROFILES[2];
const S={mode:'IDLE',detail:'Ready',round:0,max:+GM_getValue('v9.max',25)||25,sending:false,uncertain:false,last:'',stable:'',stableN:0,drift:0,addonsInjected:false,relay:'',timer:null,tab:GM_getValue('v9.tab','play'),events:[]};
const ON={}; Object.keys(ACT).forEach(k=>ON[k]=!!GM_getValue(`v9.act.${k}`,false));
let custom=String(GM_getValue('v9.custom','')||'');

const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const visible=e=>!!e&&e.isConnected&&!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
function qs(list,root=document){for(const s of list||[]){try{const e=[...root.querySelectorAll(s)].find(visible);if(e)return e}catch(_){}}return null}
function qa(list){const a=[],seen=new Set();for(const s of list||[]){try{for(const e of document.querySelectorAll(s))if(!seen.has(e)){seen.add(e);a.push(e)}}catch(_){}}return a}
function input(){return qs(HOST.input)}
function sendBtn(i=input()){if(!i)return null;for(let n=i,d=0;n&&d<8;n=n.parentElement,d++){const b=qs(HOST.send,n);if(b)return b}return qs(HOST.send)}
function generating(){return !!qs(HOST.stop)}
function txt(e){return clean(e?.innerText??e?.textContent??e?.value??'')}
function assistant(){const a=qa(HOST.assistant).filter(e=>e.isConnected&&txt(e));return a.length?txt(a[a.length-1]):''}
function hash(s){let h=2166136261;for(const c of String(s||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return `${String(s||'').length}:${(h>>>0).toString(16)}`}
function lastLine(s){const a=String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);return a.at(-1)||''}
function terminal(s){const l=lastLine(s);if([G.P,A.P].includes(l))return{t:'go',raw:l};if([G.U,A.U].includes(l))return{t:'human',raw:l};if([G.H,A.H].includes(l))return{t:'halt',raw:l};const m=l.match(/^\[\[AOA::RELAY:([^\]\r\n]{1,80})\]\]$/);return m?{t:'relay',model:m[1].trim(),raw:l}:{t:'bad',raw:l||'(empty)'}}
function log(type,data={}){S.events.push({at:new Date().toISOString(),type,data});if(S.events.length>50)S.events.shift();try{console.debug('[GITL9]',type,data)}catch(_){}}
function notify(title,text){try{GM_notification?.({title,text,timeout:8000})}catch(_){}}

async function write(text){let i=input();if(!i)return{ok:false,why:'input-missing'};try{i.focus();if(i.isContentEditable){const r=document.createRange(),sel=getSelection();r.selectNodeContents(i);sel.removeAllRanges();sel.addRange(r);let ok=false;try{ok=document.execCommand('insertText',false,text)}catch(_){}if(!ok){i.textContent=text;i.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}))}else i.dispatchEvent(new Event('input',{bubbles:true}))}else{const p=i.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const set=Object.getOwnPropertyDescriptor(p,'value')?.set;if(set)set.call(i,text);else i.value=text;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}}catch(e){return{ok:false,why:'write-exception',error:String(e?.message||e)}}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await sleep(100);i=input();if(!i)return{ok:false,why:'input-replaced-missing'};return clean(text)===txt(i)?{ok:true,i}:{ok:false,why:'visible-text-mismatch'}}
function userCount(){return qa(HOST.user).filter(e=>e.isConnected).length}
async function confirm(beforeUsers,beforeText){const st=Date.now();while(Date.now()-st<16000){if(generating())return{ok:true,why:'generation-started'};if(userCount()>beforeUsers)return{ok:true,why:'new-user-turn'};const i=input();if(i&&beforeText&&txt(i)==='')return{ok:true,why:'composer-cleared'};await sleep(250)}return{ok:false,why:'unconfirmed'}}
async function sendOnce(text,reason){if(S.mode!=='RUNNING'||S.sending||S.uncertain)return false;S.sending=true;S.detail=`Staging ${reason}...`;render();const before=userCount(),w=await write(text);if(!w.ok){S.sending=false;pause(`Play failed before Send: ${w.why}`);log('stage-failed',w);return false}const b=sendBtn(w.i);if(!b){S.sending=false;pause('Play failed: host Send control not found. Prompt is still staged.');log('send-missing',{host:HOST.id});return false}const bt=txt(w.i);try{b.click();log('send-click',{reason,round:S.round+1})}catch(e){S.sending=false;S.uncertain=true;pause('Send threw after actuation. Stopped to prevent duplicate delivery.');return false}const c=await confirm(before,bt);S.sending=false;if(!c.ok){S.uncertain=true;pause('Send attempted but delivery could not be confirmed. Ghost will not resend.');log('send-uncertain');return false}S.round++;S.detail=`Sent once · ${c.why}`;S.stable='';S.stableN=0;log('send-ok',{round:S.round,why:c.why});render();return true}

function fetchText(url){return new Promise((res,rej)=>{try{GM_xmlhttpRequest({method:'GET',url,timeout:12000,onload:r=>r.status>=200&&r.status<300?res(String(r.responseText||'')):rej(new Error(`HTTP ${r.status}`)),onerror:()=>rej(new Error('network')),ontimeout:()=>rej(new Error('timeout'))})}catch(e){rej(e)}})}
async function component(key){const spec=ACT[key];if(!spec)return'';const ck=`v9.cache.${key}`,c=GM_getValue(ck,null);if(c?.text&&Date.now()-c.at<21600000)return c.text;try{const t=await fetchText(spec[1]);GM_setValue(ck,{at:Date.now(),text:t});return t}catch(e){log('component-fetch-fail',{key});return''}}
async function addons(){const out=[];for(const k of Object.keys(ON).filter(k=>ON[k])){const [name,url]=ACT[k],t=await component(k);out.push(`[ACTIVATE EXTERNAL PROTOCOL: ${name}]\nCanonical source: ${url}\nApply it silently to the existing task without restarting.`);if(t)out.push(`<EXTERNAL_PROTOCOL id="${k}">\n${t}\n</EXTERNAL_PROTOCOL>`)}if(custom.trim()){const p=custom.trim().replace(/^\/+/,''),u=`https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/${p}`;let t='';try{t=await fetchText(u)}catch(_){}out.push(`[ACTIVATE AGENTS-OF-AI COMPONENT]\nCanonical source: ${u}\nApply it silently without restarting.`);if(t)out.push(`<EXTERNAL_PROTOCOL id="custom">\n${t}\n</EXTERNAL_PROTOCOL>`)}return out.join('\n\n')}
async function initial(existing=''){const ad=await addons();S.addonsInjected=true;const p=`${existing?existing+'\n\n---\n':''}${BASE}`;return ad?`${p}\n\n${ad}`:p}
async function nextPrompt(){if(!S.addonsInjected&&(Object.values(ON).some(Boolean)||custom.trim()))return`${CONT}\n\n${BASE}\n\n${await addons()}`;return CONT}
async function cleanerz(){if(!ON.cleanerz)return false;const [_,u]=ACT.cleanerz,t=await component('cleanerz');return sendOnce(`Protocol compliance failed twice. Activate Agents-of-AI Cleanerz now.\nCanonical source: ${u}\n${t?`<EXTERNAL_PROTOCOL id="cleanerz">\n${t}\n</EXTERNAL_PROTOCOL>\n`:''}Use Cleanerz to reground the existing task and active protocols. Do not restart completed work. Continue and end with exactly one valid terminal control line.`,'Cleanerz recovery')}
async function drift(raw){S.drift++;log('drift',{n:S.drift,tail:String(raw).slice(0,80)});if(S.drift===1)return void await sendOnce(REGROUND,'protocol reground');if(S.drift===2&&ON.cleanerz)return void await cleanerz();pause(`Protocol drift repeated ${S.drift} times. Human review required.`)}
async function handle(text){const fp=hash(text);if(!text||fp===S.last||S.mode!=='RUNNING'||S.sending)return;S.last=fp;const x=terminal(text);if(x.t==='halt'){S.drift=0;return complete('Task complete')}if(x.t==='human'){S.drift=0;pause('Human gate requested by the AI.');return notify('Ghost paused','The AI requested a human decision.')}if(x.t==='relay'){S.drift=0;S.relay=x.model;pause(`Model Relay requested: ${x.model}. Automatic selector switching is not field-certified yet.`);return notify('Model Relay requested',x.model)}if(x.t==='go'){S.drift=0;if(S.round>=S.max)return pause('Round safety limit reached.');return void await sendOnce(await nextPrompt(),'continue')}return void await drift(x.raw)}
async function tick(){if(S.mode!=='RUNNING'||S.sending||S.uncertain)return;if(generating()){S.detail='Model working...';S.stableN=0;return render()}const t=assistant();if(!t){S.detail='Waiting for assistant output...';return render()}const f=hash(t);if(f===S.stable)S.stableN++;else{S.stable=f;S.stableN=1}S.detail=S.stableN>=2?'Output stopped · checking terminal':'Output stopped · confirming stable';render();if(S.stableN>=2)await handle(t)}
async function play(){if(S.mode==='RUNNING')return;if(S.uncertain){S.detail='Prior Send uncertain. Inspect chat or Page Reload before resuming.';return render()}const i=input();if(!i){S.detail='Play failed: chat input not found.';return render()}S.mode='RUNNING';S.detail='Starting...';S.last='';S.stable='';S.stableN=0;S.drift=0;render();const cur=txt(i);if(cur){if(!await sendOnce(await initial(cur),'initial'))return}else{const x=terminal(assistant());if(x.t==='go'){if(!await sendOnce(await nextPrompt(),'resume'))return}else if(x.t==='halt')return complete('Task already complete');else if(x.t==='human')return pause('Existing conversation is waiting for a human decision.');else if(x.t==='relay'){S.relay=x.model;return pause(`Model Relay requested: ${x.model}.`)}else if(!await sendOnce(await initial(),'bootstrap existing conversation'))return}clearInterval(S.timer);S.timer=setInterval(()=>tick().catch(fail),1400);render()}
function pause(d='Paused'){S.mode='PAUSED';S.detail=d;clearInterval(S.timer);S.timer=null;render()}
function stop(){Object.assign(S,{mode:'IDLE',detail:'Stopped',sending:false,uncertain:false,last:'',stable:'',stableN:0,drift:0,addonsInjected:false,relay:'',round:0});clearInterval(S.timer);S.timer=null;render()}
function complete(d='Complete'){S.mode='COMPLETE';S.detail=d;clearInterval(S.timer);S.timer=null;render();notify('Ghost complete',d)}
function fail(e){S.mode='ERROR';S.detail=String(e?.message||e||'Unknown error');clearInterval(S.timer);S.timer=null;log('error',{detail:S.detail});render()}

function order(e){let n=0,w=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_ELEMENT);while(w.nextNode()){n++;if(w.currentNode===e)return n}return Number.MAX_SAFE_INTEGER}
function dedupe(a){const o=[];for(const r of a){const p=o.at(-1);if(!p||p.role!==r.role||p.text!==r.text)o.push(r)}return o}
function domMessages(){const r=[];for(const e of qa(HOST.user).filter(e=>txt(e)))r.push({role:'user',text:txt(e),o:order(e)});for(const e of qa(HOST.assistant).filter(e=>txt(e)))r.push({role:'assistant',text:txt(e),o:order(e)});return dedupe(r.sort((a,b)=>a.o-b.o).map(({role,text})=>({role,text})))}
async function exportChatGPT(){const m=location.pathname.match(/\/c\/([\w-]+)/);if(!m)throw Error('conversation id unavailable');const r=await fetch(`/backend-api/conversation/${encodeURIComponent(m[1])}`,{credentials:'include'});if(!r.ok)throw Error(`HTTP ${r.status}`);const d=await r.json(),a=[];for(const n of Object.values(d.mapping||{})){const q=n?.message,role=q?.author?.role,parts=q?.content?.parts;if(['user','assistant'].includes(role)&&Array.isArray(parts)){const text=clean(parts.filter(x=>typeof x==='string').join('\n'));if(text)a.push({role,text,time:q.create_time||0})}}a.sort((x,y)=>x.time-y.time);return{source:'api',completeness:'best-effort-full',messages:a,raw:d}}
function walkP(v,out,seen=new Set()){if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(Array.isArray(v))return v.forEach(x=>walkP(x,out,seen));const role=v.role||v.author||v.sender,text=v.text||v.content||v.answer||v.query;if(['user','assistant'].includes(role)&&typeof text==='string'&&clean(text))out.push({role,text:clean(text)});Object.values(v).forEach(x=>walkP(x,out,seen))}
async function exportPerplexity(){const m=location.pathname.match(/\/search\/([^/?#]+)/);if(!m)throw Error('thread slug unavailable');const r=await fetch(`/rest/thread/${encodeURIComponent(m[1])}`,{credentials:'include'});if(!r.ok)throw Error(`HTTP ${r.status}`);const d=await r.json(),a=[];walkP(d,a);return{source:'api',completeness:a.length?'best-effort-full':'raw-only',messages:dedupe(a),raw:d}}
async function capture(){try{if(HOST.api==='chatgpt')return await exportChatGPT();if(HOST.api==='perplexity')return await exportPerplexity()}catch(e){log('export-api-fallback',{why:String(e?.message||e)})}return{source:'dom',completeness:'partial',messages:domMessages()}}
function md(c){return['# Ghost in the Loop Export',`- Version: ${VER}`,`- Platform: ${HOST.id}`,`- Capture source: ${c.source}`,`- Completeness: ${c.completeness}`,`- Exported: ${new Date().toISOString()}`,'',...(c.messages||[]).map((m,i)=>`## ${i+1}. ${m.role.toUpperCase()}\n\n${m.text}\n`)].join('\n')}
function dl(name,text,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function doExport(fmt){S.detail='Capturing conversation...';render();const c=await capture();if(!(c.messages||[]).length&&!c.raw){S.detail='Export found no messages.';return render()}const stamp=new Date().toISOString().replace(/[:.]/g,'-');if(fmt==='md')dl(`ghost-${HOST.id}-${stamp}.md`,md(c),'text/markdown;charset=utf-8');if(fmt==='json')dl(`ghost-${HOST.id}-${stamp}.json`,JSON.stringify({version:VER,platform:HOST.id,capturedAt:new Date().toISOString(),...c},null,2),'application/json;charset=utf-8');if(fmt==='copy'){try{GM_setClipboard(md(c),'text')}catch(_){await navigator.clipboard?.writeText(md(c))}}S.detail=`Export ready · ${c.source}/${c.completeness}`;render()}
function diag(){return{version:VER,platform:HOST.id,mode:S.mode,round:S.round,max:S.max,input:!!input(),send:!!sendBtn(),generating:generating(),terminal:terminal(assistant()).t,drift:S.drift,uncertain:S.uncertain,relay:S.relay||null,activators:Object.keys(ON).filter(k=>ON[k]),custom:custom||null,at:new Date().toISOString(),events:S.events.slice(-15)}}

const E=(tag,o={},kids=[])=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(o)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2).toLowerCase(),v);else e.setAttribute(k,String(v))}for(const x of(Array.isArray(kids)?kids:[kids]))if(x)e.appendChild(typeof x==='string'?document.createTextNode(x):x);return e};
const css=E('style',{text:`#gitl9{position:fixed;z-index:2147483646;top:74px;right:8px;width:min(330px,calc(100vw - 16px));max-height:78vh;overflow:auto;background:#151417;color:#eee;border:1px solid #3a3840;border-radius:12px;box-shadow:0 10px 30px #0008;font:12px/1.35 ui-monospace,monospace;padding:9px}#gitl9 *{box-sizing:border-box}#gitl9 button,#gitl9 input{font:inherit}#gitl9 .h{display:flex;justify-content:space-between;gap:6px;align-items:center}#gitl9 .t{font-weight:800}#gitl9 .m{opacity:.62;font-size:10px}#gitl9 .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:6px 0}#gitl9 button{border:1px solid #45424c;border-radius:8px;background:#25232a;color:#eee;padding:7px 5px}#gitl9 button.on{background:#073f30;border-color:#0b7659;color:#79efc7}#gitl9 button.d{background:#421417;border-color:#81282f;color:#ff9ca4}#gitl9 .g2{display:grid;grid-template-columns:1fr 1fr;gap:5px}#gitl9 .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}#gitl9 .s{background:#0e0d10;border-radius:8px;padding:8px;margin:6px 0;white-space:pre-wrap;word-break:break-word}#gitl9 .r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 2px;border-bottom:1px solid #2a282f}#gitl9 input{width:100%;background:#0e0d10;color:#eee;border:1px solid #444;border-radius:7px;padding:7px}#gitl9 pre{white-space:pre-wrap;word-break:break-word;background:#0e0d10;border-radius:8px;padding:7px;max-height:220px;overflow:auto;font-size:10px}#gitl9 .sec{margin-top:7px;padding-top:7px;border-top:1px solid #333}`});document.documentElement.appendChild(css);
const panel=E('div',{id:'gitl9'});(document.body||document.documentElement).appendChild(panel);
const B=(text,fn,cl='')=>E('button',{text,class:cl,onclick:fn});
function setTab(t){S.tab=t;GM_setValue('v9.tab',t);render()}
function header(){panel.appendChild(E('div',{class:'h'},[E('div',{},[E('div',{class:'t',text:'👻 GHOST 9'}),E('div',{class:'m',text:`${HOST.id} · ${VER}`})]),E('span',{class:'m',text:S.mode})]));const t=E('div',{class:'tabs'});[['play','Play'],['aoa','AoA'],['export','Export'],['diag','Diag']].forEach(([k,l])=>t.appendChild(B(l,()=>setTab(k),S.tab===k?'on':'')));panel.appendChild(t)}
function playTab(){panel.appendChild(E('div',{class:'s',text:`${S.detail}\nround ${S.round}/${S.max}${S.drift?` · drift ${S.drift}`:''}${S.relay?`\nrelay: ${S.relay}`:''}`}));panel.appendChild(E('div',{class:'g2'},[B(S.mode==='PAUSED'?'▶ Resume':'▶ Play',()=>play().catch(fail),'on'),B('■ Stop',stop,'d')]));panel.appendChild(E('div',{class:'g2 sec'},[B('↻ Page Reload',()=>location.reload()),B('Clear Send Hold',()=>{S.uncertain=false;S.detail='Send hold cleared by user.';render()})]));const n=E('input',{type:'number',min:'1',max:'200',value:String(S.max)});n.onchange=()=>{S.max=Math.max(1,Math.min(200,+n.value||25));GM_setValue('v9.max',S.max)};panel.appendChild(E('div',{class:'r sec'},[E('span',{text:'Safety round limit'}),n]))}
function aoaTab(){panel.appendChild(E('div',{class:'m',text:'Activators add instructions to Play. They never replace transport.'}));for(const[k,[name]]of Object.entries(ACT)){panel.appendChild(E('div',{class:'r'},[E('span',{text:name}),B(ON[k]?'ON':'OFF',()=>{ON[k]=!ON[k];GM_setValue(`v9.act.${k}`,ON[k]);S.addonsInjected=false;render()},ON[k]?'on':'')]))}const i=E('input',{type:'text',value:custom,placeholder:'Optional AoA path: personas/...'});i.onchange=()=>{custom=i.value.trim();GM_setValue('v9.custom',custom);S.addonsInjected=false};panel.appendChild(E('div',{class:'sec'},[E('div',{class:'m',text:'Custom Agents-of-AI component path'}),i]));panel.appendChild(E('div',{class:'m sec',text:'Drift 1: fixed reground. Drift 2: Cleanerz if enabled. Repeated drift: stop.'}))}
function exportTab(){panel.appendChild(E('div',{class:'m',text:'Independent from Play. API-first on ChatGPT/Perplexity; DOM fallback is labeled partial.'}));panel.appendChild(E('div',{class:'g3 sec'},[B('Markdown',()=>doExport('md').catch(fail)),B('JSON',()=>doExport('json').catch(fail)),B('Copy',()=>doExport('copy').catch(fail))]))}
function diagTab(){panel.appendChild(E('pre',{text:JSON.stringify(diag(),null,2)}));panel.appendChild(E('div',{class:'g2'},[B('Copy report',async()=>{const t=JSON.stringify(diag(),null,2);try{GM_setClipboard(t,'text')}catch(_){await navigator.clipboard?.writeText(t)}}),B('Re-detect',()=>{S.detail=`input:${!!input()} send:${!!sendBtn()} stop:${generating()}`;render()})]))}
function render(){while(panel.firstChild)panel.removeChild(panel.firstChild);header();if(S.tab==='play')playTab();if(S.tab==='aoa')aoaTab();if(S.tab==='export')exportTab();if(S.tab==='diag')diagTab()}
render();log('boot',{version:VER,host:HOST.id});
})();
