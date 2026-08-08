#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_RECORD,
  PAYLOAD_FILES,
  collectCurrentIdentity,
  validateRecord
} = require('./build-identity');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT = 'test-results/release-candidate';
const SCHEMA = 'gitl-release-candidate-package-v1';
const METADATA_FILES = ['SHA256SUMS', 'package-manifest.json'];

function fail(message) {
  throw new Error(`PACKAGE CANDIDATE FAILURE: ${message}`);
}

function readJson(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) fail(`Missing ${label}: ${absolutePath}`);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(absolutePath) {
  if (!fs.existsSync(absolutePath)) fail(`Missing file: ${absolutePath}`);
  return sha256Buffer(fs.readFileSync(absolutePath));
}

function sortedPayloadPaths() {
  return [...PAYLOAD_FILES].sort((a, b) => a.localeCompare(b));
}

function assertExactIdentityPathSet(record) {
  const expected = sortedPayloadPaths();
  const actual = (record.payload || []).map((entry) => entry.path).sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`Identity payload path set drift: expected ${expected.join(', ')}, found ${actual.join(', ')}`);
  }
}

function loadValidatedIdentity(root, recordPath = DEFAULT_RECORD) {
  const absoluteRecord = path.join(root, recordPath);
  const record = readJson(absoluteRecord, 'identity record');
  assertExactIdentityPathSet(record);

  if (record.channels?.publicationState !== 'candidate-not-published') {
    fail(`Publication-state drift: ${record.channels?.publicationState}`);
  }
  if (record.channels?.publishReady !== false) fail('Identity record publishReady must remain false.');
  if (record.channels?.candidate === record.channels?.stable) fail('Candidate/stable channel confusion in identity record.');

  const current = collectCurrentIdentity(root, { head: record.provenance?.head });
  validateRecord(record, current);
  return record;
}

function expectedPayloadEntries(record) {
  const byPath = new Map((record.payload || []).map((entry) => [entry.path, entry]));
  return sortedPayloadPaths().map((relativePath) => {
    const entry = byPath.get(relativePath);
    if (!entry) fail(`Identity record missing payload path: ${relativePath}`);
    return {
      path: relativePath,
      bytes: entry.bytes,
      sha256: entry.sha256
    };
  });
}

function expectedManifest(record, recordPath = DEFAULT_RECORD) {
  return {
    schema: SCHEMA,
    repository: record.repository,
    releaseTarget: record.releaseTarget,
    identity: {
      record: recordPath,
      provenanceHead: record.provenance?.head || null
    },
    channels: {
      candidate: record.channels?.candidate || null,
      stable: record.channels?.stable || null,
      stableVersionObserved: record.channels?.stableVersionObserved || null,
      publicationState: record.channels?.publicationState || null,
      publishReady: record.channels?.publishReady
    },
    payload: expectedPayloadEntries(record)
  };
}

function expectedSums(record) {
  const entries = expectedPayloadEntries(record);
  return `${entries.map((entry) => `${entry.sha256}  ${entry.path}`).join('\n')}\n`;
}

function listFilesRecursive(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  const visit = (current, prefix) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolutePath, relativePath);
      else if (entry.isFile()) out.push(relativePath);
      else fail(`Unexpected staged filesystem entry: ${relativePath}`);
    }
  };
  visit(rootDir, '');
  return out.sort((a, b) => a.localeCompare(b));
}

function assertExactPackagePathSet(outDir) {
  const expected = [...sortedPayloadPaths(), ...METADATA_FILES].sort((a, b) => a.localeCompare(b));
  const actual = listFilesRecursive(outDir);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`Staged path set drift: expected ${expected.join(', ')}, found ${actual.join(', ')}`);
  }
}

function verifyPayloadBytes(root, outDir, record) {
  for (const entry of expectedPayloadEntries(record)) {
    const sourcePath = path.join(root, entry.path);
    const stagedPath = path.join(outDir, entry.path);
    if (!fs.existsSync(sourcePath)) fail(`Missing source payload: ${entry.path}`);
    if (!fs.existsSync(stagedPath)) fail(`Missing staged payload: ${entry.path}`);

    const source = fs.readFileSync(sourcePath);
    const staged = fs.readFileSync(stagedPath);
    const sourceHash = sha256Buffer(source);
    const stagedHash = sha256Buffer(staged);

    if (source.length !== entry.bytes || sourceHash !== entry.sha256) {
      fail(`Source identity drift for ${entry.path}: bytes=${source.length}, sha256=${sourceHash}`);
    }
    if (staged.length !== entry.bytes || stagedHash !== entry.sha256) {
      fail(`Staged identity drift for ${entry.path}: bytes=${staged.length}, sha256=${stagedHash}`);
    }
    if (!source.equals(staged)) fail(`Staged bytes differ from source for ${entry.path}`);
  }
}

function writePackage(root = DEFAULT_ROOT, outRelative = DEFAULT_OUT, recordPath = DEFAULT_RECORD) {
  const record = loadValidatedIdentity(root, recordPath);
  const outDir = path.resolve(root, outRelative);
  fs.rmSync(outDir, { recursive: true, force: true });

  for (const entry of expectedPayloadEntries(record)) {
    const sourcePath = path.join(root, entry.path);
    const stagedPath = path.join(outDir, entry.path);
    fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
    fs.copyFileSync(sourcePath, stagedPath);
  }

  fs.writeFileSync(path.join(outDir, 'SHA256SUMS'), expectedSums(record));
  fs.writeFileSync(path.join(outDir, 'package-manifest.json'), `${JSON.stringify(expectedManifest(record, recordPath), null, 2)}\n`);
  return verifyPackage(root, outRelative, recordPath);
}

function verifyPackage(root = DEFAULT_ROOT, outRelative = DEFAULT_OUT, recordPath = DEFAULT_RECORD) {
  const record = loadValidatedIdentity(root, recordPath);
  const outDir = path.resolve(root, outRelative);
  assertExactPackagePathSet(outDir);
  verifyPayloadBytes(root, outDir, record);

  const sumsPath = path.join(outDir, 'SHA256SUMS');
  const actualSums = fs.readFileSync(sumsPath, 'utf8');
  const wantedSums = expectedSums(record);
  if (actualSums !== wantedSums) fail('SHA256SUMS drift or ordering mismatch.');

  const manifestPath = path.join(outDir, 'package-manifest.json');
  const actualManifest = readJson(manifestPath, 'package manifest');
  const wantedManifest = expectedManifest(record, recordPath);
  if (JSON.stringify(actualManifest) !== JSON.stringify(wantedManifest)) {
    fail('package-manifest.json drift.');
  }

  return {
    ok: true,
    releaseTarget: record.releaseTarget,
    stagedFiles: listFilesRecursive(outDir),
    packageManifestSha256: sha256File(manifestPath),
    sha256SumsSha256: sha256File(sumsPath)
  };
}

function parseArgs(argv) {
  const args = { mode: null, root: DEFAULT_ROOT, out: DEFAULT_OUT, record: DEFAULT_RECORD };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') args.mode = 'write';
    else if (arg === '--check') args.mode = 'check';
    else if (arg === '--root') args.root = path.resolve(argv[++i]);
    else if (arg === '--out') args.out = argv[++i];
    else if (arg === '--record') args.record = argv[++i];
    else fail(`Unknown argument: ${arg}`);
  }
  if (!args.mode) fail('Choose --write or --check.');
  if (!args.out) fail('--out must not be empty.');
  if (!args.record) fail('--record must not be empty.');
  return args;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = args.mode === 'write'
      ? writePackage(args.root, args.out, args.record)
      : verifyPackage(args.root, args.out, args.record);
    console.log(`Release candidate package ${args.mode === 'write' ? 'written and verified' : 'verified'} for ${result.releaseTarget}.`);
    console.log(`Files: ${result.stagedFiles.join(', ')}`);
    console.log(`SHA256SUMS sha256=${result.sha256SumsSha256}`);
    console.log(`package-manifest.json sha256=${result.packageManifestSha256}`);
  } catch (error) {
    console.error(error.message || String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  DEFAULT_OUT,
  METADATA_FILES,
  SCHEMA,
  assertExactPackagePathSet,
  expectedManifest,
  expectedPayloadEntries,
  expectedSums,
  listFilesRecursive,
  loadValidatedIdentity,
  verifyPackage,
  writePackage
};
