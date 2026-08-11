'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  collectCurrentIdentity,
  validateRecord
} = require('../scripts/build-identity');

const ROOT = path.join(__dirname, '..');
const HEAD_A = 'a'.repeat(40);
const HEAD_B = 'b'.repeat(40);

function copy(relativePath, fixtureRoot) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function makeFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gitl-build-identity-'));
  for (const relativePath of [
    'package.json',
    'package-lock.json',
    'CHANGELOG.md',
    'ghost-in-the-loop.user.js',
    'extension/manifest.json',
    'extension/content.js',
    'extension/icon-48.png',
    'extension/icon-96.png',
    'scripts/build-extension.js',
    '.gitl/autopilot-state.json'
  ]) copy(relativePath, fixtureRoot);
  return fixtureRoot;
}

function mutateJson(filePath, mutator) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mutator(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('BUILD-IDENTITY oracle', () => {
  const fixtures = [];
  afterEach(() => {
    while (fixtures.length) fs.rmSync(fixtures.pop(), { recursive: true, force: true });
  });

  test('baseline candidate identity is internally consistent', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    const current = collectCurrentIdentity(fixture, { head: HEAD_A });
    expect(current.releaseTarget).toBe('8.8.0');
    expect(current.channels.candidate).toBe('agent/8.8-repair-resume');
    expect(current.channels.stable).toBe('main');
    expect(current.channels.publishReady).toBe(false);
    expect(current.payload).toHaveLength(5);
  });

  test('version-drift mutant fails visibly', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    mutateJson(path.join(fixture, 'extension/manifest.json'), (manifest) => {
      manifest.version = '8.8.1';
    });
    expect(() => collectCurrentIdentity(fixture, { head: HEAD_A })).toThrow(/Version mismatch/);
  });

  test('generated-content drift is killed by the existing generated-parity checker', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    const script = path.join(fixture, 'scripts/build-extension.js');
    const clean = spawnSync(process.execPath, [script, '--check'], { cwd: fixture, encoding: 'utf8' });
    expect(clean.status).toBe(0);
    fs.appendFileSync(path.join(fixture, 'extension/content.js'), '\n// deliberate generated drift\n');
    const drift = spawnSync(process.execPath, [script, '--check'], { cwd: fixture, encoding: 'utf8' });
    expect(drift.status).not.toBe(0);
    expect(drift.stderr).toMatch(/stale/i);
  });

  test('payload-hash drift mutant fails visibly', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    const record = collectCurrentIdentity(fixture, { head: HEAD_A });
    fs.appendFileSync(path.join(fixture, 'ghost-in-the-loop.user.js'), '\n// deliberate payload drift\n');
    const current = collectCurrentIdentity(fixture, { head: HEAD_B });
    expect(() => validateRecord(record, current)).toThrow(/Payload hash drift/);
  });

  test('candidate-versus-stable channel confusion fails visibly', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    const userscriptPath = path.join(fixture, 'ghost-in-the-loop.user.js');
    const userscript = fs.readFileSync(userscriptPath, 'utf8')
      .replaceAll('/main/ghost-in-the-loop.user.js', '/agent/8.8-repair-resume/ghost-in-the-loop.user.js');
    fs.writeFileSync(userscriptPath, userscript);
    expect(() => collectCurrentIdentity(fixture, { head: HEAD_A })).toThrow(/Unexpected stable @updateURL/);
  });

  test('coordination-only head movement remains distinguishable from payload movement', () => {
    const fixture = makeFixture();
    fixtures.push(fixture);
    const record = collectCurrentIdentity(fixture, { head: HEAD_A });
    const current = collectCurrentIdentity(fixture, { head: HEAD_B });
    expect(validateRecord(record, current)).toEqual({ ok: true, headRelation: 'head-moved-payload-identical' });
  });
});
