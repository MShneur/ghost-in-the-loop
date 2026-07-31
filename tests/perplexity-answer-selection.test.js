const fs = require('fs');
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
  return factory(document, Node, getComputedStyle, () => false, plat,
    '[[GITL::PROCEED]]', '[[GITL::HALT]]');
}

const perplexity = {
  assistant: ['div[class*="prose"]', 'div[dir="auto"][class*="break-words"]'],
  assistantFallback: ['.pb-md > div']
};

describe('v8.5.3 deterministic Perplexity answer selection', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('reads the current HALT answer instead of a later fallback follow-up', () => {
    document.body.innerHTML = '<div class="prose">Older answer [[GITL::PROCEED]]</div>' +
      '<div class="prose" id="current">Current complete answer with enough material. [[GITL::HALT]]</div>' +
      '<div class="pb-md"><div class="follow-up-card">Suggested follow-up question with lots of text</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('current');
    expect(picked.text).toContain('[[GITL::HALT]]');
    expect(picked.tier).toBe('primary');
  });

  test('rejects a later primary-selector follow-up card', () => {
    document.body.innerHTML = '<div class="prose" id="current">Current complete answer. [[GITL::HALT]]</div>' +
      '<div class="prose follow-up-card">A suggested next question with enough text to look substantial</div>';
    expect(selectorFor(perplexity)._selectAnswerCandidate().el.id).toBe('current');
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
    expect(selectorFor(perplexity)._selectAnswerCandidate().el.id).toBe('current');
  });

  test('uses the broad fallback only when no primary answer exists', () => {
    document.body.innerHTML = '<div class="pb-md"><div id="fallback">Fallback answer content is available. [[GITL::HALT]]</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('fallback');
    expect(picked.tier).toBe('fallback');
  });

  test('keeps the complete nested answer rather than only its marker child', () => {
    document.body.innerHTML = '<div class="prose" id="outer">Full answer body with roadmap content.' +
      '<div class="prose" id="marker">[[GITL::HALT]]</div></div>';
    const picked = selectorFor(perplexity)._selectAnswerCandidate();
    expect(picked.el.id).toBe('outer');
    expect(picked.text).toContain('Full answer body');
    expect(picked.text.trim().endsWith('[[GITL::HALT]]')).toBe(true);
  });
});
