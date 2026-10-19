const fs=require('fs'),path=require('path'),vm=require('vm');
const {TextEncoder,TextDecoder}=require('util');global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const start=source.indexOf('let exportRecovery = null;'),end=source.indexOf('function exportStatus(cap,action){',start);
if(start<0||end<0)throw Error('Recovery utilities not present');
const functions=source.slice(start,end);
function harness(){
 const dom=new JSDOM('<html><body><main></main></body></html>',{url:'https://chatgpt.com/c/12345678-1234-1234-1234-123456789abc',pretendToBeVisual:true});
 const w=dom.window;let name='My export · ChatGPT',project='Penny Clearance';
 const ctx={document:w.document,window:w,HOST:{id:'chatgpt'},vaultProjectId:'p',ProjectVault:{get:()=>({name:project})},chatgptId:()=> '12345678-1234-1234-1234-123456789abc',perplexitySlug:()=>'',Date,Number,sleep:async()=>{},trustedHTML:s=>s};
 Object.defineProperty(w.document,'title',{get:()=>name,set:v=>{name=v},configurable:true});
 vm.createContext(ctx);vm.runInContext(functions,ctx);
 return {w,ctx,close:()=>w.close()};
}
describe('recover conversation controller and identifying filenames',()=>{
 test('default filename has product, platform, project, readable title, unique id and timestamp',()=>{
  const t=harness();try{
    const name=t.ctx.exportFileName({partial:false,capturedAt:'2026-10-18T19:22:13.222Z'},'md');
    for(const x of ['GITL','ChatGPT','Penny Clearance','My export','123456789abc','2026-10-18_19-22-13','FULL.md'])expect(name).toContain(x);
  }finally{t.close()}
 });
 test('partial filename cannot masquerade as full',()=>{
  const t=harness();try{expect(t.ctx.exportFileName({partial:true,capturedAt:'2026-10-18T19:22:13Z'},'json')).toMatch(/_PARTIAL\.json$/)}finally{t.close()}
 });
 test('filename sanitizes reserved characters and has bounded title',()=>{
  const t=harness();try{
    t.w.document.title='a/b:c*d?e"f<g>h|i — ChatGPT';
    const name=t.ctx.exportFileName({partial:true,capturedAt:'2026-10-18T19:22:13Z'},'md');
    expect(name).not.toMatch(/[\/\\:*?"<>|]/);expect(name).toContain('a_b_c_d_e_f_g_h_i');
  }finally{t.close()}
 });
 test('recovery dialog can pause, resume, save partial and close cleanly',()=>{
  const t=harness();try{
    const op=t.ctx.recoveryOpen();expect(t.w.document.querySelector('#gitl-export-recovery')).toBeTruthy();
    const pause=op.root.querySelector('[data-recovery-pause]');pause.click();expect(op.paused).toBe(true);
    pause.click();expect(op.paused).toBe(false);
    op.root.querySelector('[data-recovery-save]').click();expect(op.cancelled).toBe(true);expect(op.savePartial).toBe(true);
    t.ctx.recoveryClose(op);expect(t.w.document.querySelector('#gitl-export-recovery')).toBeFalsy();
  }finally{t.close()}
 });
 test('Cancel does not authorize partial save',()=>{
  const t=harness();try{
    const op=t.ctx.recoveryOpen();op.root.querySelector('[data-recovery-cancel]').click();
    expect(op.cancelled).toBe(true);expect(op.savePartial).toBe(false);
  }finally{t.close()}
 });
 test('paused collector checks are cancellable and bound collection is explicit',()=>{
  expect(source).toContain('for(passes=0;passes<900&&Date.now()-started<240000;passes++)');
  expect(source).toContain('if(recoveryCancelled())break;');
  expect(source).toContain('await recoveryCheckpoint()');
  expect(source).toContain("if(!(progress.savePartial&&cap.partial)&&!confirmPartialExport(cap))return;");
 });
});
