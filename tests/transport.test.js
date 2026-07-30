/**
 * TRANSPORT UI (v8.4.1) — one Play/Pause toggle + Stop.
 *
 * Field feedback: the Run tab showed Play + Pause + Stop as three buttons, which
 * read as "why do we have play, pause, resume AND stop?". The primary button was
 * already wired to the state-aware primaryAction toggle, so the separate Pause
 * button was redundant. Consolidated to a single state-driven button:
 *   IDLE/COMPLETE → ▶ Start · RUNNING → ⏸ Pause · PAUSED → ▶ Resume · LIMIT → ▶ Continue
 * plus a separate Stop. The label reads live state, so it always reflects whether
 * the loop is running.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('Transport UI — one Play/Pause toggle + Stop', () => {
  const runTab = src.slice(src.indexOf('function renderRunTab()'),
                          src.indexOf('function renderRunTab()') + 2600);

  test('the separate #g-pause button and its binding are gone', () => {
    expect(runTab).not.toContain('id="g-pause"');
    expect(src).not.toContain("$('#g-pause')?.addEventListener");
  });

  test('the single #g-play button is state-driven', () => {
    expect(runTab).toContain("L.state==='RUNNING'?'⏸ Pause'");
    expect(runTab).toContain("L.state==='PAUSED'?'▶ Resume'");
    expect(runTab).toContain("L.state==='LIMIT'?'▶ Continue'");
  });

  test('#g-play is wired to the state-aware primaryAction toggle; Stop remains', () => {
    expect(src).toContain("$('#g-play')?.addEventListener('click', primaryAction);");
    expect(src).toContain("$('#g-stop')?.addEventListener('click', stopLoop);");
  });

  test('primaryAction toggles RUNNING->pause, else start/resume', () => {
    const pa = src.slice(src.indexOf('function primaryAction()'),
                         src.indexOf('function primaryAction()') + 260);
    expect(pa).toContain("if (s === 'RUNNING') return pauseLoop();");
    expect(pa).toContain('return startLoop();');
  });
});
