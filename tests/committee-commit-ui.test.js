const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.3 P0 committee commit source contract', () => {
  test('old toggle is gone and the primary action is large and semantic', () => {
    expect(src).not.toContain('id="g-committee-p"');
    expect(src).toContain('id="g-committee-commit"');
    expect(src).toContain('P · COMMIT RECOMMENDATION');
    expect(src).toContain('min-height:48px');
  });

  test('P action keeps the existing safe CHOICE boundaries', () => {
    expect(src).toContain("L.state === 'CHOICE'");
    expect(src).toContain('&& !L.isSending');
    expect(src).toContain('&& !L.sendPending');
    expect(src).toContain("L.sendTxn?.state !== 'uncertain'");
    expect(src).toContain("const staged = await _awaitStagedComposer(input, 'P')");
    expect(src).toContain('startLoop();');
  });

  test('committee protocol is automatic for a real Advanced committee', () => {
    expect(src).toContain('if (_committeeCommitPrepared()) out += COMMITTEE_P_SHORTCUT;');
    expect(src).toContain('const pShortcut = _committeeCommitPrepared() && /^p$/i.test(typed)');
  });

  test('ordinary posture selection no longer remounts the whole panel', () => {
    const start = src.indexOf("$$('.g-pst').forEach");
    const end = src.indexOf("$('#g-posture-help')", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toContain('render();');
  });

  test('render preserves local scroll and does not reapply static anchors every time', () => {
    expect(src).toContain("const _preserveBodyScroll = panel.querySelector('.g-body')?.scrollTop || 0;");
    expect(src).toContain("const _dynamicPosition = GHOST.ui.position === 'rail' || GHOST.ui.position === 'orb';");
    expect(src).toContain('if (_lastAppliedPosition !== GHOST.ui.position || _dynamicPosition)');
  });
});
