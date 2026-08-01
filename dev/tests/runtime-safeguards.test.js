/**
 * RUNTIME SAFEGUARDS — policy, ambiguity, exact staging, and dry-run.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function visible(el) {
  el.getBoundingClientRect = () => ({
    width: 320, height: 48, top: 600, bottom: 648, left: 20, right: 340
  });
  return el;
}

function removeFixtures() {
  document.querySelectorAll('[data-safety-fixture]').forEach(el => el.remove());
}

afterEach(() => {
  removeFixtures();
  GHOST.ui.automationEnabled = true;
  GHOST.ui.dryRun = false;
  GHOST.loop.state = 'IDLE';
  GHOST.loop.isSending = false;
  GHOST.loop.sendPending = false;
  GHOST.loop.sendTxn = null;
  GHOST.loop.dryRunPreview = '';
  GHOST.loop.conversationReviewRequired = false;
  SafetyPolicy.setGlobalEnabled(true);
  SafetyPolicy.setSiteEnabled(true);
  TeachStore._data = null;
  SelectorMemory._data = null;
  Reporter.last = null;
  GHOST.report = null;
  Ticker.stop();
  GM_setValue(_tabLockKey(), '');
  jest.restoreAllMocks();
});

describe('actuation policy', () => {
  test('global kill switch blocks actuation with a stable reason', () => {
    SafetyPolicy.setGlobalEnabled(false);
    const result = assertInteractionSafe();
    expect(result).toEqual({ ok: false, reason: 'automation-disabled' });
  });

  test('per-site disable blocks even a reviewed adapter', () => {
    SafetyPolicy.setGlobalEnabled(true);
    SafetyPolicy.setSiteEnabled(false);
    const result = assertInteractionSafe();
    expect(result).toEqual({ ok: false, reason: 'site-not-enabled' });
  });

  test('the running tick re-checks policy before any page actuation', () => {
    const start = src.indexOf('function engineTick()');
    const end = src.indexOf('// ── At-most-once send observation', start);
    const preflight = src.slice(start, end);
    expect(preflight).toContain('SafetyPolicy.globalEnabled()');
    expect(preflight).toContain('SafetyPolicy.siteEnabled()');
    expect(preflight).toContain("_pauseForSafety('SAFETY-001'");
  });

  test('conversation-change review is checked before tick actuation', () => {
    const start = src.indexOf('function engineTick()');
    const end = src.indexOf('// ── At-most-once send observation', start);
    expect(src.slice(start, end)).toContain('L.conversationReviewRequired');
    expect(src).toContain('L.conversationReviewRequired=false');
  });

  test('generic/custom adapters default off until explicitly enabled', () => {
    GM_setValue(SafetyPolicy._siteKey(), null);
    expect(SafetyPolicy.siteEnabled(false)).toBe(false);
    SafetyPolicy.setSiteEnabled(true);
    expect(SafetyPolicy.siteEnabled(false)).toBe(true);
  });
});

describe('dry-run', () => {
  test('captures the exact command and pauses without touching the composer', async () => {
    const input = visible(document.createElement('textarea'));
    input.dataset.safetyFixture = 'dry';
    input.value = 'user draft';
    document.body.appendChild(input);
    const inject = jest.spyOn(Adapter, 'injectText');

    GHOST.ui.dryRun = true;
    GHOST.loop.state = 'RUNNING';
    SafetyPolicy.setGlobalEnabled(false); // simulation remains non-actuating
    const result = await engineSend('Exact\nnext command', true);

    expect(result).toBe(false);
    expect(inject).not.toHaveBeenCalled();
    expect(input.value).toBe('user draft');
    expect(GHOST.loop.dryRunPreview).toBe('Exact\nnext command');
    expect(GHOST.loop.sendTxn).toBeNull();
    expect(GHOST.loop.state).toBe('PAUSED');
  });
});

describe('exact staged-text verification', () => {
  test('textarea content must be byte-for-byte equal', () => {
    const input = visible(document.createElement('textarea'));
    input.dataset.safetyFixture = 'exact';
    document.body.appendChild(input);

    input.value = 'Line 1\nLine 2';
    expect(_stagedPromptMatches(input, 'Line 1\nLine 2')).toBe(true);
    expect(_stagedPromptMatches(input, 'Line 1\nLine 2\n')).toBe(false);
    expect(_stagedPromptMatches(input, 'Line 1\nline 2')).toBe(false);
  });

  test('contenteditable must be live and exactly equal', () => {
    const input = visible(document.createElement('div'));
    input.dataset.safetyFixture = 'exact-ce';
    input.contentEditable = 'true';
    input.setAttribute('contenteditable', 'true');
    input.textContent = 'Exact command';
    document.body.appendChild(input);

    expect(_stagedPromptMatches(input, 'Exact command')).toBe(true);
    input.remove();
    expect(_stagedPromptMatches(input, 'Exact command')).toBe(false);
  });

  test('engine pauses before journal creation when the staged text differs', async () => {
    jest.useFakeTimers();
    const originalHasFocus = document.hasFocus;
    try {
      document.hasFocus = () => true;
      const input = visible(document.createElement('textarea'));
      input.dataset.safetyFixture = 'engine-exact';
      document.body.appendChild(input);
      jest.spyOn(Adapter, 'isGenerating').mockReturnValue(false);
      jest.spyOn(Adapter, 'getInputForSend').mockReturnValue(input);
      jest.spyOn(Adapter, 'injectText').mockImplementation((_el, text) => {
        input.value = text + ' ';
        return true;
      });
      GHOST.loop.state = 'RUNNING';
      SafetyPolicy.setGlobalEnabled(true);
      SafetyPolicy.setSiteEnabled(true);

      const pending = engineSend('Exact command', true);
      await jest.advanceTimersByTimeAsync(1000);
      const result = await pending;

      expect(result).toBe(false);
      expect(GHOST.loop.sendTxn).toBeNull();
      expect(GHOST.loop.state).toBe('PAUSED');
      expect(Reporter.last.kind).toBe('COMPOSER-002');
    } finally {
      document.hasFocus = originalHasFocus;
      jest.useRealTimers();
    }
  });
});

describe('composer ambiguity', () => {
  test('two matches at the active configured tier fail closed', () => {
    for (let i = 0; i < 2; i++) {
      const input = visible(document.createElement('textarea'));
      input.id = 'prompt-textarea';
      input.dataset.safetyFixture = `composer-${i}`;
      document.body.appendChild(input);
    }

    expect(Adapter.getInputForSend()).toBeNull();
    expect(Adapter.inputResolution()).toEqual({
      status: 'ambiguous', count: 2, source: 'profile'
    });
  });

  test('a unique narrow tier wins without guessing among broader fallbacks', () => {
    const exact = visible(document.createElement('textarea'));
    exact.id = 'prompt-textarea';
    exact.dataset.safetyFixture = 'composer-exact';
    document.body.appendChild(exact);
    const broad = visible(document.createElement('textarea'));
    broad.dataset.safetyFixture = 'composer-broad';
    document.body.appendChild(broad);

    expect(Adapter.getInputForSend()).toBe(exact);
    expect(Adapter.inputResolution().status).toBe('unique');
  });

  test('open-shadow composer matches are also required to be unique', () => {
    for (let i = 0; i < 2; i++) {
      const host = document.createElement('div');
      host.dataset.safetyFixture = `shadow-host-${i}`;
      const root = host.attachShadow({ mode: 'open' });
      const input = visible(document.createElement('textarea'));
      input.id = 'prompt-textarea';
      root.appendChild(input);
      document.body.appendChild(host);
    }

    expect(Adapter.getInputForSend()).toBeNull();
    expect(Adapter.inputResolution()).toEqual({
      status: 'ambiguous', count: 2, source: 'profile'
    });
  });

  test('light-DOM and open-shadow matches are resolved as one tier', () => {
    const light = visible(document.createElement('textarea'));
    light.id = 'prompt-textarea';
    light.dataset.safetyFixture = 'light-composer';
    document.body.appendChild(light);

    const host = document.createElement('div');
    host.dataset.safetyFixture = 'mixed-shadow-host';
    const root = host.attachShadow({ mode: 'open' });
    const shadow = visible(document.createElement('textarea'));
    shadow.id = 'prompt-textarea';
    root.appendChild(shadow);
    document.body.appendChild(host);

    expect(Adapter.getInputForSend()).toBeNull();
    expect(Adapter.inputResolution()).toEqual({
      status: 'ambiguous', count: 2, source: 'profile'
    });
  });

  test('a learned selector that drifts to multiple elements is forgotten', () => {
    for (let i = 0; i < 2; i++) {
      const input = visible(document.createElement('textarea'));
      input.setAttribute('aria-label', 'Shared composer');
      input.dataset.safetyFixture = `learned-${i}`;
      document.body.appendChild(input);
    }
    SelectorMemory._data = {
      'chatgpt.com': { input: { sel: 'textarea[aria-label="Shared composer"]', at: Date.now() } }
    };

    expect(SelectorMemory.lookup('input')).toBeNull();
    expect(SelectorMemory._data['chatgpt.com']).toBeUndefined();
  });

  test('a taught composer selector that drifts to multiple elements cannot resolve', () => {
    for (let i = 0; i < 2; i++) {
      const input = visible(document.createElement('textarea'));
      input.dataset.taughtComposer = 'shared';
      input.dataset.safetyFixture = `taught-composer-${i}`;
      document.body.appendChild(input);
    }
    TeachStore.set('input', 'textarea[data-taught-composer="shared"]');

    expect(TeachStore.matchEl('input')).toBeNull();
  });
});

describe('Send ambiguity', () => {
  test('multiple reviewed candidates pause authority instead of falling through', () => {
    TeachStore.forget('send');
    for (let i = 0; i < 2; i++) {
      const button = visible(document.createElement('button'));
      button.dataset.testid = 'send-button';
      button.dataset.safetyFixture = `send-${i}`;
      document.body.appendChild(button);
    }

    expect(_reviewedSend()).toBeNull();
    expect(Adapter.sendResolution()).toEqual({
      status: 'ambiguous', count: 2, source: 'profile'
    });
  });

  test('one control matching several reviewed selectors is deduplicated', () => {
    const button = visible(document.createElement('button'));
    button.dataset.testid = 'send-button';
    button.setAttribute('aria-label', 'Send');
    button.type = 'submit';
    button.dataset.safetyFixture = 'send-one';
    document.body.appendChild(button);

    expect(_reviewedSend()).toBe(button);
    expect(Adapter.sendResolution()).toEqual({
      status: 'unique', count: 1, source: 'profile'
    });
  });

  test('a taught Send selector that drifts to multiple controls cannot resolve', () => {
    for (let i = 0; i < 2; i++) {
      const button = visible(document.createElement('button'));
      button.dataset.taughtSend = 'shared';
      button.setAttribute('aria-label', 'Send');
      button.dataset.safetyFixture = `taught-send-${i}`;
      document.body.appendChild(button);
    }
    TeachStore.set('send', 'button[data-taught-send="shared"]');

    expect(TeachStore.matchEl('send')).toBeNull();
  });
});

describe('pre-journal ordering contract', () => {
  test('all new gates complete before the at-most-once journal opens', () => {
    const start = src.indexOf('async function engineSend');
    const end = src.indexOf('function _confirmSend', start);
    const send = src.slice(start, end);
    const begin = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');

    expect(send.indexOf('_sendContextUnchanged(sendContext)')).toBeGreaterThan(-1);
    expect(send.indexOf('_stagedPromptMatches(input, text)')).toBeGreaterThan(-1);
    expect(send.indexOf("sendResolution.status === 'ambiguous'")).toBeGreaterThan(-1);
    expect(send.indexOf('_stagedPromptMatches(input, text)')).toBeLessThan(begin);
    expect(send.indexOf("sendResolution.status === 'ambiguous'")).toBeLessThan(begin);
    const afterBegin = send.slice(begin);
    expect((afterBegin.match(/strategy\.run\(\);/g) || []).length).toBe(1);
  });
});
