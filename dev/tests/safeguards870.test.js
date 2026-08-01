/**
 * v8.7.0 safeguards — staging gate, ambiguity guard, kill-switch, dry-run.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('v8.7.0 safeguards', () => {
  const send = body('engineSend', '_confirmSend');

  test('pre-dispatch evidence gate verifies composer holds the prompt', () => {
    expect(send).toContain('_composerHoldsPrompt(input, text)');
    expect(send.indexOf('_composerHoldsPrompt')).toBeLessThan(send.indexOf('_selectDispatchStrategy'));
    expect(send).toContain('COMPOSER-002');
  });

  test('ambiguity guards pause before strategy selection', () => {
    expect(send).toContain('_sendSelectionAmbiguous()');
    expect(send).toContain('_composerAmbiguous()');
    expect(send).toContain('SEND-003');
    expect(send.indexOf('_sendSelectionAmbiguous')).toBeLessThan(send.indexOf('_selectDispatchStrategy'));
  });

  test('kill-switch and per-site disable are checked in assertInteractionSafe', () => {
    const gate = body('assertInteractionSafe', '/* Cleanup');
    expect(gate).toContain('_isSiteEnabled()');
    expect(gate).toContain('site-disabled');
    expect(src).toContain("GM_getValue('gitlKillSwitch'");
    expect(src).toContain("GM_getValue('gitlSiteDisabled'");
  });

  test('dry-run records intent without opening the send journal', () => {
    expect(send).toContain('GHOST.ui.dryRun');
    expect(send).toContain("Timeline.record('send_dry_run'");
    const dryAt = send.indexOf('GHOST.ui.dryRun');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    expect(dryAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(dryAt);
  });

  test('composer nudge fires before the staging check', () => {
    expect(send).toContain('_nudgeComposerActivation(input)');
    expect(send.indexOf('_nudgeComposerActivation')).toBeLessThan(send.indexOf('_composerHoldsPrompt'));
  });
});
