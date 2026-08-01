/**
 * MODEL-SWITCH GATING (v8.5.3)
 *
 * Field report: the Lens Relay workflow injected "Name which model should go
 * next" on ChatGPT — a single-model site. Model-switch features (the live
 * round-table persona and the Lens Relay workflow) must only do model-switching
 * where the user can actually swap models (Perplexity / arena). On a
 * single-model platform the model-switch instruction is stripped so the workflow
 * degrades to a single-model multi-lens round table.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('model-switch gating', () => {
  test('_isModelSwitcher exists and matches Perplexity/arena, not ChatGPT', () => {
    expect(src).toContain('function _isModelSwitcher()');
    const fn = src.slice(src.indexOf('function _isModelSwitcher()'), src.indexOf('function _isModelSwitcher()') + 200);
    expect(fn).toMatch(/perplexity/i);
    expect(fn).not.toMatch(/chatgpt/i);
  });

  test('the live round-table persona is gated behind _isModelSwitcher()', () => {
    expect(src).toContain("if (active.includes('roundtable') && _isModelSwitcher()) return ROUNDTABLE_LIVE;");
  });

  test('injected workflow stages are adapted per platform', () => {
    expect(src).toContain('${_stageForPlatform(next)}');
  });

  test('_stageForPlatform strips the model-switch instruction on single-model sites', () => {
    const fn = src.slice(src.indexOf('function _stageForPlatform(text)'), src.indexOf('function _stageForPlatform(text)') + 400);
    expect(fn).toContain('if (_isModelSwitcher()) return text;');
    expect(fn).toMatch(/Name which model should go next/);
    expect(fn).toMatch(/Name the next model/);
  });
});
