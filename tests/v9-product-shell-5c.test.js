const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function between(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0)throw new Error('missing '+a);return src.slice(i,j<0?undefined:j);}
describe('v9 product shell 5C',()=>{
  test('stage marker is display-only and bounded',()=>{const b=between('function stageProgress','function progressSummary');expect(b).toContain('GITL::STAGE');expect(b).toContain('step > total');expect(b).toContain('total > 100');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('.click()');});
  test('workflow asks model for explicit stage instead of Ghost guessing',()=>{expect(src).toContain('If stage is unclear, omit it rather than guess.');expect(src).toContain('This never controls Send.');});
  test('round progress remains observational',()=>{const b=between('function progressSummary','function clearGenerationWatchdog');expect(b).toContain('S.round / S.max');expect(b).not.toContain('sendOnce(');});
  test('sound and notifications default off for v9 with legacy migration',()=>{expect(src).toContain("GM_getValue('v9.soundOn', GM_getValue('soundOn', false))");expect(src).toContain("GM_getValue('v9.notifyOn', GM_getValue('notifyOn', false))");});
  test('feedback cannot send prompts',()=>{const b=between('function playCue','function clearGenerationWatchdog');expect(b).not.toContain('sendOnce(');expect(b).not.toContain('setComposerText(');expect(b).not.toContain('localSendButton(');expect(b).not.toContain('requestSubmit');});
  test('settings expose opt-in controls and tests',()=>{expect(src).toContain('data-sound');expect(src).toContain('data-notify');expect(src).toContain('Test sound');expect(src).toContain('Test notification');});
  test('canonical Send actuator count does not increase',()=>{expect((src.match(/button\\.click\\(\\)/g)||[]).length).toBe(1);});
});