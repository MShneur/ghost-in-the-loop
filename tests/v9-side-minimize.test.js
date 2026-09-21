const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
describe('v9 side minimize rail',()=>{
 test('collapsed state persists',()=>{expect(src).toContain("GM_getValue('v9.panelCollapsed', false)");expect(src).toContain("GM_setValue('v9.panelCollapsed', true)");expect(src).toContain("GM_setValue('v9.panelCollapsed', false)");});
 test('collapsed rail is edge attached',()=>{expect(src).toContain('#gitl9.collapsed{right:0!important');expect(src).toContain('data-a="expand"');expect(src).toContain('data-a="collapse"');});
 test('minimize does not touch transport',()=>{const block=src.slice(src.indexOf("data-a=\\\"collapse\\\""),src.indexOf("const topButton"));expect(block).not.toContain('sendOnce(');expect(block).not.toContain('setComposerText(');expect(block).not.toContain('button.click()');});
});