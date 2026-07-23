/**
 * TRANSACTIONAL, EXACT-SCHEMA CONFIG IMPORT
 */
function bundle(config, extra = {}) {
  return JSON.stringify({
    schema: 'gitl.config.v1',
    version: VER,
    exported: new Date().toISOString(),
    config,
    ...extra
  });
}

describe('_validateConfigBundle', () => {
  test('accepts bounded settings with the exact schema', () => {
    const r = _validateConfigBundle(bundle({
      maxRounds: 40,
      driftEnabled: true,
      payloadMode: 'roadmap',
      panelPosition: 'dock-left'
    }));
    expect(r.ok).toBe(true);
    expect(r.config.maxRounds).toBe(40);
  });

  test('rejects missing/wrong schemas and unknown top-level fields', () => {
    expect(_validateConfigBundle(JSON.stringify({ config:{maxRounds:20} })).ok).toBe(false);
    expect(_validateConfigBundle(JSON.stringify({ schema:'legacy', config:{maxRounds:20} })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({maxRounds:20}, { execute:'nope' })).ok).toBe(false);
  });

  test('rejects unknown keys and invalid types/ranges', () => {
    expect(_validateConfigBundle(bundle({ projectName:'private project' })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({ customSites:'{}' })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({ customPersonas:'{}' })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({ maxRounds:0 })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({ unattended:'yes' })).ok).toBe(false);
    expect(_validateConfigBundle(bundle({ panelPosition:'somewhere' })).ok).toBe(false);
  });

  test('config format excludes project, task, theme payload, adapter, and diagnostics data', () => {
    for (const key of [
      'projectName','projectSlug','rmSteps','qDraft','customPersonas',
      'customWorkflows','customSkin','customSites','lastDiagnostic'
    ]) {
      expect(CONFIG_KEYS).not.toContain(key);
    }
  });
});

describe('restoreConfig', () => {
  test('invalid bundle changes nothing', () => {
    GM_setValue('maxRounds', 20);
    const msg = restoreConfig(bundle({ maxRounds: 5000 }));
    expect(msg).toMatch(/Nothing changed/);
    expect(GM_getValue('maxRounds', 0)).toBe(20);
  });

  test('valid bundle commits all validated settings', () => {
    const msg = restoreConfig(bundle({ maxRounds: 35, driftEnabled:false }));
    expect(msg).toMatch(/Restored 2 settings/);
    expect(GM_getValue('maxRounds', 0)).toBe(35);
    expect(GM_getValue('driftEnabled', true)).toBe(false);
  });
});
