const {TextEncoder,TextDecoder}=require('util');global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function boot(){
  const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main></body></html>',{
    url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000001',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,stored={};w.GM_getValue=(k,d)=>k in stored?stored[k]:d;w.GM_setValue=(k,v)=>stored[k]=v;
  w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
  w.eval(src);
  return {w,p:w.document.querySelector('#gitl9'),stored,close:()=>w.close()};
}
describe('compact Ghost mobile UI',()=>{
  test('boot retains one Send transport and one pinned set of controls',()=>{
    const {p,close}=boot();try{
      expect(p).toBeTruthy();expect(p.querySelectorAll('[data-a="play"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="pause"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="stop"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="top"]')).toHaveLength(1);
      expect(p.querySelector('.g-controls')).toBeTruthy();
      expect(p.querySelector('.g-scroll')).toBeTruthy();
    }finally{close()}
  });
  test('all seven main pages are visible and switch without More',()=>{
    const {p,close}=boot();try{
      const nav=p.querySelector('nav.g-site-nav[aria-label="Ghost sections"]');
      expect(nav).toBeTruthy();
      expect(nav.querySelectorAll('[data-tab]')).toHaveLength(7);
      expect(p.querySelector('[data-a="more-toggle"]')).toBeNull();
      for(const t of ['play','auto','flow','prompt','aoa','export','settings']){
        nav.querySelector('[data-tab="'+t+'"]').click();
        expect(p.querySelector('[data-pane="'+t+'"].show')).toBeTruthy();
      }
    }finally{close()}
  });
  test('native accordions retain state across tab switches',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-tab="settings"]').click();
      const look=p.querySelector('details[data-g-acc="settings-look"]');
      expect(look.open).toBe(true);
      look.open=false;
      look.dispatchEvent(new p.ownerDocument.defaultView.Event('toggle'));
      p.querySelector('[data-tab="export"]').click();
      p.querySelector('[data-tab="settings"]').click();
      expect(p.querySelector('details[data-g-acc="settings-look"]').open).toBe(false);
    }finally{close()}
  });
  test('status-only update retains DOM identity and textarea focus',()=>{
    const {p,w,close}=boot();try{
      p.querySelector('[data-tab="auto"]').click();
      const queue=p.querySelector('[data-q]');queue.focus();
      const stable=queue,pane=p.querySelector('.g-scroll');
      // Uses the existing UI's Copy report path; the status text changes without layout rebuild.
      p.querySelector('[data-a="report"]')?.click();
      expect(p.querySelector('[data-q]')).toBe(stable);
      expect(p.querySelector('.g-scroll')).toBe(pane);
      expect(w.document.activeElement).toBe(queue);
    }finally{close()}
  });
  test('all thirteen existing skins and exporting still available',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-tab="settings"]').click();
      expect(p.querySelectorAll('[data-skin] option').length).toBeGreaterThanOrEqual(13);
      p.querySelector('[data-tab="export"]').click();
      for(const action of ['copy','md','json'])expect(p.querySelector('[data-a="'+action+'"]')).toBeTruthy();
      expect(p.querySelector('[data-vault-action="save"]')).toBeTruthy();
    }finally{close()}
  });
  test('viewport and minimal CSS safeguards present',()=>{
    expect(src).toContain('max-height:min(72dvh');
    expect(src).toContain('overscroll-behavior:contain');
    expect(src).toContain('window.visualViewport?.addEventListener');
    expect(src).toContain('if(lastPanelMarkup===markup&&panel.isConnected)');
    expect(src).toContain('prefers-reduced-motion:reduce');
  });
});


describe('editorial UX hierarchy (v8-inspired)',()=>{
  test('navigation is distinct from actions; controls are local to Run',()=>{
    const {p,close}=boot();try{
      expect(p.querySelector('nav.g-site-nav[aria-label="Ghost sections"]')).toBeTruthy();
      expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      expect(p.querySelectorAll('.g-subnav [data-tab]')).toHaveLength(0);
      expect(p.querySelector('[data-pane="play"] .g-controls [data-a="play"]')).toBeTruthy();
      expect(p.querySelector('[data-pane="export"] .g-action-well [data-a="md"]')).toBeTruthy();
      expect(p.querySelectorAll('.g-scroll .g-controls')).toHaveLength(1);
    }finally{close()}
  });
  test('direct advanced-page navigation does not depend on hidden menus',()=>{
    const {p,close}=boot();try{
      const nav=p.querySelector('nav.g-site-nav');
      nav.querySelector('[data-tab="prompt"]').click();
      expect(p.querySelector('[data-pane="prompt"].show')).toBeTruthy();
      nav.querySelector('[data-tab="export"]').click();
      expect(p.querySelector('[data-pane="export"].show')).toBeTruthy();
      nav.querySelector('[data-tab="settings"]').click();
      expect(p.querySelector('[data-pane="settings"].show')).toBeTruthy();
    }finally{close()}
  });
  test('animation only while running and respects reduced motion',()=>{
    expect(src).toContain('#gitl9[data-running="1"] .head::before');
    expect(src).toContain('prefers-reduced-motion:reduce');
    expect(src).toContain('animation:none!important');
    expect(src).toContain('ghostGlyph');
    expect(src).not.toContain('setInterval(ghostGlyph');
  });
  test('blue-tinted classic remains one option, other skins stay intact',()=>{
    const {p,close}=boot();try{
      p.querySelector('nav.g-site-nav [data-tab="settings"]').click();
      expect(p.querySelectorAll('[data-skin] option')).toHaveLength(14);
      expect(src).toContain("classic:{ name:'Classic', bg:'#121922'");
    }finally{close()}
  });
  test('Ghostwave skin applies to this panel and resets without changing controls',()=>{
    const {p,w,close}=boot();try{
      p.querySelector('[data-tab="settings"]').click();
      let picker=p.querySelector('[data-skin]');
      expect([...picker.options].some(o=>o.value==='ghostwave'&&o.textContent==='Ghostwave')).toBe(true);
      picker.value='ghostwave';
      picker.dispatchEvent(new w.Event('change',{bubbles:true}));
      expect(p.dataset.skin).toBe('ghostwave');
      expect(p.style.getPropertyValue('--g-bg')).toBe('#0c1024');
      expect(p.style.getPropertyValue('--g-accent')).toBe('#baa5ff');
      expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      expect(p.querySelectorAll('#gitl9 [data-a="play"]')).toHaveLength(1);
      picker=p.querySelector('[data-skin]');
      picker.value='classic';
      picker.dispatchEvent(new w.Event('change',{bubbles:true}));
      expect(p.dataset.skin).toBe('classic');
      expect(p.style.getPropertyValue('--g-bg')).toBe('#121922');
    }finally{close()}
  });
});
