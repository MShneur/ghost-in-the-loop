const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
describe('v9.0.1 full mechanical shell',()=>{
  test('restores the accepted seven product tabs',()=>{
    for(const label of ['Run','Auto','Flow','Personas','AoA','Export','Setup']) expect(src).toContain('>'+label+'</button>');
  });
  test('restores appearance and placement without transport authority',()=>{
    expect((src.match(/name:'/g)||[]).length).toBeGreaterThanOrEqual(13);
    for(const p of ['dock-left','dock-right','float','composer-row','header-row']) expect(src).toContain('data-place="'+p+'"');
    expect(src).toContain('data-a="collapse"'); expect(src).toContain('data-a="expand"');
  });
  test('mechanical automation is explicit data/index advancement only',()=>{
    for(const fn of ['startQueueRun','startRoadmapRun','startFlowRun','advanceQueueRun','captureOrAdvanceRoadmap','advanceFlowRun']) expect(src).toContain('function '+fn);
    expect(src).toContain('[[GITL::ROADMAP]]');
    expect(src).toContain('n!==steps.length+1');
    expect(src).toContain('n!==flat.length+1');
  });
  test('personas and committees are prompt layers',()=>{
    expect(src).toContain('data-committee');
    expect(src).toContain('Operate as a committee of ');
    expect(src).toContain('function activePersonaText');
  });
  test('one-Send architecture remains the only transport',()=>{
    expect((src.match(/button\.click\(\)/g)||[]).length).toBe(1);
    expect(src).not.toContain('requestSubmit(');
    expect(src).not.toMatch(/key\s*:\s*['"]Enter['"]/);
  });
  test('install version is new enough to replace stripped alpha.2',()=>{
    expect(src).toContain('// @version      9.0.1-alpha.1');
    expect(src).toContain("const VER = '9.0.1-alpha.1'");
  });
});