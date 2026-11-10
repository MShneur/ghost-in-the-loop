const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const SCRIPT=fs.readFileSync(path.join(__dirname,'../../ghost-in-the-loop.user.js'),'utf8')
 .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m,'');
const GM='window.__gmStore={};window.GM_getValue=(k,d)=>window.__gmStore[k]??d;window.GM_setValue=(k,v)=>{window.__gmStore[k]=v};window.GM_addStyle=(css)=>{const s=document.createElement("style");s.textContent=css;document.head.appendChild(s)};';
const HTML=fs.readFileSync(path.join(__dirname,'mock-chat.html'),'utf8');
async function boot(page,messages){
 await page.setViewportSize({width:390,height:820});
 await page.route('https://chatgpt.com/**',r=>{
   const p=new URL(r.request().url()).pathname;
   if(p==='/c/mobile-ui-fixture')return r.fulfill({status:200,contentType:'text/html',body:HTML});
   if(p==='/api/auth/session')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accessToken:'test-only-token'})});
   if(p.startsWith('/backend-api/conversations/'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     conversation_id:'mobile-ui-fixture',messages,
     page_info:{has_previous_page:false,has_next_page:false,start_cursor:'m0',end_cursor:'m2'}
   })});
   return r.fulfill({status:404,body:'not present'});
 });
 await page.addInitScript(GM);
 await page.goto('https://chatgpt.com/c/mobile-ui-fixture');
 await page.addScriptTag({content:SCRIPT});
}
test('every active skin shows version/state, all seven top tabs, then the scroll-only pane',async({page})=>{
 await boot(page,[]);
 const skins=['heritage-v8','orbit-one','folio-top','edge-rail','ghostwave','micro-edge','tab-popover','peek-sheet'];
 for(const skin of skins){
   await page.locator('[data-tab="settings"]').click();
   await page.locator('select[data-skin]').selectOption(skin);
   const result=await page.locator('#gitl9').evaluate(el=>{
     const head=el.querySelector('.head'),menu=el.querySelector('.g-skin-nav'),
       status=el.querySelector('.g-status'),content=el.querySelector('.g-scroll'),
       tabs=el.querySelector('nav.g-site-nav');
     const visible=n=>getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().height>0;
     return {skin:el.dataset.skin,version:head.querySelector('.g-version')?.textContent,
       state:head.querySelector('[data-top-state]')?.textContent,
       navCount:tabs.querySelectorAll('[data-tab]').length,
       visible:[head,menu,status,content,tabs].map(visible),
       top:[head,menu,status,content].map(n=>n.getBoundingClientRect().top),
       menuDisplay:getComputedStyle(tabs).display,
       scroll:getComputedStyle(content).overflowY,
       playBorderRadius:getComputedStyle(head.querySelector('[data-a="quick-play"]')).borderRadius};
   });
   expect(result.skin).toBe(skin);
   expect(result.version).toBe('v9.0.27');
   expect(result.state).toBe('IDLE');
   expect(result.navCount).toBe(7);
   expect(result.visible).toEqual([true,true,true,true,true]);
   expect(result.menuDisplay).toBe('grid');
   expect(result.scroll).toBe('auto');
   expect(result.top[1]).toBeGreaterThanOrEqual(result.top[0]);
   expect(result.top[2]).toBeGreaterThanOrEqual(result.top[1]);
   expect(result.top[3]).toBeGreaterThanOrEqual(result.top[2]);
   expect(result.playBorderRadius).toBe('50%');
 }
});
test('archive at both ends with undecoded visible text saves TEXT_GAPS, never triggers scrolling',async({page})=>{
 const messages=[
   {id:'m0',author:{role:'user'},content:{parts:['Sample question']}},
   {id:'m1',author:{role:'assistant'},content:{parts:['Readable reply']}},
   {id:'m2',author:{role:'assistant'},content:{parts:[{unrecognized_payload:true}]}}
 ];
 await boot(page,messages);
 await page.locator('[data-tab="export"]').click();
 const downloadPromise=page.waitForEvent('download',{timeout:15000});
 await page.locator('[data-export-engine="auto"]').click();
 await expect(page.locator('#gitl-partial-choice')).toBeVisible();
 await expect(page.locator('[data-partial="retry"]')).toHaveCount(0);
 await expect(page.locator('#gitl-partial-choice')).toContainText('API history reached both ends');
 await page.locator('[data-partial="save"]').click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/TEXT_GAPS\.md$/);
 const stream=await download.createReadStream(),chunks=[];
 for await(const part of stream)chunks.push(part);
 const output=Buffer.concat(chunks).toString('utf8');
 expect(output).toContain('Source coverage remains unverified.');
 expect(output).toContain('Reader 1: Text decode gaps: 1 unreadable message bodies');
 expect(output).toContain('Reader 2:');
 expect(output).not.toContain('Reader 3:');
 expect(output).toContain('Readable reply');
});
