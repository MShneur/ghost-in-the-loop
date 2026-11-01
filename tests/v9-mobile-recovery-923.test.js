const {TextEncoder,TextDecoder}=require("util");global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),vm=require('vm'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const take=(start,end)=>{const a=src.indexOf(start),b=src.indexOf(end,a+start.length);if(a<0||b<0)throw Error(start);return src.slice(a,b)};
test('exactly five visible skins retain all historical palette implementations',()=>{
 const candidates=["edge-rail","ghostwave","micro-edge","tab-popover","peek-sheet"];
 const ids=src.match(/ACTIVE_UI_SKINS=Object.freeze\((\[[^\]]+\])\)/);
 expect(ids).toBeTruthy();
 expect(ids[1]).toContain('ghostwave');
 expect(ids[1]).toContain('edge-rail');
 expect(src).toContain("const SKINS = Object.freeze({");
 expect(src).toContain("ghostdock:{ name:'Ghostwave Compact'");
 expect(candidates).toHaveLength(5);
 expect(src).toContain('gitl-gw-orbit');
});
test('loading-aware scroll does not stop after 4 short sleeps',()=>{
 const scan=take('async function collectChatGPTDomHistory(){','function reconcileExportTurns(');
 expect(scan).toContain('await waitForHistoryGrowth(true)');
 expect(scan).toContain('await waitForHistoryGrowth(false)');
 expect(scan).toContain('exportRecovery.deadline');
 expect(scan).toContain('EXPORT_WAIT_FOR_HISTORY_MS');
 expect(scan).not.toContain('Date.now()-started<240000');
});
test('nonblocking mobile progress has timer, 5-minute extension and protected cancellation',()=>{
 const dom=new JSDOM('<html><body></body></html>',{url:'https://chatgpt.com/c/123'});
 const ctx={document:dom.window.document,window:dom.window,Date,Number,
   EXPORT_PATIENCE_MS:900000,setInterval,clearInterval,trustedHTML:v=>v,sleep:async()=>{},S:{}};
 vm.createContext(ctx);
 vm.runInContext(take('let exportRecovery = null;','function exportFileContext(){'),ctx);
 const op=ctx.recoveryOpen();
 expect(op.root.getAttribute('aria-modal')).toBe('false');
 expect(op.root.style.pointerEvents).toBe('none');
 expect(op.root.querySelector('[data-export-recovery-clock]')).toBeTruthy();
 const initial=op.deadline;
 op.root.querySelector('[data-recovery-extend]').click();
 expect(op.deadline).toBeGreaterThanOrEqual(initial+300000);
 op.root.querySelector('[data-recovery-pause]').click();
 expect(op.paused).toBe(true);
 op.root.querySelector('[data-recovery-pause]').click();
 expect(op.paused).toBe(false);
 op.root.querySelector('[data-recovery-cancel]').click();
 expect(op.cancelled).toBe(true);
 expect(op.savePartial).toBe(false);
 ctx.recoveryClose(op);dom.window.close();
});
test('partial export uses buttons and keeps retry path without native Android prompt',async()=>{
 const dom=new JSDOM('<html><body></body></html>',{url:'https://chatgpt.com/c/123'});
 const ctx={document:dom.window.document,window:dom.window,S:{detail:''},render:()=>{},trustedHTML:v=>v};
 vm.createContext(ctx);vm.runInContext(take('function confirmPartialExport(cap){','async function doExport('),ctx);
 const prompt=ctx.confirmPartialExport({partial:true,turns:[{role:'user',text:'hello'}]});
 expect(dom.window.document.querySelector('#gitl-partial-choice')).toBeTruthy();
 expect(dom.window.document.querySelector('[data-partial="retry"]')).toBeTruthy();
 dom.window.document.querySelector('[data-partial="save"]').click();
 expect(await prompt).toBe('save');
 expect(dom.window.document.querySelector('#gitl-partial-choice')).toBeNull();
 expect(src).not.toContain('Only '+String.fromCharCode(36)+'{cap.turns.length} messages were recovered. Save explicitly');
 dom.window.close();
});
test('supplementary fragments are not discarded when ordering is unknown',()=>{
 const a=take('function reconcileExportTurns(','async function captureLegacyArchive(){');
 const ctx={displayText:v=>String(v||'')};vm.createContext(ctx);vm.runInContext(a,ctx);
 const result=ctx.reconcileExportTurns([{role:'user',text:'known A'}],[{role:'user',text:'unmatched B'}]);
 expect(result.turns).toHaveLength(1);
 expect(result.unplacedTurns).toHaveLength(1);
 expect(src).toContain('Additional recovered evidence (chronology unknown)');
});
