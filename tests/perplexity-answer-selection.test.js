const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function extractFunction(name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} not found`);
  const brace = src.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`${name} was not closed`);
}

const selectAnswer = new Function(
  '_isOwnUI', 'SIGIL_HALT', 'SIGIL_PROCEED',
  `${extractFunction('_selectAssistantAnswer')}; return _selectAssistantAnswer;`
)(() => false, '[[GITL::HALT]]', '[[GITL::PROCEED]]');

function rendered(el, width = 500, height = 100) {
  el.getBoundingClientRect = () => ({ left: 0, top: 0, right: width, bottom: height, width, height });
  return el;
}

beforeEach(() => { document.body.innerHTML = ''; });

describe('v8.5.3 assistant answer selection', () => {
  test('restores global DOM order and selects the visible terminal answer over a later follow-up', () => {
    document.body.innerHTML = `
      <main>
        <div id="old" class="prose">Older completed answer [[GITL::PROCEED]]</div>
        <section><div id="answer" dir="auto" class="break-words">Current final answer with enough detail [[GITL::HALT]]</div></section>
        <div id="follow" class="prose">A suggested follow-up question that is not the answer</div>
      </main>`;
    const old = rendered(document.getElementById('old'));
    const answer = rendered(document.getElementById('answer'));
    const follow = rendered(document.getElementById('follow'));
    const result = selectAnswer([old, follow, answer]);
    expect(result.text).toContain('Current final answer');
    expect(result.terminal).toBe('halt');
  });

  test('ignores hidden virtualized duplicates', () => {
    document.body.innerHTML = `
      <div id="visible">Visible current answer [[GITL::PROCEED]]</div>
      <div id="hidden" aria-hidden="true">Hidden stale answer [[GITL::HALT]]</div>`;
    const result = selectAnswer([
      rendered(document.getElementById('visible')),
      rendered(document.getElementById('hidden'))
    ]);
    expect(result.terminal).toBe('proceed');
  });

  test('prefers the inner answer-bearing node over a wrapper containing trailing UI', () => {
    document.body.innerHTML = `
      <article id="wrapper"><div id="answer">Substantive answer [[GITL::HALT]]</div><div>Follow-ups and citations</div></article>`;
    const wrapper = rendered(document.getElementById('wrapper'));
    const answer = rendered(document.getElementById('answer'));
    const result = selectAnswer([wrapper, answer]);
    expect(result.element).toBe(answer);
    expect(result.text).toBe('Substantive answer [[GITL::HALT]]');
  });

  test('falls back to the latest substantial streaming answer when no marker exists yet', () => {
    document.body.innerHTML = `<div id="old">An older substantial answer</div><div id="new">The newest answer is still streaming and has no marker yet</div>`;
    const result = selectAnswer([
      rendered(document.getElementById('new')),
      rendered(document.getElementById('old'))
    ]);
    expect(result.text).toContain('newest answer');
    expect(result.terminal).toBe('none');
  });
});
