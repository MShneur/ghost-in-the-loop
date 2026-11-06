const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function section(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0||j<0)throw Error('Missing method '+a);return src.slice(i,j);}
function harness(responses){
 const calls=[],status=[],data=section('function reconcileExportTurns(','async function captureLegacyArchive()')+
   section('async function captureLegacyArchive()','function markdown(cap) {');
 const ctx={HOST:{id:'chatgpt'},VER:'9.0.22',exportRaw:false,
   captureDotExport:()=>null,captureCodexExport:async()=>null,
   displayText:x=>String(x||''),recoveryCancelled:()=>false,exportRecovery:null,
   recoveryCheckpoint:async()=>{},recoveryNotice:x=>status.push(x)};
 vm.createContext(ctx);vm.runInContext(data,ctx);
 ctx.captureEngine=async id=>{calls.push(id);return responses[id]||{failure:{reason:'route unavailable'}}};
 return {run:ctx.captureExport,calls,status,choose:ctx.chooseRecoveredExport};
}
const verified=(label)=>({verified:true,source:label,turns:[{role:'user',text:'first'},{role:'assistant',text:'last'}],proof:{verified:true,reason:'complete'}});
const partial=(label)=>({verified:false,source:label,turns:[{role:'user',text:'first'}],failure:{kind:'partial',reason:label+' incomplete'}});
describe('Three independent Ghost export engines',()=>{
 test('Auto stops on verified paginated history',async()=>{
  const h=harness({'1':verified('paged')});const r=await h.run('auto');
  expect(h.calls).toEqual(['1']);expect(r.partial).toBe(false);expect(r.engine).toBe('1');
 });
 test('Auto falls back to original archive without invoking scroll when verified',async()=>{
  const h=harness({'1':partial('paged'),'2':verified('tree')});const r=await h.run('auto');
  expect(h.calls).toEqual(['1','2']);expect(r.partial).toBe(false);expect(r.engine).toBe('2');
 });
 test('Auto never launches an unapproved DOM sweep after two API failures',async()=>{
  const h=harness({'1':partial('paged'),'2':{failure:{reason:'tree blocked'}},'3':partial('scroll')});
  const r=await h.run('auto');
  expect(h.calls).toEqual(['1','2']);expect(r.partial).toBe(true);
  expect(r.verification.attempted).toEqual(['1','2']);
  expect(r.turns).toHaveLength(1);
 });
 test.each(['1','2','3'])('Manual Export %s does not touch other engines',async(engine)=>{
  const h=harness({[engine]:partial(engine)});const r=await h.run(engine);
  expect(h.calls).toEqual([engine]);expect(r.engine).toBe(engine);expect(r.partial).toBe(true);
 });
 test('No engine incorrectly treats scrolling result as verified',async()=>{
  const h=harness({'3':{source:'scroll',turns:[{role:'user',text:'hello'}],verified:false,proof:{verified:false,reason:'both ends reached'}}});
  const r=await h.run('3');expect(r.partial).toBe(true);expect(r.source).toContain('unverified');
 });
 test('Buttons start independent exports in the UI, and HTML is selectable',()=>{
  for(const k of ['auto','1','2','3'])expect(src).toContain('data-export-engine="'+k+'"');
  expect(src).toContain('doExport(exportFormat,btn.dataset.exportEngine)');
  expect(src).toContain('data-export-format');
  expect(src).toContain('HTML');
  expect(src).not.toContain('No mobile scrolling was required.');
 });
});
