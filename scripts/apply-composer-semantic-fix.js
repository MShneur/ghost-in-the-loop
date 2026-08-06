'use strict';

const fs = require('fs');

function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first < 0) throw new Error(`Could not find ${label}`);
  if (text.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous ${label}`);
  return text.slice(0, first) + after + text.slice(first + before.length);
}

const sourcePath = 'ghost-in-the-loop.user.js';
let source = fs.readFileSync(sourcePath, 'utf8');

const before = `function _composerText(el) {
  if (!el) return '';
  const tag = String(el.tagName || '').toUpperCase();
  const text = tag === 'TEXTAREA' || tag === 'INPUT' ? el.value : el.textContent;
  return String(text || '').trim();
}`;

const after = `function _composerText(el) {
  if (!el) return '';
  const tag = String(el.tagName || '').toUpperCase();
  let text;
  if (tag === 'TEXTAREA' || tag === 'INPUT') {
    text = el.value;
  } else {
    /* Rich editors represent visible line breaks with block nodes. textContent
       concatenates adjacent blocks, which can make a complete multiline prompt
       look incomplete. innerText reflects rendered editing text; textContent
       remains the fallback for DOM shims and editors without innerText. */
    const rendered = typeof el.innerText === 'string' ? el.innerText : '';
    text = rendered || el.textContent;
  }
  return String(text || '').trim();
}`;

source = replaceOnce(source, before, after, '_composerText implementation');
fs.writeFileSync(sourcePath, source);

const changelogPath = 'CHANGELOG.md';
let changelog = fs.readFileSync(changelogPath, 'utf8');
const heading = '## [8.8.0] — workflow-neutral controls and explicit decisions\n\n';
const entry = '- Fixed false COMPOSER-002 pauses for complete multiline prompts in block-structured contenteditable editors by verifying rendered semantic text while retaining exact normalized staging checks.\n';
changelog = replaceOnce(changelog, heading, heading + entry, '8.8 changelog heading');
fs.writeFileSync(changelogPath, changelog);

console.log('Applied semantic rich-editor composer reader and changelog entry.');
