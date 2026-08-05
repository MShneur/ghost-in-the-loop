// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { version: VERSION } = require('../../../package.json');

/**
 * Full Ghost UI smoke crawler.
 *
 * This file intentionally lives under tests/e2e/smoke/ so the production
 * userscript remains untouched. It boots the real root userscript against the
 * local mock chat, exercises the panel's tabs and interactive controls in
 * isolated pages, checks drag/collapse behavior, and repeats layout checks at
 * a phone-sized viewport. Failure artifacts include a screenshot, console
 * output, page errors, and the exact control/state that failed.
 */

const RAW = fs.readFileSync(
  path.join(__dirname, '../../../ghost-in-the-loop.user.js'),
  'utf8',
).replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const MOCK = 'file://' + path.join(__dirname, '../mock-chat.html');
const CONTROL_SELECTOR = [
  '#gitl button:visible',
  '#gitl [role="button"]:visible',
  '#gitl .g-tog:visible',
  '#gitl select:visible',
].join(', ');

function gmShim(store = {}) {
  return `
    window.__gmStore = ${JSON.stringify({ panelCollapsed: false, ...store })};
    window.__gitlExternalOpens = [];
    window.__gitlClipboard = '';
    window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
    window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
    window.GM_addStyle = (css) => {
      const s = document.createElement('style');
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    window.GM_setClipboard = (v) => { window.__gitlClipboard = String(v || ''); };
    window.GM_notification = () => {};
    window.open = (...args) => {
      window.__gitlExternalOpens.push(args.map(String));
      return { close() {}, focus() {} };
    };
    document.addEventListener('click', (event) => {
      const a = event.target && event.target.closest && event.target.closest('a[href]');
      if (a && !String(a.href || '').startsWith('file:')) event.preventDefault();
    }, true);
  `;
}

function slug(value) {
  return String(value || 'failure').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 90);
}

function monitor(page) {
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (message) => {
    consoleMessages.push(`[${message.type()}] ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error && (error.stack || error.message || error)));
  });
  page.on('dialog', async (dialog) => {
    try { await dialog.dismiss(); } catch (_) {}
  });
  page.on('download', async (download) => {
    try { await download.cancel(); } catch (_) {}
  });
  page.on('filechooser', async (chooser) => {
    try { await chooser.setFiles([]); } catch (_) {}
  });
  page.on('popup', async (popup) => {
    try { await popup.close(); } catch (_) {}
  });
  return { consoleMessages, pageErrors };
}

async function attachFailure(testInfo, page, label, evidence, extra = {}) {
  const base = slug(label);
  const screenshot = testInfo.outputPath(`${base}.png`);
  try {
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach(`${label} screenshot`, { path: screenshot, contentType: 'image/png' });
  } catch (_) {}
  await testInfo.attach(`${label} logs`, {
    body: Buffer.from(JSON.stringify({
      label,
      url: page.url(),
      console: evidence.consoleMessages,
      pageErrors: evidence.pageErrors,
      ...extra,
    }, null, 2)),
    contentType: 'application/json',
  });
}

async function boot(context, options = {}) {
  const page = await context.newPage();
  if (options.viewport) await page.setViewportSize(options.viewport);
  const evidence = monitor(page);
  await page.addInitScript(gmShim(options.store));
  await page.addInitScript(RAW);
  await page.goto(MOCK);
  const panel = page.locator('#gitl');
  await expect(panel).toBeVisible({ timeout: 5000 });
  await expect.poll(async () => page.locator('html').getAttribute('data-gitl-boot'))
    .toMatch(/^ok:/);
  return { page, panel, evidence };
}

async function visibleControls(page) {
  return page.locator(CONTROL_SELECTOR).evaluateAll((elements) => elements.map((el, index) => ({
    index,
    id: el.id || '',
    tag: el.tagName,
    type: el.getAttribute('type') || '',
    text: String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
    className: typeof el.className === 'string' ? el.className : '',
    disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true',
    value: 'value' in el ? String(el.value || '') : '',
    options: el.tagName === 'SELECT'
      ? Array.from(el.options).map((o) => ({ value: o.value, text: o.textContent || '' }))
      : [],
  })));
}

async function controlAt(page, descriptor) {
  if (descriptor.id) {
    const byId = page.locator('#' + descriptor.id);
    if (await byId.count()) return byId.first();
  }
  return page.locator(CONTROL_SELECTOR).nth(descriptor.index);
}

async function classifyActionability(locator, descriptor) {
  if (descriptor.disabled) {
    return { state: 'disabled', reason: 'native or aria disabled' };
  }
  if (/\bg-dim\b/.test(descriptor.className)) {
    return { state: 'dormant', reason: 'Ghost marks the control inactive with g-dim' };
  }

  const hit = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return { actionable: false, reason: 'zero-size' };
    const x = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
    const y = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
    const top = document.elementFromPoint(x, y);
    return {
      actionable: Boolean(top && (top === el || el.contains(top))),
      reason: top ? `${top.tagName.toLowerCase()}${top.id ? `#${top.id}` : ''}` : 'no-hit-target',
    };
  });

  if (!hit.actionable) {
    return { state: 'blocked', reason: `pointer target intercepted by ${hit.reason}` };
  }
  return { state: 'actionable', reason: 'visible, enabled, and receives pointer input' };
}

async function interact(locator, descriptor) {
  await locator.scrollIntoViewIfNeeded();
  const classification = await classifyActionability(locator, descriptor);
  if (classification.state === 'disabled' || classification.state === 'dormant') {
    return { classification, skipped: classification.state };
  }
  if (classification.state !== 'actionable') {
    throw new Error(`Control is ${classification.state}: ${classification.reason}`);
  }
  if (descriptor.tag === 'SELECT') {
    const next = descriptor.options.find((option) => option.value !== descriptor.value);
    if (!next) return { classification, skipped: 'single-option' };
    await locator.selectOption(next.value);
    return { classification, selected: next.value };
  }
  await locator.click({ timeout: 7000 });
  return { classification, clicked: true };
}

async function openTab(page, tabIndex) {
  const tabs = page.locator('#gitl .g-tab:visible');
  const count = await tabs.count();
  if (tabIndex < count) {
    await tabs.nth(tabIndex).click();
    await page.waitForTimeout(40);
  }
}

async function assertHealthy(page, evidence) {
  expect(evidence.pageErrors).toEqual([]);
  const fatal = evidence.consoleMessages.filter((line) => /\[GITL\].*FATAL/i.test(line));
  expect(fatal).toEqual([]);
  await expect(page.locator('#gitl')).toBeAttached();
  const beacon = await page.locator('html').getAttribute('data-gitl-boot');
  expect(beacon).toMatch(/^ok:/);
}

test.describe('Ghost complete UI smoke', () => {
  test.setTimeout(240_000);

  test('boots cleanly and collapse/expand remains reversible', async ({ context }, testInfo) => {
    const { page, panel, evidence } = await boot(context);
    try {
      const version = await page.locator('html').getAttribute('data-gitl-boot');
      expect(version).toBe(`ok:${VERSION}`);
      await expect(page.locator('#g-col')).toBeVisible();

      await page.locator('#g-col').click();
      await expect(panel).toHaveClass(/collapsed/);

      const collapseButton = page.locator('#g-col');
      if (await collapseButton.isVisible()) await collapseButton.click();
      else await panel.click({ position: { x: 20, y: 20 } });
      await expect(panel).not.toHaveClass(/collapsed/);

      await assertHealthy(page, evidence);
    } catch (error) {
      await attachFailure(testInfo, page, 'collapse-expand', evidence);
      throw error;
    } finally {
      await page.close();
    }
  });

  test('header drag handle moves the panel without losing it', async ({ context }, testInfo) => {
    const { page, panel, evidence } = await boot(context);
    try {
      const handle = page.locator('#gitl .g-hdr').first();
      await expect(handle).toBeVisible();
      const before = await panel.boundingBox();
      const box = await handle.boundingBox();
      expect(before).not.toBeNull();
      expect(box).not.toBeNull();

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 90, box.y + 70, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(80);

      const after = await panel.boundingBox();
      expect(after).not.toBeNull();
      expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
      await assertHealthy(page, evidence);
    } catch (error) {
      await attachFailure(testInfo, page, 'drag-handle', evidence);
      throw error;
    } finally {
      await page.close();
    }
  });

  test('every visible button, toggle, and menu on every tab survives one interaction', async ({ context }, testInfo) => {
    const discovery = await boot(context);
    const tabNames = await discovery.page.locator('#gitl .g-tab:visible').allTextContents();
    await discovery.page.close();

    const manifest = [];
    for (let tabIndex = 0; tabIndex < tabNames.length; tabIndex += 1) {
      const state = await boot(context);
      await openTab(state.page, tabIndex);
      const controls = await visibleControls(state.page);
      await state.page.close();

      for (const descriptor of controls) {
        if (/\bg-tab\b/.test(descriptor.className)) continue;
        const label = `${tabNames[tabIndex] || `tab-${tabIndex}`} :: ${descriptor.id || descriptor.text || `${descriptor.tag}-${descriptor.index}`}`;
        const run = await boot(context);
        try {
          await openTab(run.page, tabIndex);
          const locator = await controlAt(run.page, descriptor);
          await expect(locator).toBeVisible();
          const result = await interact(locator, descriptor);
          await run.page.waitForTimeout(80);
          await assertHealthy(run.page, run.evidence);
          manifest.push({ label, descriptor, result, ok: true });
        } catch (error) {
          manifest.push({ label, descriptor, ok: false, error: String(error) });
          await attachFailure(testInfo, run.page, label, run.evidence, { descriptor, tab: tabNames[tabIndex] });
          throw error;
        } finally {
          await run.page.close();
        }
      }
    }

    expect(manifest.length).toBeGreaterThan(10);
    await testInfo.attach('ui-control-manifest', {
      body: Buffer.from(JSON.stringify(manifest, null, 2)),
      contentType: 'application/json',
    });
  });

  test('advanced menus reveal usable controls without console or page failures', async ({ context }, testInfo) => {
    const expanders = ['exp-adv', 'cfg-adv'];
    for (const id of expanders) {
      const run = await boot(context);
      try {
        const target = run.page.locator(`#${id}`);
        if (!await target.count()) {
          const tabs = run.page.locator('#gitl .g-tab:visible');
          for (let index = 0; index < await tabs.count(); index += 1) {
            await tabs.nth(index).click();
            if (await run.page.locator(`#${id}`).count()) break;
          }
        }
        await expect(run.page.locator(`#${id}`)).toBeVisible();
        const before = await visibleControls(run.page);
        await run.page.locator(`#${id}`).click();
        await run.page.waitForTimeout(60);
        const after = await visibleControls(run.page);
        expect(after.length).toBeGreaterThan(before.length);
        await assertHealthy(run.page, run.evidence);
      } catch (error) {
        await attachFailure(testInfo, run.page, `advanced-${id}`, run.evidence);
        throw error;
      } finally {
        await run.page.close();
      }
    }
  });

  test('phone viewport has no horizontal panel overflow and controls still work', async ({ context }, testInfo) => {
    const viewport = { width: 390, height: 844 };
    const { page, panel, evidence } = await boot(context, { viewport });
    try {
      const layout = await panel.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
        };
      });
      expect(layout.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(layout.left).toBeGreaterThanOrEqual(-1);
      expect(layout.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);

      const tabs = page.locator('#gitl .g-tab:visible');
      expect(await tabs.count()).toBeGreaterThan(1);
      for (let index = 0; index < await tabs.count(); index += 1) {
        await tabs.nth(index).click();
        await page.waitForTimeout(25);
        await expect(panel).toBeVisible();
      }

      await page.locator('#g-col').click();
      await expect(panel).toHaveClass(/collapsed/);
      const collapseButton = page.locator('#g-col');
      if (await collapseButton.isVisible()) await collapseButton.click();
      else await panel.click({ position: { x: 18, y: 18 } });
      await expect(panel).not.toHaveClass(/collapsed/);
      await assertHealthy(page, evidence);
    } catch (error) {
      await attachFailure(testInfo, page, 'mobile-layout', evidence, { viewport });
      throw error;
    } finally {
      await page.close();
    }
  });
});
