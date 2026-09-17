const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

function extractConst(name) {
  const m = src.match(new RegExp(`const ${name} = ([^;]+);`));
  if (!m) throw new Error(`missing ${name}`);
  return Function(`return (${m[1]});`)();
}

function extractFunction(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = src.indexOf(`function ${nextName}`, start + 1);
  if (start < 0) throw new Error(`missing ${name}`);
  return src.slice(start, end < 0 ? undefined : end);
}

describe('v9 stall watchdog', () => {
  test('uses 5 minute soft stall and 2 minute grace', () => {
    expect(extractConst('STALL_SOFT_MS')).toBe(5 * 60 * 1000);
    expect(extractConst('STALL_GRACE_MS')).toBe(2 * 60 * 1000);
    expect(extractConst('STOP_MAX_ATTEMPTS')).toBe(3);
  });

  test('phase boundary is mechanical and a second hard stall requires a human', () => {
    const soft = extractConst('STALL_SOFT_MS');
    const grace = extractConst('STALL_GRACE_MS');
    const body = extractFunction('watchdogPhase', 'noteGenerationProgress');
    const watchdogPhase = Function('STALL_SOFT_MS', 'STALL_GRACE_MS', `${body}; return watchdogPhase;`)(soft, grace);

    expect(watchdogPhase(soft - 1, 0)).toBe('OBSERVING');
    expect(watchdogPhase(soft, 0)).toBe('SUSPECTED_STALL');
    expect(watchdogPhase(soft + grace - 1, 0)).toBe('SUSPECTED_STALL');
    expect(watchdogPhase(soft + grace, 0)).toBe('STOPPING');
    expect(watchdogPhase(soft + grace, 1)).toBe('HUMAN_REQUIRED');
  });

  test('watchdog progress uses assistant fingerprint changes, not semantic task judgment', () => {
    const body = extractFunction('noteGenerationProgress', 'contractText');
    expect(body).toContain('hash(assistantText())');
    expect(body).not.toMatch(/reason|quality|plan|task meaning|semantic/i);
  });

  test('stall recovery requires exactly one visible Stop control and is bounded to three attempts', () => {
    const body = extractFunction('recoverStall', 'handleTerminal');
    expect(body).toContain('stops.length !== 1');
    expect(body).toContain('attempt <= STOP_MAX_ATTEMPTS');
    expect(body).toContain('waitForGenerationStop()');
    expect(body).not.toContain('requestSubmit');
    expect(body).not.toMatch(/dispatchEvent\([^)]*KeyboardEvent|\.press\(|Enter fallback/i);
  });

  test('recovery prompt is sent only through canonical sendOnce after confirmed stop', () => {
    const body = extractFunction('recoverStall', 'handleTerminal');
    expect(body).toContain("await sendOnce(stallRecoveryPrompt(), 'stall recovery')");
    expect(body).not.toMatch(/localSendButton|\.click\(\).*stallRecoveryPrompt|requestSubmit/);
  });

  test('uncertain Stop never sends a recovery prompt', () => {
    const body = extractFunction('recoverStall', 'handleTerminal');
    const ambiguous = body.indexOf('stops.length !== 1');
    const send = body.indexOf("sendOnce(stallRecoveryPrompt(), 'stall recovery')");
    expect(ambiguous).toBeGreaterThanOrEqual(0);
    expect(send).toBeGreaterThan(ambiguous);
    expect(body.slice(ambiguous, send)).toContain("pause('Needs you — recovery uncertain");
  });

  test('diagnostic report exposes watchdog state without response content', () => {
    const body = extractFunction('report', 'copyReport');
    expect(body).toContain('stallState');
    expect(body).toContain('stopAttempts');
    expect(body).toContain('recoveryCount');
    expect(body).not.toContain('lastProgressFingerprint');
  });
});
