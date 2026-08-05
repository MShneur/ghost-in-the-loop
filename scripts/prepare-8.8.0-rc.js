'use strict';

const fs = require('fs');
const path = require('path');

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const previous = '8.7.1';
const next = '8.8.0';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content);
}

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from);
  if (first < 0) throw new Error(`${label}: expected text not found`);
  if (text.indexOf(from, first + from.length) >= 0) {
    throw new Error(`${label}: expected exactly one match`);
  }
  return text.slice(0, first) + to + text.slice(first + from.length);
}

let script = read('ghost-in-the-loop.user.js');
script = replaceOnce(script, `// @version      ${previous}`, `// @version      ${next}`, 'userscript header');
script = replaceOnce(script, `const VER = '${previous}';`, `const VER = '${next}';`, 'VER constant');
write('ghost-in-the-loop.user.js', script);

const manifest = JSON.parse(read('extension/manifest.json'));
if (manifest.version !== previous) throw new Error(`manifest version was ${manifest.version}`);
manifest.version = next;
write('extension/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

const pkg = JSON.parse(read('package.json'));
if (pkg.version !== previous) throw new Error(`package version was ${pkg.version}`);
pkg.version = next;
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(read('package-lock.json'));
if (lock.version !== previous || lock.packages?.['']?.version !== previous) {
  throw new Error('package-lock root versions do not match 8.7.1');
}
lock.version = next;
lock.packages[''].version = next;
write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

let changelog = read('CHANGELOG.md');
changelog = replaceOnce(
  changelog,
  '## Unreleased — explicit user-choice pause',
  '## [8.8.0] — workflow-neutral controls and explicit decisions',
  'changelog heading'
);
write('CHANGELOG.md', changelog);

console.log(`Prepared Ghost in the Loop ${next} release candidate.`);
