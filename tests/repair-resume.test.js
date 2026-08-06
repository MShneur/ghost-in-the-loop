const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf('function ' + name);
  const end = src.indexOf('function ' + nextName, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

const healthy = {
  tickerMode: 'none', heartbeat: true, leaseStatus: 'owned', busConnected: true,
  cachedInput: null, input: null, panelConnected: true, redetectActive: false,
  routeChanged: false, journalSafe: true, networkActive: true
};

describe('runtime service health', () => {
  test('idle absence is not runtime damage', () => {
    const h = runtimeServiceHealth({ runtimeState: 'IDLE', ...healthy });
    expect(h.needsRepair).toBe(false);
    expect(h.blocked).toEqual([]);
  });

  test('running without a ticker requires repair', () => {
    const h = runtimeServiceHealth({ runtimeState: 'RUNNING', ...healthy, input: {}, redetectActive: true });
    expect(h.repairable).toContain('ticker');
    expect(h.needsRepair).toBe(true);
  });

  test('paused damaged services expose a safe repair path', () => {
    const h = runtimeServiceHealth({
      runtimeState: 'PAUSED', ...healthy,
      heartbeat: false, leaseStatus: 'available', busConnected: false,
      input: null, redetectActive: false, panelConnected: false, networkActive: false
    });
    expect(h.repairable).toEqual(expect.arrayContaining([
      'heartbeat', 'tab-lease', 'ghost-bus', 'composer-observer', 'panel', 'network-observer'
    ]));
    expect(h.blocked).toEqual([]);
    expect(h.needsRepair).toBe(true);
  });

  test.each([
    ['unsafe journal', { journalSafe: false }, 'send-journal'],
    ['route change', { routeChanged: true }, 'route-changed'],
    ['other tab lease', { leaseStatus: 'other' }, 'tab-lock-held']
  ])('%s blocks repair and resume', (_label, patch, expected) => {
    const h = runtimeServiceHealth({ runtimeState: 'PAUSED', ...healthy, ...patch });
    expect(h.blocked).toContain(expected);
    expect(h.canRepairAndResume).toBe(false);
  });
});

describe('repair and resume safety contract', () => {
  test('repairs independent runtime layers', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    for (const signal of [
      '_clearElementCaches()', 'Ticker.stop()', 'startTabHeartbeat()', 'claimTabLock()',
      'GhostBus.init()', 'GITL_NET.install()', 'mountPanel()', 'reDetect()',
      'Ticker.start(engineTick,2500)'
    ]) expect(repair).toContain(signal);
  });

  test('never becomes a Send actuator or prompt injector', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    for (const forbidden of [
      'engineSend(', 'RESUME_TEXT', 'Adapter.clickContinue', 'regroundLoop', 'location.reload'
    ]) expect(repair).not.toContain(forbidden);
  });

  test('preserves hard blocks and only resumes a paused existing run', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    expect(repair).toContain("before.blocked.includes('send-journal')");
    expect(repair).toContain("priorState==='PAUSED' && !L.needsPayload");
    expect(repair).toContain("L.state='PAUSED'");
  });

  test('UI keeps normal Resume and adds a separate health-gated repair action', () => {
    expect(src).toContain('id="g-play"');
    expect(src).toContain('id="g-repair-resume"');
    expect(src).toContain('repairHealth.canRepairAndResume');
    expect(src).toContain("addEventListener('click', repairAndResume)");
  });
});
