#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

function replaceOne(text, from, to, label) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(from, to);
}

let src = read('ghost-in-the-loop.user.js');

// Pin the current Perplexity Lexical composer ahead of generic CE selectors.
src = replaceOne(
  src,
  `    input: ['textarea[placeholder*="Ask"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','[data-testid="composer"]','textarea:not([disabled])'],`,
  `    input: ['#ask-input[data-lexical-editor="true"][contenteditable="true"]','textarea[placeholder*="Ask"]','textarea[placeholder*="Follow"]','div[contenteditable="true"][role="textbox"]','div[class*="ProseMirror"]','[data-testid="composer"]','textarea:not([disabled])'],`,
  'Perplexity Lexical composer selector'
);

// Lexical-safe single-write staging. Scope selection to the editor itself and
// never emit a second insertText event carrying the same payload after the host
// has already consumed execCommand(insertText).
src = replaceOne(
  src,
  `      // FIX: selectAll+insertText preserves ProseMirror state (innerHTML='' destroys it)\n      document.execCommand('selectAll', false, null);\n      const ok = document.execCommand('insertText', false, text);`,
  `      // 8.8.5: scope replacement to the live editor. Perplexity Lexical can\n      // apply a synthetic insertText event in addition to execCommand, producing\n      // two copies of the command. Selection stays inside this composer only.\n      const isLexical = el.getAttribute('data-lexical-editor') === 'true';\n      if (isLexical) {\n        try {\n          const sel = window.getSelection?.();\n          const range = document.createRange();\n          range.selectNodeContents(el);\n          sel?.removeAllRanges();\n          sel?.addRange(range);\n        } catch(_) { document.execCommand('selectAll', false, null); }\n      } else {\n        document.execCommand('selectAll', false, null);\n      }\n      const ok = document.execCommand('insertText', false, text);`,
  'scoped contenteditable replacement'
);

src = replaceOne(
  src,
  `      el.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:text, composed:true }));\n      if (DIAG.sendPath !== 'ce-paste') DIAG.sendPath = 'contenteditable';`,
  `      // Lexical already observed the insertion above. A second InputEvent with\n      // data:text is a second edit on current Perplexity builds, so only send a\n      // data-less notification there. Other CE hosts preserve the legacy path.\n      if (isLexical) el.dispatchEvent(new Event('input', { bubbles:true }));\n      else el.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:text, composed:true }));\n      if (DIAG.sendPath !== 'ce-paste') DIAG.sendPath = isLexical ? 'lexical-once' : 'contenteditable';`,
  'Lexical no-double-input event'
);

const duplicateRepair = String.raw`
function _isExactDoubleStagedComposer(input, expectedText) {
  const expected = _normalizeStagedText(expectedText);
  if (!input || !expected) return false;
  return _normalizeStagedText(_composerText(input)) === expected + expected;
}

function _repairExactDoubleStagedComposer(input, expectedText) {
  if (!input || input.getAttribute?.('contenteditable') !== 'true') return false;
  try {
    input.focus();
    const sel = window.getSelection?.();
    const range = document.createRange();
    range.selectNodeContents(input);
    sel?.removeAllRanges();
    sel?.addRange(range);
    const ok = document.execCommand('insertText', false, expectedText);
    if (!ok) return false;
    input.dispatchEvent(new Event('input', { bubbles:true }));
    Timeline.record('composer_duplicate_repaired', { stage:'pre-dispatch', platform: PLAT?.key || 'unknown' });
    return true;
  } catch(_) { return false; }
}
`;
src = replaceOne(
  src,
  `async function _awaitStagedComposer(originalInput, expectedText, timeoutMs = 1400) {`,
  duplicateRepair + `\nasync function _awaitStagedComposer(originalInput, expectedText, timeoutMs = 1400) {`,
  'duplicate repair helper insertion'
);
src = replaceOne(
  src,
  `  let prior = null;\n  let stableObservations = 0;\n  let replaced = false;\n  let polls = 0;`,
  `  let prior = null;\n  let stableObservations = 0;\n  let replaced = false;\n  let polls = 0;\n  let duplicateRepairAttempted = false;`,
  'duplicate repair attempt guard'
);
src = replaceOne(
  src,
  `    const current = Adapter.findStagedInput(expectedText, originalInput);\n    if (current) {`,
  `    let current = Adapter.findStagedInput(expectedText, originalInput);\n    if (!current && !duplicateRepairAttempted) {\n      const candidate = Adapter.peekInput();\n      if (_isExactDoubleStagedComposer(candidate, expectedText)) {\n        duplicateRepairAttempted = true;\n        if (_repairExactDoubleStagedComposer(candidate, expectedText)) {\n          await sleep(90);\n          current = Adapter.findStagedInput(expectedText, candidate);\n        }\n      }\n    }\n    if (current) {`,
  'bounded duplicate repair in staging gate'
);

const routeUiHelpers = String.raw`
const SEND_ROUTE_PREFS = ['auto','alpha','beta','gamma','delta'];
function _sendRoutePrefKey() { return 'gitl:send-route-pref:' + location.hostname; }
function _getSendRoutePref() {
  const v = String(GM_getValue(_sendRoutePrefKey(), 'auto') || 'auto').toLowerCase();
  return SEND_ROUTE_PREFS.includes(v) ? v : 'auto';
}
function _setSendRoutePref(v) {
  const next = String(v || '').toLowerCase();
  if (!SEND_ROUTE_PREFS.includes(next)) return false;
  if (GHOST.loop.sendTxn?.state === 'uncertain') return false;
  GM_setValue(_sendRoutePrefKey(), next);
  Timeline.record('send_route_preference', { route: next });
  return true;
}
function _renderSendRouteControls() {
  const current = _getSendRoutePref();
  const locked = GHOST.loop.sendTxn?.state === 'uncertain';
  const labels = [['auto','Auto'],['alpha','Alpha'],['beta','Beta'],['gamma','Gamma'],['delta','Delta']];
  const buttons = labels.map(([id,label]) => {
    const active = current === id;
    return '<button class="g-btn' + (active ? ' go' : '') + '" data-g-send-route="' + id + '" '
      + (locked ? 'disabled ' : '')
      + 'style="min-width:0;padding:7px 4px;font-size:10px;' + (active ? 'outline:1px solid currentColor;' : '') + '" '
      + 'title="' + (locked ? 'Send result is uncertain — reconcile it before changing routes' : 'Use ' + label + ' for the next safe pre-dispatch attempt') + '">'
      + label + '</button>';
  }).join('');
  const status = locked ? 'locked: reconcile uncertain Send first' : (current === 'auto' ? 'Auto picks one safe route before Send' : current.charAt(0).toUpperCase() + current.slice(1) + ' selected');
  return '<div style="padding:6px 8px 0"><div style="font-size:9px;opacity:.72;margin-bottom:4px">SEND METHOD · ' + status + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px">' + buttons + '</div></div>';
}
`;
src = replaceOne(
  src,
  `const SEND_ROUTE_HEALTH_TTL = 12 * 60 * 60 * 1000;`,
  `const SEND_ROUTE_HEALTH_TTL = 12 * 60 * 60 * 1000;\n` + routeUiHelpers,
  'route UI helpers insertion'
);

src = replaceOne(
  src,
  `  return !!rec && rec.outcome === 'uncertain' && Number.isFinite(rec.at)`,
  `  return !!rec && (rec.outcome === 'uncertain' || rec.outcome === 'failed') && Number.isFinite(rec.at)`,
  'suppress failed route after human review'
);

src = replaceOne(
  src,
  `  if (path) return { ...candidates.get(path), preflight };\n  return { route:'delta', path:'delta-manual', manual:true, run:null, preflight };`,
  `  const pref = _getSendRoutePref();\n  if (pref === 'delta') return { route:'delta', path:'delta-manual', manual:true, run:null, preflight };\n  if (pref !== 'auto') {\n    const prefPath = { alpha:'alpha-click', beta:'beta-request-submit', gamma:'gamma-enter' }[pref];\n    if (prefPath && candidates.has(prefPath)) return { ...candidates.get(prefPath), preflight };\n    return { route:pref, path:(prefPath || pref + '-unavailable'), manual:false, blocked:true, run:null, preflight };\n  }\n  if (path) return { ...candidates.get(path), preflight };\n  return { route:'delta', path:'delta-manual', manual:true, run:null, preflight };`,
  'honor route preference before journal'
);

src = replaceOne(
  src,
  `    if (!strategy || strategy.manual) {\n      Reporter.capture('SEND-001', 'No safe automatic dispatch route is currently eligible. The prompt is staged for one manual Send.');\n      pauseWithProbe('Delta/manual route — prompt left staged for one manual Send');\n      return false;\n    }`,
  `    if (!strategy || strategy.blocked) {\n      Reporter.capture('SEND-001', 'The selected Send method is not available on the current live composer. Nothing was sent.');\n      pauseWithProbe((strategy?.route || 'Selected') + ' unavailable — choose another Send method, then Resume');\n      return false;\n    }\n    if (strategy.manual) {\n      _pendingPreDispatch = null;\n      Reporter.capture('SEND-001', 'Delta selected: Ghost staged the prompt but will not click Send. Tap the site Send button once.');\n      pauseWithProbe('Delta/manual — prompt staged; tap the site Send button once');\n      return false;\n    }`,
  'selected route unavailable/manual handling'
);

src = replaceOne(
  src,
  `    <div class="g-btns">\n      <button class="g-btn go\${L.state==='LIMIT'?' pulse':''}" id="g-play"`,
  `    \${_renderSendRouteControls()}\n    <div class="g-btns">\n      <button class="g-btn go\${L.state==='LIMIT'?' pulse':''}" id="g-play"`,
  'render route controls in Transport'
);

src = replaceOne(
  src,
  `  $('#g-play')?.addEventListener('click', primaryAction);\n  $('#g-repair-resume')?.addEventListener('click', repairAndResume);`,
  `  $('#g-play')?.addEventListener('click', primaryAction);\n  $$('[data-g-send-route]').forEach(btn => btn.addEventListener('click', () => {\n    if (_setSendRoutePref(btn.dataset.gSendRoute)) render();\n  }));\n  $('#g-repair-resume')?.addEventListener('click', repairAndResume);`,
  'bind route controls'
);

src = replaceOne(
  src,
  `async function engineSend(text, skipDelay) {\n  const L = GHOST.loop;`,
  `let _pendingPreDispatch = null;\n\nasync function engineSend(text, skipDelay) {\n  const L = GHOST.loop;`,
  'pending pre-dispatch memory insertion'
);
src = replaceOne(
  src,
  `  L.isSending = true;`,
  `  L.isSending = true;\n  _pendingPreDispatch = { text:String(text || ''), skipDelay:!!skipDelay, at:Date.now() };`,
  'remember safe pre-dispatch command'
);
src = replaceOne(
  src,
  `    const completion = _beginSendAttempt(strategy.path, stagedInput, {`,
  `    _pendingPreDispatch = null; // boundary: any later ambiguity must never auto-retry\n    const completion = _beginSendAttempt(strategy.path, stagedInput, {`,
  'clear retry memory at journal boundary'
);

src = replaceOne(
  src,
  `  // Case 1: resume from pause\n  if (!L.needsPayload) {`,
  `  // 8.8.5: COMPOSER-002/SEND-001 before dispatch is known NOT SENT. Resume\n  // retries that exact volatile command once through the selected route. No\n  // post-dispatch/uncertain transaction can reach this path.\n  if (L.state === 'PAUSED' && _pendingPreDispatch && L.sendTxn?.state !== 'uncertain') {\n    const pending = _pendingPreDispatch;\n    L.state = 'RUNNING'; L.lastActivity = Date.now(); L.detail = 'Retrying safe pre-send step…';\n    render();\n    engineSend(pending.text, true);\n    return;\n  }\n\n  // Case 1: resume from pause\n  if (!L.needsPayload) {`,
  'Resume safe pre-dispatch retry'
);

src = replaceOne(
  src,
  `  L.sendPending = false; L.sendDeadline = 0; L.sendTxn = null;`,
  `  L.sendPending = false; L.sendDeadline = 0; L.sendTxn = null;\n  _pendingPreDispatch = null;`,
  'reset pending pre-dispatch memory'
);

write('tests/perplexity-fallback-885.test.js', `const fs = require('fs');\nconst path = require('path');\nconst src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');\n\ndescribe('8.8.5 Perplexity staging + production fallback UI', () => {\n  test('pins current Perplexity Lexical composer and avoids double insertText notification', () => {\n    expect(src).toContain('#ask-input[data-lexical-editor=\\"true\\"][contenteditable=\\"true\\"]');\n    expect(src).toContain("const isLexical = el.getAttribute('data-lexical-editor') === 'true'");\n    expect(src).toContain("DIAG.sendPath = isLexical ? 'lexical-once' : 'contenteditable'");\n  });\n  test('repairs only the exact doubled pre-dispatch payload', () => {\n    expect(src).toContain('function _isExactDoubleStagedComposer');\n    expect(src).toContain('expected + expected');\n    expect(src).toContain("Timeline.record('composer_duplicate_repaired'");\n  });\n  test('production Transport exposes all requested Send methods', () => {\n    for (const label of ['Auto','Alpha','Beta','Gamma','Delta']) expect(src).toContain("['" + label.toLowerCase() + "','" + label + "']");\n    expect(src).toContain('data-g-send-route');\n    expect(src).toContain('SEND METHOD');\n  });\n  test('selected routes are resolved before the at-most-once boundary', () => {\n    const select = src.indexOf('const strategy = _selectDispatchStrategy(stagedInput);');\n    const journal = src.indexOf('_beginSendAttempt(strategy.path', select);\n    expect(select).toBeGreaterThan(-1);\n    expect(journal).toBeGreaterThan(select);\n  });\n  test('Resume can retry only a volatile pre-dispatch command', () => {\n    expect(src).toContain('let _pendingPreDispatch = null;');\n    expect(src).toContain("L.state === 'PAUSED' && _pendingPreDispatch");\n    expect(src).toContain('_pendingPreDispatch = null; // boundary: any later ambiguity must never auto-retry');\n  });\n  test('uncertain Send locks route switching', () => {\n    expect(src).toContain("const locked = GHOST.loop.sendTxn?.state === 'uncertain'");\n    expect(src).toContain('reconcile uncertain Send first');\n  });\n});\n`);

let changelog = read('CHANGELOG.md');
const note = `### P0 Perplexity / fallback controls follow-up\n\n- Fix current Perplexity Lexical staging so one Ghost command produces one composer payload instead of a duplicated payload that fails COMPOSER-002 verification.\n- Add one bounded pre-dispatch repair for the exact duplicate-payload field signature; it cannot grant Send authority.\n- Put Auto / Alpha / Beta / Gamma / Delta directly in the production Transport panel and bind them to the production dispatch router.\n- After a human confirms a route did not send, Auto suppresses that failed route temporarily and selects another eligible route on the next safe attempt.\n- Resume now retries the exact volatile command after a known pre-dispatch failure; the retry memory is cleared before the at-most-once journal opens and on reset.\n\n`;
changelog = replaceOne(changelog, `## [8.8.5] — production dispatch router and Firefox/Android round-2 repair\n\n`, `## [8.8.5] — production dispatch router and Firefox/Android round-2 repair\n\n` + note, '8.8.5 changelog follow-up');
write('CHANGELOG.md', changelog);

const statePath = '.gitl/autopilot-state.json';
const state = JSON.parse(read(statePath));
state.branch = 'hotfix/8.8.5-p0-perplexity-fallback-ui';
state.status = 'p0-perplexity-fallback-certification';
state.publishReady = false;
write(statePath, JSON.stringify(state, null, 2) + '\n');

write('ghost-in-the-loop.user.js', src);
console.log('8.8.5 Perplexity/fallback UI repair applied successfully.');
