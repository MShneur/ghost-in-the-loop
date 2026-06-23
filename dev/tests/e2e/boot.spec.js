// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * BOOT-TIMING E2E TESTS
 *
 * These reproduce the Replit-found bug: the userscript is injected via
 * addInitScript, which runs at document-start — BEFORE the HTML parser
 * builds <head> and <body>. Any top-level DOM mutation crashes here.
 *
 * Unit tests (jest + jsdom) cannot catch this: jsdom always has a body.
 * Only real browser injection timing exposes boot-order bugs.
 */

const SCRIPT_PATH = path.join(__dirname, '../../ghost-in-the-loop.user.js');
const MOCK_PAGE   = 'file://' + path.join(__dirname, 'mock-chat.html');

/* Strip the ==UserScript== header and the GM grants, then provide GM_* shims.
   We wrap in a function the page can call after we set up mocks. */
function buildInjectable() {
  const raw = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const noHeader = raw.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
  return noHeader;
}

test.describe('Ghost in the Loop — boot timing (document-start)', () => {

  test('script survives document-start injection without throwing', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    /* GM_* shims + the userscript, injected BEFORE document exists.
       This is the exact condition that crashed the old build.        */
    const gmShim = `
      window.__gmStore = {};
      window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
      window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
      window.GM_addStyle = (css) => {
        const s = document.createElement('style');
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      };
    `;
    await page.addInitScript(gmShim);
    await page.addInitScript(buildInjectable());

    await page.goto(MOCK_PAGE);
    await page.waitForTimeout(1500); // let safeBoot's rAF/DOMContentLoaded fire

    /* The killer assertion: no null-appendChild crash */
    const bootCrashes = pageErrors.filter(e =>
      /appendChild|null|head|body/i.test(e)
    );
    expect(bootCrashes, `Boot crashes detected:\n${bootCrashes.join('\n')}`).toHaveLength(0);
  });

  test('panel mounts to the DOM after boot', async ({ page }) => {
    await page.addInitScript(`
      window.__gmStore = {};
      window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
      window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
      window.GM_addStyle = (css) => {
        const s = document.createElement('style');
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      };
    `);
    await page.addInitScript(buildInjectable());
    await page.goto(MOCK_PAGE);

    /* The GITL panel should appear */
    await expect(page.locator('#gitl')).toBeAttached({ timeout: 5000 });
  });

  test('styles inject without crashing (head was null at start)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.addInitScript(`
      window.__gmStore = {};
      window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
      window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
      window.GM_addStyle = (css) => {
        const s = document.createElement('style');
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      };
    `);
    await page.addInitScript(buildInjectable());
    await page.goto(MOCK_PAGE);
    await page.waitForTimeout(1000);

    /* A style element with #gitl rules should now exist */
    const hasGitlStyles = await page.evaluate(() => {
      return [...document.querySelectorAll('style')].some(s =>
        s.textContent && s.textContent.includes('#gitl')
      );
    });
    expect(hasGitlStyles).toBe(true);
    expect(pageErrors.filter(e => /appendChild|null/i.test(e))).toHaveLength(0);
  });

  test('boot records a timeline event in GM storage', async ({ page }) => {
    await page.addInitScript(`
      window.__gmStore = {};
      window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
      window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
      window.GM_addStyle = (css) => {
        const s = document.createElement('style');
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
      };
    `);
    await page.addInitScript(buildInjectable());
    await page.goto(MOCK_PAGE);
    await page.waitForTimeout(1500);

    /* The boot event proves the script reached the end of safeBoot —
       i.e. it did NOT crash partway through (the original failure). */
    const timeline = await page.evaluate(() => window.__gmStore['gitlTimeline']);
    expect(timeline, 'gitlTimeline should be written after successful boot').toBeTruthy();
    const events = JSON.parse(timeline);
    expect(events.some(e => e.type === 'boot')).toBe(true);
  });

  test('DOM read: assistant message is findable', async ({ page }) => {
    await page.goto(MOCK_PAGE);
    const text = await page.locator('.message.assistant').textContent();
    expect(text).toBe('Test AI Message');
  });

});
