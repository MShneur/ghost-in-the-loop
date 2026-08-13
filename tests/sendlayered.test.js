/**
 * SINGLE-DISPATCH SELECTION (v8.5.3 item 2)
 *
 * A transaction selects one reviewed dispatch mechanism before the journal
 * opens. Once dispatch begins, Ghost may observe, confirm, or pause uncertain;
 * it may never escalate to another actuator.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('single reviewed dispatch selection', () => {
  const send = body('engineSend', '_confirmSend');

  test('the buttonless reviewed Enter fallback is opt-in per adapter (Perplexity + ChatGPT)', () => {
    const perpStart = src.indexOf("perplexity: {");
    const perp = src.slice(perpStart, src.indexOf("\n  gemini:", perpStart));
    expect(perp).toContain("dispatchFallback: 'enter'");

    const cgStart = src.indexOf("chatgpt: {");
    const cg = src.slice(cgStart, src.indexOf("\n  perplexity:", cgStart));
    expect(cg).toContain("dispatchFallback: 'enter'");

    // Still explicit opt-in — declared only by adapters that submit on Enter,
    // never a universal default. (Both composers are Enter-to-send.)
    expect((src.match(/dispatchFallback:\s*'enter'/g) || []).length).toBe(2);
  });

  test('selects the mechanism before opening the transaction journal', () => {
    const selectAt = send.indexOf('const strategy = btn ?');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, stagedInput)');
    const runAt = send.indexOf('strategy.run()');
    expect(selectAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(selectAt);
    expect(runAt).toBeGreaterThan(beginAt);
  });

  test('button wins; Enter is used only when the reviewed adapter opts in', () => {
    expect(send).toContain("path: 'reviewed-button'");
    expect(send).toContain("PLAT?.reviewed && PLAT.dispatchFallback === 'enter'");
    expect(send).toContain("path: 'reviewed-enter'");
    expect(send).toContain("new KeyboardEvent('keydown'");
    expect(send).not.toContain("new KeyboardEvent('keypress'");
    expect(send).not.toContain("new KeyboardEvent('keyup'");
  });

  test('contains no post-begin fallback or actuator escalation', () => {
    expect(send).not.toContain('reviewed-paragraph');
    expect(send).not.toContain('reviewed-form');
    expect(send).not.toContain('send_escalate');
    expect(send).not.toContain('requestSubmit');
    expect(send).not.toMatch(/for\s*\([^)]*tiers/);
    expect((send.match(/strategy\.run\(\)/g) || []).length).toBe(1);
  });

  test('a dispatch exception becomes uncertain and never selects another mechanism', () => {
    const runAt = send.indexOf('strategy.run()');
    const catchAt = send.indexOf('catch(_)', runAt);
    const uncertainAt = send.indexOf('_markSendUncertain()', catchAt);
    expect(catchAt).toBeGreaterThan(runAt);
    expect(uncertainAt).toBeGreaterThan(catchAt);
    expect(send.slice(catchAt, uncertainAt + 22)).not.toContain('Adapter.getSendBtn');
  });

  test('no strategy leaves the injected prompt for manual review before a transaction starts', () => {
    const noStrategyAt = send.indexOf('if (!strategy)');
    // Target the actual CALL, not the earlier explanatory comment that also
    // mentions _beginSendAttempt() (the loose search matched the comment).
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    expect(noStrategyAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(-1);
    expect(noStrategyAt).toBeLessThan(beginAt);
    expect(send).toContain('No safe Send mechanism — prompt left for manual review');
  });
});
