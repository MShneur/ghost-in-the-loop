/**
 * SEND SAFETY TESTS (v8.1)
 * Regression suite for the DeepSeek incident: the heuristic send tier
 * clicked the reply's "Copy" button (svg icon + proximity scored past the
 * old threshold) and the user's prompt was copied instead of sent.
 *
 * Contract under test:
 *  1. SEND_VETO covers message-action verbs (copy/download/share/edit/…).
 *  2. _sendLooksSafe rejects vetoed controls no matter which tier found them.
 *  3. _heurSend requires a POSITIVE semantic signal (send word, type=submit,
 *     or same-form) — svg + proximity alone must never win.
 */
/* Symbols arrive on global via tests/setup.js */

/* Minimal element stub compatible with _heurSend/_sendLooksSafe */
function makeBtn(attrs = {}, opts = {}) {
  const attrMap = { ...attrs };
  return {
    tagName: 'BUTTON',
    disabled: false,
    textContent: opts.text || '',
    className: opts.className || '',
    getAttribute: (k) => (attrMap[k] !== undefined ? attrMap[k] : null),
    querySelector: (sel) => (sel === 'svg' && opts.svg ? {} : null),
    closest: (sel) => (sel === 'form' ? (opts.form || null) : null),
    getBoundingClientRect: () => opts.rect || { left: 0, top: 0, width: 40, height: 40, bottom: 40, right: 40 },
    isConnected: true
  };
}

describe('SEND_VETO — message-action verbs are hard-vetoed', () => {
  const vetoed = ['Copy', 'Download', 'Share', 'Edit message', 'Delete',
    'Regenerate', 'Retry', 'Like', 'Dislike', 'Read aloud', 'Copy code',
    'Stop generating', 'Voice mode', 'Attach file', 'DeepThink'];
  for (const label of vetoed) {
    test(`vetoes "${label}"`, () => expect(SEND_VETO.test(label)).toBe(true));
  }
  const allowed = ['Send', 'Send message', 'Submit', 'Send prompt', 'enviar'];
  for (const label of allowed) {
    test(`allows "${label}"`, () => expect(SEND_VETO.test(label)).toBe(false));
  }
});

describe('_sendLooksSafe — tier-independent veto', () => {
  test('rejects a copy button found by a configured selector', () => {
    expect(_sendLooksSafe(makeBtn({ 'aria-label': 'Copy' }))).toBe(false);
  });
  test('rejects a download control', () => {
    expect(_sendLooksSafe(makeBtn({}, { text: 'Download' }))).toBe(false);
  });
  test('accepts a real send button', () => {
    expect(_sendLooksSafe(makeBtn({ 'aria-label': 'Send message' }))).toBe(true);
  });
  test('null is not safe', () => {
    expect(_sendLooksSafe(null)).toBe(false);
  });
});

describe('_heurSend — semantic gate (svg + proximity alone must never win)', () => {
  test('source requires a positive semantic signal', () => {
    // Structural check: the gate exists in the shipped source.
    const fs = require('fs'), path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
    expect(src).toContain('const sem = SEND_WORDS.test(label)');
    expect(src).toContain('if (!sem) continue;');
  });
  test('is exported and callable', () => {
    expect(typeof _heurSend).toBe('function');
    // No DOM candidates in jsdom → must return null/undefined, never throw.
    expect(_heurSend(null) || null).toBe(null);
  });
});
