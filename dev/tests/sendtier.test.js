/**
 * SEND TIER TRUTH TABLE (v8.7)
 * Proves the pre-journal ladder cannot double-dispatch.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('send tier ladder', () => {
  const ladder = body('_selectSendStrategy', '_preDispatchEvidenceGate');
  const send = body('engineSend', '_confirmSend');

  test('tiers are ordered: button → enter → form → taught', () => {
    const btn = ladder.indexOf("path: 'reviewed-button'");
    const enter = ladder.indexOf("path: 'reviewed-enter'");
    const form = ladder.indexOf("path: 'reviewed-form'");
    const taught = ladder.indexOf("path: 'reviewed-taught'");
    expect(btn).toBeGreaterThan(-1);
    expect(enter).toBeGreaterThan(btn);
    expect(form).toBeGreaterThan(enter);
    expect(taught).toBeGreaterThan(form);
  });

  test('ambiguity returns a sentinel instead of picking arbitrarily', () => {
    expect(ladder).toContain("path: 'ambiguous'");
    expect(ladder).toContain('buttons.length > 1');
  });

  test('engineSend selects strategy and evidence gate before the journal', () => {
    const selectAt = send.indexOf('const strategy = _selectSendStrategy(input)');
    const gateAt = send.indexOf('const gate = _preDispatchEvidenceGate(input, text, strategy)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const runAt = send.indexOf('strategy.run()');
    expect(selectAt).toBeGreaterThan(-1);
    expect(gateAt).toBeGreaterThan(selectAt);
    expect(beginAt).toBeGreaterThan(gateAt);
    expect(runAt).toBeGreaterThan(beginAt);
  });

  test('exactly one strategy.run() and no post-journal escalation', () => {
    expect((send.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    expect(send).not.toContain('send_escalate');
    expect(send).not.toMatch(/for\s*\([^)]*tier/);
  });

  test('dry run never opens the send journal', () => {
    const dryAt = send.indexOf('if (GHOST.ui.dryRun)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    expect(dryAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(dryAt);
    expect(send.slice(dryAt, beginAt)).toContain('send_dry_run');
    expect(send.slice(dryAt, beginAt)).not.toContain('_beginSendAttempt');
  });
});
