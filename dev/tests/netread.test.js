/**
 * NETWORK READ PROTOTYPE (v8.7) — read-only, flagged off by default.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

describe('GITL_NET_READ prototype', () => {
  test('exists and is gated off by default', () => {
    expect(src).toContain('const GITL_NET_READ = {');
    expect(src).toContain("GM_getValue('netReadEnabled', false)");
  });

  test('ingests SSE from the existing fetch hook only', () => {
    expect(src).toContain('GITL_NET_READ._ingestSseBytes(value)');
  });

  test('does not add actuation paths', () => {
    const readBlock = src.slice(src.indexOf('const GITL_NET_READ'), src.indexOf('const PROFILES'));
    expect(readBlock).not.toContain('.click()');
    expect(readBlock).not.toContain('requestSubmit');
    expect(readBlock).not.toContain('pressEnter');
  });
});
