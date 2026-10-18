const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('path').join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const section=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert(i>=0&&j>i);return src.slice(i,j)};
const parsers=section('function chatgptArchiveProof','function parsePerplexityApi');
function env(){const c={asText:v=>typeof v==='string'?v.trim():Array.isArray(v)?v.filter(x=>typeof x==='string').join('\n').trim():'',visibleThinkingFrom:()=>''};vm.createContext(c);vm.runInContext(parsers,c);return c}
function archive(n=240){const mapping={};let prev=null;for(let i=0;i<n;i++){const id='n'+i;mapping[id]={id,parent:prev,message:{author:{role:i%2?'assistant':'user'},content:{parts:['message '+i]}}};prev=id;}return {mapping,current_node:prev}}
describe('Ghost export behavioral integrity',()=>{
  test('240-message archive verified and ordered',()=>{const c=env(),d=archive();const t=c.parseChatGPTApi(d),p=c.chatgptArchiveProof(d,t.length);expect(t).toHaveLength(240);expect(t[0].text).toBe('message 0');expect(t.at(-1).text).toBe('message 239');expect(p.verified).toBe(true)});
  test('detect missing parent',()=>{const c=env(),d=archive(8);d.mapping.n0.parent='missing';expect(c.chatgptArchiveProof(d,c.parseChatGPTApi(d).length).reason).toBe('missing parent message')});
  test('detect cyclic parent chain',()=>{const c=env(),d=archive(8);d.mapping.n0.parent='n7';expect(c.chatgptArchiveProof(d,c.parseChatGPTApi(d).length).verified).toBe(false)});
  test('detect missing current node',()=>{const c=env(),d=archive(8);d.current_node='missing';expect(c.chatgptArchiveProof(d,8).verified).toBe(false)});
  test('mark rich assets unverified',()=>{const c=env(),d=archive(8);d.mapping.n3.message.metadata={attachments:[{id:'f1'}]};expect(c.chatgptArchiveProof(d,8).reason).toBe('files or media not captured')});
  test('interactive reply uses fallback Markdown',()=>{const c=env(),d=archive(8);d.mapping.n3.message.content={parts:[]};d.mapping.n3.message.metadata={model_dil_v2:{fallbackMarkdown:'usable Markdown'}};expect(c.parseChatGPTApi(d)[3].text).toBe('usable Markdown')});
  test('HTTP 403 does not retry and does not claim full export',async()=>{
    let calls=0;const c={HOST:{id:'chatgpt'},chatgptId:()=> 'abc',fetch:async()=>{calls++;return {ok:false,status:403}},log:()=>{},sleep:async()=>{},parseChatGPTApi:()=>[],chatgptArchiveProof:()=>({}),exportReason:(status,kind)=>'HTTP '+status};vm.createContext(c);
    vm.runInContext(section('async function apiCapture','function chatgptVisibleRows'),c);const result=await c.apiCapture();expect(calls).toBe(1);expect(result.failure.status).toBe(403)
  });
  test('HTTP 429 retries then succeeds',async()=>{
    const d=archive(8),c=env();let calls=0;Object.assign(c,{HOST:{id:'chatgpt'},chatgptId:()=> 'abc',fetch:async()=>{calls++;return calls===1?{ok:false,status:429,headers:{get:()=>null}}:{ok:true,json:async()=>d}},log:()=>{},sleep:async()=>{}});vm.runInContext(section('async function apiCapture','function chatgptVisibleRows'),c);
    const result=await c.apiCapture();expect(calls).toBe(2);expect(result.verified).toBe(true);
  });
  test('partial export and project vault require consent',()=>{expect(src).toContain('if(!confirmPartialExport(cap))return;');expect(src).toContain("prefix=cap.partial?'ghost-PARTIAL-'");expect(src).toContain('lastExport: S.lastExport || null')});
  test('Play and Send authority unaffected by export logic',()=>{const b=section('function chatgptArchiveProof','function markdown(cap)');expect(b).not.toContain('requestSubmit(');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('localSendButton(')});
});
