const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function section(start,end){const a=src.indexOf(start),b=src.indexOf(end,a+start.length);if(a<0||b<0)throw Error('function missing '+start);return src.slice(a,b)}
test('all legacy skins preserved and three structural choices added',()=>{
 const part=section('const SKINS =','const ACCENTS =');
 expect((part.match(/name:'[^']+'/g)||[])).toHaveLength(20);
 for(const id of ['classic','ghostwave','ghostdock','edge-rail','command-selector','micro-edge','tab-popover','peek-sheet'])expect(part).toContain(id);
 for(const id of ['micro-edge','tab-popover','peek-sheet'])expect(src).toContain('data-skin="'+id+'"');
});
test('standalone conversation HTML escapes injected markup and marks partial',()=>{
 const fn=section('function conversationHTML(cap){','function download(');
 const ctx={exportFileContext:()=>({platform:'ChatGPT',title:'Test'}),esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(ctx);vm.runInContext(fn,ctx);
 const h=ctx.conversationHTML({partial:true,note:'missing <page>',capturedAt:'today',turns:[{role:'user',text:'<script>alert("x")</script>'},{role:'assistant',text:'safe'}]});
 expect(h).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
 expect(h).not.toContain('<script>');
 expect(h).toContain('PARTIAL EXPORT');
 expect(h).toContain("default-src 'none'");
});
test('archive fallback cannot skip scroll and merge preserves archive',()=>{
 const fn=section('function reconcileExportTurns(','async function captureExport(){');
 const ctx={displayText:v=>String(v)};
 vm.createContext(ctx);vm.runInContext(fn,ctx);
 const a=[{role:'user',text:'first'},{role:'assistant',text:'third'}];
 const d=[{role:'user',text:'first'},{role:'assistant',text:'second'},{role:'assistant',text:'third'}];
 const got=ctx.reconcileExportTurns(a,d);
 expect(got.turns.map(x=>x.text).join('|')).toBe('first|second|third');
 expect(src).toContain('Part one incomplete. Trying scrolling fallback.');
 expect(src).not.toContain('No mobile scrolling was required.');
 const capture=section('async function captureExport(){','function markdown(cap) {');
 expect(capture).not.toContain('if(api?.turns?.length&&api.proof?.pages)return');
 expect(capture).not.toContain('sendOnce(');
});
