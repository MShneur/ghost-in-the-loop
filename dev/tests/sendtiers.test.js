/**
 * SEND TIER LADDER — TRUTH TABLE (v8.7.0 — Track F)
 *
 * Proves the two load-bearing properties of the ladder:
 *   1. For every combination of available mechanisms, the selector picks
 *      EXACTLY ONE — taught > reviewed button > reviewed Enter > reviewed
 *      form — and every tier below the winner stays inert.
 *   2. Selection always completes BEFORE the at-most-once journal opens, and
 *      exactly one dispatch site exists per mechanism, so no path can fire
 *      twice (backups are pre-journal selection, never post-dispatch
 *      escalation).
 *
 * The harness boots the IIFE on hostname chatgpt.com, so PLAT is the real
 * ChatGPT profile object (mutations in these tests are restored afterwards).
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('tier selection truth table', () => {
  const chatgpt = PROFILES.chatgpt;
  const origFallback = chatgpt.dispatchFallback;
  const origMatchEl = TeachStore.matchEl;
  let input;

  beforeEach(() => {
    document.body.innerHTML = '';
    input = document.createElement('div');
    input.setAttribute('contenteditable', 'true');
    input.id = 'prompt-textarea';
    document.body.appendChild(input);
    TeachStore.matchEl = () => null;           // nothing taught
    chatgpt.dispatchFallback = origFallback;   // 'enter'
  });
  afterAll(() => {
    TeachStore.matchEl = origMatchEl;
    chatgpt.dispatchFallback = origFallback;
    document.body.innerHTML = '';
  });

  // Tier 1 — a human-taught control outranks everything (the user pointed at
  // it for this host), and it is still just one click.
  test('taught control present → taught-send, exactly one click', () => {
    let clicks = 0;
    const btn = { click() { clicks++; } };
    TeachStore.matchEl = () => btn;
    const s = _selectSendStrategy(btn, input);
    expect(s.path).toBe('taught-send');
    s.run();
    expect(clicks).toBe(1);
  });

  // Tier 2 — unique reviewed button (nothing taught): one click, no Enter.
  test('reviewed button, nothing taught → reviewed-button, click only', () => {
    let clicks = 0, keys = 0;
    const btn = { click() { clicks++; } };
    input.addEventListener('keydown', () => keys++);
    const s = _selectSendStrategy(btn, input);
    expect(s.path).toBe('reviewed-button');
    s.run();
    expect(clicks).toBe(1);
    expect(keys).toBe(0);
  });

  // Tier 3 — no button: reviewed Enter where the adapter opts in. Exactly one
  // keydown — never keypress/keyup (a single dispatch, not a key storm).
  test('no button, enter opt-in → reviewed-enter, exactly one keydown', () => {
    let keys = 0;
    input.addEventListener('keydown', () => keys++);
    const s = _selectSendStrategy(null, input);
    expect(s.path).toBe('reviewed-enter');
    s.run();
    expect(keys).toBe(1);
  });

  // Tier 4 — no button, adapter opts into form submit, composer uniquely
  // wrapped by one veto-safe form: requestSubmit fires exactly once.
  test('no button, form opt-in + unique form → reviewed-form, one requestSubmit', () => {
    chatgpt.dispatchFallback = 'form';
    const form = document.createElement('form');
    document.body.appendChild(form);
    form.appendChild(input);
    let submits = 0;
    form.requestSubmit = () => { submits++; };
    const s = _selectSendStrategy(null, input);
    expect(s.path).toBe('reviewed-form');
    s.run();
    expect(submits).toBe(1);
  });

  test('form opt-in but composer NOT wrapped in a form → no strategy', () => {
    chatgpt.dispatchFallback = 'form';
    expect(_selectSendStrategy(null, input)).toBeNull();
  });

  test('form opt-in but the form reads unsafe (search surface) → no strategy', () => {
    chatgpt.dispatchFallback = 'form';
    const form = document.createElement('form');
    form.id = 'site-search';
    document.body.appendChild(form);
    form.appendChild(input);
    expect(_uniqueComposerForm(input)).toBeNull();
    expect(_selectSendStrategy(null, input)).toBeNull();
  });

  // Priority rows: a higher tier always beats a lower available one.
  test('button present + form opt-in → button wins (lower tier inert)', () => {
    chatgpt.dispatchFallback = 'form';
    const form = document.createElement('form');
    document.body.appendChild(form);
    form.appendChild(input);
    let submits = 0, clicks = 0;
    form.requestSubmit = () => { submits++; };
    const s = _selectSendStrategy({ click() { clicks++; } }, input);
    expect(s.path).toBe('reviewed-button');
    s.run();
    expect(clicks).toBe(1);
    expect(submits).toBe(0);
  });

  test('enter opt-in + form available → enter wins (declared order)', () => {
    // An adapter declares ONE dispatchFallback, so 'enter' here means form is
    // not declared; even with a form present, enter is the picked tier.
    const form = document.createElement('form');
    document.body.appendChild(form);
    form.appendChild(input);
    let submits = 0, keys = 0;
    form.requestSubmit = () => { submits++; };
    input.addEventListener('keydown', () => keys++);
    const s = _selectSendStrategy(null, input);
    expect(s.path).toBe('reviewed-enter');
    s.run();
    expect(keys).toBe(1);
    expect(submits).toBe(0);
  });

  test('unreviewed platform → no strategy at any tier', () => {
    const reviewed = chatgpt.reviewed;
    chatgpt.reviewed = false;
    try {
      expect(_selectSendStrategy(null, input)).toBeNull();
      chatgpt.dispatchFallback = 'form';
      const form = document.createElement('form');
      document.body.appendChild(form);
      form.appendChild(input);
      expect(_selectSendStrategy(null, input)).toBeNull();
    } finally {
      chatgpt.reviewed = reviewed;
    }
  });
});

describe('ladder structure (source contracts)', () => {
  const ladder = body('_selectSendStrategy', '_beginSendAttempt');
  const send = body('engineSend', '_confirmSend');

  test('tier order in source: taught → button → enter → form', () => {
    const taughtAt = ladder.indexOf("taught-send");
    const buttonAt = ladder.indexOf("reviewed-button");
    const enterAt = ladder.indexOf("dispatchFallback === 'enter'");
    const formAt = ladder.indexOf("dispatchFallback === 'form'");
    expect(taughtAt).toBeGreaterThan(-1);
    expect(buttonAt).toBeGreaterThan(taughtAt);
    expect(enterAt).toBeGreaterThan(buttonAt);
    expect(formAt).toBeGreaterThan(enterAt);
  });

  test('one dispatch site per mechanism across the whole script', () => {
    // Single occurrences = single possible dispatch per selected tier.
    expect((src.match(/form\.requestSubmit\(\)/g) || []).length).toBe(1);
    expect((src.match(/=> btn\.click\(\)/g) || []).length).toBe(1);
    expect((ladder.match(/new KeyboardEvent\('keydown'/g) || []).length).toBe(1);
  });

  test('engineSend runs the chosen strategy exactly once, after the journal opens', () => {
    expect((send.match(/strategy\.run\(\)/g) || []).length).toBe(1);
    const beginAt = send.indexOf('_beginSendAttempt(strategy.path, input)');
    const runAt = send.indexOf('strategy.run()');
    expect(runAt).toBeGreaterThan(beginAt);
    // And never a second actuator anywhere after the first run call
    expect(send.slice(runAt)).not.toContain('.click()');
    expect(send.slice(runAt)).not.toContain('requestSubmit');
    expect(send.slice(runAt)).not.toContain('KeyboardEvent');
  });

  test('the form tier ships INERT: no adapter declares dispatchFallback form yet', () => {
    // The tier is machinery + tests only. A real adapter opts in only after
    // its form-submit is verified on the live site (see DEVLOG v8.4.2 for the
    // double-send history this caution comes from).
    expect((src.match(/dispatchFallback:\s*'form'/g) || []).length).toBe(0);
  });

  test('a disabled reviewed Send control is a distinct loud failure (SEND-003)', () => {
    expect(send).toContain('_disabledReviewedSendCount() > 0');
    expect(send).toContain("Reporter.capture('SEND-003'");
  });
});
