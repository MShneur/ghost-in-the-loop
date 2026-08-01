/**
 * EVIDENCE-GATED PRE-JOURNAL SEND LADDER
 *
 * The full 4-bit availability table is exercised with/without staging evidence
 * and with every selected actuator throwing/not throwing: 64 combinations.
 * Selection never dispatches. The caller fires the one returned actuator once.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

const TIERS = [
  ['reviewedButton', 'reviewed-button', 'B'],
  ['reviewedEnter', 'reviewed-enter', 'E'],
  ['reviewedForm', 'reviewed-form', 'F'],
  ['taughtControl', 'taught-control', 'T']
];

function expectedPath(mask, staged) {
  if (!staged) return null;
  const winner = TIERS.find((_, index) => mask & (1 << (3 - index)));
  return winner ? winner[1] : null;
}

const truthRows = [];
for (let mask = 0; mask < 16; mask++) {
  for (const staged of [false, true]) {
    for (const throws of [false, true]) {
      const availability = mask.toString(2).padStart(4, '0');
      truthRows.push({ mask, staged, throws, availability });
    }
  }
}

describe('exhaustive mechanism-selection truth table', () => {
  test.each(truthRows)(
    'B/E/F/T=$availability evidence=$staged throw=$throws',
    ({ mask, staged, throws }) => {
      const calls = Object.fromEntries(TIERS.map(([key]) => [key, 0]));
      const candidates = {};
      TIERS.forEach(([key, pathName], index) => {
        const available = !!(mask & (1 << (3 - index)));
        candidates[key] = available ? {
          path: pathName,
          run: () => {
            calls[key]++;
            if (throws) throw new Error('actuator failed');
          }
        } : null;
      });

      const selected = _selectSendMechanism(staged, candidates);
      const expected = expectedPath(mask, staged);
      expect(selected?.path || null).toBe(expected);

      if (selected) {
        try { selected.run(); } catch(_) {}
      }

      const dispatchCount = Object.values(calls).reduce((sum, count) => sum + count, 0);
      expect(dispatchCount).toBe(expected ? 1 : 0);
      expect(dispatchCount).toBeLessThanOrEqual(1);
      TIERS.forEach(([key, pathName]) => {
        expect(calls[key]).toBe(pathName === expected ? 1 : 0);
      });
    }
  );
});

describe('ladder authority and transaction wiring', () => {
  const send = body('engineSend', '_confirmSend');

  test('order is adapter button, explicit Enter, explicit form, then taught control', () => {
    expect(Array.from(SEND_MECHANISM_ORDER, pair => Array.from(pair))).toEqual([
      ['reviewedButton', 'reviewed-button'],
      ['reviewedEnter', 'reviewed-enter'],
      ['reviewedForm', 'reviewed-form'],
      ['taughtControl', 'taught-control']
    ]);
  });

  test('Enter remains explicit to the two reviewed adapters', () => {
    expect(PROFILES.chatgpt.dispatchFallback).toBe('enter');
    expect(PROFILES.perplexity.dispatchFallback).toBe('enter');
    expect((src.match(/dispatchFallback:\s*'enter'/g) || []).length).toBe(2);
  });

  test('requestSubmit is explicit to a reviewed form adapter and fail-closed', () => {
    expect(PROFILES.claude.submitForm).toEqual(['form']);
    const resolver = body('_submitFormLooksSafe', '_reviewedTaughtSend');
    expect(resolver).toContain("typeof form.requestSubmit !== 'function'");
    expect(resolver).toContain("input.closest('form') !== form");
    expect(resolver).toContain('forms.size === 1');
    expect(resolver).toContain('catch(_) { return false; }');
  });

  test('exact prompt evidence, selection, and final gate all precede the journal', () => {
    const stagedAt = send.indexOf('const staged = _composerHoldsPrompt(input, text)');
    const selectAt = send.indexOf('const strategy = _selectSendMechanism(staged');
    const evidenceAt = send.indexOf('const preDispatch = _preDispatchEvidence(input, text, strategy)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const runAt = send.indexOf('strategy.run();', beginAt);
    expect(stagedAt).toBeGreaterThan(-1);
    expect(selectAt).toBeGreaterThan(stagedAt);
    expect(evidenceAt).toBeGreaterThan(selectAt);
    expect(beginAt).toBeGreaterThan(evidenceAt);
    expect(runAt).toBeGreaterThan(beginAt);
  });

  test('heuristic and learned selectors never enter the actuator candidate set', () => {
    const candidateStart = send.indexOf('const strategy = _selectSendMechanism(staged');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const candidates = send.slice(candidateStart, beginAt);
    expect(candidates).not.toContain('_heurSend');
    expect(candidates).not.toContain('SelectorMemory');
    expect(candidates).toContain('reviewedComposer');
    expect(send.slice(send.indexOf('const staged ='), candidateStart)).toContain(
      'const taught = _reviewedTaughtSend()'
    );
  });

  test('after journal open there is one dispatch and no selection or escalation', () => {
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    const afterBegin = send.slice(beginAt);
    expect((afterBegin.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    expect(afterBegin).not.toContain('_selectSendMechanism');
    expect(afterBegin).not.toContain('requestSubmit');
    expect(afterBegin).not.toContain('send_escalate');
    expect(afterBegin).not.toContain('reviewed-paragraph');
  });

  test('a dispatch exception becomes uncertain without selecting another tier', () => {
    const runAt = send.indexOf('strategy.run()');
    const catchAt = send.indexOf('catch(_)', runAt);
    const uncertainAt = send.indexOf('_markSendUncertain()', catchAt);
    expect(catchAt).toBeGreaterThan(runAt);
    expect(uncertainAt).toBeGreaterThan(catchAt);
    expect(send.slice(catchAt, uncertainAt + 22)).not.toContain('_selectSendMechanism');
  });

  test('missing evidence or authority pauses before a transaction starts', () => {
    const noStrategyAt = send.indexOf('if (!strategy)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    expect(noStrategyAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(noStrategyAt);
    expect(send).toContain('Prompt staging could not be verified — nothing sent');
    expect(send).toContain('No safe Send mechanism — prompt left for manual review');
  });

  test('pre-dispatch evidence proves exact staging and re-resolves the chosen actuator', () => {
    const evidence = body('_preDispatchEvidence', '_settleSendPromise');
    expect(evidence).toContain('_composerRawText(input) === intended');
    expect(evidence).toContain('current === strategy.actuator');
    expect(evidence).toContain("PLAT.dispatchFallback === 'enter'");
    expect(evidence).toContain('_reviewedComposer(input) === input');
    expect(evidence).toContain('_reviewedSubmitForm(input) === strategy.actuator');
    expect(evidence).toContain('_reviewedTaughtSend() === strategy.actuator');
    expect(evidence).toContain('return { ok: composerExact && actuatorReady, composerExact, actuatorReady }');
  });

  test('failed evidence pauses before journal creation and cannot dispatch', () => {
    const gateAt = send.indexOf('if (!preDispatch.ok)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(strategy.path, input)');
    expect(gateAt).toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(beginAt);
    expect(send.slice(gateAt, beginAt)).toContain('pauseWithProbe(');
    expect(send.slice(gateAt, beginAt)).toContain('return false;');
    expect(send.slice(gateAt, beginAt)).not.toContain('strategy.run()');
  });
});

describe('staging and reviewed-form evidence', () => {
  test('prompt evidence is exact except for browser line-ending normalization', () => {
    expect(_composerHoldsPrompt({ value: 'alpha\r\nbeta' }, 'alpha\nbeta')).toBe(true);
    expect(_composerHoldsPrompt({ value: ' alpha\nbeta ' }, 'alpha\nbeta')).toBe(false);
    expect(_composerHoldsPrompt({ value: 'alpha beta' }, 'alpha  beta')).toBe(false);
    expect(_composerHoldsPrompt({ value: 'alpha' }, 'alpha!')).toBe(false);
    expect(_composerHoldsPrompt({ value: '' }, '')).toBe(false);
  });

  test('reviewed button authority requires one unique safe element', () => {
    const buttons = ['send-one', 'send-two'].map(id => {
      const button = document.createElement('button');
      button.id = id;
      button.setAttribute('aria-label', 'Send');
      button.getBoundingClientRect = () => ({
        width: 40, height: 40, top: 700, bottom: 740, left: 0, right: 40
      });
      document.body.appendChild(button);
      return button;
    });
    try {
      expect(_reviewedSend()).toBeNull();
      buttons[1].remove();
      expect(_reviewedSend()).toBe(buttons[0]);
    } finally {
      buttons.forEach(button => button.remove());
    }
  });

  test('form resolution requires an explicit reviewed list and direct wrapper', () => {
    const previous = PROFILES.chatgpt.submitForm;
    const form = document.createElement('form');
    const input = document.createElement('textarea');
    input.id = 'prompt-textarea';
    input.getBoundingClientRect = () => ({
      width: 300, height: 50, top: 700, bottom: 750, left: 0, right: 300
    });
    form.appendChild(input);
    document.body.appendChild(form);
    try {
      delete PROFILES.chatgpt.submitForm;
      expect(_reviewedSubmitForm(input)).toBeNull();
      PROFILES.chatgpt.submitForm = ['form'];
      expect(_reviewedSubmitForm(input)).toBe(form);
      form.setAttribute('target', '_blank');
      expect(_reviewedSubmitForm(input)).toBeNull();
    } finally {
      form.remove();
      if (previous === undefined) delete PROFILES.chatgpt.submitForm;
      else PROFILES.chatgpt.submitForm = previous;
    }
  });
});
