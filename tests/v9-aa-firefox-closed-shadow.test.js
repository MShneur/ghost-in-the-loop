const { TextEncoder, TextDecoder }=require('util');
global.TextEncoder=TextEncoder;
global.TextDecoder=TextDecoder;
const fs=require('fs');
const path=require('path');
const { JSDOM }=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function boot(accessible) {
  const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main><dil-renderer></dil-renderer></body></html>',{
    url:'https://chatgpt.com/c/permission-fixture',runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window, host=w.document.querySelector('dil-renderer');
  const closed=host.attachShadow({mode:'closed'});
  closed.innerHTML='<div><h3>Example tool wants to use a connector to run a test.</h3><button>Cancel</button><button>Approve</button></div>';
  let clicks=0;
  closed.querySelectorAll('button')[1].addEventListener('click',()=>clicks++);
  // Simulate the Firefox WebExtension-only read-only accessor from MDN.
  if(accessible) Object.defineProperty(host,'openOrClosedShadowRoot',{get:()=>closed});
  const storage={'v9.approvalDelaySeconds':0};
  w.GM_getValue=(k,d)=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:d;
  w.GM_setValue=(k,v)=>{storage[k]=v};
  w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
  w.eval(src);
  const panel=w.document.querySelector('#gitl9');
  panel.querySelector('nav.g-site-nav [data-tab="auto"]').click();
  return {w,panel,clicks:()=>clicks,close:()=>w.close()};
}

describe('Ghost Firefox closed-shadow approval access',()=>{
  test('when Firefox exposes a closed root, Ghost detects one card and attempts one click',async()=>{
    const x=boot(true);
    try {
      x.panel.querySelector('[data-auto-approve]').click();
      await delay(400);
      expect(x.clicks()).toBe(1);
      expect(x.panel.textContent).toContain('Click attempts: 1');
      await delay(250);
      expect(x.clicks()).toBe(1);
    }finally{x.close();}
  });
  test('without the extension-only accessor Ghost must not report a click',async()=>{
    const x=boot(false);
    try{
      x.panel.querySelector('[data-auto-approve]').click();
      await delay(300);
      expect(x.clicks()).toBe(0);
      expect(x.panel.textContent).toContain('Click attempts: 0');
    }finally{x.close();}
  });
});
