// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const EXPOSE = `
  const __rrCounts = {
    tickerStart: 0,
    tickerStop: 0,
    cacheClear: 0,
    heartbeatStart: 0
  };
  const __rrOrigTickerStart = Ticker.start.bind(Ticker);
  const __rrOrigTickerStop = Ticker.stop.bind(Ticker);
  Ticker.start = (...args) => { __rrCounts.tickerStart += 1; return __rrOrigTickerStart(...args); };
  Ticker.stop = (...args) => { __rrCounts.tickerStop += 1; return __rrOrigTickerStop(...args); };
  const __rrOrigClear = _clearElementCaches;
  _clearElementCaches = (...args) => { __rrCounts.cacheClear += 1; return __rrOrigClear(...args); };
  const __rrOrigHeartbeat = startTabHeartbeat;
  startTabHeartbeat = (...args) => { __rrCounts.heartbeatStart += 1; return __rrOrigHeartbeat(...args); };

  window.__GITL_Test = Object.freeze({
    runtimeHealth: overrides => runtimeServiceHealth(overrides),
    requestRepair: () => repairAndResume(),
    preparePausedTickerFault: () => {
      GHOST.loop.state = 'PAUSED';
      GHOST.loop.needsPayload = false;
      Ticker.stop();
      return {
        state: GHOST.loop.state,
        health: runtimeServiceHealth()
      };
    },
    lastRepair: () => JSON.parse(JSON.stringify(GHOST.lastRepair || null)),
    loopSnapshot: () => ({
      state: GHOST.loop.state,
      phase: GHOST.loop.phase,
      detail: GHOST.loop.detail,
      timer: GHOST.loop.timer,
      route: GHOST.loop.route
    }),
    counts: () => ({ ...__rrCounts }),
    tickerMode: () => Ticker.mode
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_setClipboard = () => {};
  window.GM_notification = () => {};
`;

const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html>
<html><body>
  <main>
    <div class="message assistant"><div class="markdown">Stable answer.</div></div>
    <form id="composer">
      <textarea id="chat-box" placeholder="Message the model">unchanged</textarea>
      <button id="true-send" type="submit" aria-label="Send message">Send</button>
    </form>
  </main>
</body></html>`)}`;

test.describe('Repair & Resume production path', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForFunction(() => !!window.__GITL_Test);
  });

  test('repairs a real paused ticker fault once and never actuates Send', async ({ page }) => {
    const result = await page.evaluate(() => {
      const events = { submit: 0, click: 0, input: 0, keydown: 0 };
      const form = document.getElementById('composer');
      const send = document.getElementById('true-send');
      const input = document.getElementById('chat-box');
      form.addEventListener('submit', e => { events.submit += 1; e.preventDefault(); });
      send.addEventListener('click', () => { events.click += 1; });
      input.addEventListener('input', () => { events.input += 1; });
      input.addEventListener('keydown', () => { events.keydown += 1; });

      const beforeValue = input.value;
      window.__GITL_Test.preparePausedTickerFault();
      const before = window.__GITL_Test.counts();
      const first = window.__GITL_Test.requestRepair();
      const afterFirst = window.__GITL_Test.counts();
      const second = window.__GITL_Test.requestRepair();
      const afterSecond = window.__GITL_Test.counts();

      return {
        first,
        second,
        before,
        afterFirst,
        afterSecond,
        events,
        beforeValue,
        afterValue: input.value,
        loop: window.__GITL_Test.loopSnapshot(),
        lastRepair: window.__GITL_Test.lastRepair()
      };
    });

    expect(result.first.ok).toBe(true);
    expect(result.afterFirst.tickerStart - result.before.tickerStart).toBe(1);
    expect(result.afterSecond.tickerStart - result.afterFirst.tickerStart).toBe(0);
    expect(result.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.afterValue).toBe(result.beforeValue);
    expect(result.lastRepair).toBeTruthy();
  });

  test('route, lease, and uncertain-send blockers fail closed in the real health model', async ({ page }) => {
    const blocked = await page.evaluate(() => ({
      route: window.__GITL_Test.runtimeHealth({
        runtimeState: 'PAUSED', routeChanged: true, journalSafe: true,
        leaseStatus: 'owned', tickerMode: 'none', heartbeat: true,
        busConnected: true, panelConnected: true, redetectActive: false,
        networkActive: true, cachedInput: null, input: null
      }),
      lease: window.__GITL_Test.runtimeHealth({
        runtimeState: 'PAUSED', routeChanged: false, journalSafe: true,
        leaseStatus: 'other', tickerMode: 'none', heartbeat: true,
        busConnected: true, panelConnected: true, redetectActive: false,
        networkActive: true, cachedInput: null, input: null
      }),
      journal: window.__GITL_Test.runtimeHealth({
        runtimeState: 'PAUSED', routeChanged: false, journalSafe: false,
        leaseStatus: 'owned', tickerMode: 'none', heartbeat: true,
        busConnected: true, panelConnected: true, redetectActive: false,
        networkActive: true, cachedInput: null, input: null
      })
    }));

    expect(blocked.route.blocked).toContain('route-changed');
    expect(blocked.lease.blocked).toContain('tab-lock-held');
    expect(blocked.journal.blocked).toContain('send-journal');
    expect(blocked.route.canRepairAndResume).toBe(false);
    expect(blocked.lease.canRepairAndResume).toBe(false);
    expect(blocked.journal.canRepairAndResume).toBe(false);
  });

  test('replaced composer receives no repair-time events and stale nodes stay untouched', async ({ page }) => {
    const result = await page.evaluate(() => {
      const oldForm = document.getElementById('composer');
      const oldInput = document.getElementById('chat-box');
      const oldSend = document.getElementById('true-send');
      const oldEvents = { submit: 0, click: 0, input: 0, keydown: 0 };
      oldForm.addEventListener('submit', e => { oldEvents.submit += 1; e.preventDefault(); });
      oldSend.addEventListener('click', () => { oldEvents.click += 1; });
      oldInput.addEventListener('input', () => { oldEvents.input += 1; });
      oldInput.addEventListener('keydown', () => { oldEvents.keydown += 1; });

      const replacement = oldForm.cloneNode(true);
      replacement.id = 'composer-replacement';
      oldForm.replaceWith(replacement);

      window.__GITL_Test.preparePausedTickerFault();
      const repair = window.__GITL_Test.requestRepair();
      return {
        repair,
        oldEvents,
        oldConnected: oldForm.isConnected,
        replacementConnected: replacement.isConnected,
        replacementValue: replacement.querySelector('textarea').value
      };
    });

    expect(result.repair.ok).toBe(true);
    expect(result.oldEvents).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.oldConnected).toBe(false);
    expect(result.replacementConnected).toBe(true);
    expect(result.replacementValue).toBe('unchanged');
  });
});
