'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

function between(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error('source markers missing: ' + start + ' / ' + end);
  return source.slice(a, b);
}

function signalEngine() {
  const constants = between("const SIGIL_PROCEED", "/* Send-confirmation watchdog");
  const engine = between("const FUZZY_PROCEED", "/* ═══════════════════════════════════════════════════════════════\n   PAYLOADS");
  const factory = new Function('GHOST', 'DIAG', constants + '\n' + engine + '\nreturn { detectSignal, FUZZY_PROCEED, FUZZY_CHOICE };');
  return factory({ signals: { windowSize: 1200, customStop: '', customProceed: '' } }, {});
}

describe('explicit CHOICE state', () => {
  test('explicit marker and user-decision questions pause instead of proceeding', () => {
    const { detectSignal } = signalEngine();
    expect(detectSignal('A'.repeat(60) + '\n[[GITL::CHOICE]]').signal).toBe('choice');
    expect(detectSignal('A'.repeat(60) + '\nWhich option should I use? Awaiting your choice.').signal).toBe('choice');
    expect(detectSignal('A'.repeat(60) + '\n[[GITL::PROCEED]]\nShould I continue?').signal).toBe('choice');
  });

  test('explicit HALT stays authoritative', () => {
    const { detectSignal } = signalEngine();
    expect(detectSignal('A'.repeat(60) + '\n[[GITL::CHOICE]]\n[[GITL::HALT]]').signal).toBe('halt');
  });

  test('question phrases are removed from fuzzy proceed', () => {
    const { FUZZY_PROCEED, FUZZY_CHOICE } = signalEngine();
    for (const phrase of ['shall i continue', 'should i continue', 'want me to continue', 'continue?', 'awaiting your']) {
      expect(FUZZY_PROCEED).not.toContain(phrase);
      expect(FUZZY_CHOICE).toContain(phrase);
    }
  });

  test('choice transition stops automation and never dispatches', () => {
    const block = between("if (result.signal === 'choice')", "if (result.signal === 'halt')");
    expect(block).toContain("L.state = 'CHOICE'");
    expect(block).toContain("L.phase = 'choice'");
    expect(block).toContain('Ticker.stop()');
    expect(block).not.toContain('engineSend(');
    expect(source.indexOf("if (result.signal === 'choice')")).toBeLessThan(source.indexOf('if(Adapter.clickContinue())'));
  });

  test('answering a choice preserves the existing run and dispatches once', () => {
    const block = between("if (L.state === 'CHOICE')", "// Mark first run done");
    expect(block).not.toContain('L.round = 0');
    expect(block).not.toContain('L.originalTask =');
    expect((block.match(/engineSend\(/g) || []).length).toBe(1);
    expect(block).toContain("Timeline.record('choice_answered'");
  });

  test('default help is plain language while Advanced retains exact protocol', () => {
    const help = between("start: { label: 'Start'", "run: { label: 'Run'");
    expect(help).not.toContain('[[GITL::PROCEED]]');
    expect(help).not.toContain('[[GITL::CHOICE]]');
    const payloads = between('const PAYLOADS = {', 'const RESUME_TEXT');
    expect(payloads).toContain('[[GITL::PROCEED]]');
    expect(payloads).toContain('[[GITL::CHOICE]]');
    expect(payloads).toContain('[[GITL::HALT]]');
  });
});
