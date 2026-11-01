const {TextEncoder,TextDecoder}=require('util');
global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function boot(settings={}){
  const d=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main></body></html>',
    {url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000001',runScripts:'outside-only',pretendToBeVisual:true});
  const w=d.window,store={...settings};
  w.GM_getValue=(k,fallback)=>k in store?store[k]:fallback;
  w.GM_setValue=(k,value)=>{store[k]=value;};
  w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
  w.eval(src);
  return {p:w.document.querySelector('#gitl9'),store,close:()=>w.close()};
}
describe('9.0.26 heritage and new structural mobile layouts',()=>{
  test('fresh install defaults to actual v8-inspired circular Play top-tab layout',()=>{
    const {p,close}=boot();try{
      expect(p.dataset.skin).toBe('heritage-v8');
      expect(p.querySelector('.head .g-version').textContent).toBe('v9.0.26');
      expect(p.querySelector('[data-a="quick-play"] .g-play-word')).toBeTruthy();
      expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      expect(src).toContain('#gitl9:not(.collapsed)[data-skin="heritage-v8"] .g-skin-nav{order:1');
      expect(src).toContain('#gitl9:not(.collapsed)[data-skin="heritage-v8"] .g-status{');
    }finally{close();}
  });
  test('skin switch cycles exactly heritage, orbit and folio while preserving Play/Send',()=>{
    const {p,store,close}=boot({'v9.skin':'edge-rail'});try{
      const states=['heritage-v8','orbit-one','folio-top','heritage-v8'];
      for(const skin of states){
        p.querySelector('[data-a="quick-skin"]').click();
        expect(p.dataset.skin).toBe(skin);
        expect(store['v9.skin']).toBe(skin);
        expect(p.querySelectorAll('.g-controls [data-a="play"]')).toHaveLength(1);
        expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      }
    }finally{close();}
  });
  test('previous five skins are preserved alongside three independently structured skins',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-tab="settings"]').click();
      const names=[...p.querySelectorAll('select[data-skin] option')].map(el=>el.value);
      expect(names).toEqual(['heritage-v8','orbit-one','folio-top','edge-rail','ghostwave',
        'micro-edge','tab-popover','peek-sheet']);
      expect(src).toContain('grid-template-columns:repeat(4,minmax(0,1fr))!important');
      expect(src).toContain('#gitl9:not(.collapsed)[data-skin="orbit-one"] .head{');
      expect(src).toContain('box-shadow:0 0 0 4px var(--g-accent-bg)');
    }finally{close();}
  });
});
