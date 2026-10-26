const {TextEncoder,TextDecoder}=require('util');
global.TextEncoder=TextEncoder;global.TextDecoder=TextDecoder;
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'..','ghost-in-the-loop.user.js'),'utf8');
function boot(delay=0) {
  const dom=new JSDOM('<html><body><main><textarea id="prompt-textarea"></textarea></main></body></html>',{
    url:'https://chatgpt.com/c/00000000-0000-0000-0000-000000000001',runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window,storage={'v9.approvalDelaySeconds':delay};
  w.GM_getValue=(k,d)=>Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:d;
  w.GM_setValue=(k,v)=>{storage[k]=v};
  w.GM_setClipboard=()=>{};w.GM_notification=()=>{};w.scrollTo=()=>{};
  w.eval(src);
  const p=w.document.querySelector('#gitl9');
  p.querySelector('nav.g-site-nav [data-tab="auto"]').click();
  return {w,p,doc:w.document,close:()=>w.close()};
}
const sleep=(w,ms=120)=>new Promise(resolve=>w.setTimeout(resolve,ms));
const addCard=(doc,title='Penny Mago wants to use Personal Forge Oracle mcp to run Oracle Chat File Status.')=>{
  const c=doc.createElement('section');
  c.innerHTML='<h3>'+title+'</h3><div><button>Cancel</button><button>Approve</button></div>';
  doc.body.appendChild(c);
  return c;
};
describe('Ghost 9.0.18 opt-in Auto-Approve',()=>{
 test('is prominently visible, OFF by default, and never clicks until enabled',async()=>{
   const {w,p,doc,close}=boot();
   try{
     const toggle=p.querySelector('[data-auto-approve]');
     expect(toggle).toBeTruthy();
     expect(toggle.checked).toBe(false);
     const c=addCard(doc);
     let clicks=0;c.querySelectorAll('button')[1].addEventListener('click',()=>clicks++);
     await sleep(w);
     expect(clicks).toBe(0);
     p.querySelector('[data-auto-approve]').click();
     await sleep(w,250);
     expect(clicks).toBe(1);
     expect(p.textContent).toContain('Click attempts: 1');
     expect(p.querySelector('[data-auto-approve]').checked).toBe(true);
   }finally{close();}
 });
 test('re-render and unrelated mutation never reclick the same button',async()=>{
   const {w,p,doc,close}=boot();
   try {
      p.querySelector('[data-auto-approve]').click();
      const c=addCard(doc);
      let clicks=0;c.querySelectorAll('button')[1].addEventListener('click',()=>clicks++);
      await sleep(w,250);
      expect(clicks).toBe(1);
      c.appendChild(doc.createElement('span'));
      await sleep(w,250);
      expect(clicks).toBe(1);
   }finally{close();}
 });
 test('switching OFF stops future clicks; unrelated Approve buttons are ignored',async()=>{
   const {w,p,doc,close}=boot();
   try {
     const c=doc.createElement('section');c.innerHTML='<button>Approve</button>';doc.body.appendChild(c);
     let noise=0;c.querySelector('button').addEventListener('click',()=>noise++);
     p.querySelector('[data-auto-approve]').click();
     await sleep(w);
     expect(noise).toBe(0);
     p.querySelector('[data-auto-approve]').click();
     const card=addCard(doc);
     let actual=0;card.querySelectorAll('button')[1].addEventListener('click',()=>actual++);
     await sleep(w);
     expect(actual).toBe(0);
   }finally{close();}
 });
 test('waits for configured delay, cancels on OFF, and can try again when rearmed',async()=>{
   const {w,p,doc,close}=boot(1);
   try {
     const card=addCard(doc);
     let clicks=0;
     card.querySelectorAll('button')[1].addEventListener('click',()=>clicks++);
     p.querySelector('[data-auto-approve]').click();
     await sleep(w,200);
     expect(clicks).toBe(0);
     p.querySelector('[data-auto-approve]').click();
     await sleep(w,1050);
     expect(clicks).toBe(0);
     p.querySelector('[data-auto-approve]').click();
     await sleep(w,1200);
     expect(clicks).toBe(1);
   }finally{close();}
 });
 test('limits delay to 0–30 seconds and persists the preference',()=>{
   const {w,p,close}=boot();
   try{
     p.querySelector('nav.g-site-nav [data-tab="settings"]').click();
     const input=p.querySelector('[data-approval-delay]');
     expect(input).toBeTruthy();
     input.value='31';
     input.dispatchEvent(new w.Event('change',{bubbles:true}));
     expect(p.querySelector('[data-approval-delay]').value).toBe('30');
   }finally{close();}
 });

});
