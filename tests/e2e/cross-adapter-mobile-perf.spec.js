// @ts-check
const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Round-6 XA4 cross-adapter hosted mobile/accessibility/performance fixture.
 *
 * This adds no live host binding. It executes the exact fixture-gated Claude
 * Blue browser body while the XA4 carrier also reruns the already-certified
 * ChatGPT mobile/perf fixture and XA3 cross-adapter Red Team matrix.
 *
 * Claim limits are deliberate: hosted Chromium emulation is not physical
 * Android/WebView, desktop Firefox is not GeckoView, deterministic viewport
 * signals are not real IME/browser-toolbar behavior, and CDP throttling is
 * descriptive hosted stress rather than calibrated hardware certification.
 */

const CLAUDE_PROOF = 'fixture-claude-blue-v1';
const CLAUDE_MOUNT = '[data-gitl-mount="claude-blue-prototype"]';
const FILES = {
  chatgptMobile: path.join(__dirname, 'mobile-shell-blue-mobile-perf.spec.js'),
  claudeBlue: path.join(__dirname, 'claude-blue-prototype.spec.js'),
  crossRed: path.join(__dirname, 'cross-adapter-redteam.spec.js'),
};
const EXPECTED_BLOBS = {
  chatgptMobile: '8231a2aea014dcaedba9c38c25b4249f56bc9646',
  claudeBlue: '88277ddbcb268e7a25a9b2f54197f8fc08c4ddcc',
  crossRed: '64c099b51fedfdfb7f86a76d4142f092dde20129',
};

function gitBlobSha1(buffer) {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest('hex');
}

function assertPinnedInputs() {
  for (const [name, file] of Object.entries(FILES)) {
    const bytes = fs.readFileSync(file);
    expect(gitBlobSha1(bytes), `${name} input drifted`).toBe(EXPECTED_BLOBS[name]);
  }
}

function extractClaudeBrowserBody() {
  const source = fs.readFileSync(FILES.claudeBlue, 'utf8');
  expect(gitBlobSha1(Buffer.from(source))).toBe(EXPECTED_BLOBS.claudeBlue);
  const startMarker = '  await page.evaluate(({ proof, mountSelector }) => {\n';
  const endMarker = '\n  }, { proof: CLAUDE_PROOF, mountSelector: MOUNT_SELECTOR });\n}\n\nasync function setup';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error('Unable to extract exact Claude Blue browser body');
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
  [data-fixture="page"] { width: min(760px, calc(100vw - 12px)); margin: 12px auto; }
  [data-fixture="decoy-editor"] { min-height: 40px; border: 1px dashed #999; }
  form[data-claude-composer="active"] { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 8px; }
  [data-claude-editor] { min-height: 48px; min-width: 0; outline: none; }
  [data-claude-actions] { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 40px; width: 100%; overflow: visible; }
  [data-claude-actions] > button { min-width: 36px; min-height: 36px; flex: 0 0 auto; font: inherit; }
  [data-claude-send] { margin-left: auto; }
  [data-fixture="hidden-secondary"] { display: none; }
  [data-fixture="existing-rail"] { position: fixed; right: 8px; bottom: 8px; width: 40px; height: 40px; }
</style>
</head>
<body data-site="claude">
  <div data-fixture="existing-rail" aria-label="Existing Ghost rail"></div>
  <main data-fixture="page">
    <section data-fixture="decoy-shell">
      <div class="ProseMirror" contenteditable="true" aria-label="Edit artifact" data-fixture="decoy-editor"></div>
      <button type="button" aria-label="Send Message" data-fixture="decoy-send">decoy send</button>
    </section>
    <form data-claude-composer="active" data-gitl-claude-blue-contract="${CLAUDE_PROOF}">
      <div class="ProseMirror" contenteditable="true" aria-label="Message Claude" data-claude-editor="active" tabindex="0"></div>
      <div data-claude-actions="active">
        <button type="button" aria-label="Attach file" data-native="attach">+</button>
        <button type="button" aria-label="Tools" data-native="tools">Tools</button>
        <button type="submit" aria-label="Send Message" data-claude-send="active">Send</button>
      </div>
    </form>
    <section data-fixture="hidden-secondary">
      <form data-claude-composer="secondary" data-gitl-claude-blue-contract="not-approved">
        <div class="ProseMirror" contenteditable="true" aria-label="Message Claude"></div>
        <div data-claude-actions="secondary"><button type="submit" aria-label="Send Message" data-claude-send="secondary">Send</button></div>
      </form>
    </section>
  </main>
<script>
  window.__xa2Events = { click:0, submit:0, input:0, keydown:0, sendClicks:0 };
  for (const type of ['click', 'submit', 'input', 'keydown']) document.addEventListener(type, () => { window.__xa2Events[type]++; }, true);
  window.__xa2Send = document.querySelector('[data-claude-send="active"]');
  window.__xa2Send.addEventListener('click', () => { window.__xa2Events.sendClicks++; });
  window.__xa2GhostActions = { toggle:0, menu:0 };
  window.__viewportSignals = { visualResize:0, orientation:0 };
  window.visualViewport?.addEventListener('resize', () => { window.__viewportSignals.visualResize++; });
  window.addEventListener('orientationchange', () => { window.__viewportSignals.orientation++; });
</script>
</body>
</html>`;

async function installExactClaudeCandidate(page) {
  const browserBody = extractClaudeBrowserBody();
  await page.evaluate(({ proof, mountSelector, browserBody }) => {
    const run = new Function('proof', 'mountSelector', browserBody);
    run(proof, mountSelector);
  }, { proof: CLAUDE_PROOF, mountSelector: CLAUDE_MOUNT, browserBody });
}

async function boot(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.setContent(FIXTURE);
  await installExactClaudeCandidate(page);
}

async function mount(page, options = {}) {
  return page.evaluate((opts) => {
    window.__activeClaudeBlue = window.__claudeBluePrototype.createManager({
      site: opts.site || 'claude',
      standardAvailable: opts.standardAvailable !== false,
      mutantPosition: opts.mutantPosition || 'static',
      actions: {
        toggle: () => { window.__xa2GhostActions.toggle++; },
        menu: () => { window.__xa2GhostActions.menu++; },
      },
    });
    return window.__activeClaudeBlue.mount();
  }, options);
}

async function snapshot(page) {
  return page.evaluate(() => window.__activeClaudeBlue?.snapshot());
}

async function perturbNativeControls(page) {
  await page.evaluate(() => {
    const row = document.querySelector('[data-claude-actions="active"]');
    const native = document.createElement('button');
    native.type = 'button';
    native.setAttribute('data-native', 'late-tool');
    native.setAttribute('aria-label', 'Late native tool');
    native.textContent = 'Late';
    row.append(native);
  });
  await page.waitForTimeout(40);
}

async function deterministicVisualOnlySignal(page) {
  await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(20);
}

async function geometry(page) {
  return page.evaluate(() => {
    const row = document.querySelector('[data-claude-actions="active"]');
    const send = window.__xa2Send;
    const host = document.querySelector('[data-gitl-mount="claude-blue-prototype"]');
    const rect = (el) => el ? (() => {
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    })() : null;
    return {
      viewport: { width:innerWidth, height:innerHeight, visualWidth:visualViewport?.width ?? null, visualHeight:visualViewport?.height ?? null },
      row: rect(row), send: rect(send), mount: rect(host),
      mountPosition: host ? getComputedStyle(host).position : null,
      bodyOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sendSame: send === document.querySelector('[data-claude-send="active"]'),
      sendConnected: !!send?.isConnected,
      mountCount: document.querySelectorAll('[data-gitl-mount="claude-blue-prototype"]').length,
      mountFinal: !!(host && host.parentElement === row && row.lastElementChild === host),
      events: { ...window.__xa2Events },
      actions: { ...window.__xa2GhostActions },
      viewportSignals: { ...window.__viewportSignals },
      activeLabel: document.activeElement?.getAttribute('aria-label') || null,
      fontSize: getComputedStyle(document.body).fontSize,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      hostButtonsVisible: Array.from(row?.querySelectorAll(':scope > button') || []).every((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return b.isConnected && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      }),
      railConnected: !!document.querySelector('[data-fixture="existing-rail"]')?.isConnected,
    };
  });
}

async function assertClaudeSemanticAndSafety(page, baselineEvents) {
  const g = await geometry(page);
  expect(g.mountCount).toBe(1);
  expect(g.mountFinal).toBe(true);
  expect(['fixed', 'absolute']).not.toContain(g.mountPosition);
  expect(g.sendSame).toBe(true);
  expect(g.sendConnected).toBe(true);
  expect(g.hostButtonsVisible).toBe(true);
  expect(g.bodyOverflowX).toBeLessThanOrEqual(1);
  expect(g.events).toEqual(baselineEvents);
  expect(g.actions).toEqual({ toggle:0, menu:0 });
  expect(g.railConnected).toBe(true);
  await expect(page.locator(CLAUDE_MOUNT).getByRole('button', { name:'Toggle Ghost' })).toHaveCount(1);
  await expect(page.locator(CLAUDE_MOUNT).getByRole('button', { name:'Open Ghost menu' })).toHaveCount(1);
  await expect(page.locator('form[data-claude-composer="active"]').getByRole('button', { name:'Send Message', exact:true })).toHaveCount(1);
  const aria = await page.locator(CLAUDE_MOUNT).ariaSnapshot();
  expect(aria).toContain('button "Toggle Ghost"');
  expect(aria).toContain('button "Open Ghost menu"');
  return g;
}

async function cleanUnmount(page) {
  const result = await page.evaluate(() => window.__activeClaudeBlue.unmount());
  const snap = await snapshot(page);
  expect(result.status).toBe('unmounted');
  expect(snap.mountCount).toBe(0);
  expect(snap.mutationObserverConnected).toBe(false);
  expect(snap.resizeObserverConnected).toBe(false);
  expect(snap.pendingRepair).toBe(false);
  expect(snap.listenerCount).toBe(0);
  expect(snap.sendIdentityPreserved).toBe(true);
  expect(snap.sendConnected).toBe(true);
  return snap;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

test.describe('Round-6 XA4 cross-adapter mobile/accessibility/performance', () => {
  test('pins exact accepted ChatGPT mobile, Claude Blue, and XA3 Red-Team inputs', async () => {
    assertPinnedInputs();
  });

  test('Claude Pixel-class Chromium survives 320 CSS px, 200% text, reduced motion, native growth and orientation geometry', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'Pixel-class lane is hosted Chromium emulation only');
    const context = await browser.newContext({ ...devices['Pixel 7'], reducedMotion:'reduce' });
    const page = await context.newPage();
    try {
      await boot(page, 412, 915);
      await page.focus('[data-claude-editor="active"]');
      const baselineEvents = await page.evaluate(() => ({ ...window.__xa2Events }));
      expect((await mount(page)).status).toBe('structural');
      let g = await assertClaudeSemanticAndSafety(page, baselineEvents);
      expect(g.activeLabel).toBe('Message Claude');
      expect(g.reducedMotion).toBe(true);

      await page.setViewportSize({ width:320, height:780 });
      await page.evaluate(() => { document.body.style.fontSize = '200%'; });
      await deterministicVisualOnlySignal(page);
      await perturbNativeControls(page);
      g = await assertClaudeSemanticAndSafety(page, baselineEvents);
      expect(g.activeLabel).toBe('Message Claude');
      expect(parseFloat(g.fontSize)).toBeGreaterThanOrEqual(30);
      expect(g.viewportSignals.visualResize).toBeGreaterThanOrEqual(1);

      const resources = await snapshot(page);
      expect(resources.mountCount).toBe(1);
      expect(resources.mountIsFinalChild).toBe(true);
      expect(resources.listenerCount).toBe(2);
      expect(resources.mutationObserverConnected).toBe(true);
      expect(resources.resizeObserverConnected).toBe(true);
      expect(resources.pendingRepair).toBe(false);

      await page.setViewportSize({ width:780, height:320 });
      await page.waitForTimeout(40);
      g = await assertClaudeSemanticAndSafety(page, baselineEvents);
      expect(g.activeLabel).toBe('Message Claude');
      await page.setViewportSize({ width:320, height:780 });
      await page.waitForTimeout(40);
      g = await assertClaudeSemanticAndSafety(page, baselineEvents);
      expect(g.activeLabel).toBe('Message Claude');
      expect(g.viewport.width).toBe(320);
      expect(g.viewport.height).toBe(780);

      await cleanUnmount(page);
    } finally {
      await context.close();
    }
  });

  test('Claude desktop Firefox keeps the narrow semantic/focus/resource contract without GeckoView claims', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Portable desktop Firefox correctness lane only');
    await page.emulateMedia({ reducedMotion:'reduce' });
    await boot(page, 412, 915);
    await page.focus('[data-claude-editor="active"]');
    const baselineEvents = await page.evaluate(() => ({ ...window.__xa2Events }));
    expect((await mount(page)).status).toBe('structural');
    let g = await assertClaudeSemanticAndSafety(page, baselineEvents);
    expect(g.activeLabel).toBe('Message Claude');
    expect(g.reducedMotion).toBe(true);

    await page.setViewportSize({ width:320, height:780 });
    await page.evaluate(() => { document.body.style.fontSize = '200%'; });
    await deterministicVisualOnlySignal(page);
    await perturbNativeControls(page);
    g = await assertClaudeSemanticAndSafety(page, baselineEvents);
    expect(g.activeLabel).toBe('Message Claude');
    expect(parseFloat(g.fontSize)).toBeGreaterThanOrEqual(30);

    const resources = await snapshot(page);
    expect(resources.mountCount).toBe(1);
    expect(resources.listenerCount).toBe(2);
    expect(resources.pendingRepair).toBe(false);
    await cleanUnmount(page);
  });

  test('Claude narrow clipping pressure demotes to standard/rail rather than claiming inaccessible structural success', async ({ page }) => {
    await boot(page, 320, 780);
    const before = await page.evaluate(() => ({ ...window.__xa2Events }));
    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      row.style.width = '92px';
      row.style.overflow = 'hidden';
      row.style.flexWrap = 'nowrap';
      for (let i = 0; i < 5; i++) {
        const native = document.createElement('button');
        native.type = 'button';
        native.textContent = `N${i}`;
        row.insertBefore(native, window.__xa2Send);
      }
    });
    const result = await mount(page);
    const after = await page.evaluate(() => ({ events:{ ...window.__xa2Events }, mountCount:document.querySelectorAll('[data-gitl-mount="claude-blue-prototype"]').length, rail:!!document.querySelector('[data-fixture="existing-rail"]')?.isConnected }));
    expect(result).toMatchObject({ status:'demoted', reason:'send-clipped', runner:'standard-adapter-aware-structural-protocol', attemptedStructural:false });
    expect(after.mountCount).toBe(0);
    expect(after.rail).toBe(true);
    expect(after.events).toEqual(before);
  });

  test('Claude Chromium 1x/4x/6x CPU stress preserves bounded resources and Send invariants with descriptive timing only', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP CPU throttling is Chromium-only');
    const cdp = await context.newCDPSession(page);
    const report = [];
    try {
      for (const rate of [1, 4, 6]) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate });
        const samples = [];
        for (let i = 0; i < 4; i++) {
          await boot(page, 390, 780);
          const baselineEvents = await page.evaluate(() => ({ ...window.__xa2Events }));
          const t0 = Date.now();
          expect((await mount(page)).status).toBe('structural');
          await perturbNativeControls(page);
          samples.push(Date.now() - t0);
          await assertClaudeSemanticAndSafety(page, baselineEvents);
          const resources = await snapshot(page);
          expect(resources.mountCount).toBe(1);
          expect(resources.listenerCount).toBe(2);
          expect(resources.mutationObserverConnected).toBe(true);
          expect(resources.resizeObserverConnected).toBe(true);
          expect(resources.pendingRepair).toBe(false);
          expect(resources.sendIdentityPreserved).toBe(true);
          await cleanUnmount(page);
        }
        report.push({ cpuRate:rate, samplesMs:samples, medianMs:percentile(samples, 50), p95Ms:percentile(samples, 95) });
      }
    } finally {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate:1 }).catch(() => {});
      await cdp.detach().catch(() => {});
    }
    console.log(`[XA4_CLAUDE_DESCRIPTIVE_TIMING] ${JSON.stringify(report)}`);
    expect(report).toHaveLength(3);
    expect(report.every(r => r.samplesMs.length === 4)).toBe(true);
  });
});
