// @ts-check
const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Round-6 A4 mobile/browser/accessibility/performance certification fixture.
 *
 * This executes the exact browser-side Blue candidate from
 * mobile-shell-blue-prototype.spec.js. It does not bind to live ChatGPT and it
 * does not promote hosted emulation into physical Android, WebView, GeckoView,
 * assistive-technology, or calibrated-device certification.
 */

const PROOF = 'fixture-blue-v1';
const CANDIDATE_PATH = path.join(__dirname, 'mobile-shell-blue-prototype.spec.js');
const EXPECTED_GIT_BLOB = '53cc902428a3fc1496a83ad1bf0bd1bbe6752c84';

function gitBlobSha1(buffer) {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest('hex');
}

function extractCandidateBrowserBody() {
  const source = fs.readFileSync(CANDIDATE_PATH, 'utf8');
  expect(gitBlobSha1(Buffer.from(source))).toBe(EXPECTED_GIT_BLOB);
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
  html, body { margin: 0; width: 100%; max-width: 100%; min-height: 100%; }
  body { font: 14px system-ui; overflow-x: hidden; }
  #rail { position: fixed; right: 8px; bottom: 8px; width: 40px; height: 40px; }
  #stack { width: min(760px, calc(100vw - 12px)); margin: 16px auto; }
  form { display: flex; flex-direction: column; gap: 8px; }
  #editor { min-height: 48px; min-width: 0; outline: none; }
  #row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 40px; width: 100%; }
  #row > button { min-width: 36px; min-height: 36px; flex: 0 0 auto; font: inherit; }
  #send { margin-left: auto; }
</style>
</head>
<body>
<div id="rail" data-fixture="existing-rail" aria-label="Existing Ghost rail"></div>
<div id="stack">
  <form id="composer">
    <div id="editor" contenteditable="true" role="textbox" tabindex="0" aria-label="Message ChatGPT"></div>
    <div id="row" data-testid="composer-actions" data-gitl-prototype-contract="${PROOF}">
      <button id="attach" type="button" aria-label="Add files">+</button>
      <button id="model" type="button" aria-label="Model selector">M</button>
      <button id="send" type="button" aria-label="Send prompt">Send</button>
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
window.__viewportSignals = { visualResize:0, orientation:0 };
window.visualViewport?.addEventListener('resize', () => { window.__viewportSignals.visualResize++; });
window.addEventListener('orientationchange', () => { window.__viewportSignals.orientation++; });
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

async function boot(page, width, height) {
  await page.setViewportSize({ width, height });
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

async function deterministicVisualOnlySignal(page) {
  await page.evaluate(() => {
    window.visualViewport?.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(20);
}

async function orientationTransition(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await page.waitForTimeout(40);
}

async function perturbNativeControls(page) {
  await page.evaluate(() => {
    const row = document.getElementById('row');
    const native = document.createElement('button');
    native.id = 'native-late';
    native.type = 'button';
    native.setAttribute('aria-label', 'Late native tool');
    native.textContent = 'N';
    row.append(native);
  });
  await page.waitForTimeout(40);
}

async function geometry(page) {
  return page.evaluate(() => {
    const row = document.getElementById('row');
    const send = window.__fixtureSend;
    const mount = document.querySelector('[data-gitl-mount="blue-prototype"]');
    const rect = (el) => el ? (() => {
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    })() : null;
    return {
      viewport: { width: innerWidth, height: innerHeight, visualWidth: visualViewport?.width ?? null, visualHeight: visualViewport?.height ?? null },
      row: rect(row),
      send: rect(send),
      mount: rect(mount),
      mountPosition: mount ? getComputedStyle(mount).position : null,
      bodyOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sendSame: send === document.getElementById('send'),
      sendConnected: !!send?.isConnected,
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
      mountFinal: !!(mount && mount.parentElement === row && row.lastElementChild === mount),
      events: { ...window.__probeEvents },
      actions: { ...window.__ghostActions },
      viewportSignals: { ...window.__viewportSignals },
      activeId: document.activeElement?.id || null,
      fontSize: getComputedStyle(document.body).fontSize,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      hostButtonsVisible: Array.from(row?.querySelectorAll(':scope > button') || []).every((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return b.isConnected && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      }),
    };
  });
}

async function assertSemanticAndSafetyContract(page, baselineEvents) {
  const g = await geometry(page);
  expect(g.mountCount).toBe(1);
  expect(g.mountFinal).toBe(true);
  expect(['fixed', 'absolute']).not.toContain(g.mountPosition);
  expect(g.sendSame).toBe(true);
  expect(g.sendConnected).toBe(true);
  expect(g.hostButtonsVisible).toBe(true);
  expect(g.bodyOverflowX).toBeLessThanOrEqual(1);
  expect(g.events).toEqual(baselineEvents);
  expect(g.actions).toEqual({ toggle: 0, menu: 0 });
  await expect(page.getByRole('button', { name: 'Toggle Ghost' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open Ghost menu' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Send prompt' })).toHaveCount(1);
  const aria = await page.locator('[data-gitl-mount="blue-prototype"]').ariaSnapshot();
  expect(aria).toContain('button "Toggle Ghost"');
  expect(aria).toContain('button "Open Ghost menu"');
  return g;
}

async function cleanUnmount(page) {
  const result = await page.evaluate(() => window.__activeBlueManager.unmount());
  const snap = await snapshot(page);
  expect(result.status).toBe('unmounted');
  expect(result.hostStyleRestored).toBe(true);
  expect(snap.mountCount).toBe(0);
  expect(snap.mutationObserverConnected).toBe(false);
  expect(snap.resizeObserverConnected).toBe(false);
  expect(snap.pendingRepair).toBe(false);
  expect(snap.listenerCount).toBe(0);
  expect(snap.sendIdentityPreserved).toBe(true);
  return snap;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

test.describe('Round-6 A4 Blue mobile/accessibility/performance fixture', () => {
  test('Pixel-class Chromium survives 320 CSS px, 200% text, visual-only signal, orientation and reduced motion', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'Pixel-class evidence is Chromium emulation only');

    const context = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await boot(page, 412, 915);
      await page.focus('#editor');
      const baselineEvents = await page.evaluate(() => ({ ...window.__probeEvents }));
      expect((await mount(page)).status).toBe('structural');
      let g = await assertSemanticAndSafetyContract(page, baselineEvents);
      expect(g.activeId).toBe('editor');
      expect(g.reducedMotion).toBe(true);

      await page.setViewportSize({ width: 320, height: 780 });
      await page.evaluate(() => { document.body.style.fontSize = '200%'; });
      await deterministicVisualOnlySignal(page);
      await perturbNativeControls(page);
      g = await assertSemanticAndSafetyContract(page, baselineEvents);
      expect(parseFloat(g.fontSize)).toBeGreaterThanOrEqual(30);
      expect(g.viewportSignals.visualResize).toBeGreaterThanOrEqual(1);

      const resources = await snapshot(page);
      expect(resources.mountCount).toBe(1);
      expect(resources.mountIsFinalChild).toBe(true);
      expect(resources.listenerCount).toBe(2);
      expect(resources.mutationObserverConnected).toBe(true);
      expect(resources.resizeObserverConnected).toBe(true);
      expect(resources.pendingRepair).toBe(false);

      await orientationTransition(page, 780, 320);
      await assertSemanticAndSafetyContract(page, baselineEvents);
      await orientationTransition(page, 320, 780);
      g = await assertSemanticAndSafetyContract(page, baselineEvents);
      expect(g.viewportSignals.orientation).toBe(2);

      await cleanUnmount(page);
      expect(await page.locator('[data-fixture="existing-rail"]').count()).toBe(1);
    } finally {
      await context.close();
    }
  });

  test('portable desktop Firefox keeps the same narrow semantic/focus contract without GeckoView claims', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Portable Firefox lane only');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page, 412, 915);
    await page.focus('#editor');
    const baselineEvents = await page.evaluate(() => ({ ...window.__probeEvents }));
    expect((await mount(page)).status).toBe('structural');
    let g = await assertSemanticAndSafetyContract(page, baselineEvents);
    expect(g.activeId).toBe('editor');
    expect(g.reducedMotion).toBe(true);

    await page.setViewportSize({ width: 320, height: 780 });
    await page.evaluate(() => { document.body.style.fontSize = '200%'; });
    await deterministicVisualOnlySignal(page);
    g = await assertSemanticAndSafetyContract(page, baselineEvents);
    expect(parseFloat(g.fontSize)).toBeGreaterThanOrEqual(30);

    const snap = await snapshot(page);
    expect(snap.mountCount).toBe(1);
    expect(snap.listenerCount).toBe(2);
    expect(snap.pendingRepair).toBe(false);
    await cleanUnmount(page);
  });

  test('Chromium 1x/4x/6x CPU stress preserves resource and Send invariants with descriptive timing only', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP CPU throttling is Chromium-only');

    const cdp = await context.newCDPSession(page);
    const report = [];
    try {
      for (const rate of [1, 4, 6]) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate });
        const samples = [];
        for (let i = 0; i < 5; i++) {
          await boot(page, 390, 780);
          const baselineEvents = await page.evaluate(() => ({ ...window.__probeEvents }));
          const t0 = Date.now();
          expect((await mount(page)).status).toBe('structural');
          await perturbNativeControls(page);
          const elapsedMs = Date.now() - t0;
          samples.push(elapsedMs);

          await assertSemanticAndSafetyContract(page, baselineEvents);
          const snap = await snapshot(page);
          expect(snap.mountCount).toBe(1);
          expect(snap.listenerCount).toBe(2);
          expect(snap.mutationObserverConnected).toBe(true);
          expect(snap.resizeObserverConnected).toBe(true);
          expect(snap.pendingRepair).toBe(false);
          expect(snap.sendIdentityPreserved).toBe(true);
          expect(snap.hostStyleUnchanged).toBe(true);
          await cleanUnmount(page);
        }
        report.push({
          cpuRate: rate,
          samplesMs: samples,
          medianMs: percentile(samples, 50),
          p95Ms: percentile(samples, 95),
        });
      }
    } finally {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
      await cdp.detach().catch(() => {});
    }

    console.log(`[A4_DESCRIPTIVE_TIMING] ${JSON.stringify(report)}`);
    expect(report).toHaveLength(3);
    expect(report.every((r) => r.samplesMs.length === 5)).toBe(true);
  });
});
