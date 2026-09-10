const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

describe('8.8.5 Perplexity staging + production fallback UI', () => {
  test('pins current Perplexity Lexical composer and avoids double insertText notification', () => {
    expect(src).toContain('#ask-input[data-lexical-editor=\"true\"][contenteditable=\"true\"]');
    expect(src).toContain("const isLexical = el.getAttribute('data-lexical-editor') === 'true'");
    expect(src).toContain("DIAG.sendPath = isLexical ? 'lexical-once' : 'contenteditable'");
  });
  test('repairs only the exact doubled pre-dispatch payload', () => {
    expect(src).toContain('function _isExactDoubleStagedComposer');
    expect(src).toContain('expected + expected');
    expect(src).toContain("Timeline.record('composer_duplicate_repaired'");
  });
  test('production Transport exposes all requested Send methods', () => {
    for (const label of ['Auto','Alpha','Beta','Gamma','Delta']) expect(src).toContain("['" + label.toLowerCase() + "','" + label + "']");
    expect(src).toContain('data-g-send-route');
    expect(src).toContain('SEND METHOD');
  });
  test('selected routes are resolved before the at-most-once boundary', () => {
    const select = src.indexOf('const strategy = _selectDispatchStrategy(stagedInput);');
    const journal = src.indexOf('_beginSendAttempt(strategy.path', select);
    expect(select).toBeGreaterThan(-1);
    expect(journal).toBeGreaterThan(select);
  });
  test('Resume can retry only a volatile pre-dispatch command', () => {
    expect(src).toContain('let _pendingPreDispatch = null;');
    expect(src).toContain("L.state === 'PAUSED' && _pendingPreDispatch");
    expect(src).toContain('_pendingPreDispatch = null; // boundary: any later ambiguity must never auto-retry');
  });
  test('uncertain Send locks route switching', () => {
    expect(src).toContain("const locked = GHOST.loop.sendTxn?.state === 'uncertain'");
    expect(src).toContain('reconcile uncertain Send first');
  });
});
