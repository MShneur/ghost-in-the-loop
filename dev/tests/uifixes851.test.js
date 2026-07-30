/**
 * UI FIXES (v8.5.1) — field reports from Perplexity mobile.
 *
 * 1. Orb collapsed spilled the ghost + platform badge + buttons OUTSIDE the
 *    circle: the button span carries an inline display:flex, so the hide rule
 *    needs !important (a plain display:none loses to the inline style).
 * 2. The position picker overflowed at 9 options — the new rail (⊟) button was
 *    cut off past the panel edge and unreachable. The row must wrap.
 * 3. The rail jumped around while scrolling: it repositioned on every scroll
 *    event. Chat composers are fixed/sticky, so the rail must follow viewport
 *    CHANGES only (resize / keyboard), never page scroll — and must only dock to
 *    a composer that is actually in the lower part of the screen.
 * 4. Heavy GPU effects (backdrop-filter blur, animated gradient borders/sheen)
 *    lagged the whole page on mobile; disabled on coarse-pointer devices.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('Orb spill fix — the circle shows only the ghost', () => {
  test('the leaked button span is hidden with !important (beats the inline display:flex)', () => {
    expect(src).toContain('#gitl.pos-orb.collapsed .g-hdr > span:last-child{display:none!important}');
  });
  test('the individual leaked pieces are hidden too (belt-and-suspenders)', () => {
    expect(src).toContain('#gitl.pos-orb.collapsed .g-plat,#gitl.pos-orb.collapsed .g-minbtn,#gitl.pos-orb.collapsed .g-dot{display:none!important}');
  });
  test('the orb is width-capped so content cannot widen it', () => {
    expect(src).toContain('max-width:52px!important');
  });
});

describe('Position picker fix — all 9 options are reachable', () => {
  test('the position row wraps instead of clipping the last button', () => {
    expect(src).toContain('.g-pos-row{display:flex;flex-wrap:wrap;gap:3px}');
  });
});

describe('Rail jump fix — no scroll repositioning, lower-screen dock only', () => {
  test('the tracker no longer listens to page scroll', () => {
    const start = src.slice(src.indexOf('function startRailTracker()'), src.indexOf('function stopRailTracker()'));
    expect(start).not.toContain("addEventListener('scroll'");
    expect(start).toContain("addEventListener('resize'");
  });
  test('the rail only docks to a composer in the lower part of the screen', () => {
    expect(src).toContain('const dockable = rect && rect.width > 0 && rect.top > vh * 0.45;');
    expect(src).toContain('_railBox(dockable ? rect : null');
  });
});

describe('Mobile performance — heavy effects disabled on touch devices', () => {
  test('backdrop-filter blur is turned off on coarse pointers (the main lag source)', () => {
    expect(src).toContain('@media (pointer:coarse){#gitl{backdrop-filter:none!important');
  });
  test('the animated gradient borders/sheen and ghost animation are stopped on touch', () => {
    expect(src).toContain('#gitl::before,#gitl::after{animation:none!important}');
    expect(src).toContain('#gitl .g-ghost,#gitl .g-fill,#gitl .g-trk::after{animation:none!important}');
  });
});
