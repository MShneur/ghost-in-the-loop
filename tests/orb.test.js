/**
 * ORB LAUNCHER GEOMETRY (v8.3.0)
 *
 * The orb is a tucked circular position mode. Its drag math is factored into
 * two pure helpers so the snap/clamp behaviour is verifiable without a DOM.
 *
 *  _orbEdgeFromX(x, vw) → 'left' | 'right'   (snap to nearer edge)
 *  _orbClampY(ratio)    → 0.04 .. 0.92        (never flush to a screen edge)
 */
/* Symbols arrive on global via tests/setup.js */

describe('_orbEdgeFromX — snaps to the nearer horizontal edge', () => {
  test('left half of the viewport → left', () => {
    expect(_orbEdgeFromX(10, 1000)).toBe('left');
    expect(_orbEdgeFromX(499, 1000)).toBe('left');
  });
  test('right half of the viewport → right', () => {
    expect(_orbEdgeFromX(500, 1000)).toBe('right');
    expect(_orbEdgeFromX(990, 1000)).toBe('right');
  });
  test('degenerate viewport width never throws or divides by zero', () => {
    expect(['left', 'right']).toContain(_orbEdgeFromX(0, 0));
    expect(['left', 'right']).toContain(_orbEdgeFromX(-5, -100));
  });
});

describe('_orbClampY — keeps the orb off the extreme edges', () => {
  test('clamps below the floor', () => {
    expect(_orbClampY(-1)).toBe(0.04);
    expect(_orbClampY(0)).toBe(0.04);
  });
  test('clamps above the ceiling', () => {
    expect(_orbClampY(2)).toBe(0.92);
    expect(_orbClampY(1)).toBe(0.92);
  });
  test('passes mid-range values through unchanged', () => {
    expect(_orbClampY(0.34)).toBeCloseTo(0.34, 5);
    expect(_orbClampY(0.5)).toBeCloseTo(0.5, 5);
  });
  test('non-finite input falls back to the default, never NaN', () => {
    expect(_orbClampY(NaN)).toBe(0.34);
    expect(_orbClampY(undefined)).toBe(0.34);
    expect(_orbClampY(Infinity)).toBe(0.34); // Number.isFinite(Infinity) === false → default
  });
});

describe('orb wiring is present in the shipped source', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('orb is a selectable position in the picker', () => {
    expect(src).toContain("'bottom-bar','dock','dock-left','orb'");
  });
  test('applyPosition routes orb through _applyOrb', () => {
    expect(src).toContain("else if(pos==='orb'){_applyOrb()}");
  });
  test('orb state persists edge + vertical ratio', () => {
    expect(src).toContain("orbEdge: GM_getValue('orbEdge','right')");
    expect(src).toContain("orbY: (v => {");
    // Persistence is via direct _save/GM_getValue (no bulk key registry in
    // this lineage), so the drag handler must write both keys back.
    expect(src).toContain("_save('orbY', GHOST.ui.orbY); _save('orbEdge', GHOST.ui.orbEdge);");
  });
  test('the collapsed orb spins its ring only while RUNNING', () => {
    expect(src).toContain('#gitl.pos-orb.collapsed[data-run="1"] .g-orb-ring{border-top-color:var(--g-ok)');
  });
  test('reduced-motion disables the spin', () => {
    expect(src).toContain('@media (prefers-reduced-motion:reduce){#gitl.pos-orb.collapsed[data-run="1"] .g-orb-ring{animation:none');
  });
});
