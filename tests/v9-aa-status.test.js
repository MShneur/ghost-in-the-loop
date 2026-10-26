const {TextEncoder, TextDecoder}=require('util');
global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const sleep=(w,ms=160)=>new Promise(resolve=>w.setTimeout(resolve,ms));
describe('Ghost 9.0.18 AA state truthfulness',()=>{
  test('a closed-shadow permission is not falsely counted as detected or clicked',async()=>{
    const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main><dil-renderer></dil-renderer></body></html>',{url:'https://chatgpt.com/c/test',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window,host=w.document.querySelector('dil-renderer');
    let grants=0;
    const closed=host.attachShadow({mode:'closed'});
    closed.innerHTML='<div><h3>Penny Mago wants to use Personal Forge Oracle mcp to run Oracle List.</h3><div><button>Cancel</button><button>Approve</button></div></div>';
    closed.querySelectorAll('button')[1].addEventListener('click',()=>grants++);
    w.GM_getValue=(k,d)=>d;w.GM_setValue=()=>{};w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
    try{
      expect(host.shadowRoot).toBe(null);
      w.eval(src);
      const panel=w.document.querySelector('#gitl9');
      expect(panel).toBeTruthy();
      panel.querySelector('nav.g-site-nav [data-tab="auto"]').click();
      panel.querySelector('[data-auto-approve]').click();
      await sleep(w,300);
      expect(panel.querySelector('[data-auto-approve]').checked).toBe(true);
      const label=panel.querySelector('.head .g-aa-badge');
      expect(label.textContent).toBe('AA!');
      expect(label.classList.contains('is-on')).toBe(true);
      expect(label.classList.contains('is-limited')).toBe(true);
      expect(panel.textContent).toContain('LIMITED');
      expect(panel.textContent).toContain('Click attempts: 0');
      expect(grants).toBe(0);
    }finally{w.close();}
  });
  test('when off AA header indicator is hidden, yet the control remains reachable',()=>{
    expect(src).toContain("g-aa-badge ${autoApproveOn?'is-on':''}");
    expect(src).toContain("function inaccessibleChatWidgets()");
    expect(src).toContain("let autoApproveOn = false;");
    expect(src).toContain("Closed Shadow DOM approval buttons cannot be accessed here.");
  });
});