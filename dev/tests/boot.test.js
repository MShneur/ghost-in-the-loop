/**
 * BOOT SAFETY TESTS (regression for Replit-found bug)
 *
 * Bug: GM_addStyle and document.body.appendChild ran at top level
 * during script eval. At document-start, document.head/body are null,
 * causing "Cannot read properties of null (reading 'appendChild')"
 * which halted the script before any GM_setValue.
 *
 * These tests do STATIC analysis of the source to ensure DOM
 * mutations that need head/body are deferred into safeBoot().
 */
const fs   = require('fs');
const path = require('path');
const src  = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

/* Extract the IIFE body, excluding function bodies, to find TRUE
   top-level statements. We approximate by checking that risky calls
   are wrapped in a function declaration, not bare at module scope. */

describe('Boot safety — no unguarded top-level DOM mutation', () => {
  test('GM_addStyle is NOT called at top level', () => {
    // GM_addStyle should only appear inside injectStyles(), never bare.
    // A bare top-level call would match /^GM_addStyle\(/m
    const bareCall = /^GM_addStyle\s*\(/m.test(src);
    expect(bareCall).toBe(false);
  });

  test('GM_addStyle is wrapped in injectStyles()', () => {
    expect(src).toContain('function injectStyles()');
    const fn = src.match(/function injectStyles\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('GM_addStyle');
  });

  test('injectStyles has head/documentElement fallback', () => {
    const fn = src.match(/function injectStyles\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('document.head || document.documentElement');
  });

  test('panel appendChild is NOT at top level', () => {
    // Bare "document.body.appendChild(panel)" at module scope = bug
    const bareAppend = /^document\.body\.appendChild\(panel\)/m.test(src);
    expect(bareAppend).toBe(false);
  });

  test('panel attach is wrapped in mountPanel()', () => {
    expect(src).toContain('function mountPanel()');
    const fn = src.match(/function mountPanel\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('document.body.appendChild(panel)');
  });

  test('mountPanel guards against null body', () => {
    const fn = src.match(/function mountPanel\(\)[\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('!document.body');
  });

  test('injectStyles + mountPanel are called inside safeBoot', () => {
    // Capture from safeBoot(() => { to the final }); before the IIFE close
    const bootBlock = src.match(/safeBoot\(\(\)\s*=>\s*\{[\s\S]*?\n\}\);/)?.[0] || '';
    expect(bootBlock).toContain('injectStyles()');
    expect(bootBlock).toContain('mountPanel()');
    // both must precede render()
    expect(bootBlock.indexOf('injectStyles()')).toBeLessThan(bootBlock.indexOf('render()'));
    expect(bootBlock.indexOf('mountPanel()')).toBeLessThan(bootBlock.indexOf('render()'));
  });

  test('safeBoot checks document.body before running', () => {
    const fn = src.match(/function safeBoot\([\s\S]*?\n}/)?.[0] || '';
    expect(fn).toContain('!document.body');
    expect(fn).toContain('requestAnimationFrame');
  });

  test('idempotency guards present (no double-injection)', () => {
    expect(src).toContain('_stylesInjected');
    expect(src).toContain('_panelMounted');
  });
});
