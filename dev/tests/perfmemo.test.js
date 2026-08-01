/**
 * PERF MEMO + OBSERVER COST (v8.7.0 — Track G)
 *
 * stopVisible() ran 2–4 full-DOM scans per 2.5s tick (tick gate, isGenerating,
 * send evidence). A stop control persists for whole seconds while generating,
 * so a 400ms memo is invisible to the completion logic — except during a live
 * send transaction, which always gets a fresh scan.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('stopVisible memo', () => {
  const origQSA = document.querySelectorAll;
  let scans = 0;
  beforeEach(() => {
    document.body.innerHTML = '';
    scans = 0;
    document.querySelectorAll = function (...a) { scans++; return origQSA.apply(this, a); };
    GHOST.loop.sendPending = false;
    GHOST.loop.isSending = false;
  });
  afterEach(() => { document.querySelectorAll = origQSA; });
  afterAll(() => { document.body.innerHTML = ''; });

  test('a second call inside the memo window does not rescan the DOM', () => {
    Adapter.stopVisible();
    const afterFirst = scans;
    expect(afterFirst).toBeGreaterThan(0);
    Adapter.stopVisible();
    Adapter.stopVisible();
    expect(scans).toBe(afterFirst);
  });

  test('a live send transaction always gets a fresh scan', () => {
    Adapter.stopVisible();
    const afterFirst = scans;
    GHOST.loop.sendPending = true;
    Adapter.stopVisible();
    expect(scans).toBeGreaterThan(afterFirst);
  });

  test('cache clears reset the memo (no stale stop evidence across routes)', () => {
    const clear = body('_clearElementCaches', undefined);
    expect(clear).toContain('_stopMemo.at = 0');
  });
});

describe('observer/reflow cost guards', () => {
  test('no per-scroll listeners exist anywhere (rail-jump regression fence)', () => {
    expect(src).not.toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(src).not.toMatch(/onscroll\s*=/);
  });

  test('selector resolution is cached with connection + route invalidation', () => {
    // The _q cache keeps resolved elements until they detach or the route
    // changes; heuristic tiers are time-boxed. Locked so nobody "optimizes"
    // by deleting the cache or by scanning on every call.
    expect(src).toContain('const _cache = new Map();');
    expect(src).toContain('c?.isConnected');
    expect(src).toContain('Date.now() - c.ts < 4000');
  });

  test('the deep shadow-DOM walk is throttled per key', () => {
    expect(src).toContain('(now - (_deepLast.get(key) || 0)) > 5000');
  });
});
