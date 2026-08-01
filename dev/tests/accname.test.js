/**
 * ACCESSIBLE NAME / ROLE HELPERS (v8.7.0 Track E)
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('role + accessible name helpers', () => {
  test('helpers exist', () => {
    expect(src).toContain('function _roleOf(el)');
    expect(src).toContain('function _accName(el)');
    expect(src).toContain('aria-labelledby');
    expect(src).toContain('CONTINUE_EXCLUDE');
  });

  test('_sendLooksSafe uses accessible name', () => {
    const start = src.indexOf('function _sendLooksSafe');
    const body = src.slice(start, start + 800);
    expect(body).toContain('_accName(el)');
  });

  test('continue clicks exclude OAuth / destructive lookalikes', () => {
    const start = src.indexOf('clickContinue()');
    const body = src.slice(start, start + 700);
    expect(body).toContain('CONTINUE_EXCLUDE.test(name)');
  });
});

describe('accName behaviour in jsdom', () => {
  test('aria-labelledby and svg title resolve', () => {
    document.body.innerHTML = `
      <span id="lbl">Send message</span>
      <button id="b1" aria-labelledby="lbl"><svg></svg></button>
      <button id="b2"><svg><title>Send</title></svg></button>
      <button id="b3" aria-label="Copy"><svg></svg></button>
    `;
    expect(_accName(document.getElementById('b1'))).toMatch(/Send message/i);
    expect(_accName(document.getElementById('b2'))).toMatch(/^Send$/i);
    expect(_sendLooksSafe(document.getElementById('b3'))).toBe(false);
  });

  test('implicit roles map for button/textbox', () => {
    document.body.innerHTML = `<button id="b"></button><textarea id="t"></textarea><div id="c" contenteditable="true"></div>`;
    expect(_roleOf(document.getElementById('b'))).toBe('button');
    expect(_roleOf(document.getElementById('t'))).toBe('textbox');
    expect(_roleOf(document.getElementById('c'))).toBe('textbox');
  });
});
