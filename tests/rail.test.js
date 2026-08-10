/**
 * COMPOSER RAIL GEOMETRY (v8.5.0)
 *
 * The rail is a new position mode: a slim bar that docks just above the site's
 * chat composer. Its placement math is factored into the pure `_railBox` so it
 * can be verified without a DOM.
 *
 *   _railBox(composerRect, vw, vh, opts) → { docked, left, top, width } | { docked:false, ... }
 *
 * Contract: hug the composer's TOP edge (never cover the input), clamp on-screen,
 * flip below only when there's no room above, and fall back cleanly when there is
 * no composer.
 */
/* Symbols arrive on global via tests/setup.js */

const VW = 1000, VH = 800;

describe('_railBox — docks above the composer without covering it', () => {
  test('sits above a mid-screen composer', () => {
    const rect = { left: 200, top: 600, width: 500, height: 44, bottom: 644, right: 700 };
    const box = _railBox(rect, VW, VH, { gap: 8, h: 40 });
    expect(box.docked).toBe(true);
    // bottom edge of the rail (top + h) must be at/above the composer top.
    expect(box.top + 40).toBeLessThanOrEqual(rect.top);
    expect(box.left).toBeGreaterThanOrEqual(6);
    expect(box.width).toBeLessThanOrEqual(rect.width);
  });

  test('flips BELOW when the composer is at the very top (no room above)', () => {
    const rect = { left: 100, top: 4, width: 400, height: 44, bottom: 48, right: 500 };
    const box = _railBox(rect, VW, VH, { gap: 8, h: 40 });
    expect(box.docked).toBe(true);
    expect(box.top).toBeGreaterThanOrEqual(rect.bottom); // placed below, not off-screen
  });

  test('clamps horizontally so it never runs off the right edge', () => {
    const rect = { left: 900, top: 600, width: 400, height: 44, bottom: 644, right: 1300 };
    const box = _railBox(rect, VW, VH, { gap: 8, h: 40 });
    expect(box.left + box.width).toBeLessThanOrEqual(VW - 6 + 0.5);
  });

  test('never wider than the viewport for an oversized composer', () => {
    const rect = { left: 0, top: 600, width: 5000, height: 44, bottom: 644, right: 5000 };
    const box = _railBox(rect, VW, VH, { gap: 8, h: 40 });
    expect(box.width).toBeLessThanOrEqual(VW - 12);
  });

  test('no composer → a non-docked fallback (bottom strip), never a throw', () => {
    expect(_railBox(null, VW, VH, {}).docked).toBe(false);
    expect(_railBox({ width: 0, height: 0, top: 0, left: 0 }, VW, VH, {}).docked).toBe(false);
  });
});

describe('rail wiring is present in the shipped source', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('rail is a selectable position', () => {
    expect(src).toContain("'dock-left','orb','rail'");
  });
  test('applyPosition routes rail through _applyRail and gives native ownership priority', () => {
    expect(src).toContain("else if(pos==='rail'){_applyRail()}");
    expect(src).toContain("const nativeOwnsRail = typeof NativeSiteMount !== 'undefined' && NativeSiteMount.ownsRail();");
    expect(src).toContain("if (pos==='rail' && !nativeOwnsRail) startRailTracker(); else stopRailTracker();");
  });
  test('the rail uses the composer position Ghost already finds (no site injection)', () => {
    expect(src).toContain('Adapter.peekInput');
    expect(src).toContain('#gitl.pos-rail.collapsed');
  });
  test('the tracker is rAF-coalesced and only active in rail mode (no idle loop)', () => {
    expect(src).toContain('function startRailTracker()');
    expect(src).toContain('_railReposition.pending');
    expect(src).toContain("GHOST.ui.position === 'rail'");
  });
});
