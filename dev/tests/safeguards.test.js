/**
 * SAFEGUARDS (v8.7)
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('safeguards', () => {
  test('kill switch blocks engineSend before interaction checks complete path', () => {
    const send = src.slice(src.indexOf('async function engineSend'), src.indexOf('function _confirmSend'));
    expect(send).toContain('GHOST.ui.killSwitch');
    expect(send).toContain("reason: 'kill-switch'");
  });

  test('per-site disable map is consulted', () => {
    expect(src).toContain('function _siteAutomationDisabled');
    expect(src).toContain("GM_getValue('siteDisabled'");
    expect(src).toContain("reason: 'site-disabled'");
  });

  test('dry run and net read default off via GM_getValue defaults', () => {
    expect(src).toContain("GM_getValue('dryRun', false)");
    expect(src).toContain("GM_getValue('netReadEnabled', false)");
  });

  test('route-change still pauses unless same-host recent send', () => {
    expect(src).toContain('route_id_assigned');
    expect(src).toContain('enginePause(\'Route changed — paused\')');
  });
});
