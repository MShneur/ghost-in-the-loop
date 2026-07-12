/**
 * UNATTENDED MODE TESTS (d12)
 *
 * The focus guard exists on purpose: it stops a background tab from
 * auto-sending prompts while nobody is watching. Unattended mode is the
 * explicit opt-out. The contract:
 *   - OFF (default): losing focus blocks sends. Unchanged behavior.
 *   - ON: focus no longer blocks — but the TAB LOCK still does, so two tabs
 *     can never drive the same conversation.
 *   - The ticker moves to a Worker (browsers throttle hidden-tab setInterval),
 *     and falls back to setInterval if page CSP blocks blob: workers.
 */

const origHasFocus = document.hasFocus;

afterEach(() => {
  document.hasFocus = origHasFocus;
  GHOST.ui.unattended = false;
  Ticker.stop();
  GM_setValue(_tabLockKey(), '');
});

function blurTab() { document.hasFocus = () => false; }

describe('focus guard — default (unattended OFF)', () => {
  test('an unfocused tab is not safe to act', () => {
    blurTab();
    expect(isTabSafeToAct()).toBe(false);
  });

  test('sends are blocked with reason tab-not-focused while running', () => {
    blurTab();
    GHOST.loop.state = 'RUNNING';
    const r = assertInteractionSafe();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tab-not-focused');
  });
});

describe('focus guard — unattended ON', () => {
  test('an unfocused tab IS safe to act', () => {
    GHOST.ui.unattended = true;
    blurTab();
    expect(isTabSafeToAct()).toBe(true);
  });

  test('sends are permitted while unfocused', () => {
    GHOST.ui.unattended = true;
    blurTab();
    GHOST.loop.state = 'RUNNING';
    expect(assertInteractionSafe().ok).toBe(true);
  });

  test('the tab lock is STILL enforced — unattended never allows two drivers', () => {
    GHOST.ui.unattended = true;
    blurTab();
    // another tab holds the lock
    GM_setValue(_tabLockKey(), JSON.stringify({ tab: 'some-other-tab', ts: Date.now() }));
    const r = assertInteractionSafe();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tab-lock-held-by-other');
  });

  test('unattendedOn reflects the setting', () => {
    expect(unattendedOn()).toBe(false);
    GHOST.ui.unattended = true;
    expect(unattendedOn()).toBe(true);
  });
});

describe('Ticker', () => {
  test('uses a plain interval when unattended is off', () => {
    const mode = Ticker.start(() => {}, 2500);
    expect(mode).toBe('interval');
    expect(Ticker.mode).toBe('interval');
  });

  test('falls back to interval when Worker/blob is unavailable (strict CSP)', () => {
    GHOST.ui.unattended = true;
    const origWorker = global.Worker;
    // simulate a page CSP that refuses blob: workers
    global.Worker = function () { throw new Error('blocked by CSP'); };
    const mode = Ticker.start(() => {}, 2500);
    expect(mode).toBe('interval');
    global.Worker = origWorker;
  });

  test('stop() clears the ticker', () => {
    Ticker.start(() => {}, 2500);
    Ticker.stop();
    expect(Ticker.mode).toBe('none');
  });
});
