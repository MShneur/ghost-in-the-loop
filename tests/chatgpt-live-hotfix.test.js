const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '../diagnostics/gitl-chatgpt-8.8-hotfix.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

function makeVisible(el) {
  el.getBoundingClientRect = () => ({ width: 40, height: 40, top: 0, left: 0, right: 40, bottom: 40 });
}

beforeEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  window.eval(source);
});

test('substitutes one unique semantic Send click for Ghost synthetic Enter', () => {
  document.body.innerHTML = `
    <div id="gitl"></div>
    <form id="composer">
      <div id="prompt-textarea" contenteditable="true">Continue</div>
      <button id="send" type="button" aria-label="Send message">Send</button>
    </form>`;
  const composer = document.getElementById('prompt-textarea');
  const send = document.getElementById('send');
  makeVisible(send);
  let clicks = 0;
  let hostKeydowns = 0;
  send.addEventListener('click', () => { clicks += 1; });
  composer.addEventListener('keydown', () => { hostKeydowns += 1; });

  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  composer.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(clicks).toBe(1);
  expect(hostKeydowns).toBe(0);
});

test('fails closed when semantic Send is ambiguous', () => {
  document.body.innerHTML = `
    <div id="gitl"></div>
    <form>
      <div id="prompt-textarea" contenteditable="true">Continue</div>
      <button id="a" type="button" aria-label="Send message">Send</button>
      <button id="b" type="button" aria-label="Send message">Send</button>
    </form>`;
  const composer = document.getElementById('prompt-textarea');
  makeVisible(document.getElementById('a'));
  makeVisible(document.getElementById('b'));
  let hostKeydowns = 0;
  composer.addEventListener('keydown', () => { hostKeydowns += 1; });

  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  composer.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
  expect(hostKeydowns).toBe(1);
});

test('cancels host default action on Ghost buttons without swallowing Ghost handler', () => {
  document.body.innerHTML = '<div id="gitl"><button id="g-play">Start</button></div>';
  const button = document.getElementById('g-play');
  let handled = 0;
  button.addEventListener('click', () => { handled += 1; });

  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  button.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(handled).toBe(1);
});
