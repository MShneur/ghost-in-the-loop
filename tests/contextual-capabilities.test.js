/**
 * CONTEXT-AWARE ADAPTER CAPABILITY STATES
 */
describe('context-aware capability model', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    GHOST.loop.state = 'IDLE';
    GHOST.loop.phase = 'idle';
    GHOST.loop.sendTxn = null;
    Reporter.last = null;
    Reporter._seen.clear();
    Timeline._cache = null;
    GM_setValue('gitlTimeline', '[]');
    GM_setValue('lastDiagnostic', '');
  });

  test('idle conditional controls are truthful, not failures', () => {
    const c = capabilityState({
      runtimeState: 'IDLE', phase: 'idle', input: {}, send: null, stop: null,
      assistantCount: 0, selectedAnswer: null, composerHasText: false,
      generating: false, dispatching: false, reviewedEnter: false
    });
    expect(c.states).toEqual({
      input: 'ready', read: 'missing',
      send: 'latent-empty-composer', stop: 'idle-absent'
    });
    expect(c.requiredMissing).toEqual([]);
    expect(c.adapterFailure).toBe(false);
  });

  test('known generation without Stop is a required failure', () => {
    const c = capabilityState({
      runtimeState: 'RUNNING', phase: 'generating', input: {}, send: null, stop: null,
      assistantCount: 1, selectedAnswer: { text: 'answer' }, composerHasText: false,
      generating: true, dispatching: false
    });
    expect(c.states.stop).toBe('missing-during-generation');
    expect(c.requiredMissing).toContain('stop');
    expect(c.adapterFailure).toBe(true);
  });

  test('dispatch without required composer or Send is a required failure', () => {
    const c = capabilityState({
      runtimeState: 'RUNNING', phase: 'dispatching', input: null, send: null, stop: null,
      assistantCount: 1, selectedAnswer: { text: 'answer' }, composerHasText: true,
      generating: false, dispatching: true, inputRequired: true, sendRequired: true, reviewedEnter: false
    });
    expect(c.states.input).toBe('missing');
    expect(c.states.send).toBe('missing-when-required');
    expect(c.requiredMissing).toEqual(expect.arrayContaining(['input', 'send']));
    expect(c.adapterFailure).toBe(true);
  });

  test('reader ambiguity is explicit when candidates exist but none is selectable', () => {
    const c = capabilityState({
      runtimeState: 'RUNNING', phase: 'reading', input: {}, send: {}, stop: null,
      assistantCount: 2, selectedAnswer: null, composerHasText: false,
      readRequired: true, generating: false, dispatching: false
    });
    expect(c.states.read).toBe('ambiguous');
    expect(c.requiredMissing).toContain('read');
  });
});

describe('contextual diagnostic reporting', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    GHOST.loop.state = 'IDLE';
    GHOST.loop.phase = 'idle';
    GHOST.loop.sendTxn = null;
    Reporter.last = null;
    Reporter._seen.clear();
    Timeline._cache = null;
    GM_setValue('gitlTimeline', '[]');
    GM_setValue('lastDiagnostic', '');
  });

  test('idle absence of Send and Stop does not emit ADAPTER-001', () => {
    const report = Reporter.capture('probe_fail');
    expect(report).toBeNull();
    expect(Reporter.last).toBeNull();
    expect(GM_getValue('lastDiagnostic', '')).toBe('');
  });

  test('required missing capability still emits ADAPTER-001', () => {
    GHOST.loop.state = 'RUNNING';
    GHOST.loop.phase = 'dispatching';
    const report = Reporter.capture('probe_fail');
    expect(report).not.toBeNull();
    expect(report.kind).toBe('ADAPTER-001');
    expect(report.envelope.capabilities.requiredMissing).toContain('input');
  });

  test('diagnostic envelope and human report use contextual states', () => {
    const report = Reporter.capture('MANUAL-001');
    expect(report.envelope.capabilities).toEqual(expect.objectContaining({
      input: 'missing',
      read: 'missing',
      send: 'ready',
      stop: 'idle-absent',
      requiredMissing: []
    }));
    expect(report.text).toContain('send:ready');
    expect(report.text).toContain('stop:idle-absent');
    expect(report.text).toContain('| Required now | none |');
  });
});
