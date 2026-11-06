// Mock-host test only: this does not contact a real ChatGPT conversation.
const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const SCRIPT=fs.readFileSync(path.join(__dirname,'../../ghost-in-the-loop.user.js'),'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m,'');
const GM=`window.__gmStore={};window.GM_getValue=(k,d)=>window.__gmStore[k]??d;
window.GM_setValue=(k,v)=>{window.__gmStore[k]=v};
window.GM_addStyle=(css)=>{const s=document.createElement('style');s.textContent=css;(document.head||document.documentElement).appendChild(s);};`;

test('one tap downloads counts without transcript and without auto DOM scrolling',async({page})=>{
  const chatId='android-field-fixture';
  const html=fs.readFileSync(path.join(__dirname,'mock-chat.html'),'utf8');
  const archive={conversation_id:chatId,messages:[
    {id:'user-private-id',author:{role:'user'},content:{parts:['PRIVATE_FIXTURE_PROMPT']}},
    {id:'answer-private-id',author:{role:'assistant'},content:{parts:['PRIVATE_FIXTURE_ANSWER']},
       metadata:{attachments:[{id:'PRIVATE_ATTACHMENT_ID',name:'PRIVATE_FILE.pdf'}]}},
    {id:'tool-private-id',author:{role:'tool'},content:{parts:['PRIVATE_FIXTURE_TOOL']}}
  ],page_info:{has_previous_page:false,has_next_page:false,start_cursor:'user-private-id',end_cursor:'tool-private-id'}};
  await page.route('https://chatgpt.com/**',r=>{
    const url=new URL(r.request().url());
    if(url.pathname==='/c/'+chatId)return r.fulfill({status:200,contentType:'text/html',body:html});
    if(url.pathname==='/api/auth/session')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({accessToken:'PRIVATE_AUTH_TOKEN'})});
    if(url.pathname.startsWith('/backend-api/conversations/'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(archive)});
    return r.fulfill({status:404,body:'not fixture'});
  });
  await page.addInitScript(GM);
  await page.goto('https://chatgpt.com/c/'+chatId);
  await page.addScriptTag({content:SCRIPT});
  await page.locator('[data-tab="export"]').click();
  await expect(page.locator('[data-a="field-check"]')).toHaveCount(1);
  const got=page.waitForEvent('download',{timeout:15000});
  await page.locator('[data-a="field-check"]').click();
  const download=await got;
  expect(download.suggestedFilename()).toMatch(/^GITL_Android_Field_Check_.*\.json$/);
  const stream=await download.createReadStream(),buf=[];
  for await(const chunk of stream)buf.push(chunk);
  const output=Buffer.concat(buf).toString('utf8'),data=JSON.parse(output);
  expect(data.schema).toBe('gitl-export-field-check/1');
  expect(data.result).toBe('ARCHIVE_TEXT_VERIFIED');
  expect(data.readers.attempted).toEqual(['1']);
  expect(data.coverage.exportedTurns).toBe(2);
  expect(data.coverage.activities).toBe(1);
  expect(data.readers.noAutomaticDOMCollector).toBe(true);
  expect(data.authentication.shortLivedBearerAvailable).toBe(true);
  expect(data.authentication.successfulArchiveHTTPResponses).toBeGreaterThanOrEqual(1);
  expect(data.coverage.archiveTextVerified).toBe(true);
  expect(data.acceptance).toBe('PENDING_REAL_FIREFOX_ANDROID_REVIEW');
  expect(data.release).toBe('HOLD');
  for(const secret of ['PRIVATE_FIXTURE_PROMPT','PRIVATE_FIXTURE_ANSWER','PRIVATE_FIXTURE_TOOL','PRIVATE_ATTACHMENT_ID','PRIVATE_FILE.pdf','PRIVATE_AUTH_TOKEN','user-private-id'])
    expect(output).not.toContain(secret);
});
