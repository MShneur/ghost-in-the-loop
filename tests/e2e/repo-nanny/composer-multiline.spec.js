// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Real-browser regression for current ChatGPT-style rich editors. The host
 * normalizes injected multiline text into block nodes before Ghost verifies
 * the composer. The visible prompt must still pass exact normalized staging
 * evidence and dispatch through one reviewed button.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const EXPOSE = `
  window.__GITL_TestSend = async text => {
    PLAT.reviewed = true;
    PLAT.input = ['#composer'];
    PLAT.send = ['#send'];
    PLAT.stop = ['#stop'];
    PLAT.assistant = ['#assistant'];
    PLAT.dispatchFallback = null;
    PLAT.useCE = true;
    PLAT.useNS = false;
    Object.assign(GHOST.loop, {
      state: 'RUNNING', phase: 'idle', isSending: false,
      sendPending: false, sendTxn: null, round: 0
    });
    claimTabLock();
    const pending = engineSend(text, true);
    setTimeout(() => {
      const observed = _sendEvidence();
      if (observed.confirmed) _confirmSend(observed.evidence);
    }, 800);
    return pending;
  };
  window.__GITL_TestState = () => ({
    round: GHOST.loop.round,
    path: GHOST.loop.sendTxn && GHOST.loop.sendTxn.path,
    pending: GHOST.loop.sendPending
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html><html><body>
  <main>
    <div id="assistant">Prior response.</div>
    <div id="composer" contenteditable="true"></div>
    <button id="send" aria-label="Send message">Send</button>
  </main>
</body></html>`)}`;

async function boot(page) {
  await page.addInitScript(GM);
  await page.addInitScript(SCRIPT);
  await page.goto(PAGE);
  await page.waitForTimeout(700);
}

test.describe('multiline rich-editor composer evidence', () => {
  test('block-normalized multiline text verifies and dispatches exactly once', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      window.__sendClicks = 0;
      const input = document.getElementById('composer');
      let normalized = false;
      input.addEventListener('input', () => {
        if (normalized) return;
        const visible = input.innerText || input.textContent || '';
        if (!visible.includes('Read the GitHub assignment.')) return;
        normalized = true;
        const first = document.createElement('p');
        first.textContent = 'Start the scheduled worker.';
        const second = document.createElement('p');
        second.textContent = 'Read the GitHub assignment.';
        input.replaceChildren(first, second);
      });
      document.getElementById('send').addEventListener('click', () => {
        window.__sendClicks += 1;
        input.replaceChildren();
        const stop = document.createElement('button');
        stop.id = 'stop';
        stop.textContent = 'Stop';
        document.body.appendChild(stop);
      });
    });

    const delivered = await page.evaluate(() => window.__GITL_TestSend(
      'Start the scheduled worker.\nRead the GitHub assignment.'
    ));
    const result = await page.evaluate(() => ({
      clicks: window.__sendClicks,
      state: window.__GITL_TestState(),
      report: window.__gmStore.lastDiagnostic || ''
    }));

    expect(delivered).toBe(true);
    expect(result.clicks).toBe(1);
    expect(result.state).toEqual({ round: 1, path: 'reviewed-button', pending: false });
    expect(result.report).not.toContain('COMPOSER-002');
  });
});
