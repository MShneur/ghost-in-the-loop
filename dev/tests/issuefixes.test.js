/**
 * FIELD REGRESSIONS — long-thinking Perplexity and route assignment.
 * v8.5.2 replaces the old network-only no-output rule with a multi-witness
 * completion observer, so these tests verify the behavior contract rather
 * than the former source formatting.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = src.indexOf(`function ${nextName}`, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('Issue #1 — Perplexity completion observation', () => {
  const tick = body('engineTick', 'startLoop');

  test('visible DOM output is read before network generation can veto it', () => {
    const read = tick.indexOf('const text = Adapter.getLastText();');
    const networkGate = tick.indexOf('Adapter.isGenerating()&&!terminalReady');
    expect(read).toBeGreaterThan(-1);
    expect(networkGate).toBeGreaterThan(read);
  });

  test('active generation resets stale ticks', () => {
    expect(tick).toContain('L.staleTicks=0');
  });

  test('idle no-output still uses the per-platform stale budget', () => {
    expect(tick).toContain('(PLAT&&PLAT.staleTicks)||5');
  });

  test('terminal override requires reply advancement, stability, and no visible Stop', () => {
    const gate = body('_terminalReplyReady', '_sleepCountdown');
    expect(gate).toContain('_replyAdvancedBeyondBaseline(text)');
    expect(gate).toContain('obs.stableTicks>=1');
    expect(gate).toContain('!stopVisible');
  });
});

describe('Issue #2 — Grok conversation-id URL assignment', () => {
  test('same-host post-send route assignment is recorded instead of paused', () => {
    expect(src).toContain('new URL(prevHref).hostname === location.hostname');
    expect(src).toContain('(Date.now() - (GHOST.loop.lastDispatchConfirmedAt || 0) < 15000)');
    expect(src).toContain('&& !GHOST.loop.conversationBound');
    expect(src).toContain("Timeline.record('route_id_assigned'");
  });

  test('genuine route changes still pause and clear cached elements', () => {
    expect(src).toContain("enginePause('Route changed — paused; reset session before automating this conversation')");
    expect(src).toContain('GHOST.loop.conversationReviewRequired = true;');
    const m = src.match(/window\.addEventListener\('gitl:route', \(\) => \{[\s\S]*?\n\}\);/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('_clearElementCaches();');
  });
});
