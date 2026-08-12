/**
 * CHATGPT SEND RESOLUTION REGRESSION (v8.8.1 candidate)
 *
 * The authenticated field failure remains unverified in this harness. These
 * fixtures lock down two bounded facts instead:
 *   - the production adapter can recognize a possible `Send message` variant;
 *   - all reviewed selector aliases must resolve to one unique DOM node before
 *     Ghost receives click authority.
 *
 * Symbols arrive on global via tests/setup.js, whose URL selects ChatGPT.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function chatgptProfile() {
  const start = src.indexOf('chatgpt: {');
  return src.slice(start, src.indexOf('\n  perplexity:', start));
}

function sendBtn(label, extra = {}, visible = true) {
  const button = document.createElement('button');
  if (label != null) button.setAttribute('aria-label', label);
  button.textContent = label || '';
  Object.entries(extra).forEach(([key, value]) => button.setAttribute(key, value));
  button.getBoundingClientRect = () => visible
    ? ({ width: 40, height: 40, top: 10, left: 0, right: 40, bottom: 50 })
    : ({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 });
  return button;
}

describe('ChatGPT reviewed Send — source contract', () => {
  const profile = chatgptProfile();

  test('includes the bounded Send message compatibility identity', () => {
    expect(profile).toContain(`'button[aria-label="Send message"]'`);
  });

  test('retains the identities observed on the current signed-out public composer', () => {
    expect(profile).toContain(`'button[data-testid="send-button"]'`);
    expect(profile).toContain(`'button[aria-label="Send prompt"]'`);
  });

  test('reviewed semantic identities precede the generic form-submit fallback', () => {
    const semanticAt = profile.indexOf(`aria-label="Send message"`);
    const submitAt = profile.indexOf(`form button[type="submit"]`);
    expect(semanticAt).toBeGreaterThan(-1);
    expect(submitAt).toBeGreaterThan(semanticAt);
  });

  test('Send message is not caught by the send veto', () => {
    expect(SEND_VETO.test('Send message')).toBe(false);
    expect(_sendLooksSafe({
      getAttribute: (key) => (key === 'aria-label' ? 'Send message' : null),
      textContent: ''
    })).toBe(true);
  });
});

describe('_reviewedSend fixture resolution', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    try { TeachStore.forgetHost(); } catch (_) {}
  });

  test('a unique visible Send message variant resolves to its exact node', () => {
    const button = sendBtn('Send message');
    document.body.appendChild(button);
    expect(_reviewedSend()).toBe(button);
  });

  test('the current signed-out public composer identity resolves without Send message', () => {
    const form = document.createElement('form');
    const button = sendBtn('Send prompt', {
      id: 'composer-submit-button',
      'data-testid': 'send-button'
    });
    form.appendChild(button);
    document.body.appendChild(form);

    expect(button.getAttribute('type')).toBeNull();
    expect(_reviewedSend()).toBe(button);
  });

  test('selector aliases for the same node are deduplicated', () => {
    const button = sendBtn('Send message', { 'data-testid': 'send-button' });
    document.body.appendChild(button);
    expect(_reviewedSend()).toBe(button);
  });

  test('two plausible Send controls are ambiguous and fail closed', () => {
    document.body.appendChild(sendBtn('Send message'));
    document.body.appendChild(sendBtn('Send message'));
    expect(_reviewedSend()).toBeNull();
  });

  test('ambiguity cannot be bypassed by a later selector matching one duplicate', () => {
    document.body.appendChild(sendBtn('Send message', { 'data-testid': 'send-button' }));
    document.body.appendChild(sendBtn('Send message'));
    expect(_reviewedSend()).toBeNull();
  });

  test('a hidden secondary control does not make the visible composer ambiguous', () => {
    const visible = sendBtn('Send prompt', { 'data-testid': 'send-button' });
    document.body.appendChild(visible);
    document.body.appendChild(sendBtn('Send message', {}, false));
    expect(_reviewedSend()).toBe(visible);
  });

  test('resolution is fresh after the host replaces the Send node', () => {
    const first = sendBtn('Send message');
    document.body.appendChild(first);
    expect(_reviewedSend()).toBe(first);

    const replacement = sendBtn('Send message');
    first.replaceWith(replacement);
    expect(_reviewedSend()).toBe(replacement);
  });

  test.each([
    ['disabled', (button) => { button.disabled = true; }],
    ['aria-disabled', (button) => { button.setAttribute('aria-disabled', 'true'); }],
    ['menu popup', (button) => { button.setAttribute('aria-haspopup', 'menu'); }],
    ['disclosure', (button) => { button.setAttribute('aria-expanded', 'false'); }]
  ])('rejects a %s Send decoy', (_name, mutate) => {
    const button = sendBtn('Send message');
    mutate(button);
    document.body.appendChild(button);
    expect(_reviewedSend()).toBeNull();
  });
});

describe('Ghost button semantics', () => {
  test('render normalizes every panel button to type=button', () => {
    expect(src).toContain("panel.querySelectorAll('button:not([type])')");
    expect(src).toContain("button.setAttribute('type', 'button')");
  });

  test('mountPanel does not globally cancel ordinary Ghost clicks', () => {
    const start = src.indexOf('function mountPanel()');
    const block = src.slice(start, src.indexOf('function _esc', start));
    expect(block).not.toContain("closest('#gitl button')");
    expect(block).not.toContain('e.preventDefault()');
  });
});
