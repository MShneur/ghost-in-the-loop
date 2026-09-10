const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.5 production dispatch router contract', () => {
  test('integrates four named routes into production', () => {
    expect(src).toContain("route: 'alpha', path: 'alpha-click'");
    expect(src).toContain("route: 'beta', path: 'beta-request-submit'");
    expect(src).toContain("route: 'gamma', path: 'gamma-enter'");
    expect(src).toContain("route:'delta', path:'delta-manual'");
  });

  test('recognizes the current ChatGPT composer submit identity', () => {
    expect(src).toContain("send: ['#composer-submit-button'");
  });

  test('reconciles ProseMirror before final route choice', () => {
    expect(src).toContain('await _twoAnimationFrames();');
    expect(src).toContain("stage: 'dispatch-recheck'");
    expect(src).toContain('const strategy = _selectDispatchStrategy(stagedInput);');
  });

  test('rotates automatic routes by confirmed round only on Firefox Android ChatGPT', () => {
    expect(src).toContain("PLAT?.label === 'ChatGPT' && firefoxAndroid");
    expect(src).toContain("['alpha-click', 'beta-request-submit', 'gamma-enter']");
    expect(src).toContain('round % order.length');
  });

  test('never escalates after the at-most-once journal opens', () => {
    const start = src.indexOf('const completion = _beginSendAttempt(strategy.path');
    const end = src.indexOf('return await completion;', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const afterBoundary = src.slice(start, end);
    expect(afterBoundary).not.toContain('_selectDispatchStrategy(');
    expect(afterBoundary).not.toContain('requestSubmit(');
    expect(afterBoundary).not.toContain("path: 'gamma-enter'");
  });

  test('persists uncertain route health and enriches SEND-002 without content', () => {
    expect(src).toContain("_noteDispatchRoute(txn.path, 'uncertain')");
    expect(src).toContain('trusted_pulse_age_ms');
    expect(src).toContain('user_delta');
    expect(src).toContain('send_connected');
    expect(src).toContain('same_form');
  });
});
