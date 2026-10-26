const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
describe('Ghost 9.0.20 live-visibility contract',()=>{
  test('loop status is explicit in full panel and collapsed rail',()=>{
    expect(src).toContain('data-live-step');
    expect(src).toContain('data-rail-round');
    expect(src).toContain('data-live-state');
    expect(src).toContain("set(liveStatusNodes.step,S.round+' / '+S.max)");
    expect(src).toContain("set(liveStatusNodes.rail,S.round+'/'+S.max)");
  });
  test('seven visible tabs, native accordions and switches retained',()=>{
    expect((src.match(/type="button" data-tab="/g)||[]).length).toBe(7);
    expect(src).toContain('nav class="tabs g-site-nav"');
    expect(src).toContain('data-g-acc="settings-approval"');
    expect(src).toContain('data-approval-watch');
  });
  test('DOM hydration recovery and one-Send authority retained',()=>{
    expect(src).toContain('ghostMountObserver.observe(document');
    expect(src).toContain('scheduleGhostRemount');
    expect((src.match(/button\.click\(\)/g)||[]).length).toBe(1);
    expect(src).not.toContain('requestSubmit(');
  });
  test('Auto-Approve is visible in Auto and operates independently of chat Play',()=>{
    expect(src).toContain('data-auto-approve');
    expect(src).toContain("autoApproveOn = false");
    expect(src).toContain("approve.click();");
    expect(src).toContain("approvalClickedButtons.add(approve)");
    expect(src).toContain("panel.querySelector('[data-auto-approve]')");
    expect(src).toContain('AA ON: monitoring accessible approval cards');
  });
  test('AA badge is visible in header and mobile rail and warns about opaque ChatGPT widgets',()=>{
    expect(src).toContain('function inaccessibleChatWidgets()');
    expect(src).toContain("querySelectorAll('dil-renderer')");
    expect(src).toContain('g-aa-badge');
    expect(src).toContain("aaLimited?'AA!':'AA'");
    expect(src).toContain('Closed Shadow DOM approval buttons cannot be accessed here.');
    expect(src).toContain('AA status:');
  });
  test('AA timer is configurable in Setup and bounded to current chat',()=>{
    expect(src).toContain('data-approval-delay');
    expect(src).toContain("GM_getValue('v9.approvalDelaySeconds',5)");
    expect(src).toContain('approvalActiveChat');
    expect(src).toContain('clearApprovalTimer()');
  });
  test('package keeps all 17 skins including both newer families',()=>{
    const region=src.slice(src.indexOf('const SKINS'),src.indexOf('const ACCENTS'));
    expect((region.match(/name:'[^']+'/g)||[])).toHaveLength(17);
    for (const skin of ['ghostwave','ghostdock','edge-rail','command-selector']) {
      expect(region.includes(skin+':') || region.includes("'"+skin+"':")).toBe(true);
    }
  });
  test('stable three-component Tampermonkey version and main update channel',()=>{
    expect(src).toContain('// @version      9.0.20');
    expect(src).toContain("const VER = '9.0.20'");
    expect(src).toContain('https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js');
  });
});