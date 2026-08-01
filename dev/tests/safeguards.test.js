/**
 * SAFEGUARDS (v8.7.0 Track D)
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('kill-switch and host allow-list', () => {
  test('assertInteractionSafe fails closed on kill-switch / host-disabled', () => {
    expect(src).toContain('function killSwitchOn()');
    expect(src).toContain('function hostAutomationAllowed()');
    expect(src).toContain("reason: 'kill-switch'");
    expect(src).toContain("reason: 'host-disabled'");
    expect(src).toContain('SAFEGUARD-001');
  });

  test('dry-run stages but never opens a send journal', () => {
    expect(src).toContain('function dryRunOn()');
    const sendStart = src.indexOf('async function engineSend');
    const send = src.slice(sendStart, src.indexOf('function _confirmSend', sendStart));
    const dryAt = send.indexOf('if (dryRunOn())');
    const beginAt = send.indexOf('const completion = _beginSendAttempt');
    expect(dryAt).toBeGreaterThan(-1);
    expect(dryAt).toBeLessThan(beginAt);
    expect(send).toContain('send_dry_run');
    expect(send).toContain('nothing dispatched');
  });

  test('composer ambiguity pauses instead of guessing', () => {
    expect(src).toContain('function _visibleComposerPeers');
    expect(src).toContain('COMPOSER-003');
    expect(src).toContain('Multiple chat composers visible');
  });

  test('navigation abort marks uncertain and never resends', () => {
    expect(src).toContain('send_nav_abort');
    expect(src).toContain("addEventListener('pagehide'");
    expect(src).toContain("addEventListener('popstate'");
  });
});

describe('reconcile + completion hardening', () => {
  test('human reconcile sets replyBaseline like confirm', () => {
    const start = src.indexOf('function reconcileUncertainSend');
    const body = src.slice(start, start + 1600);
    expect(body).toContain('replyBaseline');
    expect(body).toContain("L.replyKey = ''");
    expect(body).toContain('L.replyStableTicks = 0');
  });

  test('missing baseline does not count as advanced while RUNNING', () => {
    expect(src).toContain("if (!b) return GHOST.loop.state !== 'RUNNING'");
  });
});
