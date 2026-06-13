/**
 * VERSION CONSISTENCY TESTS
 * Ensures @version header, VER constant, manifest, and
 * CHANGELOG all agree — catches accidental version drift.
 */
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const script      = fs.readFileSync(path.join(ROOT, 'ghost-in-the-loop.user.js'), 'utf8');
const manifest    = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension/manifest.json'), 'utf8'));
const changelog   = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

const headerMatch = script.match(/\/\/ @version\s+(\S+)/);
const verMatch    = script.match(/const VER\s*=\s*'([^']+)'/);
const guardMatch  = script.match(/window\.__GITL_V(\d+)__/);

describe('Version consistency', () => {
  test('@version header is present', () => {
    expect(headerMatch).not.toBeNull();
  });

  test('VER constant is present', () => {
    expect(verMatch).not.toBeNull();
  });

  test('@version header matches VER constant', () => {
    expect(headerMatch[1]).toBe(verMatch[1]);
  });

  test('@version matches manifest.json version', () => {
    expect(headerMatch[1]).toBe(manifest.version);
  });

  test('CHANGELOG has entry for current version', () => {
    const ver = headerMatch[1];
    expect(changelog).toContain(`## [${ver}]`);
  });

  test('window guard matches major version', () => {
    const major = headerMatch[1].split('.')[0];
    expect(guardMatch[1]).toBe(major);
  });

  test('manifest run_at is document_idle', () => {
    const cs = manifest.content_scripts[0];
    expect(cs.run_at).toBe('document_idle');
  });

  test('manifest has gecko browser_specific_settings', () => {
    expect(manifest.browser_specific_settings?.gecko?.id).toBeTruthy();
  });
});
