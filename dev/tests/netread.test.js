/**
 * NETWORK CHAT-READING PROTOTYPE (v8.7.0 Track C)
 * Flagged off by default. Read-only — never an actuation source.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('GITL_NET stream-reading prototype', () => {
  test('feature flag defaults off', () => {
    expect(src).toContain("GM_getValue('gitlNetRead', false)");
    expect(src).toContain('readEnabled()');
  });

  test('SSE ingest exists and records terminal + short tail only', () => {
    expect(src).toContain('_ingestSseChunk');
    expect(src).toContain('lastDoneT');
    expect(src).toContain('lastReplyTail');
    expect(src).toContain('.slice(-400)');
    expect(src).toContain('[DONE]');
  });

  test('ingest is only called when the flag is on', () => {
    expect(src).toContain('if (self.readEnabled()) self._ingestSseChunk(value)');
  });

  test('stream reading is never used as an actuation source', () => {
    const select = src.slice(src.indexOf('function _selectSendStrategy'), src.indexOf('function _visibleComposerPeers'));
    const send = src.slice(src.indexOf('async function engineSend'), src.indexOf('function _confirmSend'));
    expect(select).not.toContain('GITL_NET');
    expect(send).not.toContain('lastReplyTail');
    expect(send).not.toContain('_ingestSseChunk');
    expect(send).not.toContain('lastDoneT');
  });
});

describe('SSE chunk parser unit', () => {
  function makeIngest() {
    const start = src.indexOf('_ingestSseChunk(chunk)');
    const end = src.indexOf('install()', start);
    const body = src.slice(start, end);
    // Evaluate against a fake `this`
    // eslint-disable-next-line no-new-func
    const fn = new Function(`
      const self = {
        readEnabled() { return true; },
        lastDoneT: 0,
        lastReplyTail: '',
        _emit() {},
        ${body}
      };
      return self;
    `);
    return fn();
  }

  test('parses ChatGPT-style data:[DONE]', () => {
    const net = makeIngest();
    net._ingestSseChunk('data: {"message":{"content":{"parts":["Hi"]}}}\n\ndata: [DONE]\n\n');
    expect(net.lastDoneT).toBeGreaterThan(0);
    expect(net.lastReplyTail).toContain('Hi');
  });

  test('ignores non-JSON noise without throwing', () => {
    const net = makeIngest();
    expect(() => net._ingestSseChunk('event: ping\ndata: not-json\n\n')).not.toThrow();
  });
});
