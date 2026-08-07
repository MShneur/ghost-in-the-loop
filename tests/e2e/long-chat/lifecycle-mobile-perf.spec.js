// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_setClipboard = () => {};
  window.GM_notification = () => {};
`;

const RESOURCE_HARNESS = `
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

  window.__GITL_LongChatResources = Object.freeze({
    snapshot: () => ({ activeIntervals: intervalIds.size, activeObservers: activeObservers.size, ...counters })
  });
})();
`;

const QUERY_HARNESS = `
(() => {
  const original = Document.prototype.querySelectorAll;
  let stats;
  const fresh = () => ({ calls: 0, totalMatches: 0, totalMs: 0, bySelector: {} });
  stats = fresh();
  Document.prototype.querySelectorAll = function(selector) {
    const t0 = performance.now();
    const result = original.call(this, selector);
    const dt = performance.now() - t0;
    const key = String(selector);
    const entry = stats.bySelector[key] || { calls: 0, matches: 0, ms: 0 };
    entry.calls += 1;
    entry.matches += result.length;
    entry.ms += dt;
    stats.bySelector[key] = entry;
    stats.calls += 1;
    stats.totalMatches += result.length;
    stats.totalMs += dt;
    return result;
  };
  window.__GITL_LongChatQueries = Object.freeze({
    reset: () => { stats = fresh(); },
    snapshot: () => JSON.parse(JSON.stringify(stats))
  });
})();
`;

const EXPOSE = `
  window.__GITL_LongChatMobile = Object.freeze({
    getLastText: () => Adapter.getLastText(),
    beginSendProbe: () => {
      GHOST.loop.sendTxn = null;
      return _beginSendAttempt('long-chat-a4-read-only', Adapter.peekInput());
    },
    prepareSendEvidenceProbe: () => {
      GHOST.loop.sendTxn = {
        id: 'long-chat-a4', state: 'dispatching', path: 'benchmark-read-only', attemptedAt: Date.now(),
        assistantCount: Number.MAX_SAFE_INTEGER, assistantTextLength: Number.MAX_SAFE_INTEGER,
        assistantTail: '', trustedPulseAt: GITL_NET.lastPulseT || 0, composerHadText: false
      };
    },
    sendEvidenceProbe: () => _sendEvidence(),
    clearTxn: () => { GHOST.loop.sendTxn = null; },
    platform: () => ({ key: PLAT && PLAT.key, assistant: (PLAT && PLAT.assistant) ? [...PLAT.assistant] : [] }),
    panelCount: () => document.querySelectorAll('#gitl').length
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

function historyHtml(turns) {
  const items = [];
  for (let i = 0; i < turns; i += 1) {
    let inner = `Historical assistant answer ${i} with deterministic visible text for mobile and cross-browser measurement.`;
    let style = '';
    if (i === turns - 4) inner = `Older terminal answer ${i} must not override the latest unfinished answer. [[GITL::HALT]]`;
    else if (i === turns - 3) inner = `Nested duplicate cluster ${i}.<div data-message-author-role="assistant"><div class="markdown">Nested duplicate ${i}</div></div>`;
    else if (i === turns - 2) inner = `NEWEST_UNFINISHED_${turns}: newest visible unfinished assistant response with no terminal marker.`;
    else if (i === turns - 1) { inner = `HIDDEN_DECOY_${turns}: hidden later response. [[GITL::PROCEED]]`; style = ' style="display:none" aria-hidden="true"'; }
    items.push(`<article><div data-testid="conversation-turn-${i}"><div data-message-author-role="assistant"${style}><div class="markdown">${inner}</div></div></div></article>`);
  }
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main>${items.join('')}</main><form id="composer"><textarea id="prompt-textarea" aria-label="Message ChatGPT">unchanged mobile benchmark composer</textarea><button data-testid="send-button" type="submit" aria-label="Send">Send</button></form></body></html>`;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function loadFixture(page, turns) {
  await page.route('https://chatgpt.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: historyHtml(turns) }));
  await page.goto(`https://chatgpt.com/c/gitl-r5-a4-${turns}`);
  await page.waitForFunction(() => !!window.__GITL_LongChatMobile && !!window.__GITL_LongChatQueries && !!window.__GITL_LongChatResources && document.readyState === 'complete');
}

async function measure(page, operation, samples) {
  return page.evaluate(({ operation, samples }) => {
    const times = [];
    window.__GITL_LongChatQueries.reset();
    for (let i = 0; i < samples; i += 1) {
      if (operation === 'sendEvidence') window.__GITL_LongChatMobile.prepareSendEvidenceProbe();
      const t0 = performance.now();
      if (operation === 'answer') window.__GITL_LongChatMobile.getLastText();
      else if (operation === 'beginSend') window.__GITL_LongChatMobile.beginSendProbe();
      else if (operation === 'sendEvidence') window.__GITL_LongChatMobile.sendEvidenceProbe();
      else throw new Error(`unknown operation ${operation}`);
      times.push(performance.now() - t0);
      window.__GITL_LongChatMobile.clearTxn();
    }
    return { times, query: window.__GITL_LongChatQueries.snapshot() };
  }, { operation, samples });
}

test.describe('R5 A4 long-chat mobile/cross-browser bounded evidence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(RESOURCE_HARNESS);
    await page.addInitScript(QUERY_HARNESS);
    await page.addInitScript(`
      window.__gitlLongChatMobileEvents = { submit: 0, click: 0, input: 0, keydown: 0 };
      document.addEventListener('submit', () => { window.__gitlLongChatMobileEvents.submit += 1; }, true);
      document.addEventListener('click', () => { window.__gitlLongChatMobileEvents.click += 1; }, true);
      document.addEventListener('input', () => { window.__gitlLongChatMobileEvents.input += 1; }, true);
      document.addEventListener('keydown', () => { window.__gitlLongChatMobileEvents.keydown += 1; }, true);
    `);
    await page.addInitScript(SCRIPT);
  });

  test('measures 180-to-2000 turn scaling with bounded resources and intact host UI', async ({ page }, testInfo) => {
    const sizes = [180, 500, 1000, 2000];
    const samples = 25;
    const rows = [];

    for (const turns of sizes) {
      await loadFixture(page, turns);
      const before = await page.evaluate(() => window.__GITL_LongChatResources.snapshot());
      const platform = await page.evaluate(() => window.__GITL_LongChatMobile.platform());
      expect(platform.key).toBe('chatgpt');
      expect(platform.assistant).toHaveLength(3);

      const correctness = await page.evaluate(turnCount => ({
        text: window.__GITL_LongChatMobile.getLastText(),
        domNodes: document.getElementsByTagName('*').length,
        panelCount: window.__GITL_LongChatMobile.panelCount(),
        profile: {
          width: innerWidth,
          height: innerHeight,
          devicePixelRatio,
          maxTouchPoints: navigator.maxTouchPoints,
          userAgent: navigator.userAgent
        }
      }), turns);

      expect(correctness.text).toContain(`NEWEST_UNFINISHED_${turns}`);
      expect(correctness.text).not.toContain('[[GITL::HALT]]');
      expect(correctness.text).not.toContain('[[GITL::PROCEED]]');
      expect(correctness.panelCount).toBe(1);

      const answer = await measure(page, 'answer', samples);
      const after = await page.evaluate(() => window.__GITL_LongChatResources.snapshot());
      expect(after.activeIntervals).toBe(before.activeIntervals);
      expect(after.activeObservers).toBe(before.activeObservers);
      expect(after.intervalCreate).toBe(before.intervalCreate);
      expect(after.observerObserve).toBe(before.observerObserve);

      const events = await page.evaluate(() => ({ ...window.__gitlLongChatMobileEvents }));
      expect(events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
      expect(answer.query.calls / samples).toBe(1);

      await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Message ChatGPT' })).toHaveValue('unchanged mobile benchmark composer');
      await expect(page.locator('[data-message-author-role="assistant"]:visible').last()).toContainText(`NEWEST_UNFINISHED_${turns}`);

      rows.push({
        turns,
        domNodes: correctness.domNodes,
        profile: correctness.profile,
        answerSelection: {
          p50Ms: percentile(answer.times, 50),
          p95Ms: percentile(answer.times, 95),
          qsaCallsPerSample: answer.query.calls / samples,
          qsaMatchesPerSample: answer.query.totalMatches / samples,
          qsaMsPerSample: answer.query.totalMs / samples
        },
        resourcesBefore: before,
        resourcesAfter: after,
        panelCount: correctness.panelCount,
        events
      });
    }

    const large = rows.at(-1);
    const small = rows[0];
    expect(large.answerSelection.qsaMatchesPerSample).toBeGreaterThan(small.answerSelection.qsaMatchesPerSample);
    expect(Number.isFinite(large.answerSelection.p95Ms)).toBe(true);

    if (testInfo.project.name === 'chromium-mobile') {
      expect(large.profile.width).toBeLessThanOrEqual(500);
      expect(large.profile.maxTouchPoints).toBeGreaterThan(0);
    }
    if (testInfo.project.name === 'firefox') {
      expect(large.profile.width).toBeLessThanOrEqual(500);
      expect(large.profile.userAgent).toContain('Firefox/');
    }

    await loadFixture(page, 2000);
    const beginSend = await measure(page, 'beginSend', 10);
    const sendEvidence = await measure(page, 'sendEvidence', 10);
    const finalEvents = await page.evaluate(() => ({ ...window.__gitlLongChatMobileEvents }));
    expect(finalEvents).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });

    const report = {
      project: testInfo.project.name,
      testedSizes: sizes,
      samplesPerAnswerOperation: samples,
      rows,
      sendObservation2000: {
        beginSend: {
          p50Ms: percentile(beginSend.times, 50),
          p95Ms: percentile(beginSend.times, 95),
          qsaCallsPerSample: beginSend.query.calls / 10,
          qsaMatchesPerSample: beginSend.query.totalMatches / 10
        },
        sendEvidence: {
          p50Ms: percentile(sendEvidence.times, 50),
          p95Ms: percentile(sendEvidence.times, 95),
          qsaCallsPerSample: sendEvidence.query.calls / 10,
          qsaMatchesPerSample: sendEvidence.query.totalMatches / 10
        }
      },
      finalEvents
    };

    console.log('GITL_LONG_CHAT_A4=' + JSON.stringify(report));
    await testInfo.attach(`long-chat-a4-${testInfo.project.name}.json`, {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json'
    });
  });
});
