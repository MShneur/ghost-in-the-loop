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
  test('More button opens and switches to advanced tab without deleting others',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-a="more-toggle"]').click();
      expect(p.classList.contains('more-open')).toBe(true);
      p.querySelector('[data-tab="settings"]').click();
      expect(p.querySelector('[data-pane="settings"].show')).toBeTruthy();
      expect(p.querySelector('[data-pane="export"]')).toBeTruthy();
      expect(p.querySelector('[data-pane="aoa"]')).toBeTruthy();
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
      expect(p.querySelector('nav.tabs[aria-label="Ghost main menu"]')).toBeTruthy();
      expect(p.querySelectorAll('nav.tabs [data-tab]')).toHaveLength(3);
      expect(p.querySelectorAll('.g-subnav [data-tab]')).toHaveLength(4);
      expect(p.querySelector('[data-pane="play"] .g-controls [data-a="play"]')).toBeTruthy();
      expect(p.querySelector('[data-pane="export"] .g-action-well [data-a="md"]')).toBeTruthy();
      expect(p.querySelectorAll('.g-scroll .g-controls')).toHaveLength(1);
    }finally{close()}
  });
  test('More advanced category remains open when selecting an advanced page',()=>{
    const {p,close}=boot();try{
      p.querySelector('[data-a="more-toggle"]').click();
      p.querySelector('.g-subnav [data-tab="prompt"]').click();
      expect(p.classList.contains('more-open')).toBe(true);
      expect(p.querySelector('[data-pane="prompt"].show')).toBeTruthy();
      p.querySelector('nav.tabs [data-tab="export"]').click();
      expect(p.classList.contains('more-open')).toBe(false);
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
      p.querySelector('.g-subnav [data-tab="settings"]').click();
      expect(p.querySelectorAll('[data-skin] option')).toHaveLength(13);
      expect(src).toContain("classic:{ name:'Classic', bg:'#121922'");
    }finally{close()}
  });
});
