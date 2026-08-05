const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = src.indexOf(`function ${nextName}`, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('mobile suspension wake recovery', () => {
  test('defines one centralized wake recovery function', () => {
    expect(src).toContain('function recoverAfterWake(');
  });

  test('wake recovery preserves fail-closed send safety', () => {
    const recover = body('recoverAfterWake', 'rebootGhost');
    expect(recover).toContain('sendPending');
    expect(recover).toMatch(/dispatching|uncertain/);
    expect(recover).toContain("state='PAUSED'");
    expect(recover).not.toContain('engineSend(');
  });

  test('running loops rearm exactly one ticker after wake', () => {
    const recover = body('recoverAfterWake', 'rebootGhost');
    expect(recover).toContain("state==='RUNNING'");
    expect(recover).toContain('Ticker.start(engineTick, 2500)');
    expect(recover).toContain('Ticker.stop()');
  });

  test('wake recovery rebuilds independent runtime layers', () => {
    const recover = body('recoverAfterWake', 'rebootGhost');
    for (const signal of [
      '_clearElementCaches()',
      'startTabHeartbeat()',
      'claimTabLock()',
      'GhostBus.init()',
      'reDetect()',
    ]) expect(recover).toContain(signal);
  });

  test('mobile lifecycle events all route through the same recovery gate', () => {
    expect(src).toMatch(/visibilitychange[\s\S]*recoverAfterWake/);
    expect(src).toMatch(/pageshow[\s\S]*recoverAfterWake/);
    expect(src).toMatch(/focus[\s\S]*recoverAfterWake/);
  });

  test('recovery never reloads the host page or invents a resume send', () => {
    const recover = body('recoverAfterWake', 'rebootGhost');
    expect(recover).not.toContain('location.reload');
    expect(recover).not.toContain('RESUME_TEXT');
    expect(recover).not.toContain('regroundLoop');
  });
});
