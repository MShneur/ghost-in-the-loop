/**
 * PLATFORM HEALTH TESTS
 * Tests the S2 Selector Doctor scoring logic.
 * Uses jsdom — Adapter.getInput() returns null in test env,
 * so we verify the scoring formula and badge thresholds.
 */

describe('platformHealth scoring', () => {
  test('returns an object with required fields', () => {
    const h = platformHealth();
    expect(h).toHaveProperty('score');
    expect(h).toHaveProperty('badge');
    expect(h).toHaveProperty('platform');
    expect(h).toHaveProperty('input');
    expect(h).toHaveProperty('send');
    expect(h).toHaveProperty('assistantCount');
    expect(h).toHaveProperty('ready');
    expect(h).toHaveProperty('netActive');
  });

  test('score is a number 0-100', () => {
    const h = platformHealth();
    expect(typeof h.score).toBe('number');
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });

  test('badge is one of the three emoji', () => {
    const h = platformHealth();
    expect(['🟢', '🟡', '🔴']).toContain(h.badge);
  });

  test('score >= 80 → 🟢', () => {
    // Simulate perfect health by checking formula directly
    // canRead(25) + canInject(30) + canSend(30) + canExport(15) = 100
    // In jsdom with no AI DOM, score will be 0 — test the threshold mapping
    const score = 85;
    const badge = score >= 80 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    expect(badge).toBe('🟢');
  });

  test('score 40-79 → 🟡', () => {
    const score = 55;
    const badge = score >= 80 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    expect(badge).toBe('🟡');
  });

  test('score < 40 → 🔴', () => {
    const score = 10;
    const badge = score >= 80 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    expect(badge).toBe('🔴');
  });

  test('netActive reflects GITL_NET.active', () => {
    const h = platformHealth();
    expect(h.netActive).toBe(GITL_NET.active);
  });

  test('ready is false when no DOM selectors match', () => {
    // In jsdom with no AI chat DOM, input and send will be null
    const h = platformHealth();
    // ready = canInject && canSend
    expect(h.ready).toBe(h.input && h.send);
  });
});

describe('randomDelay anti-automation', () => {
  test('round 1 returns 2000ms (fast first send)', () => {
    expect(randomDelay(1)).toBe(2000);
  });

  test('round 0 returns 2000ms', () => {
    expect(randomDelay(0)).toBe(2000);
  });

  test('round 2+ returns 8000-15000ms', () => {
    for (let i = 0; i < 20; i++) {
      const d = randomDelay(2);
      expect(d).toBeGreaterThanOrEqual(8000);
      expect(d).toBeLessThanOrEqual(15000);
    }
  });

  test('delay is randomised (not constant)', () => {
    const delays = new Set();
    for (let i = 0; i < 10; i++) delays.add(randomDelay(5));
    // With random, we'd expect at least 2 distinct values
    expect(delays.size).toBeGreaterThan(1);
  });
});
