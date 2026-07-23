/**
 * CANARY DIAGNOSTIC TOOL — static guards (v8.2.0)
 * The canary's whole value is being an INDEPENDENT, TT-safe probe. These
 * lock in the properties that make it trustworthy on a page like Gemini.
 */
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '../diagnostics/gitl-canary.user.js'), 'utf8');

describe('Execution canary', () => {
  test('is a valid userscript (has a UserScript header + version)', () => {
    expect(SRC).toMatch(/\/\/ ==UserScript==/);
    expect(SRC).toMatch(/\/\/ @version\s+\d+\.\d+\.\d+/);
  });

  test('is Trusted-Types-safe: no innerHTML string sinks', () => {
    // The canary must work on Gemini (require-trusted-types-for 'script'),
    // which is exactly what broke Ghost. Building via DOM APIs is mandatory.
    expect(SRC).not.toMatch(/\.innerHTML\s*=/);
    expect(SRC).not.toMatch(/insertAdjacentHTML/);
    expect(SRC).not.toMatch(/outerHTML\s*=/);
    expect(SRC).not.toMatch(/document\.write/);
  });

  test('stays independent of Ghost core (no GITL_* / GHOST references)', () => {
    // It reports ON Ghost by reading the DOM beacon, but must not depend on
    // any of Ghost's internals — that independence is the point.
    expect(SRC).not.toMatch(/\bGITL_NET\b/);
    expect(SRC).not.toMatch(/\bGHOST\b\./);
    // It DOES read Ghost's public DOM signals.
    expect(SRC).toContain('data-gitl-boot');
    expect(SRC).toContain("getElementById('gitl')");
  });

  test('mounts its host on documentElement (survives body replacement)', () => {
    expect(SRC).toContain('attachShadow');
    expect(SRC).toContain('html.appendChild(host)');
  });

  test('creates stable incidents for missing injection, failed boot, and missing panel', () => {
    expect(SRC).toContain("code: 'INJECT-001'");
    expect(SRC).toContain("code: 'BOOT-001'");
    expect(SRC).toContain("code: 'BOOT-003'");
    expect(SRC).toContain('elapsed >= 15000');
  });

  test('redacted reports never include full URLs, raw UA, exception text, or stacks', () => {
    const reportFn = SRC.match(/function report\(\)[\s\S]*?\n  }/)?.[0] || '';
    expect(reportFn).not.toContain('location.href');
    expect(reportFn).not.toContain('userAgent:');
    expect(SRC).not.toContain('value.message');
    expect(SRC).not.toContain('.stack');
    expect(SRC).not.toContain('href: location.href');
  });

  test('supports local review/download and opens GitHub without a diagnostic body', () => {
    expect(SRC).toContain('Download JSON');
    expect(SRC).toContain('Review & report bug');
    expect(SRC).toContain('application/json');
    expect(SRC).toContain('/issues/new?title=');
    expect(SRC).not.toContain('&body=');
  });
});
