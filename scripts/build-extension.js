#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const userscriptPath = path.join(root, 'ghost-in-the-loop.user.js');
const extensionPath = path.join(root, 'extension', 'content.js');
const checkOnly = process.argv.includes('--check');
/* --check-committed reads both sides from git instead of the working tree, so
   parity holds even if an earlier step in the same job rewrote the artifact. */
const checkCommitted = process.argv.includes('--check-committed');

function readCommitted(relPath) {
  const r = spawnSync('git', ['show', `HEAD:${relPath}`], {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
  });
  /* A gate that fails closed still has to say why: distinguish "git is absent"
     from "the blob is absent" instead of reporting both the same way. */
  if (r.error) {
    console.error(`Could not run git to read HEAD:${relPath} — ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    const detail = (r.stderr || '').trim()
      || (r.signal ? `killed by signal ${r.signal}` : `git exited ${r.status}`);
    console.error(`Could not read HEAD:${relPath} from git — ${detail}`);
    process.exit(1);
  }
  return r.stdout;
}

function build(userscript) {
  const headerEnd = '// ==/UserScript==';
  const markerIndex = userscript.indexOf(headerEnd);

  if (markerIndex < 0) {
    throw new Error('Userscript metadata terminator was not found.');
  }

  const runtime = userscript.slice(markerIndex + headerEnd.length).trim();
  return `/* GENERATED FILE — edit ghost-in-the-loop.user.js, then run npm run build.
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
}

if (checkCommitted) {
  const expected = build(readCommitted('ghost-in-the-loop.user.js'));
  if (readCommitted('extension/content.js') !== expected) {
    console.error('Committed extension/content.js does not match the committed userscript.');
    process.exit(1);
  }
  console.log('Committed extension artifact matches the committed userscript.');
} else if (checkOnly) {
  const wrapper = build(fs.readFileSync(userscriptPath, 'utf8'));
  const current = fs.existsSync(extensionPath) ? fs.readFileSync(extensionPath, 'utf8') : '';
  if (current !== wrapper) {
    console.error('extension/content.js is stale. Run: npm run build');
    process.exit(1);
  }
  console.log('Generated extension artifact is current.');
} else {
  fs.writeFileSync(extensionPath, build(fs.readFileSync(userscriptPath, 'utf8')));
  console.log('Generated extension/content.js from ghost-in-the-loop.user.js.');
}
