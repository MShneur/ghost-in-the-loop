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
  path.join(root, 'ghost-in-the-loop.user.js'),
  "  const reviewedEnter = !!(PLAT && PLAT.reviewed && PLAT.dispatchFallback === 'enter');",
  "  const reviewedEnter = has('reviewedEnter') ? !!overrides.reviewedEnter\n    : !!(PLAT && PLAT.reviewed && PLAT.dispatchFallback === 'enter');",
  'reviewed Enter test override'
);

replaceOnce(
  path.join(root, 'tests', 'setup.js'),
  "    'platformHealth','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  "    'capabilityState','platformHealth','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  'test export hook'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "      generating: false, dispatching: false\n    });\n    expect(c.states).toEqual({",
  "      generating: false, dispatching: false, reviewedEnter: false\n    });\n    expect(c.states).toEqual({",
  'idle no-fallback fixture'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "      generating: false, dispatching: true, inputRequired: true, sendRequired: true\n    });",
  "      generating: false, dispatching: true, inputRequired: true, sendRequired: true, reviewedEnter: false\n    });",
  'dispatch no-fallback fixture'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "      input: 'missing',\n      read: 'missing',\n      send: 'latent-empty-composer',\n      stop: 'idle-absent',\n      requiredMissing: []",
  "      input: 'missing',\n      read: 'missing',\n      send: 'ready',\n      stop: 'idle-absent',\n      requiredMissing: []",
  'ChatGPT reviewed Enter diagnostic expectation'
);

replaceOnce(
  path.join(root, 'tests', 'contextual-capabilities.test.js'),
  "    expect(report.text).toContain('send:latent-empty-composer');",
  "    expect(report.text).toContain('send:ready');",
  'human diagnostic expectation'
);

console.log('Aligned contextual capability test fixtures and exports.');
