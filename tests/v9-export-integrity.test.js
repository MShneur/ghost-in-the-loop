const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('path').join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const section=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert(i>=0&&j>i);return src.slice(i,j)};
const parsers=section('function chatgptArchiveProof','function parsePerplexityApi')+section('function archiveMessageEvidence','async function chatgptExportAuthHeaders');
function env(){const c={asText:v=>typeof v==='string'?v.trim():Array.isArray(v)?v.filter(x=>typeof x==='string').join('\n').trim():'',visibleThinkingFrom:()=>''};vm.createContext(c);vm.runInContext(parsers,c);return c}
function archive(n=240){const mapping={};let prev=null;for(let i=0;i<n;i++){const id='n'+i;mapping[id]={id,parent:prev,message:{author:{role:i%2?'assistant':'user'},content:{parts:['message '+i]}}};prev=id;}return {mapping,current_node:prev}}
describe('Ghost export behavioral integrity',()=>{
  test('240-message archive verified and ordered',()=>{const c=env(),d=archive();const t=c.parseChatGPTApi(d),p=c.chatgptArchiveProof(d,t.length);expect(t).toHaveLength(240);expect(t[0].text).toBe('message 0');expect(t.at(-1).text).toBe('message 239');expect(p.verified).toBe(true)});
  test('detect missing parent',()=>{const c=env(),d=archive(8);d.mapping.n0.parent='missing';expect(c.chatgptArchiveProof(d,c.parseChatGPTApi(d).length).reason).toBe('missing parent message')});
  test('detect cyclic parent chain',()=>{const c=env(),d=archive(8);d.mapping.n0.parent='n7';expect(c.chatgptArchiveProof(d,c.parseChatGPTApi(d).length).verified).toBe(false)});
  test('detect missing current node',()=>{const c=env(),d=archive(8);d.current_node='missing';expect(c.chatgptArchiveProof(d,8).verified).toBe(false)});
  test('text history can verify while separately identifying excluded binary media',()=>{const c=env(),d=archive(8);d.mapping.n3.message.metadata={attachments:[{id:'f1'}]};const proof=c.chatgptArchiveProof(d,8);expect(proof.verified).toBe(true);expect(proof.mediaExcluded).toBe(1);expect(proof.reason).toMatch(/media intentionally excluded/)});
  test('interactive reply uses fallback Markdown',()=>{const c=env(),d=archive(8);d.mapping.n3.message.content={parts:[]};d.mapping.n3.message.metadata={model_dil_v2:{fallbackMarkdown:'usable Markdown'}};expect(c.parseChatGPTApi(d)[3].text).toBe('usable Markdown')});
  test('modern HTTP 403 fails closed without legacy endpoint probe',async()=>{
    let legacyCalls=0;
    const c={HOST:{id:'chatgpt'},chatgptId:()=> 'abc',
      captureChatGPTPages:async()=>({failure:{kind:'http',status:403,reason:'access denied'}}),
      fetch:async()=>{legacyCalls++;throw Error('legacy should not be probed')}};
    vm.createContext(c);
    vm.runInContext(section('async function apiCapture','function chatgptVisibleRows'),c);
    const result=await c.apiCapture();
    expect(result.failure.status).toBe(403);
    expect(legacyCalls).toBe(0);
  });
  test('verified paged archive stops without redundant legacy request',async()=>{
    const d=archive(8),c=env();let legacyCalls=0;
    Object.assign(c,{HOST:{id:'chatgpt'},chatgptId:()=> 'abc',
      captureChatGPTPages:async()=>({verified:true,turns:c.parseChatGPTApi(d),proof:{verified:true}}),
      fetch:async()=>{legacyCalls++;throw Error('legacy should not be probed')}});
    vm.runInContext(section('async function apiCapture','function chatgptVisibleRows'),c);
    const result=await c.apiCapture();
    expect(result.verified).toBe(true);
    expect(result.turns).toHaveLength(8);
    expect(legacyCalls).toBe(0);
  });
  test('partial export and project vault require explicit consent',()=>{
    expect(src).toContain('let decision=await confirmPartialExport(cap)');
    expect(src).toContain('data-partial="save"');
    expect(src).toContain("if(decision!=='save')");
    expect(src).toContain('ProjectVault');
    expect(src).toContain('lastExport: S.lastExport || null');
  });
  test('Play and Send authority unaffected by export logic',()=>{const b=section('function chatgptArchiveProof','function markdown(cap)');expect(b).not.toContain('requestSubmit(');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('localSendButton(')});
});
