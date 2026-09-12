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
    expect(block).toContain("window.addEventListener('pageshow'");
    expect(block).not.toContain('.click()');
    expect(block).not.toContain('requestSubmit(');
    expect(block).not.toContain("KeyboardEvent('keydown'");
  });

  test('filters unrelated long-chat mutations', () => {
    const block = between('function _hostLifecycleMutationRelevant', 'function _hostLifecycleSchedule');
    expect(block).toContain('record.removedNodes');
    expect(block).toContain('node.contains(current)');
    expect(src).toContain("if (_hostLifecycleMutationRelevant(records)) _hostLifecycleSchedule('mutation');");
  });

  test('does not fall back to a stale composer during pre-dispatch reacquisition', () => {
    const block = between('async function _verifyLifecycleComposer', 'startHostLifecycleController();');
    expect(block).toContain('const current = before.input;');
    expect(block).not.toContain('|| stagedInput');
    expect(block).toContain('input: current');
    expect(block).toContain("failureCode: 'COMPOSER-MISSING'");
  });

  test('uses only the verified live composer for route selection before transaction start', () => {
    const engine = src.indexOf('async function engineSend(text, skipDelay)');
    const verify = src.indexOf('const finalStage = await _verifyLifecycleComposer(text);', engine);
    const dispatchInput = src.indexOf('const dispatchInput = finalStage.input;', engine);
    const select = src.indexOf('const strategy = _selectDispatchStrategy(dispatchInput);', engine);
    const begin = src.indexOf('const completion = _beginSendAttempt(strategy.path', engine);
    expect(engine).toBeGreaterThan(-1);
    expect(verify).toBeGreaterThan(engine);
    expect(dispatchInput).toBeGreaterThan(verify);
    expect(select).toBeGreaterThan(dispatchInput);
    expect(begin).toBeGreaterThan(select);
  });

  test('keeps Perplexity single-write protections present', () => {
    expect(src).toContain('duplicateRepairAttempted');
    expect(src).toContain('data-less compatibility signalling');
  });

  test('lifecycle failure telemetry names exact pre-dispatch stage without prompt data', () => {
    const block = between('function _hostLifecycleRecord', 'function _hostLifecycleRefresh');
    expect(block).toContain("Timeline.record('host_lifecycle'");
    expect(block).toContain('failure_stage');
    expect(block).toContain('failure_code');
    expect(block).not.toContain('expectedText');
    expect(block).not.toContain('location.href');
    expect(block).not.toContain('selector');
  });
});
