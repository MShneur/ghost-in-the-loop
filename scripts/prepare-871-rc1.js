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

const changelogPath = path.join(root, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');
const heading = '## [8.7.1]';
if (!changelog.includes(heading)) {
  if (!/^# Changelog\s*\n/.test(changelog)) {
    throw new Error('CHANGELOG heading not found; refusing broad rewrite');
  }
  const entry = `## [8.7.1] — mobile wake recovery and reliable controls

- Added layered automatic recovery after phone lock, app switching, background suspension, BFCache restoration, and focus return.
- Rebuilds stale caches, ticker, heartbeat, tab lease, GhostBus, and control detection through one idempotent recovery gate.
- Restores a previously running loop only when safe; unresolved or uncertain Send transactions pause without replay.
- Added focused wake-recovery regression coverage and kept page reload, reground prompts, and automatic resend prohibited.
- Reserved a dedicated tab-help strip so help controls no longer cover the Personas committee toggle.
- Verified the reliability changes through unit, base-certification, Chromium, Firefox, and mobile Chromium test tiers before release-candidate packaging.
`;
  changelog = changelog.replace(/^# Changelog\s*\n/, `# Changelog\n\n${entry}\n`);
  fs.writeFileSync(changelogPath, changelog, 'utf8');
}

console.log(`Aligned release metadata and changelog to ${VERSION}`);
