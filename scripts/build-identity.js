#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_RECORD = '.gitl/evidence/round-7/candidate-identity.json';
const REPOSITORY = 'MShneur/ghost-in-the-loop';
const STABLE_BRANCH = 'main';
const STABLE_USERSCRIPT_URL = 'https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js';
const PAYLOAD_FILES = [
  'ghost-in-the-loop.user.js',
  'extension/manifest.json',
  'extension/content.js',
  'extension/icon-48.png',
  'extension/icon-96.png'
];

function fail(message) {
  throw new Error(`BUILD IDENTITY FAILURE: ${message}`);
}

function readText(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`Missing required file: ${relativePath}`);
  return fs.readFileSync(absolutePath, 'utf8');
}

function readJson(root, relativePath) {
  const text = readText(root, relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

function sha256File(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`Missing payload file: ${relativePath}`);
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function gitHead(root) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`Unable to resolve Git HEAD: ${(result.stderr || '').trim()}`);
  const head = result.stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(head)) fail(`Unexpected Git HEAD: ${head}`);
  return head;
}

function extractUserscriptContract(userscript) {
  const versionHeader = userscript.match(/^\/\/ @version\s+(\S+)$/m)?.[1] || null;
  const runtimeVersion = userscript.match(/const VER\s*=\s*'([^']+)'/)?.[1] || null;
  const updateUrl = userscript.match(/^\/\/ @updateURL\s+(\S+)$/m)?.[1] || null;
  const downloadUrl = userscript.match(/^\/\/ @downloadURL\s+(\S+)$/m)?.[1] || null;
  return { versionHeader, runtimeVersion, updateUrl, downloadUrl };
}

function validateVersionContract(versions, changelog) {
  const entries = Object.entries(versions);
  for (const [name, value] of entries) {
    if (!value) fail(`Version source ${name} is missing.`);
  }
  const expected = versions.package;
  for (const [name, value] of entries) {
    if (value !== expected) fail(`Version mismatch: package=${expected}, ${name}=${value}`);
  }
  if (!changelog.includes(`## [${expected}]`)) fail(`CHANGELOG is missing current version ${expected}.`);
  return expected;
}

function validateChannelContract({ candidateChannel, updateUrl, downloadUrl, publishReady }) {
  if (!candidateChannel || candidateChannel === STABLE_BRANCH) {
    fail(`Candidate channel must be isolated from stable '${STABLE_BRANCH}'; found '${candidateChannel}'.`);
  }
  if (updateUrl !== STABLE_USERSCRIPT_URL) fail(`Unexpected stable @updateURL: ${updateUrl}`);
  if (downloadUrl !== STABLE_USERSCRIPT_URL) fail(`Unexpected stable @downloadURL: ${downloadUrl}`);
  if (publishReady !== false) fail('publishReady must remain false during BUILD-IDENTITY.');
}

function payloadEntries(root) {
  return PAYLOAD_FILES.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) fail(`Missing payload file: ${relativePath}`);
    return {
      path: relativePath,
      bytes: fs.statSync(absolutePath).size,
      sha256: sha256File(root, relativePath)
    };
  });
}

function collectCurrentIdentity(root = DEFAULT_ROOT, options = {}) {
  const pkg = readJson(root, 'package.json');
  const lock = readJson(root, 'package-lock.json');
  const manifest = readJson(root, 'extension/manifest.json');
  const state = readJson(root, '.gitl/autopilot-state.json');
  const changelog = readText(root, 'CHANGELOG.md');
  const userscript = readText(root, 'ghost-in-the-loop.user.js');
  const user = extractUserscriptContract(userscript);

  const versions = {
    package: pkg.version,
    packageLock: lock.version,
    packageLockRoot: lock.packages?.['']?.version,
    userscriptHeader: user.versionHeader,
    runtime: user.runtimeVersion,
    manifest: manifest.version
  };
  const version = validateVersionContract(versions, changelog);
  const candidateChannel = options.candidateChannel || state.branch;
  validateChannelContract({
    candidateChannel,
    updateUrl: user.updateUrl,
    downloadUrl: user.downloadUrl,
    publishReady: state.publishReady
  });

  return {
    schema: 'gitl-build-identity-v1',
    repository: REPOSITORY,
    releaseTarget: version,
    provenance: {
      branch: candidateChannel,
      head: options.head || gitHead(root)
    },
    channels: {
      candidate: candidateChannel,
      stable: STABLE_BRANCH,
      stableUserscriptUpdateUrl: user.updateUrl,
      stableUserscriptDownloadUrl: user.downloadUrl,
      stableVersionObserved: state.verificationSummary?.stableMainVersionObserved || null,
      publicationState: 'candidate-not-published',
      publishReady: state.publishReady
    },
    versions,
    contracts: {
      canonicalSource: 'ghost-in-the-loop.user.js',
      generatedExtensionRuntime: 'extension/content.js',
      generationAuthority: 'scripts/build-extension.js',
      generatedParityCommand: 'npm run check:generated',
      baseCertificationCommand: 'npm run cert:base',
      versionConsistencyTest: 'tests/version.test.js'
    },
    payload: payloadEntries(root)
  };
}

function validateRecord(record, current) {
  if (!record || record.schema !== 'gitl-build-identity-v1') fail('Identity record schema is missing or unsupported.');
  if (record.repository !== REPOSITORY) fail(`Repository mismatch: ${record.repository}`);
  if (record.releaseTarget !== current.releaseTarget) fail(`Release target drift: record=${record.releaseTarget}, current=${current.releaseTarget}`);
  if (record.channels?.candidate !== current.channels.candidate) fail(`Candidate channel drift: record=${record.channels?.candidate}, current=${current.channels.candidate}`);
  if (record.channels?.stable !== STABLE_BRANCH) fail(`Stable channel confusion: record stable=${record.channels?.stable}`);
  if (record.channels?.stableUserscriptUpdateUrl !== STABLE_USERSCRIPT_URL) fail('Record @updateURL does not identify stable main.');
  if (record.channels?.stableUserscriptDownloadUrl !== STABLE_USERSCRIPT_URL) fail('Record @downloadURL does not identify stable main.');
  if (record.channels?.publishReady !== false || current.channels.publishReady !== false) fail('Publication state is not fail-closed.');

  for (const [name, value] of Object.entries(current.versions)) {
    if (record.versions?.[name] !== value) fail(`Version record drift at ${name}: record=${record.versions?.[name]}, current=${value}`);
  }

  const recordedPayload = new Map((record.payload || []).map((entry) => [entry.path, entry]));
  for (const currentEntry of current.payload) {
    const recorded = recordedPayload.get(currentEntry.path);
    if (!recorded) fail(`Payload record missing ${currentEntry.path}.`);
    if (recorded.sha256 !== currentEntry.sha256) {
      fail(`Payload hash drift for ${currentEntry.path}: record=${recorded.sha256}, current=${currentEntry.sha256}`);
    }
    if (recorded.bytes !== currentEntry.bytes) {
      fail(`Payload size drift for ${currentEntry.path}: record=${recorded.bytes}, current=${currentEntry.bytes}`);
    }
  }

  if (recordedPayload.size !== current.payload.length) fail('Payload record contains an unexpected path set.');
  const headRelation = record.provenance?.head === current.provenance.head
    ? 'exact-head'
    : 'head-moved-payload-identical';
  return { ok: true, headRelation };
}

function writeRecord(root, recordPath, head) {
  const record = collectCurrentIdentity(root, { head });
  const absolutePath = path.resolve(root, recordPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

function checkRecord(root, recordPath, head) {
  const record = readJson(root, recordPath);
  const current = collectCurrentIdentity(root, { head });
  return validateRecord(record, current);
}

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, mode: null, recordPath: DEFAULT_RECORD, head: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') args.root = path.resolve(argv[++i]);
    else if (arg === '--write') { args.mode = 'write'; args.recordPath = argv[++i] || DEFAULT_RECORD; }
    else if (arg === '--check') { args.mode = 'check'; args.recordPath = argv[++i] || DEFAULT_RECORD; }
    else if (arg === '--head') args.head = argv[++i];
    else fail(`Unknown argument: ${arg}`);
  }
  if (!args.mode) fail('Choose --write <record> or --check <record>.');
  if (args.head && !/^[0-9a-f]{40}$/.test(args.head)) fail(`Invalid --head value: ${args.head}`);
  return args;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.mode === 'write') {
      const record = writeRecord(args.root, args.recordPath, args.head || gitHead(args.root));
      console.log(`Build identity record written for ${record.releaseTarget} at ${record.provenance.head}.`);
    } else {
      const result = checkRecord(args.root, args.recordPath, args.head || gitHead(args.root));
      console.log(`Build identity oracle PASS (${result.headRelation}).`);
    }
  } catch (error) {
    console.error(error.message || String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  DEFAULT_RECORD,
  PAYLOAD_FILES,
  STABLE_USERSCRIPT_URL,
  collectCurrentIdentity,
  extractUserscriptContract,
  payloadEntries,
  validateChannelContract,
  validateRecord,
  validateVersionContract
};
