/**
 * SAFEGUARDS (v8.7.0 — Track D)
 *
 * Covers: ambiguity guards (send + composer), kill switch, per-site disable,
 * dry-run mode. Every one fails LOUD — a blocked action always says why.
 *
 * jsdom note: elements report a zero rect, so tests stub getBoundingClientRect
 * to make them "visible" for the visibility-gated paths.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

function makeVisible(el) {
  el.getBoundingClientRect = () => ({ width: 40, height: 20, top: 100, bottom: 120, left: 10, right: 50 });
  return el;
}

describe('send ambiguity guard', () => {
  const origMatchEl = TeachStore.matchEl;
  beforeEach(() => { document.body.innerHTML = ''; TeachStore.matchEl = () => null; });
  afterAll(() => { TeachStore.matchEl = origMatchEl; document.body.innerHTML = ''; });

  test('exactly one live reviewed candidate → actuator returned', () => {
    const b = makeVisible(document.createElement('button'));
    b.setAttribute('data-testid', 'send-button');
    b.setAttribute('aria-label', 'Send prompt');
    document.body.appendChild(b);
    expect(_reviewedSend()).toBe(b);
    expect(_sendAmbiguity()).toBe(0);
  });

  test('two distinct live candidates → no actuator, ambiguity recorded', () => {
    const a = makeVisible(document.createElement('button'));
    a.setAttribute('data-testid', 'send-button');
    a.setAttribute('aria-label', 'Send prompt');
    const b = makeVisible(document.createElement('button'));
    b.setAttribute('aria-label', 'Send');
    document.body.appendChild(a); document.body.appendChild(b);
    expect(_reviewedSend()).toBeNull();
    expect(_sendAmbiguity()).toBe(2);
  });

  test('same element matched by several selectors is ONE candidate, not ambiguous', () => {
    const a = makeVisible(document.createElement('button'));
    a.setAttribute('data-testid', 'send-button');
    a.setAttribute('aria-label', 'Send prompt');
    document.body.appendChild(a);
    expect(_reviewedSend()).toBe(a);
    expect(_sendAmbiguity()).toBe(0);
  });

  test('a human-taught control is the disambiguation and still wins', () => {
    const a = makeVisible(document.createElement('button'));
    a.setAttribute('data-testid', 'send-button');
    const b = makeVisible(document.createElement('button'));
    b.setAttribute('aria-label', 'Send');
    document.body.appendChild(a); document.body.appendChild(b);
    const taught = makeVisible(document.createElement('button'));
    TeachStore.matchEl = () => taught;
    expect(_reviewedSend()).toBe(taught);
  });

  test('vetoed or disabled extras do not count as candidates', () => {
    const good = makeVisible(document.createElement('button'));
    good.setAttribute('data-testid', 'send-button');
    good.setAttribute('aria-label', 'Send prompt');
    const menu = makeVisible(document.createElement('button'));
    menu.setAttribute('aria-label', 'Send money to charity'); // not vetoed by words…
    menu.setAttribute('aria-haspopup', 'menu');               // …but structurally vetoed
    const disabled = makeVisible(document.createElement('button'));
    disabled.setAttribute('aria-label', 'Send');
    disabled.disabled = true;
    document.body.appendChild(good); document.body.appendChild(menu); document.body.appendChild(disabled);
    expect(_reviewedSend()).toBe(good);
    expect(_sendAmbiguity()).toBe(0);
  });
});

describe('composer ambiguity guard', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterAll(() => { document.body.innerHTML = ''; });

  test('one visible composer → count 1', () => {
    const c = makeVisible(document.createElement('div'));
    c.id = 'prompt-textarea';
    c.setAttribute('contenteditable', 'true');
    document.body.appendChild(c);
    expect(_ambiguousComposerCount()).toBe(1);
  });

  test('two distinct visible composers → count 2', () => {
    const a = makeVisible(document.createElement('div'));
    a.id = 'prompt-textarea';
    a.setAttribute('contenteditable', 'true');
    const b = makeVisible(document.createElement('textarea'));
    document.body.appendChild(a); document.body.appendChild(b);
    expect(_ambiguousComposerCount()).toBe(2);
  });

  test('hidden extras do not count', () => {
    const a = makeVisible(document.createElement('div'));
    a.id = 'prompt-textarea';
    a.setAttribute('contenteditable', 'true');
    const hidden = document.createElement('textarea'); // zero rect in jsdom → invisible
    document.body.appendChild(a); document.body.appendChild(hidden);
    expect(_ambiguousComposerCount()).toBe(1);
  });
});

describe('kill switch and per-site disable', () => {
  afterEach(() => {
    GHOST.safety.killSwitch = false;
    setSiteDisabled(false);
  });

  test('kill switch blocks the pre-send gate, loudly', () => {
    GHOST.safety.killSwitch = true;
    expect(killSwitchOn()).toBe(true);
    const r = assertInteractionSafe();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('kill-switch-on');
  });

  test('per-site disable blocks the pre-send gate and persists per host', () => {
    expect(siteDisabled()).toBe(false);
    setSiteDisabled(true);
    expect(siteDisabled()).toBe(true);
    const r = assertInteractionSafe();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('automation-disabled-on-this-site');
    // persisted under the harness hostname
    const stored = JSON.parse(GM_getValue('gitlSiteOff', '{}'));
    expect(stored['chatgpt.com']).toBe(true);
    setSiteDisabled(false);
    expect(siteDisabled()).toBe(false);
  });

  test('neither switch set → gate proceeds to the normal checks', () => {
    const r = assertInteractionSafe();
    expect(r.ok).toBe(true);
  });

  test('safety keys ride the config backup/restore schema', () => {
    const bundle = JSON.stringify({ schema: CONFIG_SCHEMA, version: 1, config: { killSwitch: true, dryRun: false } });
    const res = _validateConfigBundle(bundle);
    expect(res.ok).toBe(true);
    expect(res.config.killSwitch).toBe(true);
  });
});

describe('guard placement (source contracts)', () => {
  const send = body('engineSend', '_confirmSend');
  const tick = body('engineTick', 'engineStart');

  test('kill switch + site disable gate every send before anything else', () => {
    const safe = body('assertInteractionSafe', undefined);
    expect(safe.indexOf('killSwitchOn()')).toBeGreaterThan(-1);
    expect(safe.indexOf('siteDisabled()')).toBeGreaterThan(-1);
    expect(safe.indexOf('killSwitchOn()')).toBeLessThan(safe.indexOf('claimTabLock()'));
  });

  test('a running loop pauses LOUD when a switch is flipped mid-run', () => {
    expect(tick).toContain("enginePause(killSwitchOn() ? 'Kill switch ON — automation stopped'");
    const tickStart = tick.indexOf("if (L.state !== 'RUNNING') return;");
    const guardAt = tick.indexOf('killSwitchOn() || siteDisabled()');
    const pendingAt = tick.indexOf('if (L.sendPending)');
    expect(guardAt).toBeGreaterThan(tickStart);
    expect(guardAt).toBeLessThan(pendingAt);
  });

  test('send ambiguity (SEND-004) outranks disabled (SEND-003) and no-mechanism (SEND-001)', () => {
    const a4 = send.indexOf("Reporter.capture('SEND-004'");
    const a3 = send.indexOf("Reporter.capture('SEND-003'");
    const a1 = send.indexOf("Reporter.capture('SEND-001'");
    expect(a4).toBeGreaterThan(-1);
    expect(a3).toBeGreaterThan(a4);
    expect(a1).toBeGreaterThan(a3);
  });

  test('composer ambiguity is checked BEFORE text is injected', () => {
    const ambAt = send.indexOf('_ambiguousComposerCount()');
    const injectAt = send.indexOf('Adapter.injectText(input, text)');
    expect(ambAt).toBeGreaterThan(-1);
    expect(ambAt).toBeLessThan(injectAt);
    expect(send).toContain("Reporter.capture('COMPOSER-003'");
  });

  test('dry run pauses after tier selection and BEFORE the journal opens — never dispatches', () => {
    const stratAt = send.indexOf('const strategy = _selectSendStrategy(btn, input)');
    const dryAt = send.indexOf('GHOST.safety.dryRun');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    expect(dryAt).toBeGreaterThan(stratAt);
    expect(dryAt).toBeLessThan(beginAt);
    const dryBlock = send.slice(dryAt, beginAt);
    expect(dryBlock).toContain("Timeline.record('dry_run_dispatch'");
    expect(dryBlock).toContain('DRY RUN');
    expect(dryBlock).not.toContain('strategy.run()');
    expect(dryBlock).not.toContain('_beginSendAttempt(');
  });

  test('startLoop and startQueue refuse loudly under a switch', () => {
    const sl = body('startLoop', 'startQueue');
    expect(sl).toContain('killSwitchOn()');
    expect(sl).toContain('siteDisabled()');
    const sq = body('startQueue', undefined);
    expect(sq).toContain('killSwitchOn()');
  });

  test('safety defaults are OFF (switches are strictly opt-in)', () => {
    expect(src).toContain("killSwitch: GM_getValue('killSwitch',false)");
    expect(src).toContain("dryRun: GM_getValue('dryRun',false)");
    expect(src).toContain('killSwitch:false, dryRun:false');
  });

  test('settings expose the three switches with wiring', () => {
    expect(src).toContain('id="cfg-kill"');
    expect(src).toContain('id="cfg-siteoff"');
    expect(src).toContain('id="cfg-dryrun"');
    expect(src).toContain("$('#cfg-kill')?.addEventListener('click'");
    expect(src).toContain("$('#cfg-siteoff')?.addEventListener('click'");
    expect(src).toContain("$('#cfg-dryrun')?.addEventListener('click'");
    expect(src).toContain("Timeline.record('kill_switch'");
  });
});
