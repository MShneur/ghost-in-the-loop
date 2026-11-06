const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const a=src.indexOf('async function captureChatGPTPages('),b=src.indexOf('async function apiCapture(){',a);
if(a<0||b<=a)throw Error('Modern ChatGPT history loader missing');
const code=src.slice(a,b);
const page=(start,n,older,newer,id='chat-test')=>({conversation_id:id,messages:Array.from({length:n},(_,i)=>{const j=start+i;return {id:'m'+j,author:{role:j%2?'assistant':'user'},content:{parts:['Message '+j]}}}),page_info:{has_previous_page:older,has_next_page:newer,start_cursor:'m'+start,end_cursor:'m'+(start+n-1)}});
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
function loader(fetch){
  const ctx={fetch,AbortController,setTimeout,clearTimeout,encodeURIComponent,HOST:{id:'chatgpt'},exportRaw:false,
    asText:v=>typeof v==='string'?v:Array.isArray(v)?v.filter(x=>typeof x==='string').join('\n'):'',
    visibleThinkingFrom:()=>'',exportReason:(n)=>'HTTP '+n,log:()=>{},sleep:async()=>{},
    recoveryCancelled:()=>false,recoveryNotice:()=>{},exportRecovery:null,recoveryCheckpoint:async()=>{}};
  vm.createContext(ctx);vm.runInContext(code,ctx);return ctx.captureChatGPTPages;
}
describe('ChatGPT modern paginated history (isolated read-only)',()=>{
  test('collects 240 turns from three pages without DOM',async()=>{
    const calls=[],p0=page(0,100,false,true),p1=page(100,100,true,true),p2=page(200,40,true,false);
    const go=loader(async(url,opts)=>{calls.push({url,opts});if(url==='/api/auth/session')return response({accessToken:'mock-token'});
      if(url.includes('before=m200'))return response(p1);if(url.includes('before=m100'))return response(p0);return response(p2)});
    const r=await go('chat-test');expect(r.verified).toBe(true);expect(r.turns).toHaveLength(240);
    expect(r.turns[0].text).toBe('Message 0');expect(r.turns.at(-1).text).toBe('Message 239');
    expect(calls.filter(x=>x.url.includes('/backend-api/'))).toHaveLength(3);
    expect(JSON.stringify(r)).not.toContain('mock-token');
  });
  test('never retries HTTP 403 through another endpoint',async()=>{
    let calls=0;const go=loader(async url=>{if(url==='/api/auth/session')return response({});calls++;return response({},403)});
    const r=await go('chat-test');expect(calls).toBe(1);expect(r.failure.status).toBe(403);
  });
  test('retries a transient 429 and then succeeds',async()=>{
    let calls=0;const go=loader(async url=>{if(url==='/api/auth/session')return response({});calls++;return calls===1?response({},429):response(page(0,3,false,false))});
    const r=await go('chat-test');expect(calls).toBe(2);expect(r.turns).toHaveLength(3);expect(r.verified).toBe(true);
  });
  test('rejects a repeated history cursor',async()=>{
    const p=page(0,4,true,false);p.page_info.start_cursor='repeat';
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');expect(r.verified).toBe(false);expect(r.failure.kind).toBe('cursor');
  });
  test('refuses another conversation identity',async()=>{
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(page(0,3,false,false,'different')));
    const r=await go('chat-test');expect(r.failure.kind).toBe('identity');expect(r.turns).toBeUndefined();
  });
  test('verifies complete text despite intentionally excluded media attachments',async()=>{
    const p=page(0,3,false,false);p.messages[1].metadata={attachments:[{id:'f1'}]};
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');
    expect(r.verified).toBe(true);expect(r.proof.textVerified).toBe(true);
    expect(r.proof.mediaExcluded).toBe(1);
    expect(r.proof.reason).toContain('Complete text history');
  });
  test('non-conversational tool messages with missing IDs cannot falsely block complete text',async()=>{
    const p=page(0,2,false,false);
    p.messages.push({author:{role:'tool'},content:{parts:[{image:'large'}]}});
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');
    expect(r.verified).toBe(true);expect(r.proof.unreadable).toBe(0);
    expect(r.turns).toHaveLength(2);
  });
  test('unreadable genuine assistant text still blocks full text verification',async()=>{
    const p=page(0,2,false,false);
    p.messages[1].content={content_type:'unsupported_text',parts:[{unexpected:'x'}]};
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');
    expect(r.verified).toBe(false);expect(r.proof.unreadable).toBe(1);
  });
  test('redacted platform tool output is counted and never relabeled full because the page reached both ends',async()=>{
    const p=page(0,2,false,false);
    p.messages.push({id:'redacted',author:{role:'assistant'},content:{parts:['The output of this plugin was redacted.']}});
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');
    expect(r.verified).toBe(false);
    expect(r.proof.redacted).toBe(1);
    expect(r.proof.historyBoundariesConfirmed).toBe(true);
    expect(r.proof.reason).toMatch(/Source redacted/);
  });
  test('unreadable user/assistant message reports specific counts and does not claim FULL',async()=>{
    const p=page(0,2,false,false);
    p.messages[1].content={parts:[{unknown_text_format:true}]};
    const go=loader(async url=>url==='/api/auth/session'?response({}):response(p));
    const r=await go('chat-test');
    expect(r.proof.undecodable).toBe(1);
    expect(r.proof.missingId).toBe(0);
    expect(r.verified).toBe(false);
  });
  test('tries alternate modern route on HTTP 404',async()=>{
    let calls=0;const go=loader(async url=>{if(url==='/api/auth/session')return response({});calls++;return calls===1?response({},404):response(page(0,3,false,false))});
    const r=await go('chat-test');expect(calls).toBe(2);expect(r.verified).toBe(true);
  });
  test('mobile DOM adaptation and bounded fallback exist without changing Send',()=>{
    expect(src).toContain("document.querySelector('[data-scroll-root]')");
    expect(src).toContain("section[data-turn=\"user\"],section[data-turn=\"assistant\"]");
    expect(src).toContain('for(passes=0;passes<3600&&(exportRecovery?Date.now()<exportRecovery.deadline:Date.now()-started<EXPORT_PATIENCE_MS);passes++)');
    const exportSection=src.slice(src.indexOf("async function captureExport(mode='auto'){"),src.indexOf('function markdown(cap)'));
    expect(exportSection).not.toContain('if(api?.turns?.length&&api.proof?.pages)return');
    expect(exportSection).toContain('chooseRecoveredExport(');
    expect(exportSection).not.toContain('sendOnce(');
  });
});
