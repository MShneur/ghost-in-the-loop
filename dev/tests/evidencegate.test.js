/**
 * PRE-DISPATCH EVIDENCE GATE (v8.7.0 — Track A)
 *
 * The at-most-once journal may only open when the composer verifiably holds
 * the prompt Ghost just staged. injectText() can report success while a
 * strict editor (React/ProseMirror/Lexical builds) silently drops the text —
 * and a composer may hold PRE-EXISTING user text that a dispatch would send
 * as-is. Both cases must fail loud BEFORE any mechanism is chosen, so no
 * transaction is ever opened against unstaged content.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = nextName ? src.indexOf(`function ${nextName}`, start + 1) : -1;
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('staging evidence helper', () => {
  test('whitespace does not matter (ProseMirror <p> concatenation)', () => {
    expect(_normStagedText('a b\nc')).toBe('abc');
    expect(_normStagedText('​zero-width​')).toBe('zero-width');
  });

  test('short prompts must appear whole', () => {
    const el = { value: '', textContent: 'Continue' };
    expect(_promptStagedInComposer(el, 'Continue')).toBe(true);
    expect(_promptStagedInComposer(el, 'Continue.')).toBe(false);
  });

  test('long prompts verify by head+tail signature', () => {
    const prompt = `Continue.\n\n[Ghost roadmap — step 2 of 5]\n${'x'.repeat(200)}\nEnd with [[GITL::PROCEED]] when done.`;
    const el = { value: '', textContent: prompt };
    expect(_promptStagedInComposer(el, prompt)).toBe(true);
    // Same head, different tail — NOT our staged prompt
    const other = { value: '', textContent: prompt.slice(0, 100) + 'completely different ending text here' };
    expect(_promptStagedInComposer(other, prompt)).toBe(false);
  });

  test('empty composer or empty prompt fails', () => {
    expect(_promptStagedInComposer({ value: '', textContent: '' }, 'Continue')).toBe(false);
    expect(_promptStagedInComposer({ value: 'something', textContent: '' }, '')).toBe(false);
    expect(_promptStagedInComposer(null, 'Continue')).toBe(false);
  });

  test('pre-existing user text that is NOT ours fails', () => {
    const el = { value: 'half-typed user draft', textContent: '' };
    expect(_promptStagedInComposer(el, 'Continue')).toBe(false);
  });
});

describe('gate placement in engineSend', () => {
  const send = body('engineSend', '_confirmSend');

  test('the gate runs after staging and before strategy selection', () => {
    const injectAt = send.indexOf('Adapter.injectText(input, text)');
    const gateAt = send.indexOf('_promptStagedInComposer(input, text)');
    const btnAt = send.indexOf('const btn = Adapter.getSendBtn()');
    expect(injectAt).toBeGreaterThan(-1);
    expect(gateAt).toBeGreaterThan(injectAt);
    expect(btnAt).toBeGreaterThan(gateAt);
  });

  test('a gate failure is loud and never opens the journal', () => {
    const gateAt = send.indexOf('_promptStagedInComposer(input, text)');
    const beginAt = send.indexOf('const completion = _beginSendAttempt(');
    expect(gateAt).toBeGreaterThan(-1);
    expect(beginAt).toBeGreaterThan(gateAt);
    expect(send).toContain("Reporter.capture('COMPOSER-002'");
    expect(send).toContain('Prompt not staged in composer');
    // The gate's own failure block returns before any dispatch is possible
    const blockEnd = send.indexOf('return false;', gateAt);
    const gateBlock = send.slice(gateAt, blockEnd + 13);
    expect(gateBlock).toContain('COMPOSER-002');
    expect(gateBlock).not.toContain('strategy.run()');
    expect(gateBlock).not.toContain('.click()');
    expect(gateBlock).not.toContain('_beginSendAttempt');
  });

  test('the gate cannot weaken existing guards (tab lease, generating, interaction-safe still run first)', () => {
    const safeAt = send.indexOf('assertInteractionSafe()');
    const leaseAt = send.indexOf('verifyTabLease()');
    const genAt = send.indexOf('Adapter.isGenerating()');
    const gateAt = send.indexOf('_promptStagedInComposer(input, text)');
    expect(safeAt).toBeGreaterThan(-1);
    expect(leaseAt).toBeGreaterThan(-1);
    expect(genAt).toBeGreaterThan(-1);
    expect(gateAt).toBeGreaterThan(leaseAt);
    expect(gateAt).toBeGreaterThan(genAt);
  });
});
