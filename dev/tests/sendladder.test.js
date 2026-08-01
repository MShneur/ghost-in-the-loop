/**
 * SEND TIER LADDER (v8.7.0 Track F) — truth table
 *
 * Selection happens BEFORE `_beginSendAttempt()`. Exactly one mechanism may
 * fire. Post-dispatch escalation is forbidden.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('send tier ladder — selection before journal', () => {
  const select = body('_selectSendStrategy', '_visibleComposerPeers');
  const send = body('engineSend', '_confirmSend');

  test('ladder order is platform-button → enter → form → taught', () => {
    const btnAt = select.indexOf("path: 'reviewed-button'");
    const enterAt = select.indexOf("path: 'reviewed-enter'");
    const formAt = select.indexOf("path: 'reviewed-form'");
    const taughtAt = select.indexOf("path: 'taught-button'");
    expect(btnAt).toBeGreaterThan(-1);
    expect(enterAt).toBeGreaterThan(btnAt);
    expect(formAt).toBeGreaterThan(enterAt);
    expect(taughtAt).toBeGreaterThan(formAt);
  });

  test('form tier requires a unique wrapping form with requestSubmit', () => {
    expect(src).toContain('function _uniqueComposerForm');
    expect(select).toContain('requestSubmit()');
    expect(select).toContain('_uniqueComposerForm(input)');
  });

  test('engineSend selects via ladder helper before opening the journal', () => {
    const selectAt = send.indexOf('const strategy = _selectSendStrategy(input)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const runAt = send.indexOf('strategy.run()');
    expect(selectAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(selectAt);
    expect(runAt).toBeGreaterThan(beginAt);
  });

  test('exactly one strategy.run() and no post-begin escalation', () => {
    expect((send.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    expect(send).not.toContain('send_escalate');
    expect(send).toContain('_markSendUncertain()');
    const runAt = send.indexOf('strategy.run()');
    const after = send.slice(runAt);
    expect(after).not.toContain('_selectSendStrategy');
    expect(after).not.toContain('requestSubmit()');
  });

  test('truth table rows: each path is mutually exclusive at selection time', () => {
    // Platform button short-circuits before enter/form/taught.
    expect(select).toMatch(/const platformBtn = _platformReviewedSend\(\);\s*if \(platformBtn\)/);
    // Enter only when no platform button and adapter opts in.
    expect(select).toContain("PLAT?.reviewed && PLAT.dispatchFallback === 'enter'");
    // Form only when reviewed and unique wrapper.
    expect(select).toContain('PLAT?.reviewed && input');
    // Taught is last resort actuator.
    expect(select.lastIndexOf("TeachStore.matchEl('send')")).toBeGreaterThan(select.indexOf('reviewed-form'));
  });
});

describe('pre-dispatch evidence gate (Track A)', () => {
  const send = body('engineSend', '_confirmSend');

  test('composer must hold the prompt before the journal opens', () => {
    expect(src).toContain('function _composerHoldsPrompt');
    const holdAt = send.indexOf('_composerHoldsPrompt(input, text)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt');
    expect(holdAt).toBeGreaterThan(-1);
    expect(holdAt).toBeLessThan(beginAt);
    expect(send).toContain('COMPOSER-002');
  });

  test('injectText returns verification result, not blind true', () => {
    const start = src.indexOf('injectText(el, text)');
    const chunk = src.slice(start, start + 2200);
    expect(chunk).toContain('return _composerHoldsPrompt(el, text)');
    expect(chunk).not.toMatch(/DIAG\.sendPath = 'contenteditable';\s*return true;/);
  });
});

describe('at-most-once truth table — no path fires twice', () => {
  const cases = [
    ['reviewed-button', "path: 'reviewed-button'"],
    ['reviewed-enter', "path: 'reviewed-enter'"],
    ['reviewed-form', "path: 'reviewed-form'"],
    ['taught-button', "path: 'taught-button'"],
  ];

  test.each(cases)('%s appears once as a selectable path and only via strategy.run', (name, needle) => {
    const select = body('_selectSendStrategy', '_visibleComposerPeers');
    const send = body('engineSend', '_confirmSend');
    expect((select.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length).toBe(1);
    // engineSend never inlines a second click/enter/submit after begin
    const beginAt = send.indexOf('_beginSendAttempt');
    const after = send.slice(beginAt);
    expect(after).not.toContain('.click()');
    expect(after).not.toContain('KeyboardEvent');
    expect(after).not.toContain('requestSubmit');
    expect(after.match(/strategy\.run\(\)/g)?.length || 0).toBe(1);
    void name;
  });
});
