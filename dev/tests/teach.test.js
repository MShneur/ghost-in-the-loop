/**
 * TEACH MODE (v8.6.0)
 *
 * When Ghost can't auto-detect the input/send control on a site, the user taps
 * the real control once and Ghost stores a stable selector for it, per host.
 * A taught send is a HUMAN-REVIEWED actuator (valid even on unreviewed sites)
 * but is re-veto'd through _sendLooksSafe on every resolve.
 */
/* Symbols arrive on global via tests/setup.js */

describe('TeachStore — per-host user-captured selectors', () => {
  beforeEach(() => { TeachStore.forgetHost(); });

  test('set/get/forget round-trip for the current host', () => {
    expect(TeachStore.get('send')).toBeNull();
    expect(TeachStore.set('send', 'button#real-send')).toBe(true);
    expect(TeachStore.get('send')).toBe('button#real-send');
    expect(TeachStore.hasAny()).toBe(true);
    TeachStore.forget('send');
    expect(TeachStore.get('send')).toBeNull();
    expect(TeachStore.hasAny()).toBe(false);
  });

  test('forgetHost clears every kind for the host', () => {
    TeachStore.set('send', 'button#s');
    TeachStore.set('input', 'textarea#i');
    expect(TeachStore.hasAny()).toBe(true);
    TeachStore.forgetHost();
    expect(TeachStore.get('send')).toBeNull();
    expect(TeachStore.get('input')).toBeNull();
  });

  test('an empty selector is rejected', () => {
    expect(TeachStore.set('send', '')).toBe(false);
    expect(TeachStore.set('send', null)).toBe(false);
  });
});

describe('wiring — taught controls are consulted (source contract)', () => {
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('taught Send remains authority on any host, but is tiered after adapter mechanisms', () => {
    const adapterFn = src.slice(src.indexOf('function _reviewedSend()'), src.indexOf('function _reviewedComposer('));
    const taughtFn = src.slice(src.indexOf('function _reviewedTaughtSend()'), src.indexOf('function _reviewedTaughtSend()') + 350);
    expect(adapterFn).not.toContain("TeachStore.matchEl('send')");
    expect(taughtFn).toContain("TeachStore.matchEl('send')");
    expect(Array.from(SEND_MECHANISM_ORDER, pair => Array.from(pair)).at(-1)).toEqual(
      ['taughtControl', 'taught-control']
    );
  });

  test('peekInput consults a taught input', () => {
    expect(src).toContain("_q('in', PLAT.input) || TeachStore.matchEl('input') || SelectorMemory.lookup('input')");
  });

  test('matchEl re-applies the veto, validates input type, and requires uniqueness', () => {
    const fn = src.slice(src.indexOf('matchEl(kind) {'), src.indexOf('matchEl(kind) {') + 1000);
    expect(fn).toContain("&& _sendLooksSafe(el)");
    expect(fn).toContain("el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'");
    expect(fn).toContain('return matches.length === 1 ? matches[0] : null;');
  });

  test('the Teach capture never triggers the page control (preventDefault + stopPropagation)', () => {
    const cap = src.slice(src.indexOf('_capture(e) {'), src.indexOf('_capture(e) {') + 500);
    expect(cap).toContain('e.preventDefault(); e.stopPropagation();');
    expect(cap).toContain("Teach._inOwnUI(t)");
  });

  test('a send capture that fails the veto is rejected with a hint, not stored', () => {
    const commit = src.slice(src.indexOf('_commit(kind, el) {'), src.indexOf('_commit(kind, el) {') + 1100);
    expect(commit).toContain("kind === 'send' && !_sendLooksSafe(el)");
    expect(commit).toContain('TeachStore.set(kind, sel)');
  });

  test('the Teach UI is rendered in the Run tab', () => {
    expect(src).toContain('${renderTeach()}');
    expect(src).toContain('function renderTeach()');
  });
});
