// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Round-6 A3 Red Team.
 *
 * This spec executes the exact browser-side Blue manager body from
 * mobile-shell-blue-prototype.spec.js rather than maintaining a second product
 * implementation. It then attacks lifecycle, insertion churn, verification
 * loss, overflow/reachability, cleanup, and Send safety.
 */

const PROOF = 'fixture-blue-v1';
const CANDIDATE_PATH = path.join(__dirname, 'mobile-shell-blue-prototype.spec.js');
const EXPECTED_GIT_BLOB = 'bc59521b917c37961920f4642fe2f21eae9f1cab';

function gitBlobSha1(buffer) {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest('hex');
}

function extractCandidateBrowserBody() {
  const source = fs.readFileSync(CANDIDATE_PATH, 'utf8');
  const startMarker = '  await page.evaluate(({ proof }) => {\n';
  const endMarker = '\n  }, { proof: PROOF });\n}\n\nasync function setup';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error('Unable to extract exact Blue browser body');
  return source.slice(start + startMarker.length, end);
}

const FIXTURE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui; }
  #rail { position: fixed; right: 8px; bottom: 8px; width: 40px; height: 40px; }
  #stack { width: min(760px, calc(100vw - 24px)); margin: 24px auto; }
  form { display:flex; flex-direction:column; gap:8px; }
  #editor { min-height:48px; }
  #row { display:flex; align-items:center; gap:8px; min-height:40px; }
  #row > button { width:36px; height:36px; flex:0 0 auto; }
  #send { margin-left:auto; }
</style>
</head>
<body>
<div id="rail" data-fixture="existing-rail"></div>
<div id="stack">
  <form id="composer">
    <div id="editor" contenteditable="true" role="textbox" tabindex="0"></div>
    <div id="row" data-testid="composer-actions" data-gitl-prototype-contract="${PROOF}">
      <button id="attach" type="button">+</button>
      <button id="model" type="button">M</button>
      <button id="send" type="button">Send</button>
    </div>
  </form>
</div>
<script>
window.__probeEvents = { click:0, submit:0, input:0, keydown:0, sendClicks:0 };
for (const type of ['click','submit','input','keydown']) {
  document.addEventListener(type, () => { window.__probeEvents[type]++; }, true);
}
window.__fixtureSend = document.getElementById('send');
window.__fixtureSend.addEventListener('click', () => { window.__probeEvents.sendClicks++; });
window.__ghostActions = { toggle:0, menu:0 };
</script>
</body>
</html>`;

async function installExactCandidate(page) {
  const browserBody = extractCandidateBrowserBody();
  await page.evaluate(({ proof, browserBody }) => {
    const run = new Function('proof', browserBody);
    run(proof);
  }, { proof: PROOF, browserBody });
}

async function setup(page, width = 1280) {
  await page.setViewportSize({ width, height: width <= 480 ? 780 : 800 });
  await page.setContent(FIXTURE);
  await installExactCandidate(page);
}

async function mount(page) {
  return page.evaluate(() => {
    const container = document.getElementById('row');
    const send = window.__fixtureSend;
    window.__activeBlueManager = window.__gitlBluePrototype.createManager({
      enabled: true,
      container,
      send,
      actions: {
        toggle: () => { window.__ghostActions.toggle++; },
        menu: () => { window.__ghostActions.menu++; },
      },
    });
    return window.__activeBlueManager.mount();
  });
}

async function snapshot(page) {
  return page.evaluate(() => window.__activeBlueManager?.snapshot());
}

test.describe('Round-6 A3 Blue Red Team', () => {
  test('candidate source is the repository-verified A2X blob', async () => {
    const bytes = fs.readFileSync(CANDIDATE_PATH);
    expect(gitBlobSha1(bytes)).toBe(EXPECTED_GIT_BLOB);
  });

  test('host-control insertion churn preserves native controls, one mount, and zero Send actuation', async ({ page }) => {
    await setup(page, 390);
    expect(await mount(page)).toMatchObject({ status: 'structural' });

    await page.evaluate(() => {
      const row = document.getElementById('row');
      for (let i = 0; i < 24; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.redNative = String(i);
        b.textContent = `N${i}`;
        row.append(b);
      }
    });

    await expect.poll(async () => (await snapshot(page)).pendingRepair).toBe(false);
    await expect.poll(async () => (await snapshot(page)).mountIsFinalChild).toBe(true);

    const result = await page.evaluate(() => ({
      nativeCount: document.querySelectorAll('[data-red-native]').length,
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
      sendSame: window.__fixtureSend === document.getElementById('send'),
      sendConnected: window.__fixtureSend.isConnected,
      events: { ...window.__probeEvents },
    }));
    const resources = await snapshot(page);

    expect(result.nativeCount).toBe(24);
    expect(result.mountCount).toBe(1);
    expect(result.sendSame).toBe(true);
    expect(result.sendConnected).toBe(true);
    expect(result.events.submit).toBe(0);
    expect(result.events.sendClicks).toBe(0);
    expect(resources.repairs).toBeGreaterThanOrEqual(1);
    expect(resources.mutationObserverConnected).toBe(true);
    expect(resources.resizeObserverConnected).toBe(true);
  });

  test('whole verified-row replacement must fail closed and release stale observers', async ({ page }) => {
    await setup(page, 1280);
    expect(await mount(page)).toMatchObject({ status: 'structural' });

    await page.evaluate(() => {
      const oldRow = document.getElementById('row');
      const replacement = document.createElement('div');
      replacement.id = 'row-replacement';
      replacement.dataset.testid = 'composer-actions';
      replacement.setAttribute('data-gitl-prototype-contract', 'fixture-blue-v1');
      replacement.style.display = 'flex';
      const replacementSend = document.createElement('button');
      replacementSend.type = 'button';
      replacementSend.id = 'replacement-send';
      replacementSend.textContent = 'Send';
      replacement.append(replacementSend);
      oldRow.replaceWith(replacement);
    });

    await page.waitForTimeout(120);
    const stale = await snapshot(page);

    // A stale verified container is no longer a valid structural target. The
    // manager must not retain active observers/resources against detached DOM.
    expect(stale.mountConnected).toBe(false);
    expect(stale.mutationObserverConnected).toBe(false);
    expect(stale.resizeObserverConnected).toBe(false);
    expect(stale.listenerCount).toBe(0);
    expect(stale.cleanupCount).toBeGreaterThanOrEqual(1);
    expect(stale.closedReason).toBeTruthy();
    expect(await page.locator('[data-fixture="existing-rail"]').count()).toBe(1);
    expect((await page.evaluate(() => window.__probeEvents)).sendClicks).toBe(0);
  });

  test('verification-token loss must fail closed instead of leaving structural mode live', async ({ page }) => {
    await setup(page, 1280);
    expect(await mount(page)).toMatchObject({ status: 'structural' });

    await page.evaluate(() => {
      document.getElementById('row').setAttribute('data-gitl-prototype-contract', 'revoked');
      const native = document.createElement('button');
      native.type = 'button';
      native.textContent = 'host-change';
      document.getElementById('row').append(native);
    });

    await expect.poll(async () => (await snapshot(page)).pendingRepair).toBe(false);
    const result = await snapshot(page);
    expect(result.mountCount).toBe(0);
    expect(result.closedReason).toBe('container-unverified');
    expect(result.mutationObserverConnected).toBe(false);
    expect(result.resizeObserverConnected).toBe(false);
    expect(result.sendIdentityPreserved).toBe(true);
  });

  test('overflow-clipped Blue candidate is rejected rather than counted as structural success', async ({ page }) => {
    await setup(page, 320);
    await page.evaluate(() => {
      const row = document.getElementById('row');
      row.style.width = '74px';
      row.style.maxWidth = '74px';
      row.style.flexWrap = 'nowrap';
      row.style.overflow = 'hidden';
    });

    const result = await mount(page);
    const geometry = await page.evaluate(() => {
      const row = document.getElementById('row').getBoundingClientRect();
      const host = document.querySelector('[data-gitl-mount="blue-prototype"]')?.getBoundingClientRect();
      return host ? {
        clipped: host.left < row.left || host.right > row.right || host.top < row.top || host.bottom > row.bottom,
      } : { clipped: false };
    });

    // Red contract: an overflow-clipped structural candidate must fail visibly;
    // rail fallback may remain, but may not hide a structural false positive.
    if (geometry.clipped) {
      expect(result.status).not.toBe('structural');
    }
    expect((await page.evaluate(() => window.__probeEvents)).sendClicks).toBe(0);
  });

  test('explicit unmount after churn restores resources and leaves host controls untouched', async ({ page }) => {
    await setup(page, 390);
    expect(await mount(page)).toMatchObject({ status: 'structural' });
    await page.evaluate(() => {
      const row = document.getElementById('row');
      for (let i = 0; i < 8; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.cleanupNative = String(i);
        row.append(b);
      }
    });
    await expect.poll(async () => (await snapshot(page)).pendingRepair).toBe(false);

    const before = await page.evaluate(() => ({
      native: document.querySelectorAll('[data-cleanup-native]').length,
      send: window.__fixtureSend,
      style: document.getElementById('row').getAttribute('style'),
    }));
    const unmount = await page.evaluate(() => window.__activeBlueManager.unmount());
    const after = await snapshot(page);
    const dom = await page.evaluate(() => ({
      native: document.querySelectorAll('[data-cleanup-native]').length,
      sameSend: window.__fixtureSend === document.getElementById('send'),
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
      style: document.getElementById('row').getAttribute('style'),
      events: { ...window.__probeEvents },
    }));

    expect(unmount).toEqual({ status: 'unmounted', hostStyleRestored: true });
    expect(dom.native).toBe(before.native);
    expect(dom.sameSend).toBe(true);
    expect(dom.mountCount).toBe(0);
    expect(dom.style).toBe(before.style);
    expect(dom.events.submit).toBe(0);
    expect(dom.events.sendClicks).toBe(0);
    expect(after.mutationObserverConnected).toBe(false);
    expect(after.resizeObserverConnected).toBe(false);
    expect(after.listenerCount).toBe(0);
    expect(after.pendingRepair).toBe(false);
  });
});
