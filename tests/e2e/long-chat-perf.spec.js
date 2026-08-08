// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

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

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_setClipboard = () => {};
  window.GM_notification = () => {};
`;

const EXPOSE = `
  window.__GITL_LongChatPerf = Object.freeze({
    getLastText: () => Adapter.getLastText(),
    beginSendProbe: () => {
      GHOST.loop.sendTxn = null;
      return _beginSendAttempt('long-chat-benchmark-read-only', Adapter.peekInput());
    },
    prepareSendEvidenceProbe: () => {
      GHOST.loop.sendTxn = {
        id: 'long-chat-benchmark',
        state: 'dispatching',
        path: 'benchmark-read-only',
        attemptedAt: Date.now(),
        assistantCount: Number.MAX_SAFE_INTEGER,
        assistantTextLength: Number.MAX_SAFE_INTEGER,
        assistantTail: '',
        trustedPulseAt: GITL_NET.lastPulseT || 0,
        composerHadText: false
      };
    },
    sendEvidenceProbe: () => _sendEvidence(),
    clearTxn: () => { GHOST.loop.sendTxn = null; },
    platform: () => ({ key: PLAT && PLAT.key, assistant: (PLAT && PLAT.assistant) ? [...PLAT.assistant] : [] })
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

function historyHtml(turns) {
  const items = [];
  for (let i = 0; i < turns; i += 1) {
    let inner = `Historical assistant answer ${i} with enough deterministic text to be treated as visible answer content.`;
    let style = '';
    if (i === turns - 4) {
      inner = `Older terminal answer ${i} must never override a newer unfinished response. [[GITL::HALT]]`;
    } else if (i === turns - 3) {
      inner = `Nested duplicate cluster ${i}: outer visible answer.<div data-message-author-role="assistant">Nested assistant duplicate ${i} must not displace the later visible answer.</div>`;
    } else if (i === turns - 2) {
      inner = `NEWEST_UNFINISHED_${turns}: this is the newest visible unfinished assistant response and intentionally contains no terminal marker so stale older HALT or PROCEED markers cannot win selection.`;
    } else if (i === turns - 1) {
      inner = `HIDDEN_DECOY_${turns}: hidden duplicate after the newest visible response. [[GITL::PROCEED]]`;
      style = ' style="display:none" aria-hidden="true"';
    }
    items.push(`<article><div data-testid="conversation-turn-${i}"><div data-message-author-role="assistant"${style}><div class="markdown">${inner}</div></div></div></article>`);
  }
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main>${items.join('')}</main><form id="composer"><textarea id="prompt-textarea" aria-label="Message ChatGPT">unchanged benchmark composer</textarea><button data-testid="send-button" type="submit" aria-label="Send">Send</button></form></body></html>`;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function loadFixture(page, turns) {
  const html = historyHtml(turns);
  await page.route('https://chatgpt.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await page.goto(`https://chatgpt.com/c/gitl-long-chat-${turns}`);
  await page.waitForFunction(() => !!window.__GITL_LongChatPerf && !!window.__GITL_LongChatQueries && document.readyState === 'complete');
}

async function measure(page, operation, samples) {
  return page.evaluate(({ operation, samples }) => {
    const times = [];
    const events = window.__gitlLongChatEvents;
    window.__GITL_LongChatQueries.reset();
    for (let i = 0; i < samples; i += 1) {
      if (operation === 'sendEvidence') window.__GITL_LongChatPerf.prepareSendEvidenceProbe();
      const t0 = performance.now();
      if (operation === 'answer') window.__GITL_LongChatPerf.getLastText();
      else if (operation === 'beginSend') window.__GITL_LongChatPerf.beginSendProbe();
      else if (operation === 'sendEvidence') window.__GITL_LongChatPerf.sendEvidenceProbe();
      else throw new Error(`unknown operation ${operation}`);
      times.push(performance.now() - t0);
      window.__GITL_LongChatPerf.clearTxn();
    }
    return {
      times,
      query: window.__GITL_LongChatQueries.snapshot(),
      events: { ...events }
    };
  }, { operation, samples });
}

test.describe('Long-chat exact production-path baseline', () => {
  test('measures scaling while preserving newest-answer and Send safety', async ({ page }, testInfo) => {
    await page.addInitScript(GM);
    await page.addInitScript(QUERY_HARNESS);
    await page.addInitScript(`
      window.__gitlLongChatEvents = { submit: 0, click: 0, input: 0, keydown: 0 };
      document.addEventListener('submit', () => { window.__gitlLongChatEvents.submit += 1; }, true);
      document.addEventListener('click', () => { window.__gitlLongChatEvents.click += 1; }, true);
      document.addEventListener('input', () => { window.__gitlLongChatEvents.input += 1; }, true);
      document.addEventListener('keydown', () => { window.__gitlLongChatEvents.keydown += 1; }, true);
    `);
    await page.addInitScript(SCRIPT);

    const sizes = [180, 500, 1000, 2000];
    const samples = 25;
    const rows = [];

    for (const turns of sizes) {
      await loadFixture(page, turns);
      const platform = await page.evaluate(() => window.__GITL_LongChatPerf.platform());
      expect(platform.key).toBe('chatgpt');
      expect(platform.assistant).toHaveLength(3);

      const correctness = await page.evaluate(turnCount => ({
        text: window.__GITL_LongChatPerf.getLastText(),
        domNodes: document.getElementsByTagName('*').length,
        visibleAssistantTurns: Array.from(document.querySelectorAll('div[data-message-author-role="assistant"]')).filter(el => getComputedStyle(el).display !== 'none').length
      }), turns);
      expect(correctness.text).toContain(`NEWEST_UNFINISHED_${turns}`);
      expect(correctness.text).not.toContain('[[GITL::HALT]]');
      expect(correctness.text).not.toContain('[[GITL::PROCEED]]');

      const answer = await measure(page, 'answer', samples);
      const beginSend = await measure(page, 'beginSend', samples);
      const sendEvidence = await measure(page, 'sendEvidence', samples);

      for (const op of [answer, beginSend, sendEvidence]) {
        expect(op.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
        expect(op.query.calls).toBeGreaterThan(0);
        expect(op.query.totalMatches).toBeGreaterThan(0);
      }

      rows.push({
        turns,
        domNodes: correctness.domNodes,
        visibleAssistantTurns: correctness.visibleAssistantTurns,
        answerSelection: {
          p50Ms: percentile(answer.times, 50),
          p95Ms: percentile(answer.times, 95),
          qsaCallsPerSample: answer.query.calls / samples,
          qsaMatchesPerSample: answer.query.totalMatches / samples,
          qsaMsPerSample: answer.query.totalMs / samples,
          bySelector: answer.query.bySelector
        },
        beginSendObservation: {
          p50Ms: percentile(beginSend.times, 50),
          p95Ms: percentile(beginSend.times, 95),
          qsaCallsPerSample: beginSend.query.calls / samples,
          qsaMatchesPerSample: beginSend.query.totalMatches / samples,
          qsaMsPerSample: beginSend.query.totalMs / samples
        },
        sendEvidenceObservation: {
          p50Ms: percentile(sendEvidence.times, 50),
          p95Ms: percentile(sendEvidence.times, 95),
          qsaCallsPerSample: sendEvidence.query.calls / samples,
          qsaMatchesPerSample: sendEvidence.query.totalMatches / samples,
          qsaMsPerSample: sendEvidence.query.totalMs / samples
        }
      });
    }

    // Predeclared discriminators: the current polling hypothesis predicts full
    // assistant-selector enumeration grows with conversation size even though
    // ANSWER_SCAN_LIMIT bounds post-query processing. We do not impose a
    // hindsight millisecond budget; raw p50/p95 and query work are the evidence.
    expect(rows[3].answerSelection.qsaCallsPerSample).toBe(rows[0].answerSelection.qsaCallsPerSample);
    expect(rows[3].answerSelection.qsaMatchesPerSample).toBeGreaterThan(rows[0].answerSelection.qsaMatchesPerSample * 5);
    expect(rows[3].beginSendObservation.qsaMatchesPerSample).toBeGreaterThan(rows[0].beginSendObservation.qsaMatchesPerSample * 5);
    expect(rows[3].sendEvidenceObservation.qsaMatchesPerSample).toBeGreaterThan(rows[0].sendEvidenceObservation.qsaMatchesPerSample * 5);

    const report = {
      testedSizes: sizes,
      samplesPerOperation: samples,
      safetyEvents: await page.evaluate(() => ({ ...window.__gitlLongChatEvents })),
      rows
    };
    expect(report.safetyEvents).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });

    console.log('GITL_LONG_CHAT_BASELINE=' + JSON.stringify(report));
    await testInfo.attach('long-chat-baseline.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json'
    });
  });
});
