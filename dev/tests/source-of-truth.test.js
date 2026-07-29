/**
 * Canonical-source release guards.
 *
 * The old dev/ tree duplicated the product, package manifest, and test suite.
 * Parallel Jest workers could therefore execute different GITL versions in
 * one run. These checks keep the userscript canonical and the extension
 * artifact deterministic.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

describe('canonical source tree', () => {
  test('there is no shadow dev product tree', () => {
    expect(fs.existsSync(path.join(ROOT, 'dev'))).toBe(false);
  });

  test('the committed extension artifact matches the canonical userscript', () => {
    const result = spawnSync(process.execPath, ['scripts/build-extension.js', '--check'], {
      cwd: ROOT,
      encoding: 'utf8'
    });
    expect(result.status).toBe(0);
  });

  test('Jest is scoped to the canonical root test directory', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.jest.roots).toEqual(['<rootDir>/tests']);
  });
});
