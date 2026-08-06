// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8');

/**
 * Deterministic browser fault harness for the Repair & Resume safety contract.
 *
 * This intentionally does not expose or add a second production actuator.
 * It models the browser-owned fault boundaries around the real production
 * contract while static assertions below keep the harness tied to the actual
 * repairAndResume implementation and its fail-closed guards.
 */
function harnessScript() {
  return `
    (() => {
      const state = {
        phase: 'paused', route: '/chat/a', expectedRoute: '/chat/a',
        lease: 'owned', priorDispatch: 'known', repairing: false,
        acceptedRepairs: 0, sendAttempts: 0,
        starts: { observer: 1, timer: 1, render: 1, adapter: 1 },
        healthy: { observer: true, timer: true, render: true, adapter: true },
        input: document.querySelector('#composer textarea'),
        send: document.querySelector('#composer button[data-send]')
      };

      const start = name => {
        if (!state.healthy[name]) {
          state.starts[name] += 1;
          state.healthy[name] = true;
        }
      };

      async function requestRepair() {
        if (state.repairing) return { state: 'repairing', accepted: false };
        state.repairing = true;
        try {
          if (state.priorDispatch === 'unknown') return { state: 'blocked', reason: 'send-journal' };
          if (state.route !== state.expectedRoute) return { state: 'blocked', reason: 'route-changed' };
          if (state.lease !== 'owned') return { state: 'blocked', reason: 'tab-lock-held' };

          const currentInput = document.querySelector('#composer textarea');
          const currentSend = document.querySelector('#composer button[data-send]');
          if (!currentInput || !currentSend) return { state: 'blocked', reason: 'composer-unavailable' };
          state.input = currentInput;
          state.send = currentSend;

          state.acceptedRepairs += 1;
          for (const name of Object.keys(state.healthy)) start(name);
          state.phase = 'resumed';
          return { state: 'resumed', accepted: true };
        } finally {
          await new Promise(r => setTimeout(r, 20));
          state.repairing = false;
        }
      }

      window.__RR = {
        state,
        requestRepair,
        breakService(name) { state.healthy[name] = false; },
        snapshot() { return JSON.parse(JSON.stringify({
          phase: state.phase, route: state.route, expectedRoute: state.expectedRoute,
          lease: state.lease, priorDispatch: state.priorDispatch,
          acceptedRepairs: state.acceptedRepairs, sendAttempts: state.sendAttempts,
          starts: state.starts, healthy: state.healthy
        })); }
      };
    })();
  `;
}

const PAGE = `<!doctype html><html><body>
  <main id="conversation"><form id="composer">
    <textarea></textarea><button type="button" data-send>Send</button>
  </form></main>
</body></html>`;

test.describe('Repair & Resume browser fault contract', () => {
  test('production repair remains non-dispatching and fail-closed', () => {
    const start = SOURCE.indexOf('function repairAndResume');
    const end = SOURCE.indexOf('function rebootGhost', start);
    const body = SOURCE.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(body).not.toContain('engineSend(');
    expect(body).not.toContain('Adapter.clickContinue');
    expect(body).toContain("before.blocked.includes('send-journal')");
    expect(body).toContain("priorState==='PAUSED' && !L.needsPayload");
  });

  test('detached composer is rediscovered once and duplicate repair coalesces', async ({ page }) => {
    await page.setContent(PAGE);
    await page.addScriptTag({ content: harnessScript() });

    const oldEvents = await page.evaluate(() => {
      const oldInput = document.querySelector('#composer textarea');
      const oldSend = document.querySelector('#composer button[data-send]');
      let events = 0;
      oldInput.addEventListener('input', () => events++);
      oldSend.addEventListener('click', () => events++);
      document.querySelector('#composer').outerHTML = '<form id="composer"><textarea></textarea><button type="button" data-send>Send</button></form>';
      window.__RR.breakService('observer');
      window.__RR.breakService('render');
      window.__oldEventCount = () => events;
      return events;
    });
    expect(oldEvents).toBe(0);

    const [a, b] = await page.evaluate(() => Promise.all([
      window.__RR.requestRepair(), window.__RR.requestRepair()
    ]));
    const snap = await page.evaluate(() => window.__RR.snapshot());
    const staleEvents = await page.evaluate(() => window.__oldEventCount());

    expect([a.accepted, b.accepted].filter(Boolean)).toHaveLength(1);
    expect(snap.acceptedRepairs).toBe(1);
    expect(snap.starts.observer).toBe(2);
    expect(snap.starts.render).toBe(2);
    expect(snap.starts.timer).toBe(1);
    expect(snap.starts.adapter).toBe(1);
    expect(snap.sendAttempts).toBe(0);
    expect(staleEvents).toBe(0);
  });

  test('unknown dispatch, route drift, and foreign lease remain blocked', async ({ page }) => {
    await page.setContent(PAGE);
    await page.addScriptTag({ content: harnessScript() });

    for (const fault of [
      { patch: { priorDispatch: 'unknown' }, reason: 'send-journal' },
      { patch: { route: '/chat/b' }, reason: 'route-changed' },
      { patch: { lease: 'foreign' }, reason: 'tab-lock-held' }
    ]) {
      const result = await page.evaluate(async ({ patch }) => {
        Object.assign(window.__RR.state, {
          route: '/chat/a', expectedRoute: '/chat/a', lease: 'owned', priorDispatch: 'known'
        }, patch);
        return window.__RR.requestRepair();
      }, fault);
      const snap = await page.evaluate(() => window.__RR.snapshot());
      expect(result.state).toBe('blocked');
      expect(result.reason).toBe(fault.reason);
      expect(snap.sendAttempts).toBe(0);
    }
  });

  test('transiently missing reviewed controls fail closed', async ({ page }) => {
    await page.setContent(PAGE);
    await page.addScriptTag({ content: harnessScript() });
    const result = await page.evaluate(async () => {
      document.querySelector('#composer button[data-send]').remove();
      return window.__RR.requestRepair();
    });
    const snap = await page.evaluate(() => window.__RR.snapshot());
    expect(result).toEqual({ state: 'blocked', reason: 'composer-unavailable' });
    expect(snap.acceptedRepairs).toBe(0);
    expect(snap.sendAttempts).toBe(0);
  });
});
