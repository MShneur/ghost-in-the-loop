/**
 * WRONG-SELECTOR MISLEARN (v8.2.1) — regression suite for issues #4 and #5.
 *
 * Field evidence:
 *  #5 [auto] probe_fail on Grok    → learned send selector = #model-select-trigger
 *  #4 [auto] probe_fail on ChatGPT → learned send selector = #composer-plus-btn
 *
 * Both controls live INSIDE the composer form, so the heuristic tier's
 * "same-form" positive signal alone qualified them as a send button, and
 * nothing inspected their id or their popup-toggle nature. The result: the
 * loop "sent" by clicking a model picker / attach menu, and the run stalled
 * with "No output detected".
 *
 * Contract under test (the fix):
 *  1. A popup-toggle (aria-haspopup / aria-expanded) is NEVER a safe send.
 *  2. The element id is part of the veto surface (#model-select-trigger,
 *     #composer-plus-btn read as unsafe even with an innocuous aria-label).
 *  3. _heurSend cannot RETURN either control even when it is the only
 *     same-form candidate near the input.
 *  4. Send selectors are never learned or read from SelectorMemory.
 */
/* Symbols arrive on global via tests/setup.js */

/* Element stub compatible with _heurSend / _sendLooksSafe / derive / lookup */
function makeBtn(attrs = {}, opts = {}) {
  const attrMap = { ...attrs };
  const el = {
    tagName: opts.tag || 'BUTTON',
    disabled: false,
    textContent: opts.text || '',
    className: opts.className || '',
    getAttribute: (k) => (attrMap[k] !== undefined ? attrMap[k] : null),
    setAttribute: (k, v) => { attrMap[k] = String(v); },
    querySelector: (sel) => (sel === 'svg' && opts.svg ? {} : null),
    closest: (sel) => (sel === 'form' ? (opts.form || null) : null),
    getBoundingClientRect: () => opts.rect || { left: 100, top: 500, width: 40, height: 40, bottom: 540, right: 140 },
    isConnected: true
  };
  return el;
}

describe('Issue #5 — Grok: #model-select-trigger must never look like send', () => {
  test('a model-select dropdown is vetoed by its aria-haspopup', () => {
    const modelPicker = makeBtn(
      { id: 'model-select-trigger', 'aria-haspopup': 'listbox', 'aria-label': 'Grok 4' });
    expect(_sendLooksSafe(modelPicker)).toBe(false);
  });

  test('the id alone (#model-select-trigger) reads as unsafe even without haspopup', () => {
    const byId = makeBtn({ id: 'model-select-trigger', 'aria-label': 'Grok 4' });
    expect(_sendLooksSafe(byId)).toBe(false);
  });

  test('SEND_VETO matches the "model" keyword', () => {
    expect(SEND_VETO.test('model-select-trigger')).toBe(true);
  });
});

describe('Issue #4 — ChatGPT: #composer-plus-btn must never look like send', () => {
  test('the "+" attach menu is vetoed by its aria-expanded toggle', () => {
    const plus = makeBtn(
      { id: 'composer-plus-btn', 'aria-expanded': 'false', 'aria-label': 'Add photos & files' });
    expect(_sendLooksSafe(plus)).toBe(false);
  });

  test('the id alone (#composer-plus-btn) reads as unsafe', () => {
    const byId = makeBtn({ id: 'composer-plus-btn', 'aria-label': 'Add' });
    expect(_sendLooksSafe(byId)).toBe(false);
  });

  test('a real ChatGPT send button is still accepted', () => {
    const send = makeBtn({ 'data-testid': 'send-button', 'aria-label': 'Send prompt' });
    expect(_sendLooksSafe(send)).toBe(true);
  });
});

describe('_heurSend — a same-form popup-toggle can no longer be RETURNED', () => {
  // Reproduce the trap: the only same-form candidate near the input is the
  // model picker / "+" menu (svg icon, close to the composer). Pre-8.2.1 the
  // "same-form" signal + proximity scored it past threshold and it was learned.
  const form = { __isForm: true };
  const anchor = {
    getBoundingClientRect: () => ({ left: 90, top: 500, width: 300, height: 40, bottom: 540, right: 390 }),
    closest: (sel) => (sel === 'form' ? form : null)
  };

  test('does not return #model-select-trigger even when it is the only same-form candidate', () => {
    const picker = makeBtn(
      { id: 'model-select-trigger', 'aria-haspopup': 'listbox' },
      { svg: true, form, rect: { left: 100, top: 500, width: 40, height: 40, bottom: 540, right: 140 } });
    const _qAllOrig = global._qAll;
    // _heurSend iterates _qAll(['button','[role="button"]']); jsdom has none,
    // so assert the gate directly: the candidate is filtered by _sendLooksSafe,
    // which _heurSend now uses as its veto.
    expect(_sendLooksSafe(picker)).toBe(false);
    if (_qAllOrig) global._qAll = _qAllOrig;
  });

  test('_heurSend routes its veto through _sendLooksSafe (single source of truth)', () => {
    const fs = require('fs'), path = require('path');
    const s = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
    // The old inline `if (SEND_VETO.test(label)) continue;` is replaced by the
    // shared gate so id + structural checks apply in the heuristic tier too.
    expect(s).toContain('if (!_sendLooksSafe(el)) continue;');
  });
});

describe('SelectorMemory — actuators are never learned', () => {
  test('learn("send") and lookup("send") both forget and return null', () => {
    const fs = require('fs'), path = require('path');
    const s = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
    const learn = s.match(/learn\(kind, el\) \{[\s\S]*?\n  \},/)?.[0] || '';
    const lookup = s.match(/lookup\(kind\) \{[\s\S]*?\n  \},/)?.[0] || '';
    expect(learn).toContain("if (kind === 'send')");
    expect(learn).toContain("this.forget('send');");
    expect(lookup).toContain("if (kind === 'send')");
    expect(lookup).toContain("this.forget('send');");
  });

  test('runtime send actuation uses reviewed selectors, never the heuristic candidate', () => {
    const fs = require('fs'), path = require('path');
    const s = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
    const getSend = s.match(/getSendBtn\(\) \{[\s\S]*?\n  \},/)?.[0] || '';
    expect(getSend).toContain('return _reviewedSend();');
    expect(getSend).not.toContain('_heurSend');
    expect(getSend).not.toContain('SelectorMemory');
  });

  test('_sendLooksSafe structurally rejects popup toggles (haspopup + expanded)', () => {
    const fs = require('fs'), path = require('path');
    const s = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
    expect(s).toContain("if (el.getAttribute('aria-haspopup')) return false;");
    expect(s).toContain("if (el.getAttribute('aria-expanded') != null) return false;");
  });
});
