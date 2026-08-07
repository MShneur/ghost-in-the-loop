// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const EXPOSE = `
  const __rtCounts = {
    tickerStart: 0,
    tickerStop: 0,
    cacheClear: 0,
    heartbeatStart: 0,
    busInit: 0,
    redetect: 0
  };
  const __rtOrigTickerStart = Ticker.start.bind(Ticker);
  const __rtOrigTickerStop = Ticker.stop.bind(Ticker);
  Ticker.start = (...args) => { __rtCounts.tickerStart += 1; return __rtOrigTickerStart(...args); };
  Ticker.stop = (...args) => { __rtCounts.tickerStop += 1; return __rtOrigTickerStop(...args); };
  const __rtOrigClear = _clearElementCaches;
  _clearElementCaches = (...args) => { __rtCounts.cacheClear += 1; return __rtOrigClear(...args); };
  const __rtOrigHeartbeat = startTabHeartbeat;
  startTabHeartbeat = (...args) => { __rtCounts.heartbeatStart += 1; return __rtOrigHeartbeat(...args); };
  const __rtOrigBusInit = GhostBus.init.bind(GhostBus);
  GhostBus.init = (...args) => { __rtCounts.busInit += 1; return __rtOrigBusInit(...args); };
  const __rtOrigRedetect = reDetect;
  reDetect = (...args) => { __rtCounts.redetect += 1; return __rtOrigRedetect(...args); };
  const __rtOrigClaimTabLock = claimTabLock;

  window.__GITL_RedTeam = Object.freeze({
    prepareWakeState: (state = 'RUNNING') => {
      GHOST.loop.state = state;
      GHOST.loop.needsPayload = false;
      GHOST.loop.sendPending = false;
      GHOST.loop.isSending = false;
      GHOST.loop.sendDeadline = 0;
      GHOST.loop.sendTxn = null;
      _wakeRecovery.inFlight = false;
      _wakeRecovery.lastAt = 0;
      _wakeRecovery.hiddenAt = 0;
      _wakeRecovery.routeClass = _safeRouteClass();
      claimTabLock = __rtOrigClaimTabLock;
      return true;
    },
    forceRouteMismatch: () => {
      _wakeRecovery.routeClass = '__gitl_redteam_other_route__';
    },
    forceLeaseDenied: () => {
      claimTabLock = () => false;
    },
    forceDispatchingSend: () => {
      GHOST.loop.sendTxn = {
        id: 'redteam-send',
        state: 'dispatching',
        attemptedAt: Date.now()
      };
      GHOST.loop.sendPending = true;
      GHOST.loop.isSending = true;
      GHOST.loop.sendDeadline = Date.now() + 30000;
    },
    resetWakeThrottle: () => {
      _wakeRecovery.inFlight = false;
      _wakeRecovery.lastAt = 0;
    },
    triggerWake: (source = 'redteam') => recoverAfterWake(source),
    counts: () => ({ ...__rtCounts }),
    loop: () => ({
      state: GHOST.loop.state,
      phase: GHOST.loop.phase,
      detail: GHOST.loop.detail,
      timer: GHOST.loop.timer,
      sendPending: GHOST.loop.sendPending,
      isSending: GHOST.loop.isSending,
      sendTxnState: GHOST.loop.sendTxn?.state || null
    })
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

function installActuationCounters() {
  return `
    const events = { submit: 0, click: 0, input: 0, keydown: 0 };
    const form = document.querySelector('form');
    const send = form.querySelector('button');
    const input = form.querySelector('textarea');
    form.addEventListener('submit', e => { events.submit += 1; e.preventDefault(); });
    send.addEventListener('click', () => { events.click += 1; });
    input.addEventListener('input', () => { events.input += 1; });
    input.addEventListener('keydown', () => { events.keydown += 1; });
  `;
}

test.describe('Lifecycle Red Team production wake path', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForFunction(() => !!window.__GITL_RedTeam);
  });

  test('route changes around wake pause stale work and never actuate Send', async ({ page }) => {
    const result = await page.evaluate((counterSource) => {
      eval(counterSource);
      window.__GITL_RedTeam.prepareWakeState('RUNNING');
      window.__GITL_RedTeam.forceRouteMismatch();
      const before = window.__GITL_RedTeam.counts();
      const woke = window.__GITL_RedTeam.triggerWake('redteam-route');
      const after = window.__GITL_RedTeam.counts();
      return {
        woke,
        before,
        after,
        events,
        value: input.value,
        loop: window.__GITL_RedTeam.loop()
      };
    }, installActuationCounters());

    expect(result.woke).toBe(false);
    expect(result.loop.state).toBe('PAUSED');
    expect(result.loop.detail).toMatch(/route changed/i);
    expect(result.after.tickerStart - result.before.tickerStart).toBe(0);
    expect(result.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.value).toBe('unchanged');
  });

  test('foreign-lease denial during wake pauses without restarting stale work', async ({ page }) => {
    const result = await page.evaluate((counterSource) => {
      eval(counterSource);
      window.__GITL_RedTeam.prepareWakeState('RUNNING');
      window.__GITL_RedTeam.forceLeaseDenied();
      const before = window.__GITL_RedTeam.counts();
      const woke = window.__GITL_RedTeam.triggerWake('redteam-lease');
      const after = window.__GITL_RedTeam.counts();
      return {
        woke,
        before,
        after,
        events,
        value: input.value,
        loop: window.__GITL_RedTeam.loop()
      };
    }, installActuationCounters());

    expect(result.woke).toBe(false);
    expect(result.loop.state).toBe('PAUSED');
    expect(result.loop.detail).toMatch(/another tab owns/i);
    expect(result.after.tickerStart - result.before.tickerStart).toBe(0);
    expect(result.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.value).toBe('unchanged');
  });

  test('dispatching Send discovered on wake becomes uncertain and remains non-actuating', async ({ page }) => {
    const result = await page.evaluate((counterSource) => {
      eval(counterSource);
      window.__GITL_RedTeam.prepareWakeState('RUNNING');
      window.__GITL_RedTeam.forceDispatchingSend();
      const before = window.__GITL_RedTeam.counts();
      const woke = window.__GITL_RedTeam.triggerWake('redteam-send');
      const after = window.__GITL_RedTeam.counts();
      return {
        woke,
        before,
        after,
        events,
        value: input.value,
        loop: window.__GITL_RedTeam.loop()
      };
    }, installActuationCounters());

    expect(result.woke).toBe(false);
    expect(result.loop.state).toBe('PAUSED');
    expect(result.loop.phase).toBe('error');
    expect(result.loop.sendPending).toBe(false);
    expect(result.loop.isSending).toBe(false);
    expect(result.loop.sendTxnState).toBe('uncertain');
    expect(result.after.tickerStart - result.before.tickerStart).toBe(0);
    expect(result.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.value).toBe('unchanged');
  });

  test('composer replacement before and after wake leaves every stale node non-actuating', async ({ page }) => {
    const result = await page.evaluate(() => {
      const stale = [];
      const replaceComposer = label => {
        const form = document.querySelector('form');
        const input = form.querySelector('textarea');
        const send = form.querySelector('button');
        const events = { submit: 0, click: 0, input: 0, keydown: 0 };
        form.addEventListener('submit', e => { events.submit += 1; e.preventDefault(); });
        send.addEventListener('click', () => { events.click += 1; });
        input.addEventListener('input', () => { events.input += 1; });
        input.addEventListener('keydown', () => { events.keydown += 1; });
        const replacement = form.cloneNode(true);
        replacement.id = label;
        form.replaceWith(replacement);
        stale.push({ form, input, events });
      };

      window.__GITL_RedTeam.prepareWakeState('RUNNING');
      replaceComposer('composer-before-wake');
      const firstWake = window.__GITL_RedTeam.triggerWake('redteam-dom-before');
      replaceComposer('composer-after-wake');
      window.__GITL_RedTeam.resetWakeThrottle();
      const secondWake = window.__GITL_RedTeam.triggerWake('redteam-dom-after');

      const live = document.querySelector('form');
      const liveInput = live.querySelector('textarea');
      const liveSend = live.querySelector('button');
      const liveEvents = { submit: 0, click: 0, input: 0, keydown: 0 };
      live.addEventListener('submit', e => { liveEvents.submit += 1; e.preventDefault(); });
      liveSend.addEventListener('click', () => { liveEvents.click += 1; });
      liveInput.addEventListener('input', () => { liveEvents.input += 1; });
      liveInput.addEventListener('keydown', () => { liveEvents.keydown += 1; });

      return {
        firstWake,
        secondWake,
        stale: stale.map(x => ({
          connected: x.form.isConnected,
          events: x.events,
          value: x.input.value
        })),
        liveConnected: live.isConnected,
        liveValue: liveInput.value,
        liveEvents,
        loop: window.__GITL_RedTeam.loop()
      };
    });

    expect(result.firstWake).toBe(true);
    expect(result.secondWake).toBe(true);
    expect(result.loop.state).toBe('RUNNING');
    expect(result.stale).toHaveLength(2);
    for (const node of result.stale) {
      expect(node.connected).toBe(false);
      expect(node.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
      expect(node.value).toBe('unchanged');
    }
    expect(result.liveConnected).toBe(true);
    expect(result.liveEvents).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.liveValue).toBe('unchanged');
  });
});
