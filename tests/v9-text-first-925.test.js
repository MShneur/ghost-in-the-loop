const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function slice(a,b){const x=src.indexOf(a),y=src.indexOf(b,x+a.length);if(x<0||y<0)throw Error(a);return src.slice(x,y)}
function make(){
 const ctx={
  VER:'9.0.25',displayText:v=>String(v||'').trim(),
  exportFileContext:()=>({platform:'ChatGPT',title:'Test',id:'test'}),esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
 };
 vm.createContext(ctx);
 vm.runInContext(slice('function cleanHandoffText(value){','function download(name,text,type) {'),ctx);
 return ctx;
}
test('default handoff output is Markdown, not image-heavy HTML',()=>{
 expect(src).toContain("GM_getValue('v9.exportFormat','md')");
 expect(src).toContain("GM_getValue('v9.exportRaw', false)");
});
test('media payloads are removed from markdown, HTML, and structured JSON without truncating code',()=>{
 const ctx=make(),image='data:image/png;base64,'+'A'.repeat(80000);
 const full='Message source code: const ok = true;\n![thumbnail]('+image+')\n<svg viewBox="0 0 2 2"><path d="M0 0"/></svg>\nKeep end marker END';
 const cap={platform:'chatgpt',source:'paged',capturedAt:'2026-11-01T12:00:00Z',partial:false,
  turns:[{id:'u1',role:'user',text:full}],verification:{verified:true,assets:2}};
 const md=ctx.markdown(cap),html=ctx.conversationHTML(cap),json=JSON.stringify(ctx.textOnlyExport(cap));
 for(const rendered of [md,html,json]){
  expect(rendered).toContain('const ok = true');
  expect(rendered).toContain('END');
  expect(rendered).not.toContain('data:image');
  expect(rendered).not.toContain('A'.repeat(250));
  expect(rendered).not.toContain('<svg');
  expect(rendered.length).toBeLessThan(3500);
 }
 expect(JSON.parse(json).schema).toBe('ghost-text-handoff/1');
 expect(JSON.parse(json).coverage.verified).toBe(true);
});
test('structured arrays extract known text but never binary blobs or stringified objects',()=>{
 const ctx={displayText:v=>String(v||'').trim()};vm.createContext(ctx);
 vm.runInContext(slice('function asText(value) {','function visibleThinkingFrom(value) {'),ctx);
 expect(ctx.asText([{text:'User'},{parts:[{content:{text:'Assistant'}}]}])).toContain('Assistant');
 expect(ctx.asText({content:{parts:[{type:'image',data:'AAA'},{markdown:'Readable source'}]}})).toBe('Readable source');
 expect(ctx.asText({foo:{bar:123}})).toBe('');
});
test('page snapshot exporter separately strips images and vectors',()=>{
 const f=slice('function pageEvidence() {','function doPageBackup(kind) {');
 expect(f).toContain('svg,img,picture,canvas,video,audio');
});

test('handoff excludes activity and redundant rendered context but preserves user/assistant text',()=>{
 const ctx=make();
 const cap={platform:'chatgpt',source:'pages',partial:false,capturedAt:'2026-11-01T00:00:00Z',
  turns:[{role:'user',text:'Question'},{role:'activity',text:'30000 activity tokens '+('ABC'.repeat(10000))},
         {role:'assistant',text:'Answer',metadata:{visibleDomText:'Duplicated rendered context'}}]};
 const json=JSON.stringify(ctx.textOnlyExport(cap)),md=ctx.markdown(cap),html=ctx.conversationHTML(cap);
 for(const output of [json,md,html]){
  expect(output).toContain('Question');expect(output).toContain('Answer');
  expect(output).not.toContain('30000 activity');expect(output).not.toContain('Duplicated rendered context');
  expect(output.length).toBeLessThan(3600);
 }
 expect(ctx.textOnlyExport(cap).turns).toHaveLength(2);
});
