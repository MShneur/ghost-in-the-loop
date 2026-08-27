const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.4 mobile Send confirmation contract', () => {
  test('uses a bounded 18 second confirmation window', () => { expect(src).toContain('const SEND_CONFIRM_MS  = 18000;'); });
  test('records and observes new ChatGPT user turns', () => {
    expect(src).toContain('userCount: Array.isArray(PLAT.user) ? _qAll(PLAT.user).length : null');
    expect(src).toContain("evidence: 'user-turn'");
    expect(src).toContain('data-message-author-role=\"user\"');
  });
  test('does not make composer clearing alone authoritative', () => {
    expect(src).toContain('if (composerCleared && stopVisible)');
    expect(src).toContain('if (composerCleared && trustedNetwork)');
    expect(src).not.toContain("if (composerCleared) return { confirmed: true");
  });
  test('uncertain attempts still fail closed', () => {
    expect(src).toContain("txn.state = 'uncertain'");
    expect(src).toContain("Reporter.capture('SEND-002'");
  });
});
