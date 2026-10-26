const {TextEncoder,TextDecoder}=require('util');global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function boot(preferences={}){
  const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main></body></html>',{
    url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000001',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,stored={...preferences};w.GM_getValue=(k,d)=>k in stored?stored[k]:d;w.GM_setValue=(k,v)=>stored[k]=v;
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
      expect(p.querySelectorAll('[data-skin] option')).toHaveLength(15);
      expect(src).toContain("classic:{ name:'Classic', bg:'#121922'");
    }finally{close()}
  });
});


describe('original A Edge Rail and D Command Selector as selectable GitL skins',()=>{
  test('A reproduces the original seven-label vertical rail without new execution paths',()=>{
    const {p,stored,close}=boot({'v9.skin':'edge-rail'});try{
      expect(p.classList.contains('skin-edge-rail')).toBe(true);
      const nav=p.querySelector('nav.g-site-nav');expect(nav.querySelectorAll('[data-tab]')).toHaveLength(7);
      expect(p.querySelectorAll('[data-a="play"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="pause"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="stop"]')).toHaveLength(1);
      expect(p.querySelectorAll('[data-a="top"]')).toHaveLength(1);
      expect(p.querySelector('[data-skin-posture]')).toBeTruthy();
      p.querySelector('.g-skin-modes [data-mode="plan"]').click();expect(stored['v9.runMode']).toBe('plan');
      nav.querySelector('[data-tab="export"]').click();expect(p.querySelector('[data-pane="export"].show')).toBeTruthy();
    }finally{close()}
  });
  test('D exposes seven real sections on demand and closes after selection',()=>{
    const {p,stored,close}=boot({'v9.skin':'command-selector'});try{
      expect(p.classList.contains('skin-command-selector')).toBe(true);
      let trigger=p.querySelector('[data-a="skin-nav-trigger"]');expect(trigger.getAttribute('aria-expanded')).toBe('false');
      trigger.click();expect(p.classList.contains('menu-open')).toBe(true);
      expect(p.querySelector('[data-a="skin-nav-trigger"]').getAttribute('aria-expanded')).toBe('true');
      expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      p.querySelector('nav.g-site-nav [data-tab="aoa"]').click();
      expect(p.querySelector('[data-pane="aoa"].show')).toBeTruthy();expect(p.classList.contains('menu-open')).toBe(false);
      expect(stored['v9.tab']).toBe('aoa');
    }finally{close()}
  });
  test('Setup permits switching A to D and to Classic without leakage',()=>{
    const {p,stored,close}=boot();try{
      p.querySelector('nav.g-site-nav [data-tab="settings"]').click();
      for(const id of ['edge-rail','command-selector','classic']){
        const el=p.querySelector('[data-skin]');el.value=id;el.dispatchEvent(new p.ownerDocument.defaultView.Event('change'));
        expect(stored['v9.skin']).toBe(id);
        expect(p.classList.contains('skin-edge-rail')).toBe(id==='edge-rail');
        expect(p.classList.contains('skin-command-selector')).toBe(id==='command-selector');
        expect(p.querySelectorAll('nav.g-site-nav [data-tab]')).toHaveLength(7);
      }
    }finally{close()}
  });
  test('layout CSS is scoped to A and D and does not alter base send mechanics',()=>{
    expect(src).toContain('#gitl9.skin-edge-rail:not(.collapsed)');
    expect(src).toContain('#gitl9.skin-command-selector.menu-open nav.g-site-nav');
    expect(src).toContain('prefers-reduced-motion:reduce');
    expect(src).toContain('One Send');
  });
});
