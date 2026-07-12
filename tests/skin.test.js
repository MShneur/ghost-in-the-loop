/**
 * SKIN TESTS (d6)
 * Token-based theme engine. Focus areas:
 *  1. SAFETY — skins are untrusted files; the validator must strip anything
 *     executable or structural (url(), braces, @import, javascript:).
 *  2. COMPATIBILITY — unknown tokens/fx are dropped, never fatal, so skins
 *     written for other GITL versions still load.
 *  3. NON-INTERFERENCE — apply() only sets custom properties + data-fx-*
 *     attributes on the panel root; it cannot alter structure.
 */

const panelEl = () => document.getElementById('gitl');

function resetSkinState() {
  GHOST.ui.skinTheme  = 'classic';
  GHOST.ui.customSkin = '';
  GHOST.ui.accentHue  = NaN;
  SKIN.apply();
}

afterEach(resetSkinState);

describe('SKIN — module shape', () => {
  test('exposes the expected API', () => {
    expect(typeof SKIN.validate).toBe('function');
    expect(typeof SKIN.apply).toBe('function');
    expect(typeof SKIN.resolve).toBe('function');
    expect(typeof SKIN.hueShift).toBe('function');
    expect(typeof SKIN.importFile).toBe('function');
    expect(typeof SKIN.exportCurrent).toBe('function');
  });

  test('ships the thirteen built-in presets', () => {
    expect(Object.keys(SKIN_PRESETS)).toEqual(
      ['classic','aurora','glass','metal','neon','clay','liquid','oled','paper','hud','nova','ion','flow']);
  });
});

describe('SKIN — validator safety', () => {
  test('rejects non-JSON strings', () => {
    expect(SKIN.validate('not json {').ok).toBe(false);
  });

  test('rejects oversized files', () => {
    const big = JSON.stringify({ kind:'skin', name:'x'.repeat(9000) });
    expect(SKIN.validate(big).ok).toBe(false);
  });

  test('rejects arrays and wrong kinds', () => {
    expect(SKIN.validate('[]').ok).toBe(false);
    expect(SKIN.validate({ kind:'persona' }).ok).toBe(false);
  });

  test('drops url() values (no network exfiltration)', () => {
    const r = SKIN.validate({ kind:'skin', tokens:{ '--g-bg':'url(https://evil.example/x.png)' } });
    expect(r.ok).toBe(true);
    expect(r.skin.tokens['--g-bg']).toBeUndefined();
    expect(r.dropped).toBe(1);
  });

  test('drops values containing braces/semicolons (no rule escape)', () => {
    const r = SKIN.validate({ kind:'skin', tokens:{
      '--g-bg':'#000}#gitl .g-tab{display:none', '--g-text':'#fff;position:fixed' } });
    expect(Object.keys(r.skin.tokens)).toHaveLength(0);
    expect(r.dropped).toBe(2);
  });

  test('drops @import and javascript: payloads', () => {
    const r = SKIN.validate({ kind:'skin', tokens:{
      '--g-bg':'@import "x.css"', '--g-text':'javascript:alert(1)' } });
    expect(Object.keys(r.skin.tokens)).toHaveLength(0);
  });

  test('sanitizes the skin name against markup injection', () => {
    const r = SKIN.validate({ kind:'skin', name:'<img src=x onerror=alert(1)>Cool"Skin' });
    expect(r.skin.name).not.toMatch(/[<>&"'`]/);
    expect(r.skin.name.length).toBeLessThanOrEqual(40);
  });

  test('accepts a clean skin and keeps valid tokens', () => {
    const r = SKIN.validate({ kind:'skin', name:'Mint', tokens:{
      '--g-accent':'#4ade80', '--g-shadow':'0 4px 12px rgba(0,0,0,.4)' }, fx:{ ghost:'float' } });
    expect(r.ok).toBe(true);
    expect(r.skin.tokens['--g-accent']).toBe('#4ade80');
    expect(r.skin.fx.ghost).toBe('float');
    expect(r.dropped).toBe(0);
  });
});

describe('SKIN — cross-version compatibility', () => {
  test('unknown tokens from other versions are dropped, not fatal', () => {
    const r = SKIN.validate({ kind:'skin', tokens:{
      '--g-accent':'#4ade80', '--g-hologram':'on', '--g-v12-widget-tint':'#123456' } });
    expect(r.ok).toBe(true);
    expect(r.skin.tokens['--g-accent']).toBe('#4ade80');
    expect(r.dropped).toBe(2);
  });

  test('unknown fx values are dropped, not fatal', () => {
    const r = SKIN.validate({ kind:'skin', fx:{ border:'lasers', ghost:'float' } });
    expect(r.ok).toBe(true);
    expect(r.skin.fx.ghost).toBe('float');
    expect(r.skin.fx.border).toBeUndefined();
  });
});

describe('SKIN — preset integrity', () => {
  test('every preset only uses registered tokens and valid fx', () => {
    for (const [id, p] of Object.entries(SKIN_PRESETS)) {
      for (const k of Object.keys(p.tokens)) expect(SKIN_TOKENS).toHaveProperty([k]);
      for (const [fk, fv] of Object.entries(p.fx || {}))
        expect(SKIN_FX[fk]).toContain(fv);
      const r = SKIN.validate({ kind:'skin', name:p.name, tokens:p.tokens, fx:p.fx });
      expect(r.ok).toBe(true);
      expect(r.dropped).toBe(0);
    }
  });
});

describe('SKIN — hue math', () => {
  test('hueShift preserves the color\u2019s own saturation/lightness', () => {
    const [, s, l] = SKIN._hexToHsl('#818cf8');
    expect(SKIN.hueShift('#818cf8', 200)).toBe(`hsl(200 ${s}% ${l}%)`);
  });

  test('hueShift normalizes hue into 0-359 and passes non-hex through', () => {
    expect(SKIN.hueShift('#818cf8', 380)).toMatch(/^hsl\(20 /);
    expect(SKIN.hueShift('transparent', 200)).toBe('transparent');
    expect(SKIN.hueShift('0 4px 12px rgba(0,0,0,.4)', 200)).toBe('0 4px 12px rgba(0,0,0,.4)');
  });
});

describe('SKIN — apply/resolve behavior', () => {
  test('preset apply sets tokens and fx attributes on the panel root only', () => {
    GHOST.ui.skinTheme = 'neon';
    SKIN.apply();
    const p = panelEl();
    expect(p.style.getPropertyValue('--g-accent')).toBe('#22d3ee');
    expect(p.dataset.fxGhost).toBe('flicker');
    expect(p.dataset.fxBorder).toBe('glow');
    expect(p.dataset.fxTabs).toBe('pill');
    expect(p.dataset.fxProgress).toBe('ekg');
  });

  test('switching back to classic clears overrides and fx', () => {
    GHOST.ui.skinTheme = 'aurora';
    SKIN.apply();
    expect(panelEl().dataset.fxBorder).toBe('aurora');
    GHOST.ui.skinTheme = 'classic';
    SKIN.apply();
    const p = panelEl();
    expect(p.style.getPropertyValue('--g-accent')).toBe('');
    expect(p.dataset.fxBorder).toBeUndefined();
    expect(p.dataset.fxGhost).toBeUndefined();
  });

  test('accent hue override rotates the four accent tokens', () => {
    GHOST.ui.skinTheme = 'classic';
    GHOST.ui.accentHue = 120;
    SKIN.apply();
    const p = panelEl();
    expect(p.style.getPropertyValue('--g-accent')).toMatch(/^hsl\(120 /);
    expect(p.style.getPropertyValue('--g-accent-bg')).toMatch(/^hsl\(120 /);
  });

  test('untouched slider (NaN) leaves preset accents alone', () => {
    GHOST.ui.skinTheme = 'glass';
    GHOST.ui.accentHue = NaN;
    SKIN.apply();
    expect(panelEl().style.getPropertyValue('--g-accent')).toBe('#7dd3fc');
  });

  test('custom skin resolves from stored JSON; invalid falls back to Classic', () => {
    GHOST.ui.skinTheme  = 'custom';
    GHOST.ui.customSkin = JSON.stringify({ kind:'skin', name:'Mint',
      tokens:{ '--g-accent':'#4ade80' } });
    expect(SKIN.resolve().name).toBe('Mint');
    SKIN.apply();
    expect(panelEl().style.getPropertyValue('--g-accent')).toBe('#4ade80');
    GHOST.ui.customSkin = '{broken';
    expect(SKIN.resolve().name).toBe('Classic');
  });

  test('baseHue reports the active skin\u2019s native accent hue', () => {
    GHOST.ui.skinTheme = 'classic';
    expect(SKIN.baseHue()).toBe(SKIN._hexToHsl(SKIN_TOKENS['--g-accent'])[0]);
  });
});
