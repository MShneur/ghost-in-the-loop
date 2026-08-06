'use strict';

const fs = require('fs');
const path = require('path');
const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function replaceOnce(file, before, after, label) {
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(after)) return;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one marker, found ${count}`);
  source = source.replace(before, after);
  fs.writeFileSync(file, source, 'utf8');
}

replaceOnce(
  path.join(root, 'tests', 'setup.js'),
  "    'platformHealth','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  "    'capabilityState','platformHealth','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  'test export hook'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "      send: 'latent-empty-composer',\n      stop: 'idle-absent',",
  "      send: 'ready',\n      stop: 'idle-absent',",
  'ChatGPT reviewed Enter expectation'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "    expect(report.text).toContain('send:latent-empty-composer');",
  "    expect(report.text).toContain('send:ready');",
  'human diagnostic expectation'
);

console.log('Aligned test exports and ChatGPT reviewed Enter expectations.');
