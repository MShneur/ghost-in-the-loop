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

function replaceRegexOne(text, re, to, label) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const count = [...text.matchAll(new RegExp(re.source, flags))].length;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(re, to);
}

let src = read('ghost-in-the-loop.user.js');
src = replaceOne(src, '// @version      8.8.4', '// @version      8.8.5', 'userscript header version');
src = replaceOne(src, "const VER = '8.8.4';", "const VER = '8.8.5';", 'runtime version');
src = replaceOne(
  src,
  "    send: ['button[aria-label=\"Send message\"]','button[data-testid=\"send-button\"]','button[aria-label=\"Send prompt\"]','button[aria-label=\"Send\"]','form button[type=\"submit\"]','button[data-testid*=\"send\"]','button[data-testid*=\"submit\"]','button[class*=\"send\"]'],",
  "    send: ['#composer-submit-button','button[aria-label=\"Send message\"]','button[data-testid=\"send-button\"]','button[aria-label=\"Send prompt\"]','button[aria-label=\"Send\"]','form button[type=\"submit\"]','button[data-testid*=\"send\"]','button[data-testid*=\"submit\"]','button[class*=\"send\"]'],",
  'ChatGPT composer submit selector'
);

const router = String.raw`
/* ── 8.8.5 reviewed dispatch router ─────────────────────────────
   Production Alpha/Beta/Gamma/Delta live here, not in a sidecar tester.
   Critical invariant: exactly ONE automatic actuator is selected BEFORE the
   at-most-once journal opens. After _beginSendAttempt() there is no fallback.
   A prior ambiguous route is suppressed on the next safe run so field testing
   can advance without ever risking an immediate duplicate. */
const SEND_ROUTE_HEALTH_TTL = 12 * 60 * 60 * 1000;

function _routeHealthKey() {
  return 'gitl:send-route-health:' + location.hostname;
}

function _readRouteHealth() {
  try {
    const raw = GM_getValue(_routeHealthKey(), '{}');
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch(_) { return {}; }
}

function _noteDispatchRoute(path, outcome) {
  if (!path) return;
  try {
    const health = _readRouteHealth();
    health[String(path)] = { outcome: String(outcome || 'unknown'), at: Date.now() };
    GM_setValue(_routeHealthKey(), JSON.stringify(health));
  } catch(_) {}
}

function _recentlyUncertain(path, health) {
  const rec = health && health[path];
  return !!rec && rec.outcome === 'uncertain' && Number.isFinite(rec.at)
    && Date.now() - rec.at < SEND_ROUTE_HEALTH_TTL;
}

function _isFirefoxAndroid() {
  const ua = String(navigator.userAgent || '');
  return /Android/i.test(ua) && /Firefox\//i.test(ua);
}

async function _twoAnimationFrames() {
  if (typeof requestAnimationFrame !== 'function') { await sleep(34); return; }
  await new Promise(resolve => requestAnimationFrame(() => resolve()));
  await new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function _selectDispatchStrategy(stagedInput, roundOverride = null) {
  const round = Number.isFinite(roundOverride) ? Number(roundOverride) : Number(GHOST.loop.round || 0);
  const button = Adapter.getSendBtn(); // fresh authority lookup for THIS transaction
  const form = stagedInput?.closest?.('form') || null;
  const sendConnected = !!button && button.isConnected !== false;
  const sendEnabled = sendConnected && !button.disabled && button.getAttribute?.('aria-disabled') !== 'true';
  const sameForm = !!(sendEnabled && form && (button.form === form || form.contains(button)));
  const canRequestSubmit = !!(sameForm && typeof form.requestSubmit === 'function' && String(button.type || 'submit').toLowerCase() === 'submit');
  const canEnter = !!(stagedInput?.isConnected !== false && PLAT?.reviewed && PLAT.dispatchFallback === 'enter');
  const firefoxAndroid = _isFirefoxAndroid();
  const health = _readRouteHealth();

  const candidates = new Map();
  if (sendEnabled) {
    candidates.set('alpha-click', {
      route: 'alpha', path: 'alpha-click', manual: false,
      run: () => button.click()
    });
  }
  if (canRequestSubmit) {
    candidates.set('beta-request-submit', {
      route: 'beta', path: 'beta-request-submit', manual: false,
      run: () => form.requestSubmit(button)
    });
  }
  if (canEnter) {
    candidates.set('gamma-enter', {
      route: 'gamma', path: 'gamma-enter', manual: false,
      run: () => stagedInput.dispatchEvent(new KeyboardEvent('keydown', {
        key:'Enter', code:'Enter', keyCode:13, which:13,
        bubbles:true, cancelable:true, composed:true
      }))
    });
  }

  let order = ['alpha-click', 'beta-request-submit', 'gamma-enter'];
  /* The real regression is Firefox/Android round 2. Rotate automatic routes
     per confirmed round there, so round 1 uses Alpha, round 2 Beta, round 3
     Gamma. Other hosts preserve Alpha-first behavior. */
  if (PLAT?.label === 'ChatGPT' && firefoxAndroid) {
    const shift = ((round % order.length) + order.length) % order.length;
    order = [...order.slice(shift), ...order.slice(0, shift)];
  }

  const unsuppressed = order.filter(path => !_recentlyUncertain(path, health));
  const usableOrder = unsuppressed.length ? unsuppressed : [];
  const path = usableOrder.find(id => candidates.has(id));
  const preflight = {
    firefoxAndroid,
    round,
    composerConnected: !!stagedInput && stagedInput.isConnected !== false,
    sendConnected,
    sendEnabled,
    sameForm,
    canRequestSubmit,
    canEnter,
    suppressedRoutes: order.filter(id => _recentlyUncertain(id, health)).length
  };

  if (path) return { ...candidates.get(path), preflight };
  return { route:'delta', path:'delta-manual', manual:true, run:null, preflight };
}
`;
src = replaceOne(src, '\nasync function engineSend(text, skipDelay) {', '\n' + router + '\nasync function engineSend(text, skipDelay) {', 'dispatch router insertion');

src = replaceRegexOne(
  src,
  /    const stagedInput = staged\.input;[\s\S]*?    DIAG\.sendPath = strategy\.path;/,
  String.raw`    let stagedInput = staged.input;
    if (staged.replaced) {
      Timeline.record('composer_reacquired', { stage: 'pre-dispatch', polls: staged.polls });
    }

    // ProseMirror/React can show the text before the host's controlled state
    // and Send control finish reconciling. Wait through two paints, then
    // reacquire the exact prompt-bearing composer AGAIN before route choice.
    await _twoAnimationFrames();
    const finalStage = await _awaitStagedComposer(stagedInput, text, 1200);
    if (!finalStage.ok) {
      Timeline.record('composer_unverified', { code: 'COMPOSER-002', stage: 'dispatch-recheck' });
      Reporter.capture('COMPOSER-002', 'The live editor changed before dispatch. Nothing was sent.');
      pauseWithProbe('Composer changed before Send — nothing was sent');
      return false;
    }
    stagedInput = finalStage.input;
    if (finalStage.replaced) {
      Timeline.record('composer_reacquired', { stage: 'dispatch-recheck', polls: finalStage.polls });
    }

    const strategy = _selectDispatchStrategy(stagedInput);
    Timeline.record('send_route_selected', {
      round: L.round + 1,
      route: strategy?.route || 'none',
      path: strategy?.path || 'none',
      composer_replaced: !!(staged.replaced || finalStage.replaced),
      firefox_android: !!strategy?.preflight?.firefoxAndroid,
      send_connected: !!strategy?.preflight?.sendConnected,
      same_form: !!strategy?.preflight?.sameForm,
      request_submit: !!strategy?.preflight?.canRequestSubmit,
      enter_ready: !!strategy?.preflight?.canEnter,
      suppressed_routes: Number(strategy?.preflight?.suppressedRoutes || 0)
    });
    if (!strategy || strategy.manual) {
      Reporter.capture('SEND-001', 'No safe automatic dispatch route is currently eligible. The prompt is staged for one manual Send.');
      pauseWithProbe('Delta/manual route — prompt left staged for one manual Send');
      return false;
    }
    DIAG.sendPath = strategy.path;`,
  'engine send route selection'
);

src = replaceOne(src, 'function _beginSendAttempt(path, input) {', 'function _beginSendAttempt(path, input, meta = {}) {', 'send attempt metadata signature');
src = replaceOne(
  src,
  '    trustedPulseAt: GITL_NET.lastPulseT || 0,\n    composerHadText: _composerText(input).length > 0\n',
  "    trustedPulseAt: GITL_NET.lastPulseT || 0,\n    composerHadText: _composerText(input).length > 0,\n    route: String(meta.route || path || 'unknown'),\n    composerReplaced: !!meta.composerReplaced,\n    composerPolls: Math.max(0, Number(meta.composerPolls || 0)),\n    preflight: meta.preflight && typeof meta.preflight === 'object' ? meta.preflight : null\n",
  'send attempt metadata fields'
);
src = replaceOne(
  src,
  '    round: L.round + 1,\n    path: txn.path\n  });',
  "    round: L.round + 1,\n    path: txn.path,\n    route: txn.route,\n    composer_replaced: txn.composerReplaced,\n    composer_polls: txn.composerPolls,\n    send_connected: !!txn.preflight?.sendConnected,\n    send_enabled: !!txn.preflight?.sendEnabled,\n    same_form: !!txn.preflight?.sameForm,\n    request_submit: !!txn.preflight?.canRequestSubmit,\n    enter_ready: !!txn.preflight?.canEnter\n  });",
  'send attempted richer timeline'
);
src = replaceOne(
  src,
  '    const completion = _beginSendAttempt(strategy.path, stagedInput);',
  '    const completion = _beginSendAttempt(strategy.path, stagedInput, {\n      route: strategy.route,\n      composerReplaced: !!(staged.replaced || finalStage.replaced),\n      composerPolls: Number(staged.polls || 0) + Number(finalStage.polls || 0),\n      preflight: strategy.preflight\n    });',
  'send attempt route metadata call'
);
src = replaceOne(
  src,
  "  try { GM_setValue('sendTier:' + location.hostname, txn.path); } catch(_) {}\n  Timeline.record('send_confirmed', {",
  "  try { GM_setValue('sendTier:' + location.hostname, txn.path); } catch(_) {}\n  _noteDispatchRoute(txn.path, 'confirmed');\n  Timeline.record('send_confirmed', {",
  'confirmed route health'
);
src = replaceOne(
  src,
  "  Timeline.record('send_uncertain', {\n    code: 'SEND-002',\n    command: txn.id.slice(0, 8),\n    round: L.round\n  });",
  "  _noteDispatchRoute(txn.path, 'uncertain');\n  const postInput = Adapter.peekInput();\n  const postSend = Adapter.getSendBtn();\n  const postUserCount = Array.isArray(PLAT.user) ? _qAll(PLAT.user).length : null;\n  Timeline.record('send_uncertain', {\n    code: 'SEND-002',\n    command: txn.id.slice(0, 8),\n    round: L.round,\n    path: txn.path,\n    route: txn.route,\n    composer_present: !!postInput,\n    composer_connected: !!postInput && postInput.isConnected !== false,\n    send_present: !!postSend,\n    send_connected: !!postSend && postSend.isConnected !== false,\n    user_delta: Number.isFinite(txn.userCount) && Number.isFinite(postUserCount) ? postUserCount - txn.userCount : null,\n    trusted_pulse_age_ms: GITL_NET.lastPulseT ? Math.max(0, Date.now() - GITL_NET.lastPulseT) : null\n  });",
  'uncertain route telemetry'
);
src = replaceOne(
  src,
  "    txn.state = 'failed';\n    txn.reconciledAt = Date.now();",
  "    txn.state = 'failed';\n    txn.reconciledAt = Date.now();\n    _noteDispatchRoute(txn.path, 'failed');",
  'human confirmed not sent route health'
);
src = replaceOne(
  src,
  "  txn.state = 'committed';\n  txn.evidence = 'human-confirmed';",
  "  txn.state = 'committed';\n  txn.evidence = 'human-confirmed';\n  _noteDispatchRoute(txn.path, 'confirmed');",
  'human delivered route health'
);

for (const p of ['package.json', 'package-lock.json']) {
  const j = JSON.parse(read(p));
  j.version = '8.8.5';
  if (p === 'package-lock.json' && j.packages?.['']) j.packages[''].version = '8.8.5';
  write(p, JSON.stringify(j, null, 2) + '\n');
}
const manifest = JSON.parse(read('extension/manifest.json'));
manifest.version = '8.8.5';
write('extension/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

let changelog = read('CHANGELOG.md');
const entry = `## [8.8.5] — production dispatch router and Firefox/Android round-2 repair\n\n- Integrate Alpha/Beta/Gamma/Delta into the production engine instead of leaving them in a recovery-only sidecar. Alpha uses the freshly reacquired reviewed Send click; Beta uses the exact current composer form with requestSubmit; Gamma uses the reviewed Enter fallback; Delta stages for one manual host Send when no automatic route is safe.\n- On Firefox/Android ChatGPT, rotate Alpha → Beta → Gamma by confirmed round so the known second-round failure no longer repeats the identical reviewed-button actuator. Exactly one route is selected before the at-most-once journal starts; there is still no post-dispatch automatic retry.\n- Suppress a route for 12 hours after an ambiguous SEND-002 so a later safe run can exercise another route without blindly resending the uncertain transaction.\n- Add #composer-submit-button as a first-class ChatGPT Send identity, wait two animation frames for ProseMirror/React reconciliation, then reacquire both staged composer and Send authority immediately before dispatch.\n- Enrich redacted telemetry with route, composer replacement/poll counts, Send connectivity, same-form/requestSubmit eligibility, user-turn delta, and trusted-pulse age. No prompts, selectors, URLs, or conversation text are added.\n- Add regression coverage for a replaced ChatGPT composer where the first identical send selects Alpha and the second selects Beta on Firefox/Android.\n\n**Safety boundary:** an ambiguous post-dispatch state still hard-stops. Alternate automatic actuators are never fired inside the same uncertain transaction.\n\n`;
changelog = replaceOne(changelog, '# Changelog\n\n', '# Changelog\n\n' + entry, 'changelog header');
write('CHANGELOG.md', changelog);

let e2e = read('tests/e2e/chatgpt-live-regression.spec.js');
e2e = replaceOne(
  e2e,
  "const EXPOSE = `\n  window.__GITL_ReviewedSend = () => _reviewedSend();\n`;",
  "const EXPOSE = `\n  window.__GITL_ReviewedSend = () => _reviewedSend();\n  window.__GITL_TestRoute = (round) => {\n    const input = Adapter.getInput();\n    const strategy = _selectDispatchStrategy(input, round);\n    return { path: strategy?.path || null, route: strategy?.route || null, manual: !!strategy?.manual, preflight: strategy?.preflight || null };\n  };\n  window.__GITL_TestRunRoute = (round) => {\n    const input = Adapter.getInput();\n    const strategy = _selectDispatchStrategy(input, round);\n    if (!strategy || strategy.manual || typeof strategy.run !== 'function') return { path: strategy?.path || null, ran: false };\n    strategy.run();\n    return { path: strategy.path, ran: true };\n  };\n`;",
  'e2e router exposure'
);
e2e = replaceOne(e2e, 'async function boot(page) {', 'async function boot(page, options = {}) {', 'e2e boot options');
e2e = replaceOne(
  e2e,
  '  await page.addInitScript(GM);\n  await page.addInitScript(SCRIPT);',
  "  if (options.firefoxAndroid) {\n    await page.addInitScript(() => {\n      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (Android 16; Mobile; rv:155.0) Gecko/155.0 Firefox/155.0' });\n    });\n  }\n  await page.addInitScript(GM);\n  await page.addInitScript(SCRIPT);",
  'e2e Firefox Android UA'
);
const routerE2E = String.raw`
  test('Firefox Android uses a fresh distinct route on the second identical send after composer replacement', async ({ page }) => {
    await boot(page, { firefoxAndroid: true });
    await page.locator('#composer-submit-button').scrollIntoViewIfNeeded();

    await page.evaluate(() => {
      const input = document.getElementById('prompt-textarea');
      input.textContent = 'Continue.';
      input.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:'Continue.' }));
    });

    const first = await page.evaluate(() => window.__GITL_TestRoute(0));
    expect(first.path).toBe('alpha-click');
    expect(first.preflight.sendConnected).toBe(true);
    const firstRun = await page.evaluate(() => window.__GITL_TestRunRoute(0));
    expect(firstRun).toEqual({ path:'alpha-click', ran:true });

    const beforeReplacement = await page.evaluate(() => ({ ...window.__hostProbe }));
    await page.evaluate(() => {
      const oldForm = document.getElementById('composer');
      const freshForm = oldForm.cloneNode(true);
      oldForm.replaceWith(freshForm);
      const form = document.getElementById('composer');
      const button = document.getElementById('composer-submit-button');
      form.addEventListener('submit', (event) => {
        window.__hostProbe.submits += 1;
        event.preventDefault();
      });
      button.addEventListener('click', () => { window.__hostProbe.sendClicks += 1; });
      const input = document.getElementById('prompt-textarea');
      input.textContent = 'Continue.';
      input.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:'Continue.' }));
    });

    const second = await page.evaluate(() => window.__GITL_TestRoute(1));
    expect(second.path).toBe('beta-request-submit');
    expect(second.preflight.sendConnected).toBe(true);
    expect(second.preflight.sameForm).toBe(true);
    expect(second.preflight.canRequestSubmit).toBe(true);
    const secondRun = await page.evaluate(() => window.__GITL_TestRunRoute(1));
    expect(secondRun).toEqual({ path:'beta-request-submit', ran:true });

    const third = await page.evaluate(() => window.__GITL_TestRoute(2));
    expect(third.path).toBe('gamma-enter');

    const after = await page.evaluate(() => ({ ...window.__hostProbe }));
    expect(after.sendClicks).toBeGreaterThanOrEqual(beforeReplacement.sendClicks);
    expect(after.submits).toBeGreaterThan(beforeReplacement.submits);
  });

`;
e2e = replaceOne(e2e, "  test('Adaptive and committee controls mutate Ghost only, without form, URL, hash, or scroll side effects'", routerE2E + "  test('Adaptive and committee controls mutate Ghost only, without form, URL, hash, or scroll side effects'", 'e2e route regression insertion');
write('tests/e2e/chatgpt-live-regression.spec.js', e2e);

write('tests/send-router-885.test.js', `const fs = require('fs');\nconst path = require('path');\nconst src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');\n\ndescribe('8.8.5 production dispatch router contract', () => {\n  test('integrates four named routes into production', () => {\n    expect(src).toContain("route: 'alpha', path: 'alpha-click'");\n    expect(src).toContain("route: 'beta', path: 'beta-request-submit'");\n    expect(src).toContain("route: 'gamma', path: 'gamma-enter'");\n    expect(src).toContain("route:'delta', path:'delta-manual'");\n  });\n\n  test('recognizes the current ChatGPT composer submit identity', () => {\n    expect(src).toContain("send: ['#composer-submit-button'");\n  });\n\n  test('reconciles ProseMirror before final route choice', () => {\n    expect(src).toContain('await _twoAnimationFrames();');\n    expect(src).toContain("stage: 'dispatch-recheck'");\n    expect(src).toContain('const strategy = _selectDispatchStrategy(stagedInput);');\n  });\n\n  test('rotates automatic routes by confirmed round only on Firefox Android ChatGPT', () => {\n    expect(src).toContain("PLAT?.label === 'ChatGPT' && firefoxAndroid");\n    expect(src).toContain("['alpha-click', 'beta-request-submit', 'gamma-enter']");\n    expect(src).toContain('round % order.length');\n  });\n\n  test('never escalates after the at-most-once journal opens', () => {\n    const start = src.indexOf('const completion = _beginSendAttempt(strategy.path');\n    const end = src.indexOf('return await completion;', start);\n    expect(start).toBeGreaterThan(-1);\n    expect(end).toBeGreaterThan(start);\n    const afterBoundary = src.slice(start, end);\n    expect(afterBoundary).not.toContain('_selectDispatchStrategy(');\n    expect(afterBoundary).not.toContain('requestSubmit(');\n    expect(afterBoundary).not.toContain("path: 'gamma-enter'");\n  });\n\n  test('persists uncertain route health and enriches SEND-002 without content', () => {\n    expect(src).toContain("_noteDispatchRoute(txn.path, 'uncertain')");\n    expect(src).toContain('trusted_pulse_age_ms');\n    expect(src).toContain('user_delta');\n    expect(src).toContain('send_connected');\n    expect(src).toContain('same_form');\n  });\n});\n`);

const statePath = '.gitl/autopilot-state.json';
const state = JSON.parse(read(statePath));
state.releaseTarget = '8.8.5';
state.branch = 'agent/8.8.5-send-router';
state.status = 'release-candidate-certification';
state.publishReady = false;
write(statePath, JSON.stringify(state, null, 2) + '\n');

write('ghost-in-the-loop.user.js', src);
console.log('8.8.5 guarded send-router patch applied successfully.');
