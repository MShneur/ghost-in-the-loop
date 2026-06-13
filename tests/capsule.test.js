/**
 * CAPSULE V2 TESTS
 * Tests SHA-256 dedup logic and capsule schema.
 */

describe('gitlSha256', () => {
  test('returns a string', async () => {
    const h = await gitlSha256('hello');
    expect(typeof h).toBe('string');
  });

  test('same input → same hash', async () => {
    const a = await gitlSha256('test');
    const b = await gitlSha256('test');
    expect(a).toBe(b);
  });

  test('different input → different hash', async () => {
    const a = await gitlSha256('hello');
    const b = await gitlSha256('world');
    expect(a).not.toBe(b);
  });

  test('handles empty string without throwing', async () => {
    await expect(gitlSha256('')).resolves.toBeDefined();
  });

  test('handles null without throwing', async () => {
    await expect(gitlSha256(null)).resolves.toBeDefined();
  });
});

describe('buildCapsuleV2', () => {
  const msgs = [
    { role: 'user',      text: 'Tell me about quantum computing' },
    { role: 'assistant', text: 'Quantum computing uses qubits. '.repeat(5) },
    { role: 'assistant', text: 'Quantum computing uses qubits. '.repeat(5) }, // duplicate
    { role: 'user',      text: 'What are the applications?' },
    { role: 'assistant', text: 'Applications include cryptography and optimization. '.repeat(3) }
  ];

  test('returns a capsule object', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c).toHaveProperty('schema');
    expect(c).toHaveProperty('messages');
    expect(c).toHaveProperty('resume');
  });

  test('schema is gitl.capsule.v2', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c.schema).toBe('gitl.capsule.v2');
  });

  test('deduplicates identical messages', async () => {
    const c = await buildCapsuleV2(msgs);
    // Input has 5 messages but one duplicate assistant message
    expect(c.messages.length).toBeLessThan(msgs.length);
    expect(c.deduplicated).toBeGreaterThan(0);
  });

  test('messages have id, role, text, sha256, parentId', async () => {
    const c = await buildCapsuleV2(msgs);
    const m = c.messages[0];
    expect(m).toHaveProperty('id');
    expect(m).toHaveProperty('role');
    expect(m).toHaveProperty('text');
    expect(m).toHaveProperty('sha256');
    expect(m).toHaveProperty('parentId');
  });

  test('first message has null parentId', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c.messages[0].parentId).toBeNull();
  });

  test('subsequent messages have parentId', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c.messages[1].parentId).toBe(c.messages[0].id);
  });

  test('resume token is present', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c.resume.next_action).toBe('continue_from_capsule');
    expect(c.resume.instruction).toBeTruthy();
    expect(c.resume.last_id).toBeTruthy();
  });

  test('handles empty messages array', async () => {
    const c = await buildCapsuleV2([]);
    expect(c.messages.length).toBe(0);
    expect(c.resume.last_id).toBeNull();
  });

  test('filters out empty/short messages', async () => {
    const withEmpty = [
      { role: 'user',      text: '' },
      { role: 'assistant', text: '  ' },
      { role: 'user',      text: 'Hi' }, // 2 chars — below threshold
      { role: 'assistant', text: 'Hello there, how can I help you today?' }
    ];
    const c = await buildCapsuleV2(withEmpty);
    expect(c.messages.length).toBeLessThan(withEmpty.length);
  });

  test('capsule includes version', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c.version).toBe(VER);
  });

  test('capsule includes timeline_summary', async () => {
    const c = await buildCapsuleV2(msgs);
    expect(c).toHaveProperty('timeline_summary');
    expect(c.timeline_summary).toHaveProperty('total_events');
  });
});

describe('buildFilename', () => {
  test('returns a string', () => {
    expect(typeof buildFilename('export')).toBe('string');
  });

  test('includes mode in filename', () => {
    const f = buildFilename('rescue');
    expect(f).toContain('rescue');
  });

  test('has .md extension for non-json modes', () => {
    expect(buildFilename('export')).toMatch(/\.md$/);
  });
});
