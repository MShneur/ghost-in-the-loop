/**
 * EXPLAIN MODE TESTS (d9)
 * Registry integrity + lookup behavior for the tap-ⓘ-then-tap-anything help.
 */

describe('EXPLAIN — registry integrity', () => {
  test('every entry has a selector and non-empty name/desc', () => {
    for (const e of EXPLAIN) {
      expect(typeof e.sel).toBe('string');
      expect(e.sel.length).toBeGreaterThan(1);
      const name = typeof e.name === 'function' ? 'fn' : e.name;
      const desc = typeof e.desc === 'function' ? 'fn' : e.desc;
      expect(String(name).length).toBeGreaterThan(0);
      expect(String(desc).length).toBeGreaterThan(0);
    }
  });

  test('covers the core transport and both export lifelines', () => {
    const sels = EXPLAIN.map(e => e.sel);
    for (const must of ['#g-play', '#g-pause', '#g-reground', '#g-handoff', '#g-rescue', '.g-pst'])
      expect(sels).toContain(must);
  });
});

describe('EXPLAIN — lookup', () => {
  test('resolves a live control from the rendered panel', () => {
    const play = document.getElementById('g-play');
    expect(play).not.toBeNull();
    const info = _explainLookup(play);
    expect(info.name).toContain('Start');
    expect(info.desc.length).toBeGreaterThan(20);
  });

  test('posture buttons resolve dynamically from POSTURES', () => {
    const b = document.createElement('button');
    b.className = 'g-pst';
    b.dataset.pst = 'evolving';
    document.body.appendChild(b);
    const info = _explainLookup(b);
    expect(info.name).toContain('Adaptive');
    expect(info.desc).toBe(POSTURES.evolving.desc);
    b.remove();
  });

  test('unknown elements return null (caller supplies the fallback text)', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(_explainLookup(div)).toBeNull();
    div.remove();
  });
});
