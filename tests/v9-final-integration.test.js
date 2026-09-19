const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','extension','manifest.json'),'utf8'));
const ext=fs.readFileSync(path.join(__dirname,'..','extension','content.js'),'utf8');

describe('v9 final integration contract',()=>{
  test('one-Send architecture remains intact',()=>{
    expect((src.match(/button\.click\(\)/g)||[]).length).toBe(1);
    expect(src).not.toContain('requestSubmit(');
    expect(src).not.toContain("KeyboardEvent('keydown'");
    expect(src).not.toContain("key:'Enter'");
  });
  test('watchdog/top/export/product shell all coexist',()=>{
    for(const needle of ['STALL_SOFT_MS','async function goTop()','async function apiCapture()','const SKINS = Object.freeze','const PERSONA_LIBRARY','const WORKFLOW_LIBRARY','function stageProgress(text)']) expect(src).toContain(needle);
  });
  test('activator authority is explicit',()=>{
    expect(src).toContain("const AOA_BRANCH = 'feature/plex-universal-model-relay'");
    expect(src).toContain("Agents-of-AI/main/workflows/human-gate-committee.md");
    expect(src).toContain("Agents-of-AI/main/workflows/cleanerz.md");
    expect(src).toContain("Agents-of-AI/main/workflows/quorum.md");
  });
  test('candidate identity is internally mapped',()=>{
    expect(pkg.version).toBe('9.0.0-alpha.2');
    expect(manifest.version).toBe('9.0.0');
    expect(manifest.version_name).toBe('9.0.0-alpha.2');
    expect(src).toContain('// @version      9.0.0-alpha.2');
    expect(src).toContain("const VER = '9.0.0-alpha.2'");
  });
  test('stable update channel remains main',()=>{
    const stable='https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js';
    expect(src).toContain('// @updateURL     '+stable);
    expect(src).toContain('// @downloadURL   '+stable);
  });
  test('generated extension embeds v9 runtime, not v8 engine',()=>{
    expect(ext).toContain("const VER = '9.0.0-alpha.2'");
    expect(ext).toContain('window.__GITL_V9__');
    expect(ext).not.toContain("const VER = '8.8.5'");
  });
});