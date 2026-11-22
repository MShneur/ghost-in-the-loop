const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function claudeCodeSection(){
  const start=source.indexOf('function claudeCodeTranscriptRoot(){');
  const end=source.indexOf('function captureDotExport() {',start);
  if(start<0||end<0)throw new Error('Claude Code collector is missing');
  return source.slice(start,end);
}
function harness(){
  const document=global.document;
  document.body.innerHTML='';
  const root=document.createElement('div');
  root.setAttribute('data-testid','epitaxy-virtual-transcript');
  document.body.appendChild(root);
  const context={document,location:{hostname:'claude.ai',pathname:'/code/session_test'},
    displayText:x=>String(x||'').trim(),S:{mode:'IDLE',sending:false,watchdogBusy:false,topBusy:false},
    exportRecovery:null,EXPORT_PATIENCE_MS:1000,VER:'test',
    sleep:async()=>{},recoveryCancelled:()=>false,recoveryCheckpoint:async()=>{},
    recoveryNotice:()=>{},Date,Map,Number,Set};
  vm.createContext(context);vm.runInContext(claudeCodeSection(),context);
  const add=(index,role,text,entryIndex,indexInEntry)=>{
    const node=document.createElement('div');
    node.dataset.testid='transcript-row';
    node.setAttribute('data-index',String(index));
    node.setAttribute('data-perf-row',role);
    const entry=document.createElement('div');
    entry.setAttribute('data-epitaxy-entry','synthetic-entry-'+entryIndex);
    entry.setAttribute('data-epitaxy-entry-index',String(entryIndex));
    if(indexInEntry!==undefined)entry.setAttribute('data-epitaxy-item-index',String(indexInEntry));
    const content=document.createElement('div');
    content.setAttribute('data-testid',role==='human'?'user-message':'assistant-message');
    content.textContent=text;
    entry.appendChild(content);node.appendChild(entry);root.appendChild(node);
    return node;
  };
  return {context,root,add};
}
describe('Claude Code virtual transcript gap recovery',()=>{
  test('real snapshot gap pattern is not silently called FULL',()=>{
    const h=harness(),cache=new Map();
    // Only synthetic labels: reproduces uploaded SingleFile row indices,
    // without copying any private conversation or credential into GitHub.
    for(let n=44;n<=52;n++)h.add(n,n%2?'human':'assistant','entry '+n,8+(n-44));
    h.add(330,'human','scheduled check-in',222);
    h.add(331,'assistant','limit notice',223);
    h.context.claudeCodeVisibleRows(h.root,cache);
    const c=h.context.claudeCodeIndexCoverage(cache);
    expect(c.renderedRows).toBe(11);
    expect(c.firstIndex).toBe(44);
    expect(c.lastIndex).toBe(331);
    expect(c.missingCount).toBe(321);
    expect(JSON.stringify(c.missingRanges)).toBe(JSON.stringify([[0,43],[53,329]]));
  });
  test('keeps separate Claude Code activity rows and stable chronological order',async()=>{
    const h=harness();
    h.add(0,'human','original user prompt',0);
    h.add(1,'assistant','first response',1,0);
    h.add(2,'assistant','Ran 2 commands',1,1);
    h.add(3,'assistant','result text',1,2);
    const cap=await h.context.captureClaudeCodeExport();
    expect(cap.platform).toBe('claude-code');
    expect(cap.partial).toBe(true);
    expect(cap.turns.map(t=>t.metadata.transcriptRow)).toEqual([0,1,2,3]);
    expect(cap.turns[2].text).toBe('Ran 2 commands');
    expect(cap.verification.missingCount).toBe(0);
    expect(cap.verification.verified).toBe(false); // DOM continuity != server completeness
  });
  test('targeted expanding never clicks Rewind, Edit, Send or unrelated controls',()=>{
    const h=harness(),row=h.add(3,'human','shortened content',2);
    const show=document.createElement('button');
    show.setAttribute('data-testid','user-message-show-more');
    show.setAttribute('aria-expanded','false');
    const rewind=document.createElement('button');
    rewind.setAttribute('aria-label','Rewind to here');
    const send=document.createElement('button');
    send.setAttribute('aria-label','Send');
    const clicks=[];
    for(const [el,name] of [[show,'show'],[rewind,'rewind'],[send,'send']]){
      el.addEventListener('click',()=>clicks.push(name));row.appendChild(el);
    }
    expect(h.context.claudeCodeExpandVisibleRows(h.root,12)).toBe(1);
    expect(clicks).toEqual(['show']);
  });
  test('export routing and serializers retain activity only on Claude Code',()=>{
    expect(source).toContain('const claudeCode=await captureClaudeCodeExport();if(claudeCode)return claudeCode;');
    expect(source).toContain("handoffTurns(cap.turns,cap.platform==='claude-code')");
    expect(source).toContain("'transcriptRow','entryIndex','itemIndex','collapsed','visibleOnly'");
    expect(source).not.toContain('fetch("/code/session_');
  });
});
