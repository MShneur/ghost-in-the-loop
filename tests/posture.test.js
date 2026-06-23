/**
 * POSTURE TESTS (v8.0)
 * Thinking postures (Standard / Evolving / Extended) are an expansion-permission
 * clause appended to whichever payload mode runs. The three differ ONLY in how
 * expansion is permitted; the ceiling stop-condition attaches to the expanding
 * two but not to Standard.
 */

describe('Postures — structure', () => {
  test('all three postures exist with required fields', () => {
    for (const key of ['standard', 'evolving', 'extended']) {
      expect(POSTURES[key]).toBeDefined();
      expect(typeof POSTURES[key].label).toBe('string');
      expect(typeof POSTURES[key].desc).toBe('string');
      expect(typeof POSTURES[key].clause).toBe('string');
      expect(POSTURES[key].clause.length).toBeGreaterThan(20);
    }
  });

  test('labels match the product naming', () => {
    expect(POSTURES.standard.label).toBe('Standard');
    expect(POSTURES.evolving.label).toBe('Evolving');
    expect(POSTURES.extended.label).toBe('Extended');
  });
});

describe('Postures — semantic distinction', () => {
  test('Standard locks the plan (no additions)', () => {
    const c = POSTURES.standard.clause.toLowerCase();
    expect(c).toMatch(/do not add|locked|fixed/);
  });

  test('Evolving permits justified mid-run additions', () => {
    const c = POSTURES.evolving.clause.toLowerCase();
    expect(c).toMatch(/may add/);
    expect(c).toMatch(/why needed|justif/);     // justification gate
    expect(c).toMatch(/only if|only when/);     // conditional, not default
  });

  test('Extended is an end-of-run coverage check', () => {
    const c = POSTURES.extended.clause.toLowerCase();
    expect(c).toMatch(/after/);
    expect(c).toMatch(/coverage check|gap/);
    expect(c).toMatch(/no material gaps|smallest step/);
  });

  test('Evolving and Extended clauses are genuinely different', () => {
    expect(POSTURES.evolving.clause).not.toBe(POSTURES.extended.clause);
  });
});

describe('Postures — ceiling stop-condition', () => {
  test('ceiling text exists and references stopping on the limit', () => {
    expect(POSTURE_CEILING.toLowerCase()).toMatch(/ceiling|limit/);
    expect(POSTURE_CEILING.toLowerCase()).toMatch(/stop/);
  });

  // Mirrors startLoop: ceiling appended to expanding postures, not Standard.
  function composed(postureKey) {
    const p = POSTURES[postureKey];
    return p.clause + (postureKey === 'standard' ? '' : POSTURE_CEILING);
  }

  test('Standard does NOT get the ceiling clause', () => {
    expect(composed('standard')).not.toContain(POSTURE_CEILING);
  });

  test('Evolving and Extended DO get the ceiling clause', () => {
    expect(composed('evolving')).toContain(POSTURE_CEILING);
    expect(composed('extended')).toContain(POSTURE_CEILING);
  });
});

describe('Postures — payload integration shape', () => {
  test('a composed payload contains both the mode inject and the posture clause', () => {
    const mode = PAYLOADS.loop.inject;
    const full = 'TASK' + mode + POSTURES.evolving.clause + POSTURE_CEILING;
    expect(full).toContain('Loop Mode');          // mode survived
    expect(full).toContain('Posture: EVOLVING');   // posture survived
    expect(full).toContain('Hard ceiling');        // guardrail survived
  });
});
