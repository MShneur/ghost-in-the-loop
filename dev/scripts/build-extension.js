#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const userscriptPath = path.join(root, 'ghost-in-the-loop.user.js');
const extensionPath = path.join(root, 'extension', 'content.js');
const checkOnly = process.argv.includes('--check');

const userscript = fs.readFileSync(userscriptPath, 'utf8');
const headerEnd = '// ==/UserScript==';
const markerIndex = userscript.indexOf(headerEnd);

if (markerIndex < 0) {
  throw new Error('Userscript metadata terminator was not found.');
}

const runtime = userscript.slice(markerIndex + headerEnd.length).trim();
const wrapper = `/* GENERATED FILE — edit ghost-in-the-loop.user.js, then run npm run build.
   Firefox MV3 wrapper: GM_* compatibility over browser.storage.local. */
const _store = typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
const _cache = {};
async function _initStore() {
  try { const d = await _store.get(null); Object.assign(_cache, d); } catch(_){}
}
function GM_getValue(k, d) { return _cache[k] !== undefined ? _cache[k] : d; }
function GM_setValue(k, v) { _cache[k] = v; _store.set({ [k]: v }).catch(()=>{}); }
function GM_addStyle(css) {
  const s = document.createElement('style');
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}
function GM_setClipboard(text) {
  try { navigator.clipboard.writeText(text); } catch(_){}
}
function GM_notification(detail) {
  try {
    if (Notification.permission === 'granted') new Notification('Ghost in the Loop', { body: typeof detail === 'string' ? detail : detail?.text || '' });
    else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') GM_notification(detail); });
  } catch(_){}
}
_initStore().then(() => {

${runtime}
});
`;

if (checkOnly) {
  const current = fs.existsSync(extensionPath) ? fs.readFileSync(extensionPath, 'utf8') : '';
  if (current !== wrapper) {
    console.error('extension/content.js is stale. Run: npm run build');
    process.exit(1);
  }
  console.log('Generated extension artifact is current.');
} else {
  fs.writeFileSync(extensionPath, wrapper);
  console.log('Generated extension/content.js from ghost-in-the-loop.user.js.');
}
