/**
 * WORKSHOP TESTS (v7.1)
 * Community-content layer: custom personas + workflows, import/export.
 * Focus is SAFETY — this is the only path that ingests untrusted external
 * files, so the validator + caps + built-in protection are the priority.
 */

function freshWorkshop() {
  // Each test starts from an empty custom store.
  Workshop.personas = {};
  Workshop.workflows = {};
  return Workshop;
}

describe('Workshop — module shape', () => {
  test('exposes the expected API', () => {
    expect(typeof Workshop.importBundle).toBe('function');
    expect(typeof Workshop.exportBundle).toBe('function');
    expect(typeof Workshop.addPersona).toBe('function');
    expect(typeof Workshop.addWorkflow).toBe('function');
    expect(typeof allPersonas).toBe('function');
    expect(typeof allWorkflows).toBe('function');
  });
});

describe('Workshop — merge accessors', () => {
  test('built-ins always present in merged personas', () => {
    freshWorkshop();
    const all = allPersonas();
    expect(all).toHaveProperty('researcher');
    expect(all).toHaveProperty('none');
  });

  test('custom items appear alongside built-ins', () => {
    const W = freshWorkshop();
    const id = W.addPersona('My Lens', 'Adopt a custom lens for testing.');
    expect(allPersonas()[id]).toBeDefined();
    expect(allPersonas()[id].custom).toBe(true);
    expect(allPersonas().researcher).toBeDefined(); // built-in still there
  });
});

describe('Workshop — built-in protection (cannot overwrite)', () => {
  test('import using a built-in persona id does NOT replace the built-in', () => {
    freshWorkshop();
    const originalInject = PERSONA_LIBRARY.researcher.inject;
    const res = Workshop.importBundle(JSON.stringify({
      schema: 'gitl-workshop/1',
      personas: [{ id: 'researcher', label: 'Hijacked', inject: 'malicious override' }]
    }));
    expect(res.ok).toBe(true);
    // built-in untouched
    expect(PERSONA_LIBRARY.researcher.inject).toBe(originalInject);
    expect(allPersonas().researcher.inject).toBe(originalInject);
    // the imported item got a renamed id instead
    expect(res.renamed).toBeGreaterThanOrEqual(1);
  });

  test('import using a built-in workflow id does NOT replace the built-in', () => {
    freshWorkshop();
    const original = WORKFLOW_LIBRARY.deep_research.stages.length;
    const res = Workshop.importBundle(JSON.stringify({
      personas: [],
      workflows: [{ id: 'deep_research', label: 'Hijacked', stages: ['only one stage'] }]
    }));
    expect(res.ok).toBe(true);
    expect(WORKFLOW_LIBRARY.deep_research.stages.length).toBe(original);
  });
});

describe('Workshop — validation rejects malformed input', () => {
  test('non-JSON is rejected', () => {
    freshWorkshop();
    expect(Workshop.importBundle('not json {').ok).toBe(false);
  });

  test('wrong schema is rejected', () => {
    freshWorkshop();
    const res = Workshop.importBundle(JSON.stringify({ schema: 'something-else/9', personas: [{label:'x',inject:'y'}] }));
    expect(res.ok).toBe(false);
  });

  test('empty bundle is rejected', () => {
    freshWorkshop();
    expect(Workshop.importBundle(JSON.stringify({ personas: [], workflows: [] })).ok).toBe(false);
  });

  test('persona missing inject is skipped, not imported', () => {
    freshWorkshop();
    const res = Workshop.importBundle(JSON.stringify({
      personas: [{ label: 'No Inject' }, { label: 'Good', inject: 'valid framing here' }]
    }));
    expect(res.ok).toBe(true);
    expect(res.personas).toBe(1);
    expect(res.skipped).toBe(1);
  });

  test('workflow with empty stages is skipped', () => {
    freshWorkshop();
    const res = Workshop.importBundle(JSON.stringify({
      workflows: [{ label: 'Empty', stages: [] }, { label: 'Good', stages: ['do a thing'] }]
    }));
    expect(res.ok).toBe(true);
    expect(res.workflows).toBe(1);
    expect(res.skipped).toBe(1);
  });
});

describe('Workshop — caps & limits', () => {
  test('oversized file rejected before parse', () => {
    freshWorkshop();
    const huge = 'x'.repeat(WORKSHOP_LIMITS.fileBytes + 1);
    expect(Workshop.importBundle(huge).ok).toBe(false);
  });

  test('too many items rejected', () => {
    freshWorkshop();
    const personas = Array.from({ length: WORKSHOP_LIMITS.maxItems + 1 }, (_, i) => ({ label: 'p' + i, inject: 'framing ' + i }));
    expect(Workshop.importBundle(JSON.stringify({ personas })).ok).toBe(false);
  });

  test('long fields are truncated to limits', () => {
    freshWorkshop();
    const res = Workshop.importBundle(JSON.stringify({
      personas: [{ label: 'L'.repeat(500), inject: 'I'.repeat(99999) }]
    }));
    expect(res.ok).toBe(true);
    const added = Object.values(Workshop.personas)[0];
    expect(added.label.length).toBeLessThanOrEqual(WORKSHOP_LIMITS.label);
    expect(added.inject.length).toBeLessThanOrEqual(WORKSHOP_LIMITS.inject);
  });

  test('workflow stage count capped', () => {
    freshWorkshop();
    const stages = Array.from({ length: WORKSHOP_LIMITS.stages + 10 }, (_, i) => 'stage ' + i);
    const res = Workshop.importBundle(JSON.stringify({ workflows: [{ label: 'Big', stages }] }));
    expect(res.ok).toBe(true);
    const added = Object.values(Workshop.workflows)[0];
    expect(added.stages.length).toBeLessThanOrEqual(WORKSHOP_LIMITS.stages);
  });
});

describe('Workshop — clash auto-rename among customs', () => {
  test('two customs with same label get distinct ids', () => {
    const W = freshWorkshop();
    const id1 = W.addPersona('Same Name', 'first');
    const id2 = W.addPersona('Same Name', 'second');
    expect(id1).not.toBe(id2);
    expect(Object.keys(W.personas).length).toBe(2);
  });
});

describe('Workshop — export round-trip', () => {
  test('exported bundle re-imports to equivalent items', () => {
    const W = freshWorkshop();
    W.addPersona('Lens A', 'framing a');
    W.addWorkflow('Flow A', 'desc a', ['step one', 'step two']);
    const bundle = W.exportBundle();

    // wipe and re-import
    W.personas = {}; W.workflows = {};
    const res = W.importBundle(bundle);
    expect(res.ok).toBe(true);
    expect(res.personas).toBe(1);
    expect(res.workflows).toBe(1);
    expect(Object.values(W.personas)[0].inject).toBe('framing a');
    expect(Object.values(W.workflows)[0].stages).toEqual(['step one', 'step two']);
  });

  test('export contains the schema tag', () => {
    const W = freshWorkshop();
    W.addPersona('X', 'y');
    const parsed = JSON.parse(W.exportBundle());
    expect(parsed.schema).toBe('gitl-workshop/1');
  });
});
