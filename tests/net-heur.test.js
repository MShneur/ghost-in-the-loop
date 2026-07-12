/**
 * NET + HEURISTIC FINDER TESTS (d7)
 * 1. GITL_NET.streaming() semantics — the dual-channel generation signal:
 *    trusted (known-endpoint) pulses always count; heuristic pulses only
 *    inside the post-send expectation window.
 * 2. Heuristic element finders — role/meaning-based last-resort location of
 *    the composer and send button when configured selectors all fail.
 */

function netReset() {
  GITL_NET.lastPulseT = 0;
  GITL_NET.lastPulseH = 0;
  GITL_NET._open = 0;
  GITL_NET.expectUntil = 0;
}

afterEach(() => {
  netReset();
  document.querySelectorAll('[data-t]').forEach(n => n.remove());
});

const rect = (el, top, left, w = 40, h = 32) => {
  el.getBoundingClientRect = () => ({
    top, left, width: w, height: h, bottom: top + h, right: left + w
  });
  return el;
};

describe('GITL_NET — streaming() semantics', () => {
  test('quiet at rest', () => {
    netReset();
    expect(GITL_NET.streaming()).toBe(false);
  });

  test('trusted pulse counts unconditionally, then ages out', () => {
    netReset();
    GITL_NET.lastPulseT = Date.now();
    expect(GITL_NET.streaming()).toBe(true);
    GITL_NET.lastPulseT = Date.now() - 3000;
    expect(GITL_NET.streaming()).toBe(false);
  });

  test('heuristic pulse alone is ignored (no expectation window)', () => {
    netReset();
    GITL_NET.lastPulseH = Date.now();
    expect(GITL_NET.streaming()).toBe(false);
  });

  test('heuristic pulse counts inside the post-send window', () => {
    netReset();
    GITL_NET.expectUntil = Date.now() + 60000;
    GITL_NET.lastPulseH = Date.now();
    expect(GITL_NET.streaming()).toBe(true);
  });

  test('open stream counts inside the window even between chunks', () => {
    netReset();
    GITL_NET.expectUntil = Date.now() + 60000;
    GITL_NET._open = 1;
    expect(GITL_NET.streaming()).toBe(true);
    GITL_NET.expectUntil = 0;
    expect(GITL_NET.streaming()).toBe(false);
  });

  test('_pulse routes to the right timestamp', () => {
    netReset();
    GITL_NET._pulse(true);
    expect(GITL_NET.lastPulseT).toBeGreaterThan(0);
    expect(GITL_NET.lastPulseH).toBe(0);
    GITL_NET._pulse(false);
    expect(GITL_NET.lastPulseH).toBeGreaterThan(0);
  });
});

describe('GITL_NET — endpoint classification', () => {
  test('_isChat covers current transports', () => {
    expect(GITL_NET._isChat('/backend-api/conversation?x=1')).toBe(true);
    expect(GITL_NET._isChat('https://gemini.google.com/x/batchexecute?rpcids=y')).toBe(true);
    expect(GITL_NET._isChat('/totally/unrelated')).toBe(false);
  });

  test('_maybeChat wants same-origin POST and vetoes telemetry', () => {
    expect(GITL_NET._maybeChat('/api/anything', 'POST')).toBe(true);
    expect(GITL_NET._maybeChat('/api/anything', 'GET')).toBe(false);
    expect(GITL_NET._maybeChat('/v1/log/collect', 'POST')).toBe(false);
    expect(GITL_NET._maybeChat('/telemetry/events', 'POST')).toBe(false);
    expect(GITL_NET._maybeChat('https://cdn.example.net/stream', 'POST')).toBe(false);
  });
});

describe('Adapter.isGenerating — dual channel', () => {
  test('net streaming alone reports generating (no stop button in DOM)', () => {
    netReset();
    expect(Adapter.isGenerating()).toBe(false);
    GITL_NET.lastPulseT = Date.now();
    expect(Adapter.isGenerating()).toBe(true);
  });
});

describe('Heuristic send-button finder', () => {
  function composer() {
    const form = document.createElement('form');
    form.setAttribute('data-t', '1');
    const ta = rect(document.createElement('textarea'), 700, 100, 400, 60);
    form.appendChild(ta);
    document.body.appendChild(form);
    return { form, ta };
  }

  test('picks the aria-labelled send button, skips voice and disabled decoys', () => {
    const { form, ta } = composer();
    const mk = (label, opts = {}) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', label);
      if (opts.disabled) b.disabled = true;
      rect(b, 705, opts.left || 520);
      (opts.parent || form).appendChild(b);
      return b;
    };
    mk('Start voice conversation', { left: 460 });
    mk('Send message', { left: 560, disabled: true });
    const real = mk('Send message', { left: 610 });
    expect(_heurSend(ta)).toBe(real);
  });

  test('veto words beat send words (no firing "Send voice message" mics)', () => {
    const { form, ta } = composer();
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Send voice message');
    rect(b, 705, 560);
    form.appendChild(b);
    expect(_heurSend(ta)).toBe(null);
  });

  test('never selects GITL\u2019s own UI', () => {
    const { ta } = composer();
    const own = document.createElement('button');
    own.setAttribute('aria-label', 'Send');
    rect(own, 705, 560);
    document.getElementById('gitl').appendChild(own);
    expect(_heurSend(ta)).toBe(null);
    own.remove();
  });

  test('multilingual dictionary matches', () => {
    expect(SEND_WORDS.test('发送')).toBe(true);
    expect(SEND_WORDS.test('Enviar mensaje')).toBe(true);
    expect(SEND_WORDS.test('отправить')).toBe(true);
  });
});

describe('Heuristic input finder', () => {
  test('prefers a large role=textbox editor low on the page', () => {
    const small = document.createElement('div');
    small.setAttribute('contenteditable', 'true');
    small.setAttribute('data-t', '1');
    rect(small, 100, 100, 200, 24);
    const composerEl = document.createElement('div');
    composerEl.setAttribute('contenteditable', 'true');
    composerEl.setAttribute('role', 'textbox');
    composerEl.setAttribute('data-t', '1');
    rect(composerEl, 700, 100, 500, 60);
    document.body.append(small, composerEl);
    expect(_heurInput()).toBe(composerEl);
  });
});
