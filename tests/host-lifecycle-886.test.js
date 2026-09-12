const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

function between(startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  const end = src.indexOf(endNeedle, start + startNeedle.length);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

describe('8.8.6 host lifecycle hardening', () => {
  test('has a bounded lifecycle controller that cannot actuate Send', () => {
    const block = between('const HOST_LIFECYCLE = {', 'async function engineSend');
    expect(block).toContain('MutationObserver');
    expect(block).toContain("['popstate', 'hashchange']");
    expect(block).toContain("['pushState', 'replaceState']");
    expect(block).toContain("window.addEventListener('pagehide'");
    expect(block).not.toContain('.click()');
    expect(block).not.toContain('requestSubmit(');
    expect(block).not.toContain("KeyboardEvent('keydown'");
  });

  test('reacquires and verifies composer before route selection', () => {
    const send = between('async function engineSend(text, skipDelay)', 'function _beginSendAttempt');
    const verify = send.indexOf('const finalStage = await _verifyLifecycleComposer(stagedInput, text);');
    const select = send.indexOf('const strategy = _selectDispatchStrategy(stagedInput);');
    const begin = send.indexOf('const completion = _beginSendAttempt(strategy.path');
    expect(verify).toBeGreaterThan(-1);
    expect(select).toBeGreaterThan(verify);
    expect(begin).toBeGreaterThan(select);
  });

  test('preserves post-dispatch no-fallback invariant', () => {
    const begin = src.indexOf('const completion = _beginSendAttempt(strategy.path');
    const finish = src.indexOf('return await completion;', begin);
    expect(begin).toBeGreaterThan(-1);
    expect(finish).toBeGreaterThan(begin);
    const postBoundary = src.slice(begin, finish);
    expect(postBoundary).not.toContain('_selectDispatchStrategy(');
    expect(postBoundary).not.toContain('button.click()');
    expect(postBoundary).not.toContain('requestSubmit(');
  });

  test('keeps Perplexity single-write guard present', () => {
    expect(src).toContain('duplicateRepairAttempted');
    expect(src).toContain('data-less compatibility signalling');
  });

  test('lifecycle telemetry is metadata only', () => {
    const block = between('function _hostLifecycleRecord', 'function _hostLifecycleRefresh');
    expect(block).toContain("Timeline.record('host_lifecycle'");
    expect(block).not.toContain('expectedText');
    expect(block).not.toContain('location.href');
    expect(block).not.toContain('selector');
  });
});
