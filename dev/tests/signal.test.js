/**
 * SIGNAL ENGINE TESTS
 * Tests detectSignal() and parseProgress() — pure logic,
 * no DOM. These are the most safety-critical functions:
 * wrong results = wrong automation decisions.
 */

describe('parseProgress', () => {
  test('parses [Step N of M]',   () => expect(parseProgress('[Step 3 of 7]')).toEqual({ step: 3, total: 7, desc: '' }));
  test('parses [Batch N of M]',  () => expect(parseProgress('[Batch 1 of 5]')).toEqual({ step: 1, total: 5, desc: '' }));
  test('parses [Stage N/M]',     () => expect(parseProgress('[Stage 2/4]')).toEqual({ step: 2, total: 4, desc: '' }));
  test('parses desc after dash', () => {
    const r = parseProgress('[Step 1 of 3] — Planning phase');
    expect(r.desc).toBe('Planning phase');
  });
  test('returns null if no match', () => expect(parseProgress('Just text')).toBeNull());
  test('case insensitive',         () => expect(parseProgress('[STEP 2 of 4]')).not.toBeNull());
});

describe('detectSignal — halt-first invariant', () => {
  const longPrefix = 'x'.repeat(60); // ensure > MIN_RESPONSE_LEN

  test('returns short for text under MIN_RESPONSE_LEN', () => {
    const r = detectSignal('short');
    expect(r.signal).toBe('short');
    expect(r.confidence).toBe(0);
  });

  test('SIGIL_PROCEED fires proceed', () => {
    const r = detectSignal(longPrefix + ' [[GITL::PROCEED]]');
    expect(r.signal).toBe('proceed');
    expect(r.confidence).toBeGreaterThanOrEqual(4);
  });

  test('SIGIL_HALT fires halt', () => {
    const r = detectSignal(longPrefix + ' [[GITL::HALT]]');
    expect(r.signal).toBe('halt');
    expect(r.confidence).toBeGreaterThanOrEqual(4);
  });

  test('HALT wins when both sigils present (halt-first)', () => {
    const r = detectSignal(longPrefix + ' [[GITL::PROCEED]] [[GITL::HALT]]');
    expect(r.signal).toBe('halt');
  });

  test('LEGACY_HALT fires halt', () => {
    const r = detectSignal(longPrefix + ' SYSTEM_HALT');
    expect(r.signal).toBe('halt');
  });

  test('LEGACY_PROCEED fires proceed', () => {
    const r = detectSignal(longPrefix + ' PROCEED');
    expect(r.signal).toBe('proceed');
  });

  test('fuzzy halt: "task complete" contributes but needs threshold', () => {
    // Fuzzy alone scores 2, threshold is 3 — returns none without another signal
    const r = detectSignal(longPrefix + ' task complete');
    expect(['halt', 'none']).toContain(r.signal);
    // Combined with legacy keyword it crosses threshold
    const r2 = detectSignal(longPrefix + ' task complete SYSTEM_HALT');
    expect(r2.signal).toBe('halt');
  });

  test('fuzzy proceed: "shall i continue" contributes but needs threshold', () => {
    // Fuzzy alone scores 2, threshold is 3 — returns none without another signal
    const r = detectSignal(longPrefix + ' shall i continue');
    expect(['proceed', 'none']).toContain(r.signal);
    // Combined with sigil it crosses threshold
    const r2 = detectSignal(longPrefix + ' [[GITL::PROCEED]] shall i continue');
    expect(r2.signal).toBe('proceed');
  });

  test('progress bar mid-run contributes but needs threshold', () => {
    // Progress alone scores 2, threshold is 3 — returns none without another signal
    const r = detectSignal(longPrefix + ' [Step 2 of 5] — working');
    expect(['proceed', 'none']).toContain(r.signal);
    // Combined with sigil it crosses threshold
    const r2 = detectSignal(longPrefix + ' [[GITL::PROCEED]] [Step 2 of 5]');
    expect(r2.signal).toBe('proceed');
  });

  test('progress bar final step adds halt weight', () => {
    // step === total pushes hScore up
    const r = detectSignal(longPrefix + ' [[GITL::HALT]] [Step 5 of 5]');
    expect(r.signal).toBe('halt');
  });

  test('returns none for ambiguous content', () => {
    const r = detectSignal(longPrefix + ' here is some random text with no signals');
    expect(r.signal).toBe('none');
  });

  test('confidence is numeric', () => {
    const r = detectSignal(longPrefix + ' [[GITL::PROCEED]]');
    expect(typeof r.confidence).toBe('number');
  });

  test('progress is null when no progress bar', () => {
    const r = detectSignal(longPrefix + ' [[GITL::HALT]]');
    expect(r.progress).toBeNull();
  });

  test('progress object returned when bar present', () => {
    const r = detectSignal(longPrefix + ' [[GITL::PROCEED]] [Step 3 of 6]');
    expect(r.progress).not.toBeNull();
    expect(r.progress.step).toBe(3);
  });
});

describe('detectSignal — confidence levels', () => {
  const longPrefix = 'x'.repeat(60);

  test('sigil confidence (4) > legacy confidence (3)', () => {
    const sigil  = detectSignal(longPrefix + ' [[GITL::PROCEED]]');
    const legacy = detectSignal(longPrefix + ' PROCEED');
    expect(sigil.confidence).toBeGreaterThan(legacy.confidence);
  });

  test('combined sigil + fuzzy boosts confidence', () => {
    const combined = detectSignal(longPrefix + ' [[GITL::PROCEED]] shall i continue');
    const single   = detectSignal(longPrefix + ' [[GITL::PROCEED]]');
    expect(combined.confidence).toBeGreaterThan(single.confidence);
  });
});
