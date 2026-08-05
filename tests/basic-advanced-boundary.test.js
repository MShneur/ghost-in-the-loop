/**
 * Basic/Advanced boundary regression contract.
 * Basic must remain workflow-neutral; all methodology is opt-in.
 */
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

function between(start, end) {
  const a = SRC.indexOf(start);
  const b = SRC.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error('source marker not found');
  return SRC.slice(a, b);
}

describe('Basic is neutral and Advanced is additive', () => {
  test('Basic protocol contains only the three control outcomes', () => {
    const block = between('const BASIC_CONTROL_PROTOCOL = `', '`;\n\n/* Optional Advanced shortcut');
    expect(block).toContain('[[GITL::PROCEED]]');
    expect(block).toContain('[[GITL::CHOICE]]');
    expect(block).toContain('[[GITL::HALT]]');
    expect(block).toContain("Keep the user's existing workflow and instructions unchanged");
    expect(block).not.toMatch(/Step X|Batch X|persona|committee|posture|roadmap/i);
  });

  test('runDirectives returns before any Advanced methodology when Advanced is off', () => {
    const block = between('function runDirectives(includeStrategy = true)', 'function hasPendingDirectives()');
    const boundary = block.indexOf('if (!advancedRunOn()) return out;');
    expect(boundary).toBeGreaterThan(0);
    for (const advancedTerm of ['resolvePersonaInject()', 'PAYLOADS[L.payloadMode].inject', 'posture.clause', 'COMMITTEE_P_SHORTCUT']) {
      expect(block.indexOf(advancedTerm)).toBeGreaterThan(boundary);
    }
  });

  test('Advanced is off by default, persisted, and visibly reports ON/OFF', () => {
    expect(SRC).toContain("runAdv: GM_getValue('runAdv',false)");
    expect(SRC).toContain("committeeProceed: GM_getValue('committeeProceed',false)");
    expect(SRC).toContain("Advanced ON ▴':'Advanced OFF ▾");
    expect(SRC).toContain("_save('runAdv',GHOST.ui.runAdv)");
  });

  test('committee P shortcut is Advanced-only and exact-P only', () => {
    expect(SRC).toContain('if (GHOST.ui.committeeProceed) out += COMMITTEE_P_SHORTCUT;');
    expect(SRC).toContain("advancedRunOn() && GHOST.ui.committeeProceed && /^p$/i.test(typed)");
    expect(SRC).toContain('Recommended by committee');
  });

  test('Basic does not activate saved roadmap, workflow, persona, or soft-proceed behavior', () => {
    expect(SRC).toContain("advancedRunOn() && L.payloadMode === 'roadmap'");
    expect(SRC).toContain("GHOST.workflow.active = advancedRunOn() && GHOST.workflow.selected !== 'none';");
    expect(SRC).toContain('advancedRunOn() && GHOST.persona.perTask');
    expect(SRC).toContain("if (!advancedRunOn()) {\n      enginePause('No control marker — waiting for the user');");
  });

  test('resume prompt is bare Continue plus the selected protocol boundary', () => {
    expect(SRC).toContain("const RESUME_TEXT = 'Continue.';");
    const line = SRC.match(/const RESUME_TEXT[^\n]+/)[0];
    expect(line).not.toMatch(/Step X|committee|posture|roadmap/i);
  });
});
