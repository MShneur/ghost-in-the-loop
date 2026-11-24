const fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const between=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i+a.length);if(i<0||j<0)throw Error('Missing helper: '+a);return source.slice(i,j);};
const helper=between('async function exportAwaitViewport(','function claudeCodeTranscriptRoot(){');
describe('Adaptive export window traversal',()=>{
 test('immediately returns on the first changed virtualized DOM window',async()=>{
   let clock=0,signature='old',waits=0;
   const ctx={Date:{now:()=>clock},sleep:async ms=>{clock+=ms;waits++;if(clock>=40)signature='new';}};
   vm.createContext(ctx);vm.runInContext(helper,ctx);
   const ok=await ctx.exportAwaitViewport('old',()=>signature,260);
   expect(ok).toBe(true);expect(clock).toBeLessThan(260);expect(waits).toBeLessThan(6);
 });
 test('times out honestly when DOM does not change',async()=>{
   let clock=0;
   const ctx={Date:{now:()=>clock},sleep:async ms=>{clock+=ms;}};
   vm.createContext(ctx);vm.runInContext(helper,ctx);
   const ok=await ctx.exportAwaitViewport('old',()=> 'old',260);
   expect(ok).toBe(false);expect(clock).toBeLessThanOrEqual(260);
 });
 test('both site collectors use adaptive rather than the former fixed delay',()=>{
   const code=between('async function captureClaudeCodeExport(){','function captureDotExport() {');
   const chatgpt=between('async function collectChatGPTDomHistory(){','function reconcileExportTurns(');
   expect(code).toContain('await exportAwaitViewport(');
   expect(chatgpt).toContain('await exportAwaitViewport(');
   expect(code).not.toContain('await sleep(160)');
   expect(chatgpt).not.toContain('await sleep(220)');
   expect(source).toContain("if(HOST.id==='chatgpt')return captureChatGPTPages(chatgptId())");
   expect(source).toContain("const claudeCode=await captureClaudeCodeExport();if(claudeCode)return claudeCode;");
 });
});
