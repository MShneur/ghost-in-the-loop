// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

// Global test-harness instrumentation is installed before Ghost boots. It counts
// active intervals and MutationObserver registrations without changing product
// behavior. The goal is accumulation detection, not a synthetic speed score.
const PERF_HARNESS = `
  (() => {
    const intervalIds = new Set();
    const activeObservers = new Set();
    const counters = { intervalCreate: 0, intervalClear: 0, observerObserve: 0, observerDisconnect: 0 };

    const originalSetInterval = window.setInterval.bind(window);
    const originalClearInterval = window.clearInterval.bind(window);
    window.setInterval = (...args) => {
      const id = originalSetInterval(...args);
      intervalIds.add(id);
      counters.intervalCreate += 1;
      return id;
    };
    window.clearInterval = id => {
      intervalIds.delete(id);
      counters.intervalClear += 1;
      return originalClearInterval(id);
    };

    const moProto = window.MutationObserver && window.MutationObserver.prototype;
    if (moProto) {
      const originalObserve = moProto.observe;
      const originalDisconnect = moProto.disconnect;
      moProto.observe = function(...args) {
        activeObservers.add(this);
        counters.observerObserve += 1;
        return originalObserve.apply(this, args);
      };
      moProto.disconnect = function(...args) {
        activeObservers.delete(this);
        counters.observerDisconnect += 1;
        return originalDisconnect.apply(this, args);
      };
    }

    window.__GITL_PerfHarness = Object.freeze({
      snapshot: () => ({
        activeIntervals: intervalIds.size,
        activeObservers: activeObservers.size,
        ...counters
      })
    });
  })();
`;

const EXPOSE = `
  const __mobileCounts = {
    tickerStart: 0,
    heartbeatStart: 0,
    cacheClear: 0,
    cacheClearMs: 0,
    cacheClearMaxMs: 0,
    busInit: 0,
    redetect: 0
  };

  const __mobileTickerStart = Ticker.start.bind(Ticker);
  Ticker.start = (...args) => { __mobileCounts.tickerStart += 1; return __mobileTickerStart(...args); };

  const __mobileHeartbeat = startTabHeartbeat;
  startTabHeartbeat = (...args) => { __mobileCounts.heartbeatStart += 1; return __mobileHeartbeat(...args); };

  const __mobileClear = _clearElementCaches;
  _clearElementCaches = (...args) => {
    const t0 = performance.now();
    try {
      return __mobileClear(...args);
    } finally {
      const dt = performance.now() - t0;
      __mobileCounts.cacheClear += 1;
      __mobileCounts.cacheClearMs += dt;
      __mobileCounts.cacheClearMaxMs = Math.max(__mobileCounts.cacheClearMaxMs, dt);
    }
  };

  const __mobileBusInit = GhostBus.init.bind(GhostBus);
  GhostBus.init = (...args) => { __mobileCounts.busInit += 1; return __mobileBusInit(...args); };

  const __mobileRedetect = reDetect;
  reDetect = (...args) => { __mobileCounts.redetect += 1; return __mobileRedetect(...args); };

  window.__GITL_MobilePerf = Object.freeze({
    prepareWakeState: (state = 'RUNNING') => {
      GHOST.loop.state = state;
      GHOST.loop.needsPayload = false;
      GHOST.loop.sendPending = false;
      GHOST.loop.isSending = false;
      if (GHOST.loop.sendTxn && (GHOST.loop.sendTxn.state === 'dispatching' || GHOST.loop.sendTxn.state === 'uncertain')) {
        GHOST.loop.sendTxn = null;
      }
      _wakeRecovery.inFlight = false;
      _wakeRecovery.lastAt = 0;
      _wakeRecovery.hiddenAt = 0;
      _wakeRecovery.routeClass = _safeRouteClass();
    },
    counts: () => ({ ...__mobileCounts }),
    state: () => GHOST.loop.state,
    panelCount: () => document.querySelectorAll('#gitl').length,
    lockRecordCount: () => Object.keys(window.__gmStore || {}).filter(k => k.startsWith('gitl:lock:') && window.__gmStore[k]).length
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

const messages = Array.from({ length: 180 }, (_, i) =>
  `<div class="message assistant"><div class="markdown">${i === 179 ? 'Latest answer 179' : `Historical answer ${i}`}</div></div>`
).join('');

const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
  <main>
    ${messages}
    <form id="composer">
      <textarea id="chat-box" placeholder="Message the model" aria-label="Message the model">unchanged</textarea>
      <button id="true-send" type="submit" aria-label="Send message">Send</button>
    </form>
  </main>
</body></html>`)}`;

function delta(after, before, key) {
  return after[key] - before[key];
}

test.describe('Lifecycle mobile/performance bounded recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(PERF_HARNESS);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForFunction(() => !!window.__GITL_MobilePerf && !!window.__GITL_PerfHarness);
  });

  test('Pixel-class repeated wake pressure stays bounded and preserves usable host UI', async ({ page }, testInfo) => {
    const result = await page.evaluate(() => {
      const form = document.getElementById('composer');
      const send = document.getElementById('true-send');
      const input = document.getElementById('chat-box');
      const events = { submit: 0, click: 0, input: 0, keydown: 0 };
      form.addEventListener('submit', e => { events.submit += 1; e.preventDefault(); });
      send.addEventListener('click', () => { events.click += 1; });
      input.addEventListener('input', () => { events.input += 1; });
      input.addEventListener('keydown', () => { events.keydown += 1; });

      const harnessBefore = window.__GITL_PerfHarness.snapshot();
      const countsBefore = window.__GITL_MobilePerf.counts();
      const samples = [];

      for (let i = 0; i < 12; i += 1) {
        window.__GITL_MobilePerf.prepareWakeState('RUNNING');
        const before = window.__GITL_MobilePerf.counts();
        const t0 = performance.now();
        const pageshow = typeof PageTransitionEvent === 'function'
          ? new PageTransitionEvent('pageshow', { persisted: true })
          : new Event('pageshow');
        if (!('persisted' in pageshow)) Object.defineProperty(pageshow, 'persisted', { value: true });
        window.dispatchEvent(pageshow);
        document.dispatchEvent(new Event('resume'));
        window.dispatchEvent(new Event('focus'));
        const elapsedMs = performance.now() - t0;
        const after = window.__GITL_MobilePerf.counts();
        samples.push({
          elapsedMs,
          tickerStart: after.tickerStart - before.tickerStart,
          heartbeatStart: after.heartbeatStart - before.heartbeatStart,
          cacheClear: after.cacheClear - before.cacheClear,
          cacheClearMs: after.cacheClearMs - before.cacheClearMs,
          busInit: after.busInit - before.busInit,
          redetect: after.redetect - before.redetect
        });
      }

      const harnessAfter = window.__GITL_PerfHarness.snapshot();
      const countsAfter = window.__GITL_MobilePerf.counts();
      const latest = Array.from(document.querySelectorAll('.message.assistant .markdown')).at(-1);

      return {
        profile: {
          width: innerWidth,
          height: innerHeight,
          devicePixelRatio,
          maxTouchPoints: navigator.maxTouchPoints,
          userAgent: navigator.userAgent
        },
        harnessBefore,
        harnessAfter,
        countsBefore,
        countsAfter,
        samples,
        events,
        panelCount: window.__GITL_MobilePerf.panelCount(),
        lockRecordCount: window.__GITL_MobilePerf.lockRecordCount(),
        loopState: window.__GITL_MobilePerf.state(),
        inputConnected: input.isConnected,
        inputValue: input.value,
        sendConnected: send.isConnected,
        sendLabel: send.getAttribute('aria-label'),
        latestText: latest && latest.textContent
      };
    });

    await testInfo.attach('lifecycle-mobile-perf-metrics.json', {
      body: Buffer.from(JSON.stringify(result, null, 2)),
      contentType: 'application/json'
    });

    // Device-profile facts: this test is meaningful only when run under the
    // configured Playwright Pixel 7 / chromium-mobile project.
    expect(result.profile.width).toBeLessThanOrEqual(500);
    expect(result.profile.maxTouchPoints).toBeGreaterThan(0);

    // Each separated recovery window may receive a pageshow/resume/focus burst,
    // but the semantic runtime-service rebuild remains exactly once per window.
    expect(result.samples).toHaveLength(12);
    for (const sample of result.samples) {
      expect(sample.tickerStart).toBe(1);
      expect(sample.heartbeatStart).toBe(1);
      expect(sample.busInit).toBe(1);
      expect(sample.redetect).toBe(1);
      expect(sample.cacheClear).toBeGreaterThanOrEqual(1);
      expect(sample.cacheClear).toBeLessThanOrEqual(2);
      expect(Number.isFinite(sample.cacheClearMs)).toBe(true);
      expect(Number.isFinite(sample.elapsedMs)).toBe(true);
    }

    // Accumulation proxies: repeated wake recovery must replace/reuse runtime
    // resources, not leak new interval or observer registrations each cycle.
    expect(result.harnessAfter.activeIntervals).toBeLessThanOrEqual(result.harnessBefore.activeIntervals + 1);
    expect(result.harnessAfter.activeObservers).toBeLessThanOrEqual(result.harnessBefore.activeObservers + 1);
    expect(result.lockRecordCount).toBeLessThanOrEqual(1);

    // Host usability and accessibility remain intact after repeated mobile wakes.
    expect(result.panelCount).toBe(1);
    expect(result.loopState).toBe('RUNNING');
    expect(result.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(result.inputConnected).toBe(true);
    expect(result.inputValue).toBe('unchanged');
    expect(result.sendConnected).toBe(true);
    expect(result.sendLabel).toBe('Send message');
    expect(result.latestText).toContain('Latest answer 179');

    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message the model' })).toBeVisible();
    await expect(page.locator('.message.assistant').last()).toContainText('Latest answer 179');
  });
});