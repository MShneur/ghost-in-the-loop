// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_setClipboard = () => {};
  window.GM_notification = () => {};
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
  window.__GITL_RedTeamQueries = Object.freeze({
    reset: () => { stats = fresh(); },
    snapshot: () => JSON.parse(JSON.stringify(stats))
  });
})();
`;

const RESOURCE_HARNESS = `
(() => {
  const activeIntervals = new Set();
  let intervalCreates = 0;
  let observerCreates = 0;
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  window.setInterval = (...args) => {
    const id = nativeSetInterval(...args);
    intervalCreates += 1;
    activeIntervals.add(id);
    return id;
  };
  window.clearInterval = id => {
    activeIntervals.delete(id);
    return nativeClearInterval(id);
  };
  const NativeMutationObserver = window.MutationObserver;
  window.MutationObserver = class extends NativeMutationObserver {
    constructor(cb) {
      super(cb);
      observerCreates += 1;
    }
  };
  window.__GITL_RedTeamResources = Object.freeze({
    snapshot: () => ({ activeIntervals: activeIntervals.size, intervalCreates, observerCreates })
  });
})();
`;

const EXPOSE = `
  window.__GITL_LongChatRedTeam = Object.freeze({
    getLastText: () => Adapter.getLastText(),
    beginSendProbe: () => {
      GHOST.loop.sendTxn = null;
      GHOST.loop.sendPending = false;
      return _beginSendAttempt('long-chat-redteam-read-only', Adapter.peekInput());
    },
    prepareSendEvidenceProbe: () => {
      GHOST.loop.sendPending = true;
      GHOST.loop.sendTxn = {
        id: 'long-chat-redteam', state: 'dispatching', path: 'redteam-read-only', attemptedAt: Date.now(),
        assistantCount: Number.MAX_SAFE_INTEGER, assistantTextLength: Number.MAX_SAFE_INTEGER,
        assistantTail: '', trustedPulseAt: GITL_NET.lastPulseT || 0, composerHadText: false
      };
    },
    sendEvidenceProbe: () => _sendEvidence(),
    clearTxn: () => { GHOST.loop.sendPending = false; GHOST.loop.sendTxn = null; },
    setRunning: () => { GHOST.loop.state = 'RUNNING'; GHOST.loop.phase = 'observing'; GHOST.loop.detail = ''; },
    setWakeRouteCurrent: () => { _wakeRecovery.routeClass = _safeRouteClass(); _wakeRecovery.lastAt = 0; _wakeRecovery.inFlight = false; },
    armUncertain: () => {
      GHOST.loop.sendPending = false;
      GHOST.loop.isSending = false;
      GHOST.loop.sendTxn = { id: 'redteam-uncertain', state: 'uncertain', attemptedAt: Date.now() };
      _wakeRecovery.lastAt = 0;
      _wakeRecovery.inFlight = false;
    },
    setForeignLease: () => {
      GM_setValue(_tabLockKey(), JSON.stringify({ tabId: 'redteam-foreign-tab', ts: Date.now() }));
      _wakeRecovery.lastAt = 0;
      _wakeRecovery.inFlight = false;
    },
    clearForeignLease: () => { GM_setValue(_tabLockKey(), ''); },
    wake: source => recoverAfterWake(source || 'redteam'),
    snapshot: () => ({
      state: GHOST.loop.state,
      phase: GHOST.loop.phase,
      detail: GHOST.loop.detail,
      sendPending: !!GHOST.loop.sendPending,
      sendTxnState: GHOST.loop.sendTxn ? GHOST.loop.sendTxn.state : null,
      routeClass: _safeRouteClass(),
      recordedRouteClass: _wakeRecovery.routeClass
    }),
    platform: () => ({ key: PLAT && PLAT.key, assistant: (PLAT && PLAT.assistant) ? [...PLAT.assistant] : [] })
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

function normalHistoryHtml(turns) {
  const items = [];
  for (let i = 0; i < turns; i += 1) {
    let inner = `Historical assistant answer ${i} with enough deterministic text to be treated as visible answer content.`;
    let style = '';
    if (i === turns - 4) inner = `Older terminal answer ${i} must never override a newer unfinished response. [[GITL::HALT]]`;
    else if (i === turns - 3) inner = `Nested duplicate cluster ${i}: outer visible answer.<div data-message-author-role="assistant">Nested assistant duplicate ${i} must not displace the later visible answer.</div>`;
    else if (i === turns - 2) inner = `REDTEAM_NEWEST_UNFINISHED_${turns}: newest visible unfinished response with no terminal marker.`;
    else if (i === turns - 1) { inner = `HIDDEN_DECOY_${turns}: hidden later response. [[GITL::PROCEED]]`; style = ' style="display:none" aria-hidden="true"'; }
    items.push(`<article><div data-testid="conversation-turn-${i}"><div data-message-author-role="assistant"${style}><div class="markdown">${inner}</div></div></div></article>`);
  }
  return pageHtml(items.join(''));
}

function mixedTailHtml(turns) {
  const items = [];
  for (let i = 0; i < turns; i += 1) {
    let inner = `Mixed-tail historical assistant answer ${i} with deterministic visible content.`;
    if (i === turns - 3) inner = `Older mixed-tail terminal answer ${i}. [[GITL::CHOICE]]`;
    else if (i === turns - 2) inner = `Nested mixed-tail cluster ${i}.<div data-message-author-role="assistant">Nested duplicate ${i} must not win.</div>`;
    else if (i === turns - 1) inner = `MIXED_TAIL_NEWEST_UNFINISHED_${turns}: this node must survive through selector tiers even when selector zero's raw tail is crowded by later unusable nodes.`;
    items.push(`<article><div data-testid="conversation-turn-${i}"><div data-message-author-role="assistant"><div class="markdown">${inner}</div></div></div></article>`);
  }
  for (let i = 0; i < 64; i += 1) {
    items.push(`<div data-message-author-role="assistant" style="display:none" aria-hidden="true"><div class="markdown">FIRST_SELECTOR_ONLY_HIDDEN_${i} [[GITL::PROCEED]]</div></div>`);
  }
  return pageHtml(items.join(''));
}

function pageHtml(history) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main>${history}</main><form id="composer"><textarea id="prompt-textarea" aria-label="Message ChatGPT">redteam composer must remain unchanged</textarea><button data-testid="send-button" type="submit" aria-label="Send">Send</button></form></body></html>`;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function prepare(page, body) {
  await page.addInitScript(GM);
  await page.addInitScript(QUERY_HARNESS);
  await page.addInitScript(RESOURCE_HARNESS);
  await page.addInitScript(`
    window.__gitlLongChatRedTeamEvents = { submit: 0, click: 0, input: 0, keydown: 0 };
    document.addEventListener('submit', () => { window.__gitlLongChatRedTeamEvents.submit += 1; }, true);
    document.addEventListener('click', () => { window.__gitlLongChatRedTeamEvents.click += 1; }, true);
    document.addEventListener('input', () => { window.__gitlLongChatRedTeamEvents.input += 1; }, true);
    document.addEventListener('keydown', () => { window.__gitlLongChatRedTeamEvents.keydown += 1; }, true);
  `);
  await page.addInitScript(SCRIPT);
  await page.route('https://chatgpt.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body }));
  await page.goto('https://chatgpt.com/c/gitl-long-chat-redteam');
  await page.waitForFunction(() => !!window.__GITL_LongChatRedTeam && !!window.__GITL_RedTeamQueries && !!window.__GITL_RedTeamResources && document.readyState === 'complete');
}

async function measureAnswer(page, samples) {
  return page.evaluate(samples => {
    const times = [];
    window.__GITL_RedTeamQueries.reset();
    for (let i = 0; i < samples; i += 1) {
      const t0 = performance.now();
      window.__GITL_LongChatRedTeam.getLastText();
      times.push(performance.now() - t0);
    }
    return {
      times,
      query: window.__GITL_RedTeamQueries.snapshot(),
      events: { ...window.__gitlLongChatRedTeamEvents },
      resources: window.__GITL_RedTeamResources.snapshot()
    };
  }, samples);
}

async function mutationChurn(page) {
  return page.evaluate(() => {
    const turns = [...document.querySelectorAll('div[data-testid^="conversation-turn-"]')];
    for (let pass = 0; pass < 12; pass += 1) {
      for (let i = 900 + (pass % 3); i < Math.min(turns.length - 3, 1700); i += 17) {
        const old = turns[i].querySelector('div[data-message-author-role="assistant"]');
        if (!old) continue;
        const clone = old.cloneNode(true);
        if ((i + pass) % 2 === 0) clone.setAttribute('data-redteam-replaced', String(pass));
        old.replaceWith(clone);
      }
    }
    const targetTurn = turns[turns.length - 2];
    const oldTarget = targetTurn.querySelector('div[data-message-author-role="assistant"]');
    const replacement = oldTarget.cloneNode(true);
    replacement.querySelector('.markdown').textContent = 'REDTEAM_MUTATED_NEWEST_UNFINISHED_2000: newest response after adversarial DOM replacement.';
    oldTarget.replaceWith(replacement);
    return { turns: turns.length, domNodes: document.getElementsByTagName('*').length };
  });
}

function summarizeMeasurement(m, samples) {
  return {
    p50Ms: percentile(m.times, 50),
    p95Ms: percentile(m.times, 95),
    qsaCallsPerSample: m.query.calls / samples,
    qsaMatchesPerSample: m.query.totalMatches / samples,
    qsaMsPerSample: m.query.totalMs / samples,
    bySelector: m.query.bySelector,
    events: m.events,
    resources: m.resources
  };
}

test.describe('R5 A3 adversarial long-chat Red Team', () => {
  test('preserves mixed selector tails and the A2 oracle after heavy DOM replacement', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'A3 exact adversarial fixture is desktop Chromium only; A4 owns mobile/cross-browser evidence.');

    await prepare(page, mixedTailHtml(1200));
    const platform = await page.evaluate(() => window.__GITL_LongChatRedTeam.platform());
    expect(platform.key).toBe('chatgpt');
    expect(platform.assistant).toHaveLength(3);
    const mixed = await page.evaluate(() => window.__GITL_LongChatRedTeam.getLastText());
    expect(mixed).toContain('MIXED_TAIL_NEWEST_UNFINISHED_1200');
    expect(mixed).not.toContain('[[GITL::CHOICE]]');
    expect(mixed).not.toContain('[[GITL::PROCEED]]');
    expect(await page.evaluate(() => ({ ...window.__gitlLongChatRedTeamEvents }))).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });

    await page.unroute('https://chatgpt.com/**');
    await page.route('https://chatgpt.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: normalHistoryHtml(2000) }));
    await page.goto('https://chatgpt.com/c/gitl-long-chat-redteam-2000');
    await page.waitForFunction(() => !!window.__GITL_LongChatRedTeam && document.readyState === 'complete');

    const samples = 25;
    const beforeResources = await page.evaluate(() => window.__GITL_RedTeamResources.snapshot());
    const before = await measureAnswer(page, samples);
    const churn = await mutationChurn(page);
    const selectedAfterMutation = await page.evaluate(() => window.__GITL_LongChatRedTeam.getLastText());
    expect(selectedAfterMutation).toContain('REDTEAM_MUTATED_NEWEST_UNFINISHED_2000');
    expect(selectedAfterMutation).not.toContain('[[GITL::HALT]]');
    expect(selectedAfterMutation).not.toContain('[[GITL::PROCEED]]');
    const after = await measureAnswer(page, samples);
    const afterResources = await page.evaluate(() => window.__GITL_RedTeamResources.snapshot());

    const beforeSummary = summarizeMeasurement(before, samples);
    const afterSummary = summarizeMeasurement(after, samples);
    const a2Oracle = { max2000MatchesPerSample: 2401.2, max2000P95MsExclusive: 2.30 };
    expect(afterSummary.qsaMatchesPerSample).toBeLessThanOrEqual(a2Oracle.max2000MatchesPerSample);
    expect(afterSummary.p95Ms).toBeLessThan(a2Oracle.max2000P95MsExclusive);
    expect(afterSummary.events).toEqual({ submit: 0, click: 0, input: 0, keydown: 0 });
    expect(afterResources.activeIntervals).toBe(beforeResources.activeIntervals);
    expect(afterResources.intervalCreates).toBe(beforeResources.intervalCreates);
    expect(afterResources.observerCreates).toBe(beforeResources.observerCreates);

    const report = { fixtureTurns: 2000, mixedTailTurns: 1200, samplesPerOperation: samples, churn, a2Oracle, before: beforeSummary, after: afterSummary };
    console.log('GITL_LONG_CHAT_REDTEAM=' + JSON.stringify(report));
    await testInfo.attach('long-chat-redteam.json', { body: Buffer.from(JSON.stringify(report, null, 2)), contentType: 'application/json' });
  });

  test('fails closed across route change, uncertain Send, and a foreign conversation lease', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'A3 exact fail-closed fixture is desktop Chromium only; A4 owns mobile/cross-browser evidence.');
    await prepare(page, normalHistoryHtml(500));

    const zero = { submit: 0, click: 0, input: 0, keydown: 0 };

    await page.evaluate(() => {
      window.__GITL_LongChatRedTeam.clearTxn();
      window.__GITL_LongChatRedTeam.clearForeignLease();
      window.__GITL_LongChatRedTeam.setRunning();
      window.__GITL_LongChatRedTeam.setWakeRouteCurrent();
      history.pushState({}, '', '/c/gitl-long-chat-redteam-route-b');
    });
    const routeResult = await page.evaluate(() => ({ resumed: window.__GITL_LongChatRedTeam.wake('redteam-route'), snapshot: window.__GITL_LongChatRedTeam.snapshot(), events: { ...window.__gitlLongChatRedTeamEvents } }));
    expect(routeResult.resumed).toBe(false);
    expect(routeResult.snapshot.state).toBe('PAUSED');
    expect(routeResult.snapshot.detail).toContain('route changed');
    expect(routeResult.events).toEqual(zero);

    await page.evaluate(() => {
      window.__GITL_LongChatRedTeam.clearTxn();
      window.__GITL_LongChatRedTeam.clearForeignLease();
      window.__GITL_LongChatRedTeam.setRunning();
      window.__GITL_LongChatRedTeam.setWakeRouteCurrent();
      window.__GITL_LongChatRedTeam.armUncertain();
    });
    const uncertainResult = await page.evaluate(() => ({ resumed: window.__GITL_LongChatRedTeam.wake('redteam-uncertain'), snapshot: window.__GITL_LongChatRedTeam.snapshot(), events: { ...window.__gitlLongChatRedTeamEvents } }));
    expect(uncertainResult.resumed).toBe(false);
    expect(uncertainResult.snapshot.state).toBe('PAUSED');
    expect(uncertainResult.snapshot.sendTxnState).toBe('uncertain');
    expect(uncertainResult.events).toEqual(zero);

    await page.evaluate(() => {
      window.__GITL_LongChatRedTeam.clearTxn();
      window.__GITL_LongChatRedTeam.clearForeignLease();
      window.__GITL_LongChatRedTeam.setRunning();
      window.__GITL_LongChatRedTeam.setWakeRouteCurrent();
      window.__GITL_LongChatRedTeam.setForeignLease();
    });
    const leaseResult = await page.evaluate(() => ({ resumed: window.__GITL_LongChatRedTeam.wake('redteam-foreign-lease'), snapshot: window.__GITL_LongChatRedTeam.snapshot(), events: { ...window.__gitlLongChatRedTeamEvents } }));
    expect(leaseResult.resumed).toBe(false);
    expect(leaseResult.snapshot.state).toBe('PAUSED');
    expect(leaseResult.snapshot.detail).toContain('another tab');
    expect(leaseResult.events).toEqual(zero);

    await page.evaluate(() => window.__GITL_LongChatRedTeam.clearForeignLease());
  });
});
