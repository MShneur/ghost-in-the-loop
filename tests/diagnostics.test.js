/**
 * PRIVACY-SAFE AUTOMATIC DIAGNOSTICS
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('stable error catalog', () => {
  test('core boot, composer, send, and adapter failures have stable codes', () => {
    for (const code of ['BOOT-001','BOOT-002','COMPOSER-001','SEND-001','SEND-002','ADAPTER-001']) {
      expect(ERROR_CATALOG[code]).toBeDefined();
      expect(ERROR_CATALOG[code].summary).toBeTruthy();
      expect(ERROR_CATALOG[code].guidance).toBeTruthy();
    }
  });

  test('legacy probe/manual names normalize without leaking their detail', () => {
    expect(Reporter.code('probe_fail')).toBe('ADAPTER-001');
    expect(Reporter.code('manual')).toBe('MANUAL-001');
    expect(Reporter.code('anything-else')).toBe('UNKNOWN-001');
  });
});

describe('diagnostic envelope', () => {
  beforeEach(() => {
    Reporter.last = null;
    Reporter._seen.clear();
    Timeline._cache = null;
    GM_setValue('gitlTimeline', '[]');
    SelectorMemory._data = null;
  });

  test('contains useful capabilities but excludes raw content and identifiers', () => {
    const secret = 'PROMPT-SECRET-8723';
    DIAG.lastTail = secret;
    DIAG.probe = 'textarea[aria-label="private selector"]';
    DIAG.errors = [`https://chatgpt.com/c/private?token=${secret}`];
    const input = document.createElement('textarea');
    input.id = 'private-composer';
    document.body.appendChild(input);
    SelectorMemory.learn('input', input);

    const report = Reporter.capture('SEND-002', secret);
    const serialized = JSON.stringify(report.envelope);
    const human = report.text;

    expect(report.kind).toBe('SEND-002');
    expect(serialized).toContain('"capabilities"');
    expect(serialized).toContain('"learnedKinds":["input"]');
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('private-composer');
    expect(serialized).not.toContain('chatgpt.com/c/');
    expect(serialized).not.toContain('Mozilla/5.0 test');
    expect(human).not.toContain(secret);
    expect(human).toContain('excludes prompts');
    input.remove();
  });

  test('does not silently upload or prefill an issue body', () => {
    Reporter.capture('COMPOSER-001');
    const url = Reporter.issueURL();
    expect(url).toContain('/issues/new?title=');
    expect(url).not.toContain('&body=');
    expect(src).not.toContain('REPORT_WORKER_URL');
    expect(src).not.toContain('sendWorker(');
  });

  test('capture persists only the redacted envelope locally', () => {
    Reporter.capture('SEND-001', 'do-not-store-this-detail');
    const stored = GM_getValue('lastDiagnostic', '');
    expect(stored).toContain('gitl.diagnostic.v1');
    expect(stored).not.toContain('do-not-store-this-detail');
  });
});

describe('timeline storage boundary', () => {
  beforeEach(() => {
    Timeline._cache = null;
    GM_setValue('gitlTimeline', '[]');
  });

  test('retains numeric/boolean/enumerated metadata and drops raw strings', () => {
    Timeline.record('send_failed', {
      code: 'SEND-001',
      stage: 'dispatch',
      round: 4,
      ok: false,
      error: 'https://example.test/c/private?token=secret',
      sel: '#private-composer',
      prompt: 'private task text'
    });
    const data = Timeline.all().at(-1).data;
    expect(data).toEqual({ code: 'SEND-001', stage: 'dispatch', round: 4, ok: false });
  });

  test('network events expose byte counts, never response content', () => {
    let detail = null;
    GITL_NET.bus.addEventListener('gitl:net', e => { detail = e.detail; }, { once: true });
    GITL_NET._emit(42, false);
    expect(detail).toEqual(expect.objectContaining({ bytes: 42, isDone: false }));
    expect(detail).not.toHaveProperty('raw');
    expect(GITL_NET).not.toHaveProperty('lastChunk');
    expect(GITL_NET).not.toHaveProperty('lastComplete');
  });
});

describe('UI and listener safety', () => {
  test('report UI provides review, copy, download, and reviewed bug actions', () => {
    expect(src).toContain('Review redacted contents');
    expect(src).toContain('id="g-rep-copy"');
    expect(src).toContain('id="g-rep-dl"');
    expect(src).toContain('Review &amp; report bug');
  });

  test('drag handlers are installed once and use Pointer Events', () => {
    const drag = src.match(/function bindDrag\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(drag).toContain('if (_dragBound) return;');
    expect(drag).toContain("'pointerdown'");
    expect(drag).toContain("'pointermove'");
    expect(drag).toContain("'pointerup'");
    expect(drag).not.toContain("'mousemove'");
  });
});

describe('visible Stop preserves state; Reset is separate', () => {
  test('Stop pauses without erasing round/progress', () => {
    GHOST.loop.state = 'RUNNING';
    GHOST.loop.needsPayload = false;
    GHOST.loop.round = 7;
    stopLoop();
    expect(GHOST.loop.state).toBe('PAUSED');
    expect(GHOST.loop.round).toBe(7);
    expect(GHOST.loop.needsPayload).toBe(false);
  });

  test('Reset clears the run for a fresh start', () => {
    GHOST.loop.state = 'PAUSED';
    GHOST.loop.needsPayload = false;
    GHOST.loop.round = 7;
    resetLoop();
    expect(GHOST.loop.state).toBe('IDLE');
    expect(GHOST.loop.round).toBe(0);
    expect(GHOST.loop.needsPayload).toBe(true);
  });
});
