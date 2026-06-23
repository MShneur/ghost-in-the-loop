/**
 * STRUCTURE TESTS
 * Verifies all S0-S5 modules are present in the userscript
 * and key safety invariants haven't been removed.
 */
const fs   = require('fs');
const path = require('path');
const src  = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

const has = (str) => src.includes(str);

describe('S0 — Boot safety', () => {
  test('safeBoot function present',         () => expect(has('function safeBoot')).toBe(true));
  test('GITL_TAB_ID defined',               () => expect(has('const GITL_TAB_ID')).toBe(true));
  test('claimTabLock function present',     () => expect(has('function claimTabLock')).toBe(true));
  test('releaseTabLock function present',   () => expect(has('function releaseTabLock')).toBe(true));
  test('assertInteractionSafe present',     () => expect(has('function assertInteractionSafe')).toBe(true));
  test('beforeunload cleanup present',      () => expect(has('beforeunload')).toBe(true));
  test('boot wrapped in safeBoot',          () => expect(has('safeBoot(() =>')).toBe(true));
});

describe('S1 — Network interceptor', () => {
  test('GITL_NET object present',           () => expect(has('const GITL_NET')).toBe(true));
  test('AI_ENDPOINTS array present',        () => expect(has('AI_ENDPOINTS')).toBe(true));
  test('fetch proxy present',               () => expect(has('window.fetch = async function')).toBe(true));
  test('XHR proxy present',                 () => expect(has('XMLHttpRequest.prototype.open')).toBe(true));
  test('ChatGPT endpoint covered',          () => expect(has('/backend-api/conversation')).toBe(true));
  test('Claude endpoint covered',           () => expect(has('/api/organizations')).toBe(true));
  test('gitl:net event emitted',            () => expect(has("'gitl:net'")).toBe(true));
});

describe('S2 — Selector doctor', () => {
  test('platformHealth function present',   () => expect(has('function platformHealth')).toBe(true));
  test('health badge (🟢) in code',         () => expect(has('🟢')).toBe(true));
  test('health badge (🟡) in code',         () => expect(has('🟡')).toBe(true));
  test('health badge (🔴) in code',         () => expect(has('🔴')).toBe(true));
  test('health badge shown in panel header',() => expect(has('platformHealth().badge')).toBe(true));
});

describe('S3 — Timeline', () => {
  test('Timeline object present',           () => expect(has('const Timeline')).toBe(true));
  test('Timeline.record used in boot',      () => expect(has("Timeline.record('boot'")).toBe(true));
  test('Timeline.record used in send_ok',   () => expect(has("Timeline.record('send_ok'")).toBe(true));
  test('Timeline.record used in halt',      () => expect(has("Timeline.record('halt'")).toBe(true));
  test('Timeline capped at 500 events',     () => expect(has('500')).toBe(true));
});

describe('S4 — Recovery engine + GhostBus', () => {
  test('RecoveryEngine present',            () => expect(has('const RecoveryEngine')).toBe(true));
  test('recoverSend method present',        () => expect(has('recoverSend')).toBe(true));
  test('GhostBus present',                  () => expect(has('const GhostBus')).toBe(true));
  test('BroadcastChannel used',             () => expect(has('BroadcastChannel')).toBe(true));
  test('RecoveryEngine wired into engineSend', () => expect(has('RecoveryEngine.recoverSend')).toBe(true));
  test('GhostBus.init called at boot',      () => expect(has('GhostBus.init()')).toBe(true));
  test('Handoff not auto-injected (security)', () => {
    // The received handoff must be STORED not auto-sent
    expect(has('pendingHandoff')).toBe(true);
    // Must NOT call injectText on receive without user action
    const receiveFn = src.match(/case 'handoff'[\s\S]{0,300}/)?.[0] || '';
    expect(receiveFn).not.toContain('injectText');
  });
});

describe('S5 — Capsule v2', () => {
  test('gitlSha256 function present',       () => expect(has('async function gitlSha256')).toBe(true));
  test('buildCapsuleV2 function present',   () => expect(has('async function buildCapsuleV2')).toBe(true));
  test('exportCapsuleV2 function present',  () => expect(has('async function exportCapsuleV2')).toBe(true));
  test('capsule v2 schema string present',  () => expect(has('gitl.capsule.v2')).toBe(true));
  test('SHA-256 dedup uses Set',            () => expect(has('const seen = new Set')).toBe(true));
  test('Capsule has resume token',          () => expect(has('continue_from_capsule')).toBe(true));
  test('Capsule UI button present',         () => expect(has('g-capsule')).toBe(true));
});

describe('Core invariants', () => {
  test('HALT-first invariant in detectSignal', () => {
    // The halt return must appear before the proceed return in the function
    const fnMatch = src.match(/function detectSignal[\s\S]+?^}/m);
    const fn = fnMatch ? fnMatch[0] : '';
    const hIdx = fn.indexOf("signal: 'halt'");
    const pIdx = fn.indexOf("signal: 'proceed'");
    expect(hIdx).toBeGreaterThan(-1);
    expect(pIdx).toBeGreaterThan(-1);
    expect(hIdx).toBeLessThan(pIdx);
  });

  test('Unique sigils defined', () => {
    expect(has("SIGIL_PROCEED = '[[GITL::PROCEED]]'")).toBe(true);
    expect(has("SIGIL_HALT    = '[[GITL::HALT]]'")).toBe(true);
  });

  test('send lock prevents re-entry', () => {
    expect(has('L.isSending')).toBe(true);
  });

  test('randomDelay anti-automation present', () => {
    expect(has('function randomDelay')).toBe(true);
  });

  test('No eval() usage', () => {
    // eval is a security risk
    const evalUsage = src.match(/\beval\s*\(/g);
    expect(evalUsage).toBeNull();
  });

  test('No innerHTML on user-controlled text in UI', () => {
    // assistantText or lastText must not be spliced directly into innerHTML
    const dangerPattern = /innerHTML\s*=.*(?:lastText|getLastText|assistantText)/;
    expect(dangerPattern.test(src)).toBe(false);
  });
});

describe('Own-UI exclusion (Replit e2e finding)', () => {
  const fs2 = require('fs');
  const path2 = require('path');
  const code = fs2.readFileSync(path2.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

  test('_isOwnUI helper exists', () => {
    expect(code).toContain('function _isOwnUI');
  });

  test('_isOwnUI checks #gitl ancestor', () => {
    const fn = code.match(/function _isOwnUI[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain("closest('#gitl')");
  });

  test('_q excludes own UI elements', () => {
    const fn = code.match(/function _q\(key, sels\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('_isOwnUI');
  });

  test('_qAll excludes own UI elements', () => {
    const fn = code.match(/function _qAll\(sels\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('_isOwnUI');
  });

  test('mountPanel removes stray existing #gitl', () => {
    const fn = code.match(/function mountPanel\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain("getElementById('gitl')");
  });
});
