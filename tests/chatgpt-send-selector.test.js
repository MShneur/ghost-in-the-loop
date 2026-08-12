/**
 * CHATGPT LIVE SEND SELECTOR REGRESSION (v8.8.1)
 *
 * Field regression after 8.8.0: on current ChatGPT the reviewed Send control
 * carries aria-label="Send message". The 8.8.0 ChatGPT adapter did NOT list
 * that identity, so _reviewedSend() returned null, engineSend selected the
 * reviewed synthetic-Enter fallback, and current ChatGPT ignored the synthetic
 * key event — the continuation text was inserted but never sent.
 *
 * This proves the PRODUCTION adapter (not the diagnostic field shim) resolves
 * the real button as a single reviewed actuator, preserving at-most-once
 * dispatch and all existing send vetoes / fail-closed behaviour. The harness
 * boots with location.hostname = chatgpt.com, so PLAT is the ChatGPT adapter.
 *
 * Symbols (_reviewedSend, SEND_VETO, _sendLooksSafe, TeachStore) arrive on
 * global via tests/setup.js.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function chatgptProfile() {
  const start = src.indexOf('chatgpt: {');
  return src.slice(start, src.indexOf('\n  perplexity:', start));
}

describe('ChatGPT reviewed Send — source contract', () => {
  const profile = chatgptProfile();

  test('lists the current-live aria-label="Send message" identity', () => {
    expect(profile).toContain(`'button[aria-label="Send message"]'`);
  });

  test('prefers the semantic Send identity over the generic form-submit fallback', () => {
    // Order matters in _reviewedSend: the first selector that resolves to a
    // single safe match wins. The confirmed live identity must be tried before
    // the broad `form button[type="submit"]` that masked the gap in fixtures.
    const semanticAt = profile.indexOf(`aria-label="Send message"`);
    const submitAt = profile.indexOf(`form button[type="submit"]`);
    expect(semanticAt).toBeGreaterThan(-1);
    expect(submitAt).toBeGreaterThan(semanticAt);
  });

  test('"Send message" is not caught by the send veto', () => {
    expect(SEND_VETO.test('Send message')).toBe(false);
    expect(_sendLooksSafe({ getAttribute: (k) => (k === 'aria-label' ? 'Send message' : null), textContent: '' })).toBe(true);
  });
});

describe('_reviewedSend resolves the real ChatGPT Send button (live DOM)', () => {
  function sendBtn(label, extra = {}) {
    const b = document.createElement('button');
    if (label != null) b.setAttribute('aria-label', label);
    b.textContent = label || '';
    Object.entries(extra).forEach(([k, v]) => b.setAttribute(k, v));
    // jsdom returns a zero rect; make it pass the visibility gate.
    b.getBoundingClientRect = () => ({ width: 40, height: 40, top: 10, left: 0, right: 40, bottom: 50 });
    return b;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    try { TeachStore.forgetHost(); } catch (_) {}
  });

  test('a unique visible aria-label="Send message" is returned as the reviewed actuator', () => {
    const b = sendBtn('Send message');
    document.body.appendChild(b);
    expect(_reviewedSend()).toBe(b);
  });

  test('two plausible Send controls are ambiguous → fail closed (null, never a guess)', () => {
    document.body.appendChild(sendBtn('Send message'));
    document.body.appendChild(sendBtn('Send message'));
    expect(_reviewedSend()).toBeNull();
  });

  test('a disabled Send message is never actuated', () => {
    const b = sendBtn('Send message');
    b.disabled = true;
    document.body.appendChild(b);
    expect(_reviewedSend()).toBeNull();
  });

  test('a menu/attach decoy labelled Send is vetoed by the structural gate', () => {
    document.body.appendChild(sendBtn('Send message', { 'aria-haspopup': 'menu' }));
    expect(_reviewedSend()).toBeNull();
  });
});

describe('Ghost-button default-action guard (scroll-to-top symptom)', () => {
  // mountPanel installs a panel-scoped, capture-phase guard that cancels the
  // browser DEFAULT action on Ghost button clicks (host-form submit / anchor
  // navigation → the reported jump-to-top) WITHOUT stopping propagation, so
  // Ghost's own click handlers still fire and every re-rendered button is
  // covered by the single delegated listener.
  // Scope to the guard block itself: from its anchor comment to the end of the
  // listener registration, so the assertion can't leak into neighbouring code.
  // Anchor on the guard's CODE (not its comment, which mentions the words) so
  // the propagation assertion reflects the actual listener body.
  const codeAt = src.indexOf("const btn = t && t.closest ? t.closest('#gitl button')");
  const guard = src.slice(codeAt, src.indexOf('}, true);', codeAt));

  test('mountPanel prevents default on Ghost button clicks', () => {
    expect(codeAt).toBeGreaterThan(-1);
    expect(guard).toContain("closest('#gitl button')");
    expect(guard).toContain('e.preventDefault()');
  });

  test('the guard never stops propagation (Ghost handlers must still run)', () => {
    expect(guard).not.toContain('stopPropagation');
    expect(guard).not.toContain('stopImmediatePropagation');
  });
});
