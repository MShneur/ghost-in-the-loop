const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function between(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0)throw new Error('missing '+a);return src.slice(i,j<0?undefined:j);}
describe('v9 API-first export',()=>{
  test('ChatGPT follows current_node parent chain',()=>{const b=between('function parseChatGPTApi','function parsePerplexityApi');expect(b).toContain('data.current_node');expect(b).toContain('chain.unshift(node)');expect(b).toContain('id=node.parent||null');});
  test('Perplexity parses entries and exposed steps',()=>{const b=between('function parsePerplexityApi','async function apiCapture');expect(b).toContain('data.entries');expect(b).toContain('entry?.steps');expect(b).toContain('entry?.reasoning_steps');});
  test('reasoning is labeled platform-visible, never hidden-chain claims',()=>{const b=between('function visibleReasoningText','function report');expect(b).toContain('Platform-visible reasoning');expect(b).not.toMatch(/hidden chain|chain.of.thought|internal reasoning/i);});
  test('auto tries two API lanes; DOM fallback remains explicit opt-in',()=>{const b=between('async function captureLegacyArchive','function markdown');expect(b).toContain('captureChatGPTPages(');expect(b).toContain("'/backend-api/conversation/'");expect(b).toContain('collectChatGPTDomHistory(');expect(b).toContain("['1','2']");expect(b).not.toContain("['1','2','3']");expect(b).toContain('partial:true');expect(b).toContain('if(result?.verified&&result?.turns?.length)break;');});
  test('raw platform JSON is opt-in and off by default',()=>{expect(src).toContain("let exportRaw = !!GM_getValue('v9.exportRaw', false);");expect(src).toContain('data-export-raw');expect(src).toContain('...(exportRaw&&successful.result.raw?{raw:successful.result.raw}:{})');});
  test('export never invokes Play transport',()=>{const b=between('function visibleReasoningText','function report');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('setComposerText(');expect(b).not.toContain('localSendButton(');expect(b).not.toContain('requestSubmit');});
  test('novice copy states completeness plainly',()=>{const b=between('function exportStatus','function report');expect(b).toContain("'text coverage unverified'");expect(b).toContain("'text history verified'");expect(src).toContain('A PARTIAL label means completeness is not proven.');});
});
describe('fast auto archive router behavior',()=>{
  const vm=require('vm');
  function route(fake){
    const a=src.indexOf("async function captureExport(mode='auto'){"),b=src.indexOf('function cleanHandoffText(value){',a);
    if(a<0||b<0)throw Error('export router source missing');
    const calls=[];
    const ctx={captureDotExport:()=>null,captureCodexExport:async()=>null,exportRecovery:null,
      recoveryCancelled:()=>false,recoveryCheckpoint:async()=>{},recoveryNotice:()=>{},
      captureEngine:async id=>{calls.push(id);return fake[id];},
      chooseRecoveredExport:(results,mode)=>({results,mode})};
    vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
    return {run:mode=>ctx.captureExport(mode),calls};
  }
  test('does not scan if paged archive verifies',async()=>{
    const r=route({'1':{verified:true,turns:[{role:'user',text:'complete'}]}});
    await r.run('auto');expect(r.calls).toEqual(['1']);
  });
  test('terminal source redaction never triggers a DOM sweep',async()=>{
    const r=route({'1':{verified:false,turns:[{role:'assistant',text:'redacted'}],
      proof:{historyBoundariesConfirmed:true,redacted:1,unreadable:0}}});
    await r.run('auto');expect(r.calls).toEqual(['1']);
  });
  test('both fast archives can fail without launching minutes of scrolling',async()=>{
    const r=route({'1':{failure:{kind:'shape'}},'2':{failure:{kind:'http',status:404}}});
    const result=await r.run('auto');expect(r.calls).toEqual(['1','2']);expect(result.results).toHaveLength(2);
  });
  test('advanced user may still explicitly select the scrolling engine',async()=>{
    const r=route({'3':{turns:[{role:'user',text:'visible'}],verified:false}});
    await r.run('3');expect(r.calls).toEqual(['3']);
  });
});
