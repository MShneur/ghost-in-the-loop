const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = src.indexOf(`function ${nextName}`, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('Round 4 lifecycle recovery contract', () => {
  const recover = body('recoverAfterWake', '_tabLeaseStatus');

  test('keeps one visible-only single-flight recovery gate', () => {
    expect(recover).toContain("document.visibilityState !== 'visible'");
    expect(recover).toContain('_wakeRecovery.inFlight');
    expect(recover).toContain('now-_wakeRecovery.lastAt<750');
  });

  test('routes portable wake signals and Chromium resume through recoverAfterWake', () => {
    expect(src).toMatch(/visibilitychange[\s\S]*recoverAfterWake\('visibilitychange'\)/);
    expect(src).toMatch(/pageshow[\s\S]*recoverAfterWake\('pageshow'\)/);
    expect(src).toMatch(/focus[\s\S]*recoverAfterWake\('focus'\)/);
    expect(src).toMatch(/addEventListener\('resume'[\s\S]*recoverAfterWake\('resume'\)/);
  });

  test('rebuilds runtime services before RUNNING-only ticker restart', () => {
    for (const signal of [
      '_clearElementCaches()',
      'Ticker.stop()',
      'startTabHeartbeat()',
      'claimTabLock()',
      'GhostBus.channel?.close()',
      'GhostBus.init()',
      'reDetect()',
      "if (wasRunning)",
      'Ticker.start(engineTick, 2500)',
    ]) expect(recover).toContain(signal);
  });

  test('fails closed on uncertain Send, route change, and competing tab lease', () => {
    expect(recover).toMatch(/sendPending[\s\S]*isSending[\s\S]*dispatching[\s\S]*uncertain/);
    expect(recover).toContain("reason:'send-uncertain'");
    expect(recover).toContain("reason:'route-changed'");
    expect(recover).toContain("reason:'tab-lock-held'");
    expect(recover).not.toContain('engineSend(');
  });

  test('does not lifecycle-resume PAUSED or CHOICE by construction', () => {
    expect(recover).toContain("const wasRunning=L.state==='RUNNING'");
    expect(recover).toContain('if (wasRunning)');
    expect(recover).not.toMatch(/state\s*=\s*['\"]RUNNING['\"][\s\S]*needsPayload/);
  });

  test('fresh document bootstrap defaults loop state to IDLE', () => {
    expect(src).toMatch(/loop:\s*\{[\s\S]*state:\s*'IDLE'/);
  });

  test.todo('production-path fixture proves pageshow persisted=true recovery without duplicate services');
  test.todo('discard/reload fixture classifies document.wasDiscarded when exposed and never auto-resumes stale work');
  test.todo('Chromium freeze coverage proves any quiesce path has zero Send authority and does not fork recovery logic');
});
