'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_OUT,
  listFilesRecursive,
  verifyPackage,
  writePackage
} = require('../scripts/package-candidate');

const SOURCE_ROOT = path.resolve(__dirname, '..');
const FIXTURE_FILES = [
  'package.json',
  'package-lock.json',
  'CHANGELOG.md',
  'ghost-in-the-loop.user.js',
  'extension/manifest.json',
  'extension/content.js',
  'extension/icon-48.png',
  'extension/icon-96.png',
  '.gitl/autopilot-state.json',
  '.gitl/evidence/round-7/candidate-identity.json'
];

function copyFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gitl-package-candidate-'));
  for (const relativePath of FIXTURE_FILES) {
    const source = path.join(SOURCE_ROOT, relativePath);
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  return root;
}

function mutateJson(root, relativePath, mutator) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  mutator(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('release candidate package oracle', () => {
  const roots = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  test('stages exactly the five immutable payload files plus deterministic metadata', () => {
    const root = copyFixture();
    roots.push(root);

    const first = writePackage(root);
    const sumsA = fs.readFileSync(path.join(root, DEFAULT_OUT, 'SHA256SUMS'));
    const manifestA = fs.readFileSync(path.join(root, DEFAULT_OUT, 'package-manifest.json'));
    const second = writePackage(root);
    const sumsB = fs.readFileSync(path.join(root, DEFAULT_OUT, 'SHA256SUMS'));
    const manifestB = fs.readFileSync(path.join(root, DEFAULT_OUT, 'package-manifest.json'));

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(sumsA.equals(sumsB)).toBe(true);
    expect(manifestA.equals(manifestB)).toBe(true);
    expect(listFilesRecursive(path.join(root, DEFAULT_OUT))).toEqual([
      'SHA256SUMS',
      'extension/content.js',
      'extension/icon-48.png',
      'extension/icon-96.png',
      'extension/manifest.json',
      'ghost-in-the-loop.user.js',
      'package-manifest.json'
    ]);
  });

  test('kills a missing staged payload path', () => {
    const root = copyFixture();
    roots.push(root);
    writePackage(root);
    fs.unlinkSync(path.join(root, DEFAULT_OUT, 'extension/icon-48.png'));
    expect(() => verifyPackage(root)).toThrow(/Staged path set drift/);
  });

  test('kills an extra staged path', () => {
    const root = copyFixture();
    roots.push(root);
    writePackage(root);
    fs.writeFileSync(path.join(root, DEFAULT_OUT, 'UNEXPECTED.txt'), 'nope\n');
    expect(() => verifyPackage(root)).toThrow(/Staged path set drift/);
  });

  test('kills staged byte and hash drift', () => {
    const root = copyFixture();
    roots.push(root);
    writePackage(root);
    fs.appendFileSync(path.join(root, DEFAULT_OUT, 'ghost-in-the-loop.user.js'), '\n// mutant\n');
    expect(() => verifyPackage(root)).toThrow(/Staged identity drift/);
  });

  test('kills source/generated-content drift before staging', () => {
    const root = copyFixture();
    roots.push(root);
    fs.appendFileSync(path.join(root, 'extension/content.js'), '\n// generated mutant\n');
    expect(() => writePackage(root)).toThrow(/Payload hash drift/);
  });

  test('kills release version drift', () => {
    const root = copyFixture();
    roots.push(root);
    mutateJson(root, 'package.json', (pkg) => { pkg.version = '8.8.0'; });
    expect(() => writePackage(root)).toThrow(/Version mismatch|Release target drift/);
  });

  test('kills candidate/stable channel confusion', () => {
    const root = copyFixture();
    roots.push(root);
    mutateJson(root, '.gitl/autopilot-state.json', (state) => { state.branch = 'main'; });
    expect(() => writePackage(root)).toThrow(/Candidate channel must be isolated|Candidate channel drift/);
  });

  test('kills publication-state drift', () => {
    const root = copyFixture();
    roots.push(root);
    mutateJson(root, '.gitl/autopilot-state.json', (state) => { state.publishReady = true; });
    expect(() => writePackage(root)).toThrow(/publishReady must remain false|Publication state is not fail-closed/);
  });

  test('kills staged checksum metadata drift', () => {
    const root = copyFixture();
    roots.push(root);
    writePackage(root);
    fs.appendFileSync(path.join(root, DEFAULT_OUT, 'SHA256SUMS'), 'deadbeef  extra\n');
    expect(() => verifyPackage(root)).toThrow(/SHA256SUMS drift/);
  });

  test('kills staged package-manifest drift', () => {
    const root = copyFixture();
    roots.push(root);
    writePackage(root);
    mutateJson(root, `${DEFAULT_OUT}/package-manifest.json`, (manifest) => {
      manifest.channels.publishReady = true;
    });
    expect(() => verifyPackage(root)).toThrow(/package-manifest\.json drift/);
  });
});
