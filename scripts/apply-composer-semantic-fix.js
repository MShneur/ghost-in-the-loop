'use strict';

const fs = require('fs');

const path = 'ghost-in-the-loop.user.js';
let source = fs.readFileSync(path, 'utf8');

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

const first = source.indexOf(before);
if (first < 0) throw new Error('Could not find the original _composerText implementation');
if (source.indexOf(before, first + before.length) >= 0) throw new Error('Ambiguous _composerText implementation');

source = source.slice(0, first) + after + source.slice(first + before.length);
fs.writeFileSync(path, source);
console.log('Applied semantic rich-editor composer reader.');
