/**
 * Experimental ChatGPT SSE read probe.
 * Replays synthetic stream fixtures; it does not make live-site claims.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function eventFor(role, text, extra = {}) {
  return JSON.stringify({
    message: {
      author: { role },
      content: { content_type: 'text', parts: [text] },
      status: extra.status || 'in_progress',
      end_turn: !!extra.endTurn
    }
  });
}

function replay(probe, stream) {
  const widths = [1, 7, 2, 19, 3, 31, 5, 11];
  let offset = 0;
  let i = 0;
  while (offset < stream.length) {
    const width = widths[i++ % widths.length];
    probe.feed(stream.slice(offset, offset + width));
    offset += width;
  }
  return probe.finish();
}

function resetReadProbe() {
  Object.assign(GITL_NET.readProbe, {
    enabled: NET_READ_FLAGS.chatgptSse,
    streams: 0,
    openStreams: 0,
    complete: false,
    completion: 'none',
    assistantEvents: 0,
    assistantChars: 0,
    marker: 'none',
    malformedEvents: 0,
    oversizedEvents: 0,
    lastAt: 0
  });
}

beforeEach(resetReadProbe);
afterEach(resetReadProbe);

describe('ChatGPT SSE parser replay', () => {
  test('handles arbitrary chunk boundaries and emits completion metadata only', () => {
    const partial = 'Synthetic answer in progress.';
    const final = `Synthetic answer complete. ${SIGIL_PROCEED}`;
    const stream = [
      `event: message\r\ndata: ${eventFor('assistant', partial)}\r\n\r\n`,
      `data: ${eventFor('assistant', final, { status: 'finished_successfully', endTurn: true })}\n\n`,
      'data: [DONE]\n\n'
    ].join('');

    const result = replay(_createChatGPTSSEReadProbe(), stream);

    expect(result).toEqual({
      complete: true,
      completion: 'done',
      assistantEvents: 2,
      assistantChars: final.length,
      marker: 'proceed',
      malformedEvents: 0,
      oversizedEvents: 0
    });
    expect(JSON.stringify(result)).not.toContain('Synthetic answer');
  });

  test('ignores user content, counts malformed events, and gives HALT priority', () => {
    const userSecret = 'USER-SECRET-MUST-NOT-SURVIVE';
    const final = `Fixture mentions ${SIGIL_PROCEED} then ends ${SIGIL_HALT}`;
    const stream = [
      `data: ${eventFor('user', userSecret)}\n\n`,
      'data: {"message":not-json}\n\n',
      `data: ${eventFor('assistant', final, { endTurn: true })}`
    ].join('');

    const result = replay(_createChatGPTSSEReadProbe(), stream);

    expect(result.complete).toBe(true);
    expect(result.completion).toBe('message');
    expect(result.assistantEvents).toBe(1);
    expect(result.assistantChars).toBe(final.length);
    expect(result.marker).toBe('halt');
    expect(result.malformedEvents).toBe(1);
    expect(JSON.stringify(result)).not.toContain(userSecret);
  });

  test('drops an oversized event and resumes at the next SSE boundary', () => {
    const final = `Recovered fixture. ${SIGIL_PROCEED}`;
    const stream = [
      `data: ${'x'.repeat(1000)}\n\n`,
      `data: ${eventFor('assistant', final, { endTurn: true })}\n\n`,
      'data: [DONE]\n\n'
    ].join('');

    const result = replay(
      _createChatGPTSSEReadProbe(null, { maxEventChars: 256 }),
      stream
    );

    expect(result.oversizedEvents).toBe(1);
    expect(result.malformedEvents).toBe(0);
    expect(result.assistantEvents).toBe(1);
    expect(result.complete).toBe(true);
    expect(result.marker).toBe('proceed');
  });
});

describe('GITL_NET read-probe integration boundary', () => {
  const sseResponse = { headers: { get: () => 'text/event-stream; charset=utf-8' } };
  const jsonResponse = { headers: { get: () => 'application/json' } };

  test('is feature-flagged off by default', () => {
    expect(NET_READ_FLAGS.chatgptSse).toBe(false);
    expect(GITL_NET.readProbeSnapshot()).toEqual(expect.objectContaining({
      enabled: false,
      transport: 'chatgpt-sse',
      streams: 0,
      openStreams: 0
    }));
    expect(GITL_NET._startReadProbe(
      '/backend-api/conversation',
      { method: 'POST' },
      sseResponse
    )).toBe(null);
  });

  test('accepts only the exact POST SSE transport and records a redacted snapshot', () => {
    GITL_NET.readProbe.enabled = true;
    expect(GITL_NET._readProbeEligible('/backend-api/conversation', { method: 'GET' }, sseResponse)).toBe(false);
    expect(GITL_NET._readProbeEligible('/backend-api/conversation/id', { method: 'POST' }, sseResponse)).toBe(false);
    expect(GITL_NET._readProbeEligible('/backend-api/conversation', { method: 'POST' }, jsonResponse)).toBe(false);

    const answer = `Integrated synthetic answer. ${SIGIL_HALT}`;
    const probe = GITL_NET._startReadProbe(
      'https://chatgpt.com/backend-api/conversation?history_and_training_disabled=false',
      { method: 'POST' },
      sseResponse
    );
    expect(probe).not.toBe(null);
    expect(GITL_NET.readProbe.openStreams).toBe(1);
    replay(probe, `data: ${eventFor('assistant', answer, { endTurn: true })}\n\ndata: [DONE]\n\n`);
    GITL_NET._endReadProbe();

    const result = GITL_NET.readProbeSnapshot();
    expect(result).toEqual(expect.objectContaining({
      enabled: true,
      streams: 1,
      openStreams: 0,
      complete: true,
      completion: 'done',
      assistantChars: answer.length,
      marker: 'halt'
    }));
    expect(Object.keys(result).sort()).toEqual([
      'assistantChars', 'assistantEvents', 'complete', 'completion', 'enabled',
      'malformedEvents', 'marker', 'openStreams', 'oversizedEvents', 'streams',
      'transport'
    ].sort());
    expect(JSON.stringify(result)).not.toContain('Integrated synthetic answer');
  });

  test('diagnostics retain metadata but no parsed conversation text', () => {
    const secret = `ASSISTANT-SECRET-441 ${SIGIL_PROCEED}`;
    GITL_NET.readProbe.enabled = true;
    const probe = GITL_NET._startReadProbe(
      '/backend-api/conversation',
      { method: 'POST' },
      sseResponse
    );
    replay(probe, `data: ${eventFor('assistant', secret, { endTurn: true })}\n\n`);
    GITL_NET._endReadProbe();

    const diagnostic = Reporter.envelope('MANUAL-001');
    expect(diagnostic.network.readProbe).toEqual(GITL_NET.readProbeSnapshot());
    expect(JSON.stringify(diagnostic)).not.toContain(secret);
    expect(JSON.stringify(GITL_NET)).not.toContain(secret);
  });

  test('the experiment cannot feed completion or actuation paths', () => {
    const parser = src.slice(
      src.indexOf('function _createChatGPTSSEReadProbe'),
      src.indexOf('const GITL_NET')
    );
    const engine = src.slice(
      src.indexOf('function _sendEvidence'),
      src.indexOf('SPA ROUTE DETECTION')
    );
    expect(parser).not.toMatch(/engineSend|_reviewedSend|\.click\(|dispatchEvent|GM_setValue/);
    expect(engine).not.toMatch(/readProbe|_createChatGPTSSEReadProbe/);
  });
});
