const {TextEncoder,TextDecoder}=require('util');
global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function boot(skin='edge-rail'){
  const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main></body></html>',{
    url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000001',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,values={'v9.skin':skin};
  w.GM_getValue=(k,d)=>k in values?values[k]:d;
  w.GM_setValue=(k,v)=>{values[k]=v};w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
  w.eval(src);return {w,p:w.document.querySelector('#gitl9'),close:()=>w.close()};
}
describe('version title and direct HTML export regression',()=>{
  test.each(['edge-rail','ghostwave','micro-edge','tab-popover','peek-sheet'])('%s always places real version in visible title, not mobile-hidden metadata',skin=>{
    const {p,close}=boot(skin);try{
      const v=src.match(/const VER = '([^']+)'/)[1];
      expect(p.querySelector('.head .brand .g-version').textContent).toBe('v'+v);
      expect(p.querySelector('.head .brand .g-version').closest('.brand')).toBeTruthy();
      expect(p.querySelector('[data-a="quick-html"]')).toBeTruthy();
      expect(p.querySelector('[data-a="quick-play"]')).toBeTruthy();
    }finally{close()}
  });
  test('Chat HTML and Page HTML are first-class export buttons, never under details',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-tab="export"]').click();
      const chat=p.querySelector('[data-pane="export"] [data-a="html"]');
      const page=p.querySelector('[data-pane="export"] [data-page-backup="html"]');
      expect(chat).toBeTruthy();expect(page).toBeTruthy();
      expect(chat.closest('details')).toBeNull();expect(page.closest('details')).toBeNull();
      expect(chat.textContent).toMatch(/Save Chat HTML/);
      expect(page.textContent).toMatch(/Save Page HTML/);
      expect(p.querySelectorAll('[data-a="html"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-page-backup="html"]')).toHaveLength(1);
      expect(p.querySelector('[data-export-engine="auto"]')).toBeTruthy();
      expect(p.querySelector('[data-export-engine="3"]')).toBeTruthy();
    }finally{close()}
  });
  test('page HTML direct click downloads the sanitized loaded page',()=>{
    const {p,w,close}=boot();try{
      let saved='';
      w.performance.getEntriesByType=()=>[];
      w.URL.createObjectURL=jest.fn(()=> 'blob:ghost-snapshot');
      w.URL.revokeObjectURL=jest.fn();
      w.HTMLAnchorElement.prototype.click=function(){saved=this.download;};
      p.querySelector('[data-tab="export"]').click();
      p.querySelector('[data-page-backup="html"]').click();
      expect(saved).toMatch(/^ghost-page-.*\.html$/);
      expect(w.URL.createObjectURL).toHaveBeenCalledTimes(1);
    }finally{close()}
  });
  test('the HTML chat format includes inline CSS and an explicit partial warning',()=>{
    expect(src).toContain('function conversationHTML(cap){');
    expect(src).toContain('PARTIAL EXPORT - some messages or media may be missing.');
    expect(src).toContain('style-src ');
    expect(src).toContain("doExport('html')");
    expect(src).toContain('unlike SingleFile, images and styling are not included');
  });
});
