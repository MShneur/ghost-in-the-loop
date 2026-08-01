/**
 * NET READ PROTOTYPE (v8.7.0 — Track C)
 *
 * The platform's own stream is the strongest possible completion/text signal.
 * This prototype parses ChatGPT SSE via the existing GITL_NET fetch hook —
 * OPT-IN ONLY (default off), READ-ONLY (never persisted, never reported,
 * never consulted by actuation or send authority). The DOM completion gate
 * stays the independent authority.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

const snap = (text) => `data: ${JSON.stringify({ message: { content: { parts: [text] } } })}\n`;

describe('ChatGPT SSE parser', () => {
  test('parses full-message snapshots across chunk boundaries', () => {
    const st = {};
    _sseChatGptFeed(st, snap('Hello, w').slice(0, 20));
    expect(st.text).toBeUndefined();          // partial line waits
    _sseChatGptFeed(st, snap('Hello, w').slice(20));
    expect(st.text).toBe('Hello, w');
    _sseChatGptFeed(st, snap('Hello, world'));
    expect(st.text).toBe('Hello, world');
  });

  test('[DONE] marks the stream complete', () => {
    const st = {};
    _sseChatGptFeed(st, snap('final text') + 'data: [DONE]\n');
    expect(st.text).toBe('final text');
    expect(st.done).toBe(true);
  });

  test('text only grows — a stale shorter snapshot cannot erase newer text', () => {
    const st = {};
    _sseChatGptFeed(st, snap('the longer reply so far'));
    _sseChatGptFeed(st, snap('short'));
    expect(st.text).toBe('the longer reply so far');
  });

  test('garbage, comments, and non-JSON data lines are skipped', () => {
    const st = {};
    _sseChatGptFeed(st, ': comment\nevent: message\ndata: not-json\ndata: 42\n\n');
    expect(st.text).toBeUndefined();
    expect(st.done).toBeUndefined();
  });

  test('malformed JSON never throws (advisory channel)', () => {
    const st = {};
    expect(() => _sseChatGptFeed(st, 'data: {broken json\n')).not.toThrow();
    expect(st.text).toBeUndefined();
  });
});

describe('read-only / opt-in contracts', () => {
  test('the flag defaults OFF', () => {
    expect(src).toContain("GITL_NET.netRead = !!GM_getValue('netRead', false)");
    expect(src).toContain('netRead:false');
  });

  test('stream data is never an actuation input — absent from all send authority', () => {
    for (const [fn, next] of [
      ['engineSend', '_confirmSend'],
      ['_reviewedSend', '_ambiguousComposerCount'],
      ['_selectSendStrategy', '_beginSendAttempt'],
      ['_confirmSend', '_markSendUncertain'],
      ['_sendEvidence', 'engineSend'],
    ]) {
      const b = body(fn, next);
      expect(b).not.toContain('streamText');
      expect(b).not.toContain('streamDone');
      expect(b).not.toContain('netRead');
    }
  });

  test('stream evidence resets when a new send attempt opens', () => {
    const begin = body('_beginSendAttempt', '_sendEvidence');
    expect(begin).toContain('GITL_NET.resetStream()');
  });

  test('stream text is never persisted', () => {
    expect(src).not.toMatch(/GM_setValue\([^)]*streamText/);
    expect(src).not.toMatch(/_save\([^)]*streamText/);
  });

  test('the tap is gated on the flag and the chatgpt host', () => {
    expect(src).toContain('if (self.netRead) self._sseTap(value);');
    expect(src).toContain("/chatgpt\\.com|chat\\.openai\\.com/.test(location.hostname)");
  });

  test('netRead rides config backup/restore as a boolean', () => {
    const res = _validateConfigBundle(JSON.stringify({ schema: CONFIG_SCHEMA, version: 1, config: { netRead: true } }));
    expect(res.ok).toBe(true);
  });

  test('the settings toggle is wired', () => {
    expect(src).toContain('id="cfg-netread"');
    expect(src).toContain("$('#cfg-netread')?.addEventListener('click'");
    expect(src).toContain("Timeline.record('net_read_toggled'");
  });
});
