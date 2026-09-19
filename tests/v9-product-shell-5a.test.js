const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function between(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);if(i<0)throw new Error('missing '+a);return src.slice(i,j<0?undefined:j);}
describe('v9 product shell 5A',()=>{
  test('restores 13 token skins as data',()=>{for(const id of ['classic','aurora','glass','metal','neon','clay','liquid','oled','paper','hud','nova','ion','flow']) expect(src).toContain(id+":{ name:");});
  test('appearance persists skin and accent only',()=>{expect(src).toContain("GM_getValue('v9.skin', 'classic')");expect(src).toContain("GM_getValue('v9.accent', 'auto')");expect(src).toContain("GM_setValue('v9.skin'");expect(src).toContain("GM_setValue('v9.accent'");});
  test('Quick Start is first-run and reopenable',()=>{expect(src).toContain("GM_getValue('v9.quickStartSeen', false)");expect(src).toContain('Quick Start');expect(src).toContain('Show Quick Start');expect(src).toContain("GM_setValue('v9.quickStartSeen', true)");});
  test('help explains controls without acting on host',()=>{const r=between('function render()', "render();\nwindow.__GITL_V9__");expect(r).toContain('? Help');expect(r).toContain('What the controls do');expect(r).toContain('Settings changes appearance only');});
  test('appearance layer never becomes transport',()=>{const a=between('function applyAppearance()', 'function esc(');expect(a).not.toContain('sendOnce(');expect(a).not.toContain('setComposerText(');expect(a).not.toContain('localSendButton(');expect(a).not.toContain('requestSubmit');expect(a).not.toContain('.click()');});
  test('settings are progressively disclosed in their own tab',()=>{expect(src).toContain('data-tab="settings"');expect(src).toContain('data-pane="settings"');expect(src).toContain('data-skin');expect(src).toContain('data-accent');});
});