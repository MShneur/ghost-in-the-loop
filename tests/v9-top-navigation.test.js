const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');

function between(startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  const end = src.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0) throw new Error(`missing ${startNeedle}`);
  return src.slice(start, end < 0 ? undefined : end);
}

describe('v9 Top navigation', () => {
  test('Top is compact and immediately beside Page', () => {
    expect(src).toContain('<button data-a="reload">↻ Page</button><button data-a="top"');
    expect(src).toContain('>↑ Top</button>');
  });

  test('Top is disabled while Play is running or transport recovery is busy', () => {
    const render = between('function render()', "render();\nwindow.__GITL_V9__");
    expect(render).toContain("S.mode==='RUNNING'||S.sending||S.watchdogBusy||S.topBusy?'disabled':''");
    const goTop = between('async function goTop()', 'function domTurns()');
    expect(goTop).toContain("S.mode === 'RUNNING'");
    expect(goTop).toContain("S.detail = 'Pause Play before using ↑ Top.'");
  });

  test('container detection prefers the real conversation ancestry and scrollability', () => {
    const body = between('function conversationNodes()', 'async function goTop()');
    expect(body).toContain('HOST.user');
    expect(body).toContain('HOST.assistant');
    expect(body).toContain('anchor.parentElement');
    expect(body).toContain('getComputedStyle(el)');
    expect(body).toContain('overflowY');
    expect(body).toContain('el.scrollHeight > el.clientHeight + 8');
    expect(body).toContain('document.scrollingElement || document.documentElement');
  });

  test('lazy history loading is bounded and requires repeated stable top observations', () => {
    expect(src).toContain('const TOP_MAX_PASSES = 24;');
    expect(src).toContain('const TOP_WAIT_MS = 500;');
    expect(src).toContain('const TOP_STABLE_PASSES = 2;');
    const goTop = between('async function goTop()', 'function domTurns()');
    expect(goTop).toContain('passes < TOP_MAX_PASSES');
    expect(goTop).toContain('const before = topSnapshot(scroller)');
    expect(goTop).toContain('const after = topSnapshot(scroller)');
    expect(goTop).toContain('await sleep(TOP_WAIT_MS)');
    expect(goTop).toContain('stable >= TOP_STABLE_PASSES');
  });

  test('snapshot can detect prepended older history', () => {
    const body = between('function topSnapshot(', 'function scrollContainerToTop(');
    expect(body).toContain('nodes.length');
    expect(body).toContain('scrollHeight');
    expect(body).toContain("hash(nodeText(first || ''))");
  });

  test('Top never becomes a prompt or Send actuator', () => {
    const goTop = between('async function goTop()', 'function domTurns()');
    expect(goTop).not.toContain('sendOnce(');
    expect(goTop).not.toContain('setComposerText(');
    expect(goTop).not.toContain('localSendButton(');
    expect(goTop).not.toContain('requestSubmit');
    expect(goTop).not.toContain('.click()');
    expect(goTop).not.toContain('dispatchEvent');
  });

  test('Top never writes URL/hash, loop state, or panel position', () => {
    const goTop = between('async function goTop()', 'function domTurns()');
    expect(goTop).not.toMatch(/location\.(assign|replace)|history\.(pushState|replaceState)|location\.hash\s*=/);
    expect(goTop).not.toMatch(/S\.(mode|round|sending|uncertain|lastHandled|awaitingFrom|stableHash|stableSince|drift|relay|stallState|stopAttempts|recoveryCount)\s*=/);
    expect(goTop).not.toMatch(/panel\.style|gitl9.*(top|left|right|bottom)/i);
  });

  test('touch navigation does not steal composer focus', () => {
    const render = between('function render()', "render();\nwindow.__GITL_V9__");
    expect(render).toContain("topButton?.addEventListener('pointerdown', e => e.preventDefault())");
    expect(render).not.toContain('topButton?.focus(');
  });
});
