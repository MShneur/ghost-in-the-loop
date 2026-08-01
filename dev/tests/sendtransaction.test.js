/**
 * AT-MOST-ONCE SEND TRANSACTION
 *
 * These tests lock down the safety boundary: one strategy is selected before
 * the journal opens, exactly one dispatch occurs, state advances only after
 * independent evidence, and ambiguous dispatch is never retried.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('dispatch authority', () => {
  test('only one reviewed adapter button may return from the top authority tier', () => {
    expect(src).toContain('function _reviewedSend()');
    expect(src).toContain('if (!PLAT?.reviewed) return null;');
    expect(src).toContain('return matches.size === 1 ? [...matches][0] : null;');
  });

  test('generic and imported custom adapters are not reviewed actuators', () => {
    expect(src).toContain("key: 'generic', reviewed: false");
    expect(src).toContain('PLAT.reviewed = false;');
  });

  test('safety exceptions fail closed', () => {
    const safety = body('_sendLooksSafe', '_heurInput');
    expect(safety).toContain('catch(_) { return false; }');
  });
});

describe('send transaction', () => {
  const send = body('engineSend', '_confirmSend');
  const confirm = body('_confirmSend', '_markSendUncertain');

  test('one transaction authorizes exactly one dispatch invocation', () => {
    const begin = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const afterBegin = send.slice(begin);
    expect((afterBegin.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    expect(afterBegin).not.toContain('.click()');
    expect(afterBegin).not.toContain('requestSubmit()');
    expect(afterBegin).not.toContain('send_escalate');
    expect(afterBegin).not.toContain('reviewed-paragraph');
  });

  test('strategy selection is complete before transaction creation', () => {
    const strategy = send.indexOf('const strategy = _selectSendMechanism(staged');
    const evidence = send.indexOf('const preDispatch = _preDispatchEvidence(input, text, strategy)');
    const begin = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const dispatch = send.indexOf('strategy.run();', begin);
    expect(strategy).toBeGreaterThan(-1);
    expect(evidence).toBeGreaterThan(strategy);
    expect(begin).toBeGreaterThan(evidence);
    expect(dispatch).toBeGreaterThan(begin);
  });

  test('prompt and actuator evidence gate fails before any transaction or dispatch', () => {
    const gate = send.indexOf('if (!preDispatch.ok)');
    const begin = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(begin);
    expect(send.slice(gate, begin)).toContain('return false;');
    expect(send.slice(gate, begin)).not.toContain('strategy.run()');
  });

  test('engineSend waits for the transaction promise instead of reporting success', () => {
    expect(send).toContain('return await completion;');
    expect(send).not.toContain('_confirmSend(');
    expect(send).not.toMatch(/return\s+true/);
  });

  test('round advancement exists only in confirmation/reconciliation paths', () => {
    expect(confirm).toContain('L.round++;');
    expect(send).not.toContain('L.round++');
    expect(confirm).toContain("txn.state = 'committed'");
  });

  test('ambiguous sends never enter an automatic retry path', () => {
    expect(src).not.toContain('SEND_MAX_RETRIES');
    expect(src).not.toContain('_refireSend');
    expect(src).not.toContain('RecoveryEngine.recoverSend');
    expect(src).not.toContain('send_escalate');
    expect(src).toContain('Nothing was resent.');
  });

  test('a throw after transaction begin enters uncertain rather than fallback', () => {
    expect(send).toContain("Timeline.record('send_dispatch_error', { path: strategy.path })");
    expect(send).toContain('_markSendUncertain();');
  });

  test('the loop will not parse stale output while dispatch is unresolved', () => {
    const tick = body('engineTick', 'engineStart');
    const pending = tick.indexOf('if (L.sendPending)');
    const read = tick.indexOf('const text = Adapter.getLastText()');
    expect(pending).toBeGreaterThan(-1);
    expect(read).toBeGreaterThan(pending);
    expect(tick.slice(pending, read)).toContain('return;');
  });
});

describe('recovery', () => {
  test('a reload converts an in-flight dispatch to uncertain, not a resend', () => {
    expect(src).toContain("cs.send.state === 'dispatching'");
    expect(src).toContain("state: 'uncertain'");
    expect(src).toContain('nothing was resent');
  });

  test('stored recovery identity is route-class metadata, not a full URL', () => {
    const recoveryStart = src.indexOf('function _safeRouteClass');
    const unloadStart = src.indexOf("window.addEventListener('beforeunload'", recoveryStart);
    const unloadEnd = src.indexOf('\n});', unloadStart);
    const unload = unloadStart < 0 ? '' : src.slice(unloadStart, unloadEnd + 4);
    expect(unload).toContain('routeClass: _safeRouteClass()');
    expect(unload).not.toContain('location.href');
    expect(unload).not.toContain('prompt');
  });
});
