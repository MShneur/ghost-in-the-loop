'use strict';

const fs = require('fs');

function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (text.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous patch anchor: ${label}`);
  return text.slice(0, first) + after + text.slice(first + before.length);
}

const sourcePath = 'ghost-in-the-loop.user.js';
let source = fs.readFileSync(sourcePath, 'utf8');

const oldReader = `function _composerText(el) {
  if (!el) return '';
  const tag = String(el.tagName || '').toUpperCase();
  const text = tag === 'TEXTAREA' || tag === 'INPUT' ? el.value : el.textContent;
  return String(text || '').trim();
}`;

const newReader = `function _composerText(el) {
  if (!el) return '';
  const tag = String(el.tagName || '').toUpperCase();
  let text;
  if (tag === 'TEXTAREA' || tag === 'INPUT') {
    text = el.value;
  } else {
    /* Rich editors represent visible line breaks with block nodes. textContent
       concatenates adjacent blocks (for example <p>one</p><p>two</p> becomes
       "onetwo"), which falsely rejected complete multiline prompts on current
       ChatGPT mobile. innerText reflects the rendered editing text; fall back
       to textContent for DOM shims and editors that do not expose innerText. */
    const rendered = typeof el.innerText === 'string' ? el.innerText : '';
    text = rendered || el.textContent;
  }
  return String(text || '').trim();
}`;

source = replaceOnce(source, oldReader, newReader, '_composerText semantic reader');
fs.writeFileSync(sourcePath, source);

const unitPath = 'tests/repo-nanny/composer-evidence.test.js';
let unit = fs.readFileSync(unitPath, 'utf8');
const unitAnchor = `  test('rejects detached composers and empty expected prompts', () => {`;
const unitTest = `  test('accepts a complete multiline prompt rendered as contenteditable block nodes', () => {
    const input = document.createElement('div');
    input.setAttribute('contenteditable', 'true');
    input.innerHTML = '<p>Start the scheduled worker.</p><p>Read the GitHub assignment.</p>';
    Object.defineProperty(input, 'innerText', {
      configurable: true,
      value: 'Start the scheduled worker.\\nRead the GitHub assignment.'
    });
    document.body.appendChild(input);

    expect(input.textContent).toBe('Start the scheduled worker.Read the GitHub assignment.');
    expect(_promptStagedInComposer(
      input,
      'Start the scheduled worker.\\nRead the GitHub assignment.'
    )).toBe(true);
    input.remove();
  });

`;
unit = replaceOnce(unit, unitAnchor, unitTest + unitAnchor, 'multiline unit regression');
fs.writeFileSync(unitPath, unit);

const e2ePath = 'tests/e2e/repo-nanny/send-evidence.spec.js';
let e2e = fs.readFileSync(e2ePath, 'utf8');
e2e = replaceOnce(
  e2e,
  `  window.__GITL_TestSend = async text => {`,
  `  window.__GITL_TestSend = async (text, options = {}) => {`,
  'e2e options signature'
);
e2e = replaceOnce(
  e2e,
  `    PLAT.useCE = false;\n    PLAT.useNS = false;`,
  `    PLAT.useCE = !!options.contenteditable;\n    PLAT.useNS = false;`,
  'e2e contenteditable option'
);
const pageAnchor = `const PAGE = \`data:text/html,\${encodeURIComponent(\`<!doctype html><html><body>\n  <main>\n    <div id="assistant">Prior response.</div>\n    <textarea id="composer"></textarea>\n    <button id="send" aria-label="Send message">Send</button>\n  </main>\n</body></html>\`)}\`;`;
const pageReplacement = `${pageAnchor}

const CONTENTEDITABLE_PAGE = \`data:text/html,\${encodeURIComponent(\`<!doctype html><html><body>
  <main>
    <div id="assistant">Prior response.</div>
    <div id="composer" contenteditable="true"></div>
    <button id="send" aria-label="Send message">Send</button>
  </main>
</body></html>\`)}\`;`;
e2e = replaceOnce(e2e, pageAnchor, pageReplacement, 'contenteditable e2e page');
e2e = replaceOnce(
  e2e,
  `async function boot(page) {\n  await page.addInitScript(GM);\n  await page.addInitScript(SCRIPT);\n  await page.goto(PAGE);`,
  `async function boot(page, url = PAGE) {\n  await page.addInitScript(GM);\n  await page.addInitScript(SCRIPT);\n  await page.goto(url);`,
  'parameterized e2e boot'
);
const closeAnchor = `  test('a verified prompt dispatches through one reviewed button and confirms once', async ({ page }) => {`;
if (!e2e.includes(closeAnchor)) throw new Error('Missing existing verified dispatch test');
const describeEnd = `  });\n});\n`;
const lastEnd = e2e.lastIndexOf(describeEnd);
if (lastEnd < 0) throw new Error('Missing e2e describe terminator');
const e2eTest = `  test('a block-normalized multiline contenteditable prompt verifies and dispatches once', async ({ page }) => {
    await boot(page, CONTENTEDITABLE_PAGE);
    await page.evaluate(() => {
      window.__sendClicks = 0;
      const input = document.getElementById('composer');
      let normalized = false;
      input.addEventListener('input', () => {
        if (normalized) return;
        const visible = input.innerText || input.textContent || '';
        if (!visible.includes('Read the GitHub assignment.')) return;
        normalized = true;
        const first = document.createElement('p');
        first.textContent = 'Start the scheduled worker.';
        const second = document.createElement('p');
        second.textContent = 'Read the GitHub assignment.';
        input.replaceChildren(first, second);
      });
      document.getElementById('send').addEventListener('click', () => {
        window.__sendClicks += 1;
        input.replaceChildren();
        const stop = document.createElement('button');
        stop.id = 'stop';
        stop.textContent = 'Stop';
        document.body.appendChild(stop);
      });
    });

    const delivered = await page.evaluate(() => window.__GITL_TestSend(
      'Start the scheduled worker.\\nRead the GitHub assignment.',
      { contenteditable: true }
    ));
    const result = await page.evaluate(() => ({ clicks: window.__sendClicks, state: window.__GITL_TestState() }));

    expect(delivered).toBe(true);
    expect(result.clicks).toBe(1);
    expect(result.state).toEqual({ round: 1, path: 'reviewed-button', pending: false });
  });

`;
e2e = e2e.slice(0, lastEnd) + e2eTest + e2e.slice(lastEnd);
fs.writeFileSync(e2ePath, e2e);

const changelogPath = 'CHANGELOG.md';
let changelog = fs.readFileSync(changelogPath, 'utf8');
const changelogAnchor = `## [8.8.0] — workflow-neutral controls and explicit decisions\n\n`;
const changelogLine = `- Fixed false COMPOSER-002 pauses for complete multiline prompts in block-structured contenteditable editors by verifying rendered semantic text while retaining exact normalized staging checks.\n`;
changelog = replaceOnce(changelog, changelogAnchor, changelogAnchor + changelogLine, '8.8 changelog');
fs.writeFileSync(changelogPath, changelog);

console.log('Applied semantic composer verification fix and regressions.');
