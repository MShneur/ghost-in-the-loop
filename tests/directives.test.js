/**
 * DIRECTIVE DELIVERY TESTS (d11)
 *
 * Basic mode is intentionally workflow-neutral. Persona, posture, strategy,
 * roadmap, and committee shortcuts are delivered only after the user enables
 * Advanced. Advanced directives are still delivered exactly once per run and
 * re-armed when the selection changes.
 */

beforeEach(() => {
  GHOST.persona.selected = ['none'];
  GHOST.persona.perTask = false;
  GHOST.persona._delivered = false;
  GHOST.loop.posture = 'standard';
  GHOST.loop.payloadMode = 'loop';
  GHOST.ui.runAdv = false;
  GHOST.ui.committeeProceed = false;
});

describe('runDirectives — Basic boundary', () => {
  test('Basic preserves the user workflow and injects only control markers', () => {
    GHOST.persona.selected = ['redteam', 'customer'];
    GHOST.loop.posture = 'evolving';
    GHOST.loop.payloadMode = 'think';
    const out = runDirectives(true);
    expect(out).toContain('[Ghost control protocol]');
    expect(out).toContain('[[GITL::PROCEED]]');
    expect(out).toContain('[[GITL::CHOICE]]');
    expect(out).toContain('[[GITL::HALT]]');
    expect(out).not.toContain('[Active persona]');
    expect(out).not.toContain('committee of 2 expert perspectives');
    expect(out).not.toContain(PAYLOADS.think.inject);
    expect(out).not.toContain(POSTURES.evolving.clause);
  });

  test('Basic never reports stored directives as pending', () => {
    GHOST.persona.selected = ['builder'];
    expect(hasPendingDirectives()).toBe(false);
  });
});

describe('runDirectives — Advanced composition', () => {
  beforeEach(() => { GHOST.ui.runAdv = true; });

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

  test('carries the selected posture clause', () => {
    GHOST.loop.posture = 'evolving';
    expect(runDirectives(false)).toContain(POSTURES.evolving.clause);
  });

  test('arms the committee P shortcut automatically for a real Advanced committee', () => {
    expect(runDirectives(false)).not.toContain('Recommended by committee');
    GHOST.persona.selected = ['researcher', 'redteam'];
    expect(runDirectives(false)).toContain('Recommended by committee');
  });
});

describe('hasPendingDirectives — Advanced once-per-run delivery', () => {
  beforeEach(() => { GHOST.ui.runAdv = true; });

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

  test('ending a run re-arms delivery for the next Advanced run', () => {
    GHOST.persona.selected = ['builder'];
    GHOST.persona._delivered = true;
    resetLoop();
    expect(GHOST.persona._delivered).toBe(false);
    expect(hasPendingDirectives()).toBe(true);
  });
});

describe('committee run from the Personas tab', () => {
  beforeEach(() => { GHOST.ui.runAdv = true; });

  test('an Advanced committee armed but not delivered is pending', () => {
    GHOST.persona.selected = ['researcher', 'redteam', 'devil', 'customer', 'executive', 'builder'];
    expect(GHOST.persona._delivered).toBe(false);
    expect(hasPendingDirectives()).toBe(true);
    const directives = runDirectives(false);
    expect(directives).toContain('committee of 6 expert perspectives');
    expect(directives.length).toBeGreaterThan(200);
  });

  test('changing the selection mid-run re-arms Advanced delivery', () => {
    GHOST.persona.selected = ['builder'];
    GHOST.persona._delivered = true;
    expect(hasPendingDirectives()).toBe(false);
    GHOST.persona._delivered = false;
    GHOST.persona.selected = ['builder', 'redteam'];
    expect(hasPendingDirectives()).toBe(true);
  });
});
