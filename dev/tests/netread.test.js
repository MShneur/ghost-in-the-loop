/**
 * v8.7.0 network-read prototype — flagged off by default, read-only.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('GITL_NET read-only prototype', () => {
  test('net read is opt-in via GM flag', () => {
    expect(src).toContain("GM_getValue('gitlNetRead', false)");
    expect(src).toContain('netReadEnabled');
  });

  test('peekAssistantText never bypasses DOM when flag is off', () => {
    expect(src).toContain('peekAssistantText()');
    expect(src).toContain('if (!this.netReadEnabled');
  });

  test('SSE ingest is gated and does not touch actuation', () => {
    expect(src).toContain('_ingestChatGptSse');
    expect(src).toContain('if (self.netReadEnabled && value)');
    const send = src.slice(src.indexOf('function engineSend'), src.indexOf('function _confirmSend'));
    expect(send).not.toContain('_ingestChatGptSse');
    expect(send).not.toContain('peekAssistantText');
  });

  test('getLastText prefers DOM, falls back to network snippet', () => {
    expect(src).toContain('const dom = this.getLastAnswer()?.text');
    expect(src).toContain('const net = GITL_NET.peekAssistantText()');
    expect(src).toContain('return dom || net');
  });
});
