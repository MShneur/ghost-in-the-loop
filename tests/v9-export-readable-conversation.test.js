const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function between(a,b){
 const i=src.indexOf(a),j=src.indexOf(b,i+a.length);
 if(i<0||j<0)throw Error('Missing export source section '+a);
 return src.slice(i,j);
}
function archiveFixture(){
 const ctx={displayText:x=>String(x??'').trim(),archiveMessageEvidence:(m,n)=>({recipient:m?.recipient||'',parentId:n?.parent||''})};
 vm.createContext(ctx);
 vm.runInContext(between('function asText(value) {','function parsePerplexityApi(data){'),ctx);
 const message=(id,role,parts,extra={})=>({id,author:{role},content:{content_type:'text',parts},...extra});
 const mapping={},append=(id,parent,m)=>{mapping[id]={id,parent,message:m};};
 append('u',null,message('u','user',['List the providers']));
 append('t','u',message('t','assistant',['{"path":"/GitHub/link_aaaaaaaaaaaaaaaaaaaa/search","args":{"query":"models"}}'],{recipient:'functions.exec'}));
 append('d','t',message('d','assistant',['<box><grid><text>Providers</text><title>15</title></grid></box>'],
   {metadata:{model_dil_v2:{fallbackMarkdown:'Providers: 15'}}}));
 append('s','d',message('s','assistant',['Worked for 3m 45s']));
 append('n','s',message('n','assistant',[],{metadata:{reasoning_summary:'Checking visible summaries'}}));
 append('m','n',message('m','user',[{content_type:'image_asset_pointer'}],
   {metadata:{attachments:[{name:'example.png',id:'file_abc'}]}}));
 append('f','m',message('f','assistant',['Here are the results.']));
 const data={mapping,current_node:'f'};
 return {ctx,data};
}
function renderer(){
 const ctx={};
 vm.createContext(ctx);
 vm.runInContext(between('function cleanHandoffText(value){','function textOnlyExport(cap){'),ctx);
 return ctx.readableChatGPTExportText;
}
describe('GITL readable ChatGPT export from real failure classes',()=>{
 test('tool calls, status messages and reasoning-only rows are not fake chat turns',()=>{
   const {ctx,data}=archiveFixture();
   const turns=ctx.parseChatGPTApi(data),activities=ctx.parseChatGPTActivities(data);
   expect(turns.map(t=>t.id)).toEqual(['u','d','m','f']);
   expect(turns.map(t=>t.role)).toEqual(['user','assistant','user','assistant']);
   expect(turns[1].text).toBe('Providers: 15');
   expect(activities.map(t=>t.role)).toEqual(['assistant-tool-call','assistant-status','assistant']);
   expect(activities[0].text).toBe('');
   expect(activities[2].thinking).toBe('Checking visible summaries');
   expect(ctx.chatgptArchiveProof(data,turns.length).verified).toBe(true);
 });
 test('literal user-facing JSON code examples are not removed as tool calls',()=>{
   const {ctx}=archiveFixture();
   const code='{"path":"/application/config","args":{"debug":false}}';
   const msg={author:{role:'assistant'},recipient:'all'};
   expect(ctx.isChatGPTToolInvocation(msg,code)).toBe(false);
   expect(ctx.isChatGPTToolInvocation(msg,'{"path":"/GitHub/link_aaaaaaaaaaaaaaaaaaaa/search","args":{}}')).toBe(true);
   expect(ctx.isChatGPTToolInvocation({author:{role:'assistant'},recipient:'functions.exec'},'arbitrary code')).toBe(true);
   expect(ctx.isChatGPTToolInvocation({author:{role:'user'},recipient:'functions.exec'},code)).toBe(false);
 });
 test('static HTML text strips UI scaffolding but keeps fenced code and media placeholders',()=>{
   const read=renderer();
   const rich=read({role:'assistant',text:'<box><grid><grid-item><text>Providers</text><title>15</title></grid-item></grid></box>'},'chatgpt');
   expect(rich).toContain('Providers');
   expect(rich).toContain('15');
   expect(rich).not.toMatch(/<box|<grid|<title|<text/);
   const fence=String.fromCharCode(96).repeat(3);
   const example='Some code:\n'+fence+'html\n<box><text>example</text></box>\n'+fence;
   expect(read({role:'assistant',text:example},'chatgpt')).toBe(example);
   expect(read({role:'user',text:'',metadata:{attachments:[{name:'example.png'}]}},'chatgpt')).toContain('Attached media omitted');
 });
});
