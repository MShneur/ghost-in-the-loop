/**
 * TRUTHFUL EXPORT CONTRACT
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

const turns = [
  { role:'user', text:'Question' },
  { role:'assistant', text:'Answer' }
];

describe('_assessExportCapture', () => {
  test('marks a count-matched supported API archive complete', () => {
    const r = _assessExportCapture({
      messages: turns,
      source: 'chatgpt-api',
      expected: 2,
      omitted: 0,
      unsupportedParts: 0
    });
    expect(r.status).toBe('complete');
    expect(r.captured).toBe(2);
    expect(r.warnings).toEqual([]);
  });

  test('marks an API archive partial when turns or content parts are missing', () => {
    const r = _assessExportCapture({
      messages: turns,
      source: 'claude-api',
      expected: 3,
      omitted: 1,
      unsupportedParts: 2
    });
    expect(r.status).toBe('partial');
    expect(r.warnings.join(' ')).toMatch(/Captured 2 of 3/);
    expect(r.warnings.join(' ')).toMatch(/attachment|tool|content/i);
  });

  test('DOM capture is always partial because completeness is unknowable', () => {
    const r = _assessExportCapture({ messages: turns, source:'dom' });
    expect(r.status).toBe('partial');
    expect(r.warnings.join(' ')).toMatch(/cannot prove/i);
  });

  test('zero captured messages is failed', () => {
    const r = _assessExportCapture({ messages:[], source:'dom' });
    expect(r.status).toBe('failed');
  });

  test('one-sided role capture is partial', () => {
    const r = _assessExportCapture({
      messages: [{role:'assistant',text:'a'}, {role:'assistant',text:'b'}],
      source:'chatgpt-api',
      expected:2
    });
    expect(r.status).toBe('partial');
    expect(r.roles.user).toBe(0);
  });
});

describe('export runtime contract', () => {
  test('Cancel aborts the active operation and promises no file', () => {
    expect(src).toContain('this.controller?.abort()');
    expect(src).toContain('No file will be created.');
    expect(src).toContain("status:'cancelled'");
  });

  test('JSON and Markdown exports embed validation status', () => {
    expect(src).toContain("schema: 'gitl.transcript.v1'");
    expect(src).toContain('export: contract');
    expect(src).toContain('**Status:** ${contract.status.toUpperCase()}');
  });

  test('failed export creates a stable local diagnostic instead of a false success', () => {
    expect(ERROR_CATALOG['EXPORT-001']).toBeDefined();
    expect(src).toContain("Reporter.capture('EXPORT-001')");
    expect(src).not.toContain("alert('Ghost: no messages found to export.')");
  });
});
