import fs from 'node:fs';

const sourcePath = 'ghost-in-the-loop.user.js';
let src = fs.readFileSync(sourcePath, 'utf8');

function replaceOnce(label, before, after) {
  const first = src.indexOf(before);
  const second = first < 0 ? -1 : src.indexOf(before, first + before.length);
  if (first < 0 || second >= 0) throw new Error(`${label}: expected exactly one anchor`);
  src = src.slice(0, first) + after + src.slice(first + before.length);
}

function replaceBetween(label, startMarker, endMarker, replacement) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error(`${label}: start marker not found`);
  const duplicateStart = src.indexOf(startMarker, start + startMarker.length);
  if (duplicateStart >= 0) throw new Error(`${label}: start marker is ambiguous`);
  const end = src.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`${label}: end marker not found`);
  src = src.slice(0, start) + replacement + src.slice(end);
}

replaceOnce(
  'send-ready constant',
  "const SEND_CONFIRM_MS  = 9000;  // grace for generation to begin (covers slow first-token)",
  "const SEND_CONFIRM_MS  = 9000;  // grace for generation to begin (covers slow first-token)\nconst SEND_READY_MS    = 2200;  // bounded pre-transaction wait for a reviewed Send control to become enabled"
);

replaceBetween(
  'reviewed send authority state',
  'function _reviewedSend() {',
  '/* ── Answer selection (v8.5.3 item 1)',
`function _reviewedSendState() {
  // Resolve every source of reviewed authority into one union before granting
  // a click. Disabled/hidden controls are not authority yet; two enabled
  // reviewed controls are an ambiguity and must fail closed rather than fall
  // through to Enter.
  const candidates = new Set();
  const state = () => ({
    button: candidates.size === 1 ? [...candidates][0] : null,
    ambiguous: candidates.size > 1,
    count: candidates.size
  });
  const collect = (sel) => {
    let matches = [];
    try {
      matches = [...document.querySelectorAll(sel)].filter(el =>
        !_isOwnUI(el)
        && !el.disabled
        && el.getAttribute('aria-disabled') !== 'true'
        && _visible(el)
        && _sendLooksSafe(el));
    } catch(_) {
      matches = [];
    }
    for (const match of matches) candidates.add(match);
    return !state().ambiguous;
  };

  const taughtSel = TeachStore.get('send');
  if (taughtSel && !collect(taughtSel)) return state();
  if (!PLAT?.reviewed) return state();

  // A page can expose two plausible controls where only one also matches a
  // later, more specific selector. Selector aliases for the same DOM node are
  // deduplicated by the Set; distinct enabled controls remain ambiguous.
  for (const sel of PLAT.send || []) {
    if (!collect(sel)) return state();
  }
  return state();
}

function _reviewedSend() {
  return _reviewedSendState().button;
}

`
);

replaceOnce(
  'insert reviewed send readiness helper',
  'function _settleSendPromise(ok) {',
`async function _awaitReviewedSend(timeoutMs = SEND_READY_MS) {
  const startedAt = Date.now();
  const deadline = startedAt + Math.max(0, Number(timeoutMs) || 0);
  let polls = 0;
  let current = _reviewedSendState();
  while (Date.now() <= deadline) {
    polls++;
    current = _reviewedSendState();
    if (current.button || current.ambiguous) {
      return { ...current, polls, waitedMs: Date.now() - startedAt, timedOut: false };
    }
    await sleep(120);
  }
  return { ...current, polls, waitedMs: Date.now() - startedAt, timedOut: true };
}

function _settleSendPromise(ok) {`
);

replaceBetween(
  'engine send readiness gate',
  '    const btn = Adapter.getSendBtn();',
  '    if (!strategy) {',
`    // The real mobile hosts can retain the exact staged prompt before their
    // framework flips Submit/Send from disabled to enabled. Wait only BEFORE
    // opening the at-most-once transaction. This is observation, not actuation.
    const sendReady = await _awaitReviewedSend();
    if (sendReady.ambiguous) {
      Timeline.record('send_blocked', { reason: 'reviewed-send-ambiguous', candidates: sendReady.count });
      Reporter.capture('SEND-001', 'Multiple enabled reviewed Send controls were present; nothing was sent.');
      pauseWithProbe('Ambiguous Send controls — nothing was sent');
      return false;
    }
    const btn = sendReady.button;
    Timeline.record(btn ? 'send_ready' : 'send_ready_timeout', {
      polls: sendReady.polls,
      waitedMs: sendReady.waitedMs,
      platform: PLAT?.key || 'generic'
    });
    // Choose exactly one dispatch mechanism BEFORE opening the at-most-once
    // journal. If no reviewed button becomes ready inside the bounded window,
    // retain the pre-existing reviewed Enter fallback for hosts/layouts that
    // intentionally expose no button. Once the journal opens there is still
    // no actuator escalation or retry.
    const strategy = btn ? {
      path: 'reviewed-button',
      run: () => btn.click()
    } : (PLAT?.reviewed && PLAT.dispatchFallback === 'enter' ? {
      path: 'reviewed-enter',
      run: () => stagedInput.dispatchEvent(new KeyboardEvent('keydown', {
        key:'Enter', code:'Enter', keyCode:13, which:13,
        bubbles:true, cancelable:true, composed:true
      }))
    } : null);
`
);

fs.writeFileSync(sourcePath, src);

const boundaryPath = 'tests/basic-advanced-boundary.test.js';
let boundary = fs.readFileSync(boundaryPath, 'utf8');
const oldDefault = `    expect(SRC).toContain("runAdv: GM_getValue('runAdv',false)");\n    expect(SRC).toContain("committeeProceed: GM_getValue('committeeProceed',false)");\n    expect(SRC).toContain("Advanced ON ▴':'Advanced OFF ▾");`;
const newDefault = `    expect(SRC).toContain("runAdv: GM_getValue('runAdv',false)");\n    expect(SRC).not.toContain("committeeProceed: GM_getValue('committeeProceed',false)");\n    expect(SRC).toContain("Advanced ON ▴':'Advanced OFF ▾");`;
if (!boundary.includes(oldDefault)) throw new Error('basic boundary default anchor not found');
boundary = boundary.replace(oldDefault, newDefault);

const oldCommittee = `  test('committee P shortcut is Advanced-only and exact-P only', () => {\n    expect(SRC).toContain('if (GHOST.ui.committeeProceed) out += COMMITTEE_P_SHORTCUT;');\n    expect(SRC).toContain("advancedRunOn() && GHOST.ui.committeeProceed && /^p$/i.test(typed)");\n    expect(SRC).toContain('Recommended by committee');\n  });`;
const newCommittee = `  test('committee P shortcut requires a real Advanced multi-persona committee and exact-P', () => {\n    expect(SRC).toContain('return advancedRunOn() && active.length >= 2;');\n    expect(SRC).toContain('if (_committeeCommitPrepared()) out += COMMITTEE_P_SHORTCUT;');\n    expect(SRC).toContain("_committeeCommitPrepared() && /^p$/i.test(typed)");\n    expect(SRC).toContain('Recommended by committee');\n  });`;
if (!boundary.includes(oldCommittee)) throw new Error('basic boundary committee anchor not found');
boundary = boundary.replace(oldCommittee, newCommittee);
fs.writeFileSync(boundaryPath, boundary);

const readinessTest = `/**\n * 8.8.3 field-repair contract: staged text may be committed before the host\n * enables its reviewed Send/Submit control. The wait is pre-transaction only.\n */\nconst fs = require('fs');\nconst path = require('path');\nconst SRC = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');\n\nfunction between(start, end) {\n  const a = SRC.indexOf(start);\n  const b = SRC.indexOf(end, a + start.length);\n  if (a < 0 || b < 0) throw new Error('source marker not found');\n  return SRC.slice(a, b);\n}\n\ndescribe('reviewed Send readiness gate', () => {\n  test('waits for reviewed button readiness before selecting Enter fallback', () => {\n    expect(SRC).toContain('const SEND_READY_MS    = 2200;');\n    expect(SRC).toContain('async function _awaitReviewedSend(timeoutMs = SEND_READY_MS)');\n    const send = between('async function engineSend(text, skipDelay)', '/* Commit is the only transition allowed to advance state. */');\n    expect(send).toContain('const sendReady = await _awaitReviewedSend();');\n    expect(send.indexOf('const sendReady = await _awaitReviewedSend();')).toBeLessThan(send.indexOf("path: 'reviewed-enter'"));\n    expect(send.indexOf('const sendReady = await _awaitReviewedSend();')).toBeLessThan(send.indexOf('_beginSendAttempt(strategy.path, stagedInput)'));\n  });\n\n  test('reviewed ambiguity fails closed before the send transaction', () => {\n    const send = between('async function engineSend(text, skipDelay)', '/* Commit is the only transition allowed to advance state. */');\n    const ambiguous = send.indexOf('if (sendReady.ambiguous)');\n    const transaction = send.indexOf('_beginSendAttempt(strategy.path, stagedInput)');\n    expect(ambiguous).toBeGreaterThan(0);\n    expect(transaction).toBeGreaterThan(ambiguous);\n    expect(send.slice(ambiguous, transaction)).toContain('return false;');\n    expect(SRC).toContain('function _reviewedSendState()');\n    expect(SRC).toContain('ambiguous: candidates.size > 1');\n  });\n\n  test('there is still exactly one actuator invocation after transaction start', () => {\n    const send = between('async function engineSend(text, skipDelay)', '/* Commit is the only transition allowed to advance state. */');\n    const afterTxn = send.slice(send.indexOf('const completion = _beginSendAttempt'));\n    expect(afterTxn.match(/strategy\\.run\\(\\)/g) || []).toHaveLength(1);\n    expect(afterTxn).not.toContain('btn.click()');\n    expect(afterTxn).not.toContain("dispatchFallback === 'enter'");\n  });\n});\n`;
fs.writeFileSync('tests/send-readiness-gate.test.js', readinessTest);

console.log('APPLY_883_FIELD_REPAIR_PASS');
