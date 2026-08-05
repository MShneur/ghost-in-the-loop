'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const VERSION = '8.7.1';

function writeJson(rel, mutate) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

const userscriptPath = path.join(root, 'ghost-in-the-loop.user.js');
let userscript = fs.readFileSync(userscriptPath, 'utf8');
const replacements = [
  ["// @version      8.7.0", "// @version      8.7.1"],
  ["const VER = '8.7.0';", "const VER = '8.7.1';"]
];
for (const [before, after] of replacements) {
  if (userscript.includes(after)) continue;
  if (!userscript.includes(before)) {
    throw new Error(`Expected release marker not found: ${before}`);
  }
  userscript = userscript.replace(before, after);
}
fs.writeFileSync(userscriptPath, userscript, 'utf8');

writeJson('package.json', data => { data.version = VERSION; });
writeJson('package-lock.json', data => {
  data.version = VERSION;
  if (!data.packages || !data.packages['']) throw new Error('package-lock root package missing');
  data.packages[''].version = VERSION;
});
writeJson('extension/manifest.json', data => { data.version = VERSION; });

console.log(`Aligned userscript, package, lockfile, and extension manifest to ${VERSION}`);
