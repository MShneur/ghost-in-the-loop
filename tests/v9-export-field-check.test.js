'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function builder(){
  const a=src.indexOf('function fieldCheckSummary('),b=src.indexOf('async function runExportFieldCheck()',a);
  if(a<0||b<=a)throw Error('Field summary source not found');
  const ctx={VER:'9.0.26',HOST:{id:'chatgpt'},EXPORT_FIELD_LIMIT_MS:75000,
    navigator:{userAgent:'Mozilla/5.0 (Android 16; Mobile; rv:155.0) Gecko/155.0 Firefox/155.0'},Date};
  vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);return ctx.fieldCheckSummary;
}
const lane={engine:'1',durationMs:1300,status:'verified',errorKind:null,entries:2,pages:2,nodes:3,
  readable:2,unreadable:0,missingId:0,undecodable:0,redacted:0,mediaExcluded:1,
  nonConversation:1,historyBoundariesConfirmed:true};
test('report is aggregate-only and cannot leak user text, URLs, tokens, filenames or IDs',()=>{
  const f=builder();const report=f({lanes:[lane],domScannerInvocations:0,timedOut:false},
    {partial:false,turns:[{role:'user',id:'PRIVATE_MESSAGE_ID',text:'PRIVATE_TEXT'}],
      activities:[{text:'PRIVATE_TOOL_OUTPUT'}],verification:{historyBoundariesConfirmed:true},
      note:'PRIVATE_NOTE',raw:{secret:'PRIVATE_TOKEN'},title:'PRIVATE_TITLE',
      unplacedTurns:[]},1500,false);
  const serialized=JSON.stringify(report);
  for(const secret of ['PRIVATE_MESSAGE_ID','PRIVATE_TEXT','PRIVATE_TOOL_OUTPUT','PRIVATE_NOTE','PRIVATE_TOKEN','PRIVATE_TITLE'])
    expect(serialized).not.toContain(secret);
  expect(report.authentication.liveAccountIndependentlyVerified).toBe(false);
  expect(report.authentication.sameOriginCredentialedRequests).toBe(true);
  expect(report.coverage.archiveTextVerified).toBe(true);
  expect(report.coverage.historyBoundariesConfirmed).toBe(true);
  expect(report.coverage.independentSourceComparison).toBe(false);
  expect(report.readers.noAutomaticDOMCollector).toBe(true);
  expect(report.environment.android).toBe(true);
  expect(report.environment.firefox).toBe(true);
  expect(report.release).toBe('HOLD');
  expect(report.acceptance).toBe('PENDING_REAL_FIREFOX_ANDROID_REVIEW');
});
test('redactions are reported as source-unverified, not a FULL or field PASS',()=>{
  const f=builder();const redacted={...lane,status:'partial',redacted:201,entries:785,
    unreadable:0,historyBoundariesConfirmed:true};
  const report=f({lanes:[redacted],domScannerInvocations:0,timedOut:false},
    {partial:true,turns:[{role:'assistant',text:'REDACTED_SOURCE'}],
      verification:{verified:false,laneProofs:[{redacted:201}]}},2100,false);
  expect(report.coverage.redacted).toBe(201);
  expect(report.coverage.archiveTextVerified).toBe(false);
  expect(report.result).toBe('SOURCE_UNVERIFIED');
  expect(report.readers.noAutomaticDOMCollector).toBe(true);
});
test('timer expiration and direct scan use remain negative evidence',()=>{
  const f=builder();const report=f({lanes:[lane],domScannerInvocations:1,timedOut:true},null,75000,true);
  expect(report.time.timedOut).toBe(true);
  expect(report.readers.noAutomaticDOMCollector).toBe(false);
  expect(report.result).toBe('TIME_LIMIT');
  expect(report.coverage.archiveTextVerified).toBe(false);
});
test('one-tap button is bounded, local and separate from Play/Send',()=>{
  const from=src.indexOf('async function runExportFieldCheck()'),to=src.indexOf('function report()',from);
  expect(from).toBeGreaterThan(0);expect(to).toBeGreaterThan(from);
  const b=src.slice(from,to);
  expect(b).toContain("captureExport('auto')");
  expect(b).toContain('EXPORT_FIELD_LIMIT_MS');
  expect(b).toContain('progress.controller?.abort()'.replace('progress','op'));
  expect(b).not.toContain("captureEngine('3')");
  expect(b).not.toContain('sendOnce(');
  expect(src).toContain('data-a="field-check"');
});
