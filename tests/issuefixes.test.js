/**
 * ISSUE FIXES (v8.1.2) — regression tests for two field-reported bugs.
 *
 * #1 [auto] probe_fail on Perplexity: sent fine, Deep Research thinks
 *    silently for a while with zero assistant DOM nodes yet, loop paused
 *    with "No output detected" ~12s later even though the model was
 *    demonstrably still working (net traffic active). The later no-signal
 *    branch already got an isGenerating() witness in d7; the earlier
 *    "no text at all" branch never did.
 *
 * #2 [auto] manual on Grok: send_ok, then ONE SECOND later "Route changed
 *    — paused" — the platform assigning a "/c/<uuid>" URL to a brand-new
 *    conversation was mistaken for real navigation.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('Issue #1 — Perplexity: no-output branch respects isGenerating()', () => {
  const block = src.slice(src.indexOf('const text = Adapter.getLastText();'), src.indexOf('const text = Adapter.getLastText();') + 900);

  test('the !text branch checks isGenerating() before counting a stale tick', () => {
    expect(block).toContain('if (!text) {');
    expect(block).toContain('Adapter.isGenerating()');
  });

  test('the !text branch uses the per-platform stale budget, not a bare 5', () => {
    expect(block).toContain('(PLAT && PLAT.staleTicks) || 5');
  });

  test('staleTicks resets to 0 while generating instead of accumulating', () => {
    expect(block).toMatch(/isGenerating\(\)\) \{ L\.staleTicks = 0;/);
  });
});

describe('Issue #2 — Grok: conversation-id URL assignment does not pause a running loop', () => {
  test('route watcher checks same-host before pausing', () => {
    expect(src).toContain('new URL(prevHref).hostname === location.hostname');
  });

  test('route watcher checks for a recent send before pausing', () => {
    expect(src).toContain('GHOST.loop.sendPending || (Date.now() - (GHOST.loop.lastActivity || 0) < 15000)');
  });

  test('a same-host post-send route change is recorded, not treated as a pause trigger', () => {
    expect(src).toContain("Timeline.record('route_id_assigned'");
  });

  test('a genuine cross-host route change still pauses a running loop', () => {
    expect(src).toContain("enginePause('Route changed — paused')");
  });

  test('element caches are still cleared on every route change regardless of outcome', () => {
    const m = src.match(/window\.addEventListener\('gitl:route', \(\) => \{[\s\S]*?\n\}\);/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('_clearElementCaches();');
  });
});
