const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
describe('Ghost 9.0.15 live-visibility contract',()=>{
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
  test('stable three-component Tampermonkey version and main update channel',()=>{
    expect(src).toContain('// @version      9.0.15');
    expect(src).toContain("const VER = '9.0.15'");
    expect(src).toContain('https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js');
  });
});