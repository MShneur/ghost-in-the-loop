/**
 * SELECTOR MEMORY TESTS (v8.1)
 * Self-healing learned locators (Healenium-style fallback tier).
 * Contract:
 *  1. derive() prefers stable attributes (id > data-testid > aria-label …)
 *     and only returns a selector that UNIQUELY matches the element.
 *  2. learn()/lookup() persist per-host in GM storage and survive reload.
 *  3. forget() removes a bad entry; storage prunes beyond MAX_HOSTS.
 *  4. Actuator selectors are never learned; only read-only locators persist.
 */
/* Symbols arrive on global via tests/setup.js */
const HOST = 'chatgpt.com';  // the VM context's location.hostname (setup.js)

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const node = div.firstElementChild;
  document.body.appendChild(node);
  return node;
}

afterEach(() => { document.body.innerHTML = ''; SelectorMemory._data = null; });

describe('SelectorMemory.derive', () => {
  test('prefers #id when unique', () => {
    const n = el('<textarea id="chat-input"></textarea>');
    expect(SelectorMemory.derive(n)).toBe('#chat-input');
  });

  test('falls back to data-testid', () => {
    const n = el('<div contenteditable="true" data-testid="composer"></div>');
    expect(SelectorMemory.derive(n)).toBe('div[data-testid="composer"]');
  });

  test('falls back to aria-label', () => {
    const n = el('<textarea aria-label="Ask anything"></textarea>');
    expect(SelectorMemory.derive(n)).toBe('textarea[aria-label="Ask anything"]');
  });

  test('returns null when nothing is stable', () => {
    const n = el('<textarea class="x9f3k"></textarea>');
    expect(SelectorMemory.derive(n)).toBe(null);
  });

  test('returns null when the candidate is not unique', () => {
    el('<textarea aria-label="Ask"></textarea>');
    const n = el('<textarea aria-label="Ask"></textarea>');
    expect(SelectorMemory.derive(n)).toBe(null);
  });
});

describe('SelectorMemory.learn / lookup / forget', () => {
  test('learn persists per-host and survives a fresh in-memory load', () => {
    const n = el('<textarea id="composer-a"></textarea>');
    expect(SelectorMemory.learn('input', n)).toBe('#composer-a');
    SelectorMemory._data = null;             // simulate reload
    const stored = SelectorMemory._load();
    expect(stored[HOST].input.sel).toBe('#composer-a');
  });

  test('forget removes the entry', () => {
    const n = el('<textarea id="composer-b"></textarea>');
    SelectorMemory.learn('input', n);
    SelectorMemory.forget('input');
    expect(SelectorMemory._load()[HOST]?.input).toBeUndefined();
  });

  test('learn returns null for unlearnable elements (no throw)', () => {
    const n = el('<textarea class="q1w2e3"></textarea>');
    expect(SelectorMemory.learn('input', n)).toBe(null);
  });

  test('host pruning keeps storage bounded', () => {
    const d = SelectorMemory._load();
    for (let i = 0; i < SelectorMemory.MAX_HOSTS + 3; i++) {
      d[`host${i}.example`] = { input: { sel: '#x', at: i } };
    }
    SelectorMemory._persist();
    const n = el('<textarea id="composer-c"></textarea>');
    SelectorMemory.learn('input', n);
    expect(Object.keys(SelectorMemory._load()).length).toBeLessThanOrEqual(SelectorMemory.MAX_HOSTS);
    // the just-touched host must survive pruning
    expect(SelectorMemory._load()[HOST]).toBeDefined();
  });
});

describe('Integration — Adapter and reDetect wiring', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('Adapter.getInput consults SelectorMemory before heuristics', () => {
    expect(src).toContain("_q('in', PLAT.input) || SelectorMemory.lookup('input')");
  });
  test('send actuators are excluded from selector memory', () => {
    expect(src).toContain("if (kind === 'send')");
    expect(src).toContain("this.forget('send');");
    expect(src).toContain('return _reviewedSend();');
  });
  test('reDetect clears heuristic caches too', () => {
    expect(src).toContain('function _clearElementCaches()');
    expect(src).toMatch(/_heurCache\.input = \{ el: null, ts: 0 \};/);
  });
  test('reDetect keeps watching after a miss (observer + interval)', () => {
    expect(src).toContain('_redetectWatch.obs = new MutationObserver');
    expect(src).toContain("_redetectWatch.timer = setInterval(_redetectCheck, 800)");
  });
  test('visibility self-heal is installed', () => {
    expect(src).toContain("document.addEventListener('visibilitychange'");
  });
});

describe('Sigil-free completion fallback (soft proceed)', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('soft proceed exists and is bounded to 2 nudges', () => {
    expect(src).toContain("Timeline.record('soft_proceed'");
    expect(src).toContain('(L.noSigilStreak || 0) < 2');
  });
  test('streak resets on real signals', () => {
    const resets = src.match(/L\.noSigilStreak = 0; L\._nudgedTail = '';/g) || [];
    expect(resets.length).toBeGreaterThanOrEqual(2);
  });
  test('nudge message re-states the sigil protocol', () => {
    expect(src).toContain('[[GITL::PROCEED]] — more work remains');
  });
  test('Timeline.add typo is gone (would crash engineTick)', () => {
    expect(src).not.toContain('Timeline.add(');
  });
});
