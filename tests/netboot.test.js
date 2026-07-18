/**
 * NETWORK INTERCEPTOR BOOT SAFETY (v8.1.3) — static/structural checks.
 * Real crash reproduction lives in tests/e2e/netboot.spec.js (frozen
 * window.fetch / XHR.prototype.send in an actual browser). These confirm
 * the source shape the e2e depends on, and the lastBootError surfacing.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('GITL_NET.install() is fault-tolerant end to end', () => {
  test('the fetch patch assignment is wrapped in try/catch', () => {
    expect(src).toContain("try { if (typeof origFetch === 'function') UW.fetch = async function(...args) {");
    expect(src).toContain("} catch(err) { console.warn('[GITL] fetch patch skipped:', err); }");
  });

  test('reading UW.fetch itself is guarded (a hardened getter could also throw)', () => {
    expect(src).toContain('let origFetch; try { origFetch = UW.fetch; } catch(_) { origFetch = null; }');
  });

  test('the XHR patch block is wrapped in try/catch', () => {
    expect(src).toContain("} catch(err) { console.warn('[GITL] XHR patch skipped:', err); }");
  });

  test('the WebSocket patch block is still wrapped (was already safe, must stay that way)', () => {
    expect(src).toContain("} catch(err) { console.warn('[GITL] WebSocket patch skipped:', err); }");
  });

  test('the whole install() method has an outer catch as a last resort', () => {
    expect(src).toContain('console.error(\'[GITL] Network interceptor failed to install — panel will still boot:\', err);');
    expect(src).toContain("_save('lastNetInstallError'");
  });

  test('the top-level call site is guarded too — it used to run outside safeBoot entirely', () => {
    expect(src).toContain('try { GITL_NET.install(); } catch(err) { console.error(');
  });
});

describe('A prior boot failure is surfaced instead of living silently in GM storage', () => {
  test('lastBootError is read back and pushed to DIAG on a later successful boot', () => {
    expect(src).toContain("const lastBoot = GM_getValue('lastBootError', '');");
    expect(src).toContain("DIAG.push('Previous page load failed to boot:");
  });

  test('lastNetInstallError is read back too', () => {
    expect(src).toContain("const lastNet  = GM_getValue('lastNetInstallError', '');");
  });

  test('both are cleared after surfacing once, so they do not repeat every boot', () => {
    expect(src).toMatch(/_save\('lastBootError', ''\)/);
    expect(src).toMatch(/_save\('lastNetInstallError', ''\)/);
  });
});
