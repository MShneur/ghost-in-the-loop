const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.4 committee commit source contract', () => {
  test('large semantic action replaces the old toggle', () => {
    expect(src).not.toContain('id="g-committee-p"');
    expect(src).toContain('id="g-committee-commit"');
    expect(src).toContain('P · COMMIT RECOMMENDATION');
    expect(src).toContain('min-height:48px');
  });
  test('P action keeps the safe CHOICE boundaries', () => {
    expect(src).toContain("L.state === 'CHOICE'");
    expect(src).toContain('&& !L.isSending');
    expect(src).toContain('&& !L.sendPending');
    expect(src).toContain("L.sendTxn?.state !== 'uncertain'");
    expect(src).toContain("const staged = await _awaitStagedComposer(input, 'P')");
  });
  test('ordinary posture selection does not remount the whole panel', () => {
    const start = src.indexOf("$$('.g-pst').forEach");
    const end = src.indexOf("$('#g-posture-help')", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toContain('render();');
  });
});
