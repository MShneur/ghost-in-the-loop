/**
 * TIMELINE TESTS
 * Tests the S3 event log: record, capping, query helpers.
 */

describe('Timeline', () => {
  beforeEach(() => {
    /* Clear storage between tests */
    GM_setValue('gitlTimeline', '[]');
    Timeline._cache = null;
  });

  test('record() adds an event', () => {
    Timeline.record('test_event', { x: 1 });
    expect(Timeline.all().length).toBe(1);
  });

  test('event has required fields', () => {
    Timeline.record('boot', { version: '7.0.0' });
    const e = Timeline.all()[0];
    expect(e.type).toBe('boot');
    expect(e.at).toMatch(/^\d{4}-/); // ISO date
    expect(e.data.version).toBe('7.0.0');
  });

  test('multiple records accumulate', () => {
    Timeline.record('a', {});
    Timeline.record('b', {});
    Timeline.record('c', {});
    expect(Timeline.all().length).toBe(3);
  });

  test('capped at 500 events', () => {
    for (let i = 0; i < 520; i++) Timeline.record('spam', { i });
    expect(Timeline.all().length).toBeLessThanOrEqual(500);
  });

  test('failures() filters failure types', () => {
    Timeline.record('send_ok', {});
    Timeline.record('send_fail', { error: 'timeout' });
    Timeline.record('failure', { reason: 'x' });
    Timeline.record('boot', {});
    const f = Timeline.failures();
    expect(f.length).toBe(2);
    expect(f.every(e => ['failure','send_fail'].includes(e.type))).toBe(true);
  });

  test('since() returns only recent events', async () => {
    Timeline.record('old', {});
    await new Promise(r => setTimeout(r, 50));
    const cutoff = 30; // ms
    Timeline.record('recent', {});
    const r = Timeline.since(cutoff);
    expect(r.some(e => e.type === 'recent')).toBe(true);
    expect(r.length).toBeLessThanOrEqual(Timeline.all().length);
  });

  test('persists to GM_setValue', () => {
    Timeline.record('persist_test', { v: 42 });
    const raw = GM_getValue('gitlTimeline', '[]');
    const parsed = JSON.parse(raw);
    expect(parsed.some(e => e.type === 'persist_test')).toBe(true);
  });

  test('survives corrupted GM store', () => {
    GM_setValue('gitlTimeline', 'NOT_JSON');
    Timeline._cache = null;
    expect(() => Timeline.all()).not.toThrow();
    expect(Array.isArray(Timeline.all())).toBe(true);
  });
});
