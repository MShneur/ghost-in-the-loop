'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ghost-in-the-loop.user.js');
let source = fs.readFileSync(sourcePath, 'utf8');

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: expected source block was not found`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: source block was not unique`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce(
  'Perplexity primary/fallback selectors',
  `    assistant: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]','.pb-md > div'],`,
  `    assistant: ['div[class*="prose"]','div[dir="auto"][class*="break-words"]'],\n    assistantFallback: ['.pb-md > div'],`
);

const adapterMarker = `// Adapter — all DOM reads/writes\nconst Adapter = {`;
const answerSelection = `/* ── Answer selection (v8.5.3 item 1) ────────────────────────\n   Platform selector arrays are ordered by confidence, but _qAll() groups\n   matches by selector rather than document order. On Perplexity mobile that\n   allowed a later fallback selector (including empty/follow-up containers) to\n   replace the real visible answer. Keep broad selectors fallback-only, bound\n   the candidate window, restore document order, and resolve nested duplicates\n   as one answer cluster. This layer is read-only and has no actuator authority. */\nconst ANSWER_SCAN_LIMIT = 48;\nfunction _answerText(el) {\n  try { return String((el && (el.innerText || el.textContent)) || '').replace(/\\u200b/g, '').trim(); }\n  catch(_) { return ''; }\n}\nfunction _answerTerminalAtTail(text) {\n  const s = String(text || '').replace(/\\u200b/g, '').trim();\n  return s.endsWith(SIGIL_PROCEED) || s.endsWith(SIGIL_HALT);\n}\nfunction _answerNodeUsable(el) {\n  if (!el || !el.isConnected || _isOwnUI(el)) return false;\n  try {\n    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;\n    if (el.closest && el.closest('[hidden],[aria-hidden="true"]')) return false;\n    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;\n    if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse')) return false;\n  } catch(_) {}\n  return true;\n}\nfunction _answerLooksLikeContent(el, text, tier) {\n  if (!text) return false;\n  try {\n    if (el.matches && el.matches('button,a,[role="button"]')) return false;\n    if (el.closest && el.closest('form,nav,aside,[role="navigation"],[role="toolbar"]')) return false;\n    const meta = [el.id, el.className, el.getAttribute('role'), el.getAttribute('data-testid'), el.getAttribute('aria-label')]\n      .map(v => String(v || '')).join(' ');\n    if (/follow.?up|related|suggest(?:ion|ed)?/i.test(meta)) return false;\n    if (tier === 'fallback' && /citation|source|reference|toolbar|action|composer/i.test(meta)) return false;\n  } catch(_) {}\n  if (text.includes(SIGIL_PROCEED) || text.includes(SIGIL_HALT)) return true;\n  return text.length >= 20;\n}\nfunction _answerDomOrder(a, b) {\n  if (a === b) return 0;\n  try {\n    const pos = a.compareDocumentPosition(b);\n    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;\n    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;\n  } catch(_) {}\n  return 0;\n}\nfunction _collectAnswerCandidates(selectors, tier) {\n  const byElement = new Map();\n  for (const [selectorIndex, sel] of (selectors || []).entries()) {\n    let matches = [];\n    try { matches = [...document.querySelectorAll(sel)]; } catch(_) { matches = []; }\n    const start = Math.max(0, matches.length - ANSWER_SCAN_LIMIT);\n    for (let i = start; i < matches.length; i++) {\n      const el = matches[i];\n      if (!_answerNodeUsable(el)) continue;\n      const text = _answerText(el);\n      if (!_answerLooksLikeContent(el, text, tier)) continue;\n      const prior = byElement.get(el);\n      if (!prior || selectorIndex < prior.selectorIndex) byElement.set(el, { el, text, tier, selectorIndex });\n    }\n  }\n  return [...byElement.values()].sort((a, b) => _answerDomOrder(a.el, b.el));\n}\nfunction _selectAnswerCandidate() {\n  let candidates = _collectAnswerCandidates(PLAT.assistant, 'primary');\n  if (!candidates.length) candidates = _collectAnswerCandidates(PLAT.assistantFallback || [], 'fallback');\n  if (!candidates.length) return null;\n\n  // The newest answer-bearing node is authoritative. Older terminal markers\n  // must never beat a newer answer that is still streaming or omitted a sigil.\n  const anchor = candidates[candidates.length - 1];\n  const cluster = candidates.filter(c =>\n    c.el === anchor.el || c.el.contains(anchor.el) || anchor.el.contains(c.el));\n  const terminalTail = cluster.filter(c => _answerTerminalAtTail(c.text));\n  let selected = anchor;\n  if (terminalTail.length) {\n    selected = terminalTail.reduce((best, c) => c.text.length > best.text.length ? c : best, terminalTail[0]);\n  }\n  return { ...selected, candidateCount: candidates.length, ordinal: candidates.indexOf(selected) };\n}\n\n${adapterMarker}`;
replaceOnce('answer-selection helper insertion', adapterMarker, answerSelection);

replaceOnce(
  'Adapter answer reader',
  `  hasMessages()   { return _qAll(PLAT.assistant).length > 0; },\n  getLastText() {\n    // Gemini only: virtual scroll — nudge infinite-scroller to bottom\n    if (PLAT && PLAT.key === 'gemini') {\n      try { const s = document.querySelector('infinite-scroller'); if (s) s.scrollTop = s.scrollHeight; } catch(_){}\n    }\n    const els = _qAll(PLAT.assistant);\n    return els.length ? (els[els.length-1].innerText || '').trim() : '';\n  },`,
  `  hasMessages()   { return !!_selectAnswerCandidate(); },\n  getLastText() {\n    // Gemini only: virtual scroll — nudge infinite-scroller to bottom\n    if (PLAT && PLAT.key === 'gemini') {\n      try { const s = document.querySelector('infinite-scroller'); if (s) s.scrollTop = s.scrollHeight; } catch(_){}\n    }\n    const selected = _selectAnswerCandidate();\n    return selected ? selected.text : '';\n  },`
);

fs.writeFileSync(sourcePath, source);

const testPath = path.join(root, 'tests', 'answerselection853.test.js');
const testSource = String.raw`const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');
const start = src.indexOf('const ANSWER_SCAN_LIMIT');
const end = src.indexOf('// Adapter — all DOM reads/writes', start);
if (start < 0 || end < 0) throw new Error('answer-selection helpers not found');
const helperSource = src.slice(start, end);

function selectorFor(plat) {
  const factory = Function(
    'document', 'Node', 'getComputedStyle', '_isOwnUI', 'PLAT',
    'SIGIL_PROCEED', 'SIGIL_HALT',
    helperSource + '; return { _selectAnswerCandidate, _collectAnswerCandidates };'
  );
  return factory(
    document, Node, getComputedStyle, () => false, plat,
    '[[GITL::PROCEED]]', '[[GITL::HALT]]'
  );
}

const perplexity = {
  assistant: ['div[class*="prose"]', 'div[dir="auto"][class*="break-words"]'],
  assistantFallback: ['.pb-md > div']
};

describe('v8.5.3 answer selection', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('ignores a later fallback follow-up and reads the current HALT answer', () => {
    document.body.innerHTML = '<div class="prose">Older answer [[GITL::PROCEED]]</div>' +
      '<div class="prose" id="current">Current complete answer with enough material. [[GITL::HALT]]</div>' +
      '<div class="pb-md"><div class="follow-up-card">Suggested follow-up question with lots of text</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('current');
    expect(picked.text).toContain('[[GITL::HALT]]');
    expect(picked.tier).toBe('primary');
  });

  test('rejects a later primary follow-up card', () => {
    document.body.innerHTML = '<div class="prose" id="current">Current complete answer. [[GITL::HALT]]</div>' +
      '<div class="prose follow-up-card">A suggested next question with enough text to look substantial</div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('current');
  });

  test('never lets an older terminal marker beat a newer unfinished answer', () => {
    document.body.innerHTML = '<div class="prose" id="old">Old completed answer. [[GITL::HALT]]</div>' +
      '<div class="prose" id="new">Newest answer is still being written and has no marker yet.</div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('new');
    expect(picked.text).not.toContain('[[GITL::HALT]]');
  });

  test('filters hidden and empty primary nodes', () => {
    document.body.innerHTML = '<div class="prose" id="current">Visible complete response. [[GITL::HALT]]</div>' +
      '<div class="prose" aria-hidden="true">Hidden duplicate [[GITL::PROCEED]]</div>' +
      '<div class="prose">   </div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('current');
  });

  test('uses broad fallback only when no primary answer exists', () => {
    document.body.innerHTML = '<div class="pb-md"><div id="fallback">Fallback answer content is available. [[GITL::HALT]]</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('fallback');
    expect(picked.tier).toBe('fallback');
  });

  test('keeps the full nested answer node when the marker is in a child', () => {
    document.body.innerHTML = '<div class="prose" id="outer">Full answer body with roadmap content.' +
      '<div class="prose" id="marker">[[GITL::HALT]]</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('outer');
    expect(picked.text).toContain('Full answer body');
    expect(picked.text.trim().endsWith('[[GITL::HALT]]')).toBe(true);
  });
});
`;
fs.writeFileSync(testPath, testSource);

console.log('Applied v8.5.3 item 1: deterministic answer selection and tests.');
