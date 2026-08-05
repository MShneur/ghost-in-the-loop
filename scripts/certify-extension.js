#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'all';
const outFlag = process.argv.indexOf('--out');
const outPath = outFlag >= 0 ? process.argv[outFlag + 1] : null;

function fail(message) {
  console.error(`CERTIFICATION FAILURE: ${message}`);
  process.exitCode = 1;
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function sha256(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

function preflight() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 20) {
    fail(`Node.js 20 or newer is required; found ${process.version}`);
  }

  for (const required of [
    'package.json',
    'ghost-in-the-loop.user.js',
    'scripts/build-extension.js',
    'extension/manifest.json',
    'extension/content.js'
  ]) {
    readText(required);
  }
}

function manifestAudit() {
  const pkg = readJson('package.json');
  const manifest = readJson('extension/manifest.json');
  if (!pkg || !manifest) return;

  if (manifest.manifest_version !== 3) fail('extension/manifest.json must use Manifest V3.');
  if (manifest.version !== pkg.version) {
    fail(`Version mismatch: package.json=${pkg.version}, manifest.json=${manifest.version}`);
  }

  const allowedPermissions = new Set(['storage']);
  for (const permission of manifest.permissions || []) {
    if (!allowedPermissions.has(permission)) fail(`Unexpected extension permission: ${permission}`);
  }

  if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
    fail('At least one content_scripts entry is required.');
    return;
  }

  for (const [index, entry] of manifest.content_scripts.entries()) {
    for (const script of entry.js || []) {
      const scriptPath = path.join('extension', script);
      if (!fs.existsSync(path.join(root, scriptPath))) {
        fail(`content_scripts[${index}] references missing file: ${scriptPath}`);
      }
    }
    for (const match of entry.matches || []) {
      if (!match.startsWith('https://')) fail(`Non-HTTPS match pattern is not allowed: ${match}`);
    }
  }
}

function artifactIndex() {
  const files = [
    'ghost-in-the-loop.user.js',
    'extension/manifest.json',
    'extension/content.js',
    'extension/icon-48.png',
    'extension/icon-96.png'
  ];

  const index = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    node: process.version,
    artifacts: files.map((relativePath) => {
      const absolutePath = path.join(root, relativePath);
      return {
        path: relativePath,
        exists: fs.existsSync(absolutePath),
        bytes: fs.existsSync(absolutePath) ? fs.statSync(absolutePath).size : null,
        sha256: sha256(relativePath)
      };
    })
  };

  const output = `${JSON.stringify(index, null, 2)}\n`;
  if (outPath) {
    const absoluteOut = path.resolve(root, outPath);
    fs.mkdirSync(path.dirname(absoluteOut), { recursive: true });
    fs.writeFileSync(absoluteOut, output);
  } else {
    process.stdout.write(output);
  }
}

const validModes = new Set(['all', 'preflight', 'manifest', 'artifacts']);
if (!validModes.has(mode)) {
  fail(`Unknown mode '${mode}'. Use: all, preflight, manifest, or artifacts.`);
} else {
  if (mode === 'all' || mode === 'preflight') preflight();
  if (mode === 'all' || mode === 'manifest') manifestAudit();
  if (mode === 'all' || mode === 'artifacts') artifactIndex();
}

if (process.exitCode) process.exit(process.exitCode);
