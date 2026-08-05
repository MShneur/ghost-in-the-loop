'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'tests', 'e2e', 'smoke', 'ui-smoke.spec.js');
let src = fs.readFileSync(file, 'utf8');

const importBefore = "const path = require('path');";
const importAfter = "const path = require('path');\nconst { version: VERSION } = require('../../../package.json');";
const assertionBefore = "expect(version).toMatch(/^ok:8\\.7\\.0$/);";
const assertionAfter = "expect(version).toBe(`ok:${VERSION}`);";

if (!src.includes(importAfter)) {
  if (!src.includes(importBefore)) throw new Error('Smoke import marker missing');
  src = src.replace(importBefore, importAfter);
}
if (!src.includes(assertionAfter)) {
  if (!src.includes(assertionBefore)) throw new Error('Stale smoke version assertion marker missing');
  src = src.replace(assertionBefore, assertionAfter);
}

fs.writeFileSync(file, src, 'utf8');
console.log('Smoke boot assertion now derives the version from package.json');
