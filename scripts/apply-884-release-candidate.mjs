#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
function replaceOne(text, from, to, label) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  return text.replace(from, to);
}

let src = read('ghost-in-the-loop.user.js');
src = replaceOne(src, '// @version      8.8.3', '// @version      8.8.4', 'userscript header version');
src = replaceOne(src, "const VER = '8.8.3';", "const VER = '8.8.4';", 'runtime version');
src = replaceOne(src, 'const SEND_CONFIRM_MS  = 9000;', 'const SEND_CONFIRM_MS  = 18000;', 'mobile send confirm window');
src = replaceOne(
  src,
  "    assistant: ['div[data-message-author-role=\"assistant\"]','article [data-message-author-role=\"assistant\"]','div[data-testid^=\"conversation-turn\"] div[data-message-author-role=\"assistant\"]'],",
  "    assistant: ['div[data-message-author-role=\"assistant\"]','article [data-message-author-role=\"assistant\"]','div[data-testid^=\"conversation-turn\"] div[data-message-author-role=\"assistant\"]'],\n    user: ['div[data-message-author-role=\"user\"]','article [data-message-author-role=\"user\"]','div[data-testid^=\"conversation-turn\"] div[data-message-author-role=\"user\"]'],",
  'ChatGPT user-turn selectors'
);
src = replaceOne(
  src,
  '    assistantCount: _qAll(PLAT.assistant).length,\n    assistantTextLength: lastText.length,',
  '    assistantCount: _qAll(PLAT.assistant).length,\n    userCount: Array.isArray(PLAT.user) ? _qAll(PLAT.user).length : null,\n    assistantTextLength: lastText.length,',
  'send transaction user baseline'
);
src = replaceOne(
  src,
  "  const assistantCount = _qAll(PLAT.assistant).length;",
  "  if (Number.isFinite(txn.userCount) && Array.isArray(PLAT.user)) {\n    const userCount = _qAll(PLAT.user).length;\n    if (userCount > txn.userCount) return { confirmed: true, evidence: 'user-turn' };\n  }\n\n  const assistantCount = _qAll(PLAT.assistant).length;",
  'user-turn delivery evidence'
);
write('ghost-in-the-loop.user.js', src);

for (const p of ['package.json', 'package-lock.json']) {
  const j = JSON.parse(read(p));
  j.version = '8.8.4';
  if (p === 'package-lock.json' && j.packages?.['']) j.packages[''].version = '8.8.4';
  write(p, JSON.stringify(j, null, 2) + '\n');
}
const manifest = JSON.parse(read('extension/manifest.json'));
manifest.version = '8.8.4';
write('extension/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

let changelog = read('CHANGELOG.md');
const entry = `## [8.8.4] — mobile Send confirmation and release parity\n\n- Confirm a reviewed Send when ChatGPT creates a new user turn after the at-most-once actuation; this adds an independent delivery signal without treating composer clearing or Send disappearance alone as success.\n- Extend the bounded Send-confirmation window from 9s to 18s for slower Firefox/Android host transitions. Unconfirmed attempts still become SEND-002 and fail closed with no resend.\n- Preserve the 8.8.3 large P · COMMIT RECOMMENDATION action and panel-position/scroll stability, while bringing the stale regression fixtures forward.\n- Restore package, manifest, userscript, and generated Firefox extension parity.\n- Carry the separately tested Alpha/Beta/Gamma/Delta R3 recovery fallback as release-candidate evidence.\n\n**Field boundary:** Chromium/Firefox automated certification can validate the state machine and UI, but authenticated Firefox/Android remains the final live-host proof.\n\n`;
changelog = replaceOne(changelog, '# Changelog\n\n', '# Changelog\n\n' + entry, 'changelog header');
write('CHANGELOG.md', changelog);

let e2e = read('tests/e2e/chatgpt-live-regression.spec.js');
e2e = replaceOne(
  e2e,
  `    await page.locator('#run-adv').click();\n    await page.locator('.g-pst[data-pst="evolving"]').click();\n    await page.locator('#g-committee-p').click();`,
  `    await page.locator('#run-adv').click();\n    const beforeAdaptive = await page.evaluate(() => {\n      const r = document.getElementById('gitl').getBoundingClientRect();\n      return { left:r.left, top:r.top, scrollY:window.scrollY };\n    });\n    await page.locator('.g-pst[data-pst="evolving"]').click();\n    const commit = page.locator('#g-committee-commit');\n    await expect(commit).toBeVisible();\n    await expect(commit).toBeDisabled();\n    await expect(commit).toHaveJSProperty('type', 'button');`,
  'committee e2e action'
);
e2e = replaceOne(
  e2e,
  `      posture: window.__gmStore.posture,\n      committeeProceed: window.__gmStore.committeeProceed,\n      host: { ...window.__hostProbe }`,
  `      posture: window.__gmStore.posture,\n      commitTag: document.getElementById('g-committee-commit')?.tagName,\n      commitHeight: document.getElementById('g-committee-commit')?.getBoundingClientRect().height || 0,\n      panelRect: (() => { const r=document.getElementById('gitl').getBoundingClientRect(); return {left:r.left,top:r.top}; })(),\n      host: { ...window.__hostProbe }`,
  'committee e2e capture'
);
e2e = replaceOne(
  e2e,
  `    expect(after.posture).toBe('evolving');\n    expect(after.committeeProceed).toBe(true);\n    expect(after.host).toEqual({ submits: 0, hashChanges: 0, sendClicks: 0 });`,
  `    expect(after.posture).toBe('evolving');\n    expect(after.commitTag).toBe('BUTTON');\n    expect(after.commitHeight).toBeGreaterThanOrEqual(40);\n    expect(Math.abs(after.panelRect.left - beforeAdaptive.left)).toBeLessThanOrEqual(1);\n    expect(Math.abs(after.panelRect.top - beforeAdaptive.top)).toBeLessThanOrEqual(1);\n    expect(Math.abs(after.scrollY - beforeAdaptive.scrollY)).toBeLessThanOrEqual(1);\n    expect(after.host).toEqual({ submits: 0, hashChanges: 0, sendClicks: 0 });`,
  'committee e2e assertions'
);
write('tests/e2e/chatgpt-live-regression.spec.js', e2e);

let directives = read('tests/directives.test.js');
directives = replaceOne(
  directives,
  `  test('adds the committee P shortcut only when explicitly enabled', () => {\n    expect(runDirectives(false)).not.toContain('Recommended by committee');\n    GHOST.ui.committeeProceed = true;\n    expect(runDirectives(false)).toContain('Recommended by committee');\n  });`,
  `  test('arms the committee P shortcut automatically for a real Advanced committee', () => {\n    expect(runDirectives(false)).not.toContain('Recommended by committee');\n    GHOST.persona.selected = ['researcher', 'redteam'];\n    expect(runDirectives(false)).toContain('Recommended by committee');\n  });`,
  'committee directives test'
);
write('tests/directives.test.js', directives);

write('tests/committee-commit-ui.test.js', `const fs = require('fs');\nconst path = require('path');\nconst src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');\n\ndescribe('8.8.4 committee commit source contract', () => {\n  test('large semantic action replaces the old toggle', () => {\n    expect(src).not.toContain('id="g-committee-p"');\n    expect(src).toContain('id="g-committee-commit"');\n    expect(src).toContain('P · COMMIT RECOMMENDATION');\n    expect(src).toContain('min-height:48px');\n  });\n  test('P action keeps the safe CHOICE boundaries', () => {\n    expect(src).toContain("L.state === 'CHOICE'");\n    expect(src).toContain('&& !L.isSending');\n    expect(src).toContain('&& !L.sendPending');\n    expect(src).toContain("L.sendTxn?.state !== 'uncertain'");\n    expect(src).toContain("const staged = await _awaitStagedComposer(input, 'P')");\n  });\n  test('ordinary posture selection does not remount the whole panel', () => {\n    const start = src.indexOf("$$('.g-pst').forEach");\n    const end = src.indexOf("$('#g-posture-help')", start);\n    expect(start).toBeGreaterThan(-1);\n    expect(end).toBeGreaterThan(start);\n    expect(src.slice(start, end)).not.toContain('render();');\n  });\n});\n`);
write('tests/send-confirmation-884.test.js', `const fs = require('fs');\nconst path = require('path');\nconst src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');\n\ndescribe('8.8.4 mobile Send confirmation contract', () => {\n  test('uses a bounded 18 second confirmation window', () => { expect(src).toContain('const SEND_CONFIRM_MS  = 18000;'); });\n  test('records and observes new ChatGPT user turns', () => {\n    expect(src).toContain('userCount: Array.isArray(PLAT.user) ? _qAll(PLAT.user).length : null');\n    expect(src).toContain("evidence: 'user-turn'");\n    expect(src).toContain('data-message-author-role=\\"user\\"');\n  });\n  test('does not make composer clearing alone authoritative', () => {\n    expect(src).toContain('if (composerCleared && stopVisible)');\n    expect(src).toContain('if (composerCleared && trustedNetwork)');\n    expect(src).not.toContain("if (composerCleared) return { confirmed: true");\n  });\n  test('uncertain attempts still fail closed', () => {\n    expect(src).toContain("txn.state = 'uncertain'");\n    expect(src).toContain("Reporter.capture('SEND-002'");\n  });\n});\n`);

const statePath = '.gitl/autopilot-state.json';
const state = JSON.parse(read(statePath));
state.releaseTarget = '8.8.4';
state.branch = 'agent/8.8.4-release-candidate';
state.status = 'release-candidate-certification';
state.publishReady = false;
write(statePath, JSON.stringify(state, null, 2) + '\n');

console.log('8.8.4 RC source patch applied successfully.');
