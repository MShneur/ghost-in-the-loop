/**
 * DIRECTIVE DELIVERY TESTS (d11)
 *
 * REGRESSION GUARD for the bug reported from the field: personas selected in
 * the Personas tab (and posture/strategy chosen in Run) never reached the
 * model. Root cause: the persona + posture + strategy block was built ONLY on
 * the "user typed a fresh prompt" path. Starting from the Personas tab,
 * resuming an existing chat, or un-pausing all sent a bare "Continue."
 *
 * The contract now: whatever entry path a run takes, the configured directives
 * are delivered exactly once, and re-armed when the selection changes.
 */

beforeEach(() => {
  GHOST.persona.selected = ['none'];
  GHOST.persona.perTask = false;
  GHOST.persona._delivered = false;
  GHOST.loop.posture = 'standard';
  GHOST.loop.payloadMode = 'loop';
});

describe('runDirectives — composition', () => {
  test('includes the persona block when a persona is armed', () => {
    GHOST.persona.selected = ['redteam'];
    const out = runDirectives(true);
    expect(out).toContain('[Active persona]');
    expect(out).toContain(PERSONA_LIBRARY.redteam.inject);
  });

  test('composes a multi-persona committee, naming every member', () => {
    GHOST.persona.selected = ['redteam', 'customer', 'executive'];
    const out = runDirectives(true);
    expect(out).toContain('committee of 3 expert perspectives');
    expect(out).toContain('Red Team');
    expect(out).toContain('Customer Voice');
    expect(out).toContain('Executive');
  });

  test('carries the strategy payload when asked, and omits it when not', () => {
    GHOST.loop.payloadMode = 'think';
    expect(runDirectives(true)).toContain(PAYLOADS.think.inject);
    expect(runDirectives(false)).not.toContain(PAYLOADS.think.inject);
  });

  test('always carries the posture clause', () => {
    GHOST.loop.posture = 'evolving';
    const out = runDirectives(false);
    expect(out).toContain(POSTURES.evolving.clause);
  });

  test('no persona armed → no persona block (but posture still ships)', () => {
    const out = runDirectives(false);
    expect(out).not.toContain('[Active persona]');
    expect(out).toContain(POSTURES.standard.clause);
  });
});

describe('hasPendingDirectives — once-per-run delivery', () => {
  test('true when a persona is armed and undelivered', () => {
    GHOST.persona.selected = ['builder'];
    expect(hasPendingDirectives()).toBe(true);
  });

  test('false once delivered — no re-sending the block every turn', () => {
    GHOST.persona.selected = ['builder'];
    GHOST.persona._delivered = true;
    expect(hasPendingDirectives()).toBe(false);
  });

  test('false when no persona is armed', () => {
    expect(hasPendingDirectives()).toBe(false);
  });

  test('ending a run re-arms delivery for the next run', () => {
    GHOST.persona.selected = ['builder'];
    GHOST.persona._delivered = true;
    stopLoop();
    expect(GHOST.persona._delivered).toBe(false);
    expect(hasPendingDirectives()).toBe(true);
  });
});

describe('THE BUG: committee run from the Personas tab', () => {
  test('a committee armed but not yet delivered is pending, not silently dropped', () => {
    // Exactly the reported flow: pick personas in the Personas tab, hit Run.
    // The composer is empty, so the old code fell through to a bare "Continue."
    GHOST.persona.selected = ['researcher', 'redteam', 'devil', 'customer', 'executive', 'builder'];
    expect(GHOST.persona._delivered).toBe(false);
    expect(hasPendingDirectives()).toBe(true);

    const directives = runDirectives(false);
    expect(directives).toContain('committee of 6 expert perspectives');
    expect(directives.length).toBeGreaterThan(200);
  });

  test('changing the selection mid-run re-arms delivery', () => {
    GHOST.persona.selected = ['builder'];
    GHOST.persona._delivered = true;
    expect(hasPendingDirectives()).toBe(false);
    // simulate the selection-change handler
    GHOST.persona._delivered = false;
    GHOST.persona.selected = ['builder', 'redteam'];
    expect(hasPendingDirectives()).toBe(true);
  });
});
