/**
 * PRE-DISPATCH EVIDENCE GATE (v8.7)
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('pre-dispatch evidence gate', () => {
  test('composer must hold the intended prompt', () => {
    expect(src).toContain('function _composerHoldsPrompt');
    expect(src).toContain('function _preDispatchEvidenceGate');
    expect(src).toContain("code: 'COMPOSER-002'");
  });

  test('disabled reviewed buttons block dispatch', () => {
    expect(src).toContain("code: 'SEND-004'");
    expect(src).toContain('aria-disabled');
  });

  test('multiple reviewed buttons fail closed', () => {
    expect(src).toContain("code: 'SEND-003'");
    expect(src).toContain('_reviewedPlatformSendMatches');
  });

  test('ChatGPT mobile Enter fallback remains declared', () => {
    const cgStart = src.indexOf("chatgpt: {");
    const cg = src.slice(cgStart, src.indexOf("\n  perplexity:", cgStart));
    expect(cg).toContain("dispatchFallback: 'enter'");
  });
});
