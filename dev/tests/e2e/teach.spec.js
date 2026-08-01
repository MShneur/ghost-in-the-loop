// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * TEACH MODE E2E (v8.6.0)
 *
 * On a site whose Send button Ghost can't auto-detect, the user arms Teach mode
 * and taps the real control once. These tests prove, in a real browser:
 *   1. arming Teach Send + tapping a real button captures it, and the taught
 *      tier resolves it without changing the adapter-button tier;
 *   2. the capture does NOT trigger the tapped control (preventDefault);
 *   3. tapping a popup-toggle (aria-haspopup) is vetoed — nothing is stored.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const EXPOSE = `
  window.__GITL_Teach = Teach;
  window.__GITL_Adapter = Adapter;
  window.__GITL_TeachStore = TeachStore;
  window.__GITL_ReviewedTaughtSend = _reviewedTaughtSend;
  window.__GITL_SelectSendMechanism = _selectSendMechanism;
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
`;

// A page whose send control is a plain <div> Ghost's reviewed selectors miss.
const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html>
<html><body><main>
  <div class="prose">A reply.</div>
  <footer>
    <textarea id="chat-box" placeholder="Message"></textarea>
    <div id="odd-send" role="button" aria-label="Send it">➤</div>
    <button id="plus-menu" aria-haspopup="menu" aria-label="Add">+</button>
  </footer>
</main></body></html>`)}`;

test.describe('Teach mode', () => {

  test('arming Teach Send captures a tier-four actuator without triggering it', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForTimeout(700);

    // Before teaching, the reviewed adapter can't authorise this odd send.
    const before = await page.evaluate(() => {
      const b = window.__GITL_Adapter.getSendBtn();
      return b ? b.id : null;
    });
    expect(before).toBeNull();

    const result = await page.evaluate(() => {
      let fired = false;
      const el = document.getElementById('odd-send');
      el.addEventListener('click', () => { fired = true; });
      window.__GITL_Teach.arm('send');
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      // a click would normally follow a tap — confirm the capture blocked it
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const adapterButton = window.__GITL_Adapter.getSendBtn();
      const taught = window.__GITL_ReviewedTaughtSend();
      const selected = window.__GITL_SelectSendMechanism(true, {
        reviewedButton: null,
        reviewedEnter: null,
        reviewedForm: null,
        taughtControl: taught ? { path: 'taught-control', run: () => taught.click() } : null
      });
      return {
        captured: window.__GITL_TeachStore.get('send'),
        adapterButtonId: adapterButton ? adapterButton.id : null,
        taughtId: taught ? taught.id : null,
        selectedPath: selected ? selected.path : null,
        controlFired: fired
      };
    });

    expect(result.captured).toBeTruthy();              // a selector was stored
    expect(result.adapterButtonId).toBeNull();         // adapter tier stays separate
    expect(result.taughtId).toBe('odd-send');          // taught tier resolves it
    expect(result.selectedPath).toBe('taught-control');// ladder can select tier four
    expect(result.controlFired).toBe(false);           // teaching never triggered the control
  });

  test('tapping a popup-toggle is vetoed — nothing is stored', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForTimeout(700);

    const result = await page.evaluate(() => {
      window.__GITL_Teach.arm('send');
      document.getElementById('plus-menu').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      return { captured: window.__GITL_TeachStore.get('send'), armed: window.__GITL_Teach.armed };
    });

    expect(result.captured).toBeNull();            // popup toggle rejected by the veto
    expect(result.armed).toBeNull();               // capture consumed (disarmed)
  });

  test('teaching the input captures a textarea and peekInput uses it', async ({ page }) => {
    await page.addInitScript(GM);
    await page.addInitScript(SCRIPT);
    await page.goto(PAGE);
    await page.waitForTimeout(700);

    const result = await page.evaluate(() => {
      window.__GITL_Teach.arm('input');
      document.getElementById('chat-box').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      const i = window.__GITL_Adapter.peekInput();
      return { captured: window.__GITL_TeachStore.get('input'), inputId: i ? i.id : null };
    });

    expect(result.captured).toBeTruthy();
    expect(result.inputId).toBe('chat-box');
  });
});
