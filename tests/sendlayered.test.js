/**
 * LAYERED SEND FAILSAFES (v8.4.2) — mobile-Perplexity ADAPTER-001 fix.
 *
 * Field report (Firefox/Android, Perplexity): round 1 sent, then the loop paused
 * with send:false. Root cause: the follow-up composer has no uniquely-matching
 * reviewed Send button, and engineSend was button-only (CG's at-most-once send).
 *
 * Fix: an ordered failsafe chain — reviewed button → single Enter → insertParagraph
 * → native form submit — that PRESERVES at-most-once IN EFFECT: each method fires
 * only while the composer still holds the unsent text; the instant it clears (or
 * independent evidence confirms), escalation STOPS, so a second method is never
 * dispatched after a send. The prompt therefore cannot double-send. Buttonless
 * tiers are reviewed-platforms only; unreviewed sites stay manual-send. Final
 * commit still requires _sendEvidence — a dispatch that produced no send can
 * never advance the round.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
const send = src.slice(src.indexOf('function engineSend'), src.indexOf('function _confirmSend'));

describe('Layered send — the failsafe chain', () => {
  test('reviewed button is tier 1 and clicks exactly once', () => {
    expect(send).toContain("tiers.push({ path: 'reviewed-button', run: () => btn.click() })");
    expect((send.match(/\.click\(\)/g) || []).length).toBe(1);
  });

  test('buttonless failsafes (Enter → paragraph → form) exist, reviewed-only', () => {
    expect(send).toContain('if (PLAT?.reviewed) {');
    expect(send).toContain("path: 'reviewed-enter'");
    expect(send).toContain("path: 'reviewed-paragraph'");
    expect(send).toContain("path: 'reviewed-form'");
    expect(send).toContain('requestSubmit');
  });

  test('each tier is a single mechanism (no multi-signal pressEnter helper)', () => {
    expect(send).not.toContain('Adapter.pressEnter');
    // The Enter tier dispatches exactly the three keyboard events, nothing else.
    expect(send).toContain("['keydown','keypress','keyup'].forEach");
  });
});

describe('Layered send — at-most-once IN EFFECT (double-send guard)', () => {
  test('escalation stops the instant the composer clears or evidence confirms', () => {
    expect(send).toContain('(hadText && _composerText(input).length < 4) || _sendEvidence().confirmed) break;');
  });

  test('the composer-had-text baseline is captured before dispatch', () => {
    expect(send).toContain('const hadText = _composerText(input).length > 0;');
  });

  test('no automatic retry machinery is introduced (escalation != resend)', () => {
    expect(src).not.toContain('SEND_MAX_RETRIES');
    expect(src).not.toContain('_refireSend');
    expect(send).not.toContain('L.round++'); // advancement stays in _confirmSend
  });

  test('still evidence-gated: waits on the transaction promise, never self-reports success', () => {
    expect(send).toContain('const completion = _beginSendAttempt(DIAG.sendPath, input)');
    expect(send).toContain('return await completion;');
    expect(send).not.toContain('_confirmSend(');
  });
});

describe('Layered send — unreviewed sites stay manual', () => {
  test('no reviewed button and not reviewed → manual-send pause (fail closed)', () => {
    expect(send).toContain('if (!tiers.length) {');
    expect(send).toContain("pauseWithProbe('No safe Send control");
  });
});
