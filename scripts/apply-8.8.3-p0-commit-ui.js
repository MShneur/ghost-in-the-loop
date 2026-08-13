'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const userPath = path.join(root, 'ghost-in-the-loop.user.js');
const directivesTestPath = path.join(root, 'tests', 'directives.test.js');
const liveTestPath = path.join(root, 'tests', 'e2e', 'chatgpt-live-regression.spec.js');

function replaceOnce(text, needle, replacement, label) {
  const first = text.indexOf(needle);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (text.indexOf(needle, first + needle.length) >= 0) throw new Error(`Ambiguous patch anchor: ${label}`);
  return text.slice(0, first) + replacement + text.slice(first + needle.length);
}

function replaceRegexOnce(text, re, replacement, label) {
  const matches = [...text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches.length}`);
  return text.replace(re, replacement);
}

let src = fs.readFileSync(userPath, 'utf8');

// Release identity.
src = replaceOnce(src, '// @version      8.8.2', '// @version      8.8.3', 'userscript metadata version');
src = replaceOnce(src, "const VER = '8.8.2';", "const VER = '8.8.3';", 'runtime version');

// The P shortcut is an action, not a preference toggle. A real Advanced
// committee is prepared automatically so the model has already labeled one
// recommendation before the user reaches a CHOICE boundary.
const runDirectivesAnchor = /function runDirectives\(([^)]*)\)\s*\{/;
const runMatch = src.match(runDirectivesAnchor);
if (!runMatch) throw new Error('Missing runDirectives() anchor');
const committeeHelpers = `function _committeeCommitPrepared() {
  const selected = Array.isArray(GHOST.persona.selected) ? GHOST.persona.selected : [GHOST.persona.selected];
  const active = selected.filter(id => id && id !== 'none');
  return advancedRunOn() && active.length >= 2;
}

function _committeeCommitReady() {
  const L = GHOST.loop;
  return _committeeCommitPrepared()
    && L.state === 'CHOICE'
    && !L.isSending
    && !L.sendPending
    && L.sendTxn?.state !== 'uncertain';
}

async function commitCommitteeRecommendation() {
  if (!_committeeCommitReady()) return false;
  const input = Adapter.getInput();
  if (!input) {
    Reporter.capture('COMPOSER-001', 'P Commit could not find the live composer.');
    GHOST.loop.detail = '⚠ P Commit could not find the chat composer';
    render();
    return false;
  }
  if (!Adapter.injectText(input, 'P')) {
    Reporter.capture('COMPOSER-001', 'P Commit could not stage the recommendation shortcut.');
    GHOST.loop.detail = '⚠ P Commit could not stage P';
    render();
    return false;
  }
  // React/ProseMirror may replace the whole editor after the input event.
  // Reuse the same exact staging gate as normal Proceed before startLoop reads it.
  await sleep(150);
  const staged = await _awaitStagedComposer(input, 'P');
  if (!staged.ok) {
    Reporter.capture('COMPOSER-002', 'P Commit was not retained by the live composer; nothing was sent.');
    GHOST.loop.detail = '⚠ P Commit was not retained — nothing sent';
    render();
    return false;
  }
  Timeline.record('committee_commit', { choice: 'recommended', source: 'p-button' });
  startLoop();
  return true;
}

`;
src = src.replace(runDirectivesAnchor, committeeHelpers + runMatch[0]);

src = replaceOnce(
  src,
  'if (GHOST.ui.committeeProceed) out += COMMITTEE_P_SHORTCUT;',
  'if (_committeeCommitPrepared()) out += COMMITTEE_P_SHORTCUT;',
  'committee directive gate'
);

src = replaceOnce(
  src,
  'const pShortcut = advancedRunOn() && GHOST.ui.committeeProceed && /^p$/i.test(typed)',
  'const pShortcut = _committeeCommitPrepared() && /^p$/i.test(typed)',
  'CHOICE P shortcut gate'
);

// Replace the small ON/OFF toggle with a large, semantic action button.
const oldCommitteeModule = `    <div class="g-mod g-mod-adv">
      <div class="g-mod-h"><span class="g-mod-i">P</span>Committee shortcut<span class="g-mod-x">\${GHOST.ui.committeeProceed?'ON':'OFF'}</span></div>
      <div class="g-row"><label>Reply P = recommendation</label><div class="g-tog\${GHOST.ui.committeeProceed?' on':''}" id="g-committee-p"></div></div>
      <div class="g-hint">At a real decision, the committee labels one option Recommended. Reply P to accept only that labeled option.</div>
    </div>`;
const newCommitteeModule = `    <div class="g-mod g-mod-adv">
      <div class="g-mod-h"><span class="g-mod-i">P</span>Committee commit<span class="g-mod-x">\${_committeeCommitPrepared() ? (GHOST.loop.state==='CHOICE' ? 'READY' : 'ARMED') : 'NEEDS COMMITTEE'}</span></div>
      <button class="g-btn go g-committee-commit" id="g-committee-commit"\${_committeeCommitReady()?'':' disabled'}>P · COMMIT RECOMMENDATION</button>
      <div class="g-hint">With 2+ Advanced committee members, Ghost automatically asks the committee to label one recommendation. At a real CHOICE, this large P button accepts only that clearly labeled recommendation.</div>
    </div>`;
src = replaceOnce(src, oldCommitteeModule, newCommitteeModule, 'committee toggle module');

// Make the primary decision action unmistakably large without inventing a new
// visual system; it inherits the existing green primary-button styling.
src = replaceOnce(
  src,
  '.g-limit{margin:6px 0;padding:8px 9px;background:#231a0c;',
  '.g-committee-commit{width:100%!important;min-height:48px!important;margin-top:5px!important;font-size:12px!important;font-weight:800!important;letter-spacing:.25px!important}\n.g-committee-commit[disabled]{opacity:.42!important;cursor:not-allowed!important;filter:saturate(.35)}\n.g-limit{margin:6px 0;padding:8px 9px;background:#231a0c;',
  'committee commit CSS'
);

// Preserve panel-local scroll and stop re-applying the configured anchor on
// every render. Re-applying position after each click snapped a manually moved
// panel back to its configured corner and full innerHTML replacement reset the
// panel's own scroll position.
src = replaceOnce(
  src,
  'let _panelMounted = false;',
  'let _panelMounted = false;\nlet _lastAppliedPosition = null;',
  'panel position state'
);
src = replaceRegexOnce(
  src,
  /function render\(\)\s*\{/,
  `function render() {
  const _preserveBodyScroll = panel.querySelector('.g-body')?.scrollTop || 0;`,
  'render start'
);
src = replaceOnce(
  src,
  `  bindEvents();
  applyPosition(GHOST.ui.position);
}`,
  `  bindEvents();
  const _dynamicPosition = GHOST.ui.position === 'rail' || GHOST.ui.position === 'orb';
  if (_lastAppliedPosition !== GHOST.ui.position || _dynamicPosition) {
    applyPosition(GHOST.ui.position);
    _lastAppliedPosition = GHOST.ui.position;
  }
  const _restoredBody = panel.querySelector('.g-body');
  if (_restoredBody && _preserveBodyScroll > 0) _restoredBody.scrollTop = _preserveBodyScroll;
}`,
  'render position tail'
);

// Adaptive/Locked/Audit are state buttons. Patch them in place rather than
// rebuilding the entire Ghost window for a one-class change.
const oldPostureHandler = `  $$('.g-pst').forEach(b => b.addEventListener('click', () => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.posture=b.dataset.pst; _save('posture',GHOST.loop.posture); render();
  }));`;
const newPostureHandler = `  $$('.g-pst').forEach(b => b.addEventListener('click', () => {
    if (GHOST.loop.state==='RUNNING') return;
    GHOST.loop.posture=b.dataset.pst; _save('posture',GHOST.loop.posture);
    $$('.g-pst').forEach(btn => btn.classList.toggle('act', btn.dataset.pst === GHOST.loop.posture));
    const mod = b.closest('.g-mod');
    const badge = mod?.querySelector('.g-mod-x');
    if (badge) badge.textContent = POSTURES[GHOST.loop.posture]?.label || '';
    const peek = $('#g-peek');
    if (peek?.classList.contains('open')) peek.textContent = runDirectives(true).trim();
  }));`;
src = replaceOnce(src, oldPostureHandler, newPostureHandler, 'posture handler');

const oldCommitteeHandler = `  $('#g-committee-p')?.addEventListener('click', () => {
    if (!GHOST.ui.runAdv || !['IDLE','COMPLETE'].includes(GHOST.loop.state)) return;
    GHOST.ui.committeeProceed=!GHOST.ui.committeeProceed;
    _save('committeeProceed',GHOST.ui.committeeProceed);
    render();
  });`;
const newCommitteeHandler = `  $('#g-committee-commit')?.addEventListener('click', () => { commitCommitteeRecommendation(); });`;
src = replaceOnce(src, oldCommitteeHandler, newCommitteeHandler, 'committee action handler');

fs.writeFileSync(userPath, src);

// Update tests that encoded the old toggle semantics.
let directives = fs.readFileSync(directivesTestPath, 'utf8');
const oldDirectiveTest = `  test('adds the committee P shortcut only when explicitly enabled', () => {
    expect(runDirectives(false)).not.toContain('Recommended by committee');
    GHOST.ui.committeeProceed = true;
    expect(runDirectives(false)).toContain('Recommended by committee');
  });`;
const newDirectiveTest = `  test('arms the committee P shortcut automatically for a real Advanced committee', () => {
    expect(runDirectives(false)).not.toContain('Recommended by committee');
    GHOST.persona.selected = ['researcher', 'redteam'];
    expect(runDirectives(false)).toContain('Recommended by committee');
    expect(_committeeCommitPrepared()).toBe(true);
  });`;
directives = replaceOnce(directives, oldDirectiveTest, newDirectiveTest, 'directives committee test');
fs.writeFileSync(directivesTestPath, directives);

let live = fs.readFileSync(liveTestPath, 'utf8');
live = replaceOnce(
  live,
  `    await page.locator('#run-adv').click();
    await page.locator('.g-pst[data-pst="evolving"]').click();
    await page.locator('#g-committee-p').click();`,
  `    await page.locator('#run-adv').click();
    const beforeAdaptive = await page.evaluate(() => {
      const r = document.getElementById('gitl').getBoundingClientRect();
      return { left:r.left, top:r.top, scrollY:window.scrollY };
    });
    await page.locator('.g-pst[data-pst="evolving"]').click();
    const commit = page.locator('#g-committee-commit');
    await expect(commit).toBeVisible();
    await expect(commit).toBeDisabled();
    await expect(commit).toHaveJSProperty('type', 'button');`,
  'live control actions'
);
live = replaceOnce(
  live,
  `      committeeProceed: window.__gmStore.committeeProceed,
      host: { ...window.__hostProbe }`,
  `      commitTag: document.getElementById('g-committee-commit')?.tagName,
      commitHeight: document.getElementById('g-committee-commit')?.getBoundingClientRect().height || 0,
      panelRect: (() => { const r=document.getElementById('gitl').getBoundingClientRect(); return {left:r.left,top:r.top}; })(),
      host: { ...window.__hostProbe }`,
  'live after-state'
);
live = replaceOnce(
  live,
  `    expect(after.posture).toBe('evolving');
    expect(after.committeeProceed).toBe(true);
    expect(after.host).toEqual({ submits: 0, hashChanges: 0, sendClicks: 0 });`,
  `    expect(after.posture).toBe('evolving');
    expect(after.commitTag).toBe('BUTTON');
    expect(after.commitHeight).toBeGreaterThanOrEqual(40);
    expect(Math.abs(after.panelRect.left - beforeAdaptive.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.panelRect.top - beforeAdaptive.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.scrollY - beforeAdaptive.scrollY)).toBeLessThanOrEqual(1);
    expect(after.host).toEqual({ submits: 0, hashChanges: 0, sendClicks: 0 });`,
  'live expectations'
);
fs.writeFileSync(liveTestPath, live);

// Focused unit/source contract for the P0 UI regression.
fs.writeFileSync(path.join(root, 'tests', 'committee-commit-ui.test.js'), `
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.3 P0 committee commit control', () => {
  beforeEach(() => {
    GHOST.ui.runAdv = true;
    GHOST.persona.selected = ['researcher', 'redteam'];
    GHOST.loop.state = 'IDLE';
    GHOST.loop.isSending = false;
    GHOST.loop.sendPending = false;
    GHOST.loop.sendTxn = null;
  });

  test('committee shortcut is automatically prepared for 2+ Advanced personas', () => {
    expect(_committeeCommitPrepared()).toBe(true);
    expect(runDirectives(false)).toContain('Recommended by committee');
  });

  test('P action is enabled only at a safe CHOICE boundary', () => {
    expect(_committeeCommitReady()).toBe(false);
    GHOST.loop.state = 'CHOICE';
    expect(_committeeCommitReady()).toBe(true);
    GHOST.loop.sendPending = true;
    expect(_committeeCommitReady()).toBe(false);
  });

  test('old toggle is gone and the large semantic action is present', () => {
    expect(src).not.toContain('id="g-committee-p"');
    expect(src).toContain('id="g-committee-commit"');
    expect(src).toContain('P · COMMIT RECOMMENDATION');
    expect(src).toContain('min-height:48px');
    expect(src).toContain("const staged = await _awaitStagedComposer(input, 'P')");
  });

  test('ordinary posture selection no longer calls full render', () => {
    const handler = src.match(/\$\$\('\.g-pst'\)[\s\S]*?\n  \}\)\);/);
    expect(handler).not.toBeNull();
    expect(handler[0]).not.toContain('render();');
  });
});
`.trimStart());

// Version all release-identity files.
for (const rel of ['package.json', 'package-lock.json', 'extension/manifest.json']) {
  const p = path.join(root, rel);
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (rel === 'package-lock.json') {
    json.version = '8.8.3';
    if (json.packages && json.packages['']) json.packages[''].version = '8.8.3';
  } else {
    json.version = '8.8.3';
  }
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
}

let changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
changelog = replaceOnce(
  changelog,
  '# Changelog\n\n',
  `# Changelog\n\n## [8.8.3] — P0 committee Commit button and panel stability\n\n- Replaced the small \`Reply P\` ON/OFF toggle with a large semantic \`P · COMMIT RECOMMENDATION\` button. It is armed automatically for a real Advanced multi-persona committee and becomes actionable only at a safe \`CHOICE\` boundary.\n- The P action stages and verifies the literal \`P\` through the same live-composer replacement gate before reusing the existing CHOICE/at-most-once Send path. Missing, replaced-with-wrong-text, pending, or uncertain states fail closed.\n- Adaptive/Locked/Audit posture clicks now patch their own state in place instead of rebuilding the entire Ghost panel.\n- Full renders preserve the panel's internal scroll and no longer re-apply a static configured anchor on every state update, preventing a manually moved panel from snapping back after ordinary clicks.\n- Updated the ChatGPT control regression fixture to require a large native button and pixel-stable Ghost panel/page position across Adaptive selection.\n\n**Field boundary:** this patch directly repairs the source-level toggle/remount defects and is covered by Chromium/Firefox fixtures. Authenticated real-Firefox ChatGPT/Perplexity canaries remain the final live-host proof.\n\n`,
  'changelog heading'
);
fs.writeFileSync(path.join(root, 'CHANGELOG.md'), changelog);

console.log('Applied Ghost 8.8.3 P0 Commit UI/panel-stability patch.');
