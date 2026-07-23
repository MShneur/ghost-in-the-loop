/**
 * TAB LOCK TESTS (S0)
 * Tests claimTabLock / releaseTabLock / assertInteractionSafe.
 * Uses real GM shims from setup.js.
 */

beforeEach(() => {
  /* Clear any existing lock */
  const key = _tabLockKey();
  GM_setValue(key, '');
});

describe('_tabLockKey', () => {
  test('returns a string', () => {
    expect(typeof _tabLockKey()).toBe('string');
  });

  test('includes hostname', () => {
    expect(_tabLockKey()).toContain('chatgpt.com');
  });
});

describe('claimTabLock', () => {
  test('succeeds when no lock exists', () => {
    expect(claimTabLock()).toBe(true);
  });

  test('succeeds for same tab when re-claiming', () => {
    claimTabLock();
    expect(claimTabLock()).toBe(true);
  });

  test('fails when another tab holds unexpired lock', () => {
    /* Write a fake lock from another tab */
    const key = _tabLockKey();
    GM_setValue(key, JSON.stringify({ tabId: 'other-tab-id', ts: Date.now() }));
    expect(claimTabLock()).toBe(false);
  });

  test('succeeds when other tab lock is expired (>8s)', () => {
    const key = _tabLockKey();
    GM_setValue(key, JSON.stringify({ tabId: 'other-tab-id', ts: Date.now() - 9000 }));
    expect(claimTabLock()).toBe(true);
  });

  test('survives corrupted lock JSON', () => {
    const key = _tabLockKey();
    GM_setValue(key, 'NOT_JSON');
    expect(() => claimTabLock()).not.toThrow();
    expect(claimTabLock()).toBe(true);
  });
});

describe('verifyTabLease', () => {
  test('re-reads and verifies ownership before actuation', async () => {
    await expect(verifyTabLease()).resolves.toBe(true);
    const lock = JSON.parse(GM_getValue(_tabLockKey(), '{}'));
    expect(lock.tabId).toBe(GITL_TAB_ID);
  });

  test('does not displace another live owner', async () => {
    GM_setValue(_tabLockKey(), JSON.stringify({ tabId: 'other-tab-id', ts: Date.now() }));
    await expect(verifyTabLease()).resolves.toBe(false);
  });
});

describe('releaseTabLock', () => {
  test('clears our own lock', () => {
    claimTabLock();
    releaseTabLock();
    /* After release, another tab should be able to claim */
    const key = _tabLockKey();
    const raw = GM_getValue(key, '');
    expect(raw).toBeFalsy();
  });

  test('does not clear another tab lock', () => {
    const key = _tabLockKey();
    GM_setValue(key, JSON.stringify({ tabId: 'other-tab', ts: Date.now() }));
    releaseTabLock(); // should not clear other tab's lock
    const raw = GM_getValue(key, '');
    expect(raw).toBeTruthy();
  });

  test('does not throw when no lock exists', () => {
    expect(() => releaseTabLock()).not.toThrow();
  });
});

describe('assertInteractionSafe', () => {
  test('returns { ok, reason }', () => {
    const r = assertInteractionSafe();
    expect(r).toHaveProperty('ok');
    expect(r).toHaveProperty('reason');
  });

  test('ok when tab has focus and lock available', () => {
    /* jsdom hasFocus returns true via our shim */
    claimTabLock(); // claim first so we own it
    const r = assertInteractionSafe();
    expect(r.ok).toBe(true);
    expect(r.reason).toBe('ok');
  });

  test('fails when another tab holds the lock', () => {
    const key = _tabLockKey();
    GM_setValue(key, JSON.stringify({ tabId: 'other-tab', ts: Date.now() }));
    const r = assertInteractionSafe();
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tab-lock-held-by-other');
  });
});
