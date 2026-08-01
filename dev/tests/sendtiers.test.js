/**
 * SEND TIER TRUTH TABLE (v8.7.0 / Track F)
 *
 * Proves the pre-journal ladder selects exactly one mechanism and that
 * engineSend never fires a second actuator after _beginSendAttempt().
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('send tier ladder — pre-journal selection only', () => {
  const ladder = body('_selectDispatchStrategy', '_settleSendPromise');
  const send = body('engineSend', '_confirmSend');

  test('tier order: button → enter → form.requestSubmit', () => {
    const btnAt = ladder.indexOf('Adapter.getSendBtn()');
    const enterAt = ladder.indexOf("path: 'reviewed-enter'");
    const formAt = ladder.indexOf("path: 'reviewed-form'");
    const submitAt = ladder.indexOf('form.requestSubmit');
    expect(btnAt).toBeGreaterThan(-1);
    expect(enterAt).toBeGreaterThan(btnAt);
    expect(formAt).toBeGreaterThan(enterAt);
    expect(submitAt).toBeGreaterThan(-1);
  });

  test('engineSend delegates strategy selection to _selectDispatchStrategy', () => {
    expect(send).toContain('const strategy = _selectDispatchStrategy(input)');
    expect(send).not.toMatch(/const strategy = btn \?/);
  });

  test('exactly one strategy.run() per engineSend — no post-begin escalation', () => {
    expect((send.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    const runAt = send.indexOf('strategy.run()');
    expect(beginAt).toBeGreaterThan(-1);
    expect(runAt).toBeGreaterThan(beginAt);
    expect(send.slice(runAt)).not.toContain('Adapter.getSendBtn');
    expect(send.slice(runAt)).not.toContain('requestSubmit');
  });

  test('form tier requires a unique reviewed form wrapper', () => {
    const formFn = body('_reviewedFormForInput', '_selectDispatchStrategy');
    expect(formFn).toContain('forms.length !== 1');
    expect(formFn).toContain('submits.length !== 1');
  });

  test('truth table: each path string is distinct', () => {
    const paths = ['reviewed-button', 'reviewed-enter', 'reviewed-form'];
    for (const p of paths) expect(ladder).toContain(`'${p}'`);
  });
});
